import { createComponent } from "@lit/react";
import * as React from "react";
import { TcTextReveal } from "../text-reveal";
import { h } from "./internal";

const RawTextReveal = createComponent({ tagName: "tc-text-reveal", elementClass: TcTextReveal, react: React });
type RawTextRevealProps = React.ComponentProps<typeof RawTextReveal>;

export type TextRevealOwnProps = {
  /** The text to reveal */
  text: string;
  /** Reveal word by word or letter by letter */
  by?: "word" | "char";
  /** Time between two pieces, in ms */
  stagger?: number;
  /** Wait before the first piece, in ms */
  delay?: number;
  /** Time each piece takes to arrive, in ms */
  duration?: number;
  /** What the text is: a paragraph, a heading or inline text */
  as?: "p" | "h1" | "h2" | "h3" | "span";
  /** Reveal only the first time; otherwise it plays again each time it enters the view */
  once?: boolean;
  /** Class names for the root element */
  className?: string;
  /** The root element */
  ref?: React.Ref<TcTextReveal>;
};
/** Other DOM props go to the root */
export type TextRevealProps = Omit<RawTextRevealProps, keyof TextRevealOwnProps> & TextRevealOwnProps;

export function TextReveal(props: TextRevealProps) {
  return h(RawTextReveal, props as RawTextRevealProps);
}
