import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate, initials } from "./internal/util";

/*
 * <tc-co-occurrence> – who keeps turning up together with a subject: accounts, devices or people ranked by how often
 * they appear in the same events across the page's data sources (logins, payments, shipments …). Each row has the
 * entity's initials, name and ID, a strength in words and bars (Always together, Frequent, Occasional – by the share
 * of the subject's events they share, with thresholds the page can move), a score from 0 to 100, the share itself
 * ("82% · 14 of 17 events"), a count per source and when they were last seen together. The header gives the window,
 * the sources and three numbers: strong correlates, shared events and the top correlate.
 *   · rows are buttons with one tab stop: ↑ / ↓ / Home / End move, Enter, Space or a click opens a row's shared
 *     events by source (or closes it), Escape closes it; opening fires a cancelable tc-selected-change
 *   · the sort – score, share or most recent – is a radio group (← / →); changing it fires a cancelable tc-sort-change
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-co-occurrence events="17" .sources=${[{ id: "pay", label: "Payments" }]} .entities=${[{ id: "a", name: "Dana Okafor", score: 92, together: 14, bySource: { pay: 9 } }]}></tc-co-occurrence>
 */

/* Linked circles, chevron: Lucide (ISC, lucide.dev) */
const linkIcon = svg`<circle cx="9" cy="12" r="6"></circle><circle cx="15" cy="12" r="6"></circle>`;
const chevron = () =>
  html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;

export type CoStrength = "always" | "frequent" | "occasional";
export type CoSort = "score" | "share" | "recent";
/** A data source the events come from, e.g. { id: "pay", label: "Payments" } */
export type CoSource = { id: string; label: string };
/** One event the entity and the subject shared */
export type CoEvent = { source: string; label: string; at?: number };
export type CoEntity = {
  id: string;
  name: string;
  /** A second line: an ID, a device, a company */
  detail?: string;
  /** How strongly they're correlated, 0 to 100 */
  score: number;
  /** How many of the subject's events they were in; the share is this over `events` */
  together: number;
  /** Shared events by source id */
  bySource?: Record<string, number>;
  /** When they were last seen together, epoch ms */
  lastSeen?: number;
  /** The shared events, listed by source when the row opens */
  events?: CoEvent[];
};

/** Details of the events */
export type CoSelectedChange = { selected: string | null; entity?: CoEntity };
export type CoSortChange = { sort: CoSort };

/** The strengths' names used when the page gives none */
export const defaultCoStrengthLabels: Record<CoStrength, string> = { always: "Always together", frequent: "Frequent", occasional: "Occasional" };
const BARS: Record<CoStrength, number> = { always: 3, frequent: 2, occasional: 1 };
const SORTS: { id: CoSort; label: string }[] = [
  { id: "score", label: "Score" },
  { id: "share", label: "Share" },
  { id: "recent", label: "Recent" },
];
const HUES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];
let uidCount = 0;

/**
 * Entities ranked by how often they appear together with a subject – strength in words and bars, a score, the share
 * of events, a count per source and when last seen – with each row opening its shared events.
 * @tag tc-co-occurrence
 * @fires tc-selected-change - A row was opened or closed ({ selected, entity }: CoSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-sort-change - The sort was changed ({ sort }: CoSortChange); cancelable – prevented, `sort` stays as it was
 */
export class TcCoOccurrence extends TcElement {
  static override ui = "coc";

