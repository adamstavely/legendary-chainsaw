import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentTree, type AgentTreeResolution, type TreeAgent as ElementTreeAgent } from "../agent-tree";
import { h, isNode, useStaged } from "./internal";

export type { TreeAgentStatus } from "../agent-tree";

/** React nodes in place of elements: the avatar and the tool marks */
export type TreeAgent = Omit<ElementTreeAgent, "avatar" | "tools" | "children"> & {
  /** A small mark, e.g. the model maker's logo – defaults to the initials */
  avatar?: React.ReactNode;
  /** Marks of the tools it works with, e.g. GitHub and Stripe – shown as small overlapping tiles */
  tools?: React.ReactNode[];
  children?: TreeAgent[];
};

const RawAgentTree = createComponent({
  tagName: "tc-agent-tree",
  elementClass: TcAgentTree,
  react: React,
  events: {
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<{ collapsed: string[] }>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<{ agent: ElementTreeAgent }>>,
  },
});
type RawAgentTreeProps = React.ComponentProps<typeof RawAgentTree>;
export type AgentTreeProps = Omit<RawAgentTreeProps, "root" | "heading" | "collapsed" | "resolver" | "selectable" | "onTcCollapsedChange" | "onTcSelect" | "onSelect"> & {
  /** The orchestrator, with its sub-agents nested in `children` – the whole run as one tree */
  root: TreeAgent;
  /** Ids of folded branches. Controlled when defined; otherwise the component keeps them, starting from
   *  `defaultCollapsed` */
  collapsed?: string[];
  /** Ids of the branches folded at first when `collapsed` isn't controlled */
  defaultCollapsed?: string[];
  /** Called with every folded branch's id after a branch is folded or unfolded */
  onCollapsedChange?: (collapsed: string[]) => void;
  /** An answer from the "needs you" or "failed" window: approve or reject a waiting agent, retry or dismiss a failed
   *  one. May return a promise: the answer's buttons wait, and if it rejects the window stays open and says so */
  onResolve?: (agent: TreeAgent, action: AgentTreeResolution) => void | Promise<unknown>;
  /** A click on a card – e.g. to open its log */
  onSelect?: (agent: TreeAgent) => void;
  /** The heading, and the tree list's name (default "Agents") */
  title?: string;
};

const NONE: string[] = [];

export function AgentTree({ root, collapsed, defaultCollapsed = NONE, onCollapsedChange, onResolve, onSelect, title = "Agents", ...props }: AgentTreeProps) {
  // Avatars and tool marks given as React nodes render in a hidden staging box; the element clones their DOM
  const marks: [string, React.ReactNode][] = [];
  const collect = (a: TreeAgent) => {
    if (isNode(a.avatar)) marks.push([`avatar:${a.id}`, a.avatar]);
    a.tools?.forEach((t, i) => isNode(t) && marks.push([`tool:${a.id}:${i}`, t]));
    a.children?.forEach(collect);
  };
  collect(root);
  const { stage, els } = useStaged(marks);
  // The element's agents, and the wrapper's agent each one came from (callbacks get the agent they were given)
  const { tree, original } = React.useMemo(() => {
    const original = new Map<string, TreeAgent>();
    const map = (a: TreeAgent): ElementTreeAgent => {
      original.set(a.id, a);
      const { avatar, tools, children, ...rest } = a;
      return {
        ...rest,
        avatar: isNode(avatar) ? els[`avatar:${a.id}`] : (avatar as Element | undefined),
        tools: tools?.map((t, i) => (isNode(t) ? els[`tool:${a.id}:${i}`] : (t as Element | undefined))).filter((t): t is Element => !!t),
        children: children?.map(map),
      };
    };
    return { tree: map(root), original };
  }, [root, els]);
  // Uncontrolled: the element keeps the folds; the wrapper passes back the last ones it reported
  const last = React.useRef(defaultCollapsed);
  return h(React.Fragment, null, stage, h(RawAgentTree, {
    ...props,
    root: tree,
    heading: title,
    collapsed: collapsed ?? last.current,
    selectable: !!onSelect,
    resolver: onResolve ? (agent: ElementTreeAgent, action: AgentTreeResolution) => onResolve(original.get(agent.id) ?? (agent as TreeAgent), action) : undefined,
    onTcCollapsedChange: (e: CustomEvent<{ collapsed: string[] }>) => {
      if (collapsed !== undefined) e.preventDefault();
      else last.current = e.detail.collapsed;
      onCollapsedChange?.(e.detail.collapsed);
    },
    onTcSelect: onSelect ? (e: CustomEvent<{ agent: ElementTreeAgent }>) => onSelect(original.get(e.detail.agent.id) ?? (e.detail.agent as TreeAgent)) : undefined,
  }));
}
