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
  agents: CursorAgent[];
  /** Resolves a comment – the black check in its window */
  onResolveComment?: (comment: DocComment) => void;
  onAccept?: (suggestion: DocSuggestion) => void;
  onReject?: (suggestion: DocSuggestion) => void;
  /** Shows "Accept all" in the header when there is more than one suggestion */
  onAcceptAll?: () => void;
  /** The agent you follow (the others fade back). Controlled when defined (null = nobody) */
  following?: string | null;
  defaultFollowing?: string | null;
  onFollowingChange?: (agent: string | null) => void;
  /** The open tab. Controlled when defined; otherwise the component keeps it, starting from `defaultTab` */
  tab?: string;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
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