  /** The heading, and the list's name */
  @property() accessor heading = "Co-occurrence";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The time window the counts cover, shown in the header, e.g. "120-day window" */
  @property() accessor window: string | undefined = undefined;
  /** The data sources, in the order their counts are shown */
  @property({ attribute: false }) accessor sources: CoSource[] = [];
  /** The entities seen together with the subject */
  @property({ attribute: false }) accessor entities: CoEntity[] = [];
  /** How many events the subject had in the window – the share's denominator */
  @property({ type: Number }) accessor events = 0;
  /** What an event is called after a number: "14 of 17 events" */
  @property({ attribute: "event-unit" }) accessor eventUnit = "events";
  /** The order of the rows. Changed by the user unless a tc-sort-change listener calls preventDefault() */
  @property({ reflect: true }) accessor sort: CoSort = "score";
  /** The open row's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The lowest shares, from 0 to 1, that count as Always together and Frequent; below Frequent is Occasional */
  @property({ attribute: false }) accessor thresholds: { always: number; frequent: number } = { always: 0.75, frequent: 0.4 };
  /** The strengths' names, merged over the defaults (Always together, Frequent, Occasional) */
  @property({ attribute: false }) accessor strengthLabels: Partial<Record<CoStrength, string>> = {};
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The row holding the tab stop */
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-coc-${++uidCount}`;

  /* ---------- The model ---------- */

  private share(e: CoEntity) {
    return this.events > 0 ? Math.max(0, Math.min(1, e.together / this.events)) : 0;
  }
  private strengthOf(e: CoEntity): CoStrength {
    const s = this.share(e);
    return s >= this.thresholds.always ? "always" : s >= this.thresholds.frequent ? "frequent" : "occasional";
  }
  private label(s: CoStrength) {
    return this.strengthLabels[s] ?? defaultCoStrengthLabels[s];
  }
  private sharedOf(e: CoEntity) {
    return Object.values(e.bySource ?? {}).reduce((n, v) => n + (Number.isFinite(v) ? v : 0), 0);
  }
  private get sorted() {
    const by: Record<CoSort, (a: CoEntity, b: CoEntity) => number> = {
      score: (a, b) => b.score - a.score,
      share: (a, b) => this.share(b) - this.share(a) || b.score - a.score,
      recent: (a, b) => (b.lastSeen ?? -Infinity) - (a.lastSeen ?? -Infinity) || b.score - a.score,
    };
    return [...this.entities].sort(by[this.sort] ?? by.score);
  }
  private pct(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private day(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short" });
  }
  /** The tab stop: the active row, else the open one, else the first */
  private get stop() {
    const ids = this.sorted.map((e) => e.id);
    return [this.active, this.selected].find((id) => id && ids.includes(id)) ?? ids[0] ?? null;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const entity = next === null ? undefined : this.entities.find((e) => e.id === next);
    if (!this.emit<CoSelectedChange>("tc-selected-change", { selected: next, entity }, { cancelable: true })) return;
    this.selected = next;
    this.announce = entity ? `${entity.name}: shared events shown` : "Shared events closed";
  }
  private setSort(next: CoSort) {
    if (next === this.sort) return;
    if (!this.emit<CoSortChange>("tc-sort-change", { sort: next }, { cancelable: true })) return;
    this.sort = next;
    this.announce = `Sorted by ${SORTS.find((s) => s.id === next)?.label.toLowerCase()}`;
  }

  /* ---------- Keyboard ---------- */

  private focusRow(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-coc__row[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private onListKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>(".ui-coc__row");
    if (!row || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.sorted.map((x) => x.id);
    const at = ids.indexOf(row.dataset.id!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to >= 0) {
      e.preventDefault();
      this.focusRow(ids[to]);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  private onSortKey = (e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const at = SORTS.findIndex((s) => s.id === this.sort);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (at + 1) % SORTS.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (at - 1 + SORTS.length) % SORTS.length : e.key === "Home" ? 0 : e.key === "End" ? SORTS.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.setSort(SORTS[to].id);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-coc__sort [data-sort="${this.sort}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const ids = this.entities.map((e) => e.id);
    if (this.active !== null && !ids.includes(this.active)) this.active = null;
    // An open row whose entity went away closes
    if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderDetail(e: CoEntity) {
    const id = `${this.uid}-d-${e.id}`;
    const events = e.events ?? [];
    const groups = this.sources.map((s) => ({ source: s, items: events.filter((x) => x.source === s.id) })).filter((g) => g.items.length);
    const other = events.filter((x) => !this.sources.some((s) => s.id === x.source));
    if (other.length) groups.push({ source: { id: "other", label: "Other" }, items: other });
    return html`<div class="ui-coc__detail" id=${id} role="region" aria-label=${`Shared events with ${e.name}`}>
      ${groups.length
        ? groups.map(
            (g) => html`<div class="ui-coc__group">
              <h4 class="ui-coc__group-title">${g.source.label}<span class="ui-coc__group-n">${this.num(g.items.length)}</span></h4>
              <ul class="ui-coc__events">
                ${g.items.map((x) => html`<li class="ui-coc__event"><span class="ui-coc__event-text">${x.label}</span>${x.at !== undefined ? html`<span class="ui-coc__event-at">${this.day(x.at)}</span>` : nothing}</li>`)}
              </ul>
            </div>`,
          )
        : html`<p class="ui-coc__none">No shared events listed – the counts above are all there is.</p>`}
    </div>`;
  }

  private renderRow(e: CoEntity) {
    const strength = this.strengthOf(e);
    const share = this.share(e);
    const isOpen = this.selected === e.id;
    const counts = this.sources.filter((s) => (e.bySource?.[s.id] ?? 0) > 0);
    const shareText = `${this.pct(share)} · ${this.num(e.together)} of ${this.num(this.events)} ${this.eventUnit}`;
    const spoken = [
      e.detail,
      this.label(strength),
      `score ${Math.round(e.score)}`,
      shareText.replace(" · ", ", "),
      counts.map((s) => `${s.label} ${e.bySource![s.id]}`).join(", "),
      e.lastSeen !== undefined ? `last seen together ${this.day(e.lastSeen)}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    return html`<li class="ui-coc__item" ?data-open=${isOpen}>
      <button
        type="button"
        class="ui-coc__row"
        data-id=${e.id}
        data-strength=${strength}
        tabindex=${this.stop === e.id ? 0 : -1}
        aria-expanded=${isOpen ? "true" : "false"}
        aria-controls=${`${this.uid}-d-${e.id}`}
        @focus=${() => {
          if (this.active !== e.id) this.active = e.id;
        }}
        @click=${() => {
          this.active = e.id;
          this.setSelected(isOpen ? null : e.id);
        }}
      >
        <span class="ui-coc__avatar" data-hue=${hue(e.name)} aria-hidden="true">${initials(e.name)}</span>
        <span class="ui-coc__who">
          <span class="ui-coc__name-line">
            <span class="ui-coc__name">${e.name}</span>
            <span class="ui-coc__strength" data-strength=${strength} aria-hidden="true">
              <span class="ui-coc__bars">${[1, 2, 3].map((n) => html`<span class="ui-coc__bar" ?data-on=${n <= BARS[strength]}></span>`)}</span>${this.label(strength)}
            </span>
          </span>
          <span class="ui-coc__line" aria-hidden="true">
            ${e.detail ? html`<span class="ui-coc__id">${e.detail}</span>` : nothing}
            ${e.lastSeen !== undefined ? html`<span class="ui-coc__seen">last ${this.day(e.lastSeen)}</span>` : nothing}
          </span>
          <span class="ui-coc__share" aria-hidden="true">
            <span class="ui-coc__meter"><span class="ui-coc__meter-fill" style=${`inline-size: ${Math.round(share * 100)}%`}></span></span>
            <span class="ui-coc__share-text">${shareText}</span>
          </span>
          ${counts.length
            ? html`<span class="ui-coc__counts" aria-hidden="true">${counts.map((s) => html`<span class="ui-coc__count"><span class="ui-coc__count-label">${s.label}</span> ${this.num(e.bySource![s.id])}</span>`)}</span>`
            : nothing}
        </span>
        <span class="ui-coc__score" aria-hidden="true"><span class="ui-coc__score-n">${Math.round(e.score)}</span><span class="ui-coc__score-label">Score</span></span>
        <span class="ui-coc__chev" aria-hidden="true">${chevron()}</span>
        <span class="ui-coc__sr">, ${spoken}</span>
      </button>
      ${isOpen ? this.renderDetail(e) : nothing}
    </li>`;
  }

  private renderStats() {
    const strong = this.entities.filter((e) => this.strengthOf(e) === "always").length;
    const shared = this.entities.reduce((n, e) => n + this.sharedOf(e), 0);
    const top = [...this.entities].sort((a, b) => b.score - a.score)[0];
    return html`<dl class="ui-coc__stats">
      <div class="ui-coc__stat"><dt>Strong correlates</dt><dd>${this.num(strong)}</dd></div>
      <div class="ui-coc__stat"><dt>Shared ${this.eventUnit}</dt><dd>${this.num(shared)}</dd></div>
      ${top ? html`<div class="ui-coc__stat ui-coc__stat--top"><dt>Top correlate</dt><dd><span class="ui-coc__top-name">${top.name}</span><span class="ui-coc__top-share">${this.pct(this.share(top))}</span></dd></div>` : nothing}
    </dl>`;
  }

  protected override render() {
    const id = this.uid;
    const rows = this.sorted;
    return html`
      <span class="ui-coc__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: linkIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.window ? html`<span class="ui-coc__window">${this.window}</span>` : nothing,
      })}
      <div class="ui-coc__card">
        ${rows.length
          ? html`${this.renderStats()}
              <div class="ui-coc__bar-row">
                ${this.sources.length
                  ? html`<p class="ui-coc__legend"><span class="ui-coc__legend-label">Sources</span>${this.sources.map((s) => html`<span class="ui-coc__legend-item">${s.label}</span>`)}</p>`
                  : html`<span></span>`}
                <div class="ui-coc__sort" role="radiogroup" aria-label="Sort by" @keydown=${this.onSortKey}>
                  ${SORTS.map(
                    (s) => html`<button
                      type="button"
                      role="radio"
                      data-sort=${s.id}
                      aria-checked=${this.sort === s.id ? "true" : "false"}
                      tabindex=${this.sort === s.id ? 0 : -1}
                      @click=${() => this.setSort(s.id)}
                    >${s.label}</button>`,
                  )}
                </div>
              </div>
              <ul class="ui-coc__list" aria-labelledby=${`${id}-title`} @keydown=${this.onListKey}>
                ${repeat(rows, (e) => e.id, (e) => this.renderRow(e))}
              </ul>`
          : html`<p class="ui-coc__empty">Nothing seen together yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="coc"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="coc"] {
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
/* The row's lead – avatar or type icon – which the open detail lines up after */
[data-ui="coc"] { --tc-coc-lead: 32px; }
[data-ui="coc"] *, [data-ui="coc"] *::before, [data-ui="coc"] *::after { box-sizing: border-box; }
:where([data-ui="coc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="coc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="coc"] ul, [data-ui="coc"] dl, [data-ui="coc"] dd { margin: 0; padding: 0; list-style: none; }
[data-ui="coc"] p, [data-ui="coc"] h4 { margin: 0; }
.ui-coc__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-coc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-coc__window { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
/* ----- Stats, sources and sort ----- */
.ui-coc__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-2) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-coc__stats { padding-top: var(--tc-space-1) !important; }
.ui-coc__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-coc__stat dt { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-coc__stat dd { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-coc__stat--top dd { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
.ui-coc__top-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-coc__top-share { flex: none; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-coc__bar-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-2-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-coc__legend { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-coc__legend-label { margin-right: var(--tc-space-0-5); color: var(--tc-text-muted); }
.ui-coc__legend-item { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-subtle); }
.ui-coc__sort { display: inline-flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-coc__sort > button { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-coc__sort > button[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-coc__sort > button[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- Rows ----- */
.ui-coc__list { padding: var(--tc-space-1-5) !important; }
.ui-coc__item + .ui-coc__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-coc__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: start; gap: var(--tc-space-3); width: 100%; padding: var(--tc-space-2-5); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-coc__row:hover { background: var(--tc-fill-subtle); }
[data-ui="coc"] .ui-coc__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-coc__item[data-open] .ui-coc__row { background: var(--tc-fill-selected); }
.ui-coc__avatar { display: grid; place-items: center; width: var(--tc-coc-lead); height: var(--tc-coc-lead); border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); }
.ui-coc__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-coc__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-coc__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-coc__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-coc__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-coc__who { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-coc__name-line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); min-width: 0; }
.ui-coc__name { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-coc__line { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* On the selected fill, the quiet text steps up from muted to keep its contrast */
.ui-coc__item[data-open] :is(.ui-coc__line, .ui-coc__score-label) { color: var(--tc-text-secondary); }
.ui-coc__id { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-coc__id + .ui-coc__seen::before { content: "·"; margin-right: var(--tc-space-1-5); }
/* Strength: the words and up to three bars – never colour alone */
.ui-coc__strength { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-coc__strength[data-strength="always"] { background: var(--tc-status-danger-bg); box-shadow: none; color: var(--tc-status-danger-fg); }
.ui-coc__strength[data-strength="frequent"] { background: var(--tc-status-warning-bg); box-shadow: none; color: var(--tc-status-warning-fg); }
.ui-coc__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 10px; }
.ui-coc__bar { display: block; width: 3px; border-radius: var(--tc-radius-2xs); background: currentColor; opacity: 0.25; }
.ui-coc__bar:nth-child(1) { height: 4px; }
.ui-coc__bar:nth-child(2) { height: 7px; }
.ui-coc__bar:nth-child(3) { height: 10px; }
.ui-coc__bar[data-on] { opacity: 1; }
.ui-coc__share { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-coc__meter { display: block; flex: 0 1 120px; min-width: 48px; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-coc__meter-fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-coc__share-text { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-coc__counts { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-coc__count { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-coc__count-label { color: var(--tc-text-secondary); }
.ui-coc__score { display: grid; justify-items: end; padding-top: var(--tc-space-0-5); }
.ui-coc__score-n { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-coc__score-label { font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-transform: uppercase; letter-spacing: var(--tc-tracking-caps); }
.ui-coc__chev { display: grid; place-items: center; align-self: center; color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-coc__item[data-open] .ui-coc__chev { transform: rotate(90deg); }
/* ----- A row's shared events ----- */
.ui-coc__detail { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--tc-space-3); margin: 0 var(--tc-space-2-5) var(--tc-space-2-5) calc(var(--tc-coc-lead) + var(--tc-space-3) + var(--tc-space-2-5)); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); animation: ui-coc-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-coc__group { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-coc__group-title { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-coc__group-n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-coc__events { display: grid; gap: var(--tc-space-1); }
.ui-coc__event { display: flex; justify-content: space-between; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-coc__event-text { min-width: 0; }
.ui-coc__event-at { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-coc__none { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-coc__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-coc-in { from { opacity: 0; transform: translateY(3px); } }
@container (max-width: 520px) {
  .ui-coc__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-coc__stat--top { grid-column: 1 / -1; }
  .ui-coc__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-coc__chev { display: none; }
  .ui-coc__detail { margin-left: var(--tc-space-2-5); }
}
@media (forced-colors: active) {
  .ui-coc__strength, .ui-coc__count, .ui-coc__legend-item { border: 1px solid CanvasText; }
  .ui-coc__item[data-open] .ui-coc__row { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="coc"] *, [data-ui="coc"] *::before, [data-ui="coc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-co-occurrence")) customElements.define("tc-co-occurrence", TcCoOccurrence);

declare global {
  interface HTMLElementTagNameMap {
    "tc-co-occurrence": TcCoOccurrence;
  }
}
