import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-check-status> – the automated checks on a change, from any system that runs them. The summary says how it went in
 * words ("5 of 11 passed, 1 failed"), and each check is a row with a mark and a word, the failing ones first, then
 * pending, passing and skipped. Skipped checks aren't in the total.
 *   · `compact` draws only a mark and "5/11" inline, for a row in a list; the words are there for screen readers. The
 *     mark shows failing over pending over passing
 *   · `counts` takes totals when there are no details; `checks` wins when both are given
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows, ← / → to a failing row's Re-run
 *   · `bare` drops the tray and card, for a place that already has one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-check-status .checks=${[{ id: "unit", name: "Unit tests", state: "failing" }]} retryable></tc-check-status>
 *   <tc-check-status compact .counts=${{ passing: 5, failing: 1, pending: 5, skipped: 0 }}></tc-check-status>
 */

export type CheckState = "passing" | "failing" | "pending" | "skipped";
export type CheckItem = {
  id: string;
  name: string;
  state: CheckState;
  /** One quiet line, such as what failed */
  detail?: string;
  /** How long it took, in ms */
  durationMs?: number;
};
export type CheckCounts = { passing: number; failing: number; pending: number; skipped: number };
export type CheckStatusLabels = Record<CheckState, string>;

/** Details of the events */
export type CheckOpen = { id: string; check: CheckItem };
export type CheckRetry = { id: string; check: CheckItem };

/** The words used when the page gives none */
export const defaultCheckStatusLabels: CheckStatusLabels = { passing: "Passed", failing: "Failed", pending: "Pending", skipped: "Skipped" };

const ORDER: CheckState[] = ["failing", "pending", "passing", "skipped"];

/** How many checks are in each state */
export function countChecks(checks: readonly CheckItem[]): CheckCounts {
  const counts: CheckCounts = { passing: 0, failing: 0, pending: 0, skipped: 0 };
  for (const c of checks) counts[c.state]++;
  return counts;
}

/** The state that speaks for the whole set: failing over pending over passing, and null when nothing has run */
export function overallCheckState(counts: CheckCounts): CheckState | null {
  if (counts.failing) return "failing";
  if (counts.pending) return "pending";
  if (counts.passing) return "passing";
  return counts.skipped ? "skipped" : null;
}

/* Marks and the header's icon: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<CheckState, ReturnType<typeof svg>> = {
  passing: svg`<path d="M20 6 9 17l-5-5"></path>`,
  failing: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  pending: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
  skipped: svg`<path d="M5 12h14"></path>`,
};
const NO_CHECKS = svg`<circle cx="12" cy="12" r="10"></circle>`;
const headIcon = svg`<path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>`;

let uidCount = 0;

function duration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * The automated checks on a change: a summary in words and a row for each, failing first, or just a mark and "5/11" for a list row.
 * @tag tc-check-status
 * @fires tc-open - A check's row was pressed ({ id, check }: CheckOpen)
 * @fires tc-retry - Re-run was pressed on a failing check ({ id, check }: CheckRetry)
 */
export class TcCheckStatus extends TcElement {
  static override ui = "cks";

  /** The heading */
  @property() accessor heading = "Checks";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The checks. Wins over `counts` */
  @property({ attribute: false }) accessor checks: CheckItem[] | undefined = undefined;
  /** Totals, when there are no details */
  @property({ attribute: false }) accessor counts: CheckCounts | undefined = undefined;
  /** Just a mark and "5/11", to sit inline in a list row */
  @property({ type: Boolean, reflect: true }) accessor compact = false;
  /** Offers Re-run on failing checks */
  @property({ type: Boolean }) accessor retryable = false;
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;
  /** Rename any state's word, over the defaults */
  @property({ attribute: false }) accessor statusLabels: Partial<CheckStatusLabels> = {};

  /** The tab stop: a row and a button in it (0 the row, 1 Re-run) */
  @state() private accessor active = { r: 0, c: 0 };
  @state() private accessor announce = "";

  private uid = `tc-cks-${++uidCount}`;

  private word(state: CheckState) {
    return this.statusLabels[state] ?? defaultCheckStatusLabels[state];
  }
  private get sorted() {
    return ORDER.flatMap((state) => (this.checks ?? []).filter((c) => c.state === state));
  }
  private get totals(): CheckCounts {
    return this.checks ? countChecks(this.checks) : (this.counts ?? { passing: 0, failing: 0, pending: 0, skipped: 0 });
  }

  /** "5 of 11 passed, 1 failed, 5 pending, 2 skipped" */
  private summary(c: CheckCounts) {
    const total = c.passing + c.failing + c.pending;
    const parts = total ? [`${c.passing} of ${total} ${this.word("passing").toLowerCase()}`] : [];
    if (c.failing) parts.push(`${c.failing} ${this.word("failing").toLowerCase()}`);
    if (c.pending) parts.push(`${c.pending} ${this.word("pending").toLowerCase()}`);
    if (c.skipped) parts.push(`${c.skipped} ${this.word("skipped").toLowerCase()}`);
    return parts.join(", ") || "No checks";
  }

  private canRetry(check?: CheckItem) {
    return this.retryable && check?.state === "failing";
  }
  private retry(check: CheckItem) {
    this.emit<CheckRetry>("tc-retry", { id: check.id, check });
    this.announce = `Re-running ${check.name}`;
  }

