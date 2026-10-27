import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcPlaybookCanvas,
  type Playbook,
  type PlaybookDryRunRequest,
  type PlaybookSelectedChange,
  type PlaybookStepType,
  type PlaybookValueChange,
  type PlaybookVersionOpen,
} from "../playbook-canvas";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { Playbook, PlaybookDryRun, PlaybookDryRunOutcome, PlaybookFailure, PlaybookPhase, PlaybookStep, PlaybookVersion } from "../playbook-canvas";
export { PLAYBOOK_PHASES, PLAYBOOK_STEP_TYPES } from "../playbook-canvas";

/** React nodes in place of elements: step type icons */
export type PlaybookStepTypeNode = Omit<PlaybookStepType, "icon"> & { icon?: React.ReactNode };
export type { PlaybookStepTypeNode as PlaybookStepType };

const RawPlaybookCanvas = createComponent({
  tagName: "tc-playbook-canvas",
  elementClass: TcPlaybookCanvas,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<PlaybookValueChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<PlaybookSelectedChange>>,
    onTcDryRun: "tc-dry-run" as EventName<CustomEvent<PlaybookDryRunRequest>>,
    onTcDryRunClear: "tc-dry-run-clear" as EventName<CustomEvent<Record<string, never>>>,
    onTcVersionOpen: "tc-version-open" as EventName<CustomEvent<PlaybookVersionOpen>>,
  },
});

type RawProps = React.ComponentProps<typeof RawPlaybookCanvas>;
export type PlaybookCanvasProps = Omit<
  RawProps,
  "value" | "defaultValue" | "selected" | "stepTypes" | "heading" | "onChange" | "onTcValueChange" | "onTcSelectedChange" | "onTcDryRun" | "onTcDryRunClear" | "onTcVersionOpen"
> & {
  /** Shown at the top; names the playbook */
  title?: string;
  /** The kinds of step people can add; icons may be React nodes */
  stepTypes?: PlaybookStepTypeNode[];
  /** The playbook (controlled) */
  value?: Playbook;
  /** The playbook to start with when uncontrolled */
  defaultValue?: Playbook;
  /** Called with the whole playbook after every add, remove, move or edit */
  onChange?: (value: Playbook) => void;
  /** The id of the step being set up (controlled); null for none */
  selected?: string | null;
  /** The step to start with when uncontrolled */
  defaultSelected?: string | null;
  /** Called when a step is picked, or the pick cleared */
  onSelectedChange?: (selected: string | null) => void;
  /** "Dry run" was pressed – answer by setting `dryRun` */
  onDryRun?: (value: Playbook) => void;
  /** The dry run's result was cleared – set `dryRun` to null */
  onDryRunClear?: () => void;
  /** "Open" was pressed on a version that isn't current */
  onVersionOpen?: (id: string) => void;
};

const EMPTY: Playbook = { steps: [] };

export function PlaybookCanvas({
  title,
  stepTypes,
  value,
  defaultValue = EMPTY,
  onChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onDryRun,
  onDryRunClear,
  onVersionOpen,
  ...props
}: PlaybookCanvasProps) {
  const { stage, els } = useStaged((stepTypes ?? []).filter((t) => isNode(t.icon)).map((t) => [t.id, t.icon]));
  const types = React.useMemo(() => stepTypes?.map((t) => (isNode(t.icon) ? { ...t, icon: els[t.id] } : t)) as PlaybookStepType[] | undefined, [stepTypes, els]);
  const v = useControlled(value, defaultValue, onChange);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange);
  return h(React.Fragment, null, stage, h(RawPlaybookCanvas, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    ...(types ? { stepTypes: types } : {}),
    value: v.value,
    selected: s.value,
    onTcValueChange: (e: CustomEvent<PlaybookValueChange>) => v.handler(e.detail.value, e),
    onTcSelectedChange: (e: CustomEvent<PlaybookSelectedChange>) => s.handler(e.detail.selected, e),
    onTcDryRun: (e: CustomEvent<PlaybookDryRunRequest>) => onDryRun?.(e.detail.value),
    onTcDryRunClear: () => onDryRunClear?.(),
    onTcVersionOpen: (e: CustomEvent<PlaybookVersionOpen>) => onVersionOpen?.(e.detail.id),
  }));
}
