import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGhostCompletion, type GhostCompletionAccept, type GhostCompletionDismiss, type GhostCompletionValueChange } from "../ghost-completion";
import { h, useControlled } from "./internal";

export type { GhostCompletionAccept, GhostCompletionDismiss, GhostCompletionLabels, GhostCompletionSuggest, GhostCompletionValueChange } from "../ghost-completion";
export { defaultGhostCompletionLabels, nextWord } from "../ghost-completion";

const RawGhostCompletion = createComponent({
  tagName: "tc-ghost-completion",
  elementClass: TcGhostCompletion,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<GhostCompletionValueChange>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<GhostCompletionAccept>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<GhostCompletionDismiss>>,
  },
});
type RawGhostCompletionProps = React.ComponentProps<typeof RawGhostCompletion>;

export type GhostCompletionOwnProps = {
  /** The heading (default "Draft") */
  title?: string;
  /** The text in the field. Controlled when defined */
  value?: string;
  /** The starting text when uncontrolled */
  defaultValue?: string;
  /** The text changed by typing or accepting a suggestion */
  onValueChange?: (value: string) => void;
  /** Some or all of a suggestion was taken – `whole` when nothing of it is left */
  onAccept?: (text: string, whole: boolean) => void;
  /** The suggestion was dismissed with Escape */
  onDismiss?: (text: string) => void;
};
export type GhostCompletionProps = Omit<RawGhostCompletionProps, keyof GhostCompletionOwnProps | "heading" | "onTcValueChange" | "onTcAccept" | "onTcDismiss" | "children"> &
  GhostCompletionOwnProps;

/** A text field with dimmed AI suggestions after the caret – Tab accepts, Ctrl/⌘ + → takes a word, Escape dismisses */
export function GhostCompletion({ title = "Draft", value, defaultValue = "", onValueChange, onAccept, onDismiss, ...props }: GhostCompletionProps) {
  const v = useControlled(value, defaultValue, onValueChange);
  return h(RawGhostCompletion, {
    ...props,
    heading: title,
    value: v.value,
    onTcValueChange: (e: CustomEvent<GhostCompletionValueChange>) => v.handler(e.detail.value, e),
    onTcAccept: (e: CustomEvent<GhostCompletionAccept>) => onAccept?.(e.detail.text, e.detail.whole),
    onTcDismiss: (e: CustomEvent<GhostCompletionDismiss>) => onDismiss?.(e.detail.text),
  });
}
