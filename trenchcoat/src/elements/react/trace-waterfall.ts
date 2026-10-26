import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTraceWaterfall, type TraceCollapsedChange, type TraceOpenChange, type TraceSpan as TraceSpanData } from "../trace-waterfall";
import { h, isNode, useStaged } from "./internal";

export type { TraceSpanKind, TraceSpanStatus } from "../trace-waterfall";
/** React nodes in place of elements: a span's icon */
export type TraceSpan = Omit<TraceSpanData, "icon" | "children"> & { icon?: React.ReactNode; children?: TraceSpan[] };

const RawTraceWaterfall = createComponent({
  tagName: "tc-trace-waterfall",
  elementClass: TcTraceWaterfall,
  react: React,
  events: {
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<TraceCollapsedChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<TraceOpenChange>>,
  },
});
type RawTraceWaterfallProps = React.ComponentProps<typeof RawTraceWaterfall>;
export type TraceWaterfallProps = Omit<RawTraceWaterfallProps, "root" | "heading" | "collapsed" | "openId" | "onTcCollapsedChange" | "onTcOpenChange"> & {
  root: TraceSpan;
  title?: string;
  /** Controlled ids of folded spans */
  collapsed?: string[];
  defaultCollapsed?: string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  /** Controlled id of the span whose details are open */
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null, span?: TraceSpan) => void;
};

/**
 * Like useControlled, but an uncontrolled value is tracked here as well: the wrapper sets every prop on each render, so
 * passing the starting value again would undo the user's change whenever the parent re-renders
 */
function useValue<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else setInner(next);
    onChange?.(next);
  };
  return { value: controlled ? value : inner, handler };
}

const walk = (s: TraceSpan): TraceSpan[] => [s, ...(s.children ?? []).flatMap(walk)];
const NONE: string[] = [];

export function TraceWaterfall({ root, title = "Trace", collapsed, defaultCollapsed = NONE, onCollapsedChange, openId, defaultOpenId = null, onOpenChange, ...props }: TraceWaterfallProps) {
  const { stage, els } = useStaged(walk(root).filter((s) => isNode(s.icon)).map((s) => [s.id, s.icon]));
  const data = React.useMemo(() => {
    const map = (s: TraceSpan): TraceSpanData => ({ ...s, icon: isNode(s.icon) ? els[s.id] : (s.icon as Element | undefined), children: s.children?.map(map) });
    return map(root);
  }, [root, els]);
  const c = useValue(collapsed, defaultCollapsed, onCollapsedChange);
  const o = useValue<string | null>(openId, defaultOpenId, onOpenChange && ((id) => onOpenChange(id, id ? walk(root).find((s) => s.id === id) : undefined)));
  return h(React.Fragment, null, stage, h(RawTraceWaterfall, {
    ...props,
    root: data,
    heading: title,
    collapsed: c.value,
    openId: o.value,
    onTcCollapsedChange: (e: CustomEvent<TraceCollapsedChange>) => c.handler(e.detail.collapsed, e),
    onTcOpenChange: (e: CustomEvent<TraceOpenChange>) => o.handler(e.detail.openId, e),
  }));
}
