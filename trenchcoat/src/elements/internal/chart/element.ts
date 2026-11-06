/*
 * The base of the ztd-charts ports (audit/ztd-charts-port-plan.md, D3–D6) – what ztd-charts' useChart and ChartFrame
 * did (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), as a Lit element:
 *   · the shell: the card header (icon, heading, description, legend and a Table button) on the Standard tray or the
 *     Clean card, or `bare` with no card for a chart inside another component;
 *   · the plot measures its width and draws an SVG that wide, `height` tall (or the chart's own height for that width);
 *   · the entrance waits until the chart is on screen; `still` or reduced motion draws everything at once;
 *   · one tab stop: arrows move through the marks, Home and End go to the ends, Enter or Space picks one, Escape
 *     lets go; the mark under the pointer or the keyboard shows a tooltip and, from the keyboard, is announced;
 *   · the Table button swaps the drawing for the same numbers as a table, and a screen reader always has that table.
 * A chart supplies the model (its marks and events from the data, at the measured size) and the drawing (SVG from the
 * marks' current values); see TcBarChart for the pattern.
 */
import { html, nothing, svg, type PropertyValues, type SVGTemplateResult, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "../base";
import { cardHead } from "../card-head";
import { adoptStyles } from "../styles";
import { reducedMotion } from "../../../internal/reduced-motion";
import { MotionController } from "./motion-controller";
import type { EasingName, Mark } from "./motion";
import { formatPercent, makeFormatter, type FormatName, type FormatSpec, type ValueFormatter } from "./format";
import { dataSignature } from "./parse";
import type { ChartEvent, Highlight, Row, TooltipData } from "./types";

export type ChartView = "chart" | "table";
/** How the active mark was reached */
export type ActiveVia = "pointer" | "keyboard" | "touch";

/** Details of the events */
export type ChartViewChange = { view: ChartView };
export type ChartMarkHover<T = Row> = { event: ChartEvent<T> | null };
export type ChartMarkClick<T = Row> = { event: ChartEvent<T> };

/** The words a chart shows or says – rename them through `labels` */
export type ChartLabels = {
  table: string;
  empty: string;
  value: string;
  /** "Share", a part's share of the whole */
  share: string;
  /** "Chart", read as the plot's role */
  chart: string;
  /** "{label}: {value}, {n} of {count}" – read when the keyboard moves */
  position: string;
  more: string;
};
export const defaultChartLabels: ChartLabels = {
  table: "Table",
  empty: "No data to show.",
  value: "Value",
  share: "Share",
  chart: "Chart",
  position: "{label}: {value}, {n} of {count}",
  more: "and {count} more",
};

/** What a chart works out from its data at the measured size */
export type ChartModel<M, T = Row> = {
  /** The marks that move */
  marks: Mark<M>[];
  /** One event per mark the keyboard and pointer reach, in reading order */
  events: ChartEvent<T>[];
  /** The drawing in words, read with its name */
  summary: string;
};

/** The size and words a chart draws with, worked out before its model */
export type ChartFrame = {
  width: number;
  height: number;
  locale: string | undefined;
  /** Value and unit */
  fv: ValueFormatter;
  /** Value only */
  fmt: ValueFormatter;
  /** 0–100 as a percentage */
  pct: ValueFormatter;
};

/** Which chart ink a series or category takes: the highlighted ones the accent, the rest the quiet ink */
export const emphasisInk = (hi: boolean) => (hi ? "var(--tc-plot-accent)" : "var(--tc-plot-rest)");
/** The nth categorical ink (0-based), the accent first, cycling through the six */
export const categoricalInk = (i: number) => `var(--tc-plot-ink-${(i % 6) + 1})`;

/**
 * Inks for categories where some are emphasised: the highlighted ones take the accent, the rest the chart inks from
 * the second on (the first is the accent's own); with nothing highlighted, every one takes the next ink
 */
export const emphasisCategorical = (n: number, hi: ReadonlySet<number>) => {
  if (!hi.size) return Array.from({ length: n }, (_, i) => categoricalInk(i));
  let k = 0;
  return Array.from({ length: n }, (_, i) => (hi.has(i) ? emphasisInk(true) : n - hi.size === 1 ? emphasisInk(false) : categoricalInk(1 + (k++ % 5))));
};

/** The font size the axes are drawn at – the same as --tc-font-size-xs, for measuring labels before drawing */
export const AXIS_FONT = 11;

let uidCount = 0;
const MAX_TABLE_ROWS = 60;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * The base of the ported charts: the card, the measured plot, motion, keyboard, tooltip and table.
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a mark, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A mark was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export abstract class TcChartElement<M, T = Row> extends TcElement {
  /** The heading, and the chart's name */
  @property() accessor heading = "";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The rows to draw */
  @property({ attribute: false }) accessor data: readonly T[] = [];
  /** What to emphasise: an index, a label, a list of them, "max", "min", "first", "last", "none", or a test */
  @property({ attribute: false }) accessor highlight: Highlight<T> | undefined = undefined;
  /** How values are written: "number", "integer", "percent", "compact", "currency", Intl options, or a function */
  @property({ attribute: false }) accessor format: FormatSpec | undefined = undefined;
  /** The unit after each value: "%", "ms", " runs" */
  @property() accessor unit = "";
  /** The language for numbers and dates, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The plot's height in px; by default the chart's own for its width */
  @property({ type: Number }) accessor height: number | undefined = undefined;
  /** Draws everything at once: no entrance and no transitions */
  @property({ type: Boolean }) accessor still = false;
  /** How marks move: "spring", "easeOut", "easeInOut" or "linear" */
  @property() accessor easing: EasingName = "spring";
  /** How long a move takes, in ms; by default the chart's own */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** Leaves the values off the marks */
  @property({ type: Boolean, attribute: "hide-labels" }) accessor hideLabels = false;
  /** No tooltip on hover or focus */
  @property({ type: Boolean, attribute: "hide-tooltip" }) accessor hideTooltip = false;
  /** No card: just the plot, for a chart inside another component */
  @property({ type: Boolean, reflect: true }) accessor bare = false;
  /** The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() */
  @property() accessor view: ChartView = "chart";
  /** The words it shows and says, merged over defaultChartLabels */
  @property({ attribute: false }) accessor labels: Partial<ChartLabels> = {};

  /** @internal The measured plot width; null until measured */
  @state() accessor measured: number | null = null;
  /** @internal The mark under the pointer or keyboard */
  @state() accessor active: number | null = null;
  /** @internal How it got there */
  @state() accessor via: ActiveVia | null = null;
  /** @internal On screen enough to play the entrance */
  @state() accessor onScreen = false;

  /** The chart's kind, read as its name when there's no heading: "Bar chart" */
  protected abstract readonly kind: string;
  /** The header icon: Lucide-style paths in a 24 × 24 box */
  protected abstract readonly icon: SVGTemplateResult;
  /** The plot's height for a width, when `height` isn't set */
  protected abstract defaultHeight(width: number): number;
  /** The marks, events and summary for the data at this size */
  protected abstract buildModel(frame: ChartFrame): ChartModel<M, T>;
  /** The drawing, from the marks' current values */
  protected abstract draw(frame: ChartFrame): SVGTemplateResult;
  /** The tooltip for the active mark, in plot px */
  protected abstract tip(i: number, frame: ChartFrame): TooltipData | null;
  /** The legend in the header, if the chart has one */
  protected headerLegend(): TemplateResult | typeof nothing {
    return nothing;
  }
  /** HTML drawn under the SVG – a canvas for charts with too many marks for SVG (internal/chart/canvas.ts) */
  protected underlay(_frame: ChartFrame): TemplateResult | typeof nothing {
    return nothing;
  }
  /** Called after every render while the plot is drawn – paints the underlay's canvas */
  protected paintUnderlay?(plot: HTMLElement, frame: ChartFrame): void;
  /** The default move length in ms */
  protected defaultDuration = 900;
  /** The delay between marks when data changes, in ms */
  protected stagger = 0;
  /** The format used when `format` isn't set */
  protected defaultFormat: FormatName | undefined = undefined;
  /** Properties of the subclass that change the model, besides the shared ones */
  protected modelKeys: readonly string[] = [];

  protected readonly motion = new MotionController<M>(this);
  protected model: ChartModel<M, T> = { marks: [], events: [], summary: "" };
  protected frame: ChartFrame = { width: 480, height: 240, locale: undefined, fv: String, fmt: String, pct: String };
  private uid = `tc-chart-${++uidCount}`;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private plotEl: Element | null = null;

  /** Whether marks move: not `still`, and the system doesn't ask for reduced motion */
  protected get motionEnabled() {
    return !this.still && !reducedMotion() && typeof window !== "undefined";
  }

  /** The words, with the page's over the defaults */
  protected get words(): ChartLabels {
    return { ...defaultChartLabels, ...this.labels };
  }

  override connectedCallback() {
    adoptStyles("tc-chart", chartCss, this.ownerDocument);
    this.dataset.chart = "";
    super.connectedCallback();
    document.addEventListener("pointerdown", this.onDocDown);
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1];
          const rootH = e.rootBounds?.height ?? window.innerHeight;
          // A chart taller than the screen never shows a quarter of itself at once: half the screen counts too
          const on = e.isIntersecting && (e.intersectionRatio >= 0.25 || e.intersectionRect.height >= rootH * 0.5);
          if (on) {
            this.onScreen = true;
            this.io?.disconnect();
          }
        },
        { threshold: [0, 0.05, 0.1, 0.25], rootMargin: "0px 0px -8% 0px" },
      );
      this.io.observe(this);
    } else this.onScreen = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onDocDown);
    this.ro?.disconnect();
    this.ro = undefined;
    this.plotEl = null;
    this.io?.disconnect();
  }

  /** Plays the entrance again */
  replay() {
    this.motion.replay();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const width = this.measured ?? 480;
    const height = this.height ?? Math.round(this.defaultHeight(width));
    const fmt = makeFormatter(this.format, this.locale, this.defaultFormat);
    const unit = this.unit;
    this.frame = { width, height, locale: this.locale, fmt, fv: (v) => `${fmt(v)}${unit}`, pct: (v) => formatPercent(v, { locale: this.locale }) };
    const shared = ["data", "highlight", "format", "unit", "locale", "height", "hideLabels", "measured", "labels"];
    const sig = dataSignature(this.data as never);
    if (!this.hasUpdated || shared.some((k) => changed.has(k)) || this.modelKeys.some((k) => changed.has(k)) || changed.has("still") || changed.has("onScreen")) {
      if ([...changed.keys()].some((k) => k !== "onScreen" && k !== "still")) this.model = this.buildModel(this.frame);
      this.motion.sync(this.model.marks, {
        enabled: this.motionEnabled,
        active: this.onScreen && this.measured !== null,
        dataKey: sig,
        easing: this.easing,
        duration: this.duration ?? this.defaultDuration,
        stagger: this.stagger,
      });
      // The active mark went with the data
      if (this.active !== null && this.active >= this.model.events.length) this.active = null;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const plot = this.querySelector<HTMLElement>(`#${this.uid}-plot`);
    if (plot && this.measured !== null && this.view === "chart") this.paintUnderlay?.(plot, this.frame);
    if (plot !== this.plotEl) {
      this.ro?.disconnect();
      this.plotEl = plot;
      if (plot && typeof ResizeObserver === "function") {
        this.ro = new ResizeObserver((entries) => {
          const w = entries[entries.length - 1]?.contentRect.width ?? 0;
          if (w > 0 && (this.measured === null || Math.abs(this.measured - w) >= 0.5)) this.measured = Math.round(w * 10) / 10;
        });
        this.ro.observe(plot);
      }
    }
  }

  /* ---------- The active mark ---------- */

  /** Makes mark i (or none) the active one */
  protected setActive(i: number | null, via: ActiveVia = "pointer") {
    if (i === this.active && via === this.via) return;
    const changedMark = i !== this.active;
    this.active = i;
    this.via = i === null ? null : via;
    if (changedMark) this.emit<ChartMarkHover<T>>("tc-mark-hover", { event: i === null ? null : (this.model.events[i] ?? null) });
  }
  /** Fires tc-mark-click for mark i */
  protected clickMark(i: number) {
    const event = this.model.events[i];
    if (event) this.emit<ChartMarkClick<T>>("tc-mark-click", { event });
  }
  /** How far a mark is faded while another is active */
  protected dim(i: number, base = 1) {
    return this.active === null || this.active === i ? base : base * 0.38;
  }
  /** The pointer handlers for mark i */
  protected hover(i: number) {
    return {
      enter: (e: PointerEvent) => this.setActive(i, e.pointerType === "touch" ? "touch" : "pointer"),
      click: () => this.clickMark(i),
    };
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (this.keyFirst?.(e)) {
      e.preventDefault();
      return;
    }
    const count = this.model.events.length;
    if (!count) return;
    const cur = this.active;
    let next: number | null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = cur === null ? 0 : (cur + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = cur === null ? count - 1 : (cur - 1 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      case "Escape":
        // Nothing active: Escape is the page's (a dialog closing round the chart)
        if (cur === null) return;
        next = null;
        break;
      case "Enter":
      case " ":
        if (cur !== null) {
          e.preventDefault();
          this.clickMark(cur);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    this.setActive(next, "keyboard");
  };

  /** The pointer moved over the plot, at (x, y) in plot px – for charts that read the nearest point, not a mark */
  protected plotMove?(x: number, y: number, e: PointerEvent): void;
  /** A press on the plot (plot px) – a drag to pick a range; return true to take it */
  protected plotDown?(x: number, y: number, e: PointerEvent): boolean;
  /** The press ended (plot px) */
  protected plotUp?(x: number, y: number, e: PointerEvent): void;
  /** A key on the plot before the shared keyboard model; return true when handled */
  protected keyFirst?(e: KeyboardEvent): boolean;
  /** What the status region says instead of the active mark – a picked range; null for the default */
  protected announcement(): string | null {
    return null;
  }
  /** HTML over the plot: a button that resets a zoom */
  protected overlay(_frame: ChartFrame): TemplateResult | typeof nothing {
    return nothing;
  }
  /** The pointer's position in plot px */
  private plotXY(e: PointerEvent) {
    const r = (e.currentTarget as Element).querySelector(".tc-chart__svg")?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return [((e.clientX - r.left) / r.width) * this.frame.width, ((e.clientY - r.top) / r.height) * this.frame.height] as const;
  }
  private onMove = (e: PointerEvent) => {
    if (!this.plotMove) return;
    const p = this.plotXY(e);
    if (p) this.plotMove(p[0], p[1], e);
  };
  private onDown = (e: PointerEvent) => {
    const p = this.plotXY(e);
    if (!p) return;
    if (this.plotDown?.(p[0], p[1], e)) return;
    // A tap reads the point under the finger, as a move would
    if (e.pointerType === "touch") this.plotMove?.(p[0], p[1], e);
  };
  private onUp = (e: PointerEvent) => {
    const p = this.plotXY(e);
    if (p) this.plotUp?.(p[0], p[1], e);
  };

  private onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "touch" && this.via !== "keyboard") this.setActive(null);
  };
  private onBlur = (e: FocusEvent) => {
    if (this.via === "keyboard" && !(e.currentTarget as Element).contains(e.relatedTarget as Node)) this.setActive(null);
  };
  /** A tapped mark stays until a tap outside the chart */
  private onDocDown = (e: Event) => {
    if (this.via === "touch" && !this.contains(e.target as Node)) this.setActive(null);
  };

  private setView(view: ChartView) {
    if (view === this.view) return;
    if (!this.emit<ChartViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
  }

  /* ---------- Rendering ---------- */

  private renderTip(frame: ChartFrame) {
    if (this.hideTooltip || this.active === null || this.measured === null) return nothing;
    const t = this.tip(this.active, frame);
    if (!t) return nothing;
    const below = t.y < 64;
    // Centred on the mark, kept 4px inside the plot at the ends (the % in translate is the tooltip's own width)
    const shift = `clamp(${(4 - t.x).toFixed(1)}px, -50%, calc(${(frame.width - t.x - 4).toFixed(1)}px - 100%))`;
    return html`<div class="tc-chart__tip" aria-hidden="true" ?data-below=${below}
      style=${`left: ${t.x.toFixed(1)}px; top: ${t.y.toFixed(1)}px; --tc-chart-tip-x: ${shift}`}>
      <div class="tc-chart__tip-title">${t.title}</div>
      ${t.rows.map(
        (r) => html`<div class="tc-chart__tip-row" ?data-strong=${r.strong !== false}>
          <span class="tc-chart__tip-label">${r.color ? html`<span class="tc-chart__tip-swatch" style=${`background: ${r.color}`}></span>` : nothing}${r.label ?? ""}</span>
          <span class="tc-chart__tip-value">${r.value}</span>
        </div>`,
      )}
    </div>`;
  }

  private renderTable(visible: boolean) {
    const ev = this.model.events;
    const w = this.words;
    const series = ev.some((e) => e.series);
    return html`<div class=${visible ? "tc-chart__scroll" : "tc-sr-only"}>
      <table class="tc-chart__table">
        <caption class="tc-sr-only">${this.heading || this.kind}</caption>
        ${visible
          ? html`<thead><tr><th scope="col">${this.tableHeader()}</th>${series ? html`<th scope="col">${this.seriesHeader()}</th>` : nothing}<th scope="col">${w.value}</th></tr></thead>`
          : nothing}
        <tbody>
          ${ev.slice(0, MAX_TABLE_ROWS).map(
            (e) => html`<tr>
              <th scope="row">${visible || !e.series ? e.label : `${e.label} · ${e.series}`}</th>
              ${visible && series ? html`<td data-text>${e.series ?? ""}</td>` : nothing}
              <td ?data-none=${e.value === null}>${e.formatted ?? (e.value === null ? "–" : String(e.value))}</td>
            </tr>`,
          )}
          ${ev.length > MAX_TABLE_ROWS ? html`<tr><td colspan="3">${fill(w.more, { count: ev.length - MAX_TABLE_ROWS })}</td></tr>` : nothing}
        </tbody>
      </table>
    </div>`;
  }
  /** The table's first column heading */
  protected tableHeader() {
    return "Category";
  }
  /** The table's series column heading */
  protected seriesHeader() {
    return "Series";
  }

  protected override render() {
    const id = this.uid;
    const f = this.frame;
    const w = this.words;
    const ev = this.model.events;
    const has = ev.length > 0;
    const table = this.view === "table" && has;
    const name = this.heading || this.kind;
    const activeEvent = this.active !== null ? ev[this.active] : null;
    const live =
      this.announcement() ??
      (this.via === "keyboard" && activeEvent
        ? fill(w.position, { label: activeEvent.series ? `${activeEvent.label} ${activeEvent.series}` : activeEvent.label, value: activeEvent.formatted ?? activeEvent.value ?? "", n: (this.active ?? 0) + 1, count: ev.length })
        : "");
    const legend = this.headerLegend();
    const head = this.bare
      ? nothing
      : cardHead({
          icon: this.icon,
          title: name,
          subtitle: this.description,
          id: `${id}-title`,
          aside: has
            ? html`${legend}<button type="button" class="tc-btn-sm tc-chart__toggle" aria-pressed=${table ? "true" : "false"} @click=${() => this.setView(table ? "chart" : "table")}>${w.table}</button>`
            : legend,
        });
    const plot = html`<div
        class="tc-chart__plot"
        id=${`${id}-plot`}
        role="group"
        aria-roledescription=${w.chart}
        aria-label=${this.bare ? name : nothing}
        aria-labelledby=${this.bare ? nothing : `${id}-title`}
        aria-describedby=${`${id}-read`}
        tabindex=${ifDefined(has ? 0 : undefined)}
        @keydown=${this.onKey}
        @pointerleave=${this.onLeave}
        @pointermove=${this.onMove}
        @pointerdown=${this.onDown}
        @pointerup=${this.onUp}
        @pointercancel=${this.onUp}
        @focusout=${this.onBlur}
        ?data-pending=${this.measured === null}
      >
        ${has && this.measured !== null ? this.underlay(f) : nothing}
        ${has
          ? svg`<svg class="tc-chart__svg" viewBox=${`0 0 ${Math.max(1, f.width)} ${Math.max(1, f.height)}`} height=${f.height} aria-hidden="true">${this.measured === null ? nothing : this.draw(f)}</svg>`
          : html`<p class="tc-chart__empty">${w.empty}</p>`}
        ${has && this.measured !== null ? this.overlay(f) : nothing}
        ${this.renderTip(f)}
      </div>
      <span class="tc-sr-only" id=${`${id}-read`}>${has ? this.model.summary : w.empty}</span>
      <span class="tc-sr-only" role="status">${live}</span>
      ${has ? this.renderTable(false) : nothing}`;
    return html`${head}
      <div class="tc-chart__card">${table ? this.renderTable(true) : html`<div class="tc-chart__body">${plot}</div>`}</div>`;
  }
}

/* The shared look of every ported chart – adopted once, like the card header. Each chart adds its own marks' CSS */
export const chartCss = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-chart] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-chart] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Bare: no tray and no card */
[data-chart][bare] { padding: 0; border-radius: 0; background: none; box-shadow: none; overflow: visible; }
/* The inks – override any of them on the element: the accent and the rest for emphasis, six for categories */
[data-chart] {
  --tc-plot-accent: var(--tc-chart-1);
  --tc-plot-rest: var(--tc-chart-neutral);
  --tc-plot-line-rest: var(--tc-text-muted);
  --tc-plot-ink-1: var(--tc-chart-1);
  --tc-plot-ink-2: var(--tc-chart-2);
  --tc-plot-ink-3: var(--tc-chart-3);
  --tc-plot-ink-4: var(--tc-chart-4);
  --tc-plot-ink-5: var(--tc-chart-5);
  --tc-plot-ink-6: var(--tc-chart-6);
  --tc-plot-grid: var(--tc-border-subtle);
  --tc-plot-zero: var(--tc-border-strong);
  --tc-plot-focus: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *)[data-chart] { --tc-plot-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-chart], [data-chart][bare] { --tc-plot-bg: var(--tc-surface-raised); }
