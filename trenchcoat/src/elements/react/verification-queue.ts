import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcVerificationQueue,
  type VerificationClaim,
  type VerificationClaimsChange,
  type VerificationExportDetail,
  type VerificationFilter,
  type VerificationFilterChange,
  type VerificationReviewDetail,
  type VerificationStatus,
  type VerificationVerdict,
} from "../verification-queue";
import { h, useControlled } from "./internal";

export type {
  VerificationClaim,
  VerificationClaimsChange,
  VerificationCounts,
  VerificationExportDetail,
  VerificationFilter,
  VerificationFilterChange,
  VerificationReviewDetail,
  VerificationStatus,
  VerificationVerdict,
} from "../verification-queue";

const NONE: VerificationClaim[] = [];

const RawVerificationQueue = createComponent({
  tagName: "tc-verification-queue",
  elementClass: TcVerificationQueue,
  react: React,
  events: {
    onTcClaimsChange: "tc-claims-change" as EventName<CustomEvent<VerificationClaimsChange>>,
    onTcReview: "tc-review" as EventName<CustomEvent<VerificationReviewDetail>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<VerificationFilterChange>>,
    onTcExport: "tc-export" as EventName<CustomEvent<VerificationExportDetail>>,
  },
});
type RawVerificationQueueProps = React.ComponentProps<typeof RawVerificationQueue>;
export type VerificationQueueProps = Omit<RawVerificationQueueProps, "claims" | "filter" | "heading" | "onTcClaimsChange" | "onTcReview" | "onTcFilterChange" | "onTcExport"> & {
  /** The heading, and the region's name */
  title?: string;
  /** The claims in the queue with their statuses – controlled when defined; pair it with `onClaimsChange` */
  claims?: VerificationClaim[];
  /** The claims at first, when `claims` isn't controlled – the element keeps the marks */
  defaultClaims?: VerificationClaim[];
  /** Called with the whole list after every mark */
  onClaimsChange?: (claims: VerificationClaim[]) => void;
  /** Called when a claim is marked, with its new and previous status – and the verdict, when its source type has its own – for apps that save one claim at a time */
  onReview?: (claim: VerificationClaim, status: VerificationStatus, previous: VerificationStatus, verdict?: VerificationVerdict) => void;
  /** What the list shows – controlled when defined */
  filter?: VerificationFilter;
  /** What the list shows at first (default "open": the claims still to review) */
  defaultFilter?: VerificationFilter;
  /** Called when a filter button is pressed */
  onFilterChange?: (filter: VerificationFilter) => void;
  /** Called by Export once the gate is open, with every claim and the count per status */
  onExport?: (detail: VerificationExportDetail) => void;
};

export function VerificationQueue({ title = "Verification queue", claims, defaultClaims = NONE, onClaimsChange, onReview, filter, defaultFilter = "open", onFilterChange, onExport, ...props }: VerificationQueueProps) {
  const c = useControlled(claims, defaultClaims, onClaimsChange);
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(RawVerificationQueue, {
    ...props,
    heading: title,
    claims: c.value,
    filter: f.value,
    onTcClaimsChange: (e: CustomEvent<VerificationClaimsChange>) => c.handler(e.detail.claims, e),
    onTcReview: (e: CustomEvent<VerificationReviewDetail>) => onReview?.(e.detail.claim, e.detail.status, e.detail.previous, e.detail.verdict),
    onTcFilterChange: (e: CustomEvent<VerificationFilterChange>) => f.handler(e.detail.filter, e),
    onTcExport: (e: CustomEvent<VerificationExportDetail>) => onExport?.(e.detail),
  });
}
