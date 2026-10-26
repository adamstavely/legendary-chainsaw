"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type Ref,
} from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

/*
 * Metrics Dashboard – a compact sales overview, in a single self-contained file.
 * A period switch and four KPI cards that pick the charted metric; one chart that switches between a
 * dotted line and bars, with an optional previous-period comparison and a hover / keyboard tooltip;
 * top products and sales channels below.
 * Figures count to their new values and the chart redraws when the range or metric changes.
 * The layout follows the block's own width. The styles are injected below; the period and chart-type switches and
 * Export are the library's SegmentedControl and Button (copy `segmented-control.tsx` and `button.tsx` alongside).
 * The KPI cards are tabs (arrow keys, Home / End) for the chart panel; the chart is read point by point with the
 * arrow keys, and each point is announced.
 */

export type MetricKey = "revenue" | "orders" | "aov" | "refunds";
export type RangeKey = "7d" | "30d" | "90d";

type OwnProps = {
  /** Title in the bar on top */
  title?: string;
  /** Site or workspace shown under the title */
  site?: string;
  /** The period (controlled) – pass `onRangeChange` with it */
  range?: RangeKey;
  /** Range to start on */
  defaultRange?: RangeKey;
  onRangeChange?: (range: RangeKey) => void;
  /** The charted metric (controlled) – pass `onMetricChange` with it */
  metric?: MetricKey;
  /** Metric to start on */
  defaultMetric?: MetricKey;
  onMetricChange?: (metric: MetricKey) => void;
  /** Last day of the sample data, as epoch ms – today by default (read after hydration, so server and client agree) */
  now?: number;
  /** Called when Export is pressed, with the current range and metric. Return a promise to show Exporting… until it settles */
  onExport?: (range: RangeKey, metric: MetricKey) => void | Promise<unknown>;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type MetricsDashboardProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "Week", days: 7 },
  { key: "30d", label: "Month", days: 30 },
  { key: "90d", label: "Quarter", days: 90 },
];

type MetricMeta = {
  key: MetricKey;
  label: string;
  /** "rate" changes are shown in points, the others in percent */
  kind: "count" | "money" | "rate";
  /** Averages and rates zoom the axis around their values instead of starting at zero */
  zoom: boolean;
  goodWhen: "up" | "down";
};

const METRICS: MetricMeta[] = [
  { key: "revenue", label: "Revenue", kind: "money", zoom: false, goodWhen: "up" },
  { key: "orders", label: "Orders", kind: "count", zoom: false, goodWhen: "up" },
  { key: "aov", label: "Avg. order", kind: "money", zoom: true, goodWhen: "up" },
  { key: "refunds", label: "Refund rate", kind: "rate", zoom: true, goodWhen: "down" },
];

const PRODUCTS: [string, number][] = [
  ["Linen overshirt", 0.22],
  ["Everyday tote", 0.16],
  ["Merino crew", 0.13],
  ["Canvas sneaker", 0.09],
  ["Wool beanie", 0.06],
];
const CHANNELS: [string, number][] = [
  ["Online store", 0.46],
  ["Instagram", 0.21],
  ["Marketplace", 0.14],
  ["Wholesale", 0.11],
  ["Pop-up", 0.05],
];

/* ---------- Sample data: 180 days, so every range has a previous period to compare with ---------- */

type Day = { date: Date; revenue: number; orders: number; refunded: number };

function sampleDays(end: number): Day[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const today = new Date(end);
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: 180 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (179 - i));
    const trend = 92 + i * 0.32;
    // Shops sell most at the weekend
    const week = [1.22, 0.82, 0.86, 0.9, 0.96, 1.1, 1.3][date.getDay()];
    const orders = Math.round(trend * week * (0.88 + rand() * 0.24));
    const aov = 61 + i * 0.03 + (rand() - 0.5) * 8;
    const revenue = Math.round(orders * aov);
    const refunded = Math.round(orders * (0.026 - i * 0.00003 + (rand() - 0.5) * 0.012));
    return { date, revenue, orders, refunded };
  });
}

/** Today at noon – the same value all day, so it can be read as an external store */
const todayNoon = () => new Date(new Date().toDateString()).getTime() + 12 * 3600e3;
/** The server and hydration render a fixed day; the client then moves to today */
const serverDay = () => Date.UTC(2026, 0, 1, 12);
const never = () => () => {};

type Point = { label: string; value: number; previous: number };

