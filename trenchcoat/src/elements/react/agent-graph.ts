import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentGraph, type GraphNode as ElementNode, type GraphPausedChange, type GraphSelect, type GraphSelectedChange } from "../agent-graph";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { GraphCall, GraphNodeKind, GraphNodeStatus } from "../agent-graph";
/** React nodes in place of elements: icons */
export type GraphNode = Omit<ElementNode, "icon"> & { icon?: React.ReactNode };

const RawAgentGraph = createComponent({
  tagName: "tc-agent-graph",
  elementClass: TcAgentGraph,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<GraphSelectedChange>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<GraphSelect>>,
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<GraphPausedChange>>,
  },
});
type RawAgentGraphProps = React.ComponentProps<typeof RawAgentGraph>;
export type AgentGraphProps = Omit<RawAgentGraphProps, "nodes" | "selected" | "paused" | "heading" | "onTcSelectedChange" | "onTcSelect" | "onTcPausedChange" | "onSelect"> & {
  /** The agents, tools and people in the graph; icons can be React nodes */
  nodes: GraphNode[];
  /** A click on a node – it also opens its card; null when the card closes */
  onSelect?: (node: GraphNode | null) => void;
  /** The node whose card is open. Controlled when defined (null = none); otherwise the component keeps it, starting
   *  from `defaultSelected`. Changes are reported to `onSelectedChange` (and `onSelect`, with the node) */
  selected?: string | null;
  /** The node whose card is open at first, when `selected` isn't set */
  defaultSelected?: string | null;
  /** Called with the node id when a card opens, and null when it closes */
  onSelectedChange?: (id: string | null) => void;
  /** Stops the moving parts – pulses, ripples, floating and the breathing rings – as the bar's Pause button does.
   *  Controlled when defined; otherwise the component keeps it, starting from `defaultPaused` */
  paused?: boolean;
  /** Whether the motion starts paused, when `paused` isn't set */
  defaultPaused?: boolean;
  /** Called when the Pause button is pressed, with the new paused state */
  onPausedChange?: (paused: boolean) => void;
  /** The heading in the bar, and the start of the graph's accessible name – "Agent graph" by default */
  title?: string;
};

export function AgentGraph({ nodes, onSelect, selected, defaultSelected = null, onSelectedChange, paused, defaultPaused = false, onPausedChange, title = "Agent graph", ...props }: AgentGraphProps) {
  const { stage, els } = useStaged(nodes.filter((n) => isNode(n.icon)).map((n) => [n.id, n.icon]));
  const elNodes = React.useMemo(() => nodes.map((n) => (isNode(n.icon) ? { ...n, icon: els[n.id] } : n)) as ElementNode[], [nodes, els]);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange);
  const p = useControlled(paused, defaultPaused, onPausedChange);
  return h(React.Fragment, null, stage, h(RawAgentGraph, {
    ...props,
    nodes: elNodes,
    heading: title,
    selected: s.value,
    paused: p.value,
    onTcSelectedChange: (e: CustomEvent<GraphSelectedChange>) => {
      // A node that goes away closes its card on its own – only an uncontrolled graph reports that
      if (e.detail.removed && s.controlled) e.preventDefault();
      else s.handler(e.detail.selected, e);
    },
    // onSelect hears the React node the app passed, icon and all
    onTcSelect: (e: CustomEvent<GraphSelect>) => onSelect?.(e.detail.node ? (byId.get(e.detail.node.id) ?? null) : null),
    onTcPausedChange: (e: CustomEvent<GraphPausedChange>) => p.handler(e.detail.paused, e),
  }));
}
