import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcChatHistory,
  type ChatConversation,
  type ChatConversationsChange,
  type ChatDeleteDetail,
  type ChatMoveDetail,
  type ChatPinDetail,
  type ChatRenameDetail,
  type ChatValueChange,
} from "../chat-history";
import { h, useControlled } from "./internal";

export type { ChatConversation, ChatFolder } from "../chat-history";

const NO_CHATS: ChatConversation[] = [];

const RawChatHistory = createComponent({
  tagName: "tc-chat-history",
  elementClass: TcChatHistory,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ChatValueChange>>,
    onTcConversationsChange: "tc-conversations-change" as EventName<CustomEvent<ChatConversationsChange>>,
    onTcRename: "tc-rename" as EventName<CustomEvent<ChatRenameDetail>>,
    onTcPin: "tc-pin" as EventName<CustomEvent<ChatPinDetail>>,
    onTcMove: "tc-move" as EventName<CustomEvent<ChatMoveDetail>>,
    onTcDelete: "tc-delete" as EventName<CustomEvent<ChatDeleteDetail>>,
    onTcRestore: "tc-restore" as EventName<CustomEvent<ChatDeleteDetail>>,
    onTcNewChat: "tc-new-chat" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawChatHistory>;

export type ChatHistoryProps = Omit<
  RawProps,
  | "conversations"
  | "value"
  | "defaultValue"
  | "heading"
  | "onChange"
  | "onTcValueChange"
  | "onTcConversationsChange"
  | "onTcRename"
  | "onTcPin"
  | "onTcMove"
  | "onTcDelete"
  | "onTcRestore"
  | "onTcNewChat"
> & {
  /** Every conversation. Controlled when defined; otherwise the list keeps them, starting at `defaultConversations` */
  conversations?: ChatConversation[];
  defaultConversations?: ChatConversation[];
  /** Called with the whole list after any change (rename, pin, move, delete, Undo) */
  onConversationsChange?: (conversations: ChatConversation[]) => void;
  /** The open chat's id. Controlled when defined (null for none) */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the id of the chat that was opened */
  onChange?: (value: string | null) => void;
  title?: string;
  onRename?: (id: string, title: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onMove?: (id: string, folder: string | null) => void;
  /** Called when a chat is deleted – Undo may still bring it back (onRestore) */
  onDelete?: (id: string, conversation: ChatConversation) => void;
  onRestore?: (id: string, conversation: ChatConversation) => void;
  onNewChat?: () => void;
};

/** The conversation list: search, pinning, folders, rename and delete with Undo, grouped by date; windowed */
export function ChatHistory({
  conversations,
  defaultConversations = NO_CHATS,
  onConversationsChange,
  value,
  defaultValue = null,
  onChange,
  title = "Chats",
  onRename,
  onPin,
  onMove,
  onDelete,
  onRestore,
  onNewChat,
  ...props
}: ChatHistoryProps) {
  const list = useControlled(conversations, defaultConversations, onConversationsChange);
  const open = useControlled(value, defaultValue, onChange);
  return h(RawChatHistory, {
    ...props,
    heading: title,
    conversations: list.value,
    // (React's own `value` attribute type is merged into the element's props – the element's is a chat id)
    value: open.value as RawProps["value"],
    onTcConversationsChange: (e: CustomEvent<ChatConversationsChange>) => list.handler(e.detail.conversations, e),
    onTcValueChange: (e: CustomEvent<ChatValueChange>) => open.handler(e.detail.value, e),
    onTcRename: (e: CustomEvent<ChatRenameDetail>) => onRename?.(e.detail.id, e.detail.title),
    onTcPin: (e: CustomEvent<ChatPinDetail>) => onPin?.(e.detail.id, e.detail.pinned),
    onTcMove: (e: CustomEvent<ChatMoveDetail>) => onMove?.(e.detail.id, e.detail.folder),
    onTcDelete: (e: CustomEvent<ChatDeleteDetail>) => onDelete?.(e.detail.id, e.detail.conversation),
    onTcRestore: (e: CustomEvent<ChatDeleteDetail>) => onRestore?.(e.detail.id, e.detail.conversation),
    onTcNewChat: () => onNewChat?.(),
  });
}
