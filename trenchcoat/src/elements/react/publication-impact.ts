import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPublicationImpact, type PublicationFeedbackFilter, type PublicationFilterChange } from "../publication-impact";
import { h, useControlled } from "./internal";

export type {
  PublicationFeedbackFilter,
  PublicationFeedbackKind,
  PublicationSentiment,
  PublicationAuthor,
  PublicationFeedback,
  PublicationMention,
  PublicationMetrics,
  PublicationTone,
} from "../publication-impact";
export { defaultPublicationFeedbackLabels, defaultPublicationSentimentLabels } from "../publication-impact";

const RawPublicationImpact = createComponent({
  tagName: "tc-publication-impact",
  elementClass: TcPublicationImpact,
  react: React,
  events: { onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<PublicationFilterChange>> },
});
type RawProps = React.ComponentProps<typeof RawPublicationImpact>;
type Owned = "heading" | "filter" | "onTcFilterChange" | "children";
export type PublicationImpactProps = Omit<RawProps, Owned> & {
  /** The paper's title */
  title?: string;
  /** The feedback kind shown – controlled when given */
  filter?: PublicationFeedbackFilter;
  /** The feedback kind shown on mount when `filter` isn't controlled */
  defaultFilter?: PublicationFeedbackFilter;
  /** A feedback filter was picked */
  onFilterChange?: (filter: PublicationFeedbackFilter) => void;
};

export function PublicationImpact({ title, filter, defaultFilter = "all", onFilterChange, ...props }: PublicationImpactProps) {
  const f = useControlled<PublicationFeedbackFilter>(filter, defaultFilter, onFilterChange);
  return h(RawPublicationImpact, {
    ...props,
    heading: title ?? "",
    filter: f.value,
    onTcFilterChange: (e: CustomEvent<PublicationFilterChange>) => f.handler(e.detail.filter, e),
  });
}
