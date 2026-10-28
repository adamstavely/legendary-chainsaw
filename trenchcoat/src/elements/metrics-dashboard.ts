import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { reducedMotion } from "../internal/reduced-motion";
import "./button";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-metrics-dashboard> – the Lit build of blocks/metrics-dashboard.tsx: a compact sales overview. A period switch and
 * four KPI cards that pick the charted metric; one chart that switches between a dotted line and bars, with an
 * optional previous-period comparison and a hover / keyboard tooltip; top products and sales channels below. Figures
 * count to their new values and the chart redraws when the range or metric changes.
 * Standard: the bar and the KPI cards on a gray tray, the chart and lists on a white card. Clean: one white card – the
 * bar is its first row, the KPIs a row of tabs under it.
 *
 *   <tc-metrics-dashboard heading="Sales" site="Northwind Store"></tc-metrics-dashboard>
 *
 * The KPI cards are tabs for the chart panel (arrow keys, Home / End); the chart is read point by point with the arrow
 * keys, and each point is announced. Every change the page may own – range, metric, chart type, comparison – fires a
 * cancelable `tc-<property>-change`; prevent it to control the property yourself.
 */

export type MetricKey = "revenue" | "orders" | "aov" | "refunds";
export type RangeKey = "7d" | "30d" | "90d";
export type MetricsChart = "line" | "bars";

export type MetricsRangeChange = { range: RangeKey };
export type MetricsMetricChange = { metric: MetricKey };
export type MetricsChartChange = { chart: MetricsChart };
export type MetricsCompareChange = { compare: boolean };
export type MetricsExport = { range: RangeKey; metric: MetricKey };

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

