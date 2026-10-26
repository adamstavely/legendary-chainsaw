import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCommentsPanel, type CommentsFilter, type PanelComment } from "../comments-panel";
import { h, useControlled } from "./internal";

export type { CommentAuthor, CommentsFilter, PanelComment } from "../comments-panel";

const RawCommentsPanel = createComponent({
  tagName: "tc-comments-panel",
  elementClass: TcCommentsPanel,
  react: React,
  events: {
    onTcCommentsChange: "tc-comments-change" as EventName<CustomEvent<{ comments: PanelComment[] }>>,
    onTcResolvedChange: "tc-resolved-change" as EventName<CustomEvent<{ resolved: string[] }>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<{ filter: CommentsFilter }>>,
    onTcClose: "tc-close" as EventName<CustomEvent<null>>,
  },
});
type RawCommentsPanelProps = React.ComponentProps<typeof RawCommentsPanel>;
export type CommentsPanelProps = Omit<
  RawCommentsPanelProps,
  "heading" | "resolved" | "filter" | "closable" | "onTcCommentsChange" | "onTcResolvedChange" | "onTcFilterChange" | "onTcClose"
> & {
  title?: string;
  /** The whole feed after a comment was added here (or taken out again when onAdd failed) */
  onCommentsChange?: (comments: PanelComment[]) => void;
  /** Ids of resolved comments – controlled when defined */
  resolved?: string[];
  defaultResolved?: string[];
  onResolvedChange?: (resolved: string[]) => void;
  /** The filter tab – controlled when defined */
  filter?: CommentsFilter;
  defaultFilter?: CommentsFilter;
  onFilterChange?: (filter: CommentsFilter) => void;
  /** Shows a close button in the header */
  onClose?: () => void;
};

const NONE: string[] = [];

export function CommentsPanel({ title = "Comments", onCommentsChange, resolved, defaultResolved = NONE, onResolvedChange, filter, defaultFilter = "all", onFilterChange, onClose, ...props }: CommentsPanelProps) {
  const r = useControlled(resolved, defaultResolved, onResolvedChange);
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(RawCommentsPanel, {
    ...props,
    heading: title,
    resolved: r.value,
    filter: f.value,
    closable: !!onClose,
    onTcCommentsChange: (e: CustomEvent<{ comments: PanelComment[] }>) => onCommentsChange?.(e.detail.comments),
    onTcResolvedChange: (e: CustomEvent<{ resolved: string[] }>) => r.handler(e.detail.resolved, e),
    onTcFilterChange: (e: CustomEvent<{ filter: CommentsFilter }>) => f.handler(e.detail.filter, e),
    onTcClose: () => onClose?.(),
  });
}
