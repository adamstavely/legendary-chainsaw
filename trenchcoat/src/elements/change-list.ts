import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { PopoverController } from "./internal/popover";
import "./check-status";
import type { CheckCounts } from "./check-status";

/*
 * <tc-change-list> – proposed code changes as compact rows, from any source: a mark for draft, open, merged or closed,
 * the title, where it is, lines added and removed, and how its checks went. Nothing here talks to a server: the page
 * passes plain data and decides what opening one means.
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows, ← / → to a row's More button, Home / End to the ends
 *   · More opens a menu of `rowActions`: ↑ / ↓ move, Enter acts, Escape closes and returns focus
 *   · `limit` rows show until Show more; `expanded` can be controlled, and focus goes to the first row it reveals
 *   · when it's narrow, the numbers drop under the title. Only the title is ever cut off
 *   · `bare` drops the tray and card, for a place that already has one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-change-list .items=${[{ id: "1", title: "Fix the sample index", repo: "institute/sample-tracker", state: "open" }]}>
 *   </tc-change-list>
 */

export type ChangeState = "draft" | "open" | "merged" | "closed";
export type ChangeItem = {
  id: string;
  title: string;
  /** Where it is, such as a repository's name */
  repo: string;
  /** Its number there */
  number?: number;
  state: ChangeState;
  /** Lines added */
  additions?: number;
  /** Lines removed */
  deletions?: number;
  /** How its checks went */
  checks?: CheckCounts;
};
export type ChangeRowAction = { id: string; label: string };
export type ChangeListLabels = Record<ChangeState, string> & { empty: string; showMore: string; showLess: string; more: string };

/** Details of the events */
export type ChangeOpen = { id: string; item: ChangeItem };
export type ChangeAction = { id: string; itemId: string; item: ChangeItem };
export type ChangeExpandedChange = { expanded: boolean };

/** The words used when the page gives none */
export const defaultChangeListLabels: ChangeListLabels = {
  draft: "Draft",
  open: "Open",
  merged: "Merged",
  closed: "Closed",
  empty: "No changes",
  showMore: "Show more",
  showLess: "Show less",
  more: "More actions",
};

/* Marks, the header's icon and the ellipsis: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<ChangeState, ReturnType<typeof svg>> = {
  open: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><path d="M6 9v12"></path>`,
  draft: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M18 6V5"></path><path d="M18 11v-1"></path><path d="M6 9v12"></path>`,
  merged: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path>`,
  closed: svg`<circle cx="6" cy="6" r="3"></circle><path d="M6 9v12"></path><path d="m21 3-6 6"></path><path d="m21 9-6-6"></path><path d="M18 11.5V15"></path><circle cx="18" cy="18" r="3"></circle>`,
};
const headIcon = MARK.open;
const moreIcon = svg`<circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle>`;

/**
 * Proposed code changes as compact rows: state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
 * @tag tc-change-list
 * @fires tc-open - A row was pressed ({ id, item }: ChangeOpen)
 * @fires tc-action - One of a row's actions was chosen ({ id, itemId, item }: ChangeAction)
 * @fires tc-expanded-change - Show more or Show less was pressed ({ expanded }: ChangeExpandedChange); cancelable – prevented, the list stays as it was
 */
export class TcChangeList extends TcElement {
  static override ui = "chl";

