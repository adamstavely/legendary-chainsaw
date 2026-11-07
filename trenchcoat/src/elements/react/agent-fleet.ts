import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentFleet, type AgentFleetAnswer as ElementAgentFleetAnswer, type AgentFleetOpenChange } from "../agent-fleet";
import type { AgentTreeResolution, TreeAgent as ElementTreeAgent } from "../agent-tree";
import type { TreeAgent } from "./agent-tree";
import { h, isNode, useControlled, useStaged } from "./internal";

export { fleetBranchSummary } from "../agent-fleet";

/** An agent and its sub-agents – the same shape as AgentTree's `root` */
export type FleetAgent = TreeAgent;
/** Answer was pressed on a card: the agent, and the agents in its branch that wait for you */
export type AgentFleetAnswer = { agent: FleetAgent; waiting: FleetAgent[] };

const RawAgentFleet = createComponent({
  tagName: "tc-agent-fleet",
  elementClass: TcAgentFleet,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<AgentFleetOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentFleet>;
export type AgentFleetProps = Omit<RawProps, "heading" | "agents" | "open" | "resolver" | "onAnswer" | "onTcOpenChange"> & {
  /** The top-level agents, each with its sub-agents nested in `children` */
  agents: FleetAgent[];
  /** The heading (default "Fleet") */
  title?: string;
  /** The id of the agent whose tree is open, or null. Controlled when defined; otherwise the component keeps it */
  open?: string | null;
  /** The agent open at first when `open` isn't controlled */
  defaultOpen?: string | null;
  /** Called with the id of the agent the user opened, or null when they closed it */
  onOpenChange?: (open: string | null) => void;
  /** Called when Answer is pressed on a card – the card's tree opens unless `open` is controlled */
  onAnswer?: (answer: AgentFleetAnswer) => void;
  /** An answer from an open tree's "needs you" or "failed" window. May return a promise: the buttons wait */
  onResolve?: (agent: FleetAgent, action: AgentTreeResolution) => void | Promise<unknown>;
};

export function AgentFleet({ agents, title = "Fleet", open, defaultOpen = null, onOpenChange, onAnswer, onResolve, ...props }: AgentFleetProps) {
  // Avatars and tool marks given as React nodes render in a hidden staging box; the element clones their DOM
  const marks: [string, React.ReactNode][] = [];
  const collect = (a: TreeAgent) => {
    if (isNode(a.avatar)) marks.push([`avatar:${a.id}`, a.avatar]);
    a.tools?.forEach((t, i) => isNode(t) && marks.push([`tool:${a.id}:${i}`, t]));
    a.children?.forEach(collect);
  };
  agents.forEach(collect);
  const { stage, els } = useStaged(marks);
  const { list, original } = React.useMemo(() => {
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
    return { list: agents.map(map), original };
  }, [agents, els]);
  const back = (a: ElementTreeAgent) => original.get(a.id) ?? (a as unknown as TreeAgent);
  const o = useControlled<string | null>(open, defaultOpen, onOpenChange);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawAgentFleet, {
      ...props,
      heading: title,
      agents: list,
      open: o.value,
      resolver: onResolve ? (agent: ElementTreeAgent, action: AgentTreeResolution) => onResolve(back(agent), action) : undefined,
      onAnswer: onAnswer ? (d: ElementAgentFleetAnswer) => onAnswer({ agent: back(d.agent), waiting: d.waiting.map(back) }) : undefined,
      onTcOpenChange: (e: CustomEvent<AgentFleetOpenChange>) => o.handler(e.detail.open, e),
    }),
  );
}
