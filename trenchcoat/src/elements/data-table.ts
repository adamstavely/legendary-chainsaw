import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, RowWindowController, SmoothHeightController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-data-table> – the Lit port of src/components/data-table.tsx (pilot component, audit/lit-port-plan.md).
 * A database-style table that works like a small spreadsheet: select a cell or a range, edit in place, copy and
 * paste with Excel or Sheets, undo, sort, and check rows. Above 60 rows only the rows near the viewport render
 * (RowWindowController). Clean has no tray – one white card with hairline shadows, quiet gray type and a soft blue
 * fill for selections.
 *
 *   <tc-data-table heading="Accounts" .columns=${columns} .rows=${rows}></tc-data-table>
 *
 * Icons and logos are data: an Element, cloned wherever it shows (textColumnIcon() and friends draw the column
 * icons). `renderCell(row, column)` may return a Node or a string to draw a cell itself. Edits fire a cancelable
 * `tc-rows-change` ({ rows }), checking fires `tc-selection-change` ({ selection }), sorting `tc-sort-change`
 * ({ sort }); preventDefault() keeps control of the property yourself.
 */

export type DataColumn = {
  key: string;
  label: string;
  /** An icon element, cloned into the header */
  icon?: Element;
  /** title: logo and name · tag: colored pill with a picker · link: underlined URL · number · text */
  type?: "title" | "tag" | "link" | "number" | "text";
  /** Column width, any CSS length */
  width?: string;
  /** false makes the column read only – edits, pastes and clears skip it */
  editable?: boolean;
  /** Choices for a tag column – defaults to the tags already in the column */
  options?: string[];
};

export type DataRow = {
  id: string;
  /** Small logo in front of the title cell: an element (cloned) or an image URL */
  logo?: Element | string;
  [key: string]: string | number | Element | undefined;
};

export type TagTone = "blue" | "violet" | "pink" | "green" | "amber" | "gray";
/** Sorted column and direction, or null for the rows' own order */
export type DataSort = { key: string; dir: "asc" | "desc" } | null;

type Cell = { r: number; c: number };
type Range = { r1: number; r2: number; c1: number; c2: number };

const text = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
const letter = (c: number) => String.fromCharCode(65 + (c % 26));
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const cellKey = (r: number, c: number) => `${r}-${c}`;

