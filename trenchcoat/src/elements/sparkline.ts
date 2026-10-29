import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";

/*
 * <tc-sparkline> – a small trend chart that sits in a line of text or a table cell: a line, an area, bars, or
 * win-loss bars (up for a gain, down for a loss). It takes its height from the font size, so it matches the text
 * around it, and stays crisp at any width. Gaps (null values) break the line. Optional markers pick out the last,
 * highest and lowest points, and a dashed reference line shows a target. With `good` it's coloured by which way it
 * went – green when it moved the good way, red when it didn't.
 *   · read as one picture: “Samples per day: from 112 to 148, high 152, low 98”
 *   · `interactive` makes it one tab stop: ← / → step through the points with a tooltip, Home / End to the ends,
 *     Escape hides the tooltip; pointing at it does the same
 * No tray or card: it's inline, in both looks.
 *
 *   <tc-sparkline label="Samples per day" .values=${[112, 120, 98, 131, 148]} good="up"></tc-sparkline>
 */

export type SparklineType = "line" | "area" | "bars" | "win-loss";
export type SparklineTone = "auto" | "neutral" | "info" | "success" | "warning" | "danger";

/** Details of the events */
export type SparklinePointFocus = {
  /** The point's index in `values` */
  index: number;
  value: number | null;
  /** Its label from `labels`, if any */
  label?: string;
};

let uidCount = 0;

/** Room above the highest point and below the lowest, in drawing units – the drawing is 100 × 100, stretched to fit */
const PAD = 8;

/**
 * A small inline trend chart – line, area, bars or win-loss – sized from the text around it, with optional markers, a
 * reference line, a tone for which way it went and, when interactive, a tooltip per point.
 * @tag tc-sparkline
 * @fires tc-point-focus - A point was stepped to or pointed at, in interactive mode ({ index, value, label }: SparklinePointFocus)
 */
export class TcSparkline extends TcElement {
  static override ui = "spk";

  /** The values, oldest first; null is a gap */
  @property({ attribute: false }) accessor values: (number | null)[] = [];
  /** A label per value, e.g. dates – read in the tooltip and announcements */
  @property({ attribute: false }) accessor labels: string[] | undefined = undefined;
  /** How it's drawn */
  @property() accessor type: SparklineType = "line";
  /** What it measures, e.g. "Samples per day" – starts the accessible summary; by default "Trend" */
  @property() accessor label: string | undefined = undefined;
  /** The bottom of the scale; by default the lowest value (0 for bars) */
  @property({ type: Number }) accessor min: number | undefined = undefined;
  /** The top of the scale; by default the highest value */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** A value to draw as a dashed line, e.g. a target */
  @property({ type: Number }) accessor reference: number | undefined = undefined;
  /** What the reference line is, for the summary */
  @property({ attribute: "reference-label" }) accessor referenceLabel = "Target";
  /** Points to mark, space-separated: any of "last", "first", "min", "max"; "none" for none */
  @property() accessor markers = "last";
  /** Which way is good: "up" or "down"; with tone "auto", it's green when it moved that way and red when it didn't */
  @property() accessor good: "up" | "down" | undefined = undefined;
  /** The colour: "auto" follows `good` (neutral without it), or a fixed tone */
  @property() accessor tone: SparklineTone = "auto";
  /** Width in px; by default 5em */
  @property({ type: Number }) accessor width: number | undefined = undefined;
  /** Height in px; by default 1.25em, so it matches the text */
  @property({ type: Number }) accessor height: number | undefined = undefined;
  /** One tab stop: the arrow keys step through the points with a tooltip */
  @property({ type: Boolean, reflect: true }) accessor interactive = false;
  /** Writes a value, e.g. (v) => `${v} °C`; replaces the number and `unit` */
  @property({ attribute: false }) accessor format: ((value: number) => string) | undefined = undefined;
  /** What the values count, after the number: "148 samples" */
  @property() accessor unit: string | undefined = undefined;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The point shown in the tooltip, in interactive mode */
  @state() private accessor point: number | null = null;
  @state() private accessor announce = "";

  private uid = `tc-spk-${++uidCount}`;

  /* ---------- The model ---------- */

