import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { PopoverController } from "./internal/popover";

/*
 * <tc-diff-table> – an AI's proposed edits to a table, reviewed in place. Each edited cell shows the old value struck
 * on a red tint and the new one on a green tint; rows the AI adds or removes are tinted and marked as a whole. People
 * accept or reject one edit, a whole row, or everything, and can undo.
 *   · the cells are a grid with one tab stop: arrows move, Home / End go to a row's ends, Ctrl+Home / Ctrl+End to the
 *     table's; a row's Accept and Reject buttons are the last two stops in it
 *   · on an edited cell, A accepts, R rejects, Enter or Space opens a popover with the reason and both buttons
 *   · `streaming` sweeps the edits in a row at a time, a light passing down the table (all at once with reduced motion)
 *   · `decisions` can be controlled: every change asks first with tc-decisions-change (and tc-edit-change for one edit)
 *   · narrow: the table scrolls sideways under a sticky first column
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-diff-table .columns=${[{ key: "owner", label: "Owner" }]} .rows=${[…]} .edits=${[…]}></tc-diff-table>
 */

export type DiffTableColumn = { key: string; label: string };
export type DiffTableRow = {
  id: string;
  /** The values by column key, as they are now (an added row: as proposed) */
  cells: Record<string, string>;
  /** The AI proposes adding or removing the whole row */
  change?: "added" | "removed";
};
export type DiffTableEdit = {
  id: string;
  /** The row's id */
  row: string;
  /** The column's key */
  column: string;
  from: string;
  to: string;
  /** Why the AI proposes it */
  reason?: string;
};
export type DiffTableVerdict = "accepted" | "rejected";
/** The verdict on each edit by its id, and on each added or removed row as `row:<id>`; a missing key is pending */
export type DiffTableDecisions = Partial<Record<string, DiffTableVerdict>>;
export type DiffTableLabels = {
  pending: string;
  allReviewed: string;
  accept: string;
  reject: string;
  acceptAll: string;
  rejectAll: string;
  undo: string;
  added: string;
  removed: string;
  accepted: string;
  rejected: string;
  was: string;
  now: string;
  review: string;
  empty: string;
  keys: string;
};

/** Details of the events */
export type DiffTableEditChange = { edit: string; decision: DiffTableVerdict };
export type DiffTableDecisionsChange = { decisions: DiffTableDecisions };

/** The words used when the page gives none */
export const defaultDiffTableLabels: DiffTableLabels = {
  pending: "pending",
  allReviewed: "All reviewed",
  accept: "Accept",
  reject: "Reject",
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  undo: "Undo",
  added: "New row",
  removed: "Removed row",
  accepted: "Accepted",
  rejected: "Rejected",
  was: "Was",
  now: "Now",
  review: "Review",
  empty: "No changes proposed",
  keys: "Arrow keys move between cells. On a changed cell, A accepts, R rejects, Enter shows why.",
};

const rowKey = (id: string) => `row:${id}`;
const NO_DECISIONS: DiffTableDecisions = {};
/** How long each row takes to sweep in while streaming */
const SWEEP_MS = 160;