  /** The heading; empty draws no header */
  @property() accessor heading = "Changes";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The changes, in order */
  @property({ attribute: false }) accessor items: ChangeItem[] = [];
  /** What a row's More menu offers; with none there's no More button */
  @property({ attribute: false }) accessor rowActions: ChangeRowAction[] = [];
  /** How many rows show until Show more */
  @property({ type: Number }) accessor limit = 5;
  /** Every row is showing. Changed by Show more unless a tc-expanded-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<ChangeListLabels> = {};
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The tab stop: a row and a button in it (0 the row, 1 More) */
  @state() private accessor active = { r: 0, c: 0 };
  /** The row whose menu is open */
  @state() private accessor menuFor: string | null = null;
  private menuTrigger: HTMLElement | null = null;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-chl__menu"),
    anchor: () => this.menuTrigger,
    side: "bottom",
    align: "end",
    kind: "dialog",
    returnFocus: () => this.menuTrigger,
    onClose: () => {
      this.menuFor = null;
    },
  });

  private word<K extends keyof ChangeListLabels>(key: K) {
    return this.labels[key] ?? defaultChangeListLabels[key];
  }
  private get shown() {
    return this.expanded ? this.items : this.items.slice(0, Math.max(0, this.limit));
  }
  private num(n: number) {
    return n.toLocaleString(this.locale);
  }

  /* ---------- Keyboard: one tab stop for the rows' buttons ---------- */

  private focusAt(r: number, c: number) {
    const rows = this.shown;
    if (!rows.length) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    if (c === 1 && !this.rowActions.length) c = 0;
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = btn.dataset.at!.split(":").map(Number);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, 0],
      ArrowRight: [r, 1],
      Home: [0, c],
      End: [this.shown.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  /* ---------- The menu ---------- */

  private toggleMenu(item: ChangeItem, r: number, e: Event) {
    this.active = { r, c: 1 };
    const wasOpen = this.menuFor === item.id;
    if (this.pop.open) this.pop.close("api");
    this.menuFor = wasOpen ? null : item.id;
    if (wasOpen) return;
    this.menuTrigger = e.currentTarget as HTMLElement;
    this.pop.show();
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-chl__menu [role=menuitem]")?.focus());
  }
  private onMenuKey = (e: KeyboardEvent) => {
    const items = [...this.querySelectorAll<HTMLElement>(".ui-chl__menu [role=menuitem]")];
    const i = items.indexOf(e.target as HTMLElement);
    const to = { ArrowDown: (i + 1) % items.length, ArrowUp: (i - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[e.key];
    if (e.key === "Tab") {
      this.pop.close("api");
      return;
    }
    if (to === undefined) return;
    e.preventDefault();
    items[to]?.focus();
  };
  private choose(action: ChangeRowAction, item: ChangeItem) {
    this.emit<ChangeAction>("tc-action", { id: action.id, itemId: item.id, item });
    this.pop.close("api");
  }

  private toggleExpanded() {
    const expanded = !this.expanded;
    if (!this.emit<ChangeExpandedChange>("tc-expanded-change", { expanded }, { cancelable: true })) return;
    const firstNew = this.shown.length;
    this.expanded = expanded;
    if (expanded) this.focusAt(firstNew, 0);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const n = this.shown.length;
    if (n && (this.active.r >= n || (this.active.c === 1 && !this.rowActions.length))) this.active = { r: Math.min(this.active.r, n - 1), c: 0 };
    // A row whose menu is open went away
    if (this.menuFor && !this.shown.some((i) => i.id === this.menuFor)) {
      if (this.pop.open) this.pop.close("api");
      this.menuFor = null;
    }
  }

  /* ---------- Rendering ---------- */

  private renderRow(item: ChangeItem, r: number) {
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    const where = item.number !== undefined ? `${item.repo} #${item.number}` : item.repo;
    const lines = item.additions !== undefined || item.deletions !== undefined;
    return html`<li class="ui-chl__row" data-id=${item.id} data-state=${item.state}>
      <button type="button" class="ui-chl__open" data-at=${`${r}:0`} tabindex=${tab(0)} @click=${() => this.emit<ChangeOpen>("tc-open", { id: item.id, item })}>
        <span class="ui-chl__mark" aria-hidden="true">${lucide(16, MARK[item.state])}</span>
        <span class="ui-chl__text">
          <span class="ui-chl__sr">${this.word(item.state)}: </span>
          <span class="ui-chl__title" title=${item.title}>${item.title}</span>
          <span class="ui-chl__where">${where}</span>
        </span>
        ${lines || item.checks
          ? html`<span class="ui-chl__side">
              ${item.additions !== undefined ? html`<span class="ui-chl__add"><span aria-hidden="true">+${this.num(item.additions)}</span><span class="ui-chl__sr">, ${this.num(item.additions)} lines added</span></span>` : nothing}
              ${item.deletions !== undefined ? html`<span class="ui-chl__del"><span aria-hidden="true">−${this.num(item.deletions)}</span><span class="ui-chl__sr">, ${this.num(item.deletions)} lines removed</span></span>` : nothing}
              ${item.checks ? html`<tc-check-status compact .counts=${item.checks} look=${this.resolvedLook}></tc-check-status>` : nothing}
            </span>`
          : nothing}
      </button>
      ${this.rowActions.length
        ? html`<button
            type="button"
            class="ui-chl__more"
            data-at=${`${r}:1`}
            tabindex=${tab(1)}
            aria-haspopup="menu"
            aria-expanded=${this.menuFor === item.id ? "true" : "false"}
            aria-label=${`${this.word("more")}, ${item.title}`}
            @click=${(e: Event) => this.toggleMenu(item, r, e)}
          >${lucide(16, moreIcon)}</button>`
        : nothing}
    </li>`;
  }

  private renderMenu() {
    const item = this.items.find((i) => i.id === this.menuFor);
    if (!item || !this.pop.open) return nothing;
    return html`<div class="tc-pop ui-chl__menu" role="menu" aria-label=${`${this.word("more")}, ${item.title}`} @keydown=${this.onMenuKey}>
      ${this.rowActions.map((a) => html`<button type="button" role="menuitem" tabindex="-1" data-action=${a.id} @click=${() => this.choose(a, item)}>${a.label}</button>`)}
    </div>`;
  }

  protected override render() {
    const rows = this.shown;
    const hidden = this.items.length - Math.max(0, this.limit);
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description }) : nothing}
      <div class="ui-chl__card">
        ${rows.length
          ? html`<ul class="ui-chl__list" aria-label=${this.heading || "Changes"} @keydown=${this.onKey}>${repeat(rows, (i) => i.id, (i, r) => this.renderRow(i, r))}</ul>`
          : html`<p class="ui-chl__empty">${this.word("empty")}</p>`}
        ${hidden > 0
          ? html`<button type="button" class="ui-chl__toggle" aria-expanded=${this.expanded ? "true" : "false"} @click=${() => this.toggleExpanded()}>${this.word(this.expanded ? "showLess" : "showMore")}</button>`
          : nothing}
      </div>
      ${this.renderMenu()}`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="chl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chl"] {
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
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="chl"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="chl"] *, [data-ui="chl"] *::before, [data-ui="chl"] *::after { box-sizing: border-box; }
:where([data-ui="chl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="chl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="chl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="chl"] svg { display: block; flex: none; }
.ui-chl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-chl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="chl"][bare] .ui-chl__card { border-radius: 0; background: none; box-shadow: none; }
.ui-chl__row { position: relative; display: flex; align-items: stretch; }
.ui-chl__row + .ui-chl__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-chl__open { flex: 1 1 0; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); min-width: 0; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-3); text-align: left; }
.ui-chl__open:hover, .ui-chl__more:hover, .ui-chl__toggle:hover { background: var(--tc-fill-hover); }
.ui-chl__text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-chl__title { overflow: hidden; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-chl__where { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-chl__side { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-chl__add { color: var(--tc-status-success-fg); }
.ui-chl__del { color: var(--tc-status-danger-fg); }
.ui-chl__more { flex: none; display: grid; place-items: center; width: var(--tc-control-h-sm); min-height: var(--tc-control-h-sm); color: var(--tc-icon-muted); }
.ui-chl__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
.ui-chl__toggle { display: block; width: 100%; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); text-align: left; }
/* Every state has its own shape and a word, so colour is never the only cue */
.ui-chl__mark { color: var(--tc-text-muted); }
[data-state="open"] > .ui-chl__open > .ui-chl__mark { color: var(--tc-status-success-fg); }
[data-state="merged"] > .ui-chl__open > .ui-chl__mark { color: var(--tc-status-info-fg); }
[data-state="closed"] > .ui-chl__open > .ui-chl__mark { color: var(--tc-status-danger-fg); }
.ui-chl__menu { display: grid; min-width: 10rem; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
.ui-chl__menu button { min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); color: var(--tc-text-primary); font-size: var(--tc-menu-item-font-size); text-align: left; }
.ui-chl__menu button:hover, .ui-chl__menu button:focus { background: var(--tc-menu-item-hover); }
@container (max-width: 22rem) {
  .ui-chl__open { grid-template-columns: auto minmax(0, 1fr); }
  .ui-chl__side { grid-column: 2; justify-content: flex-start; }
}
@media (forced-colors: active) { .ui-chl__mark { color: CanvasText; } }
`;
}

if (!customElements.get("tc-change-list")) customElements.define("tc-change-list", TcChangeList);
declare global {
  interface HTMLElementTagNameMap {
    "tc-change-list": TcChangeList;
  }
}
