import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentCursors, type AgentFollowingChange, type AgentTabChange, type CursorAgent as ElementAgent, type DocComment, type DocSuggestion } from "../agent-cursors";
import { h, isNode, useControlled, useStaged } from "./internal";

export { acceptSuggestion } from "../agent-cursors";
export type { AgentCursor, DocBlock, DocComment, DocSuggestion, DocTab } from "../agent-cursors";

/** React nodes in place of elements: the avatar */
export type CursorAgent = Omit<ElementAgent, "avatar"> & { avatar?: React.ReactNode };

const RawAgentCursors = createComponent({
  tagName: "tc-agent-cursors",
  elementClass: TcAgentCursors,
  react: React,
  events: {
    onTcFollowingChange: "tc-following-change" as EventName<CustomEvent<AgentFollowingChange>>,
    onTcTabChange: "tc-tab-change" as EventName<CustomEvent<AgentTabChange>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<DocSuggestion>>,
    onTcReject: "tc-reject" as EventName<CustomEvent<DocSuggestion>>,
    onTcAcceptAll: "tc-accept-all" as EventName<CustomEvent<null>>,
    onTcResolve: "tc-resolve" as EventName<CustomEvent<DocComment>>,
  },
});
type RawAgentCursorsProps = React.ComponentProps<typeof RawAgentCursors>;
export type AgentCursorsProps = Omit<
  RawAgentCursorsProps,
  | "agents"
  | "following"
  | "tab"
  | "heading"
  | "canAccept"
  | "canReject"
  | "canAcceptAll"
  | "canResolve"
  | "onTcFollowingChange"
  | "onTcTabChange"
  | "onTcAccept"
  | "onTcReject"
  | "onTcAcceptAll"
  | "onTcResolve"
> & {
  /** The agents in the document; `avatar` takes a React node */
  agents: CursorAgent[];
  /** Resolves a comment – the black check in its window */
  onResolveComment?: (comment: DocComment) => void;
  /** Accepts a suggestion – shows Accept in its window; write the change in with `acceptSuggestion` */
  onAccept?: (suggestion: DocSuggestion) => void;
  /** Rejects a suggestion – shows Reject in its window */
  onReject?: (suggestion: DocSuggestion) => void;
  /** Shows "Accept all" in the header; it is disabled while there are no suggestions */
  onAcceptAll?: () => void;
  /** The agent you follow (the others fade back). Controlled when defined (null = nobody) */
  following?: string | null;
  /** The agent followed at first, when `following` is not controlled */
  defaultFollowing?: string | null;
  /** Called when a face is clicked to follow an agent, or to stop (null) */
  onFollowingChange?: (agent: string | null) => void;
  /** The open tab. Controlled when defined; otherwise the component keeps it, starting from `defaultTab` */
  tab?: string;
  /** The tab open at first, when `tab` is not controlled – defaults to the first */
  defaultTab?: string;
  /** Called when another tab is picked */
  onTabChange?: (tab: string) => void;
  /** The document's title in the header (default "Untitled") */
  title?: string;
};

export function AgentCursors({
  agents,
  onResolveComment,
  onAccept,
  onReject,
  onAcceptAll,
  following,
  defaultFollowing = null,
  onFollowingChange,
  tab,
  defaultTab,
  onTabChange,
  title = "Untitled",
  ...props
}: AgentCursorsProps) {
  const { stage, els } = useStaged(agents.filter((a) => isNode(a.avatar)).map((a) => [a.id, a.avatar]));
  const elAgents = React.useMemo(() => agents.map((a) => (isNode(a.avatar) ? { ...a, avatar: els[a.id] } : a)) as ElementAgent[], [agents, els]);
  const f = useControlled<string | null>(following, defaultFollowing, onFollowingChange);
  const t = useControlled<string | undefined>(tab, defaultTab ?? props.tabs?.[0]?.id, onTabChange as ((tab: string | undefined) => void) | undefined);
  return h(React.Fragment, null, stage, h(RawAgentCursors, {
    ...props,
    agents: elAgents,
    heading: title,
    following: f.value,
    tab: t.value,
    canAccept: !!onAccept,
    canReject: !!onReject,
    canAcceptAll: !!onAcceptAll,
    canResolve: !!onResolveComment,
    onTcFollowingChange: (e: CustomEvent<AgentFollowingChange>) => f.handler(e.detail.following, e),
    onTcTabChange: (e: CustomEvent<AgentTabChange>) => t.handler(e.detail.tab, e),
    onTcAccept: (e: CustomEvent<DocSuggestion>) => onAccept?.(e.detail),
    onTcReject: (e: CustomEvent<DocSuggestion>) => onReject?.(e.detail),
    onTcAcceptAll: () => onAcceptAll?.(),
    onTcResolve: (e: CustomEvent<DocComment>) => onResolveComment?.(e.detail),
  }));
}
