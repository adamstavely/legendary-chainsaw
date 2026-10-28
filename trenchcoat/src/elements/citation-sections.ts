import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-citation-sections> – where in citing papers a work is cited: a donut of the counts by section – by default
 * Intro, Methods, Results, Discussion and Other – beside a legend of each section's letter chip, name and count.
 * The sections are shaded from one ink, darkest first, so the order reads without a palette. Pointing at a segment
 * or a legend row highlights both and the readout under the donut names it: "Methods · 13 · 4%".
 *   · the legend rows are one tab stop: ↑ / ↓ move between them, Home / End to the ends
 *   · the page may put its own source name or logo on top (`source`, `logo`); there is no brand line otherwise
 *   · `href` adds a "See more details" link under the caption; `openable` makes it a button firing tc-open
 * Standard: a white card with a soft shadow. Clean: a hairline card.
 *
 *   <tc-citation-sections .counts=${{ intro: 107, methods: 13, results: 11, discussion: 114, other: 120 }}></tc-citation-sections>
 */

export type CitationSection = {
  id: string;
  label: string;
  /** The chip's letter; by default the label's first */
  letter?: string;
};
/** Details of the events */
export type CitationSectionsOpen = { href?: string };

/** The sections shown when the page gives none */
export const defaultCitationSections: CitationSection[] = [
  { id: "intro", label: "Intro", letter: "I" },
  { id: "methods", label: "Methods", letter: "M" },
  { id: "results", label: "Results", letter: "R" },
  { id: "discussion", label: "Discussion", letter: "D" },
  { id: "other", label: "Other", letter: "O" },
];

const R0 = 27;
const R1 = 48;
const GAP = 1.2;
const point = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(3)} ${(50 + r * Math.sin(a)).toFixed(3)}`;
};
/** A ring segment from `a0` to `a1` degrees clockwise from the top */
const arc = (a0: number, a1: number) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${point(R1, a0)}A${R1} ${R1} 0 ${large} 1 ${point(R1, a1)}L${point(R0, a1)}A${R0} ${R0} 0 ${large} 0 ${point(R0, a0)}Z`;
};
let uidCount = 0;

/**
 * Where a work is cited – a donut of the counts by section (Intro, Methods, Results, Discussion, Other), a legend
 * with letter chips, and the section under the pointer or focus named with its count and share.
 * @tag tc-citation-sections
 * @fires tc-open - "See more details" was used ({ href }: CitationSectionsOpen); cancelable – prevented, a link isn't followed
 */
export class TcCitationSections extends TcElement {
  static override ui = "cts";

  /** Each section's count by id: { intro: 107, methods: 13 … }; a section without one shows 0 */
  @property({ attribute: false }) accessor counts: Record<string, number> = {};
  /** The sections, in order – darkest first; by default Intro, Methods, Results, Discussion and Other */
  @property({ attribute: false }) accessor sections: CitationSection[] = defaultCitationSections;
  /** A source's name shown on top; none by default */
  @property() accessor source: string | undefined = undefined;
  /** A logo shown on top instead of `source` (cloned) */
  @property({ attribute: false }) accessor logo: Element | undefined = undefined;
  /** The caption under the donut, and the legend's name */
  @property() accessor caption = "Sections";
  /** Where the details are – adds a link under the caption */
  @property() accessor href: string | undefined = undefined;
  /** Without `href`, adds a button that fires tc-open */
  @property({ type: Boolean }) accessor openable = false;
  /** The link's or button's text */
  @property({ attribute: "details-label" }) accessor detailsLabel = "See more details";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active = 0;
  @state() private accessor shown: number | null = null;

  private uid = `tc-cts-${++uidCount}`;

