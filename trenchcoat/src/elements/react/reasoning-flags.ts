import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcReasoningFlags, type ReasoningFlag, type ReasoningOpenChange, type ReasoningReconsiderDetail } from "../reasoning-flags";
import { h } from "./internal";

export type { ReasoningFlag, ReasoningFlagKind } from "../reasoning-flags";
export { REASONING_KINDS } from "../reasoning-flags";

const RawReasoningFlags = createComponent({
  tagName: "tc-reasoning-flags",
  elementClass: TcReasoningFlags,
  react: React,
  events: {
    onTcReconsider: "tc-reconsider" as EventName<CustomEvent<ReasoningReconsiderDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<ReasoningOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawReasoningFlags>;
type Wrapped = "onTcReconsider" | "onTcOpenChange" | "reconsider" | "noSummary" | "children";
export type ReasoningFlagsProps = Omit<RawProps, Wrapped> & {
  /** Shows "Ask the model to reconsider" in each card; called with the flag and its index in `flags` when pressed */
  onReconsider?: (flag: ReasoningFlag, index: number) => void;
  /** Show the summary chip ("2 reasoning flags") above the text (default true) */
  summary?: boolean;
  /** Called with the flag whose card opened, or null when it closed */
  onOpenChange?: (flag: ReasoningFlag | null, index: number) => void;
};

/** Inline markers for weak reasoning in an answer, each opening a plain explanation */
export function ReasoningFlags({ onReconsider, summary = true, onOpenChange, ...props }: ReasoningFlagsProps) {
  return h(RawReasoningFlags, {
    ...props,
    reconsider: !!onReconsider,
    noSummary: !summary,
    onTcReconsider: (e: CustomEvent<ReasoningReconsiderDetail>) => onReconsider?.(e.detail.flag, e.detail.index),
    onTcOpenChange: (e: CustomEvent<ReasoningOpenChange>) => onOpenChange?.(e.detail.flag, e.detail.index),
  });
}
