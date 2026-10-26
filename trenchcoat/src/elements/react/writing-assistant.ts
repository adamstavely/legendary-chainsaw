import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcWritingAssistant, type ChatDraftChange, type ChatMessage, type ChatMessagesChange } from "../writing-assistant";
import { h, useControlled } from "./internal";

export type { ChatMessage } from "../writing-assistant";

const NO_MESSAGES: ChatMessage[] = [];

const RawWritingAssistant = createComponent({
  tagName: "tc-writing-assistant",
  elementClass: TcWritingAssistant,
  react: React,
  events: {
    onTcMessagesChange: "tc-messages-change" as EventName<CustomEvent<ChatMessagesChange>>,
    onTcDraftChange: "tc-draft-change" as EventName<CustomEvent<ChatDraftChange>>,
  },
});
type RawWritingAssistantProps = React.ComponentProps<typeof RawWritingAssistant>;
export type WritingAssistantProps = Omit<RawWritingAssistantProps, "messages" | "draft" | "onTcMessagesChange" | "onTcDraftChange"> & {
  /** The conversation (controlled) – read it, seed it or restore it; new messages are asked for through `onMessagesChange` */
  messages?: ChatMessage[];
  /** Starting conversation when `messages` isn't controlled */
  defaultMessages?: ChatMessage[];
  /** Called with the whole conversation whenever a message is added or the chat is reset */
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** Text in the prompt field (controlled) */
  draft?: string;
  /** Starting text in the prompt field when `draft` isn't controlled */
  defaultDraft?: string;
  /** Called with the field's new text whenever it changes – typing, dictation, or clearing after a send */
  onDraftChange?: (draft: string) => void;
};

export function WritingAssistant({ messages, defaultMessages = NO_MESSAGES, onMessagesChange, draft, defaultDraft = "", onDraftChange, ...props }: WritingAssistantProps) {
  const m = useControlled(messages, defaultMessages, onMessagesChange);
  const d = useControlled(draft, defaultDraft, onDraftChange);
  return h(RawWritingAssistant, {
    ...props,
    messages: m.value,
    draft: d.value,
    onTcMessagesChange: (e: CustomEvent<ChatMessagesChange>) => m.handler(e.detail.messages, e),
    onTcDraftChange: (e: CustomEvent<ChatDraftChange>) => d.handler(e.detail.draft, e),
  });
}
