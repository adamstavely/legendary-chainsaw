import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRevisionLoop, type RevisionLoopAccept, type RevisionLoopExpandedChange, type RevisionLoopExtend, type RevisionLoopRound, type RevisionLoopStop } from "../revision-loop";
import { h, useControlled } from "./internal";

export type { RevisionLoopAccept, RevisionLoopBar, RevisionLoopExpandedChange, RevisionLoopExtend, RevisionLoopLabels, RevisionLoopOutcome, RevisionLoopRound, RevisionLoopRoundStatus, RevisionLoopStop } from "../revision-loop";
export { defaultRevisionLoopLabels } from "../revision-loop";

const RawRevisionLoop = createComponent({
  tagName: "tc-revision-loop",
  elementClass: TcRevisionLoop,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<RevisionLoopExpandedChange>>,
    onTcStop: "tc-stop" as EventName<CustomEvent<RevisionLoopStop>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<RevisionLoopAccept>>,
    onTcExtend: "tc-extend" as EventName<CustomEvent<RevisionLoopExtend>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRevisionLoop>;
type Owned = "heading" | "expanded" | "onTcExpandedChange" | "children";
export type RevisionLoopProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Revision loop" */
  title?: string;
  /** The open round's number – controlled when given */
  expanded?: number | null;
  /** The open round on mount when `expanded` isn't controlled */
  defaultExpanded?: number | null;
  /** A round was opened or closed */
  onExpandedChange?: (expanded: number | null, round: RevisionLoopRound | null) => void;
};

/** `outcome` and `cap` are the page's: set them in onTcStop and onTcExtend, since React passes them again on every render */
export function RevisionLoop({ title, expanded, defaultExpanded = null, onExpandedChange, ...props }: RevisionLoopProps) {
  const s = useControlled<number | null>(expanded, defaultExpanded, undefined);
  return h(RawRevisionLoop, {
    ...props,
    heading: title ?? "Revision loop",
    expanded: s.value,
    onTcExpandedChange: (e: CustomEvent<RevisionLoopExpandedChange>) => {
      s.handler(e.detail.expanded, e);
      onExpandedChange?.(e.detail.expanded, e.detail.round);
    },
  });
}
