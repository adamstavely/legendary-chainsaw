import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAutonomyDial, type AgentAction as ElementAction, type AutonomyLevel } from "../autonomy-dial";
import { h, isNode, useStaged } from "./internal";

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the user's change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [own, setOwn] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else setOwn(next);
    onChange?.(next);
  };
  return { value: controlled ? value : own, handler };
}

export type { ActionRisk, AutonomyLevel } from "../autonomy-dial";
export { asksFirst } from "../autonomy-dial";
/** An action, its icon a React node */
export type AgentAction = Omit<ElementAction, "icon"> & { icon?: React.ReactNode };

const RawAutonomyDial = createComponent({
  tagName: "tc-autonomy-dial",
  elementClass: TcAutonomyDial,
  react: React,
  events: {
    onTcLevelChange: "tc-level-change" as EventName<CustomEvent<{ level: AutonomyLevel }>>,
    onTcPinnedChange: "tc-pinned-change" as EventName<CustomEvent<{ pinned: string[] }>>,
  },
});
type RawAutonomyDialProps = React.ComponentProps<typeof RawAutonomyDial>;
export type AutonomyDialProps = Omit<RawAutonomyDialProps, "actions" | "level" | "pinned" | "heading" | "onTcLevelChange" | "onTcPinnedChange"> & {
  actions: AgentAction[];
  /** 0 Ask every time · 1 Ask before risky actions · 2 Full auto. Controlled when defined */
  level?: AutonomyLevel;
  /** Starting level when `level` isn't controlled */
  defaultLevel?: AutonomyLevel;
  /** Called with the new level on every change, controlled or not */
  onLevelChange?: (level: AutonomyLevel) => void;
  /** Ids of actions that always ask, whatever the level. Controlled when defined */
  pinned?: string[];
  /** Starting pins when `pinned` isn't controlled */
  defaultPinned?: string[];
  /** Called with the new list of pinned ids on every change, controlled or not */
  onPinnedChange?: (pinned: string[]) => void;
  /** Heading, e.g. the agent's name */
  title?: string;
};
const NONE: string[] = [];
export function AutonomyDial({ actions, level, defaultLevel = 1, onLevelChange, pinned, defaultPinned = NONE, onPinnedChange, title = "Agent permissions", ...props }: AutonomyDialProps) {
  const { stage, els } = useStaged(actions.filter((a) => isNode(a.icon)).map((a) => [a.id, a.icon]));
  const acts = React.useMemo(() => actions.map((a) => (isNode(a.icon) ? { ...a, icon: els[a.id] } : a)) as ElementAction[], [actions, els]);
  const l = useOwned(level, defaultLevel, onLevelChange);
  const p = useOwned(pinned, defaultPinned, onPinnedChange);
  return h(React.Fragment, null, stage, h(RawAutonomyDial, {
    ...props,
    heading: title,
    actions: acts,
    level: l.value,
    pinned: p.value,
    onTcLevelChange: (e: CustomEvent<{ level: AutonomyLevel }>) => l.handler(e.detail.level, e),
    onTcPinnedChange: (e: CustomEvent<{ pinned: string[] }>) => p.handler(e.detail.pinned, e),
  }));
}
