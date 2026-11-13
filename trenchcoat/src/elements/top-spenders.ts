import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-top-spenders> – who is behind most of the AI spend, ranked: a row per member, team, API key or agent with its
 * rank, its share of the spend as a bar, the amount, the change against the previous period in words ("Up 42%"), the
 * model it used most and a sparkline of its daily spend. Chips filter by kind; past `limit` rows the long tail folds
 * into one line, "and 38 others – $1,204".
 *   · the rows are one tab stop: ↑ / ↓ / Home / End move between them, Enter or a click opens one (tc-spender-open)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-top-spenders .spenders=${[{ id: "audit", name: "Audit", kind: "team", spend: 4210, change: 0.42 }]}></tc-top-spenders>
 */

/** A trophy: Lucide (ISC, lucide.dev) */
const trophyIcon = svg`<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>`;

export type SpenderKind = "member" | "team" | "key" | "agent";
export type Spender = {
  id: string;
  /** A person, a team, an API key's name or an agent */
  name: string;
  kind: SpenderKind;
  /** Spend in the period, in `currency` */
  spend: number;
  /** The change against the previous period, as a fraction: 0.42 is up 42%, -0.1 down 10% */
  change?: number;
  /** The model it spent most on */
  topModel?: string;
  /** Daily spend through the period, oldest first, for the sparkline */
  daily?: number[];
};
/** The kind filter: one kind, or every kind */
export type SpenderFilter = SpenderKind | "all";

/** Details of the events */
export type TopSpendersKindChange = { kind: SpenderFilter };
export type TopSpenderOpen = { id: string; spender: Spender };

/** The words for each kind – rename them through `kindLabels` */
export const defaultSpenderKindLabels: Record<SpenderKind, { one: string; many: string }> = {
  member: { one: "Member", many: "Members" },
  team: { one: "Team", many: "Teams" },
  key: { one: "API key", many: "API keys" },
  agent: { one: "Agent", many: "Agents" },
};

const KINDS: SpenderKind[] = ["member", "team", "key", "agent"];

/** The change in words: "Up 42%", "Down 10%", "No change"; undefined when there's nothing to compare */
export function spendChangeWords(change: number | undefined, locale?: string) {
  if (change === undefined || !Number.isFinite(change)) return undefined;
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(Math.abs(change));
  if (Math.abs(change) < 0.005) return "No change";
  return change > 0 ? `Up ${pct}` : `Down ${pct}`;
}

let uidCount = 0;

/**
 * Top spenders: who is behind most of the spend, ranked, with share bars, change in words, top model and a sparkline,
 * a kind filter and the long tail folded into one line.
 * @tag tc-top-spenders
 * @fires tc-kind-change - The kind filter was changed ({ kind }: TopSpendersKindChange); cancelable – prevented, `kind` stays as it was
 * @fires tc-spender-open - A row was opened ({ id, spender }: TopSpenderOpen)
 */
export class TcTopSpenders extends TcElement {
  static override ui = "topsp";

  /** The heading, and the list's name */
  @property() accessor heading = "Top spenders";
  /** One line under the heading, e.g. the period */
  @property() accessor description: string | undefined = undefined;
  /** Everyone who spent in the period, in any order – the element ranks them */
  @property({ attribute: false }) accessor spenders: Spender[] = [];
  /** Which kind to show. Changed by the chips unless a tc-kind-change listener calls preventDefault() */
  @property() accessor kind: SpenderFilter = "all";
  /** How many rows to show before the rest fold into "and N others" */
  @property({ type: Number }) accessor limit = 8;
  /** Hide the kind chips */
  @property({ type: Boolean, attribute: "hide-filter" }) accessor hideFilter = false;
  /** The spend's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The words for each kind, merged over defaultSpenderKindLabels */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<SpenderKind, { one: string; many: string }>> = {};

  /** The row holding the tab stop */
  @state() private accessor active: string | null = null;
  /** The polite announcement */
  @state() private accessor announce = "";

  private uid = `tc-topsp-${++uidCount}`;

  /* ---------- The model ---------- */

