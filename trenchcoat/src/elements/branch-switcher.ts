import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { PopoverController } from "./internal/popover";
import { formatDate } from "./internal/util";

/*
 * <tc-branch-switcher> – which branch or worktree a session works on, and a way to pick or make another. The trigger
 * shows the current branch and how far it is ahead of and behind its base (↑2 ↓5); it opens a list with a filter, in
 * sections for worktrees, local and remote branches. Each row has the name, ahead and behind, when it last changed and a
 * dot when it has uncommitted work. Typing a name that isn't there offers to create it from the base.
 *   · the filter is a combobox: ↑ / ↓ move through the rows, Enter picks, Escape closes and returns focus to the trigger
 *   · `inline` draws the list in place, without the trigger, for a panel that has room
 *   · Sync is an event: the page pulls and pushes, then passes new counts
 *   · times are relative to `now`, or to the element's own clock, refreshed every minute
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-branch-switcher current="feature/booking-calendar" base="main"
 *     .branches=${[{ name: "main", kind: "local" }, { name: "feature/booking-calendar", kind: "local", ahead: 2 }]}></tc-branch-switcher>
 */

export type BranchKind = "local" | "remote" | "worktree";
export type BranchItem = {
  name: string;
  kind: BranchKind;
  /** Commits it has that the base doesn't */
  ahead?: number;
  /** Commits the base has that it doesn't */
  behind?: number;
  /** When its last commit was made: epoch ms or an ISO string */
  updated?: number | string;
  /** It has uncommitted changes */
  dirty?: boolean;
  /** A worktree's folder */
  path?: string;
};
export type BranchSwitcherLabels = Record<BranchKind, string> & {
  filter: string;
  create: string;
  sync: string;
  empty: string;
  noMatch: string;
  current: string;
  dirty: string;
  change: string;
  ahead: string;
  behind: string;
  aheadOf: string;
};

/** Details of the events */
export type BranchCurrentChange = { current: string; branch: BranchItem };
export type BranchQueryChange = { query: string };
export type BranchOpenChange = { open: boolean };
export type BranchCreate = { name: string; from: string };
export type BranchSync = { branch: string; ahead: number; behind: number };

/** The words used when the page gives none. `create` takes {name} and {base}; `ahead` and `behind` take {count};
 * `aheadOf` joins them to the base as {counts} and {base} */
