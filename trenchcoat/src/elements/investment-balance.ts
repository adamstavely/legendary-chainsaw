import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-investment-balance> – are dollars and people flowing to the work that matters most? One row per priority tier
 * (Top priority, High, Medium, Watching – the page's own tiers), and three shares side by side: the tier's share of the
 * items (topics, projects), of the budget and of the people. A budget or people share more than `threshold` away from
 * the tier's share of items is marked over- or under-invested, in words and with a mark, never colour alone. A finding
 * at the top says the biggest mismatch in one line ("Top priority is 9% of topics but draws 30% of the budget"); the
 * page can write its own.
 *   · the tiers are a single-select listbox: ↑ / ↓ / Home / End move, Enter, Space or a click selects (or clears) a
 *     tier, Escape clears it; selecting fires a cancelable tc-selected-change
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-investment-balance .tiers=${[{ id: "p1", label: "Top priority", badge: "1", items: 18, budget: 14.2e6, people: 38 }]}></tc-investment-balance>
 */

/** Scales: Lucide (ISC, lucide.dev) */
const scaleIcon = svg`<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>`;

export type InvestmentTier = {
  id: string;
  /** The tier's name, e.g. "Top priority" */
  label: string;
  /** A short mark before the name, e.g. "1" or "P1" */
  badge?: string;
  /** How many items (topics, projects) the tier holds */
  items: number;
  /** The tier's budget, in `currency` */
  budget: number;
  /** The people on the tier's work, in `people-unit` */
  people: number;
};
/** How a measure compares with the tier's share of items */
export type InvestmentBalanceMark = "over" | "under" | "even";
export type InvestmentMeasure = "budget" | "people";

/** Details of the events */
export type InvestmentSelectedChange = { selected: string | null; tier?: InvestmentTier };

let uidCount = 0;

/**
 * Investment against priority: each tier's share of the items, the budget and the people, with over- and
 * under-invested tiers marked and the biggest mismatch said in one line.
 * @tag tc-investment-balance
 * @fires tc-selected-change - A tier was selected or cleared ({ selected, tier }: InvestmentSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcInvestmentBalance extends TcElement {
  static override ui = "invb";

  /** The heading, and the list's name */
  @property() accessor heading = "Investment vs priority";
  /** One line under the heading */
  @property() accessor description: string | undefined = "Are dollars and people flowing to our top-priority work?";
  /** The tiers, most important first */
  @property({ attribute: false }) accessor tiers: InvestmentTier[] = [];
  /** What the items are, plural: "topics", "projects" */
  @property({ attribute: "item-label" }) accessor itemLabel = "topics";
  /** The unit people are counted in: "FTE", "people" */
  @property({ attribute: "people-unit" }) accessor peopleUnit = "FTE";
  /** The budget's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** How far, as a share from 0 to 1, a budget or people share may sit from the items share before it's marked */
  @property({ type: Number }) accessor threshold = 0.1;
  /** The finding at the top, in place of the one worked out; an empty string hides it */
  @property() accessor finding: string | undefined = undefined;
  /** The selected tier's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;

  /** The row holding the tab stop */
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-invb-${++uidCount}`;

  /* ---------- The model ---------- */

  private get totals() {
    const sum = (k: "items" | "budget" | "people") => this.tiers.reduce((n, t) => n + Math.max(0, t[k] || 0), 0);
    return { items: sum("items"), budget: sum("budget"), people: sum("people") };
  }
  /** Each tier's three shares, from 0 to 1 */
  private sharesOf(t: InvestmentTier, totals = this.totals) {
    const share = (v: number, all: number) => (all > 0 ? Math.max(0, v || 0) / all : 0);
    return { items: share(t.items, totals.items), budget: share(t.budget, totals.budget), people: share(t.people, totals.people) };
  }
  /** Over, under or even: a measure's share against the items share */
  private markOf(t: InvestmentTier, measure: InvestmentMeasure): InvestmentBalanceMark {
    const s = this.sharesOf(t);
    const gap = s[measure] - s.items;
    const limit = Math.max(0, this.threshold);
    // A hair's tolerance, so a gap exactly at the threshold counts as past it despite floating-point rounding
    if (gap >= limit - 1e-9 && gap > 0) return "over";
    if (gap <= -limit + 1e-9 && gap < 0) return "under";
    return "even";
  }

  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }
  private money(v: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, notation: "compact", maximumFractionDigits: 1 }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
    }
  }
  private count(v: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(v);
  }

  /** The one-line finding: the tier whose budget (or else people) share sits furthest from its items share */
  private get computedFinding() {
    let best: { t: InvestmentTier; m: InvestmentMeasure; gap: number } | null = null;
    for (const t of this.tiers)
      for (const m of ["budget", "people"] as const) {
        if (this.markOf(t, m) === "even") continue;
        const s = this.sharesOf(t);
        const gap = s[m] - s.items;
        if (!best || Math.abs(gap) > Math.abs(best.gap) + 1e-9) best = { t, m, gap };
      }
    if (!this.tiers.length) return "";
    if (!best) return `Budget and people follow priority – no tier is more than ${this.pct(this.threshold)} off its share of ${this.itemLabel}.`;
    const s = this.sharesOf(best.t);
    const what = best.m === "budget" ? "the budget" : "the people";
    return best.gap > 0
      ? `${best.t.label} is ${this.pct(s.items)} of ${this.itemLabel} but draws ${this.pct(s[best.m])} of ${what}.`
      : `${best.t.label} is ${this.pct(s.items)} of ${this.itemLabel} but gets only ${this.pct(s[best.m])} of ${what}.`;
  }

  /* ---------- Selection and keyboard ---------- */

  private get stop() {
    const ids = this.tiers.map((t) => t.id);
    return [this.active, this.selected].find((id) => id && ids.includes(id)) ?? ids[0] ?? null;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const tier = next === null ? undefined : this.tiers.find((t) => t.id === next);
    if (!this.emit<InvestmentSelectedChange>("tc-selected-change", { selected: next, tier }, { cancelable: true })) return;
    this.selected = next;
    this.announce = tier ? `Selected ${tier.label}` : "Selection cleared";
  }

  private focusRow(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-id]");
    if (!row || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.tiers.map((t) => t.id);
    const at = ids.indexOf(row.dataset.id!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to >= 0) {
      e.preventDefault();
      this.focusRow(ids[to]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === ids[at] ? null : ids[at]);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const ids = this.tiers.map((t) => t.id);
    if (this.active !== null && !ids.includes(this.active)) this.active = null;
    if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderMeasure(kind: "items" | InvestmentMeasure, value: string, share: number, mark: InvestmentBalanceMark) {
    return html`<span class="ui-invb__measure" data-kind=${kind} data-mark=${mark}>
      <span class="ui-invb__value"><span class="ui-invb__num">${value}</span><span class="ui-invb__pct">${this.pct(share)}</span>${mark === "even"
        ? nothing
        : html`<span class="ui-invb__flag" data-mark=${mark}><span class="ui-invb__arrow" aria-hidden="true">${mark === "over" ? "▲" : "▼"}</span>${mark === "over" ? "Over" : "Under"}</span>`}</span>
      <span class="ui-invb__track" aria-hidden="true"><span class="ui-invb__fill" style=${`inline-size: ${Math.round(share * 1000) / 10}%`}></span></span>
    </span>`;
  }

  private renderRow(t: InvestmentTier, totals: { items: number; budget: number; people: number }) {
    const s = this.sharesOf(t, totals);
    const isSel = this.selected === t.id;
    const mb = this.markOf(t, "budget");
    const mp = this.markOf(t, "people");
    const word = (m: InvestmentBalanceMark) => (m === "over" ? ", over-invested" : m === "under" ? ", under-invested" : "");
    const sr = `${t.label}: ${this.count(t.items)} ${this.itemLabel}, ${this.pct(s.items)}; budget ${this.money(t.budget)}, ${this.pct(s.budget)}${word(mb)}; people ${this.count(t.people)} ${this.peopleUnit}, ${this.pct(s.people)}${word(mp)}`;
    return html`<li
      class="ui-invb__row"
      role="option"
      data-id=${t.id}
      tabindex=${this.stop === t.id ? 0 : -1}
      aria-selected=${isSel ? "true" : "false"}
      @focus=${() => {
        if (this.active !== t.id) this.active = t.id;
      }}
      @click=${() => {
        this.active = t.id;
        this.setSelected(isSel ? null : t.id);
      }}
    >
      <span class="ui-invb__tier" aria-hidden="true">${t.badge ? html`<span class="ui-invb__badge">${t.badge}</span>` : nothing}<span class="ui-invb__label">${t.label}</span></span>
      <span class="ui-invb__measures" aria-hidden="true">
        ${this.renderMeasure("items", this.count(t.items), s.items, "even")} ${this.renderMeasure("budget", this.money(t.budget), s.budget, mb)}
        ${this.renderMeasure("people", this.count(t.people), s.people, mp)}
      </span>
      <span class="ui-invb__sr">${sr}</span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const totals = this.totals;
    const finding = this.finding ?? this.computedFinding;
    const marked = this.tiers.filter((t) => this.markOf(t, "budget") !== "even" || this.markOf(t, "people") !== "even").length;
    return html`
      <span class="ui-invb__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: scaleIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.tiers.length ? html`<span class="ui-invb__count">${marked ? `${marked} off balance` : "In balance"}</span>` : nothing,
      })}
      <div class="ui-invb__card">
        ${this.tiers.length
          ? html`${finding ? html`<p class="ui-invb__finding">${finding}</p>` : nothing}
              <div class="ui-invb__cols" aria-hidden="true">
                <span>Tier</span>
                <span class="ui-invb__col-names"><span>${this.itemLabel[0].toUpperCase() + this.itemLabel.slice(1)}</span><span>Budget</span><span>People (${this.peopleUnit})</span></span>
              </div>
              <ul class="ui-invb__list" role="listbox" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
                ${repeat(this.tiers, (t) => t.id, (t) => this.renderRow(t, totals))}
              </ul>
              <p class="ui-invb__total">
                <span>Total</span><span>${this.count(totals.items)} ${this.itemLabel}</span><span>${this.money(totals.budget)}</span><span>${this.count(totals.people)} ${this.peopleUnit}</span>
              </p>`
          : html`<p class="ui-invb__empty">No tiers to compare yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="invb"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="invb"] {
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
[data-ui="invb"] *, [data-ui="invb"] *::before, [data-ui="invb"] *::after { box-sizing: border-box; }
[data-ui="invb"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="invb"] p { margin: 0; }
.ui-invb__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-invb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-invb__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
/* ----- The finding ----- */
.ui-invb__finding { margin: var(--tc-space-3) var(--tc-space-4) 0 !important; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-invb__finding { margin-top: var(--tc-space-1) !important; }
/* ----- Columns: the tier, then three measures ----- */
.ui-invb__cols, .ui-invb__row, .ui-invb__total { display: grid; grid-template-columns: minmax(120px, 0.9fr) minmax(0, 3fr); align-items: center; gap: var(--tc-space-3); }
.ui-invb__col-names, .ui-invb__measures, .ui-invb__total { column-gap: var(--tc-space-4); }
.ui-invb__col-names, .ui-invb__measures { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ui-invb__cols { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-invb__cols { font-weight: var(--tc-font-weight-medium); }
.ui-invb__list { padding: 0 var(--tc-space-1-5) !important; }
.ui-invb__row { position: relative; padding: var(--tc-space-2-5); border-radius: var(--tc-radius-md); cursor: pointer; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-invb__row + .ui-invb__row::before { content: ""; position: absolute; top: 0; left: var(--tc-space-2-5); right: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-invb__row:hover { background: var(--tc-fill-subtle); }
.ui-invb__row[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-invb__row:hover::before, .ui-invb__row:hover + .ui-invb__row::before, .ui-invb__row[aria-selected="true"]::before, .ui-invb__row[aria-selected="true"] + .ui-invb__row::before { opacity: 0; }
.ui-invb__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-invb__tier { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-invb__badge { display: inline-grid; flex: none; place-items: center; min-width: 22px; height: 22px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
.ui-invb__label { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
/* A measure: its value, its share and a flag when it's off balance, over a bar of the share */
.ui-invb__measure { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-invb__value { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
.ui-invb__num { color: var(--tc-text-primary); }
.ui-invb__pct { color: var(--tc-text-muted); }
.ui-invb__row[aria-selected="true"] .ui-invb__pct { color: var(--tc-text-secondary); }
.ui-invb__flag { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); }
.ui-invb__flag[data-mark="over"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-invb__flag[data-mark="under"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-invb__arrow { font-size: var(--tc-font-size-2xs); }
.ui-invb__track { display: block; height: 6px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-invb__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-fill-strong); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-invb__measure[data-kind="budget"] .ui-invb__fill { background: var(--tc-chart-1); }
.ui-invb__measure[data-kind="people"] .ui-invb__fill { background: var(--tc-chart-2); }
/* ----- Totals and empty ----- */
.ui-invb__total { margin-top: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-4) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; grid-template-columns: minmax(120px, 0.9fr) repeat(3, minmax(0, 1fr)); }
.ui-invb__total > span:first-child { color: var(--tc-text-muted); }
.ui-invb__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: the measures drop under the tier's name */
@container (max-width: 520px) {
  .ui-invb__cols { display: none; }
  .ui-invb__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); }
  .ui-invb__total { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (forced-colors: active) {
  .ui-invb__fill { background: CanvasText !important; }
  .ui-invb__flag { border: 1px solid CanvasText; }
  .ui-invb__row[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="invb"] *, [data-ui="invb"] *::before, [data-ui="invb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-investment-balance")) customElements.define("tc-investment-balance", TcInvestmentBalance);

declare global {
  interface HTMLElementTagNameMap {
    "tc-investment-balance": TcInvestmentBalance;
  }
}
