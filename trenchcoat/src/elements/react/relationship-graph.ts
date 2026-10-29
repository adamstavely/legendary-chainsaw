import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcRelationshipGraph,
  type RelationDepthChange,
  type RelationEgoChange,
  type RelationKindsChange,
  type RelationNode,
  type RelationSelectedChange,
} from "../relationship-graph";
import { h, useControlled } from "./internal";

export type { RelationEdge, RelationNode, RelationSelectedChange } from "../relationship-graph";

const RawRelationshipGraph = createComponent({
  tagName: "tc-relationship-graph",
  elementClass: TcRelationshipGraph,
  react: React,
  events: {
    onTcEgoChange: "tc-ego-change" as EventName<CustomEvent<RelationEgoChange>>,
    onTcDepthChange: "tc-depth-change" as EventName<CustomEvent<RelationDepthChange>>,
    onTcKindsChange: "tc-kinds-change" as EventName<CustomEvent<RelationKindsChange>>,
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RelationSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRelationshipGraph>;
type Owned = "heading" | "ego" | "depth" | "kinds" | "selected" | "onTcEgoChange" | "onTcDepthChange" | "onTcKindsChange" | "onTcSelectedChange" | "children";
export type RelationshipGraphProps = Omit<RawProps, Owned> & {
  /** The heading, and the graph's name */
  title?: string;
  /** The node in the middle – controlled when given */
  ego?: string | null;
  /** The node in the middle on mount when `ego` isn't controlled; by default the first person */
  defaultEgo?: string | null;
  /** A node was put in the middle */
  onEgoChange?: (ego: string, node: RelationNode) => void;
  /** 1 (direct) or 2 (their connections too) – controlled when given */
  depth?: 1 | 2;
  /** The depth on mount when `depth` isn't controlled */
  defaultDepth?: 1 | 2;
  /** The depth changed */
  onDepthChange?: (depth: 1 | 2) => void;
  /** The kinds shown, empty for all – controlled when given */
  kinds?: string[];
  /** The kinds shown on mount when `kinds` isn't controlled */
  defaultKinds?: string[];
  /** A kind was shown or hidden */
  onKindsChange?: (kinds: string[]) => void;
  /** What's selected: a node id, "edge:<id>" or null – controlled when given */
  selected?: string | null;
  /** The selection on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A node or relationship was selected, or nothing */
  onSelectedChange?: (selected: string | null, detail: RelationSelectedChange) => void;
};

const ALL: string[] = [];

export function RelationshipGraph({
  title,
  ego,
  defaultEgo = null,
  onEgoChange,
  depth,
  defaultDepth = 1,
  onDepthChange,
  kinds,
  defaultKinds = ALL,
  onKindsChange,
  selected,
  defaultSelected = null,
  onSelectedChange,
  ...props
}: RelationshipGraphProps) {
  const node = React.useRef<RelationNode | null>(null);
  const detail = React.useRef<RelationSelectedChange | null>(null);
  const eg = useControlled<string | null>(ego, defaultEgo, onEgoChange ? (next) => next && node.current && onEgoChange(next, node.current) : undefined);
  const d = useControlled<1 | 2>(depth, defaultDepth, onDepthChange);
  const k = useControlled<string[]>(kinds, defaultKinds, onKindsChange);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => detail.current && onSelectedChange(next, detail.current) : undefined);
  return h(RawRelationshipGraph, {
    ...props,
    heading: title ?? "Relationships",
    ego: eg.value,
    depth: d.value,
    kinds: k.value,
    selected: s.value,
    onTcEgoChange: (e: CustomEvent<RelationEgoChange>) => {
      node.current = e.detail.node;
      eg.handler(e.detail.ego, e);
    },
    onTcDepthChange: (e: CustomEvent<RelationDepthChange>) => d.handler(e.detail.depth, e),
    onTcKindsChange: (e: CustomEvent<RelationKindsChange>) => k.handler(e.detail.kinds, e),
    onTcSelectedChange: (e: CustomEvent<RelationSelectedChange>) => {
      detail.current = e.detail;
      s.handler(e.detail.selected, e);
    },
  });
}