export function sampleDays(end: number): Day[] {
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

type Point = { label: string; value: number; previous: number };

export function aggregate(days: Day[], key: MetricKey) {
  let revenue = 0;
  let orders = 0;
  let refunded = 0;
  for (const d of days) {
    revenue += d.revenue;
    orders += d.orders;
    refunded += d.refunded;
  }
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

export const formatMetric = (key: MetricKey, n: number) =>
  key === "refunds"
    ? `${n.toFixed(1)}%`
    : key === "aov"
      ? `$${n.toFixed(2)}`
      : key === "revenue"
        ? `$${Math.round(n).toLocaleString("en-US")}`
        : Math.round(n).toLocaleString("en-US");
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Axis labels: "$12K", "140", "2.5%" */
const tickLabel = (key: MetricKey, n: number) => {
  const num = n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${+n.toFixed(n < 10 ? 1 : 0)}`;
  return key === "refunds" ? `${num}%` : key === "revenue" || key === "aov" ? `$${num}` : num;
};

/** A round axis maximum with four equal steps */
export function niceMax(n: number) {
  if (!(n > 0)) return 4;
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

/** Lowest and highest of a list, without spreading it into Math.min / max */
function extent(values: number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return Number.isFinite(lo) ? [lo, hi] : [0, 0];
}

/* ---------- Icons (Lucide-style, ISC) ---------- */

const SVG_NS = "http://www.w3.org/2000/svg";
function glyph(paths: string, circles: [number, number][] = []) {
  const s = document.createElementNS(SVG_NS, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  for (const d of paths.split("|")) {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    s.append(p);
  }
  for (const [cx, cy] of circles) {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", String(cx));
    c.setAttribute("cy", String(cy));
    c.setAttribute("r", "1.6");
    s.append(c);
  }
  return s;
}

const W = 600;
const H = 200;
let uidSeq = 0;

/**
 * A compact sales overview: KPI tabs that pick the charted metric, a line or bar chart with an optional previous-period
 * comparison, and top products and channels.
 * @tag tc-metrics-dashboard
 * @fires tc-range-change - The period was picked ({ range }: MetricsRangeChange); cancelable – prevented, `range` stays
 * @fires tc-metric-change - A KPI card was picked ({ metric }: MetricsMetricChange); cancelable – prevented, `metric` stays
 * @fires tc-chart-change - Line or bars was picked ({ chart }: MetricsChartChange); cancelable – prevented, `chart` stays
 * @fires tc-compare-change - The comparison switch was toggled ({ compare }: MetricsCompareChange); cancelable – prevented, `compare` stays
 * @fires tc-export - Export was pressed ({ range, metric }: MetricsExport); `onExport` may return a promise it waits for
 */
export class TcMetricsDashboard extends TcElement {
  static override ui = "md";

  /** Title in the bar on top */
  @property() accessor heading = "Sales";
  /** Site or workspace shown under the title */
  @property() accessor site = "Northwind Store";
  /** The period: "7d", "30d" or "90d" */
  @property() accessor range: RangeKey = "30d";
  /** The charted metric: "revenue", "orders", "aov" or "refunds" */
  @property() accessor metric: MetricKey = "revenue";
  /** The chart type: "line" or "bars" */
  @property() accessor chart: MetricsChart = "line";
  /** Shows the previous period beside the current one */
  @property({ type: Boolean }) accessor compare = false;
  /** Last day of the sample data, as epoch ms – today by default */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Called when Export is pressed, with the current range and metric. Return a promise to show Exporting… until it settles */
  @property({ attribute: false }) accessor onExport: ((range: RangeKey, metric: MetricKey) => void | Promise<unknown>) | undefined = undefined;

  /** @internal Export's state */
  @state() private accessor exported: "idle" | "busy" | "done" | "failed" = "idle";
  /** @internal The highlighted point, or null */
  @state() private accessor hover: number | null = null;
  /** @internal The point was picked with the keyboard – it's announced */
  @state() private accessor keyed = false;

  private uid = `ui-md${++uidSeq}`;
  private today = 0;
  private dataEnd = NaN;
  private all: Day[] = [];
  private exportTimer = 0;
  private shownView = "";
  private icons?: { line: Element; bars: Element };
  /** @internal The figures as shown while they count to their targets */
  private shown: Record<string, number> = {};
  private shownSig = "";
  private frame = 0;

  private get rangeMeta() {
    return RANGES.find((r) => r.key === this.range) ?? RANGES[1];
  }
  private get metricMeta() {
    return METRICS.find((m) => m.key === this.metric) ?? METRICS[0];
  }

  /** The figures that count up: the four KPIs and the list rows */
  private targets() {
    this.ensureData();
    const days = this.rangeMeta.days;
    const current = this.all.slice(-days);
    const out: Record<string, number> = {};
    for (const m of METRICS) out[m.key] = aggregate(current, m.key);
    const total = out.revenue;
    for (const [name, share] of [...PRODUCTS, ...CHANNELS]) out[`row:${name}`] = total * share;
    return out;
  }

  private ensureData() {
    if (this.now === undefined && !this.today) {
      // The one clock read: today at noon, so the sample data ends today
      const d = new Date(Date.now());
      d.setHours(12, 0, 0, 0);
      this.today = d.getTime();
    }
    const end = this.now ?? this.today;
    if (end !== this.dataEnd) {
      this.dataEnd = end;
      this.all = sampleDays(end);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.exportTimer);
    // A count cut short ends at its target, so the figures are right when the element comes back
    if (this.frame) this.shown = this.targets();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /** Counts the figures from what's shown to their new values (at once the first time, or with reduced motion) */
  private roll() {
    const to = this.targets();
    const sig = JSON.stringify(to);
    if (sig === this.shownSig) return;
    this.shownSig = sig;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    const from = { ...this.shown };
    if (!this.hasUpdated || !this.isConnected || reducedMotion() || !Object.keys(from).length) {
      this.shown = to;
      return;
    }
    let start = -1;
    const step = (t: number) => {
      if (start < 0) start = t;
      const k = Math.min(1, (t - start) / 600);
      const eased = 1 - Math.pow(1 - k, 3);
      const next: Record<string, number> = {};
      for (const key in to) next[key] = (from[key] ?? to[key]) + (to[key] - (from[key] ?? to[key])) * eased;
      this.shown = next;
      this.requestUpdate();
      this.frame = k < 1 ? requestAnimationFrame(step) : 0;
    };
    this.frame = requestAnimationFrame(step);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.ensureData();
    this.roll();
    // A new range, metric or chart type: the tooltip leaves
    const view = `${this.range}/${this.metric}/${this.chart}`;
    if (view !== this.shownView) {
      this.shownView = view;
      this.hover = null;
    }
  }

  /* ---------- Changes ---------- */

  private pickRange(range: RangeKey) {
    if (range === this.range) return;
    if (this.emit<MetricsRangeChange>("tc-range-change", { range }, { cancelable: true })) this.range = range;
  }
  private pickMetric(metric: MetricKey) {
    if (metric === this.metric) return;
    if (this.emit<MetricsMetricChange>("tc-metric-change", { metric }, { cancelable: true })) this.metric = metric;
  }
  private pickChart(chart: MetricsChart) {
    if (chart === this.chart) return;
    if (this.emit<MetricsChartChange>("tc-chart-change", { chart }, { cancelable: true })) this.chart = chart;
  }
  private toggleCompare(compare: boolean, input: HTMLInputElement) {
    if (this.emit<MetricsCompareChange>("tc-compare-change", { compare }, { cancelable: true })) this.compare = compare;
    // Prevented: the native checkbox goes back to the property
    input.checked = this.compare;
  }

  /** "Exported" (or "Export failed") for a moment, then back to Export */
  private settle(state: "done" | "failed") {
    if (!this.isConnected) return;
    this.exported = state;
    clearTimeout(this.exportTimer);
    this.exportTimer = window.setTimeout(() => (this.exported = "idle"), 1600);
  }
  private exportNow() {
    if (this.exported === "busy") return;
    this.emit<MetricsExport>("tc-export", { range: this.range, metric: this.metric });
    let result: unknown;
    try {
      result = this.onExport?.(this.range, this.metric);
    } catch (e) {
      result = Promise.reject(e);
    }
    if (!(result instanceof Promise)) return this.settle("done");
    this.exported = "busy";
    result.then(
      () => this.settle("done"),
      () => this.settle("failed"),
    );
  }

  /** Tabs pattern: arrows / Home / End move focus and pick the metric */
  private onKpiKey(e: KeyboardEvent) {
    const at = METRICS.findIndex((m) => m.key === this.metric);
    const n = METRICS.length;
    const next = e.key === "ArrowRight" ? (at + 1) % n : e.key === "ArrowLeft" ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    this.pickMetric(METRICS[next].key);
    void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-md__kpi")[METRICS.findIndex((m) => m.key === this.metric)]?.focus());
  }

  /* ---------- Chart interaction ---------- */

  private pointsCache: { key: string; points: Point[] } = { key: "", points: [] };
  private get points() {
    const key = `${this.dataEnd}/${this.range}/${this.metric}`;
    if (this.pointsCache.key !== key) this.pointsCache = { key, points: seriesFor(this.all, this.rangeMeta.days, this.metric) };
    return this.pointsCache.points;
  }

  private pickFromPointer(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const n = this.points.length;
    const t = (e.clientX - r.left) / r.width;
    const i = this.chart === "bars" ? Math.floor(t * n) : Math.round(t * (n - 1));
    this.hover = Math.max(0, Math.min(n - 1, i));
  }

  private onChartKey(e: KeyboardEvent) {
    const last = this.points.length - 1;
    const cur = this.hover ?? last;
    if (e.key === "Escape" && this.hover !== null) {
      // Esc hides the tooltip; focus stays on the chart
      e.preventDefault();
      e.stopPropagation();
      this.hover = null;
      return;
    }
    const next = e.key === "ArrowLeft" ? cur - 1 : e.key === "ArrowRight" ? cur + 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    this.keyed = true;
    this.hover = Math.max(0, Math.min(last, next));
  }

  /* ---------- Render ---------- */

  private delta(meta: MetricMeta, value: number, before: number) {
    const rate = meta.kind === "rate";
    const change = rate ? value - before : before ? ((value - before) / before) * 100 : 0;
    const up = change >= 0;
    const good = (up ? "up" : "down") === meta.goodWhen;
    const text = rate ? `${Math.abs(change).toFixed(1)} pts` : `${Math.abs(change).toFixed(1)}%`;
    return html`<span class="ui-md__delta" data-good=${ifDefined(good ? "" : undefined)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" data-down=${ifDefined(up ? undefined : "")}>${svg`<path d="M7 14.5 12 9.5l5 5"></path>`}</svg>${text}<span class="ui-md__sr">
        ${up ? "up" : "down"} versus the previous period</span
      >
    </span>`;
  }

  private renderChart(days: number) {
    const meta = this.metricMeta;
    const metric = this.metric;
    const compare = this.compare;
    const chart = this.chart;
    const points = this.points;
    const uid = this.uid;
    const n = points.length;
    // Totals start at zero; averages and rates zoom in around their values, so small changes stay visible.
    // Bars always start at zero – a bar that starts mid-air reads wrong.
    const shownValues = compare ? points.flatMap((p) => [p.value, p.previous]) : points.map((p) => p.value);
    const [minV, maxV] = extent(shownValues);
    let lo = 0;
    let max = niceMax(maxV);
    if (meta.zoom && chart !== "bars") {
      const pad = Math.max((maxV - minV) * 0.8, maxV * 0.02) || 1;
      const raw = (maxV + pad - Math.max(0, minV - pad)) / 4;
      const step = raw >= 1 ? Math.ceil(raw) : Math.ceil(raw * 10) / 10;
      lo = Math.max(0, Math.floor((minV - pad) / step) * step);
      max = lo + step * 4;
    }
    const yOf = (v: number) => (max === lo ? 0 : (v - lo) / (max - lo));
    const xy = (i: number, v: number): [number, number] => [n > 1 ? (i / (n - 1)) * W : W / 2, H - yOf(v) * H];
    const line = smoothPath(points.map((p, i) => xy(i, p.value)));
    const prevLine = smoothPath(points.map((p, i) => xy(i, p.previous)));
    const area = `${line}L${W},${H}L0,${H}Z`;
    const ticks = [0, 1, 2, 3, 4].map((t) => lo + ((max - lo) / 4) * t);
    const labelEvery = Math.ceil(n / 6);
    const active = this.hover !== null && this.hover < n ? this.hover : null;
    const pct = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50);
    // Bars sit in equal slots; the line runs edge to edge
    const slot = 100 / Math.max(1, n);
    const xPct = (i: number) => (chart === "bars" ? slot * (i + 0.5) : pct(i));
    const when = (i: number) => (days > 31 ? `Week of ${points[i].label}` : points[i].label);
    const tipText = (i: number) =>
      `${when(i)}: ${meta.label} ${formatMetric(metric, points[i].value)}${compare ? `, previous ${formatMetric(metric, points[i].previous)}` : ""}`;
    const icons = (this.icons ??= {
      line: glyph("M3.5 16.5 9 11l4 3.5 7.5-8", [
        [9, 11],
        [13, 14.5],
      ]),
      bars: glyph("M5.5 19.5v-6M10 19.5V8M14.5 19.5v-9M19 19.5V5"),
    });
    const kinds: SegmentOption[] = [
      { value: "line", ariaLabel: "Line chart", icon: icons.line },
      { value: "bars", ariaLabel: "Bar chart", icon: icons.bars },
    ];

    return html`<div class="ui-md__chart" id="${uid}-panel" role="tabpanel" aria-labelledby="${uid}-tab-${metric}">
      <div class="ui-md__chart-head">
        <span class="ui-md__legend"><i aria-hidden="true"></i>${meta.label}</span>
        <div class="ui-md__chart-tools">
          <tc-segmented-control
            class="ui-md__kind"
            look=${this.resolvedLook}
            aria-label="Chart type"
            size="sm"
            .options=${kinds}
            .value=${chart}
            @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
              e.stopPropagation();
              e.preventDefault();
              this.pickChart(e.detail.value as MetricsChart);
            }}
          ></tc-segmented-control>
          <label class="ui-md__compare">
            <input
              type="checkbox"
              role="switch"
              aria-label="Compare to previous period"
              .checked=${compare}
              @change=${(e: Event) => this.toggleCompare((e.target as HTMLInputElement).checked, e.target as HTMLInputElement)}
            /><span class="ui-md__switch" aria-hidden="true"></span><span class="ui-md__compare-long" aria-hidden="true">Compare to previous period</span
            ><span class="ui-md__compare-short" aria-hidden="true">Compare</span>
          </label>
        </div>
      </div>

      <div class="ui-md__plot-wrap">
        <div class="ui-md__axis" aria-hidden="true">${[...ticks].reverse().map((t) => html`<span>${tickLabel(metric, t)}</span>`)}</div>
        <div
          class="ui-md__plot"
          tabindex="0"
          role="img"
          aria-label=${n
            ? `${meta.label} over the last ${days} days, from ${formatMetric(metric, points[0].value)} to ${formatMetric(metric, points[n - 1].value)}. Use the arrow keys to inspect points.`
            : `${meta.label}: no data`}
          @pointermove=${(e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            this.keyed = false;
            this.pickFromPointer(e);
          }}
          @pointerdown=${(e: PointerEvent) => {
            this.keyed = false;
            this.pickFromPointer(e);
          }}
          @pointerleave=${(e: PointerEvent) => {
            if (e.pointerType === "mouse") this.hover = null;
          }}
          @keydown=${this.onChartKey}
          @blur=${() => (this.hover = null)}
        >
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
            ${svg`<defs><linearGradient id="${uid}-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" class="ui-md__area-a"></stop><stop offset="100%" class="ui-md__area-b"></stop></linearGradient></defs>`}
            ${ticks.map((t) => svg`<line class=${t === lo ? "ui-md__base" : "ui-md__grid"} x1="0" x2=${W} y1=${H - yOf(t) * H} y2=${H - yOf(t) * H}></line>`)}
            ${chart === "line"
              ? keyed(
                  `${this.range}-${metric}`,
                  svg`<g class="ui-md__series"><path class="ui-md__area" d=${area} fill="url(#${uid}-area)"></path>${compare ? svg`<path class="ui-md__prev" d=${prevLine}></path>` : nothing}<path class="ui-md__line" d=${line}></path></g>`,
                )
              : nothing}
            ${active !== null && chart === "line" ? svg`<line class="ui-md__guide" x1=${xy(active, 0)[0]} x2=${xy(active, 0)[0]} y1="0" y2=${H}></line>` : nothing}
          </svg>
          ${chart === "line"
            ? keyed(
                `dots-${this.range}-${metric}`,
                html`<div class="ui-md__dots" aria-hidden="true">
                  ${points.map(
                    (p, i) =>
                      html`<span style=${styleMap({ left: `${pct(i)}%`, top: `${(1 - yOf(p.value)) * 100}%`, animationDelay: `${(i / n) * 700}ms` })}></span>`,
                  )}
                </div>`,
              )
            : keyed(
                `bars-${this.range}-${metric}`,
                html`<div class="ui-md__bars" data-compare=${ifDefined(compare ? "" : undefined)} data-hover=${ifDefined(active !== null ? "" : undefined)} aria-hidden="true">
                  ${points.map(
                    (p, i) =>
                      html`<div class="ui-md__bar-slot" data-active=${ifDefined(active === i ? "" : undefined)} style=${styleMap({ "--d": `${(i / n) * 400}ms` })}>
                        ${compare ? html`<span class="ui-md__col ui-md__col--prev" style=${styleMap({ height: `${yOf(p.previous) * 100}%` })}></span>` : nothing}
                        <span class="ui-md__col" style=${styleMap({ height: `${yOf(p.value) * 100}%` })}></span>
                      </div>`,
                  )}
                </div>`,
              )}
          ${active !== null
            ? html`${chart === "line" && compare
                  ? html`<span class="ui-md__dot ui-md__dot--prev" style=${styleMap({ left: `${pct(active)}%`, top: `${(1 - yOf(points[active].previous)) * 100}%` })}></span>`
                  : nothing}
                ${chart === "line" ? html`<span class="ui-md__dot" style=${styleMap({ left: `${pct(active)}%`, top: `${(1 - yOf(points[active].value)) * 100}%` })}></span>` : nothing}
                <div class="ui-md__tip" aria-hidden="true" data-side=${active > (n - 1) / 2 ? "left" : "right"} style=${styleMap({ left: `${xPct(active)}%` })}>
                  <span class="ui-md__tip-date">${when(active)}</span>
                  <span class="ui-md__tip-row"><i aria-hidden="true"></i>${meta.label}<b>${formatMetric(metric, points[active].value)}</b></span>
                  ${compare
                    ? html`<span class="ui-md__tip-row ui-md__tip-row--prev"><i aria-hidden="true"></i>Previous<b>${formatMetric(metric, points[active].previous)}</b></span>`
                    : nothing}
                </div>`
            : nothing}
        </div>
        <span class="ui-md__sr" role="status">${active !== null && this.keyed ? tipText(active) : ""}</span>
        <div class="ui-md__dates" aria-hidden="true">
          ${points.map((p, i) =>
            i % labelEvery === 0
              ? html`<span
                  data-start=${ifDefined(chart === "line" && i === 0 ? "" : undefined)}
                  data-end=${ifDefined(xPct(i) > 88 ? "" : undefined)}
                  style=${styleMap({ left: `${xPct(i)}%` })}
                  >${p.label}</span
                >`
              : nothing,
          )}
        </div>
      </div>
    </div>`;
  }

  private renderList(title: string, rows: [string, number][], total: number) {
    const top = rows[0]?.[1] || 1;
    const shown = this.shown;
    return html`<div class="ui-md__list">
      <div class="ui-md__list-head"><span>${title}</span><span>Revenue</span></div>
      <ul>
        ${repeat(
          rows,
          ([name]) => name,
          ([name, share]) =>
            html`<li class="ui-md__row">
              <span class="ui-md__row-bar" style=${styleMap({ width: `${(share / top) * 100}%` })} aria-hidden="true"></span>
              <span class="ui-md__row-name">${name}</span>
              <span class="ui-md__row-value">${money(shown[`row:${name}`] ?? total * share)}</span>
            </li>`,
        )}
      </ul>
    </div>`;
  }

  override render() {
    const uid = this.uid;
    const days = this.rangeMeta.days;
    const current = this.all.slice(-days);
    const previous = this.all.slice(-days * 2, -days);
    const shown = this.shown;
    const revenueTotal = aggregate(current, "revenue");
    const exportLabel = { idle: "Export", busy: "Exporting…", done: "Exported", failed: "Export failed" }[this.exported];
    const look = this.resolvedLook;

    return html`
      <div class="ui-md__bar">
        <div class="ui-md__heading">
          <span class="ui-md__title">${this.heading}</span>
          <span class="ui-md__site">${this.site} · Last ${days} days</span>
        </div>
        <div class="ui-md__actions">
          <tc-segmented-control
            class="ui-md__range"
            look=${look}
            aria-label="Period"
            size="sm"
            .options=${RANGES.map((r) => ({ value: r.key, label: r.label }))}
            .value=${this.range}
            @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
              e.stopPropagation();
              e.preventDefault();
              this.pickRange(e.detail.value as RangeKey);
            }}
          ></tc-segmented-control>
          <tc-button class="ui-md__export" look=${look} variant="secondary" label=${exportLabel} ?loading=${this.exported === "busy"} @click=${this.exportNow}>
            <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
              ${this.exported === "done" ? svg`<path d="m5 12.5 4.5 4.5L19 7.5"></path>` : svg`<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"></path>`}
            </svg>
          </tc-button>
          <span class="ui-md__sr" role="status">${this.exported === "done" ? "Exported" : this.exported === "failed" ? "Export failed" : ""}</span>
        </div>
      </div>

      <div class="ui-md__kpis" role="tablist" aria-label="Metric" @keydown=${this.onKpiKey}>
        ${METRICS.map((m) => {
          const selected = this.metric === m.key;
          const value = aggregate(current, m.key);
          return html`<button
            type="button"
            role="tab"
            id="${uid}-tab-${m.key}"
            class="ui-md__kpi"
            aria-selected=${selected ? "true" : "false"}
            aria-controls="${uid}-panel"
            tabindex=${selected ? 0 : -1}
            @click=${() => this.pickMetric(m.key)}
          >
            <span class="ui-md__kpi-label">${m.label}</span>
            <span class="ui-md__kpi-value">${formatMetric(m.key, shown[m.key] ?? value)}</span>
            ${this.delta(m, value, aggregate(previous, m.key))}
          </button>`;
        })}
      </div>

      <div class="ui-md__card">
        ${this.renderChart(days)}
        <div class="ui-md__lists">${this.renderList("Top products", PRODUCTS, revenueTotal)} ${this.renderList("Channels", CHANNELS, revenueTotal)}</div>
      </div>
    `;
  }

  static override css = /* css */ `