  private focusAt(r: number, c: number) {
    const rows = this.sorted;
    if (!rows.length) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    if (c === 1 && !this.canRetry(rows[r])) c = 0;
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
      End: [this.sorted.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a button that exists
    const rows = this.sorted;
    if (rows.length && (this.active.r >= rows.length || (this.active.c === 1 && !this.canRetry(rows[this.active.r])))) {
      this.active = { r: Math.min(this.active.r, rows.length - 1), c: 0 };
    }
  }

  private renderCompact(c: CheckCounts) {
    const overall = overallCheckState(c);
    const total = c.passing + c.failing + c.pending;
    return html`<span class="ui-cks__compact" data-state=${overall ?? "none"}>
      <span class="ui-cks__mark" aria-hidden="true">${lucide(12, overall ? MARK[overall] : NO_CHECKS)}</span>
      <span class="ui-cks__tally" aria-hidden="true">${total ? `${c.passing}/${total}` : "–"}</span>
      <span class="ui-cks__sr">Checks: ${this.summary(c)}</span>
    </span>`;
  }

  private renderRow(check: CheckItem, r: number) {
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    return html`<li class="ui-cks__row" data-id=${check.id} data-state=${check.state}>
      <button type="button" class="ui-cks__open" data-at=${`${r}:0`} tabindex=${tab(0)} @click=${() => this.emit<CheckOpen>("tc-open", { id: check.id, check })}>
        <span class="ui-cks__mark" aria-hidden="true">${lucide(14, MARK[check.state])}</span>
        <span class="ui-cks__text">
          <span class="ui-cks__name">${check.name}</span>
          ${check.detail ? html`<span class="ui-cks__detail">${check.detail}</span>` : nothing}
        </span>
        ${check.durationMs !== undefined ? html`<span class="ui-cks__time">${duration(check.durationMs)}</span>` : nothing}
        <span class="ui-cks__word">${this.word(check.state)}</span>
      </button>
      ${this.canRetry(check)
        ? html`<button type="button" class="ui-cks__retry" data-at=${`${r}:1`} tabindex=${tab(1)} aria-label=${`Re-run ${check.name}`} @click=${() => this.retry(check)}>Re-run</button>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const totals = this.totals;
    if (this.compact) return this.renderCompact(totals);
    const rows = this.sorted;
    const title = `${this.uid}-title`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: title }) : nothing}
      <div class="ui-cks__card">
        <p class="ui-cks__summary" data-state=${overallCheckState(totals) ?? "none"}>${this.summary(totals)}</p>
        ${rows.length
          ? html`<ul class="ui-cks__list" aria-label=${this.heading || "Checks"} @keydown=${this.onKey}>${repeat(rows, (c) => c.id, (c, r) => this.renderRow(c, r))}</ul>`
          : nothing}
      </div>
      <span class="ui-cks__sr" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cks"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cks"] {
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
[data-ui="cks"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="cks"][compact] { display: inline-flex; width: auto; padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="cks"] *, [data-ui="cks"] *::before, [data-ui="cks"] *::after { box-sizing: border-box; }
:where([data-ui="cks"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cks"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="cks"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="cks"] svg { display: block; flex: none; }
.ui-cks__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cks__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="cks"][bare] .ui-cks__card { border-radius: 0; background: none; box-shadow: none; }
.ui-cks__summary { margin: 0; padding: var(--tc-space-3) var(--tc-space-4); color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
.ui-cks__row { display: flex; align-items: stretch; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cks__open { flex: 1 1 0; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-4); text-align: left; }
.ui-cks__open:hover { background: var(--tc-fill-hover); }
.ui-cks__text { flex: 1 1 0; display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cks__name { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-cks__detail, .ui-cks__time { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-cks__time { flex: none; font-variant-numeric: tabular-nums; }
.ui-cks__word { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-cks__retry { flex: none; align-self: center; min-height: var(--tc-control-h-sm); margin-right: var(--tc-space-3); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); }
.ui-cks__retry:hover { background: var(--tc-fill-hover); }
/* Every state has a mark and a word, so colour is never the only cue */
.ui-cks__mark { flex: none; color: var(--tc-text-muted); }
[data-state="passing"] > .ui-cks__open > :is(.ui-cks__mark, .ui-cks__word), .ui-cks__compact[data-state="passing"] > .ui-cks__mark { color: var(--tc-status-success-fg); }
[data-state="failing"] > .ui-cks__open > :is(.ui-cks__mark, .ui-cks__word), .ui-cks__compact[data-state="failing"] > .ui-cks__mark { color: var(--tc-status-danger-fg); }
[data-state="pending"] > .ui-cks__open > :is(.ui-cks__mark, .ui-cks__word), .ui-cks__compact[data-state="pending"] > .ui-cks__mark { color: var(--tc-status-info-fg); }
[data-state="skipped"] > .ui-cks__open > .ui-cks__word { color: var(--tc-text-muted); }
.ui-cks__compact { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-cks__tally { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; white-space: nowrap; }
@media (forced-colors: active) { .ui-cks__mark { color: CanvasText; } }
`;
}

if (!customElements.get("tc-check-status")) customElements.define("tc-check-status", TcCheckStatus);
declare global {
  interface HTMLElementTagNameMap {
    "tc-check-status": TcCheckStatus;
  }
}