/** Reads typed or pasted text for a column: numbers accept commas, spaces and currency signs */
function parse(value: string, column: DataColumn): string | number {
  const v = value.trim();
  if (column.type !== "number") return v;
  if (v === "") return "";
  const n = Number(v.replace(/[^\d.,-]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : v;
}

/** Above this many rows only the ones near the viewport are rendered */
const VIRTUAL_FROM = 60;
const OVERSCAN = 12;
let instances = 0;

const blankBlock = (range: Range, fill = "") => Array.from({ length: range.r2 - range.r1 + 1 }, () => Array.from({ length: range.c2 - range.c1 + 1 }, () => fill));

/* ---------- Icons ---------- */
// Standard: 11–15px with 1.3–1.5px lines · Clean: 16px (column icons 14px, sort 12px), thin 1.1px lines

const line = (d: string, size = 16) =>
  html`<svg viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const stroke = (d: string, size: number, width: number, box = 16) =>
  html`<svg viewBox=${`0 0 ${box} ${box}`} width=${size} height=${size} fill="none" stroke="currentColor" stroke-width=${width} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const plusIcon = (look: Look) => (look === "clean" ? line("M8 3.5v9M3.5 8h9") : stroke("M8 3v10M3 8h10", 14, 1.5));
const trashIcon = (look: Look) => (look === "clean" ? line("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5") : stroke("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5", 14, 1.4));
const undoIcon = (look: Look) => (look === "clean" ? line("M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a3.5 3.5 0 0 1 0 7H7") : stroke("M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a4 4 0 0 1 0 8H7", 15, 1.4));
const redoIcon = (look: Look) => (look === "clean" ? line("m10.5 3.5 3 3-3 3M13.5 6.5h-7a3.5 3.5 0 0 0 0 7H9") : stroke("m10.5 3.5 3 3-3 3M13.5 6.5h-7a4 4 0 0 0 0 8H9", 15, 1.4));
const sortIcon = (look: Look) => (look === "clean" ? line("M8 3.5v9M5 9.5l3 3 3-3", 12) : stroke("M6 2.5v7M3.5 7l2.5 2.5L8.5 7", 11, 1.4, 12));

/** Column icons for your column definitions, as elements (Standard 15px · Clean 14px) */
function columnIcon(d: string, look: Look = "standard"): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(ns, "svg");
  const size = look === "clean" ? "14" : "15";
  for (const [k, v] of Object.entries({ viewBox: "0 0 16 16", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": look === "clean" ? "1.1" : "1.3", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }))
    el.setAttribute(k, v);
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d);
  el.append(path);
  return el;
}
export const textColumnIcon = (look?: Look) => columnIcon("M3 4h10M3 7h10M3 10h10M3 13h6", look);
export const tagColumnIcon = (look?: Look) => columnIcon("M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z", look);
export const linkColumnIcon = (look?: Look) => columnIcon("M6.5 9.5l3-3M7.25 4.75l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M8.75 11.25l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1", look);
export const numberColumnIcon = (look?: Look) => columnIcon("M6 2.5 4.5 13.5M11.5 2.5 10 13.5M2.5 6h11M2 10.5h11", look);
export const dateColumnIcon = (look?: Look) => columnIcon("M3 4.5h10v9H3zM3 7.5h10M6 2.5v3M10 2.5v3", look);

const clone = (n: Element | undefined) => (n ? n.cloneNode(true) : nothing);

/**
 * A database-style table that works like a small spreadsheet.
 * @tag tc-data-table
 * @fires tc-rows-change - Rows were edited, pasted, cleared, added, deleted, undone or redone ({ rows }); cancelable
 * @fires tc-selection-change - Rows were checked or unchecked ({ selection }); cancelable
 * @fires tc-sort-change - The sort changed ({ sort }); cancelable
 */
export class TcDataTable extends TcElement {
  static override ui = "dt";

  /** The table's name: its heading and the grid's label */
  @property() accessor heading = "";
  /** An icon element in front of the heading (cloned) */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;
  @property({ attribute: false }) accessor columns: DataColumn[] = [];
  /** The rows. Edits change them unless a tc-rows-change listener calls preventDefault() */
  @property({ attribute: false }) accessor rows: DataRow[] = [];
  /** Ids of the checked rows */
  @property({ attribute: false }) accessor selection: string[] = [];
  /** Sort; null shows the rows in their own order */
  @property({ attribute: false }) accessor sort: DataSort = null;
  /** Tag colors by tag text – falls back to blue */
  @property({ attribute: false }) accessor tagTones: Record<string, TagTone> = {};
  /** Read only: selection and copy still work */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Draw a cell yourself: return a Node or a string, or undefined for the default */
  @property({ attribute: false }) accessor renderCell: ((row: DataRow, column: DataColumn) => Node | string | undefined) | undefined = undefined;

  @state() private accessor active: Cell | null = null;
  @state() private accessor anchor: Cell | null = null;
  @state() private accessor editing: { cell: Cell; value: string } | null = null;
  @state() private accessor dragging = false;
  @state() private accessor history = { past: 0, future: 0 };
  @state() private accessor mac = false;

  private readonly idBase = `tc-dt${++instances}`;
  private past: DataRow[][] = [];
  private future: DataRow[][] = [];
  /** The rows this table last produced – anything else arriving through `rows` came from outside and ends the history */
  private ownRows: DataRow[] | null = null;
  private added = 0;
  private revealing = false;
  private view: DataRow[] = [];
  private readonly window = new RowWindowController(this, {
    count: () => this.view.length,
    body: () => this.querySelector("tbody"),
    rowSelector: "tr[aria-rowindex]",
    from: VIRTUAL_FROM,
    overscan: OVERSCAN,
    rowHeight: 44,
  });

  constructor() {
    super();
    new SmoothHeightController(this, () => this.querySelector(".ui-dt__morph"), () => this.grid);
    // Delete / Clear remove the bulk bar, Undo / Redo disable themselves: focus goes to the grid, never to <body>
    new FocusRescueController(this, () => this.grid);
  }

  private get grid() {
    return this.querySelector<HTMLElement>(".ui-dt__scroll");
  }
  private get editable() {
    return !this.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.mac = isMac();
    window.addEventListener("pointerup", this.stopDrag);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pointerup", this.stopDrag);
    window.removeEventListener("scroll", this.placePicker, true);
    window.removeEventListener("resize", this.placePicker);
    window.removeEventListener("pointerdown", this.pickerAway as EventListener, true);
    this.pickerOpen = false;
  }
  private stopDrag = () => {
    if (this.dragging) this.dragging = false;
  };

  /* ---------- Data ---------- */

  private computeView() {
    const sort = this.sort;
    if (!sort) return this.rows;
    const col = this.columns.find((c) => c.key === sort.key);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...this.rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (text(x) === "") return 1;
      if (text(y) === "") return -1;
      if (col?.type === "number") return (Number(x) - Number(y)) * dir;
      return text(x).localeCompare(text(y), undefined, { numeric: true }) * dir;
    });
  }

  private canEdit(c: number) {
    return this.editable && this.columns[c]?.editable !== false;
  }
  private get titleKey() {
    return this.columns.find((x) => x.type === "title")?.key ?? this.columns[0]?.key ?? "";
  }

  /** Every data change goes through here so it can be undone */
  private commitRows(change: (prev: DataRow[]) => DataRow[]) {
    const prev = this.rows;
    const next = change(prev);
    if (next === prev) return;
    if (!this.emit("tc-rows-change", { rows: next }, { cancelable: true })) return;
    this.past.push(prev);
    if (this.past.length > 100) this.past.shift();
    this.future = [];
    this.ownRows = next;
    this.rows = next;
    this.syncHistory();
  }
  private step(from: "past" | "future") {
    const snapshot = this[from].pop();
    if (!snapshot) return;
    if (!this.emit("tc-rows-change", { rows: snapshot }, { cancelable: true })) {
      this[from].push(snapshot);
      return;
    }
    this[from === "past" ? "future" : "past"].push(this.rows);
    this.ownRows = snapshot;
    this.rows = snapshot;
    this.syncHistory();
  }
  private undo = () => this.step("past");
  private redo = () => this.step("future");
  private syncHistory() {
    this.history = { past: this.past.length, future: this.future.length };
  }

  private setSelection(ids: string[]) {
    if (this.emit("tc-selection-change", { selection: ids }, { cancelable: true })) this.selection = ids;
  }
  private setSort(sort: DataSort) {
    if (this.emit("tc-sort-change", { sort }, { cancelable: true })) this.sort = sort;
  }

  /** Write values into a block of cells, starting at a cell – used by edit, paste and clear */
  private writeBlock(start: Cell, matrix: string[][]) {
    const updates = new Map<string, Record<string, string | number>>();
    matrix.forEach((line, dr) =>
      line.forEach((value, dc) => {
        const row = this.view[start.r + dr];
        const c = start.c + dc;
        const col = this.columns[c];
        if (!row || !col || !this.canEdit(c)) return;
        updates.set(row.id, { ...updates.get(row.id), [col.key]: parse(value, col) });
      }),
    );
    if (updates.size) this.commitRows((prev) => prev.map((row) => (updates.has(row.id) ? { ...row, ...updates.get(row.id) } : row)));
  }

  /* ---------- Selection and editing ---------- */

  private get range(): Range | null {
    const active = this.active;
    if (!active) return null;
    const a = this.anchor ?? active;
    return { r1: Math.min(a.r, active.r), r2: Math.max(a.r, active.r), c1: Math.min(a.c, active.c), c2: Math.max(a.c, active.c) };
  }

  private select(cell: Cell, extend = false) {
    const r = Math.max(0, Math.min(this.view.length - 1, cell.r));
    const c = Math.max(0, Math.min(this.columns.length - 1, cell.c));
    if (!extend) this.anchor = null;
    else if (!this.anchor) this.anchor = this.active ?? { r, c };
    this.active = { r, c };
    this.revealing = true;
  }

  private startEdit(cell: Cell, initial?: string) {
    if (!this.canEdit(cell.c) || !this.view[cell.r]) return;
    this.editing = { cell, value: initial ?? text(this.view[cell.r][this.columns[cell.c].key]) };
  }
  private finishEdit(save: boolean, move?: Cell, picked?: string) {
    const editing = this.editing;
    if (editing && save) {
      const value = picked ?? editing.value;
      const current = text(this.view[editing.cell.r]?.[this.columns[editing.cell.c].key]);
      if (value !== current) this.writeBlock(editing.cell, [[value]]);
    }
    this.editing = null;
    if (move) this.select(move);
    requestAnimationFrame(() => this.grid?.focus({ preventScroll: true }));
  }

  private rangeSummary() {
    const range = this.range;
    const active = this.active;
    if (!range || !active) return null;
    const cells = (range.r2 - range.r1 + 1) * (range.c2 - range.c1 + 1);
    if (cells === 1) return `${letter(active.c)}${active.r + 1}`;
    let filled = 0;
    let sum = 0;
    let numeric = false;
    for (let r = range.r1; r <= range.r2; r++)
      for (let c = range.c1; c <= range.c2; c++) {
        const v = this.view[r]?.[this.columns[c].key];
        if (text(v) !== "") filled++;
        if (this.columns[c].type === "number" && typeof v === "number") {
          numeric = true;
          sum += v;
        }
      }
    return `${filled} ${filled === 1 ? "value" : "values"}${numeric ? ` · Sum ${sum.toLocaleString("en-US")}` : ""}`;
  }

  /* ---------- Keyboard and clipboard ---------- */

  /** The grid's keys: arrows (with Shift to extend, ⌘/Ctrl to jump), Enter/F2 to edit, typing to replace, Delete, undo/redo */
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.editing || e.isComposing) return;
    // Keys from the sort buttons, checkboxes or links inside the grid are theirs
    const owner = (e.target as HTMLElement).closest("button, a[href], input, select, textarea, [contenteditable], [tabindex]");
    if (owner && owner !== e.currentTarget) return;
    const rows = this.view.length;
    const columns = this.columns;
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const k = e.key.toLowerCase();
    if (mod && k === "z") {
      e.preventDefault();
      return e.shiftKey ? this.redo() : this.undo();
    }
    if (mod && k === "y") {
      e.preventDefault();
      return this.redo();
    }
    if (mod && k === "a") {
      e.preventDefault();
      this.anchor = { r: 0, c: 0 };
      this.active = { r: rows - 1, c: columns.length - 1 };
      return;
    }
    const current = this.active;
    if (!current) {
      if (e.key.startsWith("Arrow") || e.key === "Enter") {
        e.preventDefault();
        this.select({ r: 0, c: 0 });
      }
      return;
    }
    const { r, c } = current;
    const moves: Record<string, Cell> = {
      ArrowUp: { r: mod ? 0 : r - 1, c },
      ArrowDown: { r: mod ? rows - 1 : r + 1, c },
      ArrowLeft: { r, c: mod ? 0 : c - 1 },
      ArrowRight: { r, c: mod ? columns.length - 1 : c + 1 },
      Home: { r: mod ? 0 : r, c: 0 },
      End: { r: mod ? rows - 1 : r, c: columns.length - 1 },
    };
    if (moves[e.key]) {
      e.preventDefault();
      return this.select(moves[e.key], e.shiftKey);
    }
    // Tab and Shift+Tab are left alone: they move focus out of the grid (ARIA grid pattern, WCAG 2.1.2)
    const link = e.key === "Enter" ? this.querySelector<HTMLAnchorElement>(`[data-cell="${cellKey(r, c)}"] a[href]`) : null;
    if (link && (mod || columns[c].editable === false)) {
      e.preventDefault();
      link.click();
      return;
    }
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      return this.startEdit(current);
    }
    if (e.key === "Escape") {
      this.anchor = null;
      return;
    }
    const range = this.range;
    if ((e.key === "Delete" || e.key === "Backspace") && range) {
      e.preventDefault();
      return this.writeBlock({ r: range.r1, c: range.c1 }, blankBlock(range));
    }
    // Typing a character starts editing with it, like a spreadsheet
    if (e.key.length === 1 && !mod && !e.altKey && columns[c].type !== "tag") {
      e.preventDefault();
      this.startEdit(current, e.key);
    }
  };

  /** Clipboard: tab separated values, the format Excel and Google Sheets use */
  private rangeText() {
    const range = this.range;
    if (!range) return "";
    return this.view
      .slice(range.r1, range.r2 + 1)
      .map((row) =>
        this.columns
          .slice(range.c1, range.c2 + 1)
          .map((col) => text(row[col.key]).replace(/[\t\n]/g, " "))
          .join("\t"),
      )
      .join("\n");
  }
  private onCopy = (e: ClipboardEvent) => {
    if (this.editing || !this.range) return;
    e.preventDefault();
    e.clipboardData?.setData("text/plain", this.rangeText());
  };
  private onCut = (e: ClipboardEvent) => {
    const range = this.range;
    if (this.editing || !range) return;
    this.onCopy(e);
    this.writeBlock({ r: range.r1, c: range.c1 }, blankBlock(range));
  };
  private onPaste = (e: ClipboardEvent) => {
    const active = this.active;
    if (this.editing || !active) return;
    e.preventDefault();
    const raw = (e.clipboardData?.getData("text/plain") ?? "").replace(/\r/g, "").replace(/\n$/, "");
    if (!raw) return;
    const matrix = raw.split("\n").map((l) => l.split("\t"));
    const range = this.range;
    // One value pasted into a range fills the whole range
    if (matrix.length === 1 && matrix[0].length === 1 && range) return this.writeBlock({ r: range.r1, c: range.c1 }, blankBlock(range, matrix[0][0]));
    this.writeBlock(range ? { r: range.r1, c: range.c1 } : active, matrix);
  };

  /* ---------- Pointer ---------- */

  private onCellDown(e: PointerEvent, cell: Cell, isEditing: boolean) {
    if (isEditing || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("a")) return;
    e.preventDefault();
    this.grid?.focus({ preventScroll: true });
    if (this.editing) this.finishEdit(true);
    this.select(cell, e.shiftKey);
    this.dragging = true;
  }
  private onCellEnter(cell: Cell) {
    if (!this.dragging) return;
    if (!this.anchor) this.anchor = this.active;
    this.active = cell;
  }

  /* ---------- Rows ---------- */

  private toggle(id: string) {
    const next = new Set(this.selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.setSelection(this.rows.filter((r) => next.has(r.id)).map((r) => r.id));
  }

  private addRow() {
    this.added += 1;
    const row: DataRow = { id: `new-${this.added}`, [this.titleKey]: "" };
    const index = this.rows.length;
    this.commitRows((prev) => [...prev, row]);
    this.setSort(null);
    const cell = { r: index, c: Math.max(0, this.columns.findIndex((c) => c.key === this.titleKey)) };
    this.active = cell;
    this.anchor = null;
    this.editing = { cell, value: "" };
  }

  /** The bulk bar is about to go: focus moves to the grid first */
  private leaveBulk() {
    rescueFocus(this.querySelector(".ui-dt__bulk"), [this.grid]);
  }
  private deleteChecked() {
    this.leaveBulk();
    const checked = new Set(this.selection);
    this.commitRows((prev) => prev.filter((r) => !checked.has(r.id)));
    this.setSelection([]);
    this.active = null;
    this.anchor = null;
  }

  private tagOptions(col: DataColumn) {
    return col.options ?? [...new Set(this.rows.map((r) => text(r[col.key])).filter(Boolean))];
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("rows") && this.rows !== this.ownRows) {
      // New rows from outside (server data, realtime) end the history
      this.ownRows = this.rows;
      this.past = [];
      this.future = [];
      this.history = { past: 0, future: 0 };
    }
    this.view = this.computeView();
    this.window.compute();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // Keep the active cell in view while moving with the keyboard – first bringing its row into the rendered window
    const active = this.active;
    if (active && this.revealing) {
      if (active.r < this.window.start || active.r >= this.window.end) this.window.reveal(active.r);
      else {
        this.revealing = false;
        this.querySelector(`[data-cell="${cellKey(active.r, active.c)}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
    // The editor takes the focus with its caret at the end
    if (changed.has("editing") && this.editing) {
      const input = this.querySelector<HTMLInputElement>(".ui-dt__input");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      } else this.querySelector<HTMLButtonElement>(".ui-dt__option[tabindex='0']")?.focus();
    }
    // The tag picker follows its cell on scroll and resize; a click anywhere else keeps the cell as it was
    const picker = !!this.querySelector(".ui-dt__picker");
    if (picker !== this.pickerOpen) {
      this.pickerOpen = picker;
      const method = picker ? "addEventListener" : "removeEventListener";
      window[method]("scroll", this.placePicker, true);
      window[method]("resize", this.placePicker);
      window[method]("pointerdown", this.pickerAway as EventListener, true);
    }
    if (picker) this.placePicker();
  }
  private pickerOpen = false;

  /** Tag choices sit in a fixed layer lined up with the cell, so the scrolling table can't cut them off */
  private placePicker = () => {
    const menu = this.querySelector<HTMLElement>(".ui-dt__picker");
    const cell = menu?.closest("td");
    if (!menu || !cell) return;
    const box = cell.getBoundingClientRect();
    const height = menu.offsetHeight;
    const below = window.innerHeight - box.top - 4;
    const top = below >= height + 8 ? box.top + 4 : Math.max(8, box.bottom - 4 - height);
    // A transformed or filtered ancestor moves where "fixed" starts – measure that origin and subtract it
    const origin = this.querySelector(".ui-dt__picker-origin")?.getBoundingClientRect() ?? { left: 0, top: 0 };
    Object.assign(menu.style, { left: `${box.left + 6 - origin.left}px`, top: `${top - origin.top}px`, minWidth: `${Math.max(box.width - 12, 160)}px`, visibility: "visible" });
  };
  private pickerAway = (e: PointerEvent) => {
    if (!this.querySelector(".ui-dt__picker")?.contains(e.target as Node)) this.finishEdit(false);
  };

  /* ---------- Render ---------- */

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const columns = this.columns;
    const view = this.view;
    const { start, end } = this.window;
    const rowH = this.window.rowHeight;
    const checked = new Set(this.selection);
    const checkedCount = view.reduce((n, r) => n + (checked.has(r.id) ? 1 : 0), 0);
    const all = view.length > 0 && checkedCount === view.length;
    const some = checkedCount > 0 && !all;
    const range = this.range;
    const active = this.active;
    const editing = this.editing;
    const mod = this.mac ? "⌘" : "Ctrl";
    // Screen readers hear the active cell: focus stays on the grid, which points at the cell (once it's rendered)
    const activeId = active && !editing && active.r >= start && active.r < end ? `${this.idBase}-${active.r}-${active.c}` : undefined;
    const summary = this.rangeSummary();
    const multiCell = !!range && (range.r2 > range.r1 || range.c2 > range.c1);
    const announce = [checkedCount > 0 ? `${checkedCount} ${checkedCount === 1 ? "row" : "rows"} selected` : "", multiCell ? (summary ?? "") : ""].filter(Boolean).join(". ");
    const spacer = (n: number) =>
      n > 0 ? html`<tr class="ui-dt__spacer" aria-hidden="true"><td colspan=${columns.length + 1} style=${styleMap({ height: `${n * rowH}px`, padding: "0", border: "0" })}></td></tr>` : nothing;

    return html`
      <header class="ui-dt__head">
        ${this.icon ? html`<span class="ui-dt__title-icon">${clone(this.icon)}</span>` : nothing}
        <h3 class="ui-dt__title">${this.heading}</h3>
        ${this.editable
          ? html`<div class="ui-dt__tools">
              <button type="button" class="ui-dt__tool" aria-label=${`Undo (${mod} Z)`} title=${`Undo · ${mod} Z`} ?disabled=${!this.history.past} @click=${this.undo}>${undoIcon(look)}</button>
              <button type="button" class="ui-dt__tool" aria-label=${`Redo (${mod} Shift Z)`} title=${`Redo · ${mod} ⇧ Z`} ?disabled=${!this.history.future} @click=${this.redo}>${redoIcon(look)}</button>
            </div>`
          : nothing}
      </header>
      <div class=${clean ? "ui-dt__body" : "ui-dt__card"}>
        <div class="ui-dt__morph">
          <div
            class="ui-dt__scroll"
            role="grid"
            aria-label=${this.heading}
            aria-rowcount=${view.length + 1}
            aria-multiselectable="true"
            aria-activedescendant=${ifDefined(activeId)}
            tabindex="0"
            ?data-dragging=${this.dragging}
            @keydown=${this.onKeyDown}
            @copy=${this.onCopy}
            @cut=${this.onCut}
            @paste=${this.onPaste}
          >
            <table class="ui-dt__table" role="presentation">
              <thead>
                <tr role="row" aria-rowindex="1">
                  <th class="ui-dt__select" role="columnheader" style=${styleMap({ width: clean ? "40px" : "44px" })}>${this.checkbox(all, some, "Select all rows", () => this.setSelection(all ? [] : view.map((r) => r.id)))}</th>
                  ${columns.map((col, c) => {
                    const dir = this.sort?.key === col.key ? this.sort.dir : null;
                    return html`<th
                      role="columnheader"
                      aria-sort=${dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
                      data-type=${ifDefined(col.type)}
                      ?data-col-active=${!!range && c >= range.c1 && c <= range.c2}
                      style=${styleMap(col.width ? { width: col.width } : {})}
                    >
                      <button
                        type="button"
                        class="ui-dt__th"
                        @click=${() => this.setSort(this.sort?.key !== col.key ? { key: col.key, dir: "asc" } : this.sort.dir === "asc" ? { key: col.key, dir: "desc" } : null)}
                      >
                        ${col.icon ? html`<span class="ui-dt__col-icon">${clone(col.icon)}</span>` : nothing}
                        <span class="ui-dt__th-label">${col.label}</span>
                        <span class="ui-dt__sort" data-dir=${ifDefined(dir ?? undefined)} aria-hidden="true">${sortIcon(look)}</span>
                      </button>
                    </th>`;
                  })}
                </tr>
              </thead>
              <tbody>
                ${spacer(start)}
                ${repeat(
                  view.slice(start, end),
                  (row) => row.id,
                  (row, i) => this.renderRow(row, start + i, checked.has(row.id), look),
                )}
                ${spacer(view.length - end)}
              </tbody>
            </table>
            ${view.length === 0 ? html`<p class="ui-dt__empty">No rows yet</p>` : nothing}
          </div>
        </div>
      </div>
      <footer class="ui-dt__foot">
        <span class="ui-dt__sr" role="status">${announce}</span>
        ${checkedCount > 0
          ? html`<div class="ui-dt__bulk">
              <span>${checkedCount} selected</span>
              ${this.editable
                ? html`<button type="button" class="ui-dt__add ui-dt__add--danger" @click=${() => this.deleteChecked()}>${trashIcon(look)} Delete</button>`
                : nothing}
              <button
                type="button"
                class="ui-dt__add"
                @click=${() => {
                  this.leaveBulk();
                  this.setSelection([]);
                }}
              >
                Clear
              </button>
            </div>`
          : this.editable
            ? html`<button type="button" class="ui-dt__add" @click=${() => this.addRow()}>${plusIcon(look)} Add row</button>`
            : html`<span></span>`}
        <span class="ui-dt__summary" title=${ifDefined(summary ?? undefined)}>${summary ?? (this.editable ? "Double-click or press Enter to edit" : "")}</span>
      </footer>
    `;
  }

  private renderRow(row: DataRow, r: number, isChecked: boolean, look: Look): TemplateResult {
    const range = this.range;
    const inRows = !!range && r >= range.r1 && r <= range.r2;
    const activeC = this.active?.r === r ? this.active.c : -1;
    const editC = this.editing?.cell.r === r ? this.editing.cell.c : -1;
    return html`<tr role="row" aria-rowindex=${r + 2} ?data-selected=${isChecked}>
      <td class="ui-dt__select" role="gridcell">${this.checkbox(isChecked, false, `Select ${text(row[this.titleKey]) || "row"}`, () => this.toggle(row.id))}</td>
      ${this.columns.map((col, c) => {
        const isActive = activeC === c;
        const isEditing = editC === c;
        const selected = inRows && c >= range!.c1 && c <= range!.c2;
        return html`<td
          id=${`${this.idBase}-${r}-${c}`}
          role="gridcell"
          data-cell=${cellKey(r, c)}
          data-type=${ifDefined(col.type)}
          ?data-active=${isActive}
          ?data-in-range=${selected && !isActive}
          ?data-editing=${isEditing}
          aria-selected=${selected ? "true" : "false"}
          aria-readonly=${ifDefined(this.canEdit(c) ? undefined : "true")}
          @pointerdown=${(e: PointerEvent) => this.onCellDown(e, { r, c }, isEditing)}
          @pointerenter=${() => this.onCellEnter({ r, c })}
          @dblclick=${() => this.startEdit({ r, c })}
        >
          ${isEditing ? this.renderEditor(col, r, c, look) : this.renderValue(col, row)}
        </td>`;
      })}
    </tr>`;
  }

  private renderValue(column: DataColumn, row: DataRow) {
    const own = this.renderCell?.(row, column);
    if (own !== undefined) return own;
    const value = row[column.key];
    if (column.type === "title") {
      const logo = row.logo;
      return html`<span class="ui-dt__name"
        >${logo
          ? html`<span class="ui-dt__logo">${typeof logo === "string" ? html`<img src=${logo} alt="" />` : logo.cloneNode(true)}</span>`
          : html`<span class="ui-dt__logo ui-dt__logo--empty"></span>`}<span class="ui-dt__name-text" ?data-empty=${text(value) === ""}>${text(value) || "Untitled"}</span></span
      >`;
    }
    if (text(value) === "") return nothing;
    if (column.type === "tag") return html`<span class="ui-dt__tag" data-tone=${this.tagTones[text(value)] ?? "blue"}>${text(value)}</span>`;
    if (column.type === "link") {
      const href = /^https?:\/\//.test(text(value)) ? text(value) : `https://${text(value)}`;
      return html`<a class="ui-dt__link" href=${href} target="_blank" rel="noreferrer" tabindex="-1">${text(value).replace(/^https?:\/\//, "")}</a>`;
    }
    if (column.type === "number" && typeof value === "number") return html`<span class="ui-dt__text">${value.toLocaleString("en-US")}</span>`;
    return html`<span class="ui-dt__text">${text(value)}</span>`;
  }

  /** In-place editor: a text field, or a list of choices for tag columns */
  private renderEditor(column: DataColumn, r: number, c: number, look: Look) {
    const editing = this.editing!;
    const done = (save: boolean, move?: "down" | "right", picked?: string) =>
      this.finishEdit(save, move ? { r: r + (move === "down" ? 1 : 0), c: c + (move === "right" ? 1 : 0) } : undefined, picked);
    if (column.type === "tag") {
      const options = this.tagOptions(column);
      const value = editing.value;
      const first = options.includes(value) ? value : options[0];
      return html`<span class="ui-dt__picker-anchor">
        ${look === "clean" ? html`<span class="ui-dt__picker-origin" aria-hidden="true"></span>` : nothing}
        <div class="ui-dt__picker" role="listbox" aria-label=${column.label} style="visibility:hidden">
          ${options.map(
            (o) => html`<button
              type="button"
              role="option"
              aria-selected=${o === value ? "true" : "false"}
              class="ui-dt__option"
              tabindex=${o === first ? "0" : "-1"}
              @pointerdown=${(e: PointerEvent) => e.stopPropagation()}
              @click=${() => done(true, undefined, o)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Escape" || e.key === "Tab") {
                  e.preventDefault();
                  return done(false);
                }
                const items = [...((e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
                const i = items.indexOf(e.currentTarget as HTMLButtonElement);
                if (e.key === "ArrowDown") items[Math.min(items.length - 1, i + 1)]?.focus();
                if (e.key === "ArrowUp") items[Math.max(0, i - 1)]?.focus();
                if (e.key === "Home") items[0]?.focus();
                if (e.key === "End") items[items.length - 1]?.focus();
                if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") e.preventDefault();
              }}
            >
              ${look === "clean" ? html`<span class="ui-dt__tag" data-tone=${this.tagTones[o] ?? "blue"}>${o}</span>` : html`<span class="ui-dt__option-label">${o}</span>`}
              <svg viewBox="0 0 16 16" class="ui-dt__option-check" aria-hidden="true">${svg`<path d="m4 8.25 2.6 2.6L12 5.25"></path>`}</svg>
            </button>`,
          )}
        </div>
      </span>`;
    }
    return html`<input
      class="ui-dt__input"
      .value=${editing.value}
      inputmode=${ifDefined(column.type === "number" ? "decimal" : undefined)}
      aria-label=${column.label}
      @input=${(e: Event) => (this.editing = { cell: editing.cell, value: (e.target as HTMLInputElement).value })}
      @blur=${() => this.editing && done(true)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.isComposing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          done(true, "down");
        } else if (e.key === "Tab") {
          e.preventDefault();
          done(true, "right");
        } else if (e.key === "Escape") {
          e.preventDefault();
          done(false);
        }
      }}
    />`;
  }

  private checkbox(checked: boolean, mixed: boolean, label: string, onChange: () => void) {
    const clean = this.resolvedLook === "clean";
    const d = clean ? (mixed ? "M5 8h6" : "m4.5 8.25 2.25 2.25L11.5 5.75") : mixed ? "M4.5 8h7" : "m4.25 8.25 2.5 2.5 5-5.5";
    return html`<button
      type="button"
      role="checkbox"
      aria-checked=${mixed ? "mixed" : checked ? "true" : "false"}
      aria-label=${label}
      class="ui-dt__check"
      @pointerdown=${(e: PointerEvent) => e.stopPropagation()}
      @click=${onChange}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>
    </button>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dt"] {
  /* The header of the column holding the active cell: a barely-there blue */
  --tc-data-table-header-bg-active: light-dark(#fafbff, rgba(47, 107, 255, 0.08));
  /* The active cell's frame while the table doesn't have focus */
  --tc-data-table-cell-border-inactive: light-dark(#a9c1ff, rgba(107, 149, 255, 0.55));
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* Like the Chat Composer: a gray tray with the title, the white table card sits on top of it */
  background: var(--tc-surface-sunken);
  /* The gray tray frames the white card on every side – the tray recipe */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="dt"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dt"] {
  /* The active cell's frame while the table doesn't have focus */
  --tc-data-table-cell-border-inactive: light-dark(rgba(0, 96, 226, 0.35), rgba(77, 141, 255, 0.5));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* One white card – the edge is a shadow, not a border */
  overflow: hidden;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="dt"] *, [data-ui="dt"] *::before, [data-ui="dt"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dt"] button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-4-5);
  min-height: 46px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__title {
  margin: 0;
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-relaxed);
  letter-spacing: -0.01em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__title-icon { display: grid; }
:where([data-ui="dt"][data-look="clean"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="dt"][data-look="clean"]) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dt"] button:focus-visible,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dt"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Title row: icon, name, undo and redo */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: 52px;
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__title {
  margin: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__title-icon { display: grid; flex: none; }
.ui-dt__title-icon svg { width: 18px; height: 18px; }
.ui-dt__tools {
  display: flex;
  gap: var(--tc-space-0-5);
  margin-left: auto;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-action-ghost-fg) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool:disabled { opacity: 0.35; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__card {
  overflow: hidden;
  background: var(--tc-surface-raised);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-shadow-control);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool:disabled { opacity: 0.4; cursor: default; }
.ui-dt__scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  outline: none;
}
/* The grid has focus but no active cell yet: a ring on the grid (the active cell's frame takes over once there is one) */
.ui-dt__scroll:focus-visible:not(:has(td[data-active])) { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-dt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-dt__scroll[data-dragging] { cursor: cell; user-select: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
/* Every row is 44px high and the selection column 44px wide, so its cells are squares */
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td {
  position: relative;
  height: 44px;
  padding: 0 var(--tc-space-3-5);
  border-top: 1px solid var(--tc-border-subtle);
  border-left: 1px solid var(--tc-border-subtle);
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th:first-child,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td:first-child { border-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th {
  padding: 0 var(--tc-space-1-5);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-muted);
  border-top: 0;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th[data-col-active] { background: var(--tc-data-table-header-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: transparent;
  color: inherit !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th:hover { background: var(--tc-fill-hover); color: var(--tc-text-secondary) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th:focus-visible { outline: var(--tc-focus-outline); outline-offset: -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th-label { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__col-icon { display: grid; color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
/* Rows are 40px high, divided by hairlines only – no vertical grid lines */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table th,
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td {
  position: relative;
  height: 40px;
  padding: 0 var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Header row: 12px gray labels under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table th {
  height: 36px;
  padding: 0 var(--tc-space-1-5);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table th[data-col-active] { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  width: 100%;
  height: 28px;
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__col-icon { display: grid; color: var(--tc-icon-muted); }
.ui-dt__sort {
  display: grid;
  margin-left: auto;
  color: var(--tc-icon-muted);
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move);
}
.ui-dt__th:hover .ui-dt__sort { opacity: 1; }
.ui-dt__sort[data-dir] { opacity: 1; color: var(--tc-accent-text); }
.ui-dt__sort[data-dir="asc"] { transform: rotate(180deg); }
/* Selection column: one checkbox per row, centered */
.ui-dt__table .ui-dt__select { padding: 0; text-align: center; }
.ui-dt__select .ui-dt__check { margin: 0 auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table tbody tr { transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table tbody tr { transition: background-color var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-dt__table tbody tr:hover { background: var(--tc-fill-hover); }
.ui-dt__table tbody tr[data-selected] { background: var(--tc-fill-selected); }
/* Cell selection: a blue frame on the active cell, a soft tint on the rest of the range */
.ui-dt__table td[data-cell] { cursor: cell; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td[data-in-range] { background: var(--tc-accent-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td[data-active]::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid var(--tc-accent);
  border-radius: var(--tc-radius-xs);
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__scroll:not(:focus-within) td[data-active]::after { border-color: var(--tc-data-table-cell-border-inactive); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td[data-editing] {
  padding: 0;
  overflow: visible;
  background: var(--tc-surface-overlay);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__input {
  width: 100%;
  height: 100%;
  padding: 0 var(--tc-space-3-5);
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td[data-in-range] { background: var(--tc-fill-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td[data-active]::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: var(--tc-radius-xs);
  box-shadow: inset 0 0 0 1.5px var(--tc-accent-text);
  pointer-events: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__scroll:not(:focus-within) td[data-active]::after { box-shadow: inset 0 0 0 1px var(--tc-data-table-cell-border-inactive); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td[data-editing] { padding: 0; overflow: visible; background: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__input {
  width: 100%;
  height: 100%;
  padding: 0 var(--tc-space-3);
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary);
  caret-color: var(--tc-accent-text);
}
.ui-dt__table td[data-type="number"] .ui-dt__input { font-variant-numeric: tabular-nums; }
/* Tag picker: a fixed layer lined up with the cell, above the card and the gray footer */
.ui-dt__picker-anchor { display: block; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__picker {
  position: fixed;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-dt-drop var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: transparent;
  font-size: var(--tc-menu-item-font-size) !important;
  text-align: left;
  color: var(--tc-text-secondary) !important;
}
.ui-dt__option:hover { background: var(--tc-menu-item-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg) !important; font-weight: var(--tc-font-weight-medium); }
/* The focused choice gets a real ring (a hover fill alone was 1.09:1) */
.ui-dt__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-dt__option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__name {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__name-text { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__name-text[data-empty] { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__picker-origin { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__picker {
  position: fixed;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-dt-drop var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-space-1-5);
  border-radius: var(--tc-menu-item-radius);
  text-align: left;
}
.ui-dt__option-check {
  width: 16px;
  height: 16px;
  fill: none;
  flex: none;
  stroke: var(--tc-menu-item-selected-fg);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
}
.ui-dt__option[aria-selected="true"] .ui-dt__option-check { opacity: 1; }
/* Title cell: logo and name */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__name { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__name-text { overflow: hidden; text-overflow: ellipsis; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__name-text[data-empty] { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__logo { display: grid; place-items: center; flex: none; width: 16px; height: 16px; }
.ui-dt__logo svg { width: 100%; height: 100%; }
.ui-dt__logo--empty { border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check {
  display: grid;
  place-items: center;
  flex: none;
  position: relative;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--tc-border-control);
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-raised);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check:hover { border-color: var(--tc-border-control-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* A 24px hit area around the small box (2.5.8) */
.ui-dt__check::after { content: ""; position: absolute; inset: -5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-inverse);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-spring);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check[aria-checked="true"],
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check[aria-checked="mixed"] { background: var(--tc-surface-inverse); border-color: var(--tc-surface-inverse); }
/* Checkboxes: 14px with a hairline, a dark chip when checked */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check {
  display: grid;
  place-items: center;
  flex: none;
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-raised);
  /* The box's edge is its only cue: border-control (≥ 3:1) */
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check:focus-visible { outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-inverse);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-spring);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check[aria-checked="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check[aria-checked="mixed"] { background: var(--tc-surface-inverse); box-shadow: none; }
.ui-dt__check[aria-checked="true"] svg,
.ui-dt__check[aria-checked="mixed"] svg { opacity: 1; transform: none; }
/* Tags: soft fill with a hairline in the same hue */
:where([data-look="standard"], [data-look="standard"] *)/* Tags: the pill pattern (large size, for table text) in the status / tone colours – every fg ≥ 4.5:1 on its tint */
.ui-dt__tag {
  display: inline-block;
  max-width: 100%;
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  overflow: hidden;
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-pill-h-lg);
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
  background: var(--tc-data-table-tag-bg);
  color: var(--tc-data-table-tag-fg);
}
.ui-dt__tag[data-tone="blue"] { --tc-data-table-tag-bg: var(--tc-status-info-bg); --tc-data-table-tag-fg: var(--tc-status-info-fg); }
.ui-dt__tag[data-tone="violet"] { --tc-data-table-tag-bg: var(--tc-tone-violet-bg); --tc-data-table-tag-fg: var(--tc-tone-violet-fg); }
.ui-dt__tag[data-tone="pink"] { --tc-data-table-tag-bg: var(--tc-tone-pink-bg); --tc-data-table-tag-fg: var(--tc-tone-pink-fg); }
.ui-dt__tag[data-tone="green"] { --tc-data-table-tag-bg: var(--tc-status-success-bg); --tc-data-table-tag-fg: var(--tc-status-success-fg); }
.ui-dt__tag[data-tone="amber"] { --tc-data-table-tag-bg: var(--tc-tone-amber-bg); --tc-data-table-tag-fg: var(--tc-tone-amber-fg); }
.ui-dt__tag[data-tone="gray"] { --tc-data-table-tag-bg: var(--tc-fill-default); --tc-data-table-tag-fg: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__link {
  color: var(--tc-text-secondary);
  text-decoration: underline;
  text-decoration-color: var(--tc-border-strong);
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__link {
  color: var(--tc-text-secondary);
  text-decoration: underline;
  text-decoration-color: var(--tc-border-strong);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-dt__link:hover { color: var(--tc-text-primary); text-decoration-color: currentColor; }
.ui-dt__text { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__empty {
  margin: 0;
  padding: var(--tc-space-6);
  font-size: var(--tc-font-size-lg);
  text-align: center;
  color: var(--tc-text-muted);
}
/* Gray extension under the card: add row or bulk actions on the left, the selection summary on the right */
:where([data-look="standard"], [data-look="standard"] *).ui-dt__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  min-height: 44px;
  padding: var(--tc-space-1-5) var(--tc-space-4) var(--tc-space-2) var(--tc-space-2);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__bulk {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1);
  padding-left: var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__bulk > span { margin-right: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: none;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-ghost-fg) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add--danger { color: var(--tc-status-danger-fg) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add--danger:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__summary {
  overflow: hidden;
  font-size: var(--tc-font-size-md);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__empty { margin: 0; padding: var(--tc-space-6); border-top: var(--tc-hairline) solid var(--tc-divider); text-align: center; color: var(--tc-text-muted); }
/* The last row inside the card: add row or bulk actions on the left, the selection summary on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-2) var(--tc-space-2);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__bulk { display: flex; align-items: center; gap: var(--tc-space-0-5); min-width: 0; padding-left: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__bulk > span { margin-right: var(--tc-space-2); font-weight: var(--tc-font-weight-medium); white-space: nowrap; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md) 0 8px;
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add svg { color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add:not(:has(svg)) { padding: 0 var(--tc-control-px-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add:hover svg { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger,
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger svg,
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger:hover svg { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__summary {
  min-width: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-muted);
}
@keyframes ui-dt-drop {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table tbody tr,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check svg,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__sort { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__picker { animation: none; }
}
/* Height changes glide instead of jumping */
.ui-dt__morph { overflow: hidden; }
.ui-dt__morph[data-smooth] { transition: height var(--tc-duration-slower) var(--tc-ease-move); }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-dt__morph[data-smooth] { transition: none; }
}
/* Narrow screens: tighter sides, the hint in the last row gives way first */
@media (max-width: 480px) {
:where([data-look="clean"], [data-look="clean"] *).ui-dt__head { padding-left: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__foot { padding-right: var(--tc-space-3-5); }
}
/* Touch screens: bigger tap targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__option { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check::after { content: ""; position: absolute; inset: -12px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dt"] *,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dt"] *::before,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dt"] *::after { animation: none !important; transition: none !important; }
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
[data-ui="dt"] input:not([type="checkbox"]):not([type="radio"]):focus-visible,
[data-ui="dt"] textarea:focus-visible,
[data-ui="dt"] [contenteditable]:focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-data-table")) customElements.define("tc-data-table", TcDataTable);

declare global {
  interface HTMLElementTagNameMap {
    "tc-data-table": TcDataTable;
  }
  interface HTMLElementEventMap {
    "tc-rows-change": CustomEvent<{ rows: DataRow[] }>;
    "tc-selection-change": CustomEvent<{ selection: string[] }>;
    "tc-sort-change": CustomEvent<{ sort: DataSort }>;
  }
}
