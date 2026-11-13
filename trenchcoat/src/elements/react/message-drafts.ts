import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMessageDrafts, type MessageCopy, type MessageSelectedChange, type MessageSend, type MessageVariant, type MessageVariantsChange } from "../message-drafts";
import { h, useControlled } from "./internal";

export type { MessageDraftsLabels, MessageSend, MessageVariant, SmsLength } from "../message-drafts";

const RawMessageDrafts = createComponent({
  tagName: "tc-message-drafts",
  elementClass: TcMessageDrafts,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<MessageSelectedChange>>,
    onTcVariantsChange: "tc-variants-change" as EventName<CustomEvent<MessageVariantsChange>>,
    onTcSend: "tc-send" as EventName<CustomEvent<MessageSend>>,
    onTcCopyText: "tc-copy-text" as EventName<CustomEvent<MessageCopy>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMessageDrafts>;
type Owned = "heading" | "variants" | "selected" | "onTcSelectedChange" | "onTcVariantsChange" | "onTcSend" | "onTcCopyText" | "children";
export type MessageDraftsProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The drafts – controlled when given: every edit reports the next list through onVariantsChange */
  variants?: MessageVariant[];
  /** The drafts on mount when `variants` isn't controlled */
  defaultVariants?: MessageVariant[];
  /** A draft was edited; `next` is the list as it will be */
  onVariantsChange?: (next: MessageVariant[], id: string) => void;
  /** The variant shown, by id – controlled when given */
  selected?: string;
  /** The variant on mount when `selected` isn't controlled */
  defaultSelected?: string;
  /** Another variant was picked */
  onSelectedChange?: (selected: string) => void;
  /** Send was pressed; return false to keep the draft open (to send it yourself, then set `status`) */
  onSend?: (send: MessageSend) => boolean | void;
  /** Copy was pressed; return false to copy it yourself */
  onCopyText?: (copy: MessageCopy) => boolean | void;
};

const NONE: MessageVariant[] = [];

export function MessageDrafts({ title, variants, defaultVariants = NONE, onVariantsChange, selected, defaultSelected, onSelectedChange, onSend, onCopyText, ...props }: MessageDraftsProps) {
  const list = useControlled<MessageVariant[]>(variants, defaultVariants, undefined);
  const sel = useControlled<string | undefined>(selected, defaultSelected, onSelectedChange as ((s: string | undefined) => void) | undefined);
  return h(RawMessageDrafts, {
    ...props,
    heading: title ?? "Text message",
    variants: list.value,
    selected: sel.value,
    onTcVariantsChange: (e: CustomEvent<MessageVariantsChange>) => {
      onVariantsChange?.(e.detail.variants, e.detail.id);
      list.handler(e.detail.variants, e);
    },
    onTcSelectedChange: (e: CustomEvent<MessageSelectedChange>) => sel.handler(e.detail.selected, e),
    onTcSend: (e: CustomEvent<MessageSend>) => {
      if (onSend?.(e.detail) === false) e.preventDefault();
    },
    onTcCopyText: (e: CustomEvent<MessageCopy>) => {
      if (onCopyText?.(e.detail) === false) e.preventDefault();
    },
  });
}
