import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSkillDetail, type SkillDetailEnabledChange, type SkillDetailFileChange, type SkillDetailRemove, type SkillDetailUpdate } from "../skill-detail";
import { h, useControlled } from "./internal";

export type {
  SkillDetailEnabledChange,
  SkillDetailFile,
  SkillDetailFileChange,
  SkillDetailLabels,
  SkillDetailRemove,
  SkillDetailRun,
  SkillDetailTool,
  SkillDetailUpdate,
  SkillPermission,
  SkillRunOutcome,
} from "../skill-detail";
export { defaultSkillDetailLabels, skillRisks } from "../skill-detail";

const RawSkillDetail = createComponent({
  tagName: "tc-skill-detail",
  elementClass: TcSkillDetail,
  react: React,
  events: {
    onTcEnabledChange: "tc-enabled-change" as EventName<CustomEvent<SkillDetailEnabledChange>>,
    onTcFileChange: "tc-file-change" as EventName<CustomEvent<SkillDetailFileChange>>,
    onTcUpdate: "tc-update" as EventName<CustomEvent<SkillDetailUpdate>>,
    onTcExport: "tc-export" as EventName<CustomEvent<Record<string, never>>>,
    onTcRemove: "tc-remove" as EventName<CustomEvent<SkillDetailRemove>>,
  },
});

type Owned = "heading" | "enabled" | "file" | "onTcEnabledChange" | "onTcFileChange" | "onTcUpdate" | "onTcExport" | "onTcRemove" | "children";
export type SkillDetailProps = Omit<React.ComponentProps<typeof RawSkillDetail>, Owned> & {
  /** The skill's name, shown as the heading */
  title?: string;
  /** It's on – controlled when given */
  enabled?: boolean;
  /** Whether it's on at mount, when `enabled` isn't controlled */
  defaultEnabled?: boolean;
  /** Called when it's turned on (after a risky skill's Turn on) or off */
  onEnabledChange?: (enabled: boolean) => void;
  /** The file shown, or null for the first – controlled when given */
  file?: string | null;
  /** The file shown at mount, when `file` isn't controlled */
  defaultFile?: string | null;
  /** Called with the path of the file picked */
  onFileChange?: (file: string) => void;
  /** Update was pressed: install `version` */
  onUpdate?: (version: string) => void;
  /** Export was pressed */
  onExport?: () => void;
  /** Remove was confirmed: remove it; return false to skip the announcement */
  onRemove?: (name: string, usedBy: string[]) => boolean | void;
};

export function SkillDetail({ title, enabled, defaultEnabled = false, onEnabledChange, file, defaultFile = null, onFileChange, onUpdate, onExport, onRemove, ...props }: SkillDetailProps) {
  const en = useControlled(enabled, defaultEnabled, onEnabledChange);
  const f = useControlled<string | null>(file, defaultFile, onFileChange ? (next) => next !== null && onFileChange(next) : undefined);
  return h(RawSkillDetail, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    enabled: en.value,
    file: f.value,
    onTcEnabledChange: (e: CustomEvent<SkillDetailEnabledChange>) => en.handler(e.detail.enabled, e),
    onTcFileChange: (e: CustomEvent<SkillDetailFileChange>) => f.handler(e.detail.file, e),
    onTcUpdate: (e: CustomEvent<SkillDetailUpdate>) => onUpdate?.(e.detail.version),
    onTcExport: () => onExport?.(),
    onTcRemove: (e: CustomEvent<SkillDetailRemove>) => {
      if (onRemove?.(e.detail.name, e.detail.usedBy) === false) e.preventDefault();
    },
  });
}
