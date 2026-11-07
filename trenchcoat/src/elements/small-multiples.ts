import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { toNumber, uniq } from "./internal/chart/accessor";
import { categoricalInk, chartSheets } from "./internal/chart/element";
import { chartLoader } from "./internal/chart/loaders";
import { fitDomain } from "./internal/chart/scale";
import { chartType, inlineRows, resolveSpecData, specToElement, validateSpec, type ChartSpec, type SpecData, type SpecIssue } from "./internal/chart/spec";
import { adoptStyles } from "./internal/styles";

/*
 * <tc-small-multiples> – one chart repeated in a grid, a panel per value of a `facet` field: a line per lab, a donut
 * per site. Any chart a spec can draw (tc-chart's types), from a spec – or `type`, `data`, `encoding` and `options` –
 * checked once before the rows are split. Each panel is the chart drawn bare under the facet value; the grid sits in
 * one card with the heading, the description and, where the charts have series, one legend for them all.
 *   · `shared="y"` (the default) gives every panel the same value axis, so heights compare honestly – for the charts
 *     with a value range to set (Line, Area, Bar); "both" also gives xy panels the same x values; "none" lets each fit
 *     its own data
 *   · panels follow the data's order, or `sort="alpha"`, or `"value"` (the largest total first)
 *   · columns fit the width (`min-panel-width`, 220px), or `columns`, never so many a panel drops under 160px
 *   · pointing at an x in one panel shows the same x in every panel (linkActive), without their tooltips
 *   · each panel is a list item and its own tab stop, its chart named by the facet value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-small-multiples facet="lab" .spec=${{ type: "line", data: rows, encoding: { x: "month", y: "samples" } }}></tc-small-multiples>
 */

/** A 2×2 grid of small charts, drawn in the Lucide style (24 × 24, 2px strokes) */
const gridIcon = svg`<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><path d="M5 8l1.5-1.5L8 7.5"></path><path d="M16 8l1.5-2L19 7"></path>`;

export type SmallMultiplesSort = "data" | "alpha" | "value";
export type SmallMultiplesShared = "y" | "both" | "none";

/** The words small multiples add */
export type SmallMultiplesLabels = {
  /** "{chart} by {facet}" – the heading when neither `heading` nor the spec's title gives one */
  title: string;
  /** "{count} charts, one per {facet}" – the grid's name */
  list: string;
  /** A panel for rows with no facet value */
  none: string;
  /** Over what's wrong with the spec */
  problem: string;
};
export const defaultSmallMultiplesLabels: SmallMultiplesLabels = {
  title: "{chart} by {facet}",
  list: "{count} charts, one per {facet}",
  none: "No value",
  problem: "These charts can't be drawn",
};

/** Details of tc-spec-check */
export type SmallMultiplesCheck = { valid: boolean; errors: SpecIssue[]; warnings: SpecIssue[] };

type Row = Record<string, unknown>;
type Panel = { key: string; props: Record<string, unknown> };

/** Properties a spec never sets on a panel: its own working state, and what the grid decides */
const PRIVATE = new Set(["look", "contextLook", "measured", "active", "via", "onScreen", "zoomed", "brushTick", "bare", "description"]);
/** Charts whose series take the chart inks in order, so one legend can name them for every panel */
const SERIES_TYPES = new Set(["tc-line-chart", "tc-area-chart", "tc-bar-chart"]);
/** A panel never narrower than this, whatever `columns` asks */
const MIN_PANEL = 160;
/** The grid's gap, as --tc-space-4 */
const GAP = 16;

let count = 0;
/** A chart never connected, for its properties' defaults */
const pristine = new Map<string, Record<string, unknown>>();
const defaultOf = (tag: string, k: string) => {
  let el = pristine.get(tag);
  if (!el) pristine.set(tag, (el = document.createElement(tag) as unknown as Record<string, unknown>));
  return el[k];
};
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/**
 * One chart repeated in a grid, a panel per value of a field – any chart a spec can draw – on a shared scale, with
 * one legend and linked pointing.
 * @tag tc-small-multiples
 * @fires tc-spec-check - The spec was checked ({ valid, errors, warnings }: SmallMultiplesCheck)
 * @fires tc-mark-hover - A panel's pointer or keyboard moved to a mark, or off them – from the panel's chart ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A panel's mark was clicked or picked – from the panel's chart ({ event }: ChartMarkClick)
 */
