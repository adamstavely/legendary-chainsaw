import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConversationAnnotation, type AnnotationExport, type ConversationAnnotationSend, type ConversationAnnotationValue, type ConversationAnnotationValueChange } from "../conversation-annotation";
import { h, useControlled } from "./internal";

export type { AnnotationExport, AnnotationLabel, AnnotationMessage, AnnotationSpan, AnnotationTone, ConversationAnnotationValue } from "../conversation-annotation";
export { ANNOTATION_LABELS, ANNOTATION_RATING_LEVELS, annotationMatchesSource, prepareAnnotationExport } from "../conversation-annotation";

const RawConversationAnnotation = createComponent({
  tagName: "tc-conversation-annotation",
  elementClass: TcConversationAnnotation,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ConversationAnnotationValueChange>>,
    onTcSend: "tc-send" as EventName<CustomEvent<ConversationAnnotationSend>>,
  },
});
type RawProps = React.ComponentProps<typeof RawConversationAnnotation>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "onTcSend" | "onChange" | "children";
export type ConversationAnnotationProps = Omit<RawProps, Owned> & {
  /** The heading – defaults to "Conversation review" */
  title?: string;
  /** Spans, ratings and corrections. Controlled when defined; otherwise the component keeps them, starting from `defaultValue` */
  value?: ConversationAnnotationValue;
  /** The value at first when `value` isn't controlled */
  defaultValue?: ConversationAnnotationValue;
  /** Called with the whole value after every label, redaction, rating or correction, controlled or not */
  onChange?: (value: ConversationAnnotationValue) => void;
  /** Called when "Send to dataset" is pressed, with the value and the export copy whose redacted text is blanked out */
  onSend?: (example: AnnotationExport, value: ConversationAnnotationValue) => void;
};

const EMPTY: ConversationAnnotationValue = { spans: [], ratings: {}, corrections: {} };

export function ConversationAnnotation({ title, value, defaultValue = EMPTY, onChange, onSend, ...props }: ConversationAnnotationProps) {
  const v = useControlled(value, defaultValue, onChange);
  return h(RawConversationAnnotation, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    onTcValueChange: (e: CustomEvent<ConversationAnnotationValueChange>) => v.handler(e.detail.value, e),
    onTcSend: (e: CustomEvent<ConversationAnnotationSend>) => onSend?.(e.detail.example, e.detail.value),
  });
}
