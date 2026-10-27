import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGuardrailNotice, type GuardrailOpenChange, type GuardrailReviewRequest } from "../guardrail-notice";
import { h, useControlled } from "./internal";

export type { GuardrailAction, GuardrailLayout, GuardrailReviewRequest, GuardrailSegment, GuardrailText } from "../guardrail-notice";

const RawGuardrailNotice = createComponent({
  tagName: "tc-guardrail-notice",
  elementClass: TcGuardrailNotice,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<GuardrailOpenChange>>,
    onTcReviewRequest: "tc-review-request" as EventName<CustomEvent<GuardrailReviewRequest>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<null>>,
  },
});
type RawGuardrailNoticeProps = React.ComponentProps<typeof RawGuardrailNotice>;

export type GuardrailNoticeOwnProps = {
  /** The heading – "Blocked by policy", "Redacted by policy" or "Rewritten by policy" by default */
  title?: string;
  /** Whether the before / after is showing. Controlled when defined */
  open?: boolean;
  /** Whether it shows at first when uncontrolled – closed by default */
  defaultOpen?: boolean;
  /** "Show what changed" opened or closed the before / after */
  onOpenChange?: (open: boolean) => void;
  /** Request review was pressed; call event.preventDefault() to keep the button as it is (set `requested` yourself) */
  onRequestReview?: (detail: GuardrailReviewRequest, event: Event) => void;
  /** Shows a close button; called when it's pressed – remove the notice in answer */
  onDismiss?: () => void;
};
export type GuardrailNoticeProps = Omit<RawGuardrailNoticeProps, keyof GuardrailNoticeOwnProps | "heading" | "dismissible" | "onTcOpenChange" | "onTcReviewRequest" | "onTcDismiss"> & GuardrailNoticeOwnProps;

export function GuardrailNotice({ title, open, defaultOpen = false, onOpenChange, onRequestReview, onDismiss, ...props }: GuardrailNoticeProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawGuardrailNotice, {
    ...props,
    heading: title,
    open: o.value,
    dismissible: !!onDismiss,
    onTcOpenChange: (e: CustomEvent<GuardrailOpenChange>) => o.handler(e.detail.open, e),
    onTcReviewRequest: (e: CustomEvent<GuardrailReviewRequest>) => onRequestReview?.(e.detail, e),
    onTcDismiss: () => onDismiss?.(),
  });
}
