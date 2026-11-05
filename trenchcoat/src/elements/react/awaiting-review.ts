import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAwaitingReview } from "../awaiting-review";

/** Awaiting Review illustration, with its words as real text. The ref receives the element */
export const AwaitingReview = createComponent({ tagName: "tc-awaiting-review", elementClass: TcAwaitingReview, react: React });
export type AwaitingReviewProps = React.ComponentProps<typeof AwaitingReview>;
