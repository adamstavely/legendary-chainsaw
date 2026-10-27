import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcStories, type StoryItem, type StoryOpen, type StoryOpenChangeEvent, type StoryPerson, type StoryReplyEvent, type StorySeen, type StorySeenChangeEvent } from "../stories";
import { h, useControlled } from "./internal";

export type { StoryItem, StoryKind, StoryOpen, StoryPerson, StorySeen, StoryTone } from "../stories";

const RawStories = createComponent({
  tagName: "tc-stories",
  elementClass: TcStories,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<StoryOpenChangeEvent>>,
    onTcSeenChange: "tc-seen-change" as EventName<CustomEvent<StorySeenChangeEvent>>,
    onTcReply: "tc-reply" as EventName<CustomEvent<StoryReplyEvent>>,
    onTcAdd: "tc-add" as EventName<CustomEvent<undefined>>,
  },
});
type RawProps = React.ComponentProps<typeof RawStories>;
type Owned = "seen" | "open" | "addable" | "replyable" | "onTcOpenChange" | "onTcSeenChange" | "onTcReply" | "onTcAdd" | "children";
export type StoriesProps = Omit<RawProps, Owned> & {
  /** The item ids that have been seen – controlled when given */
  seen?: StorySeen;
  /** The seen item ids on mount when `seen` isn't controlled */
  defaultSeen?: StorySeen;
  /** An unseen item was shown: `seen` is the set (or record) with it added */
  onSeenChange?: (seen: StorySeen, item: StoryItem, person: StoryPerson) => void;
  /** What the viewer shows ({ person, item } ids), or null when closed – controlled when given */
  open?: StoryOpen;
  /** What the viewer shows on mount when `open` isn't controlled */
  defaultOpen?: StoryOpen;
  /** The viewer is opening, stepping to another item, or closing (null) */
  onOpenChange?: (open: StoryOpen) => void;
  /** Shows the "add" tile first in the row; called when it's activated */
  onAdd?: () => void;
  /** Shows a reply field in the viewer; called with the text when a reply is sent */
  onReply?: (text: string, item: StoryItem, person: StoryPerson) => void;
};
const NO_SEEN: StorySeen = new Set<string>();

export function Stories({ seen, defaultSeen = NO_SEEN, onSeenChange, open, defaultOpen = null, onOpenChange, onAdd, onReply, ...props }: StoriesProps) {
  const s = useControlled<StorySeen>(seen, defaultSeen, undefined);
  const o = useControlled<StoryOpen>(open, defaultOpen, onOpenChange);
  return h(RawStories, {
    ...props,
    seen: s.value,
    open: o.value,
    addable: !!onAdd,
    replyable: !!onReply,
    onTcSeenChange: (e: CustomEvent<StorySeenChangeEvent>) => {
      s.handler(e.detail.seen, e);
      onSeenChange?.(e.detail.seen, e.detail.item, e.detail.person);
    },
    onTcOpenChange: (e: CustomEvent<StoryOpenChangeEvent>) => o.handler(e.detail.open, e),
    onTcAdd: () => onAdd?.(),
    onTcReply: (e: CustomEvent<StoryReplyEvent>) => onReply?.(e.detail.text, e.detail.item, e.detail.person),
  });
}
