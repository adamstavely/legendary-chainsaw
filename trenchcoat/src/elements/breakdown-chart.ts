import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { SmoothHeightController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-breakdown-chart> – the Lit port of src/components/breakdown-chart.tsx: a stacked bar chart with a linked table.
 * Pick what to measure, how to slice the bars and how to segment them; hover a bar or a row to see its breakdown,
 * click legend entries to hide segments.
 *
 *   <tc-breakdown-chart heading="Workload" .records=${records} .dimensions=${dimensions} .measures=${measures}>
 *   </tc-breakdown-chart>
 *
 * The host is the region (role="region", named by the heading). Clean has no tray – one white card with the title and
 * total on top, quiet white pickers, hairline gridlines and the legend as the card's last row. The hover breakdown
 * also opens when a bar has focus, stays while the pointer moves onto it and closes with Esc; the table holds the
 * same numbers for screen readers (and scrolls by keyboard when it is wider than the card).
 */

export type BreakdownDimension = {
  key: string;
  label: string;
  /** Values in display order */
  values: string[];
  /** Colors per value, used when this dimension segments the bars – keep each at 3:1 or more against the surface in both themes */
  colors?: Record<string, string>;
  /** Small icon element per value (cloned), shown under the bars and in the table */
  icons?: Record<string, Element>;
};

export type BreakdownMeasure = {
  key: string;
  label: string;
  /** Unit after the total, e.g. "tasks" or "points" */
  unit: string;
  /** Field to sum – leave empty to count records */
  field?: string;
};

export type BreakdownRecord = Record<string, string | number>;

/** Details of the change events */
export type BreakdownMeasureChange = { measure: string };
export type BreakdownSliceChange = { slice: string };
export type BreakdownSegmentChange = { segment: string };
export type BreakdownHiddenChange = { hidden: string[] };

export type BreakdownStatusKind = "backlog" | "todo" | "progress" | "review" | "done" | "canceled";

/**
 * Segment colors per look. Every one is at least 3:1 against both the light and the dark surface (WCAG 1.4.11), so
 * one palette serves both themes.
 */
const palettes: Record<Look, string[]> = {
  standard: ["#2f6bff", "#8b5cf6", "#db2777", "#0d9488", "#c2700a", "#737373", "#c026d3"],
  clean: ["#2f74e0", "#5b5bd6", "#0e7fa8", "#1a8a4a", "#b7791f", "#d93d42", "#8a63d2"],
};
const unsegmentedColor: Record<Look, string> = { standard: "#2f6bff", clean: palettes.clean[0] };

/** A clean axis top: 10, 20, 50, 100 … split into five steps */
function niceMax(max: number) {
  if (max <= 0) return 5;
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= raw)! * pow;
  return step * 5;
}

const INTEGER = new Intl.NumberFormat("en-US");
const fmt = (n: number) => (Number.isInteger(n) ? INTEGER.format(n) : n.toFixed(1));

const UNSEGMENTED = ["All"];
const COUNT: BreakdownMeasure = { key: "", label: "Count", unit: "" };
const NO_DIMENSION: BreakdownDimension = { key: "", label: "", values: [] };

const iconSize = (look: Look) => (look === "clean" ? 16 : 14);
const chevronIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width=${iconSize(look)} height=${iconSize(look)} fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.1 : 1.5} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m4.5 6.25 3.5 3.5 3.5-3.5"></path>`}</svg>`;
const checkIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width=${iconSize(look)} height=${iconSize(look)} fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.3 : 1.5} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m3.5 8.5 3 3 6-7"></path>`}</svg>`;

/** @internal The shapes of the small status icons: [tag, attributes] – "done" fills its square with the icon's color */
export function breakdownStatusShapes(kind: BreakdownStatusKind, color: string, look: Look): [string, Record<string, string>][] {
  switch (kind) {
    case "backlog":
      return [["path", { d: "M2.5 9.5 4 3.5h8l1.5 6M2.5 9.5v3h11v-3M2.5 9.5H6l.8 1.5h2.4l.8-1.5h3.5" }]];
    case "todo":
      return [["rect", { x: "3", y: "3", width: "10", height: "10", rx: "2.5" }]];
    case "progress":
      return [["circle", { cx: "8", cy: "8", r: "5.5" }], ["path", { d: "M8 5v3l2 1.5" }]];
    case "review":
      return [["path", { d: "M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8Z" }], ["circle", { cx: "8", cy: "8", r: "1.8" }]];
    case "done":
      return [
        ["rect", { x: "2.5", y: "2.5", width: "11", height: "11", rx: "3", fill: color, stroke: "none" }],
        ["path", { d: "m5.5 8.2 1.8 1.8 3.3-3.6", stroke: "#fff", "stroke-width": String(look === "clean" ? 1.3 : 1.5) }],
      ];
    case "canceled":
      return [["circle", { cx: "8", cy: "8", r: "5.5" }], ["path", { d: "m4.2 11.8 7.6-7.6" }]];
  }
}

