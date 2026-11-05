import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { formatDate } from "./internal/util";

/*
 * <tc-session-list> – the sessions in a sidebar: pinned ones first, then grouped by project or by status, each a row
 * with its status as a mark and a word, the title, an unread dot, the branch and how long ago it last changed. Waiting
 * means it needs you, so it's the one in the accent colour; running spins (still, with reduced motion).
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows, ← / → to a row's Pin and Archive, Home / End to the ends
 *   · Pin and Archive are events: the page changes `sessions`, and the list follows
 *   · the filter matches the title, project, branch and detail
 *   · times are relative to `now`, or to the element's own clock, refreshed every minute
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-session-list .sessions=${[{ id: "a", title: "Booking calendar", status: "running", project: "sample-tracker" }]}>
 *   </tc-session-list>
 */

export type SessionStatus = "running" | "waiting" | "idle" | "done" | "failed";
export type SessionItem = {
  id: string;
  title: string;
  status: SessionStatus;
  /** The project or repository it belongs to */
  project?: string;
  /** The branch it works on */
  branch?: string;
  /** When it last changed: epoch ms or an ISO string */
  updated?: number | string;
  /** Something new since it was last opened */
  unread?: boolean;
  /** Kept at the top */
  pinned?: boolean;
  /** One quiet line, such as what it's doing now */
  detail?: string;
};
export type SessionGroupBy = "project" | "status" | "none";
export type SessionListActionItem = { id: string; label: string; icon: string | string[] };
export type SessionListLabels = Record<SessionStatus, string> & {
  pinned: string;
  other: string;
  filter: string;
  create: string;
  pin: string;
  unpin: string;
  archive: string;
  unread: string;
  empty: string;
  noMatch: string;
  /** Said when a session is pinned; {title} is the session's title */
  pinnedOne: string;
  /** Said when a session is unpinned; {title} is the session's title */
  unpinnedOne: string;
  /** Said when a session is archived; {title} is the session's title */
  archivedOne: string;
};

/** Details of the events */
export type SessionSelectedChange = { selected: string | null; session?: SessionItem };
export type SessionQueryChange = { query: string };
export type SessionPin = { id: string; pinned: boolean; session: SessionItem };
export type SessionArchive = { id: string; session: SessionItem };
export type SessionListAction = { id: string };

/** The words used when the page gives none */
export const defaultSessionListLabels: SessionListLabels = {
  running: "Running",
  waiting: "Needs you",
  idle: "Idle",
  done: "Done",
  failed: "Failed",
  pinned: "Pinned",
  other: "Other",
  filter: "Filter sessions",
  create: "New session",
  pin: "Pin",
  unpin: "Unpin",
  archive: "Archive",
  unread: "unread",
  empty: "No sessions yet",
  noMatch: "No sessions match",
  pinnedOne: "Pinned {title}",
  unpinnedOne: "Unpinned {title}",
  archivedOne: "Archived {title}",
};

