import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-year-list> – a column of years to choose one from, newest first, beside a page that shows one year at a time:
 * contributions, reports, statements. The chosen year is filled; each year can carry a count. Narrow pages lay it out
 * as a row that scrolls (`orientation="horizontal"`).
 *   · a `listbox` named by `label`, one tab stop: ↑ / ↓ (← / → in a row) move, Home / End go to the ends, Enter or
 *     Space chooses; typing a year's digits jumps to it
 *   · focus moves without choosing, so a page that loads a year on change loads only the one chosen
 * Both looks are the bare list; the chosen year is a filled pill in Standard and a tinted row in Clean.
 *
 *   <tc-year-list label="Contribution year" from="2013" to="2026" selected="2026"></tc-year-list>
 */

/** Details of the events */
export type YearListSelectedChange = {
  /** The year chosen */
  selected: number;
};
export type YearListOrientation = "vertical" | "horizontal";

let uidCount = 0;
/** How long typed digits wait for the next one */
const TYPE_AHEAD_MS = 800;

/**
 * Years to choose one from, newest first – a column, or a row that scrolls – with an optional count on each and
 * typing a year to jump to it.
 * @tag tc-year-list
 * @fires tc-selected-change - A year was chosen ({ selected }: YearListSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcYearList extends TcElement {
  static override ui = "yl";

  /** What the years are for – the list's accessible name */
  @property() accessor label = "Year";
  /** The years, in the order shown; when empty, `to` down to `from` */
  @property({ attribute: false }) accessor years: number[] = [];
  /** The oldest year, when `years` isn't given */
  @property({ type: Number }) accessor from: number | undefined = undefined;
  /** The newest year, when `years` isn't given */
  @property({ type: Number }) accessor to: number | undefined = undefined;
  /** The chosen year. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ type: Number }) accessor selected: number | null = null;
  /** A count to show beside each year, by year: { 2026: 1204 } */
  @property({ attribute: false }) accessor counts: Record<number, number> | undefined = undefined;
  /** What the counts are, said after each: "contributions" */
  @property({ attribute: "count-label" }) accessor countLabel = "items";
  /** A column ("vertical") or a row that scrolls ("horizontal") */
  @property({ reflect: true }) accessor orientation: YearListOrientation = "vertical";
  /** The language for counts, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The year with the tab stop, when it isn't the chosen one */
  @state() private accessor active: number | null = null;
  @state() private accessor announce = "";
  private uid = `tc-yl-${++uidCount}`;
  private typed = "";
  private typedTimer: ReturnType<typeof setTimeout> | undefined;

  /* ---------- The model ---------- */

  /** The years shown, in order (read-only): `years`, or `to` down to `from` */
  get list(): number[] {
    if (this.years.length) return this.years.filter((y) => Number.isFinite(y));
    const to = this.to;
    const from = this.from;
    if (to === undefined || from === undefined || !Number.isFinite(to) || !Number.isFinite(from)) return [];
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    return Array.from({ length: Math.min(500, hi - lo + 1) }, (_, i) => hi - i);
  }
  /** The year with the tab stop: the one moved to, else the chosen one, else the first */
  private get stop() {
    const list = this.list;
    if (this.active !== null && list.includes(this.active)) return this.active;
    if (this.selected !== null && list.includes(this.selected)) return this.selected;
    return list[0] ?? null;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.typedTimer);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A tab stop on a year that's gone falls back to the chosen one
    if ((changed.has("years") || changed.has("from") || changed.has("to")) && this.active !== null && !this.list.includes(this.active)) this.active = null;
  }

  /* ---------- Choosing and moving ---------- */

  private choose(year: number) {
    this.active = year;
    if (year === this.selected) return;
    if (!this.emit<YearListSelectedChange>("tc-selected-change", { selected: year }, { cancelable: true })) return;
    this.selected = year;
    this.announce = `${year} chosen`;
  }

  private moveTo(year: number) {
    this.active = year;
    this.updateComplete.then(() => {
      const el = this.querySelector<HTMLElement>(`[data-year="${year}"]`);
      el?.focus();
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.list;
    const at = list.indexOf(this.stop ?? NaN);
    if (at < 0) return;
    const vertical = this.orientation !== "horizontal";
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    const on = vertical ? "ArrowDown" : "ArrowRight";
    let next: number | undefined;
    if (e.key === on) next = Math.min(list.length - 1, at + 1);
    else if (e.key === back) next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.choose(list[at]);
      return;
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      this.typeAhead(e.key);
      return;
    }
    if (next === undefined) return;
    e.preventDefault();
    this.moveTo(list[next]);
  };

  /** Digits typed in a row jump to the first year that starts with them, else ends with them: "2019", or just "19" */
  private typeAhead(digit: string) {
    clearTimeout(this.typedTimer);
    this.typed += digit;
    this.typedTimer = setTimeout(() => (this.typed = ""), TYPE_AHEAD_MS);
    const list = this.list;
    const hit = list.find((y) => String(y).startsWith(this.typed)) ?? list.find((y) => String(y).endsWith(this.typed));
    if (hit !== undefined) this.moveTo(hit);
  }

  /** A year focused any way (Tab, a click, the page) takes the tab stop, and the keys move from it */
  private onFocusIn = (e: FocusEvent) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-year]");
    if (el) this.active = Number(el.dataset.year);
  };

  private onClick = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-year]");
    if (!el) return;
    const year = Number(el.dataset.year);
    this.choose(year);
    el.focus();
  };

  /* ---------- Rendering ---------- */

  protected override render() {
    const list = this.list;
    const stop = this.stop;
    const fmt = new Intl.NumberFormat(this.locale);
    return html`<span class="tc-sr-only" role="status">${this.announce}</span>
      ${list.length
        ? html`<div
            class="ui-yl__list"
            role="listbox"
            aria-label=${this.label}
            aria-orientation=${this.orientation === "horizontal" ? "horizontal" : "vertical"}
            @keydown=${this.onKey}
            @focusin=${this.onFocusIn}
            @click=${this.onClick}
          >
            ${list.map((year) => {
              const chosen = year === this.selected;
              const count = this.counts?.[year];
              return html`<div
                class="ui-yl__year"
                role="option"
                id=${`${this.uid}-${year}`}
                data-year=${year}
                aria-selected=${chosen ? "true" : "false"}
                tabindex=${year === stop ? 0 : -1}
              >
                <span class="ui-yl__text">${year}</span>
                ${count !== undefined && Number.isFinite(count)
                  ? html`<span class="ui-yl__count">${fmt.format(count)}<span class="tc-sr-only"> ${this.countLabel}</span></span>`
                  : nothing}
              </div>`;
            })}
          </div>`
        : html`<p class="ui-yl__empty">No years to show.</p>`}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="yl"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="yl"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* A year's width in a column, and the chosen year's fill and text – override them on the element */
[data-ui="yl"] { --tc-yl-width: 136px; --tc-yl-chosen-bg: var(--tc-accent-solid); --tc-yl-chosen-fg: var(--tc-text-on-accent); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="yl"] { --tc-yl-chosen-bg: var(--tc-fill-selected); --tc-yl-chosen-fg: var(--tc-text-primary); }
[data-ui="yl"] *, [data-ui="yl"] *::before, [data-ui="yl"] *::after { box-sizing: border-box; }
[data-ui="yl"] p { margin: 0; }
.ui-yl__list { display: grid; gap: var(--tc-space-1); width: var(--tc-yl-width); max-width: 100%; outline: none; }
[data-ui="yl"][orientation="horizontal"] .ui-yl__list { display: flex; width: auto; overflow-x: auto; padding-bottom: var(--tc-space-1); scrollbar-width: thin; }
.ui-yl__year { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); min-height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-lg); border-radius: var(--tc-control-radius-md); color: var(--tc-text-secondary); cursor: pointer; user-select: none; font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="yl"][orientation="horizontal"] .ui-yl__year { flex: none; }
.ui-yl__year:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-yl__year:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-yl__year[aria-selected="true"] { background: var(--tc-yl-chosen-bg); color: var(--tc-yl-chosen-fg); font-weight: var(--tc-font-weight-medium); }
.ui-yl__count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-yl__year[aria-selected="true"] .ui-yl__count { color: inherit; }
.ui-yl__empty { padding: var(--tc-space-2) 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
@media (forced-colors: active) {
  .ui-yl__year[aria-selected="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="yl"] *, [data-ui="yl"] *::before, [data-ui="yl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-year-list")) customElements.define("tc-year-list", TcYearList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-year-list": TcYearList;
  }
}
