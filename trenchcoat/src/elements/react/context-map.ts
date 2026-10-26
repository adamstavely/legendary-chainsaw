import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcContextMap,
  type ContextAgent as ElementAgent,
  type ContextAgentChange,
  type ContextBlock as ElementBlock,
  type ContextCompaction as ElementCompaction,
  type ContextMapView,
  type ContextViewChange,
} from "../context-map";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ContextFate, ContextKind } from "../context-map";

/** React nodes in place of elements: icons and logos */
export type ContextBlock = Omit<ElementBlock, "icon" | "items"> & { icon?: React.ReactNode; items?: { label: string; icon?: React.ReactNode }[] };
export type ContextAgent = Omit<ElementAgent, "icon"> & { icon?: React.ReactNode };
export type ContextCompaction = Omit<ElementCompaction, "before"> & { before: ContextBlock[] };

const RawContextMap = createComponent({
  tagName: "tc-context-map",
  elementClass: TcContextMap,
  react: React,
  events: {
    onTcAgentChange: "tc-agent-change" as EventName<CustomEvent<ContextAgentChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<ContextViewChange>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<ElementBlock | null>>,
  },
});
type RawContextMapProps = React.ComponentProps<typeof RawContextMap>;
export type ContextMapProps = Omit<
  RawContextMapProps,
  "blocks" | "agents" | "agent" | "compaction" | "view" | "heading" | "modelIcon" | "onSelect" | "onTcAgentChange" | "onTcViewChange" | "onTcSelect"
> & {
  /** In the order they should sit – the free space always comes last */
  blocks: ContextBlock[];
  /** The context window's size in tokens – e.g. 200000 */
  limit: number;
  /** The model maker's logo – on a small white tile before the model */
  modelIcon?: React.ReactNode;
  /** Agents to switch between – the bar shows the current one's name as a menu */
  agents?: ContextAgent[];
  /** The current agent's id. Controlled when defined */
  agent?: string;
  /** The agent shown first when `agent` isn't controlled – defaults to the first one */
  defaultAgent?: string;
  /** Called with the picked agent's id, controlled or not */
  onAgentChange?: (id: string) => void;
  /** The last compaction, to compare before and after – null shows the line for it while there's none yet */
  compaction?: ContextCompaction | null;
  /** Which side of the compaction shows. Controlled when defined */
  view?: ContextMapView;
  /** The side shown first when `view` isn't controlled; a new compaction shows "after" again */
  defaultView?: ContextMapView;
  /** Called with the new side on every switch, controlled or not */
  onViewChange?: (view: ContextMapView) => void;
  /** Called when a tile is clicked, with the block as you passed it – null for the free space */
  onSelect?: (block: ContextBlock | null) => void;
  /** The title in the bar, and the map's accessible name – "Context" by default */
  title?: string;
};

export function ContextMap({ blocks, agents, agent, defaultAgent, onAgentChange, compaction, view, defaultView = "after", onViewChange, onSelect, modelIcon, title = "Context", ...props }: ContextMapProps) {
  // Every icon given as a React node renders once in the staging box; the element clones its DOM node
  const nodes = new Map<string, React.ReactNode>();
  const stageBlock = (b: ContextBlock) => {
    if (isNode(b.icon) && !nodes.has(`b:${b.id}`)) nodes.set(`b:${b.id}`, b.icon);
    b.items?.forEach((it, i) => isNode(it.icon) && !nodes.has(`i:${b.id}:${i}`) && nodes.set(`i:${b.id}:${i}`, it.icon));
  };
  blocks.forEach(stageBlock);
  compaction?.before.forEach(stageBlock);
  agents?.forEach((a) => isNode(a.icon) && nodes.set(`a:${a.id}`, a.icon));
  if (isNode(modelIcon)) nodes.set("model", modelIcon);
  const { stage, els } = useStaged([...nodes]);
  const icon = (key: string, v: React.ReactNode) => (isNode(v) ? els[key] : (v as Element | undefined));
  const toBlock = (b: ContextBlock): ElementBlock => ({ ...b, icon: icon(`b:${b.id}`, b.icon), items: b.items?.map((it, i) => ({ ...it, icon: icon(`i:${b.id}:${i}`, it.icon) })) });
  // The blocks as you passed them, by the element's copy – onSelect hands back yours
  const original = new Map<ElementBlock, ContextBlock>();
  const elBlocks = blocks.map((b) => {
    const e = toBlock(b);
    original.set(e, b);
    return e;
  });
  const elCompaction = compaction ? { ...compaction, before: compaction.before.map((b) => {
    const e = toBlock(b);
    original.set(e, b);
    return e;
  }) } : compaction;
  const elAgents = agents?.map((a) => ({ ...a, icon: icon(`a:${a.id}`, a.icon) }));

  const a = useControlled<string | undefined>(agent, defaultAgent, onAgentChange && ((id) => id !== undefined && onAgentChange(id)));
  const v = useControlled(view, defaultView, onViewChange);
  return h(React.Fragment, null, stage, h(RawContextMap, {
    ...props,
    heading: title,
    blocks: elBlocks,
    compaction: elCompaction,
    agents: elAgents,
    agent: a.value,
    view: v.value,
    modelIcon: icon("model", modelIcon),
    onTcAgentChange: (e: CustomEvent<ContextAgentChange>) => a.handler(e.detail.agent, e),
    onTcViewChange: (e: CustomEvent<ContextViewChange>) => {
      // A new compaction shows "after" again – unless the app controls the view
      if (e.detail.reset && v.controlled) e.preventDefault();
      else v.handler(e.detail.view, e);
    },
    onTcSelect: (e: CustomEvent<ElementBlock | null>) => onSelect?.(e.detail ? (original.get(e.detail) ?? (e.detail as ContextBlock)) : null),
  }));
}
