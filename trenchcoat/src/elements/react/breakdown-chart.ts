import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcBreakdownChart,
  breakdownStatusFrame,
  breakdownStatusShapes,
  STATUS_KIND_ATTR,
  type BreakdownDimension,
  type BreakdownHiddenChange,
  type BreakdownMeasure,
  type BreakdownMeasureChange,
  type BreakdownSegmentChange,
  type BreakdownSliceChange,
  type BreakdownStatusKind,
} from "../breakdown-chart";
import type { Look } from "../internal/look";
import { h, isNode, useStaged } from "./internal";

export type { BreakdownRecord } from "../breakdown-chart";
/** React nodes in place of elements: icons per value */
export type Dimension = Omit<BreakdownDimension, "icons"> & { icons?: Record<string, React.ReactNode> };
export type Measure = BreakdownMeasure;

const RawBreakdownChart = createComponent({
  tagName: "tc-breakdown-chart",
  elementClass: TcBreakdownChart,
  react: React,
  events: {
    onTcMeasureChange: "tc-measure-change" as EventName<CustomEvent<BreakdownMeasureChange>>,
    onTcSliceChange: "tc-slice-change" as EventName<CustomEvent<BreakdownSliceChange>>,
    onTcSegmentChange: "tc-segment-change" as EventName<CustomEvent<BreakdownSegmentChange>>,
    onTcHiddenChange: "tc-hidden-change" as EventName<CustomEvent<BreakdownHiddenChange>>,
  },
});
type RawBreakdownChartProps = React.ComponentProps<typeof RawBreakdownChart>;
type Controlled = "measure" | "slice" | "segment" | "hidden";
export type BreakdownChartProps = Omit<
  RawBreakdownChartProps,
  "heading" | "dimensions" | "records" | "measures" | "hiddenSegments" | Controlled | "onTcMeasureChange" | "onTcSliceChange" | "onTcSegmentChange" | "onTcHiddenChange"
> & {
  /** The rows to chart – one object per item, with a value for each dimension key and each measure field */
  records: TcBreakdownChart["records"];
  /** The fields people can slice and segment by; `icons` takes React nodes */
  dimensions: Dimension[];
  /** What the bars can measure – a count of records, or the sum of a field */
  measures: Measure[];
  /** The heading, and the region's name (default "Workload") */
  title?: string;
  /** Measure key (controlled). Leave undefined and use `defaultMeasure` to let the chart keep it */
  measure?: string;
  /** The measure picked at first, when `measure` is not controlled – defaults to the first */
  defaultMeasure?: string;
  /** Called when another measure is picked */
  onMeasureChange?: (measure: string) => void;
  /** Dimension key the bars are sliced by (controlled) */
  slice?: string;
  /** The slice picked at first, when `slice` is not controlled – defaults to the first dimension */
  defaultSlice?: string;
  /** Called when another slice is picked */
  onSliceChange?: (slice: string) => void;
  /** Dimension key the bars are segmented by, or "none" for single-color bars (controlled) */
  segment?: string;
  /** The segment picked at first, when `segment` is not controlled – defaults to the second dimension */
  defaultSegment?: string;
  /** Called when another segment is picked */
  onSegmentChange?: (segment: string) => void;
  /** Segment values hidden from the bars and totals (controlled); picking another segment clears it */
  hidden?: string[];
  /** The segment values hidden at first, when `hidden` is not controlled */
  defaultHidden?: string[];
  /** Called when legend chips hide or show segment values, or Show all is pressed */
  onHiddenChange?: (hidden: string[]) => void;
};

const NO_HIDDEN: string[] = [];
const iconKey = (d: number, v: string) => `${d}\u0000${v}`;

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

export function BreakdownChart({
  title = "Workload",
  dimensions,
  measures,
  measure,
  defaultMeasure,
  onMeasureChange,
  slice,
  defaultSlice,
  onSliceChange,
  segment,
  defaultSegment,
  onSegmentChange,
  hidden,
  defaultHidden = NO_HIDDEN,
  onHiddenChange,
  ...props
}: BreakdownChartProps) {
  const { stage, els } = useStaged(dimensions.flatMap((d, di) => Object.entries(d.icons ?? {}).filter(([, n]) => isNode(n)).map(([v, n]) => [iconKey(di, v), n] as [string, React.ReactNode])));
  const dims = React.useMemo(
    () =>
      dimensions.map((d, di) =>
        d.icons ? { ...d, icons: Object.fromEntries(Object.entries(d.icons).map(([v, n]) => [v, isNode(n) ? els[iconKey(di, v)] : n]).filter(([, el]) => el)) } : d,
      ) as BreakdownDimension[],
    [dimensions, els],
  );
  const m = useValue(measure, defaultMeasure ?? measures[0]?.key ?? "", onMeasureChange);
  const sl = useValue(slice, defaultSlice ?? dimensions[0]?.key ?? "", onSliceChange);
  const sg = useValue(segment, defaultSegment ?? dimensions[1]?.key ?? "none", onSegmentChange);
  const hd = useValue(hidden, defaultHidden, onHiddenChange);
  return h(React.Fragment, null, stage, h(RawBreakdownChart, {
    ...props,
    heading: title,
    dimensions: dims,
    measures,
    measure: m.value,
    slice: sl.value,
    segment: sg.value,
    hiddenSegments: hd.value,
    onTcMeasureChange: (e: CustomEvent<BreakdownMeasureChange>) => m.handler(e.detail.measure, e),
    onTcSliceChange: (e: CustomEvent<BreakdownSliceChange>) => sl.handler(e.detail.slice, e),
    onTcSegmentChange: (e: CustomEvent<BreakdownSegmentChange>) => sg.handler(e.detail.segment, e),
    onTcHiddenChange: (e: CustomEvent<BreakdownHiddenChange>) => hd.handler(e.detail.hidden, e),
  }));
}

/** React's names for SVG attributes */
const reactAttrs = (attrs: Record<string, string>) => Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.startsWith("aria-") ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v]));

/** Small status icons – exported for your own status values */
export const StatusIcon = ({
  kind,
  color = "currentColor",
  look,
}: {
  kind: BreakdownStatusKind;
  color?: string;
  /** Visual style: "standard" or "clean"; unset follows the chart it's in */
  look?: Look;
}) =>
  h(
    "svg",
    { ...reactAttrs(breakdownStatusFrame(color, look ?? "standard")), [STATUS_KIND_ATTR]: look ? undefined : kind },
    ...breakdownStatusShapes(kind, color, look ?? "standard").map(([tag, attrs], i) => h(tag, { key: i, ...reactAttrs(attrs) })),
  );
