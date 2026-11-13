import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-import-review> – the rows of an import, checked before they land. Every cell is checked against its column –
 * required and missing, not an email address, not a date, not a number, or the page's own `validate` – and a cell with
 * a problem is marked and says what's wrong in words. Rows that share a `duplicate-key` value (an email, an id) are
 * grouped as duplicates, each with Keep this (skip the others) and Merge (fill this row's blanks from the others, then
 * skip them). Tabs filter All / With problems / Duplicates with their counts; any cell is edited in place; any row is
 * skipped or restored. The summary says "412 rows ready, 9 to fix, 3 duplicates", and Import is held, with the
 * reason, until nothing's left to fix – or "Skip rows with problems" is ticked.
 *
 *   <tc-import-review duplicate-key="email" .columns=${columns} .rows=${rows}></tc-import-review>
 *
 * `rows` is the value: every edit, skip, keep and merge fires a cancelable tc-rows-change ({ rows, change, id }).
 * Import fires a cancelable tc-import ({ rows, skipped }). The table is a WAI-ARIA grid with one tab stop: arrows move
 * cell by cell, Home / End to the row's ends, Enter or F2 edits a cell (Enter saves, Escape cancels).
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 */

/** A table with a check: rows checked before they land (Lucide table-properties, ISC) */
const reviewIcon = svg`<path d="M15 3v18"></path><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M21 9H3"></path><path d="M21 15H3"></path>`;

export type ImportReviewColumnType = "text" | "number" | "date" | "email";

export type ImportReviewColumn = {
  id: string;
  label: string;
  /** What the column must hold; checked unless it's text (the default) */
  type?: ImportReviewColumnType;
  /** A row can't be imported with this cell empty */
  required?: boolean;
};

export type ImportReviewRow = {
  id: string;
  /** Column id → the cell's text */
  cells: Record<string, string>;
  /** Left out of the import */
  skip?: boolean;
};

export type ImportReviewFilter = "all" | "problems" | "duplicates";
export type ImportReviewChangeKind = "edit" | "skip" | "restore" | "keep" | "merge";

/** The page's own check for a cell: the problem in words, or null when the value is fine */
export type ImportReviewValidator = (value: string, column: ImportReviewColumn, row: ImportReviewRow) => string | null;

/** Detail of tc-rows-change: every row with the change, what was done and to which row */
export type ImportReviewRowsChange = { rows: ImportReviewRow[]; change: ImportReviewChangeKind; id: string };
/** Detail of tc-filter-change */
export type ImportReviewFilterChange = { filter: ImportReviewFilter };
/** Detail of tc-skip-problems-change */
export type ImportReviewSkipProblemsChange = { skipProblems: boolean };
/** Detail of tc-import: the rows to import and the rows left out */
export type ImportReviewImport = { rows: ImportReviewRow[]; skipped: ImportReviewRow[] };

export const defaultImportReviewLabels = {
  all: "All",
  problems: "With problems",
  duplicates: "Duplicates",
  ready: "Ready",
  skipped: "Skipped",
  skip: "Skip",
  restore: "Restore",
  keep: "Keep this",
  merge: "Merge",
  missing: "Missing – required",
  email: "Not an email address",
  date: "Not a date",
  number: "Not a number",
  skipProblems: "Skip rows with problems",
  skipHint: "Duplicates keep their first row",
  import: "Import",
  more: "Show more rows",
  empty: "No rows here",
  status: "Status",
  actions: "Actions",
  row: "Row",
};
export type ImportReviewLabels = typeof defaultImportReviewLabels;

/* ---------- Checks ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMBER = /^[-+]?[$€£¥]?\s?(?:\d{1,3}(?:[,\s]\d{3})+|\d+)(?:[.,]\d+)?%?$/;
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december";
const DATES = [
  /^\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
  /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/,
  new RegExp(`^\\d{1,2}\\s+(?:${MONTHS})\\.?,?\\s+\\d{4}$`, "i"),
  new RegExp(`^(?:${MONTHS})\\.?\\s+\\d{1,2},?\\s+\\d{4}$`, "i"),
];

/** A cell's problem in words, or null: required and empty, then the column's type, then the page's own check */
export function cellProblem(value: string, column: ImportReviewColumn, row: ImportReviewRow, validate?: ImportReviewValidator, labels: Partial<ImportReviewLabels> = {}): string | null {
  const w = { ...defaultImportReviewLabels, ...labels };
  const v = (value ?? "").trim();
  if (!v) return column.required ? w.missing : null;
  if (column.type === "email" && !EMAIL.test(v)) return w.email;
  if (column.type === "number" && !NUMBER.test(v)) return w.number;
  if (column.type === "date" && !DATES.some((re) => re.test(v))) return w.date;
  return validate?.(v, column, row) ?? null;
}

