import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScoreRing, type ScoreRingSubscore, type ScoreRingSubscoreChange } from "../score-ring";
import { h, useControlled } from "./internal";

export type { ScoreRingBand, ScoreRingMetric, ScoreRingSubscore, ScoreRingTone } from "../score-ring";
export { defaultScoreRingBands } from "../score-ring";

const RawScoreRing = createComponent({
  tagName: "tc-score-ring",
  elementClass: TcScoreRing,
  react: React,
  events: {
    onTcSubscoreChange: "tc-subscore-change" as EventName<CustomEvent<ScoreRingSubscoreChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawScoreRing>;
type Owned = "heading" | "subscore" | "onTcSubscoreChange" | "children";
export type ScoreRingProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The selected sub-score's id – controlled when given (null for none) */
  subscore?: string | null;
  /** The sub-score selected on mount when `subscore` isn't controlled */
  defaultSubscore?: string | null;
  /** A sub-score was selected or cleared */
  onSubscoreChange?: (subscore: string | null, item?: ScoreRingSubscore) => void;
};

export function ScoreRing({ title, subscore, defaultSubscore = null, onSubscoreChange, ...props }: ScoreRingProps) {
  const item = React.useRef<ScoreRingSubscore | undefined>(undefined);
  const report = React.useCallback((next: string | null) => onSubscoreChange?.(next, item.current), [onSubscoreChange]);
  const s = useControlled<string | null>(subscore, defaultSubscore, onSubscoreChange ? report : undefined);
  return h(RawScoreRing, {
    ...props,
    heading: title ?? "Score",
    subscore: s.value,
    onTcSubscoreChange: (e: CustomEvent<ScoreRingSubscoreChange>) => {
      item.current = e.detail.item;
      s.handler(e.detail.subscore, e);
    },
  });
}