function aggregate(days: Day[], key: MetricKey) {
  const revenue = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((a, d) => a + d.orders, 0);
  const refunded = days.reduce((a, d) => a + d.refunded, 0);
  if (key === "revenue") return revenue;
  if (key === "orders") return orders;
  if (key === "aov") return orders ? revenue / orders : 0;
  return orders ? (refunded / orders) * 100 : 0;
}

const dayLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Points for the chart: daily for 7 / 30 days, weekly buckets for 90 */
function seriesFor(all: Day[], days: number, key: MetricKey): Point[] {
  const current = all.slice(-days);
  const previous = all.slice(-days * 2, -days);
  const bucket = days > 31 ? 7 : 1;
  const out: Point[] = [];
  for (let i = 0; i < current.length; i += bucket) {
    const cur = current.slice(i, i + bucket);
    const prev = previous.slice(i, i + bucket);
    out.push({ label: dayLabel(cur[0].date), value: aggregate(cur, key), previous: aggregate(prev, key) });
  }
  return out;
}

/* ---------- Formatting ---------- */

const fmt = (key: MetricKey, n: number) =>
  key === "refunds"
    ? `${n.toFixed(1)}%`
    : key === "aov"
      ? `$${n.toFixed(2)}`
      : key === "revenue"
        ? `$${Math.round(n).toLocaleString("en-US")}`
        : Math.round(n).toLocaleString("en-US");

