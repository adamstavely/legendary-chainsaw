import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcEvalScorecard,
  type EvalScorecardBaselineChange,
  type EvalScorecardCaseOpen,
  type EvalScorecardOpen,
  type EvalScorecardOpenChange,
  type EvalScorecardShow,
  type EvalScorecardShowChange,
  type EvalScorecardTagsChange,
} from "../eval-scorecard";
import { h, useControlled } from "./internal";

export { evalBaselineRun, evalDeltaText, evalRegressed, evalRunDelta, evalStats } from "../eval-scorecard";
export type {
  EvalCase,
  EvalOutcome,
  EvalResult,
  EvalRun,
  EvalRunDelta,
  EvalScorecardBaselineChange,
  EvalScorecardCaseOpen,
  EvalScorecardOpen,
  EvalScorecardShow,
  EvalVersion,
  EvalVersionStats,
} from "../eval-scorecard";

const RawEvalScorecard = createComponent({
  tagName: "tc-eval-scorecard",
  elementClass: TcEvalScorecard,
  react: React,
  events: {
    onTcTagsChange: "tc-tags-change" as EventName<CustomEvent<EvalScorecardTagsChange>>,
    onTcShowChange: "tc-show-change" as EventName<CustomEvent<EvalScorecardShowChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<EvalScorecardOpenChange>>,
    onTcBaselineChange: "tc-baseline-change" as EventName<CustomEvent<EvalScorecardBaselineChange>>,
    onTcCaseOpen: "tc-case-open" as EventName<CustomEvent<EvalScorecardCaseOpen>>,
  },
});
type RawEvalScorecardProps = React.ComponentProps<typeof RawEvalScorecard>;

export type EvalScorecardProps = Omit<
  RawEvalScorecardProps,
  "heading" | "tags" | "show" | "open" | "baseline" | "onTcTagsChange" | "onTcShowChange" | "onTcOpenChange" | "onTcBaselineChange" | "onTcCaseOpen"
> & {
  /** The heading – the eval set's name */
  title?: string;
  /** The picked tags. Controlled when defined; otherwise the component keeps them, starting from `defaultTags` */
  tags?: string[];
  /** The tags picked at first when `tags` isn't controlled */
  defaultTags?: string[];
  /** Called with the picked tags after a tag is toggled or cleared, controlled or not */
  onTagsChange?: (tags: string[]) => void;
  /** Which cases show – "all", "failing" or "regressed". Controlled when defined */
  show?: EvalScorecardShow;
  /** Which cases show at first when `show` isn't controlled */
  defaultShow?: EvalScorecardShow;
  /** Called with the outcome filter the user picked, controlled or not */
  onShowChange?: (show: EvalScorecardShow) => void;
  /** The open case and version, or null. Controlled when defined */
  open?: EvalScorecardOpen | null;
  /** The case open at first when `open` isn't controlled */
  defaultOpen?: EvalScorecardOpen | null;
  /** Called when a case is opened, switched to another version or closed, controlled or not */
  onOpenChange?: (open: EvalScorecardOpen | null) => void;
  /** The id of the run the others are compared with, or null for the run marked `baseline`. Controlled when defined */
  baseline?: string | null;
  /** The baseline at first when `baseline` isn't controlled */
  defaultBaseline?: string | null;
  /** Called with the run's id when Set as baseline is pressed, controlled or not */
  onBaselineChange?: (baseline: string) => void;
  /** Called when a regression in the run history is picked; return false to keep the case from opening */
  onCaseOpen?: (caseId: string, runId: string) => boolean | void;
};

const NO_TAGS: string[] = [];

export function EvalScorecard({
  title = "Evals",
  tags,
  defaultTags = NO_TAGS,
  onTagsChange,
  show,
  defaultShow = "all",
  onShowChange,
  open,
  defaultOpen = null,
  onOpenChange,
  baseline,
  defaultBaseline = null,
  onBaselineChange,
  onCaseOpen,
  ...props
}: EvalScorecardProps) {
  const t = useControlled<string[]>(tags, defaultTags, onTagsChange);
  const s = useControlled<EvalScorecardShow>(show, defaultShow, onShowChange);
  const o = useControlled<EvalScorecardOpen | null>(open, defaultOpen, onOpenChange);
  const b = useControlled<string | null>(baseline, defaultBaseline, onBaselineChange ? (next) => next !== null && onBaselineChange(next) : undefined);
  return h(RawEvalScorecard, {
    ...props,
    heading: title,
    tags: t.value,
    show: s.value,
    open: o.value,
    onTcTagsChange: (e: CustomEvent<EvalScorecardTagsChange>) => t.handler(e.detail.tags, e),
    onTcShowChange: (e: CustomEvent<EvalScorecardShowChange>) => s.handler(e.detail.show, e),
    onTcOpenChange: (e: CustomEvent<EvalScorecardOpenChange>) => o.handler(e.detail.open, e),
    baseline: b.value,
    onTcBaselineChange: (e: CustomEvent<EvalScorecardBaselineChange>) => b.handler(e.detail.baseline, e),
    onTcCaseOpen: (e: CustomEvent<EvalScorecardCaseOpen>) => {
      if (onCaseOpen?.(e.detail.caseId, e.detail.runId) === false) e.preventDefault();
    },
  });
}