/* The header's icon, and the marks: Lucide (ISC, lucide.dev) */
const headIcon = svg`<path d="M12 3v18"></path><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path>`;
const mark = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-dftb__mark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
const CROSS = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const PLUS = svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`;
const MINUS = svg`<path d="M5 12h14"></path>`;

let uid = 0;

/**
 * An AI's proposed edits to a table, reviewed in place: struck and new values per cell, added and removed rows, and accept, reject and undo per edit, per row or for all.
 * @tag tc-diff-table
 * @fires tc-edit-change - One edit was accepted or rejected ({ edit, decision }: DiffTableEditChange); cancelable – prevented, nothing changes
 * @fires tc-decisions-change - Any decision, row, all or undo, with every verdict ({ decisions }: DiffTableDecisionsChange); cancelable – prevented, `decisions` stays as it was
 */
export class TcDiffTable extends TcElement {
  static override ui = "dftb";

  /** The heading; empty draws no header */
  @property() accessor heading = "Proposed changes";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The columns, in order; the first one names each row */
  @property({ attribute: false }) accessor columns: DiffTableColumn[] = [];
  /** The rows, in order */
  @property({ attribute: false }) accessor rows: DiffTableRow[] = [];
  /** The proposed edits to single cells */
  @property({ attribute: false }) accessor edits: DiffTableEdit[] = [];
  /** The verdicts so far. Changed by the buttons and keys unless a tc-decisions-change listener calls preventDefault() */
  @property({ attribute: false }) accessor decisions: DiffTableDecisions = NO_DECISIONS;
  /** The edits are still arriving: they sweep in a row at a time, and Accept all waits until they're all in */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<DiffTableLabels> = {};

  /** The tab stop: a row and a position in it (the columns, then Accept and Reject) */
  @state() private accessor active = { r: 0, c: 0 };
  /** How many rows have swept in while streaming */
  @state() private accessor revealed = Infinity;
  /** The edit whose popover is open */
  @state() private accessor openEdit: string | null = null;
  /** Earlier verdicts, for Undo */
  @state() private accessor history: DiffTableDecisions[] = [];

  private readonly key = `tc-dftb-${++uid}`;
  private undoing: DiffTableDecisions | null = null;
  private sweepTimer = 0;
  private popAnchor: HTMLElement | null = null;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-dftb__pop"),
    anchor: () => this.popAnchor,
    side: "bottom",
    align: "start",
    kind: "dialog",
    returnFocus: () => this.popAnchor,
    onClose: () => {
      this.openEdit = null;
    },
  });

  private word<K extends keyof DiffTableLabels>(key: K) {
    return this.labels[key] ?? defaultDiffTableLabels[key];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.sweepTimer);
    this.sweepTimer = 0;
  }

  /* ---------- What's decided ---------- */

  private editAt(row: string, column: string) {
    return this.edits.find((e) => e.row === row && e.column === column);
  }
  /** Every decision key in a row: its edits, and the row itself when it's added or removed */
  private keysOf(row: DiffTableRow) {
    const keys = this.edits.filter((e) => e.row === row.id).map((e) => e.id);
    return row.change ? [rowKey(row.id), ...keys] : keys;
  }
  private pendingIn(row: DiffTableRow) {
    return this.keysOf(row).filter((k) => !this.decisions[k]);
  }
  private get allKeys() {
    return this.rows.flatMap((r) => this.keysOf(r));
  }
  private get pendingCount() {
    return this.allKeys.filter((k) => !this.decisions[k]).length;
  }
  /** Every edit has swept in */
  private get arrived() {
    return !this.streaming || this.revealed >= this.rows.length;
  }
  private isRevealed(r: number) {
    return r < this.revealed;
  }

  /** Proposes new verdicts; the page may say no. Returns whether they took */
  private propose(next: DiffTableDecisions, single?: DiffTableEditChange) {
    if (single && !this.emit<DiffTableEditChange>("tc-edit-change", single, { cancelable: true })) return false;
    if (!this.emit<DiffTableDecisionsChange>("tc-decisions-change", { decisions: next }, { cancelable: true })) return false;
    this.decisions = next;
    return true;
  }
  /** One edit, or a row's own add or remove */
  decide(key: string, decision: DiffTableVerdict) {
    if (this.decisions[key] === decision) return;
    this.propose({ ...this.decisions, [key]: decision }, key.startsWith("row:") ? undefined : { edit: key, decision });
  }
  /** Everything still pending in a row */
  decideRow(id: string, decision: DiffTableVerdict) {
    const row = this.rows.find((r) => r.id === id);
    const keys = row ? this.pendingIn(row) : [];
    if (!keys.length) return;
    this.propose({ ...this.decisions, ...Object.fromEntries(keys.map((k) => [k, decision])) });
  }
  /** A row's buttons: focus stays in the row when they go away */
  private rowButton(id: string, r: number, decision: DiffTableVerdict) {
    this.decideRow(id, decision);
    this.focusAt(r, this.columns.length);
  }
  /** Everything still pending – once every edit has arrived */
  decideAll(decision: DiffTableVerdict) {
    const keys = this.allKeys.filter((k) => !this.decisions[k]);
    if (!keys.length || !this.arrived) return;
    this.propose({ ...this.decisions, ...Object.fromEntries(keys.map((k) => [k, decision])) });
  }
  /** Restores the verdicts before the last change */
  undo() {
    const prev = this.history[this.history.length - 1];
    if (!prev) return;
    this.undoing = prev;
    if (!this.propose(prev)) this.undoing = null;
  }

  /* ---------- Streaming ---------- */

  private reduced() {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  private syncSweep() {
    const on = this.isConnected && this.streaming && this.revealed < this.rows.length;
    if (on === !!this.sweepTimer) return;
    window.clearInterval(this.sweepTimer);
    this.sweepTimer = on
      ? window.setInterval(() => {
          this.revealed = Math.min(this.rows.length, this.revealed + 1);
          if (this.revealed >= this.rows.length) this.syncSweep();
        }, SWEEP_MS)
      : 0;
  }

  /* ---------- Keyboard ---------- */

  /** The last position in a row: its last column, or its Reject button while anything in it is pending */
  private lastIn(r: number) {
    const row = this.rows[r];
    return this.columns.length - 1 + (row && this.isRevealed(r) && this.pendingIn(row).length ? 2 : 0);
  }
  private focusAt(r: number, c: number) {
    if (!this.rows.length || !this.columns.length) return;
    r = Math.max(0, Math.min(this.rows.length - 1, r));
    c = Math.max(0, Math.min(this.lastIn(r), c));
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!cell || e.altKey) return;
    const [r, c] = cell.dataset.at!.split(":").map(Number);
    const mod = e.ctrlKey || e.metaKey;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: mod ? [0, 0] : [r, 0],
      End: mod ? [this.rows.length - 1, this.lastIn(this.rows.length - 1)] : [r, this.lastIn(r)],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusAt(move[0], move[1]);
      return;
    }
    const edit = cell.dataset.edit;
    if (!edit || mod) return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "r") {
      e.preventDefault();
      this.decide(edit, k === "a" ? "accepted" : "rejected");
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.openPop(edit, cell);
    }
  };

  /* ---------- The popover ---------- */

  private openPop(id: string, anchor: HTMLElement) {
    if (this.pop.open) this.pop.close("api");
    this.popAnchor = anchor;
    this.openEdit = id;
    this.pop.show({ focus: true });
  }
  private decideFromPop(id: string, decision: DiffTableVerdict) {
    this.decide(id, decision);
    this.pop.close("api");
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("decisions") && this.hasUpdated) {
      const before = changed.get("decisions") as DiffTableDecisions;
      if (this.undoing && this.decisions === this.undoing) this.history = this.history.slice(0, -1);
      else this.history = [...this.history, before];
      this.undoing = null;
    }
    // New data starts the review over: nothing to undo
    if ((changed.has("edits") || changed.has("rows")) && this.hasUpdated) this.history = [];
    if (changed.has("streaming") || (this.streaming && changed.has("rows"))) {
      if (this.streaming && changed.has("streaming")) this.revealed = this.reduced() ? Infinity : 0;
      if (!this.streaming) this.revealed = Infinity;
    }
    const n = this.rows.length;
    if (n && (this.active.r >= n || this.active.c > this.lastIn(Math.min(this.active.r, n - 1)))) {
      const r = Math.min(this.active.r, n - 1);
      this.active = { r, c: Math.min(this.active.c, this.lastIn(r)) };
    }
    if (this.openEdit && !this.edits.some((e) => e.id === this.openEdit)) {
      if (this.pop.open) this.pop.close("api");
      this.openEdit = null;
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.syncSweep();
  }

  /* ---------- Rendering ---------- */

  private renderCell(row: DiffTableRow, r: number, col: DiffTableColumn, c: number) {
    const tab = this.active.r === r && this.active.c === c ? 0 : -1;
    const edit = this.isRevealed(r) ? this.editAt(row.id, col.key) : undefined;
    const value = row.cells[col.key] ?? "";
    const verdict = edit ? this.decisions[edit.id] : undefined;
    const lead =
      c === 0 && row.change
        ? html`<span class="ui-dftb__rowmark" data-change=${row.change}>${mark(row.change === "added" ? PLUS : MINUS)}<span class="ui-dftb__sr">${this.word(row.change)}: </span></span>`
        : nothing;
    let body;
    if (!edit) body = html`<span class="ui-dftb__value">${value}</span>`;
    else if (!verdict)
      body = html`<span class="ui-dftb__chg"
        ><del class="ui-dftb__del"><span class="ui-dftb__sr">${this.word("was")} </span>${edit.from || "–"}</del
        ><ins class="ui-dftb__ins"><span class="ui-dftb__sr">, ${this.word("now")} </span>${edit.to || "–"}</ins
        ><span class="ui-dftb__sr">, ${this.pendingWord()}</span></span
      >`;
    else
      body = html`<span class="ui-dftb__value">${verdict === "accepted" ? edit.to : edit.from}</span>${mark(verdict === "accepted" ? CHECK : CROSS)}<span class="ui-dftb__sr"
          >, ${this.word(verdict)}</span
        >`;
    const attrs = { tab, at: `${r}:${c}` };
    return c === 0
      ? html`<th
          role="rowheader"
          scope="row"
          class="ui-dftb__cell ui-dftb__cell--head"
          data-at=${attrs.at}
          tabindex=${attrs.tab}
          data-edit=${edit?.id ?? nothing}
          data-state=${edit ? (verdict ?? "pending") : nothing}
          @click=${edit ? (e: Event) => this.openPop(edit.id, e.currentTarget as HTMLElement) : nothing}
        >${lead}${body}</th>`
      : html`<td
          role="gridcell"
          class="ui-dftb__cell"
          data-at=${attrs.at}
          tabindex=${attrs.tab}
          data-edit=${edit?.id ?? nothing}
          data-state=${edit ? (verdict ?? "pending") : nothing}
          @click=${edit ? (e: Event) => this.openPop(edit.id, e.currentTarget as HTMLElement) : nothing}
        >${body}</td>`;
  }

  private pendingWord() {
    return this.word("pending");
  }

  private renderReview(row: DiffTableRow, r: number) {
    const keys = this.keysOf(row);
    const pending = this.pendingIn(row);
    const n = this.columns.length;
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    const first = this.columns[0];
    const name = (first && row.cells[first.key]) || row.id;
    let body: unknown = nothing;
    if (!this.isRevealed(r)) body = nothing;
    else if (pending.length)
      body = html`<span class="ui-dftb__actions">
        <button type="button" class="ui-dftb__btn ui-dftb__btn--accept" data-at=${`${r}:${n}`} tabindex=${tab(n)} @click=${() => this.rowButton(row.id, r, "accepted")}>
          ${mark(CHECK)}<span>${this.word("accept")}</span><span class="ui-dftb__sr"> ${name}</span>
        </button>
        <button type="button" class="ui-dftb__btn ui-dftb__btn--reject" data-at=${`${r}:${n + 1}`} tabindex=${tab(n + 1)} @click=${() => this.rowButton(row.id, r, "rejected")}>
          ${mark(CROSS)}<span>${this.word("reject")}</span><span class="ui-dftb__sr"> ${name}</span>
        </button>
      </span>`;
    else if (keys.length) {
      const verdicts = new Set(keys.map((k) => this.decisions[k]));
      body = html`<span class="ui-dftb__verdict">${verdicts.size === 1 ? this.word([...verdicts][0]!) : `${this.word("accepted")} / ${this.word("rejected")}`}</span>`;
    }
    return html`<td role="gridcell" class="ui-dftb__cell ui-dftb__cell--review">${body}</td>`;
  }

  private renderRow(row: DiffTableRow, r: number) {
    const rowVerdict = row.change ? this.decisions[rowKey(row.id)] : undefined;
    return html`<tr
      class="ui-dftb__row"
      data-id=${row.id}
      data-change=${row.change ?? nothing}
      data-row-state=${row.change ? (rowVerdict ?? "pending") : nothing}
      ?data-hidden=${!this.isRevealed(r)}
      ?data-sweep=${this.streaming && r === this.revealed - 1}
    >
      ${this.columns.map((col, c) => this.renderCell(row, r, col, c))}${this.renderReview(row, r)}
    </tr>`;
  }

  private renderPop() {
    const edit = this.edits.find((e) => e.id === this.openEdit);
    if (!edit || !this.pop.open) return nothing;
    const col = this.columns.find((c) => c.key === edit.column);
    const row = this.rows.find((r) => r.id === edit.row);
    const first = this.columns[0];
    const title = `${(first && row?.cells[first.key]) || edit.row} – ${col?.label ?? edit.column}`;
    const titleId = `${this.key}-pop`;
    return html`<div class="tc-pop ui-dftb__pop" role="dialog" aria-labelledby=${titleId}>
      <p class="ui-dftb__pop-title" id=${titleId}>${title}</p>
      <dl class="ui-dftb__pop-values">
        <dt>${this.word("was")}</dt><dd><del class="ui-dftb__del">${edit.from || "–"}</del></dd>
        <dt>${this.word("now")}</dt><dd><ins class="ui-dftb__ins">${edit.to || "–"}</ins></dd>
      </dl>
      ${edit.reason ? html`<p class="ui-dftb__reason">${edit.reason}</p>` : nothing}
      <div class="ui-dftb__pop-actions">
        <button type="button" class="ui-dftb__btn ui-dftb__btn--accept" aria-pressed=${this.decisions[edit.id] === "accepted" ? "true" : "false"} @click=${() => this.decideFromPop(edit.id, "accepted")}>
          ${mark(CHECK)}<span>${this.word("accept")}</span>
        </button>
        <button type="button" class="ui-dftb__btn ui-dftb__btn--reject" aria-pressed=${this.decisions[edit.id] === "rejected" ? "true" : "false"} @click=${() => this.decideFromPop(edit.id, "rejected")}>
          ${mark(CROSS)}<span>${this.word("reject")}</span>
        </button>
      </div>
    </div>`;
  }

  protected override render() {
    const pending = this.pendingCount;
    const any = this.allKeys.length > 0;
    const headId = `${this.key}-head`;
    const aside = any ? html`<span class="ui-dftb__count" data-done=${pending ? nothing : ""}>${pending ? `${pending} ${this.word("pending")}` : this.word("allReviewed")}</span>` : nothing;
    const ready = this.arrived;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: headId, aside }) : nothing}
      <div class="ui-dftb__card">
        ${any
          ? html`<div class="ui-dftb__bar" role="group" aria-label=${this.word("review")}>
              <button type="button" class="ui-dftb__btn ui-dftb__btn--accept" aria-disabled=${pending && ready ? "false" : "true"} @click=${() => this.decideAll("accepted")}>${mark(CHECK)}<span>${this.word("acceptAll")}</span></button>
              <button type="button" class="ui-dftb__btn ui-dftb__btn--reject" aria-disabled=${pending && ready ? "false" : "true"} @click=${() => this.decideAll("rejected")}>${mark(CROSS)}<span>${this.word("rejectAll")}</span></button>
              <button type="button" class="ui-dftb__btn ui-dftb__btn--undo" aria-disabled=${this.history.length ? "false" : "true"} @click=${() => this.undo()}>${this.word("undo")}</button>
            </div>`
          : nothing}
        ${this.rows.length && this.columns.length
          ? html`<div class="ui-dftb__scroll">
              <table class="ui-dftb__table" role="grid" aria-labelledby=${this.heading ? headId : nothing} aria-label=${this.heading ? nothing : this.word("review")} aria-describedby=${`${this.key}-keys`} @keydown=${this.onKey}>
                <thead>
                  <tr>
                    ${this.columns.map((c, i) => html`<th scope="col" role="columnheader" class=${i === 0 ? "ui-dftb__colhead ui-dftb__colhead--first" : "ui-dftb__colhead"}>${c.label}</th>`)}
                    <th scope="col" role="columnheader" class="ui-dftb__colhead"><span class="ui-dftb__sr">${this.word("review")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  ${this.rows.map((row, r) => this.renderRow(row, r))}
                </tbody>
              </table>
            </div>`
          : html`<p class="ui-dftb__empty">${this.word("empty")}</p>`}
        <span class="ui-dftb__sr" id=${`${this.key}-keys`}>${this.word("keys")}</span>
        <span class="ui-dftb__sr" role="status">${any ? (pending ? `${pending} ${this.word("pending")}` : this.word("allReviewed")) : ""}</span>
      </div>
      ${this.renderPop()}`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dftb"] {
  --tc-diff-table-bg: var(--tc-surface-on-tray);
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
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dftb"] {
  --tc-diff-table-bg: var(--tc-surface-raised);
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
[data-ui="dftb"] *, [data-ui="dftb"] *::before, [data-ui="dftb"] *::after { box-sizing: border-box; }
:where([data-ui="dftb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dftb"] :is(button, [data-at]):focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="dftb"] svg { display: inline-block; flex: none; vertical-align: middle; }
.ui-dftb__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dftb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-dftb__count { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-dftb__count[data-done] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-dftb__bar { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-dftb__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-dftb__btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-dftb__btn--accept svg { color: var(--tc-status-success-fg); }
.ui-dftb__btn--reject svg { color: var(--tc-status-danger-fg); }
.ui-dftb__btn[aria-disabled="true"] { color: var(--tc-text-disabled); cursor: default; }
.ui-dftb__btn[aria-disabled="true"]:hover { background: none; color: var(--tc-text-disabled); }
.ui-dftb__btn[aria-disabled="true"] svg { color: inherit; }
.ui-dftb__btn--undo { margin-left: auto; }
.ui-dftb__card { position: relative; }
.ui-dftb__scroll { position: relative; overflow-x: auto; }
.ui-dftb__table { width: 100%; border-collapse: separate; border-spacing: 0; font-variant-numeric: tabular-nums; }
.ui-dftb__colhead { padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-diff-table-bg); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); text-align: left; white-space: nowrap; }
.ui-dftb__cell { height: var(--tc-control-h-md); padding: var(--tc-space-1-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-diff-table-bg); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-regular); text-align: left; vertical-align: middle; white-space: nowrap; }
.ui-dftb__row:last-child > .ui-dftb__cell { border-bottom: 0; }
/* The first column stays put while the rest scrolls */
.ui-dftb__colhead--first, .ui-dftb__cell--head { position: sticky; left: 0; z-index: 1; box-shadow: inset calc(var(--tc-hairline) * -1) 0 0 var(--tc-divider); }
.ui-dftb__cell[data-edit] { cursor: pointer; }
.ui-dftb__cell[data-edit]:hover { background-image: linear-gradient(var(--tc-fill-hover), var(--tc-fill-hover)); }
.ui-dftb__cell--review { width: 1%; padding-block: 0; text-align: right; }
.ui-dftb__actions { display: inline-flex; gap: var(--tc-space-0-5); }
.ui-dftb__verdict { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
/* Edits: the old value struck on a red tint, the new one on a green tint */
.ui-dftb__chg { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1); }
.ui-dftb__del, .ui-dftb__ins { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); text-decoration-thickness: var(--tc-hairline); }
.ui-dftb__del { background: var(--tc-status-danger-bg); color: var(--tc-text-secondary); text-decoration: line-through; }
.ui-dftb__ins { background: var(--tc-status-success-bg); color: var(--tc-text-primary); text-decoration: none; }
.ui-dftb__cell[data-state="accepted"] .ui-dftb__mark { margin-left: var(--tc-space-1); color: var(--tc-status-success-fg); }
.ui-dftb__cell[data-state="rejected"] .ui-dftb__mark { margin-left: var(--tc-space-1); color: var(--tc-text-muted); }
/* Whole rows: added on a green tint with a plus, removed struck on a red one with a minus */
.ui-dftb__rowmark { display: inline-flex; margin-right: var(--tc-space-1-5); }
.ui-dftb__rowmark[data-change="added"] { color: var(--tc-status-success-fg); }
.ui-dftb__rowmark[data-change="removed"] { color: var(--tc-status-danger-fg); }
.ui-dftb__row[data-change="added"][data-row-state="pending"] > .ui-dftb__cell:not(.ui-dftb__cell--review) { background-image: linear-gradient(var(--tc-status-success-bg), var(--tc-status-success-bg)); }
.ui-dftb__row[data-change="removed"][data-row-state="pending"] > .ui-dftb__cell:not(.ui-dftb__cell--review) { background-image: linear-gradient(var(--tc-status-danger-bg), var(--tc-status-danger-bg)); }
.ui-dftb__row:is([data-change="removed"][data-row-state="pending"], [data-change="removed"][data-row-state="accepted"], [data-change="added"][data-row-state="rejected"]) .ui-dftb__value { color: var(--tc-text-secondary); text-decoration: line-through; }
/* Streaming: rows wait, then a light passes as each one arrives */
.ui-dftb__row[data-hidden] .ui-dftb__chg, .ui-dftb__row[data-hidden] .ui-dftb__rowmark { visibility: hidden; }
.ui-dftb__row[data-sweep] > .ui-dftb__cell { animation: ui-dftb-sweep var(--tc-duration-slower) var(--tc-ease-standard); }
@keyframes ui-dftb-sweep {
  from { box-shadow: inset 0 0 0 999px var(--tc-accent-subtle); }
}
.ui-dftb__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* The popover: what changed and why, with both choices */
.ui-dftb__pop { display: grid; gap: var(--tc-space-2); width: 18rem; padding: var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dftb__pop-title { margin: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-dftb__pop-values { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--tc-space-1) var(--tc-space-2); margin: 0; }
.ui-dftb__pop-values dt { color: var(--tc-text-muted); }
.ui-dftb__pop-values dd { margin: 0; overflow-wrap: anywhere; }
.ui-dftb__reason { margin: 0; color: var(--tc-text-secondary); }
.ui-dftb__pop-actions { display: flex; gap: var(--tc-space-1); }
.ui-dftb__pop .ui-dftb__btn[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
@container (max-width: 28rem) {
  .ui-dftb__btn--undo { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-dftb__row[data-sweep] > .ui-dftb__cell { animation: none; }
}
@media (forced-colors: active) {
  .ui-dftb__del, .ui-dftb__ins { border: 1px solid CanvasText; }
  .ui-dftb__rowmark, .ui-dftb__mark { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-diff-table")) customElements.define("tc-diff-table", TcDiffTable);
declare global {
  interface HTMLElementTagNameMap {
    "tc-diff-table": TcDiffTable;
  }
}
