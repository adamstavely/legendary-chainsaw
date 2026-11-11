import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcIconSwap, type IconSwapStateChange } from "../icon-swap";
import { h, useControlled } from "./internal";

export type { IconSwapStateChange } from "../icon-swap";

const RawIconSwap = createComponent({
  tagName: "tc-icon-swap",
  elementClass: TcIconSwap,
  react: React,
  events: { onTcStateChange: "tc-state-change" as EventName<CustomEvent<IconSwapStateChange>> },
});
type RawIconSwapProps = React.ComponentProps<typeof RawIconSwap>;

export type IconSwapProps = Omit<RawIconSwapProps, "state" | "onTcStateChange"> & {
  /** The icon to show, by its data-state – controlled when given */
  state?: string;
  /** The state to start in, uncontrolled */
  defaultState?: string;
  /** The element is going back to its resting state after `revertAfter` */
  onStateChange?: (state: string) => void;
};

/** One icon turning into the next, by `state`. Give each child icon a `data-state` (and a `data-label`). The ref receives the element */
export function IconSwap({ state, defaultState, onStateChange, ...props }: IconSwapProps) {
  const s = useControlled<string | undefined>(state, defaultState, onStateChange as ((next: string | undefined) => void) | undefined, { ownEvents: true });
  return h(RawIconSwap, { ...props, state: s.value, onTcStateChange: (e: CustomEvent<IconSwapStateChange>) => s.handler(e.detail.state, e) } as RawIconSwapProps);
}
