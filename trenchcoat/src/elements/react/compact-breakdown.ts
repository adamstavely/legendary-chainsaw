import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCompactBreakdown, type BreakdownPeriodChange } from "../compact-breakdown";
import { h, isNode, useStaged } from "./internal";

export type { BreakdownItem, BreakdownPeriod } from "../compact-breakdown";

const RawCompactBreakdown = createComponent({
  tagName: "tc-compact-breakdown",
  elementClass: TcCompactBreakdown,
  react: React,
  events: { onTcPeriodChange: "tc-period-change" as EventName<CustomEvent<BreakdownPeriodChange>> },
});
type RawCompactBreakdownProps = React.ComponentProps<typeof RawCompactBreakdown>;
export type CompactBreakdownProps = Omit<RawCompactBreakdownProps, "heading" | "footer" | "period" | "onTcPeriodChange" | "items"> & {
  title?: string;
  /** The parts of the shown period – the list ranks them by value */
  items: TcCompactBreakdown["items"];
  /** Controlled period id */
  period?: string;
  defaultPeriod?: string;
  /** Called with the new period id – pass the matching `items` and `delta` back in */
  onPeriodChange?: (id: string) => void;
  /** Replaces the footer line (default: the largest part); null hides it */
  footer?: React.ReactNode;
};
/**
 * Like useControlled, but an uncontrolled value is tracked here as well: the wrapper sets every prop on each render, so
 * passing the starting value again would undo the user's pick whenever the parent re-renders
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

export function CompactBreakdown({ title = "Breakdown", period, defaultPeriod, onPeriodChange, footer, ...props }: CompactBreakdownProps) {
  const { stage, els } = useStaged(isNode(footer) ? [["footer", footer]] : []);
  const p = useValue(period, defaultPeriod ?? props.periods?.[0]?.id, onPeriodChange as ((id: string | undefined) => void) | undefined);
  return h(React.Fragment, null, stage, h(RawCompactBreakdown, {
    ...props,
    heading: title,
    period: p.value,
    footer: isNode(footer) ? els.footer : (footer as string | null | undefined),
    onTcPeriodChange: (e: CustomEvent<BreakdownPeriodChange>) => p.handler(e.detail.period, e),
  }));
}
