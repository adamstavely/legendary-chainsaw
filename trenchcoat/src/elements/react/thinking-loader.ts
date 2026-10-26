import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcThinkingLoader, type ThinkingLoaderPhaseChange } from "../thinking-loader";
import { h } from "./internal";

const RawThinkingLoader = createComponent({
  tagName: "tc-thinking-loader",
  elementClass: TcThinkingLoader,
  react: React,
  events: { onTcPhaseChange: "tc-phase-change" as EventName<CustomEvent<ThinkingLoaderPhaseChange>> },
});
type RawThinkingLoaderProps = React.ComponentProps<typeof RawThinkingLoader>;
export type ThinkingLoaderProps = Omit<RawThinkingLoaderProps, "phase" | "manual" | "onTcPhaseChange"> & {
  /** Show a specific phase instead of advancing on a timer – e.g. from your stream events (controlled when defined) */
  phase?: number;
  /** The phase to start from when uncontrolled; the timer moves on from there */
  defaultPhase?: number;
  /** Reports each phase the timer moves to */
  onPhaseChange?: (phase: number) => void;
};
export function ThinkingLoader({ phase, defaultPhase = 0, onPhaseChange, ...props }: ThinkingLoaderProps) {
  // Uncontrolled: the element keeps the phase; the wrapper passes back the last one it reported, so a re-render
  // doesn't reset it
  const last = React.useRef(defaultPhase);
  const controlled = phase !== undefined;
  return h(RawThinkingLoader, {
    ...props,
    phase: controlled ? phase : last.current,
    manual: controlled,
    onTcPhaseChange: (e: CustomEvent<ThinkingLoaderPhaseChange>) => {
      if (controlled) return e.preventDefault();
      last.current = e.detail.phase;
      onPhaseChange?.(e.detail.phase);
    },
  });
}
