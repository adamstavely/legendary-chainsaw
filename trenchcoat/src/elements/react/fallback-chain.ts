import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFallbackChain, type FallbackAttempt, type FallbackSelectedChange } from "../fallback-chain";
import { h, useControlled } from "./internal";

export type { FallbackAttempt, FallbackChainLabels, FallbackSelectedChange, FallbackState } from "../fallback-chain";
export { defaultFallbackChainLabels } from "../fallback-chain";

const RawFallbackChain = createComponent({
  tagName: "tc-fallback-chain",
  elementClass: TcFallbackChain,
  react: React,
  events: { onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<FallbackSelectedChange>> },
});
type RawProps = React.ComponentProps<typeof RawFallbackChain>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type FallbackChainProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Fallback chain" */
  title?: string;
  /** The open model's id – controlled when given */
  selected?: string | null;
  /** The open model on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A model was opened or closed */
  onSelectedChange?: (selected: string | null, attempt: FallbackAttempt | null) => void;
};

export function FallbackChain({ title, selected, defaultSelected = null, onSelectedChange, ...props }: FallbackChainProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawFallbackChain, {
    ...props,
    heading: title ?? "Fallback chain",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<FallbackSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.attempt);
    },
  });
}
