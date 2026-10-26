import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcExtractionReview, type ExtractionAction, type ExtractionConfirm, type ExtractionField, type ExtractionFieldsChange } from "../extraction-review";
import { h, useControlled } from "./internal";

export type { ExtractionAction, ExtractionBox, ExtractionField, ExtractionFieldStatus, ExtractionPage } from "../extraction-review";

const RawExtractionReview = createComponent({
  tagName: "tc-extraction-review",
  elementClass: TcExtractionReview,
  react: React,
  events: {
    onTcFieldsChange: "tc-fields-change" as EventName<CustomEvent<ExtractionFieldsChange>>,
    onTcConfirm: "tc-confirm" as EventName<CustomEvent<ExtractionConfirm>>,
  },
});
type RawExtractionReviewProps = React.ComponentProps<typeof RawExtractionReview>;

export type ExtractionReviewOwnProps = {
  /** Names the review – the heading over the page and the fields */
  title?: string;
  /** The reviewed fields. Controlled when defined – pass back what onFieldsChange reports */
  fields?: ExtractionField[];
  /** Starting fields when uncontrolled */
  defaultFields?: ExtractionField[];
  /** A field was accepted, corrected, rejected or set back to review: the whole list, the changed field and what was done */
  onFieldsChange?: (fields: ExtractionField[], field: ExtractionField, action: ExtractionAction) => void;
  /** Confirm was pressed with every field reviewed */
  onConfirm?: (fields: ExtractionField[]) => void;
};
export type ExtractionReviewProps = Omit<RawExtractionReviewProps, keyof ExtractionReviewOwnProps | "heading" | "onTcFieldsChange" | "onTcConfirm"> & ExtractionReviewOwnProps;

const EMPTY: ExtractionField[] = [];

export function ExtractionReview({ title = "Review extracted fields", fields, defaultFields = EMPTY, onFieldsChange, onConfirm, ...props }: ExtractionReviewProps) {
  // The changed field and the action travel with the list: kept from the event for onFieldsChange's extra arguments
  const last = React.useRef<{ field: ExtractionField; action: ExtractionAction } | null>(null);
  const report = React.useCallback((next: ExtractionField[]) => last.current && onFieldsChange?.(next, last.current.field, last.current.action), [onFieldsChange]);
  const f = useControlled(fields, defaultFields, report);
  return h(RawExtractionReview, {
    ...props,
    heading: title,
    fields: f.value,
    onTcFieldsChange: (e: CustomEvent<ExtractionFieldsChange>) => {
      last.current = { field: e.detail.field, action: e.detail.action };
      f.handler(e.detail.fields, e);
    },
    onTcConfirm: (e: CustomEvent<ExtractionConfirm>) => onConfirm?.(e.detail.fields),
  });
}
