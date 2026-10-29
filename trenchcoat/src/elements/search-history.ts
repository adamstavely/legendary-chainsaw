import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-search-history> – the searches someone ran and the ones they kept. Two tabs, Recent and Saved, each with its
 * count; a filter box; searches grouped by day (Today, Yesterday, then the date). Each search shows its query, its
 * scopes ("Files", "AI mode"), how many results it found and when it ran, and three actions: run it again,
 * save or unsave it (a star), and remove it – which leaves "Removed · Undo" in its place until the next removal.
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between searches, ← / → between a search's actions, Home / End
 *     to the first and last search; Tab leaves the list
 *   · saving and removing fire cancelable events – prevent them to keep `searches` yourself
 *   · with `schedulable`, saved searches also offer Schedule (tc-schedule), for a page that runs them as routines
 *   · times are relative to `now`, or to the element's own clock, refreshed every minute
 * Each search leads with an icon for how it ran – a sparkle for AI mode, a funnel for the builder, a magnifier
 * otherwise – and its scopes, results and time read as one quiet line. Pointer users see a row's Schedule, star and
 * Remove when they hover it (a saved search keeps its star); keyboard and touch users always have them.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-search-history .searches=${[{ id: "s1", query: "invoice 7741", scopes: ["Files"], results: 12, at: ranAt }]}></tc-search-history>
 */

export type SearchHistoryEntry = {
  id: string;
  /** The query as typed, or a builder query in words */
  query: string;
  /** Where it searched or how: "Files", "AI mode", "Contents" */
  scopes?: string[];
  /** How many results it found */
  results?: number;
  /** When it ran, epoch ms */
  at: number;
  saved?: boolean;
};
export type SearchHistoryTab = "recent" | "saved";

/** Details of the events */
export type SearchHistorySelect = { id: string; search: SearchHistoryEntry };
/** `searches` is the list as it will be, for a page that keeps it */
export type SearchHistorySavedChange = { id: string; saved: boolean; searches: SearchHistoryEntry[] };
export type SearchHistoryRemove = { id: string; search: SearchHistoryEntry; searches: SearchHistoryEntry[] };
export type SearchHistoryTabChange = { tab: SearchHistoryTab };
export type SearchHistorySchedule = { id: string; search: SearchHistoryEntry };

const MIN = 60_000;
const DAY = 86_400_000;
let uidCount = 0;

/* history, search, sparkles, list-filter, star, x, calendar-clock: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>, fill = "none") =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill=${fill} stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const historyIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`;
const searchIcon = (size = 14) => lucide(size, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const sparkleIcon = () =>
  lucide(16, svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>`);
const builderIcon = () => lucide(16, svg`<path d="M3 6h18"></path><path d="M7 12h10"></path><path d="M10 18h4"></path>`);
/** How a search ran, from its scopes: AI mode, the query builder, or a plain search */
const kindOf = (s: SearchHistoryEntry) => {
  const scopes = (s.scopes ?? []).map((x) => x.toLowerCase());
  return scopes.includes("ai mode") ? "ai" : scopes.includes("builder") ? "builder" : "search";
};
const starPath = svg`<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>`;
const starIcon = (on: boolean) => lucide(15, starPath, on ? "currentColor" : "none");
const xIcon = () => lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const scheduleIcon = () =>
  lucide(15, svg`<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"></path><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h5"></path><path d="M17.5 17.5 16 16.3V14"></path><circle cx="16" cy="16" r="6"></circle>`);

/** Local midnight of the day `ms` falls in */
const dayStart = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/**
 * Recent and saved searches – tabs with counts, a filter, searches grouped by day with their scopes, result counts and
 * times, and Run again, a save star and Remove with Undo on each.
 * @tag tc-search-history
 * @fires tc-select - A search was picked to run again ({ id, search }: SearchHistorySelect)
 * @fires tc-saved-change - A search was saved or unsaved ({ id, saved, searches }: SearchHistorySavedChange); cancelable – prevented, `searches` stays as it was
 * @fires tc-remove - A search was removed ({ id, search, searches }: SearchHistoryRemove); cancelable – prevented, it stays until the page takes it out of `searches`
 * @fires tc-restore - A removed search was put back with Undo ({ id, search, searches }: SearchHistoryRemove); cancelable – prevented, it comes back when the page puts it in `searches`
 * @fires tc-tab-change - The tab changed ({ tab }: SearchHistoryTabChange); cancelable – prevented, `tab` stays as it was
 * @fires tc-schedule - Schedule was pressed on a saved search, with `schedulable` ({ id, search }: SearchHistorySchedule) – open your routine form here; cancelable – prevented, nothing is announced
 */
