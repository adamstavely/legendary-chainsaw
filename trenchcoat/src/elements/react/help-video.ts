import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHelpVideo, type HelpVideoOpenChange, type HelpVideoUpdateSeenChange, type HelpVideoWatchedChange } from "../help-video";
import { h, useControlled } from "./internal";

export type { HelpVideoChapter, HelpVideoCue, HelpVideoLabels, HelpVideoOpenChange, HelpVideoSize, HelpVideoUpdateSeenChange, HelpVideoWatchedChange } from "../help-video";
export { defaultHelpVideoLabels, helpVideoTime, helpVideoTranscriptText, parseHelpVideoVtt } from "../help-video";

const RawHelpVideo = createComponent({
  tagName: "tc-help-video",
  elementClass: TcHelpVideo,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<HelpVideoOpenChange>>,
    onTcWatchedChange: "tc-watched-change" as EventName<CustomEvent<HelpVideoWatchedChange>>,
    onTcUpdateSeenChange: "tc-update-seen-change" as EventName<CustomEvent<HelpVideoUpdateSeenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHelpVideo>;
type Owned = "heading" | "open" | "watched" | "updateSeen" | "onTcOpenChange" | "onTcWatchedChange" | "onTcUpdateSeenChange" | "children";
export type HelpVideoProps = Omit<RawProps, Owned> & {
  /** The video's title – the tooltip, the player's heading and the icon's accessible name */
  title: string;
  /** Whether the player is open – controlled when given */
  open?: boolean;
  /** Open on mount when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The player was opened or closed */
  onOpenChange?: (open: boolean) => void;
  /** Whether it has been watched – controlled when given */
  watched?: boolean;
  /** Watched on mount when `watched` isn't controlled */
  defaultWatched?: boolean;
  /** The video played to its end */
  onWatchedChange?: (watched: boolean) => void;
  /** Whether this person has seen the update, clearing the Updated dot – controlled when given */
  updateSeen?: boolean;
  /** Update seen on mount when `updateSeen` isn't controlled */
  defaultUpdateSeen?: boolean;
  /** The player was opened while the Updated dot showed */
  onUpdateSeenChange?: (updateSeen: boolean) => void;
};

export function HelpVideo({ title, open, defaultOpen = false, onOpenChange, watched, defaultWatched = false, onWatchedChange, updateSeen, defaultUpdateSeen = false, onUpdateSeenChange, ...props }: HelpVideoProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  const w = useControlled<boolean>(watched, defaultWatched, onWatchedChange);
  const u = useControlled<boolean>(updateSeen, defaultUpdateSeen, onUpdateSeenChange);
  return h(RawHelpVideo, {
    ...props,
    heading: title,
    open: o.value,
    watched: w.value,
    updateSeen: u.value,
    onTcOpenChange: (e: CustomEvent<HelpVideoOpenChange>) => o.handler(e.detail.open, e),
    onTcWatchedChange: (e: CustomEvent<HelpVideoWatchedChange>) => w.handler(e.detail.watched, e),
    onTcUpdateSeenChange: (e: CustomEvent<HelpVideoUpdateSeenChange>) => u.handler(e.detail.updateSeen, e),
  });
}