export class TcSmallMultiples extends TcElement {
  static override ui = "sml";

  /** The heading; by default the spec's title, else "{chart} by {facet}" */
  @property() accessor heading = "";
  /** One line under the heading; by default the spec's description */
  @property() accessor description: string | undefined = undefined;
  /** The chart as JSON, as tc-chart takes it – the rows are split by `facet` */
  @property({ attribute: false }) accessor spec: ChartSpec | null = null;
  /** The field whose values make the panels */
  @property() accessor facet = "";
  /** The chart type, without a spec: "line", "bar", "donut"… */
  @property() accessor type: string | undefined = undefined;
  /** The rows, without a spec */
  @property({ attribute: false }) accessor data: SpecData = [];
  /** Channel → field, without a spec */
  @property({ attribute: false }) accessor encoding: Record<string, string | string[]> | undefined = undefined;
  /** The chart's other properties, without a spec */
  @property({ attribute: false }) accessor options: Record<string, unknown> | undefined = undefined;
  /** How many panels in a row; by default as many as fit at `min-panel-width` */
  @property({ type: Number }) accessor columns: number | undefined = undefined;
  /** The narrowest a panel gets before the grid drops a column, in px */
  @property({ type: Number, attribute: "min-panel-width" }) accessor minPanelWidth = 220;
  /** The panels' order: the data's ("data"), by name ("alpha"), or the largest total first ("value") */
  @property() accessor sort: SmallMultiplesSort = "data";
  /** Which scales the panels share: the value axis ("y"), x too ("both"), or none */
  @property() accessor shared: SmallMultiplesShared = "y";
  /** Each panel's chart height, in px; by default the chart's own for its width */
  @property({ type: Number, attribute: "panel-height" }) accessor panelHeight: number | undefined = undefined;
  /** The grid's own words, merged over defaultSmallMultiplesLabels */
  @property({ attribute: false }) accessor smallMultiplesLabels: Partial<SmallMultiplesLabels> = {};

  /** @internal What's wrong with the spec */
  @state() accessor problems: SpecIssue[] = [];
  /** @internal The panels, split and ready */
  @state() accessor panels: Panel[] = [];
  /** @internal The chart each panel draws */
  @state() accessor tag = "";
  /** @internal The series one legend names, in ink order */
  @state() accessor seriesNames: string[] = [];
  /** @internal The grid's measured width */
  @state() accessor measured: number | null = null;

  private run = 0;
  private charts = new Map<string, HTMLElement>();
  /** The properties last set on each panel's chart, so one the spec drops goes back to its default */
  private setKeys = new WeakMap<HTMLElement, Set<string>>();
  private ro?: ResizeObserver;
  private gridEl: Element | null = null;
  private uid = `tc-sml-${++count}`;

  private get words(): SmallMultiplesLabels {
    return { ...defaultSmallMultiplesLabels, ...this.smallMultiplesLabels };
  }

  /** The spec in use: `spec`, else one made of `type`, `data`, `encoding` and `options` */
  private get source(): ChartSpec | null {
    if (this.spec) return this.spec;
    if (!this.type) return null;
    return { type: this.type, data: this.data, ...(this.encoding ? { encoding: this.encoding } : {}), ...(this.options ? { options: this.options } : {}) };
  }

  override connectedCallback() {
    // The legend's look is the charts'
    for (const [key, css] of chartSheets) adoptStyles(key, css, this.ownerDocument);
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.gridEl = null;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (["spec", "facet", "type", "data", "encoding", "options", "sort", "shared", "panelHeight", "smallMultiplesLabels"].some((k) => changed.has(k))) void this.apply();
  }