/** Axis labels: "$12K", "140", "2.5%" */
const tickLabel = (key: MetricKey, n: number) => {
  const num = n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${+n.toFixed(n < 10 ? 1 : 0)}`;
  return key === "refunds" ? `${num}%` : key === "revenue" || key === "aov" ? `$${num}` : num;
};

/** A round axis maximum with four equal steps */
function niceMax(n: number) {
  const step = Math.pow(10, Math.floor(Math.log10(n / 4)));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => s * 4 >= n * 1.08) ?? step * 10;
  return nice * 4;
}

/** Smooth path through the points without overshooting (monotone cubic) */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  const n = pts.length;
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let path = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    path += `C${x0 + dx},${y0 + m[i] * dx} ${x1 - dx},${y1 - m[i + 1] * dx} ${x1},${y1}`;
  }
  return path;
}

/**
 * Counts from the last shown value to the new one without a React render per frame: React renders the target
 * text (right on the server, in tests and once the count ends); a layout effect puts the previous value back
 * before paint and an animation frame loop writes each step into the element's text node.
 */
function useCountUpText<T extends HTMLElement>(target: number, format: (n: number) => string, ms = 600) {
  const ref = useRef<T>(null);
  const from = useRef(target);
  const latestFormat = useRef(format);
  useLayoutEffect(() => {
    latestFormat.current = format;
  });
  useLayoutEffect(() => {
    const node = ref.current?.firstChild;
    const write = (v: number) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const text = latestFormat.current(v);
      if (node.nodeValue !== text) node.nodeValue = text;
    };
    const a = from.current;
    if (a === target || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      write(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      from.current = a + (target - a) * eased;
      write(from.current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    write(a);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return ref;
}

/**
 * State a parent may control: controlled when `value` is defined (changes are only reported through `onChange`),
 * otherwise kept here from `defaultValue` (and still reported). Whether `onChange` is passed never decides which.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = (next: T) => {
    if (!controlled) setOwn(next);
    onChange?.(next);
  };
  return [controlled ? value : own, set] as const;
}

/* ---------- Block ---------- */

const W = 600;
const H = 200;

export function MetricsDashboard({
  title = "Sales",
  site = "Northwind Store",
  range: rangeProp,
  defaultRange = "30d",
  onRangeChange,
  metric: metricProp,
  defaultMetric = "revenue",
  onMetricChange,
  now,
  onExport,
  className,
  ref,
  ...rest
}: MetricsDashboardProps) {
  const uid = "ui-md" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const today = useSyncExternalStore(never, todayNoon, serverDay);
  const end = now ?? today;
  const all = useMemo(() => sampleDays(end), [end]);
  const [range, setRange] = useControllable(rangeProp, defaultRange, onRangeChange);
  const [metric, setMetric] = useControllable(metricProp, defaultMetric, onMetricChange);
  const [compare, setCompare] = useState(false);
  const [chart, setChart] = useState<"line" | "bars">("line");
  const [exported, setExported] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const exportTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(exportTimer.current);
    };
  }, []);

  const days = RANGES.find((r) => r.key === range)!.days;
  const current = all.slice(-days);
  const previous = all.slice(-days * 2, -days);
  const revenueTotal = aggregate(current, "revenue");
  const kpisRef = useRef<HTMLDivElement>(null);
  /** Tabs pattern: arrows / Home / End move focus and pick the metric */
  const onKpiKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = METRICS.findIndex((m) => m.key === metric);
    const next =
      e.key === "ArrowRight" ? (at + 1) % METRICS.length : e.key === "ArrowLeft" ? (at - 1 + METRICS.length) % METRICS.length : e.key === "Home" ? 0 : e.key === "End" ? METRICS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setMetric(METRICS[next].key);
    kpisRef.current?.querySelectorAll<HTMLElement>("[role='tab']")[next]?.focus();
  };

  /** "Exported" (or "Export failed") for a moment, then back to Export */
  const settle = (state: "done" | "failed") => {
    if (!mounted.current) return;
    setExported(state);
    window.clearTimeout(exportTimer.current);
    exportTimer.current = window.setTimeout(() => setExported("idle"), 1600);
  };
  const exportNow = () => {
    if (exported === "busy") return;
    let result: unknown;
    try {
      result = onExport?.(range, metric);
    } catch (e) {
      result = Promise.reject(e);
    }
    if (!(result instanceof Promise)) return settle("done");
    setExported("busy");
    result.then(
      () => settle("done"),
      () => settle("failed"),
    );
  };

  return (
    <div {...rest} ref={ref} className={["ui-md", className].filter(Boolean).join(" ")}>
      <style href="ui-metrics-dashboard" precedence="default">
        {css}
      </style>

      {/* Bar on the gray tray */}
      <div className="ui-md__bar">
        <div className="ui-md__heading">
          <span className="ui-md__title">{title}</span>
          <span className="ui-md__site">
            {site} · Last {days} days
          </span>
        </div>
        <div className="ui-md__actions">
          <SegmentedControl
            className="ui-md__range"
            aria-label="Period"
            size="sm"
            value={range}
            onChange={(v) => v !== range && setRange(v)}
            options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
          />
          <Button
            variant="secondary"
            className="ui-md__export"
            loading={exported === "busy"}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {exported === "done" ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />}
              </svg>
            }
            onClick={exportNow}
          >
            {{ idle: "Export", busy: "Exporting…", done: "Exported", failed: "Export failed" }[exported]}
          </Button>
          <span className="ui-md__sr" role="status">
            {exported === "done" ? "Exported" : exported === "failed" ? "Export failed" : ""}
          </span>
        </div>
      </div>

      {/* KPI cards on the tray pick the charted metric – the chosen one in full, the others dimmed */}
      <div className="ui-md__kpis" role="tablist" aria-label="Metric" ref={kpisRef} onKeyDown={onKpiKey}>
          {METRICS.map((m) => (
            <Kpi
              key={m.key}
              id={`${uid}-tab-${m.key}`}
              panel={`${uid}-panel`}
              meta={m}
              selected={metric === m.key}
              value={aggregate(current, m.key)}
              before={aggregate(previous, m.key)}
              onSelect={() => m.key !== metric && setMetric(m.key)}
            />
          ))}
      </div>

      <div className="ui-md__card">
        <Chart uid={uid} tab={`${uid}-tab-${metric}`} all={all} days={days} range={range} metric={metric} compare={compare} onCompare={setCompare} chart={chart} onChart={setChart} />

        <div className="ui-md__lists">
          <List title="Top products" rows={PRODUCTS} total={revenueTotal} />
          <List title="Channels" rows={CHANNELS} total={revenueTotal} />
        </div>
      </div>
    </div>
  );
}

/** The chart card: line or bars, the previous period on request, and a hover / keyboard tooltip */
function Chart({
  uid,
  tab,
  all,
  days,
  range,
  metric,
  compare,
  onCompare,
  chart,
  onChart,
}: {
  uid: string;
  /** The KPI tab that labels this panel */
  tab: string;
  all: Day[];
  days: number;
  range: RangeKey;
  metric: MetricKey;
  compare: boolean;
  onCompare: (compare: boolean) => void;
  chart: "line" | "bars";
  onChart: (chart: "line" | "bars") => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Points picked with the keyboard are announced (one narrow status region); pointer hover is not
  const [keyed, setKeyed] = useState(false);
  // A new range, metric or chart type: the tooltip leaves
  const view = `${range}/${metric}/${chart}`;
  const [shownView, setShownView] = useState(view);
  if (shownView !== view) {
    setShownView(view);
    setHover(null);
  }
  const plotRef = useRef<HTMLDivElement>(null);
  const points = useMemo(() => seriesFor(all, days, metric), [all, days, metric]);
  const meta = METRICS.find((m) => m.key === metric)!;

  // Totals start at zero; averages and rates zoom in around their values, so small changes stay visible.
  // Bars always start at zero – a bar that starts mid-air reads wrong.
  const shownValues = points.flatMap((p) => (compare ? [p.value, p.previous] : [p.value]));
  const [lo, max] = (() => {
    if (!meta.zoom || chart === "bars") return [0, niceMax(Math.max(...shownValues))];
    const minV = Math.min(...shownValues);
    const maxV = Math.max(...shownValues);
    const pad = Math.max((maxV - minV) * 0.8, maxV * 0.02);
    const raw = (maxV + pad - Math.max(0, minV - pad)) / 4;
    const step = raw >= 1 ? Math.ceil(raw) : Math.ceil(raw * 10) / 10;
    const a = Math.max(0, Math.floor((minV - pad) / step) * step);
    return [a, a + step * 4];
  })();
  const yOf = (v: number) => (v - lo) / (max - lo);
  const xy = (i: number, v: number): [number, number] => [(i / (points.length - 1)) * W, H - yOf(v) * H];
  const line = smoothPath(points.map((p, i) => xy(i, p.value)));
  const prevLine = smoothPath(points.map((p, i) => xy(i, p.previous)));
  const area = `${line}L${W},${H}L0,${H}Z`;
  const ticks = [0, 1, 2, 3, 4].map((t) => lo + ((max - lo) / 4) * t);
  const labelEvery = Math.ceil(points.length / 6);
  const active = hover !== null && hover < points.length ? hover : null;
  const pct = (i: number) => (i / (points.length - 1)) * 100;
  // Bars sit in equal slots; the line runs edge to edge
  const slot = 100 / points.length;
  const xPct = (i: number) => (chart === "bars" ? slot * (i + 0.5) : pct(i));

  const pickFromPointer = (clientX: number) => {
    const el = plotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = (clientX - r.left) / r.width;
    const i = chart === "bars" ? Math.floor(t * points.length) : Math.round(t * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const onChartKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = points.length - 1;
    const cur = hover ?? last;
    if (e.key === "Escape" && hover !== null) {
      // Esc hides the tooltip; focus stays on the chart
      e.preventDefault();
      setHover(null);
      return;
    }
    const next =
      e.key === "ArrowLeft" ? cur - 1 : e.key === "ArrowRight" ? cur + 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    setKeyed(true);
    setHover(Math.max(0, Math.min(last, next)));
  };
  const tipText = (i: number) =>
    `${days > 31 ? `Week of ${points[i].label}` : points[i].label}: ${meta.label} ${fmt(metric, points[i].value)}${compare ? `, previous ${fmt(metric, points[i].previous)}` : ""}`;

  return (
    <div className="ui-md__chart" id={`${uid}-panel`} role="tabpanel" aria-labelledby={tab}>
      <div className="ui-md__chart-head">
        <span className="ui-md__legend">
          <i aria-hidden="true" />
          {meta.label}
        </span>
        <div className="ui-md__chart-tools">
        <SegmentedControl
          className="ui-md__kind"
          aria-label="Chart type"
          size="sm"
          value={chart}
          onChange={onChart}
          options={[
            {
              value: "line",
              ariaLabel: "Line chart",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 16.5 9 11l4 3.5 7.5-8" />
                  <circle cx="9" cy="11" r="1.6" />
                  <circle cx="13" cy="14.5" r="1.6" />
                </svg>
              ),
            },
            {
              value: "bars",
              ariaLabel: "Bar chart",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5.5 19.5v-6M10 19.5V8M14.5 19.5v-9M19 19.5V5" />
                </svg>
              ),
            },
          ]}
        />
        <label className="ui-md__compare">
          <input type="checkbox" role="switch" checked={compare} onChange={(e) => onCompare(e.target.checked)} />
          <span className="ui-md__switch" aria-hidden="true" />
          Compare to previous period
        </label>
        </div>
      </div>

      <div className="ui-md__plot-wrap">
        <div className="ui-md__axis" aria-hidden="true">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{tickLabel(metric, t)}</span>
          ))}
        </div>
        <div
          ref={plotRef}
          className="ui-md__plot"
          tabIndex={0}
          role="img"
          aria-label={`${meta.label} over the last ${days} days, from ${fmt(metric, points[0].value)} to ${fmt(metric, points[points.length - 1].value)}. Use the arrow keys to inspect points.`}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            setKeyed(false);
            pickFromPointer(e.clientX);
          }}
          onPointerDown={(e) => {
            setKeyed(false);
            pickFromPointer(e.clientX);
          }}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
          onKeyDown={onChartKey}
          onBlur={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="ui-md__area-a" />
                <stop offset="100%" className="ui-md__area-b" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line key={t} className={t === lo ? "ui-md__base" : "ui-md__grid"} x1="0" x2={W} y1={H - yOf(t) * H} y2={H - yOf(t) * H} />
            ))}
            {/* Key restarts the draw-in when range, metric or chart type change */}
            {chart === "line" && (
              <g key={`${range}-${metric}`} className="ui-md__series">
                <path className="ui-md__area" d={area} fill={`url(#${uid}-area)`} />
                {compare && <path className="ui-md__prev" d={prevLine} />}
                <path className="ui-md__line" d={line} />
              </g>
            )}
            {active !== null && chart === "line" && <line className="ui-md__guide" x1={xy(active, 0)[0]} x2={xy(active, 0)[0]} y1="0" y2={H} />}
          </svg>

          {/* Line: a dot on every point, lined up with the dates below */}
          {chart === "line" && (
            <div key={`dots-${range}-${metric}`} className="ui-md__dots" aria-hidden="true">
              {points.map((p, i) => (
                <span key={i} style={{ left: `${pct(i)}%`, top: `${(1 - yOf(p.value)) * 100}%`, animationDelay: `${(i / points.length) * 700}ms` }} />
              ))}
            </div>
          )}

          {/* Bars: one per point, the previous period as a ghost bar beside it */}
          {chart === "bars" && (
            <div key={`bars-${range}-${metric}`} className="ui-md__bars" data-compare={compare ? "" : undefined} aria-hidden="true">
              {points.map((p, i) => (
                <div key={i} className="ui-md__bar-slot" data-active={active === i ? "" : undefined} style={{ ["--d" as string]: `${(i / points.length) * 400}ms` }}>
                  {compare && <span className="ui-md__col ui-md__col--prev" style={{ height: `${yOf(p.previous) * 100}%` }} />}
                  <span className="ui-md__col" style={{ height: `${yOf(p.value) * 100}%` }} />
                </div>
              ))}
            </div>
          )}

          {active !== null && (
            <>
              {chart === "line" && compare && (
                <span
                  className="ui-md__dot ui-md__dot--prev"
                  style={{ left: `${pct(active)}%`, top: `${(1 - yOf(points[active].previous)) * 100}%` }}
                />
              )}
              {chart === "line" && (
                <span className="ui-md__dot" style={{ left: `${pct(active)}%`, top: `${(1 - yOf(points[active].value)) * 100}%` }} />
              )}
              <div
                className="ui-md__tip"
                aria-hidden="true"
                data-side={active > (points.length - 1) / 2 ? "left" : "right"}
                style={{ left: `${xPct(active)}%` }}
              >
                <span className="ui-md__tip-date">
                  {days > 31 ? `Week of ${points[active].label}` : points[active].label}
                </span>
                <span className="ui-md__tip-row">
                  <i aria-hidden="true" />
                  {meta.label}
                  <b>{fmt(metric, points[active].value)}</b>
                </span>
                {compare && (
                  <span className="ui-md__tip-row ui-md__tip-row--prev">
                    <i aria-hidden="true" />
                    Previous
                    <b>{fmt(metric, points[active].previous)}</b>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <span className="ui-md__sr" role="status">
          {active !== null && keyed ? tipText(active) : ""}
        </span>
        <div className="ui-md__dates" aria-hidden="true">
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <span
                key={i}
                data-start={chart === "line" && i === 0 ? "" : undefined}
                data-end={xPct(i) > 88 ? "" : undefined}
                style={{ left: `${xPct(i)}%` }}
              >
                {p.label}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  id,
  panel,
  meta,
  selected,
  value,
  before,
  onSelect,
}: {
  id: string;
  panel: string;
  meta: MetricMeta;
  selected: boolean;
  value: number;
  before: number;
  onSelect: () => void;
}) {
  const shown = useCountUpText<HTMLSpanElement>(value, (n) => fmt(meta.key, n));
  const rate = meta.kind === "rate";
  const change = rate ? value - before : before ? ((value - before) / before) * 100 : 0;
  const up = change >= 0;
  const good = (up ? "up" : "down") === meta.goodWhen;
  const text = rate ? `${Math.abs(change).toFixed(1)} pts` : `${Math.abs(change).toFixed(1)}%`;
  return (
    <button type="button" role="tab" id={id} aria-selected={selected} aria-controls={panel} tabIndex={selected ? 0 : -1} className="ui-md__kpi" onClick={onSelect}>
      <span className="ui-md__kpi-label">{meta.label}</span>
      <span className="ui-md__kpi-value" ref={shown}>
        {fmt(meta.key, value)}
      </span>
      <span className="ui-md__delta" data-good={good ? "" : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: up ? undefined : "rotate(180deg)" }}>
          <path d="M7 14.5 12 9.5l5 5" />
        </svg>
        {text}
        <span className="ui-md__sr"> {up ? "up" : "down"} versus the previous period</span>
      </span>
    </button>
  );
}

function List({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  const top = rows[0][1];
  return (
    <div className="ui-md__list">
      <div className="ui-md__list-head">
        <span>{title}</span>
        <span>Revenue</span>
      </div>
      <ul>
        {rows.map(([name, share]) => (
          <ListRow key={name} name={name} value={total * share} width={(share / top) * 100} />
        ))}
      </ul>
    </div>
  );
}

function ListRow({ name, value, width }: { name: string; value: number; width: number }) {
  const shown = useCountUpText<HTMLSpanElement>(value, (n) => `$${Math.round(n).toLocaleString("en-US")}`);
  return (
    <li className="ui-md__row">
      <span className="ui-md__row-bar" style={{ width: `${width}%` }} aria-hidden="true" />
      <span className="ui-md__row-name">{name}</span>
      <span className="ui-md__row-value" ref={shown}>
        {`$${Math.round(value).toLocaleString("en-US")}`}
      </span>
    </li>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is a token or a light-dark() fallback, so dark follows color-scheme – a .dark class,
   data-theme / data-tc-theme="dark" or the OS setting (data-tc-theme="system") */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }

/* The block is a tray: the KPI cards and the chart card sit on it */
.ui-md {
  --tc-metrics-dashboard-area: light-dark(rgba(47, 107, 255, 0.16), rgba(77, 130, 255, 0.2));
  --tc-metrics-dashboard-prev: light-dark(#b5b5b5, #5c5c61);
  container-type: inline-size;
  padding: 0 var(--tc-tray-inset, 4px) var(--tc-tray-inset, 4px);
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-md *, .ui-md *::before, .ui-md *::after { box-sizing: border-box; }
.ui-md :where(button[class^="ui-md__"]) { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-md :focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-md__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---------- Bar ---------- */

.ui-md__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 8px 12px 14px;
}
.ui-md__heading { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ui-md__title { font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-relaxed, 22px); letter-spacing: var(--tc-tracking-snug, -0.01em); }
.ui-md__site { overflow: hidden; font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; text-overflow: ellipsis; }
.ui-md__actions { display: flex; align-items: center; gap: 8px; }
.ui-md__export svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* ---------- Card ---------- */

.ui-md__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}

/* KPI cards: tabs for the chart; the chosen one has the selected ring and full-strength figures */
.ui-md__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 6px;
}
.ui-md .ui-md__kpi {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  padding: 14px 16px 13px;
  border: 0;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  text-align: left;
  transition: box-shadow var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease), transform var(--tc-duration-moderate, 260ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-md .ui-md__kpi:hover { box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-md .ui-md__kpi[aria-selected="true"] { box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)), 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)), var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-md__kpi:active { transform: scale(0.98); }
.ui-md__kpi-label { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-md__kpi-value {
  font-size: var(--tc-font-size-3xl, 24px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: var(--tc-tracking-tight, -0.02em);
  line-height: var(--tc-line-height-display-sm, 28px);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  transition: color var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease);
}
.ui-md__kpi[aria-selected="true"] .ui-md__kpi-value { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* Change: a status pill – green when it moves the good way, rose when not; the arrow and the hidden text say which way */
.ui-md__delta {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: var(--tc-pill-h, 20px);
  padding: 0 var(--tc-pill-px, 8px) 0 4px;
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-tone-rose-bg, light-dark(#fff0f3, rgba(251, 113, 133, 0.16)));
  font-size: var(--tc-font-size-xs-plus, 11.5px);
  font-weight: var(--tc-pill-font-weight, 500);
  font-variant-numeric: tabular-nums;
  color: var(--tc-tone-rose-fg, light-dark(#be123c, #fda4af));
}
.ui-md__delta[data-good] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-md__delta svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* Chart */
.ui-md__chart { padding: 16px 18px 12px; border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-md__chart-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.ui-md__legend { display: inline-flex; align-items: center; gap: 7px; font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-md__legend i { width: 14px; height: 2.5px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); }
.ui-md__chart-tools { display: flex; align-items: center; gap: 14px; }
.ui-md__kind svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-md__kind circle { fill: var(--tc-seg-thumb-bg, light-dark(#ffffff, #34343a)); }
/* Compare: a switch (role=switch on the native checkbox) on the switch tokens */
.ui-md__compare { display: inline-flex; align-items: center; gap: 8px; min-height: 24px; font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); cursor: pointer; user-select: none; }
.ui-md__compare input { position: absolute; opacity: 0; pointer-events: none; }
.ui-md__switch {
  position: relative;
  flex: none;
  width: var(--tc-switch-w, 32px);
  height: var(--tc-switch-h, 20px);
  border-radius: var(--tc-switch-radius, 999px);
  background: var(--tc-switch-off, light-dark(#858585, #7c7c82));
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-md__switch::after {
  content: "";
  position: absolute;
  top: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  left: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  width: var(--tc-switch-knob, 16px);
  height: var(--tc-switch-knob, 16px);
  border-radius: 50%;
  background: var(--tc-switch-knob-bg, #ffffff);
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-md__compare input:checked + .ui-md__switch { background: var(--tc-switch-on, #2f68ff); }
.ui-md__compare input:checked + .ui-md__switch::after { transform: translateX(calc(var(--tc-switch-w, 32px) - var(--tc-switch-h, 20px))); }
.ui-md__compare input:focus-visible + .ui-md__switch { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

.ui-md__plot-wrap {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: 200px auto;
  column-gap: 10px;
}
.ui-md__axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: -7px 0;
  font-size: var(--tc-font-size-xs, 11px);
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-md .ui-md__plot { position: relative; outline-offset: 4px; border-radius: var(--tc-radius-xs, 4px); touch-action: pan-y; }
.ui-md__plot svg { display: block; width: 100%; height: 100%; overflow: visible; }
.ui-md__grid { stroke: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); stroke-width: 1; stroke-dasharray: 3 4; vector-effect: non-scaling-stroke; }
.ui-md__base { stroke: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ui-md__area-a { stop-color: var(--tc-metrics-dashboard-area); }
.ui-md__area-b { stop-color: var(--tc-metrics-dashboard-area); stop-opacity: 0; }
/* Line and area are revealed left to right when range or metric change */
.ui-md__series { animation: ui-md-reveal var(--tc-duration-reveal-slow, 900ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) both; }
.ui-md__line {
  fill: none;
  stroke: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff));
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.ui-md__prev {
  fill: none;
  stroke: var(--tc-metrics-dashboard-prev);
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
  vector-effect: non-scaling-stroke;
  animation: ui-md-fade var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease) both;
}
/* Dots on the line */
.ui-md__dots { position: absolute; inset: 0; pointer-events: none; }
.ui-md__dots span {
  position: absolute;
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  border: 1.5px solid var(--tc-chart-1, light-dark(#2f68ff, #6b95ff));
  border-radius: 50%;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  animation: ui-md-pop var(--tc-duration-slow, 320ms) var(--tc-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) both;
}
/* Bars */
.ui-md__bars {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  pointer-events: none;
}
.ui-md__bar-slot {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  height: 100%;
}
.ui-md__col {
  width: 56%;
  max-width: 22px;
  border-radius: var(--tc-radius-xs, 4px) var(--tc-radius-xs, 4px) var(--tc-radius-2xs, 2px) var(--tc-radius-2xs, 2px);
  background: linear-gradient(180deg, var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)), color-mix(in srgb, var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)) 55%, var(--tc-surface-raised, light-dark(#ffffff, #19191b))));
  transform-origin: bottom;
  animation: ui-md-grow var(--tc-duration-slowest, 560ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) both;
  animation-delay: var(--d);
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-md__bars[data-compare] .ui-md__col { width: 34%; max-width: 12px; }
.ui-md__col--prev { background: var(--tc-metrics-dashboard-prev); opacity: 0.55; }
.ui-md__bars:has([data-active]) .ui-md__bar-slot:not([data-active]) .ui-md__col { opacity: 0.45; }
.ui-md__guide { stroke: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); stroke-width: 1; stroke-dasharray: 2 3; opacity: 0.6; vector-effect: non-scaling-stroke; }
.ui-md__dot {
  position: absolute;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border: 2px solid var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  border-radius: 50%;
  background: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff));
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  pointer-events: none;
}
.ui-md__dot--prev { background: var(--tc-metrics-dashboard-prev); }
/* Tooltip: the tooltip pattern; it follows the pointer or the arrow keys, Esc hides it */
.ui-md__tip {
  position: absolute;
  top: 6px;
  z-index: 2;
  display: grid;
  gap: 4px;
  min-width: 150px;
  padding: 9px 11px;
  border-radius: var(--tc-tooltip-radius, 6px);
  background: var(--tc-tooltip-bg, light-dark(#171717, #ededed));
  box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  font-size: var(--tc-tooltip-font-size, 12px);
  color: var(--tc-tooltip-fg, light-dark(#ffffff, #111113));
  pointer-events: none;
}
.ui-md__tip[data-side="right"] { transform: translateX(14px); }
.ui-md__tip[data-side="left"] { transform: translateX(calc(-100% - 14px)); }
.ui-md__tip-date { font-size: var(--tc-font-size-xs-plus, 11.5px); color: color-mix(in srgb, var(--tc-tooltip-fg, light-dark(#ffffff, #111113)) 72%, transparent); }
.ui-md__tip-row { display: flex; align-items: center; gap: 7px; }
.ui-md__tip-row i { width: 8px; height: 8px; border-radius: 50%; background: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); }
.ui-md__tip-row--prev i { background: var(--tc-metrics-dashboard-prev); }
.ui-md__tip-row b { margin-left: auto; padding-left: 12px; font-weight: var(--tc-font-weight-semibold, 600); font-variant-numeric: tabular-nums; }
.ui-md__dates { position: relative; grid-column: 2; height: 26px; font-size: var(--tc-font-size-xs, 11px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-md__dates span { position: absolute; top: 9px; transform: translateX(-50%); white-space: nowrap; }
.ui-md__dates span[data-start] { transform: none; }
.ui-md__dates span[data-end] { transform: translateX(-100%); }

/* Lists */
.ui-md__lists { display: grid; grid-template-columns: 1fr 1fr; }
.ui-md__list { min-width: 0; padding: 14px 12px 12px; }
.ui-md__list + .ui-md__list { border-left: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-md__list-head { display: flex; justify-content: space-between; padding: 0 8px 8px; font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); }
.ui-md__list-head span + span { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-md__list ul { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.ui-md__row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  padding: 0 8px;
  font-size: var(--tc-font-size-md, 13px);
}
.ui-md__row-bar {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16)));
  transition: width var(--tc-duration-slowest, 560ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-md__row-name { position: relative; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-md__row-value { position: relative; font-variant-numeric: tabular-nums; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

@keyframes ui-md-reveal { from { clip-path: inset(-10% 100% -10% 0); } to { clip-path: inset(-10% -1% -10% 0); } }
@keyframes ui-md-fade { from { opacity: 0; } }
@keyframes ui-md-pop { from { transform: scale(0); } }
@keyframes ui-md-grow { from { transform: scaleY(0); } }

/* ---------- Follows the block's own width ---------- */

@container (max-width: 640px) {
  .ui-md__kpis { grid-template-columns: 1fr 1fr; }
  .ui-md__lists { grid-template-columns: 1fr; }
  .ui-md__list + .ui-md__list { border-left: 0; border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
  .ui-md__compare { font-size: 0; gap: 0; }
  .ui-md__compare::after { content: "Compare"; font-size: var(--tc-font-size-sm-plus, 12.5px); margin-left: 8px; }
}
@container (max-width: 460px) {
  .ui-md__bar { flex-wrap: wrap; padding: 12px 4px 12px 10px; }
  .ui-md__actions { width: 100%; }
  .ui-md__range { flex: 1; }
  .ui-md .ui-md__kpi { padding: 12px 14px; }
  .ui-md__kpi-value { font-size: var(--tc-font-size-2xl, 20px); }
  .ui-md__chart { padding: 14px 12px 10px; }
  .ui-md__plot-wrap { grid-template-rows: 168px auto; }
  /* Fewer date labels so they don't run into each other */
  .ui-md__dates span:nth-child(even) { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-md .ui-md__kpi, .ui-md__kpi-value, .ui-md__row-bar, .ui-md__switch, .ui-md__switch::after { transition: none; }
  .ui-md__series, .ui-md__prev, .ui-md__dots span, .ui-md__col { animation: none; }
}
`;