/** @internal The attributes of a status icon's <svg> */
export function breakdownStatusFrame(color: string, look: Look): Record<string, string> {
  const size = String(look === "clean" ? 16 : 15);
  return { viewBox: "0 0 16 16", width: size, height: size, fill: "none", stroke: color, "stroke-width": String(look === "clean" ? 1.1 : 1.4), "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" };
}

/** @internal Marks a status icon drawn without a look of its own: the chart redraws it in its look */
export const STATUS_KIND_ATTR = "data-tc-status";

/** A small status icon element, for a dimension's `icons`. Without `look` it takes the chart's look */
export function breakdownStatusIcon({ kind, color = "currentColor", look }: { kind: BreakdownStatusKind; color?: string; look?: Look }): SVGSVGElement {
  const NS = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(NS, "svg");
  for (const [k, v] of Object.entries(breakdownStatusFrame(color, look ?? "standard"))) el.setAttribute(k, v);
  if (!look) el.setAttribute(STATUS_KIND_ATTR, kind);
  for (const [tag, attrs] of breakdownStatusShapes(kind, color, look ?? "standard")) {
    const child = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    el.append(child);
  }
  return el;
}

type Picker = "measure" | "slice" | "segment";
type Option = { value: string; label: string };

let uid = 0;

// The header icon: stacked columns
const chartIcon = svg`<path d="M11 13H7"></path><path d="M19 9h-4"></path><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><rect x="15" y="5" width="4" height="12" rx="1"></rect><rect x="7" y="8" width="4" height="9" rx="1"></rect>`;

/**
 * A stacked bar chart with a linked table: pick the measure, the slice and the segment; legend chips hide segments.
 * @tag tc-breakdown-chart
 * @fires tc-measure-change - The measure was picked; detail `{ measure: string }`. Cancelable (controlled use)
 * @fires tc-slice-change - The slice dimension was picked; detail `{ slice: string }`. Cancelable
 * @fires tc-segment-change - The segment dimension was picked ("none" for single-color bars); detail `{ segment: string }`. Cancelable
 * @fires tc-hidden-change - Segment values were hidden or shown; detail `{ hidden: string[] }`. Cancelable
 */
export class TcBreakdownChart extends TcElement {
  static override ui = "bc";

  /** The heading, and the region's name */
  @property() accessor heading = "Workload";
  /** Grow to the container's width instead of stopping at 560px */
  @property({ type: Boolean, reflect: true }) accessor fill = false;
  /** The rows to chart – one object per item, with a value for each dimension key and each measure field */
  @property({ attribute: false }) accessor records: BreakdownRecord[] = [];
  /** The fields people can slice and segment by, with their values in display order */
  @property({ attribute: false }) accessor dimensions: BreakdownDimension[] = [];
  /** What the bars can measure – a count of records, or the sum of a field */
  @property({ attribute: false }) accessor measures: BreakdownMeasure[] = [];
  /** Measure key; unset is the first measure */
  @property() accessor measure: string | undefined = undefined;
  /** Dimension key the bars are sliced by; unset is the first dimension */
  @property() accessor slice: string | undefined = undefined;
  /** Dimension key the bars are segmented by, or "none" for single-color bars; unset is the second dimension */
  @property() accessor segment: string | undefined = undefined;
  /** Segment values hidden from the bars and totals; picking another segment clears it (`hidden` is the HTML attribute) */
  @property({ attribute: false }) accessor hiddenSegments: string[] = [];

  /** @internal The bar or row under the pointer or focus */
  @state() accessor hover: string | null = null;
  /** @internal Which picker's menu is open */
  @state() accessor open: Picker | null = null;
  /** @internal The table is wider than the card */
  @state() accessor scrolls = false;

  private readonly uid = `tc-bc-${++uid}`;
  private ro?: ResizeObserver;
  private ownName = false;
  /** @internal */
  readonly smooth = new SmoothHeightController(
    this,
    () => this.querySelector<HTMLElement>(".ui-bc__morph"),
    () => this.querySelector<HTMLElement>(".ui-bc__table-wrap"),
  );