[data-ui="md"] {
  --tc-md-area: color-mix(in srgb, var(--tc-chart-1) 18%, transparent);
  --tc-md-prev: var(--tc-icon-muted);
  --tc-md-plot-h: 200px;
  box-sizing: border-box;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Standard: a tray – the bar and the KPI cards sit on it, the chart card below */
[data-ui="md"][data-look="standard"] {
  padding: 0 var(--tc-tray-inset) var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
/* Clean: one white card – the bar is its first row, the KPIs a row of tabs under it */
[data-ui="md"][data-look="clean"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="md"] *, [data-ui="md"] *::before, [data-ui="md"] *::after { box-sizing: border-box; }
[data-ui="md"] :where(button.ui-md__kpi) { margin: 0; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="md"] :focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-md__sr { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---------- Bar ---------- */
.ui-md__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-3) var(--tc-space-3-5); }
[data-look="clean"] > .ui-md__bar { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-md__heading { display: flex; flex-direction: column; gap: var(--tc-space-0-5); min-width: 0; }
.ui-md__title { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); letter-spacing: var(--tc-tracking-snug); }
.ui-md__site { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-md__actions { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-md__export svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* ---------- Card ---------- */
[data-look="standard"] > .ui-md__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}

/* KPI cards: tabs for the chart; the chosen one has the selected ring and full-strength figures */
.ui-md__kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-1-5); margin-bottom: var(--tc-space-1-5); }
.ui-md__kpi {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--tc-space-1);
  min-width: 0;
  padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-3);
  border: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
  text-align: left;
  transition: box-shadow var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move);
}
.ui-md__kpi:hover { box-shadow: var(--tc-card-shadow-hover); }
.ui-md__kpi[aria-selected="true"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected), 0 0 0 var(--tc-hairline) var(--tc-border-selected), var(--tc-shadow-control); }
.ui-md__kpi:active { transform: scale(0.98); }
/* Clean: the KPIs are one row of the card, split by hairlines; the chosen one has an accent line at its foot */
[data-look="clean"] > .ui-md__kpis { gap: 0; margin: 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
[data-look="clean"] .ui-md__kpi { border-radius: 0; background: transparent; box-shadow: none; }
[data-look="clean"] .ui-md__kpi + .ui-md__kpi { box-shadow: inset var(--tc-hairline) 0 0 var(--tc-divider); }
[data-look="clean"] .ui-md__kpi:hover { background: var(--tc-fill-hover); box-shadow: none; }
[data-look="clean"] .ui-md__kpi[aria-selected="true"] { background: transparent; box-shadow: inset 0 calc(var(--tc-space-0-5) * -1) 0 var(--tc-border-selected); }
[data-look="clean"] .ui-md__kpi:active { transform: none; }
.ui-md__kpi-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-md__kpi-value {
  font-size: var(--tc-font-size-3xl);
  font-weight: var(--tc-font-weight-semibold);
  letter-spacing: var(--tc-tracking-tight);
  line-height: var(--tc-line-height-display-sm);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
  transition: color var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-md__kpi[aria-selected="true"] .ui-md__kpi-value { color: var(--tc-text-primary); }
/* Change: a status pill – green when it moves the good way, rose when not; the arrow and the hidden text say which way */
.ui-md__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px) 0 var(--tc-space-1);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-rose-bg);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-pill-font-weight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-tone-rose-fg);
}
.ui-md__delta[data-good] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-md__delta svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-md__delta svg[data-down] { transform: rotate(180deg); }