  private async apply() {
    const run = ++this.run;
    const spec = this.source;
    if (!spec) {
      this.problems = [];
      this.panels = [];
      return;
    }
    let s = spec;
    try {
      if (spec.data && !Array.isArray(spec.data) && typeof (spec.data as { url?: unknown }).url === "string") {
        s = await resolveSpecData(spec);
        if (run !== this.run) return;
      }
    } catch (e) {
      this.report({ valid: false, errors: [{ path: "data.url", code: "fetch", message: (e as Error).message }], warnings: [] });
      return;
    }
    const check = validateSpec(s);
    const all = (inlineRows(s.data) ?? []) as Row[];
    if (!this.facet) check.errors.push({ path: "facet", code: "required", message: "facet names the field whose values make the panels" });
    else if (all.length && !all.some((r) => this.facet in r)) {
      const fields = uniq(all.slice(0, 200).flatMap((r) => Object.keys(r)));
      check.errors.push({ path: "facet", code: "missing-field", message: `No field "${this.facet}" in the data. Fields: ${fields.join(", ")}` });
    }
    check.valid = check.errors.length === 0;
    this.report(check);
    if (!check.valid) return;
    const def = chartType(s.type)!;
    await chartLoader(def.tag);
    if (run !== this.run) return;
    this.split(s, def.tag, all);
  }

  private report(check: SmallMultiplesCheck) {
    this.problems = check.errors;
    if (!check.valid) {
      this.panels = [];
      this.seriesNames = [];
    }
    this.emit<SmallMultiplesCheck>("tc-spec-check", check);
  }

  /** The rows split by the facet, each panel's properties, the shared scales and the legend */
  private split(s: ChartSpec, tag: string, all: Row[]) {
    const w = this.words;
    const def = chartType(s.type)!;
    const enc = s.encoding ?? {};
    const opts = s.options ?? {};
    const facetOf = (r: Row) => (r[this.facet] === null || r[this.facet] === undefined || r[this.facet] === "" ? w.none : String(r[this.facet]));
    const groups = new Map<string, Row[]>();
    for (const r of all) {
      const k = facetOf(r);
      const g = groups.get(k);
      if (g) g.push(r);
      else groups.set(k, [r]);
    }

    // The value channel: y for the xy charts, value for the rest
    const vch = def.channels.find((c) => c.name === "y" && c.type === "number") ?? def.channels.find((c) => c.name === "value");
    const vFields = vch ? (list(enc[vch.name]).length ? list(enc[vch.name]) : [vch.name]) : [];
    const total = (rows: Row[]) => rows.reduce((a, r) => a + vFields.reduce((b, f) => b + (Number.isFinite(toNumber(r[f])) ? toNumber(r[f]) : 0), 0), 0);

    let keys = [...groups.keys()];
    if (this.sort === "alpha") keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    else if (this.sort === "value") keys = keys.map((k, i) => ({ k, i, t: total(groups.get(k)!) })).sort((a, b) => b.t - a.t || a.i - b.i).map((o) => o.k);

    // Series: every panel has every series, in one order, so the inks match the one legend
    const xField = def.channels.some((c) => c.name === "x") ? (list(enc.x)[0] ?? "x") : null;
    const sField = def.channels.some((c) => c.name === "series") && enc.series !== undefined ? list(enc.series)[0] : null;
    const series = sField ? uniq(all.map((r) => String(r[sField] ?? ""))) : vFields.length > 1 && vch?.multi ? vFields : [];
    const legend = SERIES_TYPES.has(tag) && series.length > 1 && opts.highlight === undefined;
    const xKeys = xField ? uniq(all.map((r) => String(r[xField] ?? ""))) : [];
    const blank = (x: unknown, extra: Row = {}): Row => ({ ...(xField ? { [xField]: x } : {}), ...Object.fromEntries(vFields.map((f) => [f, null])), ...extra });
    const panelRows = (rows: Row[]) => {
      let out = rows;
      if (sField) {
        const have = new Set(rows.map((r) => String(r[sField] ?? "")));
        const firstX = xField ? rows[0]?.[xField] : undefined;
        out = [...out, ...series.filter((n) => !have.has(n)).map((n) => blank(firstX, { [sField]: n }))];
        const order = new Map(series.map((n, i) => [n, i]));
        out = out.map((r, i) => ({ r, i })).sort((a, b) => (order.get(String(a.r[sField] ?? "")) ?? 0) - (order.get(String(b.r[sField] ?? "")) ?? 0) || a.i - b.i).map((o) => o.r);
      }
      // Shared x: the x values a panel lacks, as empty rows, so every panel's axis runs the same way
      if (this.shared === "both" && xField) {
        const have = new Set(out.map((r) => String(r[xField] ?? "")));
        const missing = xKeys.filter((x) => !have.has(x));
        if (missing.length) {
          const byX = new Map(xKeys.map((x, i) => [x, i]));
          out = [...out, ...missing.map((x) => blank(x, sField ? { [sField]: series[0] } : {}))].sort((a, b) => (byX.get(String(a[xField] ?? "")) ?? 0) - (byX.get(String(b[xField] ?? "")) ?? 0));
        }
      }
      return out;
    };

    // Shared y: one value range over every panel, for the charts that take one
    const declared = (customElements.get(tag) as unknown as { elementProperties?: Map<string, unknown> } | undefined)?.elementProperties;
    let yDomain: [number, number] | undefined;
    if (this.shared !== "none" && declared?.has("yDomain") && opts.yDomain === undefined && vFields.length) {
      const stacked = (tag === "tc-bar-chart" && opts.layout === "stacked") || (tag === "tc-area-chart" && (opts.stack === "stacked" || (opts.stack === undefined && (sField !== null || vFields.length > 1))));
      const percent = (tag === "tc-bar-chart" && opts.layout === "percent") || (tag === "tc-area-chart" && opts.stack === "percent");
      if (!percent) {
        const vals: number[] = [];
        for (const rows of groups.values()) {
          if (stacked && xField) {
            const up = new Map<string, number>();
            const down = new Map<string, number>();
            for (const r of rows)
              for (const f of vFields) {
                const v = toNumber(r[f]);
                if (!Number.isFinite(v)) continue;
                const x = String(r[xField] ?? "");
                const m = v >= 0 ? up : down;
                m.set(x, (m.get(x) ?? 0) + v);
              }
            vals.push(...up.values(), ...down.values());
          } else
            for (const r of rows)
              for (const f of vFields) {
                const v = toNumber(r[f]);
                if (Number.isFinite(v)) vals.push(v);
              }
        }
        if (vals.length) {
          const zero = tag !== "tc-line-chart" || opts.zero === true;
          yDomain = fitDomain(Math.min(...vals), Math.max(...vals), 4, { zero });
        }
      }
    }

    this.tag = tag;
    this.seriesNames = legend ? series : [];
    this.panels = keys.map((key) => {
      const { props } = specToElement({ ...s, data: panelRows(groups.get(key)!), title: key, description: undefined });
      if (yDomain) props.yDomain = yDomain;
      // Line and Area emphasise one series by default: in a grid, each keeps its own ink, as the legend says
      if (legend && (tag === "tc-line-chart" || tag === "tc-area-chart") && opts.colorMode === undefined) props.colorMode = "categorical";
      if (legend) props.endLabels ??= false;
      if (this.panelHeight !== undefined) props.height = this.panelHeight;
      return { key, props };
    });
  }

