import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { formatDate, isoDate } from "./internal/util";

/*
 * <tc-results-list> – what a search found, to read and open. Each result shows an icon and pill for its kind (a
 * document, a person, an email – any word), its title, a snippet with every word of the query picked out, and one
 * quiet line with its source, date and anything else the page adds. Results are grouped by kind under headings with
 * counts ("Documents 12"), or listed as they come with `group="none"`; Relevance / Date reorders them.
 *   · "Did you mean …" offers `suggestion` as a button (tc-suggestion), above the results and in the empty state
 *   · a result with `href` is a link; every title fires a cancelable tc-open first
 *   · the titles are one tab stop: ↑ / ↓ move between results, Home / End to the ends, Enter opens
 *   · `pageSize` results show at first, Show more adds the next lot (tc-more – `has-more` keeps the button when the
 *     page loads more itself); `loading` shows placeholder rows
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-results-list query="field notes" .results=${[{ id: "r1", title: "Field notes, March", kind: "Document" }]}></tc-results-list>
 */

export type SearchResult = {
  id: string;
  title: string;
  /** A passage that shows why it matched; the query's words are picked out */
  snippet?: string;
  /** What it is – "Document", "Person", "Email" or any word; results are grouped by it */
  kind?: string;
  /** Where it lives – a folder, a site, a mailbox */
  source?: string;
  /** Where it opens; a title without one is a button (tc-open) */
  href?: string;
  /** When it was made or changed, epoch ms */
  date?: number;
  /** How well it matched, 0–1, for the page's own use */
  score?: number;
  /** More words for the quiet line under the snippet */
  meta?: string[];
};
export type ResultsSort = "relevance" | "date";
export type ResultsGroup = "kind" | "none";

/** Details of the events */
export type ResultsOpen = { id: string; result: SearchResult };
export type ResultsSelectedChange = { selected: string | null; result?: SearchResult };
export type ResultsSortChange = { sort: ResultsSort };
export type ResultsSuggestion = { suggestion: string };
export type ResultsMore = { shown: number; total: number };

let uidCount = 0;

/* search, file-text, user, mail, calendar, image, folder, link: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const searchGlyph = svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`;
const KIND_ICONS: [RegExp, ReturnType<typeof svg>][] = [
  [/person|people|user|contact|author/i, svg`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`],
  [/mail|message/i, svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`],
  [/event|meeting|calendar/i, svg`<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path>`],
  [/image|photo|figure/i, svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>`],
  [/folder|project|collection/i, svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>`],
  [/link|page|web|site/i, svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`],
];
const docGlyph = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`;
const kindIcon = (kind = "") => lucide(16, KIND_ICONS.find(([re]) => re.test(kind))?.[1] ?? docGlyph);

/** A kind's group heading: "Document" → "Documents", "Person" → "People", "Inbox" → "Inboxes" */
export function pluralKind(kind: string) {
  if (/^person$/i.test(kind)) return kind[0] === "P" ? "People" : "people";
  if (/(s|x|z|ch|sh)$/i.test(kind)) return `${kind}es`;
  if (/[^aeiou]y$/i.test(kind)) return `${kind.slice(0, -1)}ies`;
  return `${kind}s`;
}

/** The query's words worth picking out: two letters or more, longest first so a longer word wins an overlap */
export function queryTerms(query: string) {
  return [...new Set(query.toLowerCase().split(/\s+/).filter((t) => t.length > 1))].sort((a, b) => b.length - a.length);
}

/**
 * Search results to read and open – kind, title, a snippet with the query's words marked, source and date; grouped by
 * kind, sorted by relevance or date, "Did you mean", Show more and loading rows.
 * @tag tc-results-list
 * @fires tc-open - A result was opened ({ id, result }: ResultsOpen); cancelable – prevented, a link doesn't follow
 * @fires tc-selected-change - The result in focus changed ({ selected, result }: ResultsSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-sort-change - Relevance or Date was picked ({ sort }: ResultsSortChange); cancelable – prevented, `sort` stays as it was
 * @fires tc-suggestion - "Did you mean" was pressed ({ suggestion }: ResultsSuggestion) – search for it
 * @fires tc-more - Show more was pressed ({ shown, total }: ResultsMore); cancelable – prevented, the page adds the next results itself
 */
export class TcResultsList extends TcElement {
  static override ui = "rsl";

