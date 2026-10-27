import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcClaimAnswer, type AnswerClaim, type ClaimOpenChange, type ClaimQueuedChange, type ClaimSource, type ClaimVerifyDetail } from "../claim-answer";
import { h, useControlled } from "./internal";

export type { AnswerClaim, ClaimMediaType, ClaimMemoryType, ClaimOpenChange, ClaimQuestionType, ClaimQueuedChange, ClaimSource, ClaimSourceType, ClaimUncertainty, ClaimVerifyDetail } from "../claim-answer";

const NONE: string[] = [];

const RawClaimAnswer = createComponent({
  tagName: "tc-claim-answer",
  elementClass: TcClaimAnswer,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<ClaimOpenChange>>,
    onTcQueuedChange: "tc-queued-change" as EventName<CustomEvent<ClaimQueuedChange>>,
    onTcVerify: "tc-verify" as EventName<CustomEvent<ClaimVerifyDetail>>,
  },
});
type RawClaimAnswerProps = React.ComponentProps<typeof RawClaimAnswer>;
export type ClaimAnswerProps = Omit<RawClaimAnswerProps, "open" | "queued" | "onTcOpenChange" | "onTcQueuedChange" | "onTcVerify"> & {
  /** Id of the claim whose detail is open – controlled when defined (null: none) */
  open?: string | null;
  /** Id of the claim open at first (uncontrolled) */
  defaultOpen?: string | null;
  /** Called when the open claim changes (null: closed) */
  onOpenChange?: (open: string | null) => void;
  /** Ids of the claims already sent to verification – controlled when defined */
  queued?: string[];
  /** Ids already sent when `queued` isn't controlled */
  defaultQueued?: string[];
  /** Called with the queued ids after a claim is sent */
  onQueuedChange?: (queued: string[]) => void;
  /** Called when a claim is sent to verification, with the sources it rests on – add it to your verification queue */
  onVerify?: (claim: AnswerClaim, sources: ClaimSource[]) => void;
};

export function ClaimAnswer({ open, defaultOpen = null, onOpenChange, queued, defaultQueued = NONE, onQueuedChange, onVerify, ...props }: ClaimAnswerProps) {
  const o = useControlled<string | null | undefined>(open, defaultOpen, (id) => onOpenChange?.(id ?? null));
  const q = useControlled(queued, defaultQueued, onQueuedChange);
  return h(RawClaimAnswer, {
    ...props,
    open: o.value ?? null,
    queued: q.value,
    onTcOpenChange: (e: CustomEvent<ClaimOpenChange>) => o.handler(e.detail.open, e),
    onTcQueuedChange: (e: CustomEvent<ClaimQueuedChange>) => q.handler(e.detail.queued, e),
    onTcVerify: (e: CustomEvent<ClaimVerifyDetail>) => onVerify?.(e.detail.claim, e.detail.sources),
  });
}
