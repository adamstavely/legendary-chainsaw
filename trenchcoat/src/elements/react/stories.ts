import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcStories,
  type StoryActionEvent,
  type StoryEntry,
  type StoryLinkUpdate,
  type StoryOpen,
  type StoryOpenChangeEvent,
  type StoryReplyEvent,
  type StorySeen,
  type StorySeenChangeEvent,
  type StoryUpdate,
} from "../stories";
import { h, useControlled } from "./internal";

export type {
  StoryEntry,
  StoryImageUpdate,
  StoryLinkUpdate,
  StoryListItem,
  StoryListUpdate,
  StoryMetricUpdate,
  StoryNoteUpdate,
  StoryOpen,
  StoryPerson,
  StorySeen,
  StoryStatusUpdate,
  StoryTileSize,
  StoryTone,
  StoryUpdate,
} from "../stories";

const RawStories = createComponent({
  tagName: "tc-stories",
  elementClass: TcStories,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<StoryOpenChangeEvent>>,
    onTcSeenChange: "tc-seen-change" as EventName<CustomEvent<StorySeenChangeEvent>>,
    onTcAction: "tc-action" as EventName<CustomEvent<StoryActionEvent>>,
    onTcReply: "tc-reply" as EventName<CustomEvent<StoryReplyEvent>>,
    onTcAdd: "tc-add" as EventName<CustomEvent<undefined>>,
  },
});
type RawProps = React.ComponentProps<typeof RawStories>;
type Owned = "seen" | "open" | "addable" | "replyable" | "onTcOpenChange" | "onTcSeenChange" | "onTcAction" | "onTcReply" | "onTcAdd" | "children";
export type StoriesProps = Omit<RawProps, Owned> & {
  /** The people and accounts, in the order the row shows them */
  entries?: StoryEntry[];
  /** The same list as `entries`, by its earlier name */
  people?: StoryEntry[];
  /** The update ids that have been seen – controlled when given */
  seen?: StorySeen;
  /** The seen update ids on mount when `seen` isn't controlled */
  defaultSeen?: StorySeen;
  /** A brief was opened on unseen updates: `seen` is the set (or record) with all of them added */
  onSeenChange?: (seen: StorySeen, updates: StoryUpdate[], entry: StoryEntry) => void;
  /** The id of the entry whose brief is open, or null when closed – controlled when given */
  open?: StoryOpen;
  /** The entry open on mount when `open` isn't controlled */
  defaultOpen?: StoryOpen;
  /** The brief is opening, moving to another entry, or closing (null) */
  onOpenChange?: (open: StoryOpen) => void;
  /** A link or action tile was activated; call `event.preventDefault()` to stop a link navigating */
  onAction?: (update: StoryLinkUpdate, entry: StoryEntry, event: Event) => void;
  /** Shows the "add" tile first in the row; called when it's activated */
  onAdd?: () => void;
  /** Shows a reply field at the brief's foot; called with the text when a reply is sent */
  onReply?: (text: string, entry: StoryEntry) => void;
};
const NO_SEEN: StorySeen = new Set<string>();

export function Stories({ entries, people, seen, defaultSeen = NO_SEEN, onSeenChange, open, defaultOpen = null, onOpenChange, onAction, onAdd, onReply, ...props }: StoriesProps) {
  const s = useControlled<StorySeen>(seen, defaultSeen, undefined);
  const o = useControlled<StoryOpen>(open, defaultOpen, onOpenChange);
  return h(RawStories, {
    ...props,
    entries: entries ?? people ?? [],
    seen: s.value,
    open: o.value,
    addable: !!onAdd,
    replyable: !!onReply,
    onTcSeenChange: (e: CustomEvent<StorySeenChangeEvent>) => {
      s.handler(e.detail.seen, e);
      onSeenChange?.(e.detail.seen, e.detail.updates, e.detail.entry);
    },
    onTcOpenChange: (e: CustomEvent<StoryOpenChangeEvent>) => o.handler(e.detail.open, e),
    onTcAction: (e: CustomEvent<StoryActionEvent>) => onAction?.(e.detail.update, e.detail.entry, e),
    onTcAdd: () => onAdd?.(),
    onTcReply: (e: CustomEvent<StoryReplyEvent>) => onReply?.(e.detail.text, e.detail.entry),
  });
}