/* Chart */
.ui-md__chart { padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-md__chart-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-3); margin-bottom: var(--tc-space-3-5); }
.ui-md__legend { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-md__legend i { width: 14px; height: 2.5px; border-radius: var(--tc-radius-2xs); background: var(--tc-chart-1); }
.ui-md__chart-tools { display: flex; align-items: center; gap: var(--tc-space-3-5); }
.ui-md__kind svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-md__kind circle { fill: var(--tc-seg-thumb-bg); }
/* Compare: a switch (role=switch on the native checkbox) on the switch tokens */
.ui-md__compare { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: 24px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); cursor: pointer; user-select: none; }
.ui-md__compare input { position: absolute; opacity: 0; pointer-events: none; }
.ui-md__compare-short { display: none; }
.ui-md__switch {
  position: relative;
  flex: none;
  width: var(--tc-switch-w);
  height: var(--tc-switch-h);
  border-radius: var(--tc-switch-radius);
  background: var(--tc-switch-off);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-md__switch::after {
  content: "";
  position: absolute;
  top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2);
  left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2);
  width: var(--tc-switch-knob);
  height: var(--tc-switch-knob);
  border-radius: 50%;
  background: var(--tc-switch-knob-bg);
  box-shadow: var(--tc-shadow-control);
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-md__compare input:checked + .ui-md__switch { background: var(--tc-switch-on); }
.ui-md__compare input:checked + .ui-md__switch::after { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-md__compare input:focus-visible + .ui-md__switch { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

.ui-md__plot-wrap {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: var(--tc-md-plot-h) auto;
  column-gap: var(--tc-space-2-5);
}
.ui-md__axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: calc(var(--tc-space-2) * -1) 0;
  font-size: var(--tc-font-size-xs);
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--tc-text-muted);
}
.ui-md__plot { position: relative; outline-offset: 4px; border-radius: var(--tc-radius-xs); touch-action: pan-y; }
.ui-md__plot svg { display: block; width: 100%; height: 100%; overflow: visible; }
.ui-md__grid { stroke: var(--tc-border-default); stroke-width: 1; stroke-dasharray: 3 4; vector-effect: non-scaling-stroke; }
.ui-md__base { stroke: var(--tc-border-default); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ui-md__area-a { stop-color: var(--tc-md-area); }
.ui-md__area-b { stop-color: var(--tc-md-area); stop-opacity: 0; }
/* Line and area are revealed left to right when range or metric change */
.ui-md__series { animation: ui-md-reveal var(--tc-duration-reveal-slow) var(--tc-ease-in-out) both; }
.ui-md__line { fill: none; stroke: var(--tc-chart-1); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ui-md__prev { fill: none; stroke: var(--tc-md-prev); stroke-width: 1.5; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; animation: ui-md-fade var(--tc-duration-slower) var(--tc-ease-standard) both; }
/* Dots on the line */
.ui-md__dots { position: absolute; inset: 0; pointer-events: none; }
.ui-md__dots span {
  position: absolute;
  width: 7px;
  height: 7px;
  translate: -50% -50%;
  border: 1.5px solid var(--tc-chart-1);
  border-radius: 50%;
  background: var(--tc-surface-raised);
  animation: ui-md-pop var(--tc-duration-slow) var(--tc-ease-spring) both;
}
/* Bars */
.ui-md__bars { position: absolute; inset: 0; display: flex; align-items: flex-end; pointer-events: none; }
.ui-md__bar-slot { flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: var(--tc-space-0-5); min-width: 0; height: 100%; }
.ui-md__col {
  width: 56%;
  max-width: 22px;
  border-radius: var(--tc-radius-xs) var(--tc-radius-xs) var(--tc-radius-2xs) var(--tc-radius-2xs);
  background: linear-gradient(180deg, var(--tc-chart-1), color-mix(in srgb, var(--tc-chart-1) 55%, var(--tc-surface-raised)));
  transform-origin: bottom;
  animation: ui-md-grow var(--tc-duration-slowest) var(--tc-ease-in-out) both;
  animation-delay: var(--d);
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-md__bars[data-compare] .ui-md__col { width: 34%; max-width: 12px; }
.ui-md__col--prev { background: var(--tc-md-prev); opacity: 0.55; }
.ui-md__bars[data-hover] .ui-md__bar-slot:not([data-active]) .ui-md__col { opacity: 0.45; }
.ui-md__guide { stroke: var(--tc-text-muted); stroke-width: 1; stroke-dasharray: 2 3; opacity: 0.6; vector-effect: non-scaling-stroke; }
.ui-md__dot {
  position: absolute;
  width: 10px;
  height: 10px;
  translate: -50% -50%;
  border: 2px solid var(--tc-surface-raised);
  border-radius: 50%;
  background: var(--tc-chart-1);
  box-shadow: var(--tc-shadow-control);
  pointer-events: none;
}
.ui-md__dot--prev { background: var(--tc-md-prev); }
/* Tooltip: the tooltip pattern; it follows the pointer or the arrow keys, Esc hides it */
.ui-md__tip {
  position: absolute;
  top: 6px;
  z-index: 2;
  display: grid;
  gap: var(--tc-space-1);
  min-width: 150px;
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-tooltip-radius);
  background: var(--tc-tooltip-bg);
  box-shadow: var(--tc-shadow-overlay);
  font-size: var(--tc-tooltip-font-size);
  color: var(--tc-tooltip-fg);
  pointer-events: none;
}
.ui-md__tip[data-side="right"] { transform: translateX(14px); }
.ui-md__tip[data-side="left"] { transform: translateX(calc(-100% - 14px)); }
.ui-md__tip-date { font-size: var(--tc-font-size-xs); color: color-mix(in srgb, var(--tc-tooltip-fg) 72%, transparent); }
.ui-md__tip-row { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-md__tip-row i { width: 8px; height: 8px; border-radius: 50%; background: var(--tc-chart-1); }
.ui-md__tip-row--prev i { background: var(--tc-md-prev); }
.ui-md__tip-row b { margin-left: auto; padding-left: var(--tc-space-3); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
.ui-md__dates { position: relative; grid-column: 2; height: 26px; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-md__dates span { position: absolute; top: 9px; transform: translateX(-50%); white-space: nowrap; }
.ui-md__dates span[data-start] { transform: none; }
.ui-md__dates span[data-end] { transform: translateX(-100%); }

/* Lists */
.ui-md__lists { display: grid; grid-template-columns: 1fr 1fr; }
.ui-md__list { min-width: 0; padding: var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3); }
.ui-md__list + .ui-md__list { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-md__list-head { display: flex; justify-content: space-between; padding: 0 var(--tc-space-2) var(--tc-space-2); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-md__list-head span + span { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-md__list ul { display: grid; gap: var(--tc-space-0-5); margin: 0; padding: 0; list-style: none; }
.ui-md__row { position: relative; display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 32px; padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-md); }
.ui-md__row-bar { position: absolute; inset: 0 auto 0 0; border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); transition: width var(--tc-duration-slowest) var(--tc-ease-in-out); }
.ui-md__row-name { position: relative; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-secondary); }
.ui-md__row-value { position: relative; font-variant-numeric: tabular-nums; color: var(--tc-text-primary); }

@keyframes ui-md-reveal { from { clip-path: inset(-10% 100% -10% 0); } to { clip-path: inset(-10% -1% -10% 0); } }
@keyframes ui-md-fade { from { opacity: 0; } }
@keyframes ui-md-pop { from { transform: scale(0); } }
@keyframes ui-md-grow { from { transform: scaleY(0); } }

/* ---------- Follows its own width ---------- */
@container (max-width: 640px) {
  .ui-md__kpis { grid-template-columns: 1fr 1fr; }
  [data-look="clean"] .ui-md__kpi:nth-child(3) { box-shadow: inset 0 var(--tc-hairline) 0 var(--tc-divider); }
  [data-look="clean"] .ui-md__kpi:nth-child(4) { box-shadow: inset var(--tc-hairline) var(--tc-hairline) 0 var(--tc-divider); }
  .ui-md__lists { grid-template-columns: 1fr; }
  .ui-md__list + .ui-md__list { border-left: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
  .ui-md__compare-long { display: none; }
  .ui-md__compare-short { display: inline; }
}
@container (max-width: 460px) {
  .ui-md__bar { flex-wrap: wrap; }
  [data-ui="md"] > .ui-md__bar { padding: var(--tc-space-3) var(--tc-space-1) var(--tc-space-3) var(--tc-space-2-5); }
  .ui-md__actions { width: 100%; }
  .ui-md__range { flex: 1; }
  .ui-md__kpi { padding: var(--tc-space-3) var(--tc-space-3-5); }
  .ui-md__kpi-value { font-size: var(--tc-font-size-2xl); }
  .ui-md__chart { padding: var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-2-5); }
  [data-ui="md"] { --tc-md-plot-h: 168px; }
  /* Fewer date labels so they don't run into each other */
  .ui-md__dates span:nth-of-type(even) { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-md__kpi, .ui-md__kpi-value, .ui-md__row-bar, .ui-md__switch, .ui-md__switch::after { transition: none; }
  .ui-md__series, .ui-md__prev, .ui-md__dots span, .ui-md__col { animation: none; }
}
@media (forced-colors: active) {
  .ui-md__line { stroke: CanvasText; }
  .ui-md__col { background: CanvasText; }
  .ui-md__kpi[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-md__switch { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-metrics-dashboard")) customElements.define("tc-metrics-dashboard", TcMetricsDashboard);
declare global {
  interface HTMLElementTagNameMap {
    "tc-metrics-dashboard": TcMetricsDashboard;
  }
}
