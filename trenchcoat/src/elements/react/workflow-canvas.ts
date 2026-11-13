import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcWorkflowCanvas,
  type WorkflowAddRequest,
  type WorkflowEdge,
  type WorkflowEdgesChange,
  type WorkflowNode,
  type WorkflowNodesChange,
  type WorkflowSelectedChange,
  type WorkflowView,
  type WorkflowViewChange,
} from "../workflow-canvas";
import { h, useControlled } from "./internal";

export type {
  WorkflowAddRequest,
  WorkflowEdge,
  WorkflowEdgesChange,
  WorkflowKind,
  WorkflowKindInfo,
  WorkflowNode,
  WorkflowNodesChange,
  WorkflowSelectedChange,
  WorkflowStatus,
  WorkflowView,
} from "../workflow-canvas";
export { WORKFLOW_NODE_H, WORKFLOW_NODE_W, defaultWorkflowKinds, defaultWorkflowStatusLabels, workflowEdgePath } from "../workflow-canvas";

const RawWorkflowCanvas = createComponent({
  tagName: "tc-workflow-canvas",
  elementClass: TcWorkflowCanvas,
  react: React,
  events: {
    onTcNodesChange: "tc-nodes-change" as EventName<CustomEvent<WorkflowNodesChange>>,
    onTcEdgesChange: "tc-edges-change" as EventName<CustomEvent<WorkflowEdgesChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<WorkflowSelectedChange>>,
    onTcAddRequest: "tc-add-request" as EventName<CustomEvent<WorkflowAddRequest>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<WorkflowViewChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawWorkflowCanvas>;
type Owned =
  | "heading"
  | "nodes"
  | "edges"
  | "selected"
  | "view"
  | "onTcNodesChange"
  | "onTcEdgesChange"
  | "onTcSelectedChange"
  | "onTcAddRequest"
  | "onTcViewChange"
  | "children";
export type WorkflowCanvasProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The steps – controlled when given */
  nodes?: WorkflowNode[];
  /** The steps on mount when `nodes` isn't controlled */
  defaultNodes?: WorkflowNode[];
  /** A step was moved or removed */
  onNodesChange?: (nodes: WorkflowNode[], detail: WorkflowNodesChange) => void;
  /** The connectors – controlled when given */
  edges?: WorkflowEdge[];
  /** The connectors on mount when `edges` isn't controlled */
  defaultEdges?: WorkflowEdge[];
  /** Steps were connected or disconnected */
  onEdgesChange?: (edges: WorkflowEdge[], detail: WorkflowEdgesChange) => void;
  /** The selected step – controlled when given (null for none) */
  selected?: string | null;
  /** The step selected on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A step was selected, or the selection cleared */
  onSelectedChange?: (selected: string | null, node: WorkflowNode | null) => void;
  /** Canvas or list – controlled when given */
  view?: WorkflowView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: WorkflowView;
  /** The canvas or the list was chosen */
  onViewChange?: (view: WorkflowView) => void;
  /** Add step was asked for, after this step (null: at the start) – open a step picker */
  onAddRequest?: (after: string | null) => void;
};

export function WorkflowCanvas({
  title,
  nodes,
  defaultNodes = [],
  onNodesChange,
  edges,
  defaultEdges = [],
  onEdgesChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  view,
  defaultView = "canvas",
  onViewChange,
  onAddRequest,
  ...props
}: WorkflowCanvasProps) {
  const detail = React.useRef<{ nodes?: WorkflowNodesChange; edges?: WorkflowEdgesChange; node?: WorkflowNode | null }>({});
  const n = useControlled<WorkflowNode[]>(nodes, defaultNodes, onNodesChange ? (next) => onNodesChange(next, detail.current.nodes!) : undefined);
  const e = useControlled<WorkflowEdge[]>(edges, defaultEdges, onEdgesChange ? (next) => onEdgesChange(next, detail.current.edges!) : undefined);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, detail.current.node ?? null) : undefined);
  const v = useControlled<WorkflowView>(view, defaultView, onViewChange);
  return h(RawWorkflowCanvas, {
    ...props,
    heading: title ?? "Workflow",
    nodes: n.value,
    edges: e.value,
    selected: s.value,
    view: v.value,
    onTcNodesChange: (ev: CustomEvent<WorkflowNodesChange>) => {
      detail.current.nodes = ev.detail;
      n.handler(ev.detail.nodes, ev);
    },
    onTcEdgesChange: (ev: CustomEvent<WorkflowEdgesChange>) => {
      detail.current.edges = ev.detail;
      e.handler(ev.detail.edges, ev);
    },
    onTcSelectedChange: (ev: CustomEvent<WorkflowSelectedChange>) => {
      detail.current.node = ev.detail.node;
      s.handler(ev.detail.selected, ev);
    },
    onTcViewChange: (ev: CustomEvent<WorkflowViewChange>) => v.handler(ev.detail.view, ev),
    onTcAddRequest: (ev: CustomEvent<WorkflowAddRequest>) => onAddRequest?.(ev.detail.after),
  });
}
