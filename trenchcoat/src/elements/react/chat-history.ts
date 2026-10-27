import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcChatHistory,
  type ChatContextChange,
  type ChatContextItem,
  type ChatConversation,
  type ChatConversationsChange,
  type ChatDeleteDetail,
  type ChatMoveDetail,
  type ChatPinDetail,
  type ChatRenameDetail,
  type ChatValueChange,
} from "../chat-history";
import { h, useControlled } from "./internal";

export type { ChatContextChange, ChatContextItem, ChatConversation, ChatFolder, ChatSummaryItem } from "../chat-history";

const NO_CHATS: ChatConversation[] = [];
const NO_CONTEXT: ChatContextItem[] = [];

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
    onTcContextChange: "tc-context-change" as EventName<CustomEvent<ChatContextChange>>,
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
  | "context"
  | "onTcContextChange"
> & {
  /** Every conversation. Controlled when defined; otherwise the list keeps them, starting at `defaultConversations` */
  conversations?: ChatConversation[];
  /** The starting list when `conversations` is not controlled */
  defaultConversations?: ChatConversation[];
  /** Called with the whole list after any change (rename, pin, move, delete, Undo) */
  onConversationsChange?: (conversations: ChatConversation[]) => void;
  /** The open chat's id. Controlled when defined (null for none) */
  value?: string | null;
  /** The chat open at first, when `value` is not controlled */
  defaultValue?: string | null;
  /** Called with the id of the chat that was opened */
  onChange?: (value: string | null) => void;
  /** The heading above the list, and the tree's name (default "Chats") */
  title?: string;
  /** Called when a chat is renamed in place, with its new title */
  onRename?: (id: string, title: string) => void;
  /** Called when a chat is pinned or unpinned */
  onPin?: (id: string, pinned: boolean) => void;
  /** Called when a chat is moved to a folder, or out of one (null) */
  onMove?: (id: string, folder: string | null) => void;
  /** Called when a chat is deleted – Undo may still bring it back (onRestore) */
  onDelete?: (id: string, conversation: ChatConversation) => void;
  /** Called when Undo brings a deleted chat back */
  onRestore?: (id: string, conversation: ChatConversation) => void;
  /** Called when New chat is pressed */
  onNewChat?: () => void;
  /** What's loaded as context now. Controlled when defined; otherwise the list keeps it, starting at `defaultContext` */
  context?: ChatContextItem[];
  /** The starting context when `context` is not controlled */
  defaultContext?: ChatContextItem[];
  /** Called when a chat's summary is loaded as context or items are removed – send what's in `context` with the next message */
  onContextChange?: (context: ChatContextItem[], change: ChatContextChange) => void;
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
  context,
  defaultContext = NO_CONTEXT,
  onContextChange,
  ...props
}: ChatHistoryProps) {
  const list = useControlled(conversations, defaultConversations, onConversationsChange);
  const ctx = useControlled(context, defaultContext, undefined);
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
    context: ctx.value,
    onTcContextChange: (e: CustomEvent<ChatContextChange>) => {
      ctx.handler(e.detail.context, e);
      onContextChange?.(e.detail.context, e.detail);
    },
  });
}
