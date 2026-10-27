import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCoverFlow, type CoverFlowIndexChange, type CoverFlowItem as ElementItem, type CoverFlowSelect } from "../cover-flow";
import { h, isNode, useControlled, useStaged } from "./internal";

/** A cover: an image URL, or any React content as `cover` */
export type CoverFlowItem = Omit<ElementItem, "cover"> & {
  /** Any content instead of an image: artwork, a video, a product card */
  cover?: React.ReactNode;
};

const RawCoverFlow = createComponent({
  tagName: "tc-cover-flow",
  elementClass: TcCoverFlow,
  react: React,
  events: {
    onTcIndexChange: "tc-index-change" as EventName<CustomEvent<CoverFlowIndexChange>>,
    onTcFrontChange: "tc-front-change" as EventName<CustomEvent<CoverFlowIndexChange>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<CoverFlowSelect>>,
  },
});
type RawCoverFlowProps = React.ComponentProps<typeof RawCoverFlow>;
export type CoverFlowProps = Omit<
  RawCoverFlowProps,
  "items" | "index" | "label" | "selectable" | "renderCaption" | "onTcIndexChange" | "onTcFrontChange" | "onTcSelect" | "onSelect" | "children"
> & {
  /** The covers, in order: an image or your own content each, with a title and subtitle for the caption */
  items: CoverFlowItem[];
  /** Controlled front cover – changes are asked for through onIndexChange */
  index?: number;
  /** Starting cover when uncontrolled – defaults to the middle one */
  defaultIndex?: number;
  /** Uncontrolled: called as each new cover reaches the front. Controlled: called with the cover a gesture settles on */
  onIndexChange?: (index: number) => void;
  /** Clicking (or pressing Enter on) the cover in front */
  onSelect?: (item: CoverFlowItem, index: number) => void;
  /** Replaces the default caption (title and subtitle) */
  renderCaption?: (item: CoverFlowItem, index: number) => React.ReactNode;
  /** Names the carousel region */
  "aria-label"?: string;
};

/** Cover Flow – browse covers in 3D */
export function CoverFlow({ items, index, defaultIndex, onIndexChange, onSelect, renderCaption, "aria-label": ariaLabel = "Cover flow", ...props }: CoverFlowProps) {
  // React covers and captions render in the staging box; the element clones their DOM
  const nodes: [string, React.ReactNode][] = [];
  items.forEach((item, i) => {
    if (isNode(item.cover)) nodes.push([`cover:${item.id}`, item.cover]);
    if (renderCaption) nodes.push([`caption:${item.id}`, h("div", { style: { display: "contents" } }, renderCaption(item, i))]);
  });
  const { stage, els } = useStaged(nodes);
  const elementItems = React.useMemo(
    () => items.map((item) => ({ ...item, cover: isNode(item.cover) ? els[`cover:${item.id}`] : (item.cover as unknown as Element | undefined) })) as ElementItem[],
    [items, els],
  );
  const caption = React.useMemo(
    () => (renderCaption ? (item: ElementItem) => els[`caption:${item.id}`] : undefined),
    [renderCaption, els],
  );
  // Uncontrolled, onIndexChange hears each cover reaching the front; controlled, the cover a gesture asks for
  const v = useControlled<number | undefined>(index, defaultIndex, undefined);
  return h(React.Fragment, null, stage, h(RawCoverFlow, {
    ...props,
    items: elementItems,
    index: v.value,
    label: ariaLabel,
    selectable: !!onSelect,
    renderCaption: caption,
    onTcIndexChange: (e: CustomEvent<CoverFlowIndexChange>) => {
      v.handler(e.detail.index, e);
      if (v.controlled) onIndexChange?.(e.detail.index);
    },
    onTcFrontChange: (e: CustomEvent<CoverFlowIndexChange>) => {
      if (!v.controlled) onIndexChange?.(e.detail.index);
    },
    onTcSelect: onSelect ? (e: CustomEvent<CoverFlowSelect>) => onSelect(items[e.detail.index], e.detail.index) : undefined,
  }));
}
