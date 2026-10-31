import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTeamFlagEditor, type TeamFlag, type TeamFlagsChange } from "../team-flag-editor";
import { h, useControlled } from "./internal";

export type { TeamFlagEditorLabels, TeamFlagsChange, TeamFlagsChangeKind } from "../team-flag-editor";
export { defaultTeamFlagEditorLabels, defaultTeamFlagPalette } from "../team-flag-editor";

const RawTeamFlagEditor = createComponent({
  tagName: "tc-team-flag-editor",
  elementClass: TcTeamFlagEditor,
  react: React,
  events: {
    onTcFlagsChange: "tc-flags-change" as EventName<CustomEvent<TeamFlagsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTeamFlagEditor>;
type Owned = "heading" | "flags" | "onTcFlagsChange" | "children";
export type TeamFlagEditorProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Team flags" */
  title?: string;
  /** The team's flags – controlled when given */
  flags?: TeamFlag[];
  /** The flags on mount when `flags` isn't controlled */
  defaultFlags?: TeamFlag[];
  /** A flag was added, edited, removed or moved */
  onFlagsChange?: (flags: TeamFlag[], detail: TeamFlagsChange) => void;
};

const NONE: TeamFlag[] = [];

export function TeamFlagEditor({ title, flags, defaultFlags = NONE, onFlagsChange, ...props }: TeamFlagEditorProps) {
  const f = useControlled<TeamFlag[]>(flags, defaultFlags, undefined);
  return h(RawTeamFlagEditor, {
    ...props,
    heading: title ?? "Team flags",
    flags: f.value,
    onTcFlagsChange: (e: CustomEvent<TeamFlagsChange>) => {
      f.handler(e.detail.flags, e);
      onFlagsChange?.(e.detail.flags, e.detail);
    },
  });
}
