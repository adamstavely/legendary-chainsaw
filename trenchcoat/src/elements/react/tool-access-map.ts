import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcToolAccessMap,
  type ToolAccessAgent as ElementAgent,
  type ToolAccessAgentIdChange,
  type ToolAccessCall,
  type ToolAccessReplay,
  type ToolAccessSelectedChange,
  type ToolAccessTool as ElementTool,
} from "../tool-access-map";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ToolAccessAgentStatus, ToolAccessAgentTab, ToolAccessCall, ToolAccessCallStatus, ToolAccessFeedCall, ToolAccessState } from "../tool-access-map";
export { defaultToolAccessAgentLabels } from "../tool-access-map";
/** Icons can be React nodes as well as elements */
export type ToolAccessTool = Omit<ElementTool, "icon"> & { icon?: React.ReactNode | Element };
export type ToolAccessAgent = Omit<ElementAgent, "icon"> & { icon?: React.ReactNode | Element };

const RawToolAccessMap = createComponent({
  tagName: "tc-tool-access-map",
  elementClass: TcToolAccessMap,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ToolAccessSelectedChange>>,
    onTcAgentIdChange: "tc-agent-id-change" as EventName<CustomEvent<ToolAccessAgentIdChange>>,
    onTcReplay: "tc-replay" as EventName<CustomEvent<ToolAccessReplay>>,
  },
});
type RawProps = React.ComponentProps<typeof RawToolAccessMap>;
type Owned = "heading" | "agent" | "tools" | "selected" | "agentId" | "onReplay" | "onTcSelectedChange" | "onTcAgentIdChange" | "onTcReplay" | "children";
export type ToolAccessMapProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The agent in the middle; its icon can be a React node */
  agent?: ToolAccessAgent | null;
  /** Every tool it can reach, clockwise from the top; icons can be React nodes */
  tools: ToolAccessTool[];
  /** The open tool – controlled when given (null for none) */
  selected?: string | null;
  /** The tool open on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A tool was opened or closed */
  onSelectedChange?: (selected: string | null, tool: ToolAccessTool | null) => void;
  /** The chosen agent tab – controlled when given */
  agentId?: string | null;
  /** The agent tab chosen on mount when `agentId` isn't controlled */
  defaultAgentId?: string | null;
  /** An agent tab was chosen */
  onAgentIdChange?: (agentId: string | null) => void;
  /** Replay was pressed on a call. May return a promise: the button is busy until it settles */
  onReplay?: (tool: ToolAccessTool, call: ToolAccessCall) => unknown;
};

export function ToolAccessMap({ title, agent, tools, selected, defaultSelected = null, onSelectedChange, agentId, defaultAgentId = null, onAgentIdChange, onReplay, ...props }: ToolAccessMapProps) {
  const staged: [string, React.ReactNode][] = tools.filter((t) => isNode(t.icon)).map((t) => [t.id, t.icon as React.ReactNode]);
  if (agent && isNode(agent.icon)) staged.push(["__agent", agent.icon as React.ReactNode]);
  const { stage, els } = useStaged(staged);
  const elTools = React.useMemo(() => tools.map((t) => (isNode(t.icon) ? { ...t, icon: els[t.id] } : t)) as ElementTool[], [tools, els]);
  const elAgent = React.useMemo(() => (agent ? ((isNode(agent.icon) ? { ...agent, icon: els.__agent } : agent) as ElementAgent) : null), [agent, els]);
  const byId = new Map(tools.map((t) => [t.id, t]));
  const tool = React.useRef<ToolAccessTool | null>(null);
  const report = React.useCallback((next: string | null) => onSelectedChange?.(next, tool.current), [onSelectedChange]);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? report : undefined);
  const a = useControlled<string | null>(agentId, defaultAgentId, onAgentIdChange);
  return h(React.Fragment, null, stage, h(RawToolAccessMap, {
    ...props,
    heading: title ?? "Tool access",
    agent: elAgent,
    tools: elTools,
    selected: s.value,
    agentId: a.value,
    // The page's own tool, icon and all
    onReplay: onReplay ? (t: ElementTool, call: ToolAccessCall) => onReplay(byId.get(t.id) ?? (t as ToolAccessTool), call) : undefined,
    onTcSelectedChange: (e: CustomEvent<ToolAccessSelectedChange>) => {
      tool.current = e.detail.selected ? (byId.get(e.detail.selected) ?? null) : null;
      s.handler(e.detail.selected, e);
    },
    onTcAgentIdChange: (e: CustomEvent<ToolAccessAgentIdChange>) => a.handler(e.detail.agentId, e),
  }));
}