  private num(v: number) {
    if (this.format) return this.format(v);
    const n = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(v);
    return this.unit ? `${n} ${this.unit}` : n;
  }
  /** The finite values with their indexes */
  private get known() {
    const out: { i: number; v: number }[] = [];
    this.values.forEach((v, i) => {
      if (typeof v === "number" && Number.isFinite(v)) out.push({ i, v });
    });
    return out;
  }
  /** The scale's bottom and top */
  private domain(known: { v: number }[]) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const { v } of known) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    if (this.reference !== undefined && Number.isFinite(this.reference)) {
      lo = Math.min(lo, this.reference);
      hi = Math.max(hi, this.reference);
    }
    if (this.type === "bars") {
      lo = Math.min(lo, 0);
      hi = Math.max(hi, 0);
    }
    if (this.min !== undefined && Number.isFinite(this.min)) lo = this.min;
    if (this.max !== undefined && Number.isFinite(this.max)) hi = this.max;
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { lo: 0, hi: 1 };
    if (hi === lo) return { lo: lo - 1, hi: hi + 1 };
    return hi < lo ? { lo: hi, hi: lo } : { lo, hi };
  }
  /** The tone in use: a fixed one, or by which way it went */
  private get toneNow(): Exclude<SparklineTone, "auto"> {
    if (this.tone !== "auto") return this.tone;
    const known = this.known;
    if (!this.good || known.length < 2) return "neutral";
    const change = known[known.length - 1].v - known[0].v;
    if (change === 0) return "neutral";
    return (change > 0) === (this.good === "up") ? "success" : "danger";
  }
  /** The summary read for the whole chart */
  private get summary() {
    const name = this.label ?? "Trend";
    const known = this.known;
    if (!known.length) return `${name}: no data`;
    if (this.type === "win-loss") {
      const up = known.filter((k) => k.v > 0).length;
      const down = known.filter((k) => k.v < 0).length;
      const level = known.length - up - down;
      return `${name}: ${up} up, ${down} down${level ? `, ${level} level` : ""}`;
    }
    let hi = known[0].v;
    let lo = known[0].v;
    for (const { v } of known) {
      hi = Math.max(hi, v);
      lo = Math.min(lo, v);
    }
    const first = known[0].v;
    const last = known[known.length - 1].v;
    const ref = this.reference !== undefined && Number.isFinite(this.reference) ? `; ${this.referenceLabel.toLowerCase()} ${this.num(this.reference)}` : "";
    if (known.length === 1) return `${name}: ${this.num(last)}${ref}`;
    return `${name}: from ${this.num(first)} to ${this.num(last)}, high ${this.num(hi)}, low ${this.num(lo)}${ref}`;
  }
  private pointText(i: number) {
    const v = this.values[i];
    const label = this.labels?.[i];
    const value = typeof v === "number" && Number.isFinite(v) ? this.num(v) : "No data";
    return label ? `${label}: ${value}` : value;
  }

  /* ---------- Geometry, in a 100 × 100 box ---------- */

  private x(i: number, n: number) {
    if (this.type === "bars" || this.type === "win-loss") return ((i + 0.5) / n) * 100;
    return n <= 1 ? 50 : (i / (n - 1)) * 100;
  }
  private y(v: number, lo: number, hi: number) {
    return PAD + (1 - (v - lo) / (hi - lo)) * (100 - 2 * PAD);
  }

  /* ---------- Interaction ---------- */

  private showPoint(i: number | null) {
    if (i === this.point) return;
    this.point = i;
    if (i === null) return;
    this.announce = `${this.pointText(i)}, ${i + 1} of ${this.values.length}`;
    const v = this.values[i];
    this.emit<SparklinePointFocus>("tc-point-focus", { index: i, value: typeof v === "number" && Number.isFinite(v) ? v : null, label: this.labels?.[i] });
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.interactive || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const n = this.values.length;
    if (!n) return;
    const at = this.point ?? n - 1;
    const to =
      e.key === "ArrowRight" ? (this.point === null ? n - 1 : at + 1) : e.key === "ArrowLeft" ? (this.point === null ? n - 1 : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to !== null) {
      e.preventDefault();
      this.showPoint(Math.max(0, Math.min(n - 1, to)));
    } else if (e.key === "Escape" && this.point !== null) {
      e.preventDefault();
      this.point = null;
    }
  };

  private onPointer = (e: PointerEvent) => {
    if (!this.interactive || !this.values.length) return;
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!box.width) return;
    const n = this.values.length;
    const f = (e.clientX - box.left) / box.width;
    const i = this.type === "bars" || this.type === "win-loss" ? Math.floor(f * n) : Math.round(f * (n - 1));
    this.showPoint(Math.max(0, Math.min(n - 1, i)));
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.point !== null && (this.point >= this.values.length || !this.interactive)) this.point = null;
  }

  /* ---------- Rendering ---------- */

  private drawLine(lo: number, hi: number) {
    const n = this.values.length;
    const runs: string[][] = [];
    let run: string[] = [];
    this.values.forEach((v, i) => {
      if (typeof v === "number" && Number.isFinite(v)) run.push(`${this.x(i, n).toFixed(2)} ${this.y(v, lo, hi).toFixed(2)}`);
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    });
    if (run.length) runs.push(run);
    // The area fills down to 0 when 0 is in range, else to the bottom
    const base = this.y(Math.max(lo, Math.min(hi, 0)), lo, hi).toFixed(2);
    return svg`
      ${this.type === "area"
        ? runs.map((r) => svg`<path class="ui-spk__area" d=${`M ${r[0].split(" ")[0]} ${base} L ${r.join(" L ")} L ${r[r.length - 1].split(" ")[0]} ${base} Z`}></path>`)
        : nothing}
      ${runs.map((r) =>
        r.length === 1
          ? svg`<path class="ui-spk__line" d=${`M ${r[0]} l 0.01 0`}></path>`
          : svg`<path class="ui-spk__line" d=${`M ${r.join(" L ")}`}></path>`,
      )}`;
  }

  private drawBars(lo: number, hi: number) {
    const n = this.values.length;
    const slot = 100 / Math.max(1, n);
    const w = slot * 0.7;
    if (this.type === "win-loss")
      return this.values.map((v, i) => {
        if (typeof v !== "number" || !Number.isFinite(v) || v === 0) return nothing;
        const x = this.x(i, n) - w / 2;
        return svg`<rect class="ui-spk__bar" data-dir=${v > 0 ? "up" : "down"} data-i=${i} x=${x.toFixed(2)} y=${v > 0 ? 6 : 52} width=${w.toFixed(2)} height="42"></rect>`;
      });
    const zero = this.y(Math.max(lo, Math.min(hi, 0)), lo, hi);
    return this.values.map((v, i) => {
      if (typeof v !== "number" || !Number.isFinite(v)) return nothing;
      const y = this.y(Math.max(lo, Math.min(hi, v)), lo, hi);
      const top = Math.min(y, zero);
      const h = Math.max(1, Math.abs(zero - y));
      return svg`<rect class="ui-spk__bar" data-i=${i} x=${(this.x(i, n) - w / 2).toFixed(2)} y=${top.toFixed(2)} width=${w.toFixed(2)} height=${h.toFixed(2)}></rect>`;
    });
  }

  /** Markers and the highlighted point, as positioned dots – round however the drawing is stretched */
  private dots(lo: number, hi: number) {
    const known = this.known;
    const n = this.values.length;
    if (!known.length || this.type === "bars" || this.type === "win-loss") return nothing;
    const want = new Set(this.markers.split(/\s+/).filter(Boolean));
    const marked = new Map<number, string>();
    if (!want.has("none")) {
      let hiK = known[0];
      let loK = known[0];
      for (const k of known) {
        if (k.v > hiK.v) hiK = k;
        if (k.v < loK.v) loK = k;
      }
      if (want.has("min")) marked.set(loK.i, "min");
      if (want.has("max")) marked.set(hiK.i, "max");
      if (want.has("first")) marked.set(known[0].i, "first");
      if (want.has("last")) marked.set(known[known.length - 1].i, "last");
    }
    const at = (i: number) => {
      const v = this.values[i] as number;
      return `left: ${this.x(i, n).toFixed(2)}%; top: ${this.y(v, lo, hi).toFixed(2)}%`;
    };
    return html`${[...marked].map(([i, kind]) => html`<span class="ui-spk__dot" data-kind=${kind} style=${at(i)}></span>`)}`;
  }

  private tip(lo: number, hi: number) {
    const i = this.point;
    if (i === null || !this.interactive) return nothing;
    const n = this.values.length;
    const v = this.values[i];
    const known = typeof v === "number" && Number.isFinite(v);
    const left = this.x(i, n);
    const top = known && this.type !== "win-loss" ? this.y(Math.max(lo, Math.min(hi, v)), lo, hi) : 50;
    const side = left < 20 ? "start" : left > 80 ? "end" : "mid";
    return html`<span class="ui-spk__guide" style=${`left: ${left.toFixed(2)}%`}></span>
      ${known && this.type !== "bars" && this.type !== "win-loss" ? html`<span class="ui-spk__dot" data-kind="point" style=${`left: ${left.toFixed(2)}%; top: ${top.toFixed(2)}%`}></span>` : nothing}
      <span class="ui-spk__tip" data-side=${side} style=${`left: ${left.toFixed(2)}%`}>${this.pointText(i)}</span>`;
  }

  protected override render() {
    const known = this.known;
    const { lo, hi } = this.domain(known);
    const size = [this.width ? `--tc-spk-w: ${this.width}px` : "", this.height ? `--tc-spk-h: ${this.height}px` : ""].filter(Boolean).join("; ");
    const ref = this.reference !== undefined && Number.isFinite(this.reference) && this.type !== "win-loss" ? this.y(Math.max(lo, Math.min(hi, this.reference)), lo, hi) : null;
    const drawing = html`<svg class="ui-spk__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      ${this.type === "win-loss" ? svg`<line class="ui-spk__axis" x1="0" x2="100" y1="50" y2="50"></line>` : nothing}
      ${ref !== null ? svg`<line class="ui-spk__ref" x1="0" x2="100" y1=${ref.toFixed(2)} y2=${ref.toFixed(2)}></line>` : nothing}
      ${this.type === "bars" || this.type === "win-loss" ? this.drawBars(lo, hi) : this.drawLine(lo, hi)}
      ${this.point !== null && (this.type === "bars" || this.type === "win-loss")
        ? svg`<rect class="ui-spk__hit" x=${(this.x(this.point, this.values.length) - 50 / Math.max(1, this.values.length)).toFixed(2)} y="0" width=${(100 / Math.max(1, this.values.length)).toFixed(2)} height="100"></rect>`
        : nothing}
    </svg>`;
    if (!this.interactive)
      return html`<span class="ui-spk__plot" role="img" aria-label=${this.summary} data-tone=${this.toneNow} data-type=${this.type} style=${ifDefined(size || undefined)}
        >${drawing}${this.dots(lo, hi)}</span
      >`;
    const id = this.uid;
    return html`<span
        class="ui-spk__plot"
        role="group"
        tabindex="0"
        aria-roledescription="sparkline"
        aria-label=${this.summary}
        aria-describedby=${`${id}-keys`}
        data-tone=${this.toneNow}
        data-type=${this.type}
        style=${ifDefined(size || undefined)}
        @keydown=${this.onKey}
        @pointermove=${this.onPointer}
        @pointerdown=${this.onPointer}
        @pointerleave=${() => (this.point = null)}
        @blur=${() => (this.point = null)}
        >${drawing}${this.dots(lo, hi)}${this.tip(lo, hi)}</span
      ><span class="tc-sr-only" id=${`${id}-keys`}>Left and right arrows step through the points</span
      ><span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Inline in both looks: it sits in the text, as tall as a line */
[data-ui="spk"] {
  --tc-spk-w: 5em;
  --tc-spk-h: 1.25em;
  --tc-spk-ink: var(--tc-chart-1);
  --tc-spk-stroke: 1.5px;
  position: relative;
  display: inline-block;
  vertical-align: middle;
  line-height: var(--tc-line-height-none);
}
.ui-spk__plot { position: relative; display: block; width: var(--tc-spk-w); height: var(--tc-spk-h); color: var(--tc-spk-ink); outline: none; }
.ui-spk__plot[data-tone="info"] { --tc-spk-ink: var(--tc-status-info-fg); }
.ui-spk__plot[data-tone="success"] { --tc-spk-ink: var(--tc-status-success-fg); }
.ui-spk__plot[data-tone="warning"] { --tc-spk-ink: var(--tc-status-warning-fg); }
.ui-spk__plot[data-tone="danger"] { --tc-spk-ink: var(--tc-status-danger-fg); }
.ui-spk__plot[tabindex] { cursor: crosshair; border-radius: var(--tc-radius-2xs); }
.ui-spk__plot:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-spk__svg { display: block; width: 100%; height: 100%; overflow: visible; }
.ui-spk__line { fill: none; stroke: var(--tc-spk-ink); stroke-width: var(--tc-spk-stroke); stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-spk__area { fill: color-mix(in oklab, var(--tc-spk-ink) 18%, transparent); stroke: none; }
.ui-spk__bar { fill: var(--tc-spk-ink); }
.ui-spk__plot[data-type="win-loss"] .ui-spk__bar[data-dir="down"] { fill: var(--tc-status-danger-fg); }
.ui-spk__plot[data-type="win-loss"] .ui-spk__bar[data-dir="up"] { fill: var(--tc-status-success-fg); }
.ui-spk__plot[data-type="win-loss"][data-tone="neutral"] .ui-spk__bar[data-dir="up"] { fill: var(--tc-spk-ink); }
.ui-spk__plot[data-type="win-loss"][data-tone="neutral"] .ui-spk__bar[data-dir="down"] { fill: var(--tc-chart-neutral); }
.ui-spk__axis { stroke: var(--tc-border-default); stroke-width: 1px; vector-effect: non-scaling-stroke; }
.ui-spk__ref { stroke: var(--tc-text-muted); stroke-width: 1px; stroke-dasharray: 2 2; vector-effect: non-scaling-stroke; }
.ui-spk__hit { fill: color-mix(in oklab, var(--tc-spk-ink) 14%, transparent); }
/* Markers are round whatever the drawing's stretch: positioned dots, not SVG circles */
.ui-spk__dot { position: absolute; width: 5px; height: 5px; transform: translate(-50%, -50%); border-radius: 50%; background: var(--tc-spk-ink); pointer-events: none; }
.ui-spk__dot[data-kind="min"], .ui-spk__dot[data-kind="max"], .ui-spk__dot[data-kind="first"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.5px var(--tc-spk-ink); }
.ui-spk__dot[data-kind="point"] { width: 7px; height: 7px; box-shadow: 0 0 0 2px var(--tc-surface-raised); }
.ui-spk__guide { position: absolute; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); background: var(--tc-border-strong); pointer-events: none; }
/* The tooltip: above the chart, kept inside it at the ends */
.ui-spk__tip {
  position: absolute;
  bottom: calc(100% + var(--tc-space-1-5));
  z-index: 1;
  padding: var(--tc-tooltip-py) var(--tc-tooltip-px);
  border-radius: var(--tc-tooltip-radius);
  background: var(--tc-tooltip-bg);
  color: var(--tc-tooltip-fg);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-tooltip-font-size);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  transform: translateX(-50%);
  animation: ui-spk-tip var(--tc-duration-fast) var(--tc-ease-out);
}
.ui-spk__tip[data-side="start"] { transform: translateX(-8px); }
.ui-spk__tip[data-side="end"] { transform: translateX(calc(-100% + 8px)); }
@keyframes ui-spk-tip { from { opacity: 0; } }
@media (forced-colors: active) {
  .ui-spk__line, .ui-spk__ref, .ui-spk__axis { stroke: CanvasText; }
  .ui-spk__bar, .ui-spk__area { fill: CanvasText; }
  .ui-spk__dot { background: Highlight; }
  .ui-spk__tip { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="spk"] *, [data-ui="spk"] *::before, [data-ui="spk"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-sparkline")) customElements.define("tc-sparkline", TcSparkline);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sparkline": TcSparkline;
  }
}
