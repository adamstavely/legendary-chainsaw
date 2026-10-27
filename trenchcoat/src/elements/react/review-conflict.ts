import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcReviewConflict, type ReviewResolution, type ReviewResolveDetail } from "../review-conflict";
import { h, useControlled } from "./internal";

export type { ReviewResolution, ReviewResolveDetail, ReviewTone, ReviewVerdict } from "../review-conflict";

const RawReviewConflict = createComponent({
  tagName: "tc-review-conflict",
  elementClass: TcReviewConflict,
  react: React,
  events: {
    onTcResolve: "tc-resolve" as EventName<CustomEvent<ReviewResolveDetail>>,
  },
});
type RawProps = React.ComponentProps<typeof RawReviewConflict>;
type Owned = "heading" | "resolution" | "onTcResolve" | "children";
export type ReviewConflictProps = Omit<RawProps, Owned> & {
  /** The heading, and the group's name */
  title?: string;
  /** The outcome – controlled when given (null while open) */
  resolution?: ReviewResolution | null;
  /** The outcome at first, when `resolution` isn't set */
  defaultResolution?: ReviewResolution | null;
  /** Called when the resolver confirms, with the choice (a review's id or "override"), the verdict and the reason */
  onResolve?: (resolution: ReviewResolution) => void;
};

export function ReviewConflict({ title, resolution, defaultResolution = null, onResolve, resolver, ...props }: ReviewConflictProps) {
  const r = useControlled<ReviewResolution | null>(resolution, defaultResolution, onResolve as ((next: ReviewResolution | null) => void) | undefined);
  return h(RawReviewConflict, {
    ...props,
    resolver,
    heading: title ?? "Review conflict",
    resolution: r.value,
    onTcResolve: (e: CustomEvent<ReviewResolveDetail>) => r.handler({ ...e.detail, by: resolver || undefined }, e),
  });
}
