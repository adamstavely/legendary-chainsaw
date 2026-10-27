import { createComponent } from "@lit/react";
import * as React from "react";
import { TcShimmerText, TcSkeleton } from "../shimmer-loader";
import { h, isNode, useStaged } from "./internal";

const RawSkeleton = createComponent({ tagName: "tc-skeleton", elementClass: TcSkeleton, react: React });
const RawShimmerText = createComponent({ tagName: "tc-shimmer-text", elementClass: TcShimmerText, react: React });
type RawSkeletonProps = React.ComponentProps<typeof RawSkeleton>;
type RawShimmerTextProps = React.ComponentProps<typeof RawShimmerText>;

export type SkeletonOwnProps = {
  /** Width – a number is px, a string any CSS length; defaults to 100% */
  width?: number | string;
  /** Height – a number is px, a string any CSS length; defaults to 12px */
  height?: number | string;
  /** Corner radius; defaults to 6px */
  radius?: number | string;
  /** Round shape, e.g. for avatars – uses width for both sides */
  circle?: boolean;
  /** Classes on the element */
  className?: string;
  /** Inline styles on the element – width and height size the block */
  style?: React.CSSProperties;
  /** The placeholder element */
  ref?: React.Ref<TcSkeleton>;
};
/** Other DOM props go to the placeholder; it is aria-hidden unless you pass aria-hidden yourself */
export type SkeletonProps = Omit<RawSkeletonProps, keyof SkeletonOwnProps> & SkeletonOwnProps;

export type ShimmerTextOwnProps = {
  /** The text that shimmers – a string, or React nodes the element clones */
  children: React.ReactNode;
  /** Seconds for one pass of the highlight */
  duration?: number;
  /** Classes on the element */
  className?: string;
  /** The text element */
  ref?: React.Ref<TcShimmerText>;
};
/** Other DOM props go to the text element */
export type ShimmerTextProps = Omit<RawShimmerTextProps, keyof ShimmerTextOwnProps | "text" | "content"> & ShimmerTextOwnProps;

export function Skeleton(props: SkeletonProps) {
  return h(RawSkeleton, props as RawSkeletonProps);
}

/** String children become the label; other React nodes render into a staging box and the element clones them */
export function ShimmerText({ children, ...props }: ShimmerTextProps) {
  const plain = typeof children === "string" || typeof children === "number";
  const { stage, els } = useStaged(!plain && isNode(children) ? [["content", h("span", null, children)]] : []);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawShimmerText, { ...(props as RawShimmerTextProps), text: plain ? String(children) : "", content: plain ? undefined : els.content }),
  );
}