  /** How many panels in a row */
  private get cols() {
    const n = Math.max(1, this.panels.length);
    const w = this.measured;
    if (w === null) return Math.min(n, this.columns ?? 2);
    const fit = (min: number) => Math.max(1, Math.floor((w + GAP) / (min + GAP)));
    return Math.min(n, this.columns ? Math.min(this.columns, fit(MIN_PANEL)) : fit(Math.max(MIN_PANEL, this.minPanelWidth)));
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.placeCharts();
    const grid = this.querySelector(`#${this.uid}-grid`);
    if (grid !== this.gridEl) {
      this.ro?.disconnect();
      this.gridEl = grid;
      if (grid && typeof ResizeObserver === "function") {
        this.ro = new ResizeObserver((entries) => {
          const wd = entries[entries.length - 1]?.contentRect.width ?? 0;
          if (wd > 0 && (this.measured === null || Math.abs(this.measured - wd) >= 0.5)) this.measured = Math.round(wd);
        });
        this.ro.observe(grid);
      }
    }
  }

  /** Each panel's chart in its slot – kept across renders, its properties set from the spec */
  private placeCharts() {
    const tag = this.tag;
    const declared = (customElements.get(tag) as unknown as { elementProperties?: Map<string, unknown> } | undefined)?.elementProperties;
    const keep = new Set<string>();
    for (const p of this.panels) {
      const slot = this.querySelector<HTMLElement>(`#${this.uid}-grid [data-slot="${CSS.escape(p.key)}"]`);
      if (!slot || !declared) continue;
      keep.add(p.key);
      let el = this.charts.get(p.key);
      if (!el || el.localName !== tag) {
        el?.remove();
        el = document.createElement(tag);
        (el as HTMLElement & { bare: boolean }).bare = true;
        this.charts.set(p.key, el);
      }
      if (el.parentElement !== slot) slot.append(el);
      const c = el as HTMLElement & Record<string, unknown>;
      const now = new Set<string>();
      for (const [k, v] of Object.entries(p.props))
        if (declared.has(k) && !PRIVATE.has(k)) {
          now.add(k);
          if (c[k] !== v) c[k] = v;
        }
      for (const k of this.setKeys.get(el) ?? []) if (!now.has(k)) c[k] = defaultOf(tag, k);
      this.setKeys.set(el, now);
      if (this.look && c.look !== this.look) c.look = this.look;
    }
    for (const [k, el] of this.charts)
      if (!keep.has(k)) {
        el.remove();
        this.charts.delete(k);
      }
  }

