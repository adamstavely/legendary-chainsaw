import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcReviewCenter,
  type ReviewCenterHandle,
  type ReviewFilter,
  type ReviewItem as ElementItem,
  type ReviewResult,
  type ReviewSource as ElementSource,
  type ReviewStep as ElementStep,
} from "../review-center";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ReviewCenterHandle, ReviewField, ReviewFile, ReviewFilter, ReviewFlag, ReviewResult, ReviewRisk, ReviewText } from "../review-center";
/** React nodes in place of elements: the agent's mark, a step's tool icon, a source's icon */
export type ReviewStep = Omit<ElementStep, "icon"> & { icon?: React.ReactNode };
export type ReviewSource = Omit<ElementSource, "icon"> & { icon?: React.ReactNode };
export type ReviewItem = Omit<ElementItem, "icon" | "steps" | "sources"> & { icon?: React.ReactNode; steps?: ReviewStep[]; sources?: ReviewSource[] };

const RawReviewCenter = createComponent({
  tagName: "tc-review-center",
  elementClass: TcReviewCenter,
  react: React,
  events: {
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<{ filter: ReviewFilter }>>,
    onTcUndo: "tc-undo" as EventName<CustomEvent<{ item: ElementItem; result: ReviewResult }>>,
    onTcSkip: "tc-skip" as EventName<CustomEvent<{ item: ElementItem }>>,
  },
});
type RawReviewCenterProps = React.ComponentProps<typeof RawReviewCenter>;
type OwnProps = {
  /** Everything waiting for review – decided items hide themselves, new ids slide in */
  items: ReviewItem[];
  /** May return a promise – while it runs the decision shows as saving; a rejection puts the item back with the error */
  onDecide?: (item: ReviewItem, result: ReviewResult) => void | Promise<unknown>;
  /** A decision was taken back – put the item back if you dropped it from `items` */
  onUndo?: (item: ReviewItem, result: ReviewResult) => void;
  /** An item was skipped – it stays in the queue, marked “skipped”, and the next one opens */
  onSkip?: (item: ReviewItem) => void;
  /** Which items the queue shows (controlled): "all", "high" or "unsure" */
  filter?: ReviewFilter;
  /** The filter to start with when `filter` isn't given */
  defaultFilter?: ReviewFilter;
  /** Called with the filter the user picked */
  onFilterChange?: (filter: ReviewFilter) => void;
  /** The heading (default "Review center") */
  title?: string;
  /** The imperative handle (the element itself) */
  ref?: React.Ref<ReviewCenterHandle>;
};
export type ReviewCenterProps = Omit<RawReviewCenterProps, keyof OwnProps | "heading" | "onTcFilterChange" | "onTcUndo" | "onTcSkip"> & OwnProps;

export function ReviewCenter({ items, onDecide, onUndo, onSkip, filter, defaultFilter = "all", onFilterChange, title = "Review center", ref, ...props }: ReviewCenterProps) {
  // Icons given as React nodes render in the staging box; the element gets their DOM nodes
  const nodes: [string, React.ReactNode][] = [];
  for (const it of items) {
    if (isNode(it.icon)) nodes.push([`item:${it.id}`, it.icon]);
    it.steps?.forEach((st, i) => isNode(st.icon) && nodes.push([`step:${it.id}:${i}`, st.icon]));
    it.sources?.forEach((s, i) => isNode(s.icon) && nodes.push([`source:${it.id}:${i}`, s.icon]));
  }
  const { stage, els } = useStaged(nodes);
  const list = React.useMemo(
    () =>
      items.map((it) => ({
        ...it,
        icon: isNode(it.icon) ? els[`item:${it.id}`] : it.icon,
        steps: it.steps?.map((st, i) => ({ ...st, icon: isNode(st.icon) ? els[`step:${it.id}:${i}`] : st.icon })),
        sources: it.sources?.map((s, i) => ({ ...s, icon: isNode(s.icon) ? els[`source:${it.id}:${i}`] : s.icon })),
      })) as ElementItem[],
    [items, els],
  );
  // Callbacks get the app's own items back, with their React icons
  const byId = new Map(items.map((it) => [it.id, it]));
  const own = (it: ElementItem) => byId.get(it.id) ?? (it as ReviewItem);
  const f = useControlled(filter, defaultFilter, onFilterChange);
  return h(React.Fragment, null, stage, h(RawReviewCenter, {
    ...props,
    ref: ref as React.Ref<TcReviewCenter>,
    heading: title,
    items: list,
    filter: f.value,
    onDecide: onDecide ? (it: ElementItem, result: ReviewResult) => onDecide(own(it), result) : undefined,
    onTcFilterChange: (e: CustomEvent<{ filter: ReviewFilter }>) => f.handler(e.detail.filter, e),
    onTcUndo: (e: CustomEvent<{ item: ElementItem; result: ReviewResult }>) => onUndo?.(own(e.detail.item), e.detail.result),
    onTcSkip: (e: CustomEvent<{ item: ElementItem }>) => onSkip?.(own(e.detail.item)),
  }));
}
