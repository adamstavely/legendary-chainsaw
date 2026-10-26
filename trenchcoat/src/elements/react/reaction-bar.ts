import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcReactionBar, type ReactionChange, type ReactionKey, type ReactionState } from "../reaction-bar";
import { h } from "./internal";

export type { ReactionKey, ReactionState } from "../reaction-bar";

const RawReactionBar = createComponent({
  tagName: "tc-reaction-bar",
  elementClass: TcReactionBar,
  react: React,
  events: { onTcReactionChange: "tc-reaction-change" as EventName<CustomEvent<ReactionChange>> },
});
type RawReactionBarProps = React.ComponentProps<typeof RawReactionBar>;
export type ReactionBarProps = Omit<RawReactionBarProps, "reactions" | "actions" | "onTcReactionChange"> & {
  /**
   * Counts and whether each action is already taken. The bar follows this prop: a tap changes an action locally
   * until the prop's value for that action changes, which then wins. To own the state, update it from `onReact`.
   */
  reactions?: Partial<Record<ReactionKey, ReactionState>>;
  /** Called after an action was toggled, with its new state */
  onReact?: (key: ReactionKey, state: Required<ReactionState>) => void;
  /** Hide actions you don't need – the list may change after mount */
  actions?: ReactionKey[];
};
const NO_REACTIONS: Partial<Record<ReactionKey, ReactionState>> = {};
const ALL_ACTIONS: ReactionKey[] = ["like", "comment", "repost", "share"];
export function ReactionBar({ reactions = NO_REACTIONS, onReact, actions = ALL_ACTIONS, ...props }: ReactionBarProps) {
  return h(RawReactionBar, {
    ...props,
    reactions,
    actions,
    onTcReactionChange: (e: CustomEvent<ReactionChange>) => onReact?.(e.detail.key, e.detail.state),
  });
}