  private words(k: SpenderKind) {
    return { ...defaultSpenderKindLabels[k], ...this.kindLabels[k] };
  }
  private get kinds() {
    return KINDS.filter((k) => this.spenders.some((s) => s.kind === k));
  }
  private get filter(): SpenderFilter {
    return this.kind === "all" || this.kinds.includes(this.kind) ? this.kind : "all";
  }
  /** The ranked rows of the current kind */
  private get ranked() {
    const f = this.filter;
    return this.spenders.filter((s) => f === "all" || s.kind === f).sort((a, b) => b.spend - a.spend || a.name.localeCompare(b.name));
  }
  private get shown() {
    return this.ranked.slice(0, Math.max(1, Math.floor(this.limit)));
  }
  private money(v: number, compact = false) {
    const opts: Intl.NumberFormatOptions = compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 };
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, ...opts }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, opts).format(v);
    }
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: v > 0 && v < 0.01 ? 1 : 0 }).format(v);
  }

  private setKind(next: SpenderFilter) {
    if (next === this.filter) return;
    if (!this.emit<TopSpendersKindChange>("tc-kind-change", { kind: next }, { cancelable: true })) return;
    this.kind = next;
    this.active = null;
    this.announce = next === "all" ? `Showing everyone, ${this.ranked.length}` : `Showing ${this.words(next).many.toLowerCase()}, ${this.ranked.length}`;
  }

  private open(s: Spender) {
    this.emit<TopSpenderOpen>("tc-spender-open", { id: s.id, spender: s });
  }

  /* ---------- Keyboard ---------- */

  private get stop() {
    const ids = this.shown.map((s) => s.id);
    return this.active && ids.includes(this.active) ? this.active : (ids[0] ?? null);
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-id]");
    if (!row || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.shown.map((s) => s.id);
    const at = ids.indexOf(row.dataset.id!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    this.active = ids[to];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(ids[to])}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.active !== null && !this.spenders.some((s) => s.id === this.active)) this.active = null;
  }

  /* ---------- Rendering ---------- */

  private spark(values: number[]) {
    if (values.length < 2) return nothing;
    const max = Math.max(...values, 0) || 1;
    const w = 64;
    const h = 20;
    const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 1 - (Math.max(0, v) / max) * (h - 2)).toFixed(1)}`).join(" ");
    return html`<svg class="ui-topsp__spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${svg`<polyline points=${pts}></polyline>`}</svg>`;
  }

  private renderRow(s: Spender, rank: number, total: number) {
    const share = total > 0 ? Math.max(0, s.spend) / total : 0;
    const change = spendChangeWords(s.change, this.locale);
    const dir = s.change === undefined || change === "No change" ? "flat" : s.change > 0 ? "up" : "down";
    const kind = this.words(s.kind).one;
    const sr = [`${rank}. ${s.name}, ${kind}`, `${this.money(s.spend)}, ${this.pct(share)} of the spend`, change ? `${change} on the previous period` : "", s.topModel ? `mostly ${s.topModel}` : ""].filter(Boolean).join("; ");
    return html`<li class="ui-topsp__item">
      <button
        type="button"
        class="ui-topsp__row"
        data-id=${s.id}
        tabindex=${this.stop === s.id ? 0 : -1}
        @focus=${() => {
          if (this.active !== s.id) this.active = s.id;
        }}
        @click=${() => {
          this.active = s.id;
          this.open(s);
        }}
      >
        <span class="ui-topsp__rank" aria-hidden="true">${rank}</span>
        <span class="ui-topsp__who" aria-hidden="true">
          <span class="ui-topsp__name">${s.name}</span>
          <span class="ui-topsp__meta"><span class="ui-topsp__kind">${kind}</span>${s.topModel ? html`<span class="ui-topsp__model"> · ${s.topModel}</span>` : nothing}</span>
        </span>
        <span class="ui-topsp__share" aria-hidden="true">
          <span class="ui-topsp__track"><span class="ui-topsp__fill" style=${`inline-size: ${Math.min(1, share) * 100}%`}></span></span>
          <span class="ui-topsp__pct">${this.pct(share)}</span>
        </span>
        <span class="ui-topsp__money" aria-hidden="true">
          <span class="ui-topsp__spend">${this.money(s.spend)}</span>
          ${change ? html`<span class="ui-topsp__change" data-dir=${dir}><span class="ui-topsp__mark">${dir === "up" ? "▲" : dir === "down" ? "▼" : "●"}</span>${change}</span>` : nothing}
        </span>
        ${s.daily?.length ? this.spark(s.daily) : html`<span class="ui-topsp__spark" aria-hidden="true"></span>`}
        <span class="ui-topsp__sr">${sr}</span>
      </button>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const ranked = this.ranked;
    const shown = this.shown;
    const total = ranked.reduce((n, s) => n + Math.max(0, s.spend), 0);
    const rest = ranked.slice(shown.length);
    const restTotal = rest.reduce((n, s) => n + Math.max(0, s.spend), 0);
    const kinds = this.kinds;
    const filter = this.filter;
    return html`
      <span class="ui-topsp__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: trophyIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: ranked.length ? html`<span class="ui-topsp__total"><span class="ui-topsp__total-label">Total</span> ${this.money(total)}</span>` : nothing,
      })}
      <div class="ui-topsp__card">
        ${!this.hideFilter && kinds.length > 1
          ? html`<div class="ui-topsp__chips" role="group" aria-label="Show">
              ${(["all", ...kinds] as SpenderFilter[]).map(
                (k) =>
                  html`<button type="button" class="ui-topsp__chip" data-kind=${k} aria-pressed=${filter === k ? "true" : "false"} @click=${() => this.setKind(k)}>
                    ${k === "all" ? "All" : this.words(k).many}
                  </button>`,
              )}
            </div>`
          : nothing}
        ${shown.length
          ? html`<ol class="ui-topsp__list" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
                ${repeat(shown, (s) => s.id, (s, i) => this.renderRow(s, i + 1, total))}
              </ol>
              ${rest.length ? html`<p class="ui-topsp__tail">and ${rest.length} ${rest.length === 1 ? "other" : "others"} – ${this.money(restTotal)}</p>` : nothing}`
          : html`<p class="ui-topsp__empty">No spend to show yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="topsp"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="topsp"] {
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
[data-ui="topsp"] *, [data-ui="topsp"] *::before, [data-ui="topsp"] *::after { box-sizing: border-box; }
:where([data-ui="topsp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="topsp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="topsp"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="topsp"] p { margin: 0; }
.ui-topsp__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-topsp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-topsp__total { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-topsp__total-label { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
/* ----- Kind chips ----- */
.ui-topsp__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-topsp__chips { padding-top: var(--tc-space-1); }
.ui-topsp__chip { display: inline-flex; align-items: center; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3) !important; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-topsp__chip:hover { background: var(--tc-fill-subtle); }
.ui-topsp__chip[aria-pressed="true"] { background: var(--tc-surface-inverse); box-shadow: none; color: var(--tc-text-on-inverse); }
/* ----- Rows: rank, who, share, money, sparkline ----- */
.ui-topsp__list { padding: var(--tc-space-1-5) !important; }
.ui-topsp__item + .ui-topsp__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-topsp__row { display: grid !important; grid-template-columns: var(--tc-space-6) minmax(0, 1.5fr) minmax(0, 1fr) minmax(96px, auto) 64px; align-items: center; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2-5) !important; border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-topsp__row:hover { background: var(--tc-fill-subtle); }
[data-ui="topsp"] .ui-topsp__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-topsp__rank { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; text-align: right; }
.ui-topsp__who { display: grid; min-width: 0; }
.ui-topsp__name { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-topsp__meta { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-topsp__share { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-topsp__track { flex: 1; display: block; height: var(--tc-meter-h); min-width: var(--tc-space-6); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-topsp__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-topsp__pct { min-width: 3em; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; text-align: right; }
.ui-topsp__money { display: grid; justify-items: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-topsp__spend { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-topsp__change { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-topsp__change[data-dir="up"] { color: var(--tc-status-warning-fg); }
.ui-topsp__change[data-dir="down"] { color: var(--tc-status-success-fg); }
.ui-topsp__mark { font-size: var(--tc-font-size-2xs); }
.ui-topsp__spark { display: block; width: 64px; height: 20px; overflow: visible; }
.ui-topsp__spark polyline { fill: none; stroke: var(--tc-chart-1); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-topsp__tail { padding: var(--tc-space-2-5) var(--tc-space-4) var(--tc-space-3) !important; border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-topsp__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: the sparkline goes, and the share bar drops under the name */
@container (max-width: 520px) {
  .ui-topsp__row { grid-template-columns: var(--tc-space-6) minmax(0, 1fr) auto; }
  .ui-topsp__share { grid-column: 2 / -1; grid-row: 2; }
  .ui-topsp__spark { display: none; }
}
@media (forced-colors: active) {
  .ui-topsp__fill { background: CanvasText !important; }
  .ui-topsp__spark polyline { stroke: CanvasText; }
  .ui-topsp__chip[aria-pressed="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="topsp"] *, [data-ui="topsp"] *::before, [data-ui="topsp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-top-spenders")) customElements.define("tc-top-spenders", TcTopSpenders);

declare global {
  interface HTMLElementTagNameMap {
    "tc-top-spenders": TcTopSpenders;
  }
}
