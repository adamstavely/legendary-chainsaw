import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcContentShield, type ContentShieldReveal, type ContentShieldRevealedChange } from "../content-shield";
import { h, useControlled } from "./internal";

export type { ContentShieldLabels, ContentShieldReveal, ContentShieldRevealedChange } from "../content-shield";
export { defaultContentShieldLabels } from "../content-shield";

const RawContentShield = createComponent({
  tagName: "tc-content-shield",
  elementClass: TcContentShield,
  react: React,
  events: {
    onTcRevealedChange: "tc-revealed-change" as EventName<CustomEvent<ContentShieldRevealedChange>>,
    onTcReveal: "tc-reveal" as EventName<CustomEvent<ContentShieldReveal>>,
  },
});
type RawProps = React.ComponentProps<typeof RawContentShield>;
type Owned = "revealed" | "onTcRevealedChange" | "children";
export type ContentShieldProps = Omit<RawProps, Owned> & {
  /** Whether the content shows – controlled when given */
  revealed?: boolean;
  /** Whether it shows on mount when `revealed` isn't controlled */
  defaultRevealed?: boolean;
  /** It was revealed or hidden */
  onRevealedChange?: (revealed: boolean) => void;
  /** The content: rendered only once it's revealed */
  children?: React.ReactNode;
};

export function ContentShield({ revealed, defaultRevealed = false, onRevealedChange, children, ...props }: ContentShieldProps) {
  const r = useControlled<boolean>(revealed, defaultRevealed, onRevealedChange);
  const showing = r.value && props.revealable !== false;
  return h(RawContentShield, { ...props, revealed: r.value, onTcRevealedChange: (e: CustomEvent<ContentShieldRevealedChange>) => r.handler(e.detail.revealed, e) }, showing ? children : null);
}
