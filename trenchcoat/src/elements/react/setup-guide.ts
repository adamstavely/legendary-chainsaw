import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSetupGuide, setupGuideFlagKey, type SetupGroup, type SetupGuideDoneChange, type SetupGuideMinimizedChange, type SetupGuideOpenGroupChange } from "../setup-guide";
import { h } from "./internal";

export type { SetupGroup, SetupTask } from "../setup-guide";

const RawSetupGuide = createComponent({
  tagName: "tc-setup-guide",
  elementClass: TcSetupGuide,
  react: React,
  events: {
    onTcDoneChange: "tc-done-change" as EventName<CustomEvent<SetupGuideDoneChange>>,
    onTcOpenGroupChange: "tc-open-group-change" as EventName<CustomEvent<SetupGuideOpenGroupChange>>,
    onTcMinimizedChange: "tc-minimized-change" as EventName<CustomEvent<SetupGuideMinimizedChange>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<null>>,
    onTcClose: "tc-close" as EventName<CustomEvent<null>>,
  },
});
type RawSetupGuideProps = React.ComponentProps<typeof RawSetupGuide>;
type Wrapped = "heading" | "groups" | "done" | "openGroup" | "minimized" | "editable" | "closable" | "onChange" | `onTc${string}`;
export type SetupGuideProps = Omit<RawSetupGuideProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** The task groups. Each task's `done` flag is where it starts; when the flags change, the guide follows them */
  groups: SetupGroup[];
  /** Ids of the finished tasks. Controlled when defined – pair it with `onDoneChange` */
  done?: string[];
  /** Ids finished on mount when `done` isn't controlled – defaults to the tasks marked `done` */
  defaultDone?: string[];
  /** Called with the ids of all finished tasks whenever a task is ticked or cleared */
  onDoneChange?: (done: string[]) => void;
  /** @deprecated Use `onDoneChange` – same arguments. Kept for one release */
  onChange?: (done: string[]) => void;
  /** Id of the unfolded group, `null` for none. Controlled when defined – pair it with `onOpenGroupChange` */
  openGroup?: string | null;
  /** Group unfolded on mount when `openGroup` isn't controlled – defaults to the first unfinished group */
  defaultOpenGroup?: string | null;
  /** Called when a group unfolds or folds – also when a finished group folds away on its own */
  onOpenGroupChange?: (id: string | null) => void;
  /** Whether the body is collapsed to the header. Controlled when defined – pair it with `onMinimizedChange` */
  minimized?: boolean;
  defaultMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  /** Shows an "Edit" link in the header */
  onEdit?: () => void;
  /** Shows a close button in the header */
  onClose?: () => void;
};

export function SetupGuide({
  title = "Setup guide",
  groups,
  done,
  defaultDone,
  onDoneChange,
  onChange,
  openGroup,
  defaultOpenGroup,
  onOpenGroupChange,
  minimized,
  defaultMinimized = false,
  onMinimizedChange,
  onEdit,
  onClose,
  ...props
}: SetupGuideProps) {
  // Uncontrolled values stay with the element; the wrapper passes back the last ones it reported, so a re-render
  // doesn't reset them. Own ticks are kept with the task flags they were made on – new flags win (as in the element)
  const flags = setupGuideFlagKey(groups);
  const [own, setOwn] = React.useState({ base: flags, ids: defaultDone });
  const ownDone = own.base === flags ? own.ids : undefined;
  const [firstOpen] = React.useState(() => {
    const finished = new Set(done ?? defaultDone ?? groups.flatMap((g) => g.tasks).filter((t) => t.done).map((t) => t.id));
    return defaultOpenGroup !== undefined ? defaultOpenGroup : (groups.find((g) => g.tasks.some((t) => !finished.has(t.id)))?.id ?? null);
  });
  const lastOpen = React.useRef(firstOpen);
  const lastMinimized = React.useRef(defaultMinimized);
  return h(RawSetupGuide, {
    ...props,
    heading: title,
    groups,
    done: done ?? ownDone,
    openGroup: openGroup !== undefined ? openGroup : lastOpen.current,
    minimized: minimized ?? lastMinimized.current,
    editable: !!onEdit,
    closable: !!onClose,
    onTcDoneChange: (e: CustomEvent<SetupGuideDoneChange>) => {
      if (done !== undefined) e.preventDefault();
      else setOwn({ base: flags, ids: e.detail.done });
      onDoneChange?.(e.detail.done);
      onChange?.(e.detail.done);
    },
    onTcOpenGroupChange: (e: CustomEvent<SetupGuideOpenGroupChange>) => {
      if (openGroup !== undefined) e.preventDefault();
      else lastOpen.current = e.detail.openGroup;
      onOpenGroupChange?.(e.detail.openGroup);
    },
    onTcMinimizedChange: (e: CustomEvent<SetupGuideMinimizedChange>) => {
      if (minimized !== undefined) e.preventDefault();
      else lastMinimized.current = e.detail.minimized;
      onMinimizedChange?.(e.detail.minimized);
    },
    onTcEdit: onEdit ? () => onEdit() : undefined,
    onTcClose: onClose ? () => onClose() : undefined,
  });
}
