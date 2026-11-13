import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcReviewQueue, type ReviewQueueItem, type ReviewQueueGrade, type ReviewQueueIndexChange, type ReviewQueueResultsChange, type ReviewQueueResult } from "../review-queue";
import { h, useControlled } from "./internal";

export { REVIEW_CRITERIA, suggestVerdict } from "../review-queue";
export type { ReviewQueueCriterion, ReviewQueueGradeValue, ReviewQueueItem, ReviewQueueGrade, ReviewQueueResult, ReviewQueueVerdict } from "../review-queue";

const RawReviewQueue = createComponent({
  tagName: "tc-review-queue",
  elementClass: TcReviewQueue,
  react: React,
  events: {
    onTcGrade: "tc-grade" as EventName<CustomEvent<ReviewQueueGrade>>,
    onTcSkip: "tc-skip" as EventName<CustomEvent<{ id: string }>>,
    onTcUndo: "tc-undo" as EventName<CustomEvent<{ id: string }>>,
    onTcIndexChange: "tc-index-change" as EventName<CustomEvent<ReviewQueueIndexChange>>,
    onTcResultsChange: "tc-results-change" as EventName<CustomEvent<ReviewQueueResultsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawReviewQueue>;

export type ReviewQueueProps = Omit<RawProps, "heading" | "index" | "results" | "onTcGrade" | "onTcSkip" | "onTcUndo" | "onTcIndexChange" | "onTcResultsChange"> & {
  /** The heading – defaults to "Review queue" */
  title?: string;
  /** The item showing. Controlled when defined */
  index?: number;
  /** On mount, when `index` isn't controlled */
  defaultIndex?: number;
  /** Called with the next `index` */
  onIndexChange?: (index: number, item: ReviewQueueItem | undefined) => void;
  /** Where each item stands, by id. Controlled when defined */
  results?: Record<string, ReviewQueueResult>;
  /** On mount, when `results` isn't controlled */
  defaultResults?: Record<string, ReviewQueueResult>;
  /** Called with the next `results` */
  onResultsChange?: (results: Record<string, ReviewQueueResult>) => void;
  /** Called when an item is submitted. Return false to keep it open */
  onGrade?: (grade: ReviewQueueGrade) => void | boolean;
  /** Called when an item is skipped. Return false to stay on it */
  onSkip?: (id: string) => void | boolean;
  /** Called when the last submit is undone. Return false to keep it */
  onUndo?: (id: string) => void | boolean;
};

const NO_RESULTS: Record<string, ReviewQueueResult> = {};

export function ReviewQueue({ title = "Review queue", index, defaultIndex = 0, onIndexChange, results, defaultResults = NO_RESULTS, onResultsChange, onGrade, onSkip, onUndo, ...props }: ReviewQueueProps) {
  const at = useControlled<number>(index, defaultIndex, undefined);
  const r = useControlled<Record<string, ReviewQueueResult>>(results, defaultResults, onResultsChange);
  return h(RawReviewQueue, {
    ...props,
    heading: title,
    index: at.value,
    results: r.value,
    onTcIndexChange: (e: CustomEvent<ReviewQueueIndexChange>) => {
      at.handler(e.detail.index, e);
      onIndexChange?.(e.detail.index, e.detail.item);
    },
    onTcResultsChange: (e: CustomEvent<ReviewQueueResultsChange>) => r.handler(e.detail.results, e),
    onTcGrade: (e: CustomEvent<ReviewQueueGrade>) => {
      if (onGrade?.(e.detail) === false) e.preventDefault();
    },
    onTcSkip: (e: CustomEvent<{ id: string }>) => {
      if (onSkip?.(e.detail.id) === false) e.preventDefault();
    },
    onTcUndo: (e: CustomEvent<{ id: string }>) => {
      if (onUndo?.(e.detail.id) === false) e.preventDefault();
    },
  });
}
