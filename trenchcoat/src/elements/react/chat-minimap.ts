import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcChatMinimap, type ChatMinimapCurrentChange, type ChatMinimapJump } from "../chat-minimap";
import { h, useControlled } from "./internal";

export type { ChatMarker, ChatMinimapCurrentChange, ChatMinimapJump } from "../chat-minimap";

const RawChatMinimap = createComponent({
  tagName: "tc-chat-minimap",
  elementClass: TcChatMinimap,
  react: React,
  events: {
    onTcJump: "tc-jump" as EventName<CustomEvent<ChatMinimapJump>>,
    onTcCurrentChange: "tc-current-change" as EventName<CustomEvent<ChatMinimapCurrentChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawChatMinimap>;
type Owned = "current" | "onTcCurrentChange" | "children";
export type ChatMinimapProps = Omit<RawProps, Owned> & {
  /** The id of the message in view – controlled when given (null for none) */
  current?: string | null;
  /** The message in view on mount when `current` isn't controlled */
  defaultCurrent?: string | null;
  /** The message in view changed – by scrolling or a jump */
  onCurrentChange?: (current: string | null) => void;
};

export function ChatMinimap({ current, defaultCurrent = null, onCurrentChange, ...props }: ChatMinimapProps) {
  const c = useControlled<string | null>(current, defaultCurrent, onCurrentChange);
  return h(RawChatMinimap, {
    ...props,
    current: c.value,
    onTcCurrentChange: (e: CustomEvent<ChatMinimapCurrentChange>) => c.handler(e.detail.current, e),
  });
}
