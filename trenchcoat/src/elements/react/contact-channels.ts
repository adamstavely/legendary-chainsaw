import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcContactChannels, type ContactActionEvent, type ContactChannel, type ContactCopy, type ContactRevealedChange } from "../contact-channels";
import { h, useControlled } from "./internal";

export type { ContactAction, ContactActionEvent, ContactChannel, ContactCopy, ContactKind, ContactRevealedChange, ContactTone } from "../contact-channels";
export { defaultContactKindLabels, defaultContactStates, maskContact } from "../contact-channels";

const RawContactChannels = createComponent({
  tagName: "tc-contact-channels",
  elementClass: TcContactChannels,
  react: React,
  events: {
    onTcRevealedChange: "tc-revealed-change" as EventName<CustomEvent<ContactRevealedChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<ContactCopy>>,
    onTcAction: "tc-action" as EventName<CustomEvent<ContactActionEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawContactChannels>;
type Owned = "heading" | "revealed" | "onTcRevealedChange" | "onTcCopy" | "onTcAction" | "onCopy" | "children";
export type ContactChannelsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The ids whose values are shown – controlled when given */
  revealed?: string[];
  /** The ids shown on mount when `revealed` isn't controlled */
  defaultRevealed?: string[];
  /** A value was shown or masked again; `revealed` is the new list */
  onRevealedChange?: (revealed: string[]) => void;
  /** Copy was pressed; return false to stop the copy */
  onCopy?: (channel: ContactChannel, text: string) => boolean | void;
  /** One of the page's actions was pressed */
  onAction?: (action: string, channel: ContactChannel) => void;
};

const NONE: string[] = [];

export function ContactChannels({ title, revealed, defaultRevealed = NONE, onRevealedChange, onCopy, onAction, ...props }: ContactChannelsProps) {
  const r = useControlled<string[]>(revealed, defaultRevealed, onRevealedChange);
  return h(RawContactChannels, {
    ...props,
    heading: title ?? "Contact",
    revealed: r.value,
    onTcRevealedChange: (e: CustomEvent<ContactRevealedChange>) => r.handler(e.detail.revealed, e),
    onTcCopy: (e: CustomEvent<ContactCopy>) => {
      if (onCopy?.(e.detail.channel, e.detail.text) === false) e.preventDefault();
    },
    onTcAction: (e: CustomEvent<ContactActionEvent>) => onAction?.(e.detail.action, e.detail.channel),
  });
}