  /** @internal */
  get measureKey() {
    return this.measure ?? this.measures[0]?.key ?? "";
  }
  /** @internal */
  get sliceKey() {
    return this.slice ?? this.dimensions[0]?.key ?? "";
  }
  /** @internal */
  get segmentKey() {
    return this.segment ?? this.dimensions[1]?.key ?? "none";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
    document.addEventListener("keydown", this.onDocKey);
    window.addEventListener("pointerdown", this.onAway);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.onDocKey);
    window.removeEventListener("pointerdown", this.onAway);
    this.ro?.disconnect();
    this.ro = undefined;
  }

  protected override firstUpdated() {
    // The table scrolls sideways when it is wider than the card – then it is a tab stop, so the keyboard can scroll it
    const wrap = this.querySelector<HTMLElement>(".ui-bc__table-wrap");
    if (!wrap || typeof ResizeObserver !== "function") return;
    const check = () => {
      this.scrolls = wrap.scrollWidth > wrap.clientWidth + 1;
    };
    check();
    this.ro = new ResizeObserver(check);
    this.ro.observe(wrap);
    if (wrap.firstElementChild) this.ro.observe(wrap.firstElementChild);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The heading names the region unless the page gave it a name of its own
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    // A menu opens with focus on the picked option
    if (changed.has("open") && this.open) {
      const menu = this.querySelector<HTMLElement>(`#${this.uid}-${this.open}-menu`);
      const options = [...(menu?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
      (options.find((o) => o.getAttribute("aria-selected") === "true") ?? options[0])?.focus();
    }
  }

  // Esc closes the hover breakdown without moving focus (1.4.13)
  private onDocKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.hover !== null) this.hover = null;
  };
  // A click outside the open picker closes it
  private onAway = (e: PointerEvent) => {
    if (!this.open) return;
    const box = this.querySelector(`[data-picker="${this.open}"]`);
    if (!box?.contains(e.target as Node)) this.open = null;
  };

  private setMeasure(v: string) {
    if (v === this.measureKey) return;
    if (this.emit<BreakdownMeasureChange>("tc-measure-change", { measure: v }, { cancelable: true })) this.measure = v;
  }
  private setSlice(v: string) {
    if (v !== this.sliceKey && this.emit<BreakdownSliceChange>("tc-slice-change", { slice: v }, { cancelable: true })) this.slice = v;
    if (v === this.segmentKey) this.changeSegment("none");
  }
  private setHidden(next: string[]) {
    if (this.emit<BreakdownHiddenChange>("tc-hidden-change", { hidden: next }, { cancelable: true })) this.hiddenSegments = next;
  }
  /** Picking another segment shows every value again */
  private changeSegment(v: string) {
    if (v === this.segmentKey) return;
    if (this.emit<BreakdownSegmentChange>("tc-segment-change", { segment: v }, { cancelable: true })) this.segment = v;
    if (this.hiddenSegments.length) this.setHidden([]);
  }

  /** Closes the menu, with focus back on its button */
  private close(picker: Picker) {
    this.querySelector<HTMLElement>(`#${this.uid}-${picker}-btn`)?.focus();
    this.open = null;
  }

  private onMenuKey(e: KeyboardEvent, picker: Picker) {
    const items = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="option"]')];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const to = ({ ArrowDown: Math.min(items.length - 1, i + 1), ArrowUp: Math.max(0, i - 1), Home: 0, End: items.length - 1 } as Record<string, number>)[e.key];
    if (to !== undefined) {
      e.preventDefault();
      items[to]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.close(picker);
    } else if (e.key === "Tab") this.open = null;
  }

  /**
   * Small dropdown with a label above it – a listbox popup: ↓/↑ (or Enter/Space) on the button open it on the picked
   * option, ↑ ↓ Home End move, Enter/Space/click pick, Esc closes; both return focus to the button. Tab or a click
   * outside closes it
   */
  private renderSelect(look: Look, picker: Picker, label: string, value: string, options: Option[], onChange: (v: string) => void) {
    const id = `${this.uid}-${picker}`;
    const open = this.open === picker;
    const current = options.find((o) => o.value === value)?.label ?? value;
    return html`<div
      class="ui-bc__select"
      data-picker=${picker}
      @focusout=${(e: FocusEvent) => {
        if (open && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) this.open = null;
      }}
    >
      <span class="ui-bc__select-label" id=${id}>${label}</span>
      <button
        id="${id}-btn"
        type="button"
        class="ui-bc__select-btn"
        aria-haspopup="listbox"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${ifDefined(open ? `${id}-menu` : undefined)}
        aria-labelledby="${id} ${id}-value"
        @click=${() => (this.open = open ? null : picker)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            this.open = picker;
          }
        }}
      >
        <span id="${id}-value">${current}</span>${chevronIcon(look)}
      </button>
      ${open
        ? html`<div class="ui-bc__menu" id="${id}-menu" role="listbox" aria-labelledby=${id} @keydown=${(e: KeyboardEvent) => this.onMenuKey(e, picker)}>
            ${repeat(
              options,
              (o) => o.value,
              (o) => html`<button
                type="button"
                role="option"
                tabindex="-1"
                aria-selected=${o.value === value ? "true" : "false"}
                class="ui-bc__option"
                @click=${() => {
                  onChange(o.value);
                  this.close(picker);
                }}
              >
                <span>${o.label}</span>${o.value === value ? checkIcon(look) : nothing}
              </button>`,
            )}
          </div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const measures = this.measures;
    const dimensions = this.dimensions;
    const measureKey = this.measureKey;
    const sliceKey = this.sliceKey;
    const segmentKey = this.segmentKey;
    const measure = measures.find((m) => m.key === measureKey) ?? measures[0] ?? COUNT;
    const slice = dimensions.find((d) => d.key === sliceKey) ?? dimensions[0] ?? NO_DIMENSION;
    const segment = segmentKey === "none" ? null : (dimensions.find((d) => d.key === segmentKey) ?? null);
    const segValues = segment ? segment.values : UNSEGMENTED;
    // Only values of the current segment count as hidden
    const hidden = new Set(this.hiddenSegments.filter((v) => segValues.includes(v)));
    const palette = palettes[look];
    const color = (v: string, i: number) => segment?.colors?.[v] ?? (segment ? palette[i % palette.length] : unsegmentedColor[look]);
    const icon = (v: string) => {
      const el = slice.icons?.[v];
      if (!el) return nothing;
      // A status icon without a look of its own is drawn in the chart's
      const kind = el.getAttribute(STATUS_KIND_ATTR) as BreakdownStatusKind | null;
      return kind ? breakdownStatusIcon({ kind, color: el.getAttribute("stroke") ?? undefined, look }) : el.cloneNode(true);
    };

    const table = slice.values.map((sv) => {
      const cells: Record<string, number> = {};
      for (const seg of segValues) cells[seg] = 0;
      for (const r of this.records) {
        // Compare as strings, like the segments: numeric fields (e.g. a year) match their string values
        if (String(r[slice.key]) !== sv) continue;
        const seg = segment ? String(r[segment.key]) : "All";
        if (!(seg in cells)) continue;
        cells[seg] += measure.field ? Number(r[measure.field]) || 0 : 1;
      }
      const total = segValues.reduce((sum, seg) => sum + (hidden.has(seg) ? 0 : cells[seg]), 0);
      return { value: sv, cells, total };
    });

    const grand = table.reduce((s, r) => s + r.total, 0);
    const max = niceMax(Math.max(0, ...table.map((r) => r.total)));
    const ticks = [5, 4, 3, 2, 1, 0].map((i) => (max / 5) * i);
    const hover = this.hover;
    const hovered = table.find((r) => r.value === hover) ?? null;
    const hoverIndex = hovered ? table.indexOf(hovered) : -1;
    const tipId = `${this.uid}-tip`;

    const toggle = (seg: string) => {
      const next = new Set(hidden);
      if (next.has(seg)) next.delete(seg);
      else if (next.size < segValues.length - 1) next.add(seg);
      this.setHidden([...next]);
    };
    const dimensionOptions = dimensions.map((d) => ({ value: d.key, label: d.label }));
    const columns = styleMap({ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` });
    const setHover = (v: string | null) => () => (this.hover = v);

    const body = html`
      <div class="ui-bc__controls">
        ${this.renderSelect(look, "measure", "Measure", measureKey, measures.map((m) => ({ value: m.key, label: m.label })), (v) => this.setMeasure(v))}
        ${this.renderSelect(look, "slice", "Slice", sliceKey, dimensionOptions, (v) => this.setSlice(v))}
        ${this.renderSelect(look, "segment", "Segment", segmentKey, [{ value: "none", label: "None" }, ...dimensionOptions.filter((o) => o.value !== sliceKey)], (v) => this.changeSegment(v))}
      </div>

      <div class="ui-bc__chart" @pointerleave=${setHover(null)}>
        <div class="ui-bc__plot">
          ${repeat(
            ticks,
            (t) => t,
            (t) => html`<span class="ui-bc__grid" style=${styleMap({ bottom: `${(t / max) * 100}%` })} data-zero=${ifDefined(t === 0 ? "" : undefined)}><span class="ui-bc__tick">${fmt(t)}</span></span>`,
          )}
          <div class="ui-bc__bars" style=${columns}>
            ${repeat(
              table,
              (row) => row.value,
              (row) => html`<button
                type="button"
                class="ui-bc__col"
                data-dim=${ifDefined(hover && hover !== row.value ? "" : undefined)}
                data-active=${ifDefined(hover === row.value ? "" : undefined)}
                aria-label="${row.value}: ${fmt(row.total)} ${measure.unit}"
                aria-describedby=${ifDefined(hover === row.value && segment ? tipId : undefined)}
                @pointerenter=${setHover(row.value)}
                @focus=${setHover(row.value)}
                @blur=${setHover(null)}
              >
                <span class="ui-bc__rest" style=${styleMap({ bottom: `${(row.total / max) * 100}%` })}></span>
                <span class="ui-bc__bar" style=${styleMap({ height: `${(row.total / max) * 100}%` })}>
                  ${repeat(
                    segValues.map((seg, i) => ({ seg, i })).filter(({ seg }) => !hidden.has(seg) && row.cells[seg]),
                    ({ seg }) => seg,
                    ({ seg, i }) => html`<span class="ui-bc__seg" style=${styleMap({ flexGrow: String(row.cells[seg]), background: color(seg, i) })}></span>`,
                  )}
                </span>
              </button>`,
            )}
          </div>

          ${hovered
            ? html`<div
                id=${tipId}
                class="ui-bc__tooltip"
                style=${styleMap({ left: `${((hoverIndex + 0.5) / table.length) * 100}%` })}
                data-side=${(hoverIndex + 0.5) / table.length > 0.5 ? "left" : "right"}
              >
                <p class="ui-bc__tip-head">
                  <span class="ui-bc__tip-label">${icon(hovered.value)}${hovered.value}</span>
                  <strong>${fmt(hovered.total)}</strong>
                </p>
                ${segment
                  ? html`<ul>
                      ${repeat(
                        segValues
                          .map((seg, i) => ({ seg, i, v: hovered.cells[seg] }))
                          .filter((x) => x.v && !hidden.has(x.seg))
                          .sort((a, b) => b.v - a.v),
                        (x) => x.seg,
                        (x) => html`<li>
                          <span class="ui-bc__swatch" style=${styleMap({ background: color(x.seg, x.i) })}></span>
                          <span class="ui-bc__tip-seg">${x.seg}</span>
                          <span class="ui-bc__tip-num">${fmt(x.v)}</span>
                        </li>`,
                      )}
                    </ul>`
                  : nothing}
              </div>`
            : nothing}
        </div>
        <div class="ui-bc__xaxis" style=${columns}>
          ${repeat(
            table,
            (row) => row.value,
            (row) => html`<span class="ui-bc__xlabel" data-active=${ifDefined(hover === row.value ? "" : undefined)} title=${row.value}>${hover === row.value
              ? html`<span class="ui-bc__pill">${icon(row.value)}${row.value}</span>`
              : slice.icons?.[row.value]
                ? icon(row.value)
                : html`<span class="ui-bc__xtext">${row.value}</span>`}</span>`,
          )}
        </div>
      </div>

      <div class="ui-bc__morph">
        <div
          class="ui-bc__table-wrap"
          role=${ifDefined(this.scrolls ? "region" : undefined)}
          aria-label=${ifDefined(this.scrolls ? `${this.heading} table` : undefined)}
          tabindex=${ifDefined(this.scrolls ? 0 : undefined)}
        >
          <table class="ui-bc__table">
            <thead>
              <tr>
                <th scope="col">${slice.label}</th>
                <th scope="col" data-num>${measure.label}</th>
                ${segment
                  ? repeat(
                      segValues.map((seg, i) => ({ seg, i })),
                      ({ seg }) => seg,
                      ({ seg, i }) => html`<th scope="col" data-num data-hidden=${ifDefined(hidden.has(seg) ? "" : undefined)}>
                        <span class="ui-bc__th-seg"><span class="ui-bc__swatch" style=${styleMap({ background: color(seg, i) })}></span>${seg}</span>
                      </th>`,
                    )
                  : nothing}
              </tr>
            </thead>
            <tbody>
              ${repeat(
                table,
                (row) => row.value,
                (row) => html`<tr data-active=${ifDefined(hover === row.value ? "" : undefined)} @pointerenter=${setHover(row.value)} @pointerleave=${setHover(null)}>
                  <th scope="row"><span class="ui-bc__row-label">${icon(row.value)}${row.value}</span></th>
                  <td data-num data-total>${fmt(row.total)}</td>
                  ${segment
                    ? repeat(
                        segValues,
                        (seg) => seg,
                        (seg) => html`<td data-num data-hidden=${ifDefined(hidden.has(seg) ? "" : undefined)}>${fmt(row.cells[seg])}</td>`,
                      )
                    : nothing}
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html`
      ${cardHead({
        icon: chartIcon,
        title: this.heading,
        aside: html`<span class="ui-bc__total"><strong>${fmt(grand)}</strong> ${measure.unit}</span>`,
      })}

      ${look === "clean" ? body : html`<div class="ui-bc__card">${body}</div>`}

      <footer class="ui-bc__foot">
        ${segment
          ? html`<div class="ui-bc__legend" role="group" aria-label="${segment.label} – click to show or hide">
              ${repeat(
                segValues.map((seg, i) => ({ seg, i })),
                ({ seg }) => seg,
                ({ seg, i }) => html`<button type="button" class="ui-bc__chip" aria-pressed=${hidden.has(seg) ? "false" : "true"} @click=${() => toggle(seg)}>
                  <span class="ui-bc__swatch" style=${styleMap({ background: color(seg, i) })}></span>${seg}
                </button>`,
              )}
            </div>`
          : html`<span class="ui-bc__hint">Pick a segment to split the bars</span>`}
        ${hidden.size > 0 ? html`<button type="button" class="ui-bc__reset" @click=${() => this.setHidden([])}>Show all</button>` : nothing}
      </footer>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="bc"] */
[data-ui="bc"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
/* Like the Chat Composer: a tray with heading and legend, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bc"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bc"] {
  position: relative;
  container-type: inline-size;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
}
/* fill: as wide as the container */
[data-ui="bc"][fill] { max-width: none; }
[data-ui="bc"] *, [data-ui="bc"] *::before, [data-ui="bc"] *::after { box-sizing: border-box; }
:where([data-ui="bc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="bc"]) svg { display: block; flex: none; }
[data-ui="bc"] button:focus-visible, .ui-bc__table-wrap:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The total, beside the title */
.ui-bc__total { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__total { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__total { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-bc__total strong { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__total strong { line-height: var(--tc-line-height-loose); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Pickers: select fields with a label above */
.ui-bc__controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__controls { gap: var(--tc-space-2-5); padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__controls { gap: var(--tc-space-2); padding: 0 var(--tc-space-4); }
.ui-bc__select { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__select { gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select { gap: var(--tc-space-1); }
.ui-bc__select-label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-label { padding-left: var(--tc-space-0-5); }
.ui-bc__select-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  height: var(--tc-field-h);
  padding: 0 8px 0 var(--tc-field-px);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  font-size: var(--tc-field-font-size);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
  text-align: left;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bc__select-btn:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-bc__select-btn span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-bc__select-btn svg { flex: none; transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__select-btn svg { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-btn svg { color: var(--tc-icon-muted); }
.ui-bc__select-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
/* The menu (the reference menu): rows with the picked one in the selected colour and a ✓ */
.ui-bc__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  min-width: 140px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top center;
  animation: ui-bc-drop var(--tc-duration-base) var(--tc-ease-move);
}
.ui-bc__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  white-space: nowrap;
}
.ui-bc__option span { overflow: hidden; text-overflow: ellipsis; }
.ui-bc__option:hover, .ui-bc__option:focus-visible { background: var(--tc-menu-item-hover); }
/* The option with focus: the ring inside the row, so the menu's edge doesn't clip it */
[data-ui="bc"] .ui-bc__option:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-bc__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg); font-weight: var(--tc-font-weight-medium); }
/* Chart: a grid, the scale on the right, stacked bars */
:where([data-look="standard"], [data-look="standard"] *).ui-bc__chart { padding: 22px var(--tc-space-4-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chart { padding: var(--tc-space-5) var(--tc-space-4) var(--tc-space-2-5); }
.ui-bc__plot { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__plot { height: 200px; margin-right: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__plot { height: 196px; margin-right: var(--tc-space-7); }
.ui-bc__grid { position: absolute; left: 0; right: 0; height: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__grid { border-top: 1px dashed var(--tc-border-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__grid[data-zero] { border-top-style: solid; border-color: var(--tc-border-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__grid { border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__grid[data-zero] { border-color: var(--tc-border-strong); }
.ui-bc__tick { position: absolute; top: -8px; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); text-align: right; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tick { right: -30px; width: 26px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tick { right: -28px; width: 24px; }
.ui-bc__bars { position: absolute; inset: 0; display: grid; gap: var(--tc-space-1); }
.ui-bc__col { position: relative; display: flex; align-items: flex-end; justify-content: center; height: 100%; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
[data-ui="bc"] .ui-bc__col:focus-visible { outline-offset: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__col:focus-visible { border-radius: var(--tc-radius-sm); }
/* Hover: the other bars fade back, the hovered one shows its empty rest up to the top */
:where([data-look="standard"], [data-look="standard"] *).ui-bc__col[data-dim] { opacity: 0.38; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__col[data-dim] { opacity: 0.35; }
.ui-bc__rest { position: absolute; top: 0; left: 50%; opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), bottom var(--tc-duration-slowest) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__rest { width: 10px; margin-left: -5px; background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__rest { width: 12px; margin-left: -6px; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; background: var(--tc-fill-subtle); }
.ui-bc__col[data-active] .ui-bc__rest { opacity: 1; }
.ui-bc__bar { position: relative; display: flex; flex-direction: column-reverse; gap: var(--tc-space-0-5); min-height: 0; overflow: hidden; transition: height var(--tc-duration-slowest) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__bar { width: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__bar { width: 12px; border-radius: var(--tc-radius-2xs) var(--tc-radius-2xs) 0 0; }
.ui-bc__seg { flex-basis: 0; min-height: 2px; transition: flex-grow var(--tc-duration-slowest) var(--tc-ease-move), background-color var(--tc-duration-slow) var(--tc-ease-standard); }
/* The hover breakdown: a small popover beside the bar at the top of the plot, so it never leaves the card – flips on
   the right half. The pointer can move onto it (a bridge covers the gap to the bar) */
.ui-bc__tooltip {
  position: absolute;
  z-index: 4;
  top: 0;
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  transition: left var(--tc-duration-base) var(--tc-ease-move);
  animation: ui-bc-pop var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bc__tooltip::before { content: ""; position: absolute; top: 0; bottom: 0; width: var(--tc-breakdown-chart-tip-gap); }
.ui-bc__tooltip[data-side="right"] { transform: translateX(var(--tc-breakdown-chart-tip-gap)); }
.ui-bc__tooltip[data-side="right"]::before { right: 100%; }
.ui-bc__tooltip[data-side="left"] { transform: translateX(calc(-100% - var(--tc-breakdown-chart-tip-gap))); }
.ui-bc__tooltip[data-side="left"]::before { left: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tooltip { --tc-breakdown-chart-tip-gap: 22px; min-width: 150px; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tooltip { --tc-breakdown-chart-tip-gap: 18px; min-width: 152px; padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2); }
.ui-bc__tip-head { display: flex; align-items: center; justify-content: space-between; margin: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tip-head { gap: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tip-head { gap: var(--tc-space-4); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tip-head strong { font-weight: var(--tc-font-weight-medium); }
.ui-bc__tip-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); white-space: nowrap; }
.ui-bc__tooltip ul { display: grid; border-top: var(--tc-hairline) solid var(--tc-divider); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tooltip ul { gap: var(--tc-space-0-5); margin: var(--tc-space-1-5) 0 0; padding: var(--tc-space-1-5) 0 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tooltip ul { gap: 0; margin: var(--tc-space-1) 0 0; padding: var(--tc-space-1) 0 0; }
.ui-bc__tooltip li { display: flex; align-items: center; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__tooltip li { gap: var(--tc-space-2); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tooltip li { gap: var(--tc-space-2); line-height: var(--tc-line-height-normal); }
.ui-bc__tip-seg { flex: 1; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__tip-num { color: var(--tc-text-primary); }
.ui-bc__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
/* The x axis: icons or names; the hovered bar's label grows into a pill with its name */
.ui-bc__xaxis { display: grid; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__xaxis { margin: var(--tc-space-2) 30px 0 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__xaxis { margin: var(--tc-space-2) var(--tc-space-7) 0 0; }
.ui-bc__xlabel { position: relative; display: grid; place-items: center; height: 24px; min-width: 0; overflow: visible; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__xlabel { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__xlabel { color: var(--tc-icon-muted); }
.ui-bc__pill {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: 24px;
  background: var(--tc-surface-overlay);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-primary);
  transform: translate(-50%, -50%);
  animation: ui-bc-pill var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-bc__pill { padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-full); box-shadow: 0 0 0 1px var(--tc-border-default), var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__pill { padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); box-shadow: var(--tc-shadow-raised); }
.ui-bc__xtext { overflow: hidden; max-width: 100%; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted); }
/* Table linked to the bars */
.ui-bc__table-wrap { overflow-x: auto; border-top: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
[data-ui="bc"] .ui-bc__table-wrap:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-bc__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table { line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table { line-height: var(--tc-line-height-normal); }
.ui-bc__table th, .ui-bc__table td { border-top: var(--tc-hairline) solid var(--tc-divider); text-align: left; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table th, :where([data-look="standard"], [data-look="standard"] *).ui-bc__table td { height: 38px; padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td { height: 36px; padding: 0 var(--tc-space-2-5); background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:first-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:first-child { padding-left: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:last-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:last-child { padding-right: var(--tc-space-4); }
.ui-bc__table thead th { border-top: 0; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table thead th { font-weight: var(--tc-font-weight-regular); background: var(--tc-surface-on-tray); }
/* Clean column titles: captions */
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table thead th {
  height: 32px;
  font-size: var(--tc-caption-font-size);
  line-height: var(--tc-caption-line-height);
  font-weight: var(--tc-caption-font-weight);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-bc__table [data-num] { text-align: right; }
.ui-bc__table tbody th { position: sticky; left: 0; z-index: 1; font-weight: var(--tc-font-weight-regular); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody th { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table tbody th { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody tr { transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
/* The linked row: a wash, laid over the card colour so the sticky first cell stays opaque */
:where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody tr[data-active] th, :where([data-look="standard"], [data-look="standard"] *).ui-bc__table tbody tr[data-active] td { background: linear-gradient(var(--tc-fill-default), var(--tc-fill-default)) var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table tbody tr[data-active] th, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table tbody tr[data-active] td { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)) var(--tc-surface-raised); }
.ui-bc__table td { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table td[data-total] { color: var(--tc-text-primary); }
/* Hidden segments: muted (still readable) and struck through in the header, the swatch fades */
.ui-bc__table [data-hidden] { color: var(--tc-text-muted); }
.ui-bc__table th[data-hidden] .ui-bc__th-seg { text-decoration: line-through; }
.ui-bc__table [data-hidden] .ui-bc__swatch { opacity: 0.35; }
.ui-bc__row-label, .ui-bc__th-seg { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__row-label svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__th-seg { gap: var(--tc-space-1-5); }
/* Standard: the tray's last row · Clean: the card's last row – legend chips toggle segments */
.ui-bc__foot { display: flex; align-items: center; justify-content: space-between; min-height: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__foot { gap: var(--tc-space-2-5); padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__foot { gap: var(--tc-space-2); padding: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* The chips wrap onto more rows when they don't fit */
.ui-bc__legend { display: flex; flex-wrap: wrap; flex: 1 1 auto; min-width: 0; gap: var(--tc-space-0-5); }
.ui-bc__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-text-secondary);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-bc__chip { padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip { flex: none; padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); }
.ui-bc__chip:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip:hover { color: var(--tc-text-primary); }
/* Wrapped rows touch, so the focus ring sits inside the chip */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bc"] .ui-bc__chip:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
/* Off: muted and struck through (not only faded), the swatch fades */
.ui-bc__chip[aria-pressed="false"] { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-bc__chip[aria-pressed="false"] .ui-bc__swatch { opacity: 0.35; }
.ui-bc__hint { padding-left: var(--tc-space-2); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-bc__hint { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__hint { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Reset: Button's ghost, small */
.ui-bc__reset {
  flex: none;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-bc__reset:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__reset { animation: ui-bc-pop var(--tc-duration-fast) var(--tc-ease-standard); }
@keyframes ui-bc-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-bc-pop { from { opacity: 0; } }
@keyframes ui-bc-pill { from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); } }
/* Height changes glide instead of jumping */
.ui-bc__morph { overflow: hidden; }
.ui-bc__morph[data-smooth] { transition: height var(--tc-duration-slower) var(--tc-ease-move); }
/* Narrow (phones): tighter padding, smaller bars */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-bc__controls { gap: var(--tc-space-1-5); padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-btn { padding: 0 var(--tc-space-1) 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chart { padding: var(--tc-space-4-5) var(--tc-space-3) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__plot { height: 168px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__bar, :where([data-look="clean"], [data-look="clean"] *).ui-bc__rest { width: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__rest { margin-left: -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:first-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:first-child { padding-left: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__table th:last-child, :where([data-look="clean"], [data-look="clean"] *).ui-bc__table td:last-child { padding-right: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__foot { padding: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__legend { gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip { gap: var(--tc-space-1); padding: 0 var(--tc-space-1-5); }
}
/* Touch screens: taller pickers, menu rows and legend chips */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-bc__select-btn { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__option { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-bc__chip, :where([data-look="clean"], [data-look="clean"] *).ui-bc__reset { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-bc__bar, .ui-bc__seg, .ui-bc__tooltip, .ui-bc__col, .ui-bc__rest, .ui-bc__morph[data-smooth], .ui-bc__table tbody tr { transition: none; }
  .ui-bc__menu, .ui-bc__tooltip, .ui-bc__pill, .ui-bc__reset { animation: none; }
}
`;
}

if (!customElements.get("tc-breakdown-chart")) customElements.define("tc-breakdown-chart", TcBreakdownChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-breakdown-chart": TcBreakdownChart;
  }
}
