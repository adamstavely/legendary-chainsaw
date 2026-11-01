import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRedactionReview, type Redaction, type RedactionShare, type RedactionsChange } from "../redaction-review";
import { h, useControlled } from "./internal";

export type { Redaction, RedactionBlock, RedactionReviewLabels, RedactionShare, RedactionStatus, RedactionsChange } from "../redaction-review";
export { defaultRedactionReviewLabels } from "../redaction-review";

const RawRedactionReview = createComponent({
  tagName: "tc-redaction-review",
  elementClass: TcRedactionReview,
  react: React,
  events: {
    onTcRedactionsChange: "tc-redactions-change" as EventName<CustomEvent<RedactionsChange>>,
    onTcShare: "tc-share" as EventName<CustomEvent<RedactionShare>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRedactionReview>;
type Owned = "heading" | "redactions" | "onTcRedactionsChange" | "children";
export type RedactionReviewProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Redaction review" */
  title?: string;
  /** What's redacted – controlled when given */
  redactions?: Redaction[];
  /** What's redacted on mount when `redactions` isn't controlled */
  defaultRedactions?: Redaction[];
  /** A redaction was approved or rejected, or all were approved */
  onRedactionsChange?: (redactions: Redaction[], detail: RedactionsChange) => void;
};

const NONE: Redaction[] = [];

export function RedactionReview({ title, redactions, defaultRedactions = NONE, onRedactionsChange, ...props }: RedactionReviewProps) {
  const r = useControlled<Redaction[]>(redactions, defaultRedactions, undefined);
  return h(RawRedactionReview, {
    ...props,
    heading: title ?? "",
    redactions: r.value,
    onTcRedactionsChange: (e: CustomEvent<RedactionsChange>) => {
      r.handler(e.detail.redactions, e);
      onRedactionsChange?.(e.detail.redactions, e.detail);
    },
  });
}
