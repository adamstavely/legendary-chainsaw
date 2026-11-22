import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcHelpGuide, type HelpGuideOpen, type HelpGuideReadChange, type HelpGuideUpdateSeenChange } from "../help-guide";
import { h, useControlled } from "./internal";

export type { HelpGuideLabels, HelpGuideOpen, HelpGuideReadChange, HelpGuideSize, HelpGuideUpdateSeenChange } from "../help-guide";
export { defaultHelpGuideLabels } from "../help-guide";

const RawHelpGuide = createComponent({
  tagName: "tc-help-guide",
  elementClass: TcHelpGuide,
  react: React,
  events: {
    onTcGuideOpen: "tc-guide-open" as EventName<CustomEvent<HelpGuideOpen>>,
    onTcReadChange: "tc-read-change" as EventName<CustomEvent<HelpGuideReadChange>>,
    onTcUpdateSeenChange: "tc-update-seen-change" as EventName<CustomEvent<HelpGuideUpdateSeenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawHelpGuide>;
type Owned = "heading" | "read" | "updateSeen" | "onTcGuideOpen" | "onTcReadChange" | "onTcUpdateSeenChange" | "children";
export type HelpGuideProps = Omit<RawProps, Owned> & {
  /** The guide's title – the tooltip and the link's accessible name */
  title: string;
  /** The guide was opened; call event.preventDefault() to show it your own way instead of following the link */
  onGuideOpen?: (detail: HelpGuideOpen, event: CustomEvent<HelpGuideOpen>) => void;
  /** Whether it has been read – controlled when given */
  read?: boolean;
  /** Read on mount when `read` isn't controlled */
  defaultRead?: boolean;
  /** The guide was opened for the first time */
  onReadChange?: (read: boolean) => void;
  /** Whether this person has seen the update, clearing the Updated dot – controlled when given */
  updateSeen?: boolean;
  /** Update seen on mount when `updateSeen` isn't controlled */
  defaultUpdateSeen?: boolean;
  /** The guide was opened while the Updated dot showed */
  onUpdateSeenChange?: (updateSeen: boolean) => void;
};

export function HelpGuide({ title, onGuideOpen, read, defaultRead = false, onReadChange, updateSeen, defaultUpdateSeen = false, onUpdateSeenChange, ...props }: HelpGuideProps) {
  const r = useControlled<boolean>(read, defaultRead, onReadChange);
  const u = useControlled<boolean>(updateSeen, defaultUpdateSeen, onUpdateSeenChange);
  return h(RawHelpGuide, {
    ...props,
    heading: title,
    read: r.value,
    updateSeen: u.value,
    onTcGuideOpen: (e: CustomEvent<HelpGuideOpen>) => onGuideOpen?.(e.detail, e),
    onTcReadChange: (e: CustomEvent<HelpGuideReadChange>) => r.handler(e.detail.read, e),
    onTcUpdateSeenChange: (e: CustomEvent<HelpGuideUpdateSeenChange>) => u.handler(e.detail.updateSeen, e),
  });
}