  /** A panel's pointer or keyboard moved: the same mark lights up in the others */
  private onHover = (e: Event) => {
    const src = (e.target as Element).closest?.("[data-chart]");
    if (!src) return;
    const key = (e as CustomEvent<{ event: { key: string } | null }>).detail?.event?.key ?? null;
    for (const el of this.charts.values()) if (el !== src) (el as HTMLElement & { linkActive?: (k: string | null) => void }).linkActive?.(key);
  };

  protected override render() {
    const w = this.words;
    const s = this.source;
    const def = s && typeof s.type === "string" ? chartType(s.type) : undefined;
    const title = this.heading || s?.title || (def && this.facet ? fill(w.title, { chart: def.name, facet: this.facet }) : def?.name) || "Small multiples";
    const legend = this.seriesNames.length
      ? html`<ul class="tc-chart__legend" aria-label="Series">
          ${this.seriesNames.map((n, i) => html`<li class="tc-chart__key"><span class="tc-chart__swatch" aria-hidden="true" style=${`background: ${categoricalInk(i)}`}></span>${n}</li>`)}
        </ul>`
      : nothing;
    const head = cardHead({ icon: gridIcon, title, subtitle: this.description ?? s?.description, id: `${this.uid}-title`, aside: legend });
    const body = this.problems.length
      ? html`<div class="ui-sml__problem" role="alert">
          <p class="ui-sml__problem-title">${w.problem}</p>
          <ul class="ui-sml__problem-list">
            ${this.problems.map((p) => html`<li><code>${p.path || "spec"}</code> ${p.message}</li>`)}
          </ul>
        </div>`
      : html`<ul class="ui-sml__grid" id=${`${this.uid}-grid`} style=${`--tc-sml-cols: ${this.cols}`} aria-label=${fill(w.list, { count: this.panels.length, facet: this.facet })}>
          ${repeat(
            this.panels,
            (p) => p.key,
            (p) => html`<li class="ui-sml__panel"><p class="ui-sml__name" aria-hidden="true">${p.key}</p><div class="ui-sml__slot" data-slot=${p.key} @tc-mark-hover=${this.onHover}></div></li>`,
          )}
        </ul>`;
    return html`${head}<div class="ui-sml__card">${body}</div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sml"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sml"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sml__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sml__card { padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-sml__card { padding-top: var(--tc-space-2); }
/* The grid: as many columns as fit, every panel the same width */
.ui-sml__grid {
  display: grid;
  grid-template-columns: repeat(var(--tc-sml-cols, 2), minmax(0, 1fr));
  gap: var(--tc-space-5) var(--tc-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ui-sml__panel { min-width: 0; }
.ui-sml__name {
  margin: 0 0 var(--tc-space-1-5);
  overflow: hidden;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-strong);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-sml__problem {
  padding: var(--tc-space-4);
  border: 1px dashed var(--tc-border-strong);
  border-radius: var(--tc-card-radius);
  font-size: var(--tc-font-size-sm);
  color: var(--tc-text-secondary);
}
.ui-sml__problem-title { margin: 0 0 var(--tc-space-1-5); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-sml__problem-list { margin: 0; padding-left: var(--tc-space-4); }
.ui-sml__problem-list code { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
`;
}

if (!customElements.get("tc-small-multiples")) customElements.define("tc-small-multiples", TcSmallMultiples);

declare global {
  interface HTMLElementTagNameMap {
    "tc-small-multiples": TcSmallMultiples;
  }
}
