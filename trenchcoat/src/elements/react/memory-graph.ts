import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcMemoryGraph,
  type MemoryGraphAction,
  type MemoryGraphAgent as ElementAgent,
  type MemoryGraphArtifact as ElementArtifact,
  type MemoryGraphMemoriesChange,
  type MemoryGraphMemory as ElementMemory,
  type MemoryGraphSelectedChange,
  type MemoryGraphTool as ElementTool,
  type MemoryGraphToolsChange,
} from "../memory-graph";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { MemoryGraphAction, MemoryGraphSourceKind } from "../memory-graph";
export { defaultMemoryGraphKindLabels, MEMORY_GRAPH_MORE } from "../memory-graph";
/** Icons can be React nodes as well as elements */
export type MemoryGraphArtifact = Omit<ElementArtifact, "icon"> & { icon?: React.ReactNode | Element };
export type MemoryGraphMemory = Omit<ElementMemory, "artifact"> & { artifact?: MemoryGraphArtifact };
export type MemoryGraphTool = Omit<ElementTool, "icon"> & { icon?: React.ReactNode | Element };
export type MemoryGraphAgent = Omit<ElementAgent, "icon"> & { icon?: React.ReactNode | Element };

const RawMemoryGraph = createComponent({
  tagName: "tc-memory-graph",
  elementClass: TcMemoryGraph,
  react: React,
  events: {
    onTcMemoriesChange: "tc-memories-change" as EventName<CustomEvent<MemoryGraphMemoriesChange>>,
    onTcToolsChange: "tc-tools-change" as EventName<CustomEvent<MemoryGraphToolsChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<MemoryGraphSelectedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<MemoryGraphAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawMemoryGraph>;
type Owned = "heading" | "agent" | "memories" | "tools" | "selected" | "onTcMemoriesChange" | "onTcToolsChange" | "onTcSelectedChange" | "onTcAction" | "children";
export type MemoryGraphProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The agent in the middle; its icon can be a React node */
  agent?: MemoryGraphAgent | null;
  /** What it remembers – controlled when given. Ids are unique across memories and tools */
  memories?: MemoryGraphMemory[];
  /** The memories to start with when `memories` isn't controlled */
  defaultMemories?: MemoryGraphMemory[];
  /** Called with the whole list after a memory is switched, forgotten or brought back – in both modes */
  onMemoriesChange?: (memories: MemoryGraphMemory[]) => void;
  /** The tools it can reach – controlled when given */
  tools?: MemoryGraphTool[];
  /** The tools to start with when `tools` isn't controlled */
  defaultTools?: MemoryGraphTool[];
  /** Called with the whole list after a tool is switched – in both modes */
  onToolsChange?: (tools: MemoryGraphTool[]) => void;
  /** The card whose details are open – controlled when given (null for none) */
  selected?: string | null;
  /** The card open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A card's details were opened or closed */
  onSelectedChange?: (selected: string | null) => void;
  /** Add a file or Connect a tool was chosen on the agent */
  onAction?: (id: MemoryGraphAction["id"]) => void;
};

const NONE: never[] = [];

export function MemoryGraph({
  title,
  agent,
  memories,
  defaultMemories = NONE,
  onMemoriesChange,
  tools,
  defaultTools = NONE,
  onToolsChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  onAction,
  ...props
}: MemoryGraphProps) {
  const m = useControlled<MemoryGraphMemory[]>(memories, defaultMemories, onMemoriesChange);
  const t = useControlled<MemoryGraphTool[]>(tools, defaultTools, onToolsChange);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange);
  // The page's own items, React icons and all, by id – the element hands back copies that hold staged elements
  const pageMemories = React.useMemo(() => new Map(m.value.map((x) => [x.id, x])), [m.value]);
  const pageTools = React.useMemo(() => new Map(t.value.map((x) => [x.id, x])), [t.value]);
  const staged: [string, React.ReactNode][] = [
    ...m.value.filter((x) => isNode(x.artifact?.icon)).map((x): [string, React.ReactNode] => [`m:${x.id}`, x.artifact!.icon as React.ReactNode]),
    ...t.value.filter((x) => isNode(x.icon)).map((x): [string, React.ReactNode] => [`t:${x.id}`, x.icon as React.ReactNode]),
  ];
  if (agent && isNode(agent.icon)) staged.push(["__agent", agent.icon as React.ReactNode]);
  const { stage, els } = useStaged(staged);
  const elMemories = React.useMemo(
    () => m.value.map((x) => (x.artifact && isNode(x.artifact.icon) ? { ...x, artifact: { ...x.artifact, icon: els[`m:${x.id}`] } } : x)) as ElementMemory[],
    [m.value, els],
  );
  const elTools = React.useMemo(() => t.value.map((x) => (isNode(x.icon) ? { ...x, icon: els[`t:${x.id}`] } : x)) as ElementTool[], [t.value, els]);
  const elAgent = React.useMemo(() => (agent ? ((isNode(agent.icon) ? { ...agent, icon: els.__agent } : agent) as ElementAgent) : null), [agent, els]);
  // Back to the page's own shapes: its own icon, with the element's switch applied
  const ownMemory = (x: ElementMemory): MemoryGraphMemory => {
    const own = pageMemories.get(x.id);
    return own ? { ...own, off: x.off } : (x as MemoryGraphMemory);
  };
  const ownTool = (x: ElementTool): MemoryGraphTool => {
    const own = pageTools.get(x.id);
    return own ? { ...own, off: x.off } : (x as MemoryGraphTool);
  };
  const forgotten = React.useRef(new Map<string, MemoryGraphMemory>());
  return h(
    React.Fragment,
    null,
    stage,
    h(RawMemoryGraph, {
      ...props,
      heading: title ?? "Memory",
      agent: elAgent,
      memories: elMemories,
      tools: elTools,
      selected: s.value,
      onTcMemoriesChange: (e: CustomEvent<MemoryGraphMemoriesChange>) => {
        // A forgotten memory is kept here, so Undo brings back the page's own copy
        if (e.detail.change === "forgotten") forgotten.current.set(e.detail.memory.id, pageMemories.get(e.detail.memory.id) ?? (e.detail.memory as MemoryGraphMemory));
        const next = e.detail.memories.map((x) => (pageMemories.has(x.id) ? ownMemory(x) : (forgotten.current.get(x.id) ?? (x as MemoryGraphMemory))));
        m.handler(next, e);
      },
      onTcToolsChange: (e: CustomEvent<MemoryGraphToolsChange>) => t.handler(e.detail.tools.map(ownTool), e),
      onTcSelectedChange: (e: CustomEvent<MemoryGraphSelectedChange>) => s.handler(e.detail.selected, e),
      onTcAction: (e: CustomEvent<MemoryGraphAction>) => onAction?.(e.detail.id),
    }),
  );
}