[data-chart] *, [data-chart] *::before, [data-chart] *::after { box-sizing: border-box; }
[data-chart] p { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).tc-chart__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-chart][bare] .tc-chart__card { overflow: visible; border-radius: 0; background: none; box-shadow: none; }
.tc-chart__toggle[aria-pressed="true"] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); box-shadow: none; }
.tc-chart__body { padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).tc-chart__body { padding-top: var(--tc-space-2); }
[data-chart][bare] .tc-chart__body { padding: 0; }
/* ----- The plot: as wide as the card, the SVG drawn at that width ----- */
.tc-chart__plot { position: relative; width: 100%; border-radius: var(--tc-radius-sm); }
.tc-chart__plot:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.tc-chart__plot[data-pending] .tc-chart__svg { visibility: hidden; }
.tc-chart__svg { position: relative; display: block; width: 100%; overflow: visible; touch-action: pan-y; font-family: inherit; }
/* A canvas under the SVG, for charts with too many marks for SVG */
.tc-chart__canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
/* Drawn text: the axes, the values on marks */
.tc-chart__tick { font-size: var(--tc-font-size-xs); fill: var(--tc-text-muted); font-variant-numeric: tabular-nums; pointer-events: none; }
.tc-chart__tick[data-strong] { font-weight: var(--tc-font-weight-strong); fill: var(--tc-text-primary); }
.tc-chart__value { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); fill: var(--tc-text-secondary); font-variant-numeric: tabular-nums; pointer-events: none; }
.tc-chart__value[data-strong] { font-weight: var(--tc-font-weight-strong); fill: var(--tc-text-primary); }
.tc-chart__grid { stroke: var(--tc-plot-grid); stroke-width: 1; shape-rendering: crispEdges; }
.tc-chart__grid[data-zero] { stroke: var(--tc-plot-zero); }
.tc-chart__hit { fill: transparent; }
.tc-chart__focus { fill: none; stroke: var(--tc-plot-focus); stroke-width: 2; }
.tc-chart__mark { transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
/* ----- The tooltip: above the mark (below it near the top), kept inside the plot ----- */
.tc-chart__tip {
  position: absolute;
  z-index: 5;
  max-width: calc(100% - var(--tc-space-2));
  padding: var(--tc-tooltip-py) var(--tc-tooltip-px);
  border-radius: var(--tc-tooltip-radius);
  background: var(--tc-tooltip-bg);
  color: var(--tc-tooltip-fg);
  font-size: var(--tc-tooltip-font-size);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  pointer-events: none;
  transform: translate(var(--tc-chart-tip-x), calc(-100% - var(--tc-space-3)));
}
.tc-chart__tip[data-below] { transform: translate(var(--tc-chart-tip-x), var(--tc-space-3)); }
.tc-chart__tip-title { overflow: hidden; text-overflow: ellipsis; font-weight: var(--tc-font-weight-strong); }
.tc-chart__tip-row { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); margin-top: var(--tc-space-0-5); }
.tc-chart__tip-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.tc-chart__tip-row[data-strong] .tc-chart__tip-value { font-weight: var(--tc-font-weight-strong); }
.tc-chart__tip-swatch { width: 8px; height: 8px; border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-tooltip-fg) 35%, transparent); }
/* ----- The legend, in the header ----- */
.tc-chart__legend { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); margin: 0; padding: 0; list-style: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.tc-chart__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.tc-chart__swatch { width: 10px; height: 10px; border-radius: var(--tc-radius-xs); }
/* ----- The table view ----- */
.tc-chart__scroll { overflow-x: auto; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-4); scrollbar-width: thin; }
.tc-chart__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.tc-chart__table th, .tc-chart__table td { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: 1px solid var(--tc-border-subtle); text-align: right; white-space: nowrap; }
.tc-chart__table th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.tc-chart__table th[scope="row"], .tc-chart__table thead th:first-child, .tc-chart__table td[data-text] { text-align: left; color: var(--tc-text-secondary); }
.tc-chart__table td { color: var(--tc-text-primary); }
.tc-chart__table td[data-none] { color: var(--tc-text-muted); }
.tc-chart__empty { padding: var(--tc-space-6) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .tc-chart__grid { stroke: GrayText; }
  .tc-chart__focus { stroke: Highlight; }
  .tc-chart__tip { border: 1px solid CanvasText; }
  .tc-chart__swatch, .tc-chart__tip-swatch { forced-color-adjust: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-chart] *, [data-chart] *::before, [data-chart] *::after { animation: none !important; transition: none !important; }
}
`;