  private count(id: string) {
    const n = this.counts[id];
    return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0;
  }
  private get total() {
    return this.sections.reduce((n, s) => n + this.count(s.id), 0);
  }
  /** How much of the ink a section gets: the first is the full colour, the last light */
  private mix(i: number) {
    const n = this.sections.length;
    return n <= 1 ? 100 : Math.round(100 - (i / (n - 1)) * 68);
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private pct(n: number) {
    const total = this.total;
    return total ? `${Math.round((n / total) * 100)}%` : "0%";
  }

  private focusRow(i: number) {
    const n = this.sections.length;
    if (!n) return;
    this.active = Math.max(0, Math.min(n - 1, i));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-row="${this.active}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
    if (!row || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = Number(row.dataset.row);
    const moves: Record<string, number> = { ArrowUp: i - 1, ArrowLeft: i - 1, ArrowDown: i + 1, ArrowRight: i + 1, Home: 0, End: this.sections.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      this.focusRow(moves[e.key]);
    }
  };
  private open(e: Event) {
    if (!this.emit<CitationSectionsOpen>("tc-open", { href: this.href }, { cancelable: true })) e.preventDefault();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.sections.length) this.sections = defaultCitationSections;
    if (this.active >= this.sections.length) this.active = 0;
    if (this.shown !== null && this.shown >= this.sections.length) this.shown = null;
  }

  private renderDonut() {
    const total = this.total;
    let at = 0;
    const segs = this.sections.map((s, i) => {
      const n = this.count(s.id);
      const span = total ? (n / total) * 360 : 0;
      const a0 = at;
      at += span;
      if (!n) return nothing;
      // A lone section is a full ring, drawn as two halves so the arc has a direction
      const d = span >= 359.9 ? `${arc(0, 180)}${arc(180, 360)}` : arc(a0 + (span > GAP * 2 ? GAP / 2 : 0), at - (span > GAP * 2 ? GAP / 2 : 0));
      return svg`<path class="ui-cts__seg" d=${d} data-seg=${i} style=${`--tc-cts-mix: ${this.mix(i)}%`} ?data-on=${this.shown === i} @pointerenter=${() => (this.shown = i)}></path>`;
    });
    return html`<svg class="ui-cts__donut" viewBox="0 0 100 100" aria-hidden="true" @pointerleave=${() => (this.shown = null)}>
      ${total ? segs : svg`<path class="ui-cts__empty-ring" d=${`${arc(0, 180)}${arc(180, 360)}`}></path>`}
    </svg>`;
  }

  protected override render() {
    const shown = this.shown === null ? null : this.sections[this.shown];
    const top = this.logo
      ? html`<div class="ui-cts__source" data-logo>${this.logo.cloneNode(true)}</div>`
      : this.source
        ? html`<div class="ui-cts__source">${this.source}</div>`
        : nothing;
    const legendId = `${this.uid}-legend`;
    return html`<div class="ui-cts__card">
      ${top}
      <div class="ui-cts__body">
        <div class="ui-cts__chart">
          ${this.renderDonut()}
          <p class="ui-cts__caption" id=${legendId}>${this.caption}</p>
          <p class="ui-cts__readout" aria-hidden="true">
            ${shown
              ? html`<span class="ui-cts__readout-value">${shown.label} · ${this.num(this.count(shown.id))} · ${this.pct(this.count(shown.id))}</span>`
              : html`${this.num(this.total)} in all`}
          </p>
          ${this.href
            ? html`<a class="ui-cts__more" href=${this.href} @click=${(e: Event) => this.open(e)}>${this.detailsLabel}</a>`
            : this.openable
              ? html`<button type="button" class="ui-cts__more" @click=${(e: Event) => this.open(e)}>${this.detailsLabel}</button>`
              : nothing}
        </div>
        <ul class="ui-cts__legend" role="list" aria-labelledby=${legendId} @keydown=${this.onKey} @pointerleave=${() => (this.shown = null)}>
          ${this.sections.map((s, i) => {
            const n = this.count(s.id);
            return html`<li
              class="ui-cts__row"
              data-row=${i}
              tabindex=${this.active === i ? 0 : -1}
              aria-label=${`${s.label}, ${this.num(n)} citations, ${this.pct(n)}`}
              ?data-on=${this.shown === i}
              style=${`--tc-cts-mix: ${this.mix(i)}%`}
              @focus=${() => {
                this.active = i;
                this.shown = i;
              }}
              @blur=${() => {
                if (this.shown === i) this.shown = null;
              }}
              @pointerenter=${() => (this.shown = i)}
            >
              <svg class="ui-cts__chip" viewBox="0 0 20 20" aria-hidden="true" data-strong=${this.mix(i) >= 70 ? "true" : "false"}>
                <rect width="20" height="20" rx="4"></rect>
                <text x="10" y="14.5" text-anchor="middle">${(s.letter ?? s.label[0] ?? "?").slice(0, 1).toUpperCase()}</text>
              </svg>
              <span class="ui-cts__label" aria-hidden="true">${s.label}</span>
              <span class="ui-cts__count" aria-hidden="true">${this.num(n)}</span>
            </li>`;
          })}
        </ul>
      </div>
    </div>`;
  }

  static override css = /* css */ `
[data-ui="cts"] {
  position: relative;
  display: inline-block;
  vertical-align: top;
  max-width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  /* The ink the sections are shaded from, and what it's mixed into – override either on the element */
  --tc-cts-ink: var(--tc-chart-1);
  --tc-cts-track: var(--tc-surface-raised);
}
[data-ui="cts"] *, [data-ui="cts"] *::before, [data-ui="cts"] *::after { box-sizing: border-box; }
[data-ui="cts"] p, [data-ui="cts"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="cts"] svg { display: block; flex: none; }
.ui-cts__card { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-cts__card { box-shadow: var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *).ui-cts__card { border: var(--tc-hairline) solid var(--tc-border-default); }
.ui-cts__source { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); }
.ui-cts__source[data-logo] > * { max-height: 24px; width: auto; }
.ui-cts__body { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-4) var(--tc-space-6); }
/* The donut, its caption and the readout */
.ui-cts__chart { display: grid; justify-items: center; gap: var(--tc-space-1); }
.ui-cts__donut { width: 140px; height: 140px; }
.ui-cts__seg { fill: color-mix(in oklab, var(--tc-cts-ink) var(--tc-cts-mix), var(--tc-cts-track)); stroke: var(--tc-cts-track); stroke-width: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cts__donut:has(.ui-cts__seg[data-on]) .ui-cts__seg:not([data-on]) { opacity: 0.35; }
.ui-cts__empty-ring { fill: var(--tc-fill-default); }
.ui-cts__caption { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
.ui-cts__readout { min-height: var(--tc-space-4); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cts__readout-value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cts__more { margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; border-radius: var(--tc-radius-xs); }
.ui-cts__more:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The legend: chip, name and count */
.ui-cts__legend { display: grid; gap: var(--tc-space-0-5); min-width: 180px; }
.ui-cts__row { display: grid; grid-template-columns: 20px 1fr auto; align-items: center; gap: var(--tc-space-2-5); padding: var(--tc-space-1) var(--tc-space-1-5); border-radius: var(--tc-radius-sm); outline: none; cursor: default; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cts__row[data-on] { background: var(--tc-fill-subtle); }
.ui-cts__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cts__chip { width: 20px; height: 20px; }
.ui-cts__chip rect { fill: color-mix(in oklab, var(--tc-cts-ink) var(--tc-cts-mix), var(--tc-cts-track)); }
.ui-cts__chip text { font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); fill: var(--tc-text-primary); }
/* Light text on the darker chips in a light theme; dark text on the brighter ones in a dark theme */
.ui-cts__chip[data-strong="true"] text { fill: light-dark(var(--tc-text-on-accent), var(--tc-text-on-inverse)); }
.ui-cts__label { color: var(--tc-text-primary); }
.ui-cts__count { min-width: 4ch; color: var(--tc-text-primary); text-align: right; font-variant-numeric: tabular-nums; }
@media (forced-colors: active) {
  .ui-cts__seg, .ui-cts__chip rect { fill: CanvasText; stroke: Canvas; stroke-width: 1px; }
  .ui-cts__chip text { fill: Canvas; }
  .ui-cts__card { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cts"] *, [data-ui="cts"] *::before, [data-ui="cts"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-citation-sections")) customElements.define("tc-citation-sections", TcCitationSections);

declare global {
  interface HTMLElementTagNameMap {
    "tc-citation-sections": TcCitationSections;
  }
}
