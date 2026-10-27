import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcThinkingState, type ThinkingSource as ThinkingSourceData, type ThinkingStep as ThinkingStepData } from "../thinking-state";
import { h, isNode, useControlled, useStaged } from "./internal";

/** A source: the icon may be a React node */
export type ThinkingSource = Omit<ThinkingSourceData, "icon"> & { icon?: React.ReactNode };
export type ThinkingStep =
  | (Omit<Extract<ThinkingStepData, { kind: "search" }>, "sources" | "moreSources"> & { sources: ThinkingSource[]; moreSources?: ThinkingSource[] })
  | Extract<ThinkingStepData, { kind: "step" }>;

const RawThinkingState = createComponent({
  tagName: "tc-thinking-state",
  elementClass: TcThinkingState,
  react: React,
  events: {
    onTcProgressChange: "tc-progress-change" as EventName<CustomEvent<{ progress: number }>>,
    onTcDone: "tc-done" as EventName<CustomEvent<{ seconds: number }>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
  },
});
type RawThinkingStateProps = React.ComponentProps<typeof RawThinkingState>;
export type ThinkingStateProps = Omit<RawThinkingStateProps, "steps" | "open" | "onTcProgressChange" | "onTcDone" | "onTcOpenChange"> & {
  /** The steps and searches to show, in order; a source's icon may be a React node */
  steps: ThinkingStep[];
  /** Reports each step the timeline reveals */
  onProgressChange?: (progress: number) => void;
  /** Called once it's finished – by the timeline or by `done` – with the seconds it worked */
  onDone?: (seconds: number) => void;
  /** Whether the steps are unfolded (controlled when defined) */
  open?: boolean;
  /** Whether the steps start unfolded when `open` isn't controlled */
  defaultOpen?: boolean;
  /** Called when the header is clicked, or a new run unfolds the steps, with the new state */
  onOpenChange?: (open: boolean) => void;
};

/** Every source icon that's a React node, keyed by step and position */
const iconNodes = (steps: ThinkingStep[]) =>
  steps.flatMap((s, i) =>
    s.kind === "search"
      ? [...s.sources.map((src, j) => [`${i}:${j}`, src.icon] as const), ...(s.moreSources ?? []).map((src, j) => [`${i}:m${j}`, src.icon] as const)].filter(([, icon]) => isNode(icon))
      : [],
  ) as [string, React.ReactNode][];

export function ThinkingState({ steps, onProgressChange, onDone, open, defaultOpen = true, onOpenChange, ...props }: ThinkingStateProps) {
  const { stage, els } = useStaged(iconNodes(steps));
  const data = React.useMemo(
    () =>
      steps.map((s, i): ThinkingStepData => {
        if (s.kind !== "search") return s;
        const map = (src: ThinkingSource, key: string): ThinkingSourceData => ({ ...src, icon: isNode(src.icon) ? els[key] : (src.icon as Element | undefined) });
        return { ...s, sources: s.sources.map((src, j) => map(src, `${i}:${j}`)), moreSources: s.moreSources?.map((src, j) => map(src, `${i}:m${j}`)) };
      }),
    [steps, els],
  );
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(React.Fragment, null, stage, h(RawThinkingState, {
    ...props,
    steps: data,
    open: o.value,
    onTcProgressChange: (e: CustomEvent<{ progress: number }>) => onProgressChange?.(e.detail.progress),
    onTcDone: (e: CustomEvent<{ seconds: number }>) => onDone?.(e.detail.seconds),
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
  }));
}
