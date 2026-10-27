import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcEvalScorecard,
  type EvalScorecardOpen,
  type EvalScorecardOpenChange,
  type EvalScorecardShow,
  type EvalScorecardShowChange,
  type EvalScorecardTagsChange,
} from "../eval-scorecard";
import { h, useControlled } from "./internal";

export { evalRegressed, evalStats } from "../eval-scorecard";
export type { EvalCase, EvalOutcome, EvalResult, EvalScorecardOpen, EvalScorecardShow, EvalVersion, EvalVersionStats } from "../eval-scorecard";

const RawEvalScorecard = createComponent({
  tagName: "tc-eval-scorecard",
  elementClass: TcEvalScorecard,
  react: React,
  events: {
    onTcTagsChange: "tc-tags-change" as EventName<CustomEvent<EvalScorecardTagsChange>>,
    onTcShowChange: "tc-show-change" as EventName<CustomEvent<EvalScorecardShowChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<EvalScorecardOpenChange>>,
  },
});
type RawEvalScorecardProps = React.ComponentProps<typeof RawEvalScorecard>;

export type EvalScorecardProps = Omit<RawEvalScorecardProps, "heading" | "tags" | "show" | "open" | "onTcTagsChange" | "onTcShowChange" | "onTcOpenChange"> & {
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
  ...props
}: EvalScorecardProps) {
  const t = useControlled<string[]>(tags, defaultTags, onTagsChange);
  const s = useControlled<EvalScorecardShow>(show, defaultShow, onShowChange);
  const o = useControlled<EvalScorecardOpen | null>(open, defaultOpen, onOpenChange);
  return h(RawEvalScorecard, {
    ...props,
    heading: title,
    tags: t.value,
    show: s.value,
    open: o.value,
    onTcTagsChange: (e: CustomEvent<EvalScorecardTagsChange>) => t.handler(e.detail.tags, e),
    onTcShowChange: (e: CustomEvent<EvalScorecardShowChange>) => s.handler(e.detail.show, e),
    onTcOpenChange: (e: CustomEvent<EvalScorecardOpenChange>) => o.handler(e.detail.open, e),
  });
}