export class TcSearchHistory extends TcElement {
  static override ui = "shis";

  /** The heading, and the list's name */
  @property() accessor heading = "Search history";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The searches, any order; shown newest first. Saving and removing change it unless their events are prevented */
  @property({ attribute: false }) accessor searches: SearchHistoryEntry[] = [];
  /** The tab shown. Changed by the user unless a tc-tab-change listener calls preventDefault() */
  @property({ reflect: true }) accessor tab: SearchHistoryTab = "recent";
  /** What the filter box holds */
  @property() accessor filter = "";
  /** The time now, epoch ms; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for times and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Whether saved searches offer Schedule, to run them as routines (tc-schedule) */
  @property({ type: Boolean }) accessor schedulable = false;

  @state() private accessor clock = 0;
  @state() private accessor removed: { search: SearchHistoryEntry; index: number } | null = null;
  @state() private accessor active = { row: 0, col: 0 };
  /** The search holding the tab stop, so the stop stays with it when searches are added, removed or reordered */
  private activeId: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-shis-${++uidCount}`;
  /** A removal the page was asked to make: Undo appears once `searches` no longer has it */
  private pending: { search: SearchHistoryEntry; index: number } | null = null;
  private timer = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    this.timer = 0;
  }
  private tick() {
    clearInterval(this.timer);
    this.timer = 0;
    if (this.now !== undefined) return;
    this.readClock();
    // Read the clock on every tick rather than counting ticks: timers stall while the laptop sleeps or the tab is frozen
    this.timer = window.setInterval(this.readClock, MIN);
  }
  private readClock = () => (this.clock = Date.now());
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.isConnected) this.tick();
    // A removal that's no longer in the list (the page took it) can't be undone
    if (changed.has("searches")) {
      const has = (id: string) => this.searches.some((s) => s.id === id);
      if (this.removed && has(this.removed.search.id)) this.removed = null;
      if (this.pending && !has(this.pending.search.id)) {
        this.removed = this.pending;
        this.pending = null;
      }
    }
    // The tab stop follows its search; else it stays on a row that's there
    const shown = this.shown;
    const at = this.activeId === null ? -1 : shown.findIndex((x) => x.id === this.activeId);
    if (at >= 0 && at !== this.active.row) this.setActive(at, this.active.col);
    else if (at < 0 && shown.length && this.active.row > shown.length - 1) this.setActive(shown.length - 1, this.active.col);
  }

  /* ---------- The model ---------- */

  private get time() {
    return this.now ?? this.clock;
  }
  private get sorted() {
    return [...this.searches].sort((a, b) => b.at - a.at);
  }
  private passes(s: SearchHistoryEntry) {
    const q = this.filter.trim().toLowerCase();
    return !q || s.query.toLowerCase().includes(q) || (s.scopes ?? []).some((x) => x.toLowerCase().includes(q));
  }
  /** The searches the open tab shows, filtered */
  private get shown() {
    return this.sorted.filter((s) => (this.tab === "saved" ? s.saved : true) && this.passes(s));
  }
  private ago(at: number) {
    const diff = Math.max(0, this.time - at);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" });
    if (diff < MIN) return "just now";
    if (diff < 60 * MIN) return rtf.format(-Math.floor(diff / MIN), "minute");
    if (dayStart(at) === dayStart(this.time)) return rtf.format(-Math.floor(diff / (60 * MIN)), "hour");
    return formatDate(at, this.locale, { hour: "numeric", minute: "2-digit" });
  }
  private dayName(at: number) {
    const today = dayStart(this.time);
    const d = dayStart(at);
    if (d === today) return "Today";
    if (Math.round((today - d) / DAY) === 1) return "Yesterday";
    return formatDate(at, this.locale, { weekday: "long", month: "long", day: "numeric" });
  }

  /* ---------- Actions ---------- */

  private setTab(tab: SearchHistoryTab) {
    if (tab === this.tab) return;
    if (!this.emit<SearchHistoryTabChange>("tc-tab-change", { tab }, { cancelable: true })) return;
    this.tab = tab;
    this.setActive(0, 0);
  }
  private run(s: SearchHistoryEntry) {
    this.emit<SearchHistorySelect>("tc-select", { id: s.id, search: s });
  }
  private schedule(s: SearchHistoryEntry) {
    if (!this.emit<SearchHistorySchedule>("tc-schedule", { id: s.id, search: s }, { cancelable: true })) return;
    this.announce = `Scheduling “${s.query}”`;
  }
  /** A search's actions, left to right: run again, Schedule (saved, with `schedulable`), the star, remove */
  private actions(s: SearchHistoryEntry | undefined) {
    return ["run", ...(s && this.schedulable && s.saved ? ["schedule"] : []), "star", "remove"];
  }
  private toggleSaved(s: SearchHistoryEntry) {
    const saved = !s.saved;
    const next = this.searches.map((x) => (x.id === s.id ? { ...x, saved } : x));
    if (!this.emit<SearchHistorySavedChange>("tc-saved-change", { id: s.id, saved, searches: next }, { cancelable: true })) return;
    this.searches = next;
    this.announce = saved ? `Saved “${s.query}”` : `Removed “${s.query}” from saved`;
  }
  private removeSearch(s: SearchHistoryEntry, row: number) {
    const entry = { search: s, index: this.searches.findIndex((x) => x.id === s.id) };
    const next = this.searches.filter((x) => x.id !== s.id);
    if (!this.emit<SearchHistoryRemove>("tc-remove", { id: s.id, search: s, searches: next }, { cancelable: true })) {
      this.pending = entry;
      return;
    }
    this.removed = entry;
    this.searches = next;
    this.announce = `Removed “${s.query}”. Undo is next in the list`;
    // Focus moves to Undo, which takes the removed search's place
    void this.updateComplete.then(() => (this.querySelector<HTMLElement>(".ui-shis__undo") ?? this.cell(Math.min(row, this.shown.length - 1), 0))?.focus());
  }
  private undo() {
    const r = this.removed;
    if (!r) return;
    const next = [...this.searches];
    next.splice(Math.min(r.index, next.length), 0, r.search);
    if (!this.emit<SearchHistoryRemove>("tc-restore", { id: r.search.id, search: r.search, searches: next }, { cancelable: true })) return;
    this.removed = null;
    this.searches = next;
    this.announce = `Restored “${r.search.query}”`;
    const row = this.shown.findIndex((s) => s.id === r.search.id);
    this.setActive(Math.max(0, row), 0);
    void this.updateComplete.then(() => this.cell(this.active.row, 0)?.focus());
  }

  /* ---------- Keyboard: one tab stop across the rows' buttons ---------- */

  private setActive(row: number, col: number) {
    this.active = { row, col };
    this.activeId = this.shown[row]?.id ?? null;
  }

  private cell(row: number, col: number) {
    return this.querySelector<HTMLElement>(`[data-cell="${row}:${col}"]`);
  }
  private onListKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const [row, col] = el.dataset.cell!.split(":").map(Number);
    const last = this.shown.length - 1;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1],
      Home: [0, col],
      End: [last, col],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const r = Math.max(0, Math.min(last, m[0]));
    // Up and down keep the kind of action (the star stays on stars); one a row lacks falls back by position
    const shown = this.shown;
    const kind = this.actions(shown[row])[col];
    const there = this.actions(shown[r]);
    const same = r !== row ? there.indexOf(kind) : -1;
    const c = Math.max(0, Math.min(there.length - 1, same >= 0 ? same : m[1]));
    this.setActive(r, c);
    void this.updateComplete.then(() => this.cell(r, c)?.focus());
  };

  /* ---------- Rendering ---------- */

  private renderTabs(recent: number, saved: number) {
    const tabs: [SearchHistoryTab, string, number][] = [
      ["recent", "Recent", recent],
      ["saved", "Saved", saved],
    ];
    return html`<div class="ui-shis__tabs" role="tablist" aria-label="Searches">
      ${tabs.map(
        ([id, label, n]) => html`<button
          type="button"
          role="tab"
          class="ui-shis__tab"
          id=${`${this.uid}-tab-${id}`}
          aria-selected=${this.tab === id ? "true" : "false"}
          aria-controls=${`${this.uid}-panel`}
          tabindex=${this.tab === id ? 0 : -1}
          @click=${() => this.setTab(id)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
              e.preventDefault();
              const next: SearchHistoryTab = e.key === "Home" ? "recent" : e.key === "End" ? "saved" : this.tab === "recent" ? "saved" : "recent";
              this.setTab(next);
              void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-tab-${this.tab}`)?.focus());
            }
          }}
        >${label}<span class="ui-shis__count">${new Intl.NumberFormat(this.locale).format(n)}</span></button>`,
      )}
    </div>`;
  }

  private renderRow(s: SearchHistoryEntry, row: number) {
    const results = s.results === undefined ? "" : `${new Intl.NumberFormat(this.locale).format(s.results)} ${s.results === 1 ? "result" : "results"}`;
    const cols = this.actions(s);
    const col = (kind: string) => cols.indexOf(kind);
    // The stop's column, kept inside this row's actions (unsaving a search takes its Schedule away)
    const stopCol = Math.min(this.active.col, cols.length - 1);
    const stop = (c: number) => (this.active.row === row && stopCol === c ? 0 : -1);
    const focus = (c: number) => () => this.setActive(row, c);
    return html`<li class="ui-shis__row" data-id=${s.id} ?data-saved=${!!s.saved}>
      <button type="button" class="ui-shis__run" data-cell=${`${row}:0`} tabindex=${stop(0)} @focus=${focus(0)} @click=${() => this.run(s)}>
        <span class="ui-shis__glyph" data-kind=${kindOf(s)} aria-hidden="true">${kindOf(s) === "ai" ? sparkleIcon() : kindOf(s) === "builder" ? builderIcon() : searchIcon(16)}</span>
        <span class="ui-shis__main">
          <span class="ui-shis__query">${s.query}</span>
          <span class="ui-shis__meta">
            ${(s.scopes ?? []).map((x) => html`<span class="ui-shis__scope">${x}</span>`)}
            ${results ? html`<span class="ui-shis__results">${results}</span>` : nothing}
            <span class="ui-shis__time">${this.ago(s.at)}</span>
          </span>
        </span>
        <span class="tc-sr-only">, run again</span>
      </button>
      ${col("schedule") > 0
        ? html`<button
            type="button"
            class="ui-shis__schedule"
            data-cell=${`${row}:${col("schedule")}`}
            tabindex=${stop(col("schedule"))}
            aria-label=${`Schedule “${s.query}”`}
            title="Schedule"
            @focus=${focus(col("schedule"))}
            @click=${() => this.schedule(s)}
          >${scheduleIcon()}</button>`
        : nothing}
      <button
        type="button"
        class="ui-shis__star"
        data-cell=${`${row}:${col("star")}`}
        tabindex=${stop(col("star"))}
        aria-pressed=${s.saved ? "true" : "false"}
        aria-label=${`Save “${s.query}”`}
        title=${s.saved ? "Saved" : "Save"}
        @focus=${focus(col("star"))}
        @click=${() => this.toggleSaved(s)}
      >${starIcon(!!s.saved)}</button>
      <button type="button" class="ui-shis__remove" data-cell=${`${row}:${col("remove")}`} tabindex=${stop(col("remove"))} aria-label=${`Remove “${s.query}”`} title="Remove" @focus=${focus(col("remove"))} @click=${() => this.removeSearch(s, row)}>${xIcon()}</button>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const sorted = this.sorted;
    const shown = this.shown;
    const savedCount = sorted.filter((s) => s.saved).length;
    const groups: { day: string; rows: [SearchHistoryEntry, number][] }[] = [];
    shown.forEach((s, i) => {
      const day = this.dayName(s.at);
      const g = groups[groups.length - 1];
      if (g && g.day === day) g.rows.push([s, i]);
      else groups.push({ day, rows: [[s, i]] });
    });
    const removed = this.removed;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: historyIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: this.renderTabs(sorted.length, savedCount) })}
      <div class="ui-shis__card">
        <label class="ui-shis__filter">
          <span class="ui-shis__filter-icon" aria-hidden="true">${searchIcon()}</span>
          <span class="tc-sr-only">Filter searches</span>
          <input
            type="search"
            class="ui-shis__filter-input"
            placeholder="Filter searches"
            .value=${this.filter}
            @input=${(e: Event) => {
              this.filter = (e.target as HTMLInputElement).value;
              this.setActive(0, 0);
            }}
          />
        </label>
        ${removed
          ? html`<p class="ui-shis__removed">Removed “${removed.search.query}” · <button type="button" class="ui-shis__undo" @click=${() => this.undo()}>Undo</button></p>`
          : nothing}
        <div class="ui-shis__panel" id=${`${id}-panel`} role="tabpanel" aria-labelledby=${`${id}-tab-${this.tab}`}>
          ${shown.length
            ? html`<div @keydown=${this.onListKey}>
                ${groups.map(
                  (g) => html`<section class="ui-shis__day" aria-label=${g.day}>
                    <h4 class="ui-shis__day-name" aria-hidden="true">${g.day}</h4>
                    <ul class="ui-shis__list">
                      ${repeat(
                        g.rows,
                        ([s]) => s.id,
                        ([s, i]) => this.renderRow(s, i),
                      )}
                    </ul>
                  </section>`,
                )}
              </div>`
            : html`<p class="ui-shis__empty">${this.filter.trim() ? `No searches match “${this.filter.trim()}”.` : this.tab === "saved" ? "No saved searches yet – star one to keep it." : "No searches yet."}</p>`}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="shis"] {
  position: relative;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="shis"] {
  position: relative;
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
[data-ui="shis"] *, [data-ui="shis"] *::before, [data-ui="shis"] *::after { box-sizing: border-box; }
:where([data-ui="shis"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="shis"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="shis"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="shis"] p, [data-ui="shis"] h4 { margin: 0; }
[data-ui="shis"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-shis__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Tabs in the header ----- */
.ui-shis__tabs { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-shis__tab { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-shis__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-shis__tab[aria-selected="true"] { font-weight: var(--tc-font-weight-strong); }
.ui-shis__count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The filter ----- */
.ui-shis__filter { position: relative; display: block; margin: var(--tc-space-3) var(--tc-space-3) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-shis__filter { margin-top: var(--tc-space-1); }
.ui-shis__filter-icon { position: absolute; top: 50%; left: var(--tc-space-2-5); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
/* A quiet field: a soft fill at rest, the field's own ring only on focus */
.ui-shis__filter-input { width: 100%; height: var(--tc-control-h-md); padding: 0 var(--tc-field-px) 0 calc(var(--tc-space-2-5) + var(--tc-space-5)); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-fill-subtle); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-shis__filter-input::placeholder { color: var(--tc-text-placeholder); }
.ui-shis__filter-input::-webkit-search-cancel-button { display: none; }
.ui-shis__filter-input:hover { background: var(--tc-fill-hover); }
.ui-shis__filter-input:focus-visible { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
/* ----- Days and rows ----- */
.ui-shis__panel { padding: var(--tc-space-1) 0 var(--tc-space-2); }
.ui-shis__day + .ui-shis__day { margin-top: var(--tc-space-1); }
.ui-shis__day-name { padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-shis__row { display: flex; align-items: center; gap: var(--tc-space-0-5); margin: 0 var(--tc-space-2); padding-right: var(--tc-space-1-5); border-radius: var(--tc-menu-item-radius); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-shis__row:hover { background: var(--tc-menu-item-hover); }
.ui-shis__run { display: flex; flex: 1; align-items: flex-start; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); text-align: left; }
/* The kind of search, a bare icon on the query's line */
.ui-shis__glyph { display: grid; place-items: center; flex: none; width: var(--tc-space-5); height: calc(var(--tc-font-size-md) * var(--tc-line-height-snug)); color: var(--tc-icon-muted); }
.ui-shis__glyph[data-kind="ai"] { color: var(--tc-tone-violet-fg); }
.ui-shis__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-shis__query { overflow: hidden; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
/* Scopes, results and time as one line, dot-separated */
.ui-shis__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-shis__meta > * + *::before { content: "·"; margin-right: var(--tc-space-1-5); color: var(--tc-text-muted); }
.ui-shis__scope { color: var(--tc-text-secondary); }
.ui-shis__results, .ui-shis__time { font-variant-numeric: tabular-nums; }
.ui-shis__star, .ui-shis__remove, .ui-shis__schedule { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-shis__star:hover, .ui-shis__remove:hover, .ui-shis__schedule:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-shis__star[aria-pressed="true"] { color: var(--tc-status-warning-solid); }
/* With a pointer, a row's actions show on hover or focus; a saved search keeps its star */
@media (hover: hover) and (pointer: fine) {
  .ui-shis__row:not(:hover, :focus-within) :is(.ui-shis__schedule, .ui-shis__remove, .ui-shis__star[aria-pressed="false"]) { opacity: 0; }
}
.ui-shis__removed { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); margin: var(--tc-space-2) var(--tc-space-3) 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); animation: ui-shis-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-shis__undo { font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-shis__empty { padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
@keyframes ui-shis-in { from { opacity: 0; transform: translateY(2px); } }
@container (max-width: 420px) {
  .ui-shis__glyph { display: none; }
}
@media (forced-colors: active) {
  .ui-shis__tab[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-shis__filter-input { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="shis"] *, [data-ui="shis"] *::before, [data-ui="shis"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-search-history")) customElements.define("tc-search-history", TcSearchHistory);

declare global {
  interface HTMLElementTagNameMap {
    "tc-search-history": TcSearchHistory;
  }
}