/** Groups of rows (not skipped) that share a key value, in the order they first appear; groups of one are left out */
export function duplicateGroups(rows: ImportReviewRow[], key: string | undefined): ImportReviewRow[][] {
  if (!key) return [];
  const groups = new Map<string, ImportReviewRow[]>();
  for (const r of rows) {
    if (r.skip) continue;
    const k = (r.cells[key] ?? "").trim().toLowerCase();
    if (!k) continue;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

/* ---------- Icons: 24px line glyphs (Lucide, ISC) ---------- */

const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-imr__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  check: "M5.5 12.5l4 4L18.5 8",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  copy: "M8 8h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zM4 16V5a1 1 0 0 1 1-1h11",
  skip: "M5 12h14",
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

let instances = 0;

type RowInfo = { problems: Map<string, string>; dupOf: number | null; group: ImportReviewRow[] | null };

/**
 * Rows of an import, checked before they land: cell problems in words, duplicates by a key with Keep this and Merge,
 * filter tabs with counts, cells edited in place, skip and restore, and Import once nothing's left to fix.
 * @tag tc-import-review
 * @fires tc-rows-change - A cell was edited, or a row skipped, restored, kept or merged ({ rows, change, id }: ImportReviewRowsChange); cancelable – prevented, `rows` stays as it was
 * @fires tc-filter-change - A filter tab was chosen ({ filter }: ImportReviewFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-skip-problems-change - "Skip rows with problems" was switched ({ skipProblems }: ImportReviewSkipProblemsChange); cancelable – prevented, `skipProblems` stays as it was
 * @fires tc-import - Import was pressed with nothing left to fix, or with rows with problems skipped ({ rows, skipped }: ImportReviewImport); cancelable
 */
export class TcImportReview extends TcElement {
  static override ui = "imr";

  /** The heading */
  @property() accessor heading = "Review rows";
  /** A quiet line under the heading – the file, or where the rows go */
  @property() accessor description = "";
  /** The columns, in order, with their type and whether they're required */
  @property({ attribute: false }) accessor columns: ImportReviewColumn[] = [];
  /** The rows – the value. Changed by editing, skipping, keeping and merging unless a tc-rows-change listener calls preventDefault() */
  @property({ attribute: false }) accessor rows: ImportReviewRow[] = [];
  /** The column whose value makes rows duplicates – an email, an id. None: no duplicate check */
  @property({ attribute: "duplicate-key" }) accessor duplicateKey: string | undefined = undefined;
  /** The page's own check per cell, after the built-in ones: the problem in words, or null */
  @property({ attribute: false }) accessor validate: ImportReviewValidator | undefined = undefined;
  /** Which rows the table shows. Changed by the tabs unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: ImportReviewFilter = "all";
  /** Import leaves out rows with problems and extra duplicates instead of waiting for them. Changed by its checkbox unless a tc-skip-problems-change listener calls preventDefault() */
  @property({ type: Boolean, attribute: "skip-problems" }) accessor skipProblems = false;
  /** Rows shown at first, and added by Show more rows */
  @property({ type: Number, attribute: "page-size" }) accessor pageSize = 50;
  /** Words the page can rename, merged over defaultImportReviewLabels */
  @property({ attribute: false }) accessor labels: Partial<ImportReviewLabels> = {};

  /** @internal The row (in the shown list) and column holding the grid's tab stop */
  @state() accessor pos = { row: 0, col: 1 };
  /** @internal The cell being edited: row id and column id */
  @state() accessor editing: { row: string; column: string } | null = null;
  /** @internal The edit being typed */
  @state() accessor draft = "";
  /** @internal How many rows are shown */
  @state() accessor shownCount = 0;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-imr${++instances}`;
  private focusNext: { row: number; col: number } | "input" | null = null;
  private info = new Map<string, RowInfo>();

  private get w(): ImportReviewLabels {
    return { ...defaultImportReviewLabels, ...this.labels };
  }

  /* ---------- What the rows say ---------- */

  private analyse() {
    const info = new Map<string, RowInfo>();
    const index = new Map(this.rows.map((r, i) => [r.id, i]));
    for (const r of this.rows) {
      const problems = new Map<string, string>();
      if (!r.skip) {
        for (const c of this.columns) {
          const p = cellProblem(r.cells[c.id] ?? "", c, r, this.validate, this.labels);
          if (p) problems.set(c.id, p);
        }
      }
      info.set(r.id, { problems, dupOf: null, group: null });
    }
    for (const g of duplicateGroups(this.rows, this.duplicateKey)) {
      const first = index.get(g[0].id)! + 1;
      g.forEach((r, i) => {
        const x = info.get(r.id)!;
        x.group = g;
        x.dupOf = i === 0 ? null : first;
      });
    }
    this.info = info;
  }

  /** Counts for the tabs and the summary */
  private counts() {
    let ready = 0;
    let fix = 0;
    let dups = 0;
    let skipped = 0;
    let inGroups = 0;
    for (const r of this.rows) {
      const x = this.info.get(r.id)!;
      if (r.skip) {
        skipped++;
        continue;
      }
      if (x.group) inGroups++;
      if (x.problems.size) fix++;
      if (x.dupOf !== null) dups++;
      if (!x.problems.size && x.dupOf === null) ready++;
    }
    return { ready, fix, dups, skipped, inGroups, all: this.rows.length };
  }

  /** The rows the current tab shows, in order – duplicates grouped together */
  private view(): ImportReviewRow[] {
    if (this.filter === "problems") return this.rows.filter((r) => !r.skip && this.info.get(r.id)!.problems.size);
    if (this.filter === "duplicates") return duplicateGroups(this.rows, this.duplicateKey).flat();
    return this.rows;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("rows") || changed.has("columns") || changed.has("validate") || changed.has("duplicateKey") || changed.has("labels") || !this.hasUpdated) this.analyse();
    if (!this.shownCount || changed.has("pageSize") || changed.has("filter")) this.shownCount = Math.max(1, this.pageSize);
    if (this.editing && !this.rows.some((r) => r.id === this.editing!.row)) this.editing = null;
    const n = Math.min(this.view().length, this.shownCount);
    this.pos = { row: clamp(this.pos.row, 0, Math.max(0, n - 1)), col: this.pos.col };
  }

  protected override updated() {
    if (!this.focusNext) return;
    const next = this.focusNext;
    this.focusNext = null;
    if (next === "input") {
      const input = this.querySelector<HTMLInputElement>(".ui-imr__input");
      input?.focus();
      input?.select();
      return;
    }
    this.focusCell(next.row, next.col);
  }

  /* ---------- Changing rows ---------- */

  private commit(rows: ImportReviewRow[], change: ImportReviewChangeKind, id: string, said: string) {
    if (!this.emit<ImportReviewRowsChange>("tc-rows-change", { rows, change, id }, { cancelable: true })) return false;
    this.rows = rows;
    this.said = said;
    return true;
  }

  private rowNumber(id: string) {
    return this.rows.findIndex((r) => r.id === id) + 1;
  }

  private setSkip(row: ImportReviewRow, skip: boolean) {
    this.commit(
      this.rows.map((r) => (r.id === row.id ? { ...r, skip } : r)),
      skip ? "skip" : "restore",
      row.id,
      `Row ${this.rowNumber(row.id)} ${skip ? "skipped" : "restored"}`,
    );
  }

  private keep(row: ImportReviewRow) {
    const group = this.info.get(row.id)?.group;
    if (!group) return;
    const others = new Set(group.filter((r) => r.id !== row.id).map((r) => r.id));
    this.commit(
      this.rows.map((r) => (others.has(r.id) ? { ...r, skip: true } : r)),
      "keep",
      row.id,
      `Kept row ${this.rowNumber(row.id)}, skipped ${plural(others.size, "duplicate")}`,
    );
  }

  /** Fills this row's blank cells from the other rows of its group, in order, then skips them */
  private merge(row: ImportReviewRow) {
    const group = this.info.get(row.id)?.group;
    if (!group) return;
    const order = [row, ...group.filter((r) => r.id !== row.id)];
    const cells = { ...row.cells };
    for (const c of this.columns) {
      if ((cells[c.id] ?? "").trim()) continue;
      const from = order.find((r) => (r.cells[c.id] ?? "").trim());
      if (from) cells[c.id] = from.cells[c.id];
    }
    const others = new Set(order.slice(1).map((r) => r.id));
    this.commit(
      this.rows.map((r) => (r.id === row.id ? { ...r, cells } : others.has(r.id) ? { ...r, skip: true } : r)),
      "merge",
      row.id,
      `Merged ${plural(order.length, "row")} into row ${this.rowNumber(row.id)}`,
    );
  }

  private startEdit(row: ImportReviewRow, column: ImportReviewColumn) {
    this.editing = { row: row.id, column: column.id };
    this.draft = row.cells[column.id] ?? "";
    this.focusNext = "input";
  }

  private endEdit(save: boolean, refocus = true) {
    const at = this.editing;
    if (!at) return;
    this.editing = null;
    const shown = this.view().slice(0, this.shownCount);
    const r = shown.findIndex((x) => x.id === at.row);
    const c = this.columns.findIndex((x) => x.id === at.column);
    if (refocus) this.focusNext = { row: Math.max(0, r), col: c + 1 };
    const row = this.rows.find((x) => x.id === at.row);
    const column = this.columns[c];
    if (!save || !row || !column) return;
    const value = this.draft;
    if (value === (row.cells[column.id] ?? "")) return;
    const next = { ...row, cells: { ...row.cells, [column.id]: value } };
    const problem = cellProblem(value, column, next, this.validate, this.labels);
    this.commit(
      this.rows.map((x) => (x.id === row.id ? next : x)),
      "edit",
      row.id,
      `${column.label} in row ${this.rowNumber(row.id)} changed${problem ? `: ${problem}` : ""}`,
    );
  }

  private onEditKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      this.endEdit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.endEdit(false);
    }
  };

  /* ---------- Tabs, skip-problems and import ---------- */

  private setFilter(filter: ImportReviewFilter) {
    if (filter === this.filter) return;
    if (!this.emit<ImportReviewFilterChange>("tc-filter-change", { filter }, { cancelable: true })) return;
    this.filter = filter;
    this.pos = { row: 0, col: 1 };
  }

  private onTabsKey = (e: KeyboardEvent) => {
    const order: ImportReviewFilter[] = ["all", "problems", "duplicates"].filter((f) => f !== "duplicates" || this.duplicateKey) as ImportReviewFilter[];
    const at = order.indexOf(this.filter);
    const to = e.key === "ArrowRight" ? (at + 1) % order.length : e.key === "ArrowLeft" ? (at - 1 + order.length) % order.length : e.key === "Home" ? 0 : e.key === "End" ? order.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.setFilter(order[to]);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-imr__tab[data-filter="${this.filter}"]`)?.focus());
  };

  private setSkipProblems(on: boolean) {
    if (on === this.skipProblems) return;
    if (!this.emit<ImportReviewSkipProblemsChange>("tc-skip-problems-change", { skipProblems: on }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.skipProblems = on;
  }

  private blocker(): string | null {
    const { fix, dups, ready } = this.counts();
    if (!this.skipProblems && (fix || dups)) {
      const parts = [fix ? `fix ${plural(fix, "row")}` : "", dups ? `resolve ${plural(dups, "duplicate")}` : ""].filter(Boolean);
      return `To import, ${parts.join(" and ")}, or skip rows with problems`;
    }
    if (!ready) return "No rows ready to import";
    return null;
  }

  private import() {
    const why = this.blocker();
    if (why) {
      this.said = why;
      return;
    }
    const rows: ImportReviewRow[] = [];
    const skipped: ImportReviewRow[] = [];
    for (const r of this.rows) {
      const x = this.info.get(r.id)!;
      if (r.skip || x.problems.size || x.dupOf !== null) skipped.push(r);
      else rows.push(r);
    }
    if (!this.emit<ImportReviewImport>("tc-import", { rows, skipped }, { cancelable: true })) return;
    this.said = `Importing ${plural(rows.length, "row")}${skipped.length ? `, ${plural(skipped.length, "row")} left out` : ""}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private cellsOf(row: number) {
    return [...this.querySelectorAll<HTMLElement>(`[data-row="${row}"][data-col]`)].sort((a, b) => Number(a.dataset.col) - Number(b.dataset.col));
  }

  private focusCell(row: number, col: number) {
    const cells = this.cellsOf(row);
    if (!cells.length) return;
    const target = cells.find((c) => Number(c.dataset.col) === col) ?? cells.reduce((best, c) => (Math.abs(Number(c.dataset.col) - col) < Math.abs(Number(best.dataset.col) - col) ? c : best));
    this.pos = { row, col: Number(target.dataset.col) };
    target.focus();
  }

  private onGridFocusIn = (e: FocusEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-row][data-col]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (row !== this.pos.row || col !== this.pos.col) this.pos = { row, col };
  };

  private onGridKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement || e.defaultPrevented || e.isComposing) return;
    const cell = target.closest<HTMLElement>("[data-row][data-col]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const last = Math.min(this.view().length, this.shownCount) - 1;
    const cols = this.cellsOf(row).map((c) => Number(c.dataset.col));
    const at = cols.indexOf(col);
    const mod = e.ctrlKey || e.metaKey;
    let to: { row: number; col: number } | null = null;
    switch (e.key) {
      case "ArrowDown":
        to = { row: Math.min(last, row + 1), col };
        break;
      case "ArrowUp":
        to = { row: Math.max(0, row - 1), col };
        break;
      case "ArrowRight":
        to = { row, col: cols[Math.min(cols.length - 1, at + 1)] };
        break;
      case "ArrowLeft":
        to = { row, col: cols[Math.max(0, at - 1)] };
        break;
      case "Home":
        to = mod ? { row: 0, col } : { row, col: cols[0] };
        break;
      case "End":
        to = mod ? { row: last, col } : { row, col: cols[cols.length - 1] };
        break;
      case "PageDown":
        to = { row: Math.min(last, row + 10), col };
        break;
      case "PageUp":
        to = { row: Math.max(0, row - 10), col };
        break;
    }
    if (to) {
      e.preventDefault();
      this.focusCell(to.row, to.col);
      return;
    }
    if ((e.key === "Enter" || e.key === "F2") && cell.dataset.column) {
      e.preventDefault();
      const r = this.view()[row];
      const c = this.columns.find((x) => x.id === cell.dataset.column);
      if (r && c) this.startEdit(r, c);
    }
  };

  /* ---------- Rendering ---------- */

  private renderCell(r: ImportReviewRow, rowIndex: number, c: ImportReviewColumn, colIndex: number): TemplateResult {
    const problem = this.info.get(r.id)?.problems.get(c.id);
    const value = r.cells[c.id] ?? "";
    const tab = this.pos.row === rowIndex && this.pos.col === colIndex + 1;
    const editing = this.editing?.row === r.id && this.editing.column === c.id;
    if (editing)
      return html`<div role="gridcell" class="ui-imr__cell" data-editing>
        <input
          class="ui-imr__input"
          .value=${live(this.draft)}
          aria-label=${`${c.label}, row ${this.rowNumber(r.id)}`}
          aria-describedby=${`${this.uid}-edit-help`}
          @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
          @keydown=${this.onEditKey}
          @blur=${() => this.editing && this.endEdit(true, false)}
        /><span class="tc-sr-only" id=${`${this.uid}-edit-help`}>Enter saves, Escape cancels</span>
      </div>`;
    return html`<div
      role="gridcell"
      class="ui-imr__cell"
      data-row=${rowIndex}
      data-col=${colIndex + 1}
      data-column=${c.id}
      ?data-problem=${!!problem}
      tabindex=${tab ? 0 : -1}
      aria-describedby=${`${this.uid}-keys`}
      @dblclick=${() => !r.skip && this.startEdit(r, c)}
    >
      <span class="ui-imr__value" ?data-empty=${!value.trim()}>${value.trim() ? value : html`<span aria-hidden="true">—</span><span class="tc-sr-only">empty</span>`}</span>
      ${problem ? html`<span class="ui-imr__problem">${glyph(icons.alert)}<span><span class="tc-sr-only">, </span>${problem}</span></span>` : nothing}
    </div>`;
  }

  private renderRow(r: ImportReviewRow, i: number): TemplateResult {
    const w = this.w;
    const x = this.info.get(r.id)!;
    const n = this.columns.length;
    const statusCol = n + 1;
    const number = this.rowNumber(r.id);
    const status = r.skip
      ? html`<span class="ui-imr__status" data-tone="muted">${glyph(icons.skip)}${w.skipped}</span>`
      : x.problems.size
        ? html`<span class="ui-imr__status" data-tone="warning">${glyph(icons.alert)}${x.problems.size === 1 ? "1 to fix" : `${x.problems.size} to fix`}</span>`
        : x.dupOf !== null
          ? html`<span class="ui-imr__status" data-tone="info">${glyph(icons.copy)}Duplicate of row ${x.dupOf}</span>`
          : x.group
            ? html`<span class="ui-imr__status" data-tone="info">${glyph(icons.copy)}Has duplicates</span>`
            : html`<span class="ui-imr__status" data-tone="success">${glyph(icons.check)}${w.ready}</span>`;
    const tab = (col: number) => (this.pos.row === i && this.pos.col === col ? 0 : -1);
    let col = statusCol + 1;
    const action = (label: string, run: () => void, kind: string) => {
      const c = col++;
      return html`<button type="button" class="ui-imr__act" data-kind=${kind} data-row=${i} data-col=${c} tabindex=${tab(c)} @click=${run}>${label}<span class="tc-sr-only">, row ${number}</span></button>`;
    };
    const firstOfGroup = this.filter === "duplicates" && x.group?.[0].id === r.id;
    return html`<div role="row" class="ui-imr__row" aria-rowindex=${i + 2} ?data-skip=${!!r.skip} ?data-problem=${x.problems.size > 0} ?data-group-start=${firstOfGroup}>
      <div role="rowheader" class="ui-imr__num" data-row=${i} data-col="0" tabindex=${tab(0)}><span class="tc-sr-only">${w.row} </span>${number}</div>
      ${this.columns.map((c, j) => this.renderCell(r, i, c, j))}
      <div role="gridcell" class="ui-imr__status-cell" data-row=${i} data-col=${statusCol} tabindex=${tab(statusCol)}>
        ${status}${x.problems.size ? html`<span class="tc-sr-only">: ${[...x.problems].map(([cid, p]) => `${this.columns.find((c) => c.id === cid)?.label}, ${p}`).join("; ")}</span>` : nothing}
      </div>
      <div role="gridcell" class="ui-imr__acts">
        ${x.group && !r.skip ? html`${action(w.keep, () => this.keep(r), "keep")}${action(w.merge, () => this.merge(r), "merge")}` : nothing}
        ${r.skip ? action(w.restore, () => this.setSkip(r, false), "restore") : action(w.skip, () => this.setSkip(r, true), "skip")}
      </div>
    </div>`;
  }

  protected override render() {
    const w = this.w;
    const clean = this.resolvedLook === "clean";
    const k = this.counts();
    const view = this.view();
    const shown = view.slice(0, this.shownCount);
    const tabs: [ImportReviewFilter, string, number][] = [
      ["all", w.all, k.all],
      ["problems", w.problems, k.fix],
      ...(this.duplicateKey ? ([["duplicates", w.duplicates, k.inGroups]] as [ImportReviewFilter, string, number][]) : []),
    ];
    const panel = `${this.uid}-panel`;
    const why = this.blocker();
    const head = cardHead({ icon: reviewIcon, title: this.heading, subtitle: this.description || undefined, id: `${this.uid}-title` });
    const grid = html`<div class="ui-imr__scroll">
      <div
        class="ui-imr__grid"
        role="grid"
        aria-labelledby=${`${this.uid}-title`}
        aria-rowcount=${view.length + 1}
        style=${styleMap({ "--tc-imr-cols": String(this.columns.length) })}
        @keydown=${this.onGridKey}
        @focusin=${this.onGridFocusIn}
      >
        <div role="row" class="ui-imr__row ui-imr__head" aria-rowindex="1">
          <div role="columnheader" class="ui-imr__num">${w.row}</div>
          ${this.columns.map((c) => html`<div role="columnheader" class="ui-imr__th">${c.label}${c.required ? html`<span class="ui-imr__req" aria-hidden="true">*</span><span class="tc-sr-only">, required</span>` : nothing}</div>`)}
          <div role="columnheader" class="ui-imr__th">${w.status}</div>
          <div role="columnheader" class="ui-imr__th"><span class="tc-sr-only">${w.actions}</span></div>
        </div>
        ${repeat(
          shown,
          (r) => r.id,
          (r, i) => this.renderRow(r, i),
        )}
      </div>
      ${shown.length ? nothing : html`<p class="ui-imr__empty">${w.empty}</p>`}
    </div>`;
    const body = html`<div class="ui-imr__body">
      <div class="ui-imr__tabs" role="tablist" aria-label="Show rows" @keydown=${this.onTabsKey}>
        ${tabs.map(
          ([f, label, n]) =>
            html`<button type="button" role="tab" class="ui-imr__tab" data-filter=${f} aria-selected=${f === this.filter ? "true" : "false"} aria-controls=${panel} tabindex=${f === this.filter ? 0 : -1} @click=${() => this.setFilter(f)}>
              ${label}<span class="tc-sr-only">, </span><span class="ui-imr__count" ?data-alert=${f !== "all" && n > 0}>${n}</span>
            </button>`,
        )}
      </div>
      <div id=${panel} role="tabpanel" class="ui-imr__panel" aria-label=${tabs.find((t) => t[0] === this.filter)?.[1] ?? w.all}>
        ${grid}
        ${view.length > shown.length
          ? html`<button type="button" class="tc-btn-sm ui-imr__more" @click=${() => (this.shownCount += Math.max(1, this.pageSize))}>${w.more}<span class="ui-imr__more-n">${shown.length} of ${view.length}</span></button>`
          : nothing}
      </div>
    </div>`;
    const summary = [`${plural(k.ready, "row")} ready`, k.fix ? `${k.fix} to fix` : "", k.dups ? plural(k.dups, "duplicate") : "", k.skipped ? `${k.skipped} skipped` : ""].filter(Boolean).join(", ");
    const foot = html`<div class="ui-imr__foot">
      <div class="ui-imr__foot-text">
        <span class="ui-imr__summary">${summary}</span>
        ${k.fix || k.dups || this.skipProblems
          ? html`<label class="ui-imr__check"
              ><input type="checkbox" .checked=${live(this.skipProblems)} aria-describedby=${`${this.uid}-skip-hint`} @change=${(e: Event) => this.setSkipProblems((e.target as HTMLInputElement).checked)} />${w.skipProblems}<span
                class="ui-imr__hint"
                id=${`${this.uid}-skip-hint`}
                >${w.skipHint}</span
              ></label
            >`
          : nothing}
      </div>
      <button type="button" class="ui-imr__import" aria-disabled=${ifDefined(why ? "true" : undefined)} aria-describedby=${ifDefined(why ? `${this.uid}-why` : undefined)} @click=${this.import}>
        ${w.import}${k.ready ? html` <span class="ui-imr__import-n">${k.ready}</span>` : nothing}
      </button>
      ${why ? html`<span class="tc-sr-only" id=${`${this.uid}-why`}>${why}</span>` : nothing}
    </div>`;
    return html`
      ${clean ? html`<div class="ui-imr__card">${head}${body}${foot}</div>` : html`${head}<div class="ui-imr__card">${body}</div>${foot}`}
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>Enter or F2 edits the cell, arrows move between cells</span>
      <span class="tc-sr-only" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the summary and Import sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="imr"] {
  --tc-import-review-height: 420px;
  --tc-import-review-cell-w: 170px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 960px;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card, its last row the summary */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="imr"] {
  --tc-import-review-height: 420px;
  --tc-import-review-cell-w: 170px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 940px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="imr"] *, [data-ui="imr"] *::before, [data-ui="imr"] *::after { box-sizing: border-box; }
:where([data-ui="imr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="imr"]) svg { display: block; flex: none; }
[data-ui="imr"] button:focus-visible, .ui-imr__cell:focus-visible, .ui-imr__num:focus-visible, .ui-imr__status-cell:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
:where([data-look="standard"], [data-look="standard"] *).ui-imr__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-imr__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-imr__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-imr__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-imr__card > .tc-head + .ui-imr__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-imr__body { display: grid; min-width: 0; }
/* The tabs: underlined, with a count each */
.ui-imr__tabs { display: flex; gap: var(--tc-space-1); padding: 0 var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); overflow-x: auto; }
.ui-imr__tab { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-space-2); border-bottom: 2px solid transparent; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; transition: color var(--tc-duration-fast) var(--tc-ease-standard), border-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-imr__tab:hover { color: var(--tc-text-primary); }
.ui-imr__tab[aria-selected="true"] { border-bottom-color: var(--tc-accent); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-imr__count { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-imr__count[data-alert] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-imr__panel { display: grid; justify-items: start; gap: var(--tc-space-2); min-width: 0; padding-bottom: var(--tc-space-2); }
/* The grid: scrolls both ways inside the card; the row number and header stay put */
.ui-imr__scroll { width: 100%; max-height: var(--tc-import-review-height); overflow: auto; overscroll-behavior: contain; }
.ui-imr__grid { display: grid; grid-template-columns: auto repeat(var(--tc-imr-cols), minmax(120px, var(--tc-import-review-cell-w))) minmax(140px, auto) auto; width: max-content; min-width: 100%; font-size: var(--tc-font-size-sm); }
.ui-imr__row { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }
.ui-imr__row > * { min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-imr__row > * { background: var(--tc-surface-on-tray); }
.ui-imr__head > * { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
.ui-imr__req { margin-left: var(--tc-space-0-5); color: var(--tc-status-danger-fg); }
.ui-imr__num { position: sticky; left: 0; z-index: 1; font-variant-numeric: tabular-nums; color: var(--tc-text-muted); text-align: right; outline: none; }
.ui-imr__head > .ui-imr__num { z-index: 3; }
.ui-imr__cell { display: grid; align-content: start; gap: var(--tc-space-0-5); outline: none; cursor: default; }
.ui-imr__value { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-imr__value[data-empty] { color: var(--tc-text-muted); }
.ui-imr__cell[data-problem] { background: var(--tc-status-danger-bg) !important; box-shadow: inset 2px 0 0 var(--tc-status-danger-fg); }
.ui-imr__problem { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-status-danger-fg); }
.ui-imr__problem .ui-imr__glyph { width: 12px; height: 12px; }
.ui-imr__cell[data-editing] { padding: var(--tc-space-1); }
.ui-imr__input { width: 100%; min-width: 0; height: var(--tc-field-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; color: var(--tc-text-primary); outline: none; }
.ui-imr__row[data-skip] .ui-imr__value { color: var(--tc-text-muted); text-decoration: line-through; }
.ui-imr__row[data-group-start] > * { border-top: var(--tc-hairline) solid var(--tc-border-strong); }
.ui-imr__status-cell { display: flex; align-items: start; outline: none; }
.ui-imr__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
.ui-imr__status[data-tone="success"] { color: var(--tc-status-success-fg); }
.ui-imr__status[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-imr__status[data-tone="info"] { color: var(--tc-status-info-fg); }
.ui-imr__status[data-tone="muted"] { color: var(--tc-text-muted); }
.ui-imr__acts { display: flex; align-items: start; justify-content: end; gap: var(--tc-space-1); white-space: nowrap; }
.ui-imr__act { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-imr__act:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-imr__act[data-kind="keep"], .ui-imr__act[data-kind="merge"] { color: var(--tc-accent-text); }
.ui-imr__empty { margin: 0; padding: var(--tc-space-8) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
.ui-imr__more { margin: 0 var(--tc-space-3); }
.ui-imr__more-n { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
/* The tray below the card (Standard) / the card's last row (Clean) */
.ui-imr__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 44px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-imr__foot { min-height: 48px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-imr__foot-text { display: flex; flex-wrap: wrap; align-items: center; column-gap: var(--tc-space-4); row-gap: var(--tc-space-1); min-width: 0; }
.ui-imr__summary { color: var(--tc-text-secondary); }
.ui-imr__check { display: inline-flex; align-items: center; flex-wrap: wrap; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); cursor: pointer; }
.ui-imr__check input { width: 16px; height: 16px; margin: 0; accent-color: var(--tc-accent); }
.ui-imr__hint { color: var(--tc-text-muted); }
.ui-imr__import { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-imr__import:hover { background: var(--tc-action-primary-bg-hover); }
.ui-imr__import[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
.ui-imr__import-n { font-variant-numeric: tabular-nums; }
@container (max-width: 560px) {
  .ui-imr__foot { flex-wrap: wrap; }
  .ui-imr__import { width: 100%; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="imr"] *, [data-ui="imr"] *::before, [data-ui="imr"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-imr__cell[data-problem] { outline: 1px solid CanvasText; }
  .ui-imr__tab[aria-selected="true"] { border-bottom-color: Highlight; }
}
`;
}

if (!customElements.get("tc-import-review")) customElements.define("tc-import-review", TcImportReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-import-review": TcImportReview;
  }
}
