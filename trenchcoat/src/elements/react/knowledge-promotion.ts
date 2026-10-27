import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcKnowledgePromotion, type KnowledgeDispute, type KnowledgeFact, type KnowledgePromote, type KnowledgeStatus } from "../knowledge-promotion";
import { h, useControlled } from "./internal";

export type { KnowledgeCondition, KnowledgeFact, KnowledgeStatus, KnowledgeVersion } from "../knowledge-promotion";

const RawKnowledgePromotion = createComponent({
  tagName: "tc-knowledge-promotion",
  elementClass: TcKnowledgePromotion,
  react: React,
  events: {
    onTcPromote: "tc-promote" as EventName<CustomEvent<KnowledgePromote>>,
    onTcDispute: "tc-dispute" as EventName<CustomEvent<KnowledgeDispute>>,
  },
});
type RawKnowledgePromotionProps = React.ComponentProps<typeof RawKnowledgePromotion>;
type Wrapped = "heading" | "status" | "noDispute" | "onTcPromote" | "onTcDispute";
export type KnowledgePromotionProps = Omit<RawKnowledgePromotionProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** "candidate", "promoting" or "promoted". Controlled when defined: Promote only reports through onPromote, and you
   *  pass the new status back. Otherwise the component marks the fact promoted itself */
  status?: KnowledgeStatus;
  /** The status at first, when uncontrolled */
  defaultStatus?: KnowledgeStatus;
  /** Promote was pressed with every required condition met: the fact and the ids of recommended conditions not met */
  onPromote?: (fact: KnowledgeFact, unmetRecommended: string[]) => void;
  /** Shows Dispute; called with the reason and the corrected wording ("" when none) when the form is sent */
  onDispute?: (reason: string, version: string) => void;
};

export function KnowledgePromotion({ title, status, defaultStatus, onPromote, onDispute, ...props }: KnowledgePromotionProps) {
  const own = useControlled<KnowledgeStatus>(status, defaultStatus ?? "candidate", undefined);
  return h(RawKnowledgePromotion, {
    ...props,
    heading: title ?? "Promote to team knowledge",
    status: own.value,
    noDispute: !onDispute,
    onTcPromote: (e: CustomEvent<KnowledgePromote>) => {
      own.handler("promoted", e);
      onPromote?.(e.detail.fact, e.detail.unmetRecommended);
    },
    onTcDispute: (e: CustomEvent<KnowledgeDispute>) => onDispute?.(e.detail.reason, e.detail.version),
  });
}
