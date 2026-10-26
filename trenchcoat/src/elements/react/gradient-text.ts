import { createComponent } from "@lit/react";
import * as React from "react";
import { TcGradientText } from "../gradient-text";
import { h, isNode, useStaged } from "./internal";

const RawGradientText = createComponent({ tagName: "tc-gradient-text", elementClass: TcGradientText, react: React });
type RawGradientTextProps = React.ComponentProps<typeof RawGradientText>;

export type GradientTextOwnProps = {
  children: React.ReactNode;
  /** Gradient start, end and up to two blob colors: [start, end, blob, blob] */
  colors?: string[];
  /** Seconds per flow cycle */
  speed?: number;
  /** Seconds the flow runs before it rests (on the nearest quarter cycle below); Infinity never stops – then give
   * users a way to pause it (WCAG 2.2.2) */
  playFor?: number;
  /** Sweep the color in from left to right when the text scrolls into view */
  sweep?: boolean;
  /** What the text is: inline text, a paragraph or a heading */
  as?: "span" | "h1" | "h2" | "p";
  className?: string;
  /** The root element */
  ref?: React.Ref<TcGradientText>;
};
/** Other DOM props go to the root */
export type GradientTextProps = Omit<RawGradientTextProps, keyof GradientTextOwnProps | "text" | "content"> & GradientTextOwnProps;

/** String children become the text; other React nodes render into a staging box and the element clones them */
export function GradientText({ children, ...props }: GradientTextProps) {
  const plain = typeof children === "string" || typeof children === "number";
  const { stage, els } = useStaged(!plain && isNode(children) ? [["content", h("span", null, children)]] : []);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawGradientText, { ...(props as RawGradientTextProps), text: plain ? String(children) : "", content: plain ? undefined : els.content }),
  );
}