  /** The heading, and the list's name */
  @property() accessor heading = "Results";
  /** What was searched for; its words are picked out in titles and snippets */
  @property() accessor query = "";
  /** The results, in order of relevance */
  @property({ attribute: false }) accessor results: SearchResult[] = [];
  /** Group results under their kind, or list them as they come */
  @property() accessor group: ResultsGroup = "kind";
  /** "Did you mean …" – a corrected query to offer */
  @property() accessor suggestion: string | undefined = undefined;
  /** How many there are in all, in words ("About 1,240 results"); by default the count of `results` */
  @property() accessor total: string | undefined = undefined;
  /** The order. Changed by the user unless a tc-sort-change listener calls preventDefault() */
  @property({ reflect: true }) accessor sort: ResultsSort = "relevance";
  /** Waiting for results: placeholder rows */
  @property({ type: Boolean, reflect: true }) accessor loading = false;
  /** The result in focus. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | null = null;
  /** How many show at first, and how many Show more adds */
  @property({ type: Number, attribute: "page-size" }) accessor pageSize = 10;
  /** There are more than `results` holds: Show more stays, for the page to load them (tc-more) */
  @property({ type: Boolean, attribute: "has-more" }) accessor hasMore = false;
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor limit = 10;
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-rsl-${++uidCount}`;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("pageSize") || changed.has("query")) this.limit = Math.max(1, this.pageSize);
    if (changed.has("selected") && this.selected) this.active = this.selected;
  }

  /* ---------- The model ---------- */

  private get ordered() {
    if (this.sort !== "date") return this.results;
    // Newest first; undated last, in their own order
    return [...this.results].sort((a, b) => (b.date ?? -Infinity) - (a.date ?? -Infinity));
  }
  private get visible() {
    return this.ordered.slice(0, this.limit);
  }
  /** The groups shown, in the order their kinds first appear */
  private get groups() {
    const vis = this.visible;
    if (this.group === "none") return [{ kind: "", rows: vis }];
    const order: string[] = [];
    const by = new Map<string, SearchResult[]>();
    for (const r of vis) {
      const k = r.kind ?? "Other";
      if (!by.has(k)) {
        by.set(k, []);
        order.push(k);
      }
      by.get(k)!.push(r);
    }
    return order.map((kind) => ({ kind, rows: by.get(kind)! }));
  }
  /** Every result of a kind, not only those shown – the heading's count */
  private countOf(kind: string) {
    return this.results.filter((r) => (r.kind ?? "Other") === kind).length;
  }
  /** Results in the order they're drawn – the arrow keys' order */
  private get flat() {
    return this.groups.flatMap((g) => g.rows);
  }

  /* ---------- Actions ---------- */

  private setSort(sort: ResultsSort) {
    if (sort === this.sort) return;
    if (!this.emit<ResultsSortChange>("tc-sort-change", { sort }, { cancelable: true })) return;
    this.sort = sort;
    this.announce = sort === "date" ? "Sorted by date, newest first" : "Sorted by relevance";
  }

  private setSelected(r: SearchResult) {
    this.active = r.id;
    if (r.id === this.selected) return;
    if (!this.emit<ResultsSelectedChange>("tc-selected-change", { selected: r.id, result: r }, { cancelable: true })) return;
    this.selected = r.id;
  }

  private open(r: SearchResult, e: Event) {
    if (!this.emit<ResultsOpen>("tc-open", { id: r.id, result: r }, { cancelable: true })) e.preventDefault();
  }

  private more() {
    if (!this.emit<ResultsMore>("tc-more", { shown: this.limit, total: this.results.length }, { cancelable: true })) return;
    const before = this.limit;
    this.limit += Math.max(1, this.pageSize);
    const added = Math.min(this.limit, this.results.length) - before;
    if (added > 0) {
      this.announce = `${added} more ${added === 1 ? "result" : "results"}`;
      // Focus goes to the first new result
      const next = this.flat[before];
      if (next) void this.updateComplete.then(() => this.focusResult(next.id));
    }
  }

  private focusResult(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-title="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const t = (e.target as Element).closest<HTMLElement>("[data-title]");
    if (!t || e.altKey || e.ctrlKey || e.metaKey) return;
    const list = this.flat;
    const i = list.findIndex((r) => r.id === t.dataset.title);
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const r = list[Math.max(0, Math.min(list.length - 1, to))];
    if (r) this.focusResult(r.id);
  };

  /* ---------- Rendering ---------- */

  /** Text with the query's words marked */
  private hl(text: string): unknown {
    const terms = queryTerms(this.query);
    if (!terms.length || !text) return text;
    const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return text.split(re).map((part, i) => (i % 2 ? html`<mark class="ui-rsl__mark">${part}</mark>` : part));
  }

  private renderResult(r: SearchResult, tabStop: string | undefined) {
    const href = safeUrl(r.href);
    const date = r.date !== undefined ? formatDate(r.date, this.locale, { dateStyle: "medium" }) : "";
    const meta = [r.source, ...(r.meta ?? [])].filter((x): x is string => !!x);
    const titleId = `${this.uid}-t-${r.id}`;
    const common = {
      tabindex: r.id === tabStop ? 0 : -1,
    };
    const title = href
      ? html`<a class="ui-rsl__title" id=${titleId} data-title=${r.id} href=${href} tabindex=${common.tabindex} @click=${(e: Event) => this.open(r, e)} @focus=${() => this.setSelected(r)}>${this.hl(r.title)}</a>`
      : html`<button type="button" class="ui-rsl__title" id=${titleId} data-title=${r.id} tabindex=${common.tabindex} @click=${(e: Event) => this.open(r, e)} @focus=${() => this.setSelected(r)}>${this.hl(r.title)}</button>`;
    return html`<li class="ui-rsl__item" data-id=${r.id} ?data-selected=${r.id === this.selected}>
      <span class="ui-rsl__icon" aria-hidden="true">${kindIcon(r.kind)}</span>
      <div class="ui-rsl__main">
        <div class="ui-rsl__head">
          ${title}
          ${r.kind && this.group === "none" ? html`<span class="ui-rsl__kind">${r.kind}</span>` : nothing}
        </div>
        ${r.snippet ? html`<p class="ui-rsl__snippet">${this.hl(r.snippet)}</p>` : nothing}
        ${meta.length || date
          ? html`<p class="ui-rsl__meta">
              ${meta.map((m) => html`<span>${m}</span>`)}${date ? html`<time datetime=${ifDefined(isoDate(r.date))}>${date}</time>` : nothing}
            </p>`
          : nothing}
      </div>
    </li>`;
  }

  private renderSuggestion() {
    if (!this.suggestion) return nothing;
    return html`<p class="ui-rsl__suggest">
      Did you mean
      <button type="button" class="ui-rsl__suggest-btn" @click=${() => this.emit<ResultsSuggestion>("tc-suggestion", { suggestion: this.suggestion! })}>${this.suggestion}</button>?
    </p>`;
  }

  private renderSort() {
    const opts: [ResultsSort, string][] = [
      ["relevance", "Relevance"],
      ["date", "Date"],
    ];
    return html`<div class="ui-rsl__sort" role="group" aria-label="Sort by">
      ${opts.map(([id, label]) => html`<button type="button" class="ui-rsl__sort-opt" aria-pressed=${this.sort === id ? "true" : "false"} @click=${() => this.setSort(id)}>${label}</button>`)}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const flat = this.flat;
    const tabStop = flat.find((r) => r.id === this.active)?.id ?? flat[0]?.id;
    const count = this.results.length;
    const q = this.query.trim();
    const subtitle = this.loading ? "Searching…" : (this.total ?? (q ? `${count} ${count === 1 ? "result" : "results"} for “${q}”` : `${count} ${count === 1 ? "result" : "results"}`));
    const moreLeft = this.results.length > this.limit || this.hasMore;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: searchGlyph, title: this.heading, subtitle, id: `${id}-title`, aside: count && !this.loading ? this.renderSort() : nothing })}
      <div class="ui-rsl__card" aria-busy=${this.loading ? "true" : "false"}>
        ${this.loading
          ? html`<ul class="ui-rsl__list" aria-label="Loading results">
              ${[0, 1, 2].map(
                () => html`<li class="ui-rsl__item ui-rsl__skeleton" aria-hidden="true">
                  <span class="ui-rsl__icon"></span>
                  <div class="ui-rsl__main"><span class="ui-rsl__bar" data-w="title"></span><span class="ui-rsl__bar"></span><span class="ui-rsl__bar" data-w="short"></span></div>
                </li>`,
              )}
            </ul>`
          : count
            ? html`${this.renderSuggestion()}
                <div class="ui-rsl__groups" @keydown=${this.onKey}>
                  ${this.groups.map((g, gi) =>
                    g.kind
                      ? html`<section class="ui-rsl__group" aria-labelledby=${`${id}-g-${gi}`}>
                          <h4 class="ui-rsl__group-name" id=${`${id}-g-${gi}`}>${pluralKind(g.kind)} <span class="ui-rsl__count">${this.countOf(g.kind)}</span></h4>
                          <ul class="ui-rsl__list">${g.rows.map((r) => this.renderResult(r, tabStop))}</ul>
                        </section>`
                      : html`<ul class="ui-rsl__list" aria-labelledby=${`${id}-title`}>${g.rows.map((r) => this.renderResult(r, tabStop))}</ul>`,
                  )}
                </div>
                ${moreLeft ? html`<div class="ui-rsl__foot"><button type="button" class="ui-rsl__more" @click=${() => this.more()}>Show more</button></div>` : nothing}`
            : html`<div class="ui-rsl__empty">
                <p class="ui-rsl__empty-title">${q ? html`No results for “${q}”` : "No results"}</p>
                ${this.suggestion ? this.renderSuggestion() : html`<p class="ui-rsl__empty-hint">Try fewer or different words.</p>`}
              </div>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="rsl"] {
  --tc-rsl-snippet-lines: 3;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rsl"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-rsl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rsl"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rsl__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="rsl"] *, [data-ui="rsl"] *::before, [data-ui="rsl"] *::after { box-sizing: border-box; }
:where([data-ui="rsl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rsl"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="rsl"]) :is(h4, p, ul) { margin: 0; padding: 0; }
[data-ui="rsl"] ul { list-style: none; }
[data-ui="rsl"] svg { display: block; flex: none; }
/* ----- Sort ----- */
.ui-rsl__sort { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rsl__sort-opt { display: inline-flex; align-items: center; height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rsl__sort-opt[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rsl__sort-opt[aria-pressed="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- Did you mean ----- */
.ui-rsl__suggest { padding: var(--tc-space-3) var(--tc-space-4) 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rsl__suggest-btn { font-weight: var(--tc-font-weight-medium); font-style: italic; color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* ----- Groups and results ----- */
.ui-rsl__groups { padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-2); }
.ui-rsl__group + .ui-rsl__group { margin-top: var(--tc-space-1); }
.ui-rsl__group-name { display: flex; align-items: baseline; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rsl__count { font-variant-numeric: tabular-nums; color: var(--tc-text-muted); letter-spacing: normal; }
.ui-rsl__list { display: grid; gap: var(--tc-space-0-5); }
.ui-rsl__item { position: relative; display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rsl__item:hover { background: var(--tc-menu-item-hover); }
.ui-rsl__item[data-selected] { background: var(--tc-fill-selected); }
.ui-rsl__icon { display: grid; flex: none; place-items: center; width: var(--tc-space-6); height: var(--tc-space-6); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
.ui-rsl__main { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rsl__head { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
.ui-rsl__title { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-align: left; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
.ui-rsl__title:hover { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* The whole row opens it: the title's hit area covers the result */
.ui-rsl__title::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.ui-rsl__kind { flex: none; padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-secondary); }
.ui-rsl__snippet { display: -webkit-box; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); -webkit-box-orient: vertical; -webkit-line-clamp: var(--tc-rsl-snippet-lines); line-clamp: var(--tc-rsl-snippet-lines); }
.ui-rsl__mark { border-radius: var(--tc-radius-2xs); background: var(--tc-tone-amber-bg); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-rsl__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rsl__meta > * + *::before { content: "·"; margin-right: var(--tc-space-1-5); }
/* ----- Foot, empty, loading ----- */
.ui-rsl__foot { display: flex; justify-content: center; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rsl__more { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-rsl__more:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rsl__empty { display: grid; gap: var(--tc-space-1); justify-items: center; padding: var(--tc-space-8) var(--tc-space-4); text-align: center; }
.ui-rsl__empty .ui-rsl__suggest { padding: 0; }
.ui-rsl__empty-title { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rsl__empty-hint { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rsl__card > .ui-rsl__list { padding: var(--tc-space-2); }
.ui-rsl__skeleton:hover { background: none; }
.ui-rsl__bar { display: block; width: 100%; height: var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); animation: ui-rsl-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite alternate; }
.ui-rsl__bar[data-w="title"] { width: 45%; height: var(--tc-space-3); margin-bottom: var(--tc-space-1); }
.ui-rsl__bar[data-w="short"] { width: 30%; }
/* Placeholder rows breathe rather than shimmer: opacity is cheap to animate */
@keyframes ui-rsl-pulse { to { opacity: 0.55; } }
@container (max-width: 480px) {
  .ui-rsl__snippet { --tc-rsl-snippet-lines: 2; }
  .ui-rsl__icon { display: none; }
}
@media (forced-colors: active) {
  .ui-rsl__sort-opt[aria-pressed="true"] { outline: 2px solid Highlight; }
  .ui-rsl__mark { outline: 1px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rsl"] *, [data-ui="rsl"] *::before, [data-ui="rsl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-results-list")) customElements.define("tc-results-list", TcResultsList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-results-list": TcResultsList;
  }
}
