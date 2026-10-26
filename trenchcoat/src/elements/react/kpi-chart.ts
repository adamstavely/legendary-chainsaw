import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcKpiChart, type KpiIndexChange } from "../kpi-chart";
import { h } from "./internal";

/**
 * useControlled, except an uncontrolled value is mirrored here: @lit/react sets every prop on every render, so passing
 * the starting value back would undo the element's own change whenever the parent re-renders
 */
function useOwned<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const own = React.useRef(defaultValue);
  const controlled = value !== undefined;
  const handler = (next: T, event: Event) => {
    if (controlled) event.preventDefault();
    else own.current = next;
    onChange?.(next);
  };
  return { value: controlled ? value : own.current, handler, controlled };
}

export type { KpiSeries } from "../kpi-chart";
export { niceRange } from "../kpi-chart";

const RawKpiChart = createComponent({
  tagName: "tc-kpi-chart",
  elementClass: TcKpiChart,
  react: React,
  events: { onTcIndexChange: "tc-index-change" as EventName<CustomEvent<KpiIndexChange>> },
});
type RawKpiChartProps = React.ComponentProps<typeof RawKpiChart>;
export type KpiChartProps = Omit<RawKpiChartProps, "heading" | "index" | "defaultIndex" | "onTcIndexChange" | "value"> & {
  title: string;
  /** Headline value, already formatted, e.g. "$96.4k" */
  value: string;
  /** Point that stays highlighted while nobody hovers – leave empty to hide the tooltip at rest */
  defaultIndex?: number;
  /** The highlighted point (controlled), or null for none */
  index?: number | null;
  /** Called with the point under the pointer or keyboard, or null when it leaves */
  onIndexChange?: (index: number | null) => void;
};
export function KpiChart({ title, index, defaultIndex, onIndexChange, ...props }: KpiChartProps) {
  const c = useOwned<number | null>(index, null, onIndexChange);
  return h(RawKpiChart, {
    ...props,
    heading: title,
    index: c.value,
    // Controlled: exactly the index given, no resting point
    defaultIndex: c.controlled ? undefined : defaultIndex,
    onTcIndexChange: (e: CustomEvent<KpiIndexChange>) => c.handler(e.detail.index, e),
  });
}
