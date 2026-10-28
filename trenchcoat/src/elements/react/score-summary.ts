import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScoreSummary, type ScoreSummaryScoreSelect } from "../score-summary";
import { h, useControlled } from "./internal";

export { defaultScoreSummaryLabels, percentsTo100, scoreCounts, summarizeScores } from "../score-summary";
export type { ScoreBand, ScoreBandKey, ScoreSummaryLabels, ScoreSummaryResult, ScoreTrendPoint } from "../score-summary";

const RawScoreSummary = createComponent({
  tagName: "tc-score-summary",
  elementClass: TcScoreSummary,
  react: React,
  events: {
    onTcScoreSelect: "tc-score-select" as EventName<CustomEvent<ScoreSummaryScoreSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawScoreSummary>;
type Owned = "heading" | "selected" | "onTcScoreSelect" | "children";

export type ScoreSummaryProps = Omit<RawProps, Owned> & {
  /** The heading – defaults to "Net Promoter Score" or "Customer satisfaction" */
  title?: string;
  /** The picked score – controlled when given (null for none) */
  selected?: number | null;
  /** The score picked on mount when `selected` isn't controlled */
  defaultSelected?: number | null;
  /** A score's bar was picked or cleared */
  onScoreSelect?: (score: number | null) => void;
};

export function ScoreSummary({ title = "", selected, defaultSelected = null, onScoreSelect, ...props }: ScoreSummaryProps) {
  const s = useControlled<number | null>(selected, defaultSelected, onScoreSelect);
  return h(RawScoreSummary, {
    ...props,
    heading: title,
    selected: s.value,
    onTcScoreSelect: (e: CustomEvent<ScoreSummaryScoreSelect>) => s.handler(e.detail.score, e),
  });
}
