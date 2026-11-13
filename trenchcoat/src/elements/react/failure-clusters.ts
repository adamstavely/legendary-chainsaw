import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcFailureClusters,
  type FailureCluster,
  type FailureClusterAction,
  type FailureClusterCriterionChange,
  type FailureClusterKnownChange,
  type FailureClusterOpenChange,
  type FailureClustersView,
  type FailureClusterViewChange,
} from "../failure-clusters";
import { h, useControlled } from "./internal";

export type { ClusterExample, ClusterTrend, FailureCluster, FailureClustersLabels, FailureClustersView } from "../failure-clusters";
export { clusterTrendWords, defaultFailureClustersLabels } from "../failure-clusters";

const RawFailureClusters = createComponent({
  tagName: "tc-failure-clusters",
  elementClass: TcFailureClusters,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<FailureClusterOpenChange>>,
    onTcKnownChange: "tc-known-change" as EventName<CustomEvent<FailureClusterKnownChange>>,
    onTcCriterionChange: "tc-criterion-change" as EventName<CustomEvent<FailureClusterCriterionChange>>,
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<FailureClusterViewChange>>,
    onTcClusterOpen: "tc-cluster-open" as EventName<CustomEvent<FailureClusterAction>>,
    onTcAddToDataset: "tc-add-to-dataset" as EventName<CustomEvent<FailureClusterAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFailureClusters>;
type Owned =
  | "heading"
  | "open"
  | "known"
  | "criterion"
  | "view"
  | "onTcOpenChange"
  | "onTcKnownChange"
  | "onTcCriterionChange"
  | "onTcViewChange"
  | "onTcClusterOpen"
  | "onTcAddToDataset"
  | "children";
export type FailureClustersProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The open cluster's id – controlled when given (null for none) */
  open?: string | null;
  /** The cluster open on mount when `open` isn't controlled */
  defaultOpen?: string | null;
  /** A cluster was opened or closed */
  onOpenChange?: (open: string | null) => void;
  /** The clusters marked as known – controlled when given */
  known?: string[];
  /** Known on mount when `known` isn't controlled */
  defaultKnown?: string[];
  /** Mark as known or Mark as new was pressed */
  onKnownChange?: (known: string[], id: string, isKnown: boolean) => void;
  /** The criterion filter – controlled when given (null for all) */
  criterion?: string | null;
  /** The filter on mount when `criterion` isn't controlled */
  defaultCriterion?: string | null;
  /** The criterion filter changed */
  onCriterionChange?: (criterion: string | null) => void;
  /** "list" or "bubbles" – controlled when given */
  view?: FailureClustersView;
  /** The view on mount when `view` isn't controlled */
  defaultView?: FailureClustersView;
  /** List or Bubbles was chosen */
  onViewChange?: (view: FailureClustersView) => void;
  /** Open chats was pressed */
  onClusterOpen?: (id: string, cluster: FailureCluster) => void;
  /** Add to dataset was pressed; return false to keep the cluster from showing as added */
  onAddToDataset?: (id: string, cluster: FailureCluster) => boolean | void;
};

export function FailureClusters({
  title,
  open,
  defaultOpen = null,
  onOpenChange,
  known,
  defaultKnown = [],
  onKnownChange,
  criterion,
  defaultCriterion = null,
  onCriterionChange,
  view,
  defaultView = "list",
  onViewChange,
  onClusterOpen,
  onAddToDataset,
  ...props
}: FailureClustersProps) {
  const o = useControlled<string | null>(open, defaultOpen, onOpenChange);
  const k = useControlled<string[]>(known, defaultKnown, undefined);
  const c = useControlled<string | null>(criterion, defaultCriterion, onCriterionChange);
  const v = useControlled<FailureClustersView>(view, defaultView, onViewChange);
  return h(RawFailureClusters, {
    ...props,
    heading: title ?? "Failure clusters",
    open: o.value,
    known: k.value,
    criterion: c.value,
    view: v.value,
    onTcOpenChange: (e: CustomEvent<FailureClusterOpenChange>) => o.handler(e.detail.open, e),
    onTcKnownChange: (e: CustomEvent<FailureClusterKnownChange>) => {
      k.handler(e.detail.known, e);
      onKnownChange?.(e.detail.known, e.detail.id, e.detail.isKnown);
    },
    onTcCriterionChange: (e: CustomEvent<FailureClusterCriterionChange>) => c.handler(e.detail.criterion, e),
    onTcViewChange: (e: CustomEvent<FailureClusterViewChange>) => v.handler(e.detail.view, e),
    onTcClusterOpen: (e: CustomEvent<FailureClusterAction>) => onClusterOpen?.(e.detail.id, e.detail.cluster),
    onTcAddToDataset: (e: CustomEvent<FailureClusterAction>) => {
      if (onAddToDataset?.(e.detail.id, e.detail.cluster) === false) e.preventDefault();
    },
  });
}