/** A label with the session's title in it – a function replacement, so a "$" in a title stays a "$" */
const withTitle = (label: string, title: string) => label.replace("{title}", () => title);

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const STATUS_MARK: Record<SessionStatus, ReturnType<typeof svg>> = {
  running: svg`<path d="M21 12a9 9 0 1 1-6.219-8.56"></path>`,
  waiting: svg`<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line>`,
  idle: svg`<circle cx="12" cy="12" r="10"></circle>`,
  done: svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`,
  failed: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
};
const headIcon = svg`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>`;
const pinIcon = svg`<path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>`;
const archiveIcon = svg`<rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path>`;
const plusIcon = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const glyph = (paths: string | string[]) =>
  html`<svg class="ui-sesl__action-glyph" viewBox="0 0 24 24" aria-hidden="true">${(Array.isArray(paths) ? paths : [paths]).map((d) => svg`<path d=${d}></path>`)}</svg>`;

const MIN = 60_000;
const STATUS_ORDER: SessionStatus[] = ["waiting", "running", "failed", "idle", "done"];
let uidCount = 0;

const toMs = (v: number | string | undefined) => {
  if (v === undefined || v === "") return undefined;
  const ms = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(ms) ? ms : undefined;
};

type Group = { key: string; label: string; items: SessionItem[] };

/**
 * The sessions in a sidebar: pinned first, then grouped by project or status, each with its status, title, unread dot, branch and time, plus Pin and Archive.
 * @tag tc-session-list
 * @fires tc-selected-change - A session was opened ({ selected, session }: SessionSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-query-change - The filter changed ({ query }: SessionQueryChange); cancelable – prevented, the filter keeps its text
 * @fires tc-pin - Pin or Unpin was pressed ({ id, pinned, session }: SessionPin); cancelable
 * @fires tc-archive - Archive was pressed ({ id, session }: SessionArchive); cancelable
 * @fires tc-create - New session was pressed (detail: {})
 * @fires tc-action - A header button was pressed ({ id }: SessionListAction)
 */
export class TcSessionList extends TcElement {
  static override ui = "sesl";

  /** The heading; empty draws no header */
  @property() accessor heading = "Sessions";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The sessions, any order; within a group the newest comes first */
  @property({ attribute: false }) accessor sessions: SessionItem[] = [];
  /** How the unpinned sessions are grouped */
  @property({ attribute: "group-by" }) accessor groupBy: SessionGroupBy = "project";
  /** The open session's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** What the filter holds. Changed by typing unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** Hides the filter */
  @property({ type: Boolean, attribute: "hide-filter" }) accessor hideFilter = false;
  /** Hides New session */
  @property({ type: Boolean, attribute: "hide-create" }) accessor hideCreate = false;
  /** Small buttons in the header */
  @property({ attribute: false }) accessor actions: SessionListActionItem[] = [];
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<SessionListLabels> = {};
  /** The tallest the list grows before it scrolls, a CSS length */
  @property({ attribute: "max-height" }) accessor maxHeight: string | undefined = undefined;
  /** The time now, epoch ms; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  @state() private accessor clock = 0;
  /** The tab stop: a session and a button in its row (0 the row, 1 Pin, 2 Archive) */
  @state() private accessor active = { id: "", c: 0 };
  @state() private accessor announce = "";
  private timer = 0;
  private uid = `tc-sesl-${++uidCount}`;

  constructor() {
    super();
    // Archive usually takes the row away while its button has focus; focus moves to the neighbour that's now the tab stop
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-sesl__row [data-c][tabindex="0"]'));
  }

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
    this.timer = window.setInterval(this.readClock, MIN);
  }
  private readClock = () => (this.clock = Date.now());

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.isConnected) this.tick();
    // The tab stop stays with a session that's shown: the selected one, else the first
    const order = this.order;
    if (!order.some((s) => s.id === this.active.id)) this.active = { id: order.find((s) => s.id === this.selected)?.id ?? order[0]?.id ?? "", c: 0 };
  }

  /* ---------- The model ---------- */

  private word<K extends keyof SessionListLabels>(key: K) {
    return this.labels[key] ?? defaultSessionListLabels[key];
  }
  private passes(s: SessionItem) {
    const q = this.query.trim().toLowerCase();
    return !q || [s.title, s.project, s.branch, s.detail].some((t) => t?.toLowerCase().includes(q));
  }
  private get groups(): Group[] {
    const newest = (a: SessionItem, b: SessionItem) => (toMs(b.updated) ?? 0) - (toMs(a.updated) ?? 0);
    const shown = this.sessions.filter((s) => this.passes(s)).sort(newest);
    const groups: Group[] = [];
    const pinned = shown.filter((s) => s.pinned);
    if (pinned.length) groups.push({ key: "pinned", label: this.word("pinned"), items: pinned });
    const rest = shown.filter((s) => !s.pinned);
    if (this.groupBy === "status") {
      for (const st of STATUS_ORDER) {
        const items = rest.filter((s) => s.status === st);
        if (items.length) groups.push({ key: `status:${st}`, label: this.word(st), items });
      }
    } else if (this.groupBy === "project") {
      const names = [...new Set(rest.map((s) => s.project ?? ""))].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
      for (const name of names) groups.push({ key: `project:${name}`, label: name || this.word("other"), items: rest.filter((s) => (s.project ?? "") === name) });
    } else if (rest.length) groups.push({ key: "all", label: "", items: rest });
    return groups;
  }
  /** The rows in order, as the arrow keys meet them */
  private get order() {
    return this.groups.flatMap((g) => g.items);
  }
  private ago(ms: number) {
    const time = this.now ?? this.clock;
    const diff = Math.max(0, time - ms);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "narrow" });
    if (diff < MIN) return rtf.format(0, "second");
    if (diff < 60 * MIN) return rtf.format(-Math.floor(diff / MIN), "minute");
    if (diff < 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (60 * MIN)), "hour");
    if (diff < 7 * 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (24 * 60 * MIN)), "day");
    // Older than a week: a date, with the year when it isn't this year's
    const sameYear = new Date(ms).getFullYear() === new Date(time).getFullYear();
    return formatDate(ms, this.locale, sameYear ? { month: "short", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" });
  }

  /* ---------- Acting ---------- */

  private select(s: SessionItem) {
    this.active = { id: s.id, c: 0 };
    if (s.id === this.selected) return;
    if (!this.emit<SessionSelectedChange>("tc-selected-change", { selected: s.id, session: s }, { cancelable: true })) return;
    this.selected = s.id;
  }
  private pin(s: SessionItem) {
    this.active = { id: s.id, c: 1 };
    const pinned = !s.pinned;
    if (this.emit<SessionPin>("tc-pin", { id: s.id, pinned, session: s }, { cancelable: true })) this.announce = withTitle(this.word(pinned ? "pinnedOne" : "unpinnedOne"), s.title);
  }
  private archive(s: SessionItem) {
    const order = this.order;
    const i = order.findIndex((x) => x.id === s.id);
    if (!this.emit<SessionArchive>("tc-archive", { id: s.id, session: s }, { cancelable: true })) return;
    this.announce = withTitle(this.word("archivedOne"), s.title);
    // The tab stop moves to a neighbour, in case the page takes the row away
    const next = order[i + 1] ?? order[i - 1];
    if (next) this.active = { id: next.id, c: 0 };
  }
  private setQuery(query: string, input: HTMLInputElement) {
    if (!this.emit<SessionQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      input.value = this.query;
      return;
    }
    this.query = query;
  }

  private focusAt(r: number, c: number) {
    const order = this.order;
    if (!order.length) return;
    r = Math.max(0, Math.min(order.length - 1, r));
    c = Math.max(0, Math.min(2, c));
    const id = order[r].id;
    this.active = { id, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"] [data-c="${c}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-c]");
    const row = btn?.closest<HTMLElement>("[data-row]");
    if (!btn || !row || e.altKey || e.metaKey || e.ctrlKey) return;
    const r = this.order.findIndex((s) => s.id === row.dataset.row);
    const c = Number(btn.dataset.c);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: [0, c],
      End: [this.order.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  /* ---------- Rendering ---------- */

  private renderRow(s: SessionItem) {
    const tab = (c: number) => (this.active.id === s.id && this.active.c === c ? 0 : -1);
    const updated = toMs(s.updated);
    const meta = [s.detail, updated !== undefined ? this.ago(updated) : ""].filter(Boolean).join(" · ");
    const isSelected = s.id === this.selected;
    return html`<li class="ui-sesl__row" data-row=${s.id} data-status=${s.status} ?data-selected=${isSelected}>
      <button type="button" class="ui-sesl__open" data-c="0" tabindex=${tab(0)} aria-current=${ifDefined(isSelected ? "true" : undefined)} @click=${() => this.select(s)}>
        <span class="ui-sesl__mark">${lucide(14, STATUS_MARK[s.status])}</span>
        <span class="ui-sesl__text">
          <span class="ui-sesl__line">
            <span class="ui-sesl__title" title=${s.title}>${s.title}</span>
            ${s.unread ? html`<span class="ui-sesl__unread" aria-hidden="true"></span>` : nothing}
          </span>
          ${s.branch || meta
            ? html`<span class="ui-sesl__meta">
                ${s.branch ? html`<span class="ui-sesl__branch" title=${s.branch}>${s.branch}</span>` : nothing}
                ${meta ? html`<span class="ui-sesl__detail">${meta}</span>` : nothing}
              </span>`
            : nothing}
          <span class="tc-sr-only">, ${this.word(s.status)}${s.unread ? `, ${this.word("unread")}` : ""}</span>
        </span>
      </button>
      <span class="ui-sesl__tools">
        <button type="button" class="ui-sesl__tool" data-c="1" tabindex=${tab(1)} aria-pressed=${s.pinned ? "true" : "false"} title=${s.pinned ? this.word("unpin") : this.word("pin")} @click=${() => this.pin(s)}>
          ${lucide(14, pinIcon)}<span class="tc-sr-only">${s.pinned ? this.word("unpin") : this.word("pin")} ${s.title}</span>
        </button>
        <button type="button" class="ui-sesl__tool" data-c="2" tabindex=${tab(2)} title=${this.word("archive")} @click=${() => this.archive(s)}>
          ${lucide(14, archiveIcon)}<span class="tc-sr-only">${this.word("archive")} ${s.title}</span>
        </button>
      </span>
    </li>`;
  }

  protected override render() {
    const groups = this.groups;
    const actions = html`<div class="ui-sesl__actions">
      ${this.actions.map(
        (a) => html`<button type="button" class="ui-sesl__action" title=${a.label} aria-label=${a.label} @click=${() => this.emit<SessionListAction>("tc-action", { id: a.id })}>${glyph(a.icon)}</button>`,
      )}
      ${this.hideCreate ? nothing : html`<button type="button" class="tc-btn-sm ui-sesl__create" @click=${() => this.emit("tc-create", {})}>${lucide(14, plusIcon)}${this.word("create")}</button>`}
    </div>`;
    const hasAside = this.actions.length || !this.hideCreate;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside: hasAside ? actions : undefined }) : nothing}
      <div class="ui-sesl__card">
        ${!this.heading && hasAside ? html`<div class="ui-sesl__bar">${actions}</div>` : nothing}
        ${this.hideFilter || !this.sessions.length
          ? nothing
          : html`<div class="ui-sesl__search">
              <input
                class="ui-sesl__filter"
                type="search"
                aria-label=${this.word("filter")}
                placeholder=${this.word("filter")}
                autocomplete="off"
                .value=${live(this.query)}
                @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value, e.target as HTMLInputElement)}
              />
            </div>`}
        ${groups.length
          ? html`<div class="ui-sesl__scroll" style=${ifDefined(this.maxHeight ? `max-height: ${this.maxHeight}` : undefined)} @keydown=${this.onKey}>
              ${repeat(
                groups,
                (g) => g.key,
                (g) => html`<div class="ui-sesl__group">
                  ${g.label ? html`<h4 class="ui-sesl__group-head" id=${`${this.uid}-${g.key}`}>${g.label}</h4>` : nothing}
                  <ul class="ui-sesl__list" aria-label=${g.label || this.heading || "Sessions"}>${repeat(g.items, (s) => s.id, (s) => this.renderRow(s))}</ul>
                </div>`,
              )}
            </div>`
          : html`<p class="ui-sesl__empty">${this.sessions.length ? this.word("noMatch") : this.word("empty")}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sesl"] {
  position: relative;
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
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sesl"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="sesl"] { --tc-sesl-dot: 7px; }
[data-ui="sesl"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="sesl"] *, [data-ui="sesl"] *::before, [data-ui="sesl"] *::after { box-sizing: border-box; }
:where([data-ui="sesl"] button:not(.tc-btn-sm)) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="sesl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="sesl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="sesl"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sesl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="sesl"][bare] .ui-sesl__card { border-radius: 0; background: none; box-shadow: none; }
.ui-sesl__actions { display: flex; align-items: center; gap: var(--tc-space-1); }
.ui-sesl__bar { display: flex; justify-content: flex-end; padding: var(--tc-space-2) var(--tc-space-3) 0; }
.ui-sesl__action { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-sesl__action:hover { background: var(--tc-fill-hover); }
.ui-sesl__action-glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-sesl__search { padding: var(--tc-space-2) var(--tc-space-3); }
.ui-sesl__filter { width: 100%; height: var(--tc-field-h); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); }
.ui-sesl__filter::placeholder { color: var(--tc-text-muted); }
.ui-sesl__filter:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-sesl__scroll { overflow-y: auto; padding: 0 var(--tc-space-1) var(--tc-space-2); }
.ui-sesl__search + .ui-sesl__scroll, .ui-sesl__bar + .ui-sesl__scroll { padding-top: 0; }
.ui-sesl__scroll:first-child { padding-top: var(--tc-space-1); }
.ui-sesl__group-head { margin: 0; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-sesl__row { position: relative; display: flex; align-items: center; border-radius: var(--tc-radius-md); }
.ui-sesl__row:hover { background: var(--tc-fill-hover); }
.ui-sesl__row[data-selected] { background: var(--tc-fill-selected); }
.ui-sesl__open { flex: 1 1 0; display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); text-align: left; }
.ui-sesl__mark { flex: none; padding-top: var(--tc-space-0-5); color: var(--tc-icon-muted); }
.ui-sesl__text { flex: 1 1 0; display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-sesl__line { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-sesl__title { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-sesl__line:has(.ui-sesl__unread) .ui-sesl__title { font-weight: var(--tc-font-weight-medium); }
.ui-sesl__unread { flex: none; width: var(--tc-sesl-dot); height: var(--tc-sesl-dot); border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-sesl__meta { display: flex; gap: var(--tc-space-1-5); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); white-space: nowrap; }
.ui-sesl__branch { flex: 0 1 auto; min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); text-overflow: ellipsis; }
.ui-sesl__row[data-selected] .ui-sesl__meta { color: var(--tc-text-secondary); }
.ui-sesl__detail { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-sesl__tools { display: flex; flex: none; padding-right: var(--tc-space-1); opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sesl__row:hover .ui-sesl__tools, .ui-sesl__row:focus-within .ui-sesl__tools, .ui-sesl__row[data-selected] .ui-sesl__tools { opacity: 1; }
.ui-sesl__tool { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-sesl__tool:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-sesl__tool[aria-pressed="true"] { color: var(--tc-accent-text); }
/* Every status has its own mark and a word; waiting is the one that needs you, so it takes the accent */
[data-status="waiting"] .ui-sesl__mark { color: var(--tc-accent-text); }
[data-status="running"] .ui-sesl__mark { color: var(--tc-status-info-fg); }
[data-status="running"] .ui-sesl__mark svg { animation: ui-sesl-spin var(--tc-duration-reveal-slow) linear infinite; }
[data-status="done"] .ui-sesl__mark { color: var(--tc-status-success-fg); }
[data-status="failed"] .ui-sesl__mark { color: var(--tc-status-danger-fg); }
@keyframes ui-sesl-spin { to { transform: rotate(360deg); } }
.ui-sesl__empty { margin: 0; padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
@media (hover: none) { .ui-sesl__tools { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  [data-status="running"] .ui-sesl__mark svg { animation: none; }
  .ui-sesl__tools { transition: none; }
}
@media (forced-colors: active) {
  .ui-sesl__mark { color: CanvasText; }
  .ui-sesl__unread { background: CanvasText; }
  .ui-sesl__row[data-selected] { outline: 1px solid Highlight; }
}
`;
}

if (!customElements.get("tc-session-list")) customElements.define("tc-session-list", TcSessionList);
declare global {
  interface HTMLElementTagNameMap {
    "tc-session-list": TcSessionList;
  }
}