export const defaultBranchSwitcherLabels: BranchSwitcherLabels = {
  worktree: "Worktrees",
  local: "Local",
  remote: "Remote",
  filter: "Find or create a branch",
  create: "Create branch “{name}” from {base}",
  sync: "Sync",
  empty: "No branches",
  noMatch: "No branches match",
  current: "current",
  dirty: "uncommitted changes",
  change: "Change branch",
  ahead: "{count} ahead",
  behind: "{count} behind",
  aheadOf: "{counts} of {base}",
};

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const branchIcon = svg`<path d="M6 3v12"></path><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path>`;
const KIND_ICON: Record<BranchKind, ReturnType<typeof svg>> = {
  local: branchIcon,
  remote: svg`<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>`,
  worktree: svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>`,
};
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;
const chevron = svg`<path d="m6 9 6 6 6-6"></path>`;
const plusIcon = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const syncIcon = svg`<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path>`;

const MIN = 60_000;
const KINDS: BranchKind[] = ["worktree", "local", "remote"];
let uidCount = 0;

const toMs = (v: number | string | undefined) => {
  if (v === undefined || v === "") return undefined;
  const ms = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(ms) ? ms : undefined;
};
/** A typed name as a branch name git accepts (`git check-ref-format --branch`): spaces become dashes, and what git refuses is dropped */
export function toBranchName(text: string) {
  let name = text.trim().replace(/\s+/g, "-").replace(/[\u0000-\u001f\u007f~^:?*[\\\]]/g, "");
  // Dropping one thing can make another ("a.~.b" → "a..b"), so go round until nothing changes
  for (let before = ""; before !== name; ) {
    before = name;
    name = name
      .replace(/\.\.|@\{/g, "")
      .split("/")
      // No empty parts ("a//b"), none starting with a dot, none ending in ".lock"
      .map((part) => part.replace(/^\.+/, "").replace(/\.lock$/, ""))
      .filter(Boolean)
      .join("/")
      .replace(/^-+|\.+$/g, "");
  }
  return name === "@" ? "" : name;
}
/** Fills "{name}" placeholders from `values` in one pass; text inside the values is left as it is */
const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (all, key: string) => (Object.hasOwn(values, key) ? values[key] : all));

type Row = { type: "branch"; branch: BranchItem; id: string } | { type: "create"; name: string; id: string };

/**
 * The current branch with ahead and behind counts, and a filterable list of worktrees, local and remote branches to switch to or create from.
 * @tag tc-branch-switcher
 * @fires tc-current-change - A branch was picked ({ current, branch }: BranchCurrentChange); cancelable – prevented, `current` stays as it was
 * @fires tc-query-change - The filter changed ({ query }: BranchQueryChange); cancelable – prevented, the filter keeps its text
 * @fires tc-open-change - The list opened or closed ({ open }: BranchOpenChange); cancelable when opening – prevented, it stays shut
 * @fires tc-create - Create branch was picked ({ name, from }: BranchCreate)
 * @fires tc-sync - Sync was pressed ({ branch, ahead, behind }: BranchSync)
 */
export class TcBranchSwitcher extends TcElement {
  static override ui = "brsw";

  /** The heading; empty draws no header */
  @property() accessor heading = "Branch";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** Every branch and worktree */
  @property({ attribute: false }) accessor branches: BranchItem[] = [];
  /** The branch in use. Changed by picking one unless a tc-current-change listener calls preventDefault() */
  @property() accessor current = "";
  /** The branch that ahead and behind count against, and new branches start from */
  @property() accessor base = "main";
  /** What the filter holds. Changed by typing unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** The list is open. Changed by the trigger, Escape and picking unless a tc-open-change listener prevents opening */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Draws the list in place, without the trigger */
  @property({ type: Boolean, reflect: true }) accessor inline = false;
  /** Something is under way: picking and Sync wait */
  @property({ type: Boolean, reflect: true }) accessor busy = false;
  /** Offers Sync beside the trigger */
  @property({ type: Boolean }) accessor syncable = true;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<BranchSwitcherLabels> = {};
  /** The time now, epoch ms; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  @state() private accessor clock = 0;
  @state() private accessor activeId = "";
  @state() private accessor announce = "";
  private timer = 0;
  private uid = `tc-brsw-${++uidCount}`;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-brsw__pop"),
    anchor: () => this.querySelector<HTMLElement>(".ui-brsw__trigger"),
    side: "bottom",
    align: "start",
    kind: "dialog",
    returnFocus: () => this.querySelector<HTMLElement>(".ui-brsw__trigger"),
    initialFocus: () => this.querySelector<HTMLElement>(".ui-brsw__filter"),
    onClose: () => {
      if (!this.open) return;
      this.open = false;
      this.emit<BranchOpenChange>("tc-open-change", { open: false });
    },
  });

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
    // Forget ids for branches that are gone, so a long session doesn't keep every name it ever saw
    if (changed.has("branches")) {
      const ids = new Set(["create", ...this.branches.map((b) => `${b.kind}:${b.name}`)]);
      for (const id of this.optionIds.keys()) if (!ids.has(id)) this.optionIds.delete(id);
    }
    const rows = this.rows;
    if (!rows.some((r) => r.id === this.activeId)) this.activeId = rows.find((r) => r.type === "branch" && r.branch.name === this.current)?.id ?? rows[0]?.id ?? "";
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.inline) {
      if (this.pop.open) this.pop.close("api");
      return;
    }
    if (this.open && !this.pop.open) {
      this.pop.show();
      void this.updateComplete.then(() => this.pop.focusFirst());
    } else if (!this.open && this.pop.open) this.pop.close("api");
  }

  /* ---------- The model ---------- */

  private word<K extends keyof BranchSwitcherLabels>(key: K) {
    return this.labels[key] ?? defaultBranchSwitcherLabels[key];
  }
  private get currentBranch() {
    return this.branches.find((b) => b.name === this.current);
  }
  private passes(b: BranchItem) {
    const q = this.query.trim().toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || !!b.path?.toLowerCase().includes(q);
  }
  /** The name Create would make, or "" when there's nothing new to make */
  private get newName() {
    const name = toBranchName(this.query);
    // A remote branch counts under its local name: "origin/fix" is there already when "fix" is typed; "feature/fix" isn't
    return name && !this.branches.some((b) => b.name === name || (b.kind === "remote" && b.name.replace(/^[^/]+\//, "") === name)) ? name : "";
  }
  private get sections() {
    return KINDS.map((kind) => ({ kind, items: this.branches.filter((b) => b.kind === kind && this.passes(b)) })).filter((s) => s.items.length);
  }
  /** The rows in order, as the arrow keys meet them */
  private get rows(): Row[] {
    const rows: Row[] = this.sections.flatMap((s) => s.items.map((b): Row => ({ type: "branch", branch: b, id: `${s.kind}:${b.name}` })));
    if (this.newName) rows.push({ type: "create", name: this.newName, id: "create" });
    return rows;
  }
  private readonly optionIds = new Map<string, string>();
  /** Counts up for good: ids are dropped from the map, so its size could hand out one that's in use */
  private optionCount = 0;
  private optionId(id: string) {
    let option = this.optionIds.get(id);
    if (!option) {
      option = `${this.uid}-o-${this.optionCount++}`;
      this.optionIds.set(id, option);
    }
    return option;
  }
  private ago(ms: number) {
    const time = this.now ?? this.clock;
    const diff = Math.max(0, time - ms);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" });
    if (diff < MIN) return rtf.format(0, "second");
    if (diff < 60 * MIN) return rtf.format(-Math.floor(diff / MIN), "minute");
    if (diff < 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (60 * MIN)), "hour");
    if (diff < 7 * 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (24 * 60 * MIN)), "day");
    // Older than a week: a date, with the year when it isn't this year's
    const sameYear = new Date(ms).getFullYear() === new Date(time).getFullYear();
    return formatDate(ms, this.locale, sameYear ? { month: "short", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" });
  }
  /** "2 ahead, 5 behind main" for screen readers */
  private aheadWords(b: BranchItem) {
    const parts = [];
    const count = (n: number) => new Intl.NumberFormat(this.locale).format(n);
    if (b.ahead) parts.push(fill(this.word("ahead"), { count: count(b.ahead) }));
    if (b.behind) parts.push(fill(this.word("behind"), { count: count(b.behind) }));
    return parts.length ? fill(this.word("aheadOf"), { counts: parts.join(", "), base: this.base }) : "";
  }

  /* ---------- Acting ---------- */

  private setOpen(open: boolean) {
    if (open === this.open) return;
    if (open && !this.emit<BranchOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    if (!open) this.emit<BranchOpenChange>("tc-open-change", { open });
    this.open = open;
  }
  private setQuery(query: string, input?: HTMLInputElement) {
    if (!this.emit<BranchQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      if (input) input.value = this.query;
      return;
    }
    this.query = query;
  }
  private choose(row: Row) {
    if (this.busy) return;
    if (row.type === "create") {
      this.emit<BranchCreate>("tc-create", { name: row.name, from: this.base });
      this.announce = `Creating ${row.name}`;
    } else {
      if (row.branch.name !== this.current) {
        if (!this.emit<BranchCurrentChange>("tc-current-change", { current: row.branch.name, branch: row.branch }, { cancelable: true })) return;
        this.current = row.branch.name;
      }
      this.announce = `On ${row.branch.name}`;
    }
    if (this.query) this.setQuery("");
    if (!this.inline) this.setOpen(false);
  }
  private sync() {
    const b = this.currentBranch;
    this.emit<BranchSync>("tc-sync", { branch: this.current, ahead: b?.ahead ?? 0, behind: b?.behind ?? 0 });
    this.announce = `Syncing ${this.current}`;
  }

  private onFilterKey = (e: KeyboardEvent) => {
    const rows = this.rows;
    const i = rows.findIndex((r) => r.id === this.activeId);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!rows.length) return;
      const next = e.key === "ArrowDown" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
      this.activeId = rows[next].id;
      void this.updateComplete.then(() => this.querySelector(`#${this.optionId(this.activeId)}`)?.scrollIntoView({ block: "nearest" }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[i];
      if (row) this.choose(row);
    } else if (e.key === "Escape" && this.inline && this.query) {
      e.preventDefault();
      this.setQuery("");
    }
  };

  /* ---------- Rendering ---------- */

  private renderCounts(b: BranchItem | undefined) {
    if (!b || (!b.ahead && !b.behind)) return nothing;
    return html`<span class="ui-brsw__counts" aria-hidden="true"
      >${b.ahead ? html`<span class="ui-brsw__ahead">↑${b.ahead}</span>` : nothing}${b.behind ? html`<span class="ui-brsw__behind">↓${b.behind}</span>` : nothing}</span
    >`;
  }

  private renderOption(row: Row) {
    const id = this.optionId(row.id);
    const active = row.id === this.activeId;
    if (row.type === "create")
      return html`<div id=${id} class="ui-brsw__option ui-brsw__create" role="option" aria-selected="false" ?data-active=${active} @click=${() => this.choose(row)}>
        <span class="ui-brsw__check">${lucide(14, plusIcon)}</span>
        <span class="ui-brsw__text"><span class="ui-brsw__name">${fill(this.word("create"), { name: row.name, base: this.base })}</span></span>
      </div>`;
    const b = row.branch;
    const isCurrent = b.name === this.current;
    const updated = toMs(b.updated);
    const extra = [this.aheadWords(b), b.dirty ? this.word("dirty") : "", isCurrent ? this.word("current") : ""].filter(Boolean).join(", ");
    return html`<div id=${id} class="ui-brsw__option" role="option" aria-selected=${isCurrent ? "true" : "false"} ?data-active=${active} data-kind=${b.kind} data-name=${b.name} @click=${() => this.choose(row)}>
      <span class="ui-brsw__check">${isCurrent ? lucide(14, checkIcon) : nothing}</span>
      <span class="ui-brsw__text">
        <span class="ui-brsw__line">
          <span class="ui-brsw__name" title=${b.name}>${b.name}</span>
          ${b.dirty ? html`<span class="ui-brsw__dirty" aria-hidden="true"></span>` : nothing}
          ${extra ? html`<span class="tc-sr-only">, ${extra}</span>` : nothing}
        </span>
        ${b.path || updated !== undefined
          ? html`<span class="ui-brsw__meta">${[b.path, updated !== undefined ? this.ago(updated) : ""].filter(Boolean).join(" · ")}</span>`
          : nothing}
      </span>
      ${this.renderCounts(b)}
    </div>`;
  }

  private renderList() {
    const listId = `${this.uid}-list`;
    const sections = this.sections;
    const create = this.newName;
    const activeDesc = this.rows.some((r) => r.id === this.activeId) ? this.optionId(this.activeId) : undefined;
    return html`<div class="ui-brsw__panel">
      <div class="ui-brsw__search">
        <input
          class="ui-brsw__filter"
          type="text"
          role="combobox"
          aria-label=${this.word("filter")}
          placeholder=${this.word("filter")}
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls=${listId}
          aria-activedescendant=${ifDefined(activeDesc)}
          autocomplete="off"
          spellcheck="false"
          .value=${live(this.query)}
          ?disabled=${this.busy}
          @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value, e.target as HTMLInputElement)}
          @keydown=${this.onFilterKey}
        />
      </div>
      <div class="ui-brsw__list" id=${listId} role="listbox" aria-label=${this.word("change")}>
        ${sections.map(
          (s) => html`<div class="ui-brsw__group" role="group" aria-labelledby=${`${this.uid}-g-${s.kind}`}>
            <div class="ui-brsw__group-head" id=${`${this.uid}-g-${s.kind}`} role="presentation">${lucide(12, KIND_ICON[s.kind])}${this.word(s.kind)}</div>
            ${s.items.map((b) => this.renderOption({ type: "branch", branch: b, id: `${s.kind}:${b.name}` }))}
          </div>`,
        )}
        ${create ? this.renderOption({ type: "create", name: create, id: "create" }) : nothing}
      </div>
      ${!sections.length && !create ? html`<p class="ui-brsw__empty">${this.branches.length ? this.word("noMatch") : this.word("empty")}</p>` : nothing}
    </div>`;
  }

  protected override render() {
    const b = this.currentBranch;
    const counts = b ? this.aheadWords(b) : "";
    const trigger = this.inline
      ? nothing
      : html`<div class="ui-brsw__bar">
          <button
            type="button"
            class="ui-brsw__trigger"
            aria-haspopup="dialog"
            aria-expanded=${this.open ? "true" : "false"}
            @click=${() => this.setOpen(!this.open)}
          >
            <span class="ui-brsw__trigger-icon">${lucide(14, KIND_ICON[b?.kind ?? "local"])}</span>
            <span class="ui-brsw__current" title=${this.current}>${this.current || this.word("change")}</span>
            ${b?.dirty ? html`<span class="ui-brsw__dirty" aria-hidden="true"></span>` : nothing}
            ${this.renderCounts(b)}
            <span class="tc-sr-only">${[counts, b?.dirty ? this.word("dirty") : ""].filter(Boolean).map((t) => `, ${t}`).join("")}, ${this.word("change")}</span>
            <span class="ui-brsw__chevron">${lucide(14, chevron)}</span>
          </button>
          ${this.syncable
            ? html`<button type="button" class="tc-btn-sm ui-brsw__sync" ?disabled=${this.busy || !this.current} @click=${() => this.sync()}>${lucide(14, syncIcon)}${this.word("sync")}</button>`
            : nothing}
        </div>`;
    return html`${this.heading ? cardHead({ icon: branchIcon, title: this.heading, subtitle: this.description }) : nothing}
      <div class="ui-brsw__card" aria-busy=${this.busy ? "true" : "false"}>
        ${trigger}
        ${this.inline ? this.renderList() : nothing}
      </div>
      ${!this.inline && this.pop.open ? html`<div class="tc-pop ui-brsw__pop" role="dialog" aria-label=${this.word("change")}>${this.renderList()}</div>` : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="brsw"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="brsw"] {
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
[data-ui="brsw"] { --tc-brsw-list-h: 18rem; --tc-brsw-pop-w: 20rem; --tc-brsw-dot: 6px; }
[data-ui="brsw"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="brsw"] *, [data-ui="brsw"] *::before, [data-ui="brsw"] *::after { box-sizing: border-box; }
:where([data-ui="brsw"] button:not(.tc-btn-sm)) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="brsw"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="brsw"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="brsw"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-brsw__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="brsw"][bare] .ui-brsw__card { border-radius: 0; background: none; box-shadow: none; }
.ui-brsw__bar { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); }
.ui-brsw__trigger { flex: 1 1 0; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); text-align: left; }
.ui-brsw__trigger:hover, .ui-brsw__trigger[aria-expanded="true"] { background: var(--tc-fill-hover); }
.ui-brsw__trigger-icon, .ui-brsw__chevron { color: var(--tc-icon-muted); }
.ui-brsw__current { flex: 0 1 auto; min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-brsw__chevron { margin-left: auto; }
.ui-brsw__counts { display: inline-flex; flex: none; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-brsw__ahead { color: var(--tc-status-success-fg); }
.ui-brsw__behind { color: var(--tc-status-warning-fg); }
.ui-brsw__dirty { flex: none; width: var(--tc-brsw-dot); height: var(--tc-brsw-dot); border-radius: var(--tc-radius-full); background: var(--tc-status-warning-fg); }
.ui-brsw__pop { width: var(--tc-brsw-pop-w); padding: 0; }
.ui-brsw__panel { display: grid; }
.ui-brsw__search { padding: var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-brsw__filter { width: 100%; height: var(--tc-field-h); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); }
.ui-brsw__filter::placeholder { color: var(--tc-text-muted); }
.ui-brsw__filter:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-brsw__list { max-height: var(--tc-brsw-list-h); overflow-y: auto; padding: var(--tc-space-1); }
.ui-brsw__group-head { display: flex; align-items: center; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-brsw__option { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); cursor: pointer; }
.ui-brsw__option:hover { background: var(--tc-fill-hover); }
.ui-brsw__option[data-active] { background: var(--tc-menu-item-hover); }
.ui-brsw__check { display: grid; flex: none; place-items: center; width: var(--tc-space-4); color: var(--tc-accent-text); }
.ui-brsw__text { flex: 1 1 0; display: grid; min-width: 0; }
.ui-brsw__line { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-brsw__name { min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); text-overflow: ellipsis; white-space: nowrap; }
.ui-brsw__create .ui-brsw__name { font-family: inherit; white-space: normal; overflow-wrap: anywhere; }
.ui-brsw__meta { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-brsw__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
@media (forced-colors: active) {
  .ui-brsw__dirty { background: CanvasText; }
  .ui-brsw__option[data-active] { outline: 1px solid Highlight; }
}
`;
}

if (!customElements.get("tc-branch-switcher")) customElements.define("tc-branch-switcher", TcBranchSwitcher);
declare global {
  interface HTMLElementTagNameMap {
    "tc-branch-switcher": TcBranchSwitcher;
  }
}
