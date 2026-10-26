"use client";

/*
 * Data Table – a database-style table that works like a small spreadsheet, in a single self-contained file.
 * Select a cell or a range, edit in place, copy and paste with Excel or Sheets, undo, sort, and check rows.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: data-table.tsx is Standard,
 * data-table-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows; title, table and
 * actions all sit inside it, with quiet gray type, hairline row dividers, tinted tags (also in the tag picker)
 * and a soft blue fill for selections. Its icons are 16px with thin 1.1px lines.
 */
// Generated from src/components/data-table.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-dt";

export type DataColumn = {
  key: string;
  label: string;
  icon?: ReactNode;
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
  /** Small logo in front of the title cell */
  logo?: ReactNode;
  [key: string]: ReactNode;
};

export type TagTone = "blue" | "violet" | "pink" | "green" | "amber" | "gray";

/** Sorted column and direction, or null for the rows' own order */
export type DataSort = { key: string; dir: "asc" | "desc" } | null;

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in data-table.tsx, Clean in data-table-clean.tsx */
  look?: Look;
  title: string;
  /** Icon in front of the title */
  icon?: ReactNode;
  columns: DataColumn[];
  /**
   * The rows (controlled): the table shows these and asks for edits through `onRowsChange`, so keep them in state
   * and pass them back. Later updates (server data, realtime) show up as they arrive. Use `defaultRows` instead to
   * let the table keep its own copy.
   */
  rows?: DataRow[];
  /** Starting rows when `rows` isn't controlled */
  defaultRows?: DataRow[];
  /** Called with all rows after every edit, paste, clear, delete, undo or redo */
  onRowsChange?: (rows: DataRow[]) => void;
  /** Ids of the checked rows (controlled) */
  selection?: string[];
  /** Starting checked ids when `selection` isn't controlled */
  defaultSelection?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Sort (controlled); null shows the rows in their own order */
  sort?: DataSort;
  defaultSort?: DataSort;
  onSortChange?: (sort: DataSort) => void;
  /** Tag colors by tag text – falls back to blue */
  tagTones?: Record<string, TagTone>;
  /** false turns the table read only (selection and copy still work) */
  editable?: boolean;
  className?: string;
  ref?: Ref<HTMLElement>;
};

export type DataTableProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

type Cell = { r: number; c: number };
const NO_ROWS: DataRow[] = [];
const NO_IDS: string[] = [];

const text = (v: ReactNode) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
const letter = (c: number) => String.fromCharCode(65 + (c % 26));
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Reads typed or pasted text for a column: numbers accept commas, spaces and currency signs */
function parse(value: string, column: DataColumn): string | number {
  const v = value.trim();
  if (column.type !== "number") return v;
  if (v === "") return "";
  const n = Number(v.replace(/[^\d.,-]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : v;
}

const NO_TONES: Record<string, TagTone> = {};
/** Above this many rows only the ones near the viewport are rendered – low, so a 100–200 row table mounts fast too */
const VIRTUAL_FROM = 60;
/** Rows rendered beyond the viewport on each side; the window moves in steps of this many, so scrolling renders rarely */
const OVERSCAN = 12;

/** Undo history: lives in a ref so fast key repeats see the latest stack; its sizes are state so the buttons update */
function useRowHistory(rows: DataRow[], setRows: (next: (prev: DataRow[]) => DataRow[]) => void) {
  const history = useRef<{ past: DataRow[][]; future: DataRow[][] }>({ past: [], future: [] });
  const [size, setSize] = useState({ past: 0, future: 0 });
  const sync = () => setSize({ past: history.current.past.length, future: history.current.future.length });
  // The rows this table last produced – anything else arriving through `rows` came from outside and ends the history
  const ownRows = useRef(rows);
  useEffect(() => {
    if (rows === ownRows.current) return;
    ownRows.current = rows;
    history.current = { past: [], future: [] };
    setSize({ past: 0, future: 0 });
  }, [rows]);

  /** Every data change goes through here so it can be undone; it works on the latest rows, not this render's */
  const commitRows = (change: (prev: DataRow[]) => DataRow[]) => {
    setRows((prev) => {
      const next = change(prev);
      if (next === prev) return prev;
      history.current.past.push(prev);
      if (history.current.past.length > 100) history.current.past.shift();
      history.current.future = [];
      ownRows.current = next;
      return next;
    });
    sync();
  };
  /** Steps through the history: takes a snapshot off one stack and puts the latest rows on the other */
  const step = (from: "past" | "future") => {
    const snapshot = history.current[from].pop();
    if (!snapshot) return;
    setRows((prev) => {
      history.current[from === "past" ? "future" : "past"].push(prev);
      ownRows.current = snapshot;
      return snapshot;
    });
    sync();
  };
  return { size, commitRows, undo: () => step("past"), redo: () => step("future") };
}

/**
 * The rows to render: all of them up to VIRTUAL_FROM, beyond that the ones near the viewport (the page scrolls the
 * table, so the window follows any scroll, read once a frame) plus the active row's neighbourhood
 */
function useRowWindow(count: number, gridRef: { current: HTMLElement | null }, look: Look) {
  const virtual = count > VIRTUAL_FROM;
  const [win, setWin] = useState({ start: 0, end: 3 * OVERSCAN });
  const rowH = useRef(look === "clean" ? 40 : 44);
  const place = (first: number, last: number) => {
    const start = Math.max(0, Math.floor(first / OVERSCAN) * OVERSCAN - OVERSCAN);
    const end = Math.min(count, Math.ceil(last / OVERSCAN) * OVERSCAN + OVERSCAN);
    setWin((w) => (w.start === start && w.end === end ? w : { start, end }));
  };
  const latest = useRef(place);
  useLayoutEffect(() => {
    latest.current = place;
  });
  useLayoutEffect(() => {
    if (!virtual) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const grid = gridRef.current;
      const body = grid?.querySelector("tbody");
      if (!grid || !body) return;
      // Reads first, then one state update
      const row = body.querySelector<HTMLElement>("tr[aria-rowindex]");
      const top = body.getBoundingClientRect().top;
      const h = row?.offsetHeight || rowH.current;
      rowH.current = h;
      const first = Math.floor(-top / h);
      const last = Math.ceil((window.innerHeight - top) / h);
      latest.current(Math.max(0, first), Math.max(0, last));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [virtual, count, gridRef]);
  const start = virtual ? Math.min(win.start, Math.max(0, count - 1)) : 0;
  const end = virtual ? Math.min(count, Math.max(win.end, start + 1)) : count;
  /** Centre the window on a row that is out of it, e.g. one the keyboard jumped to */
  const reveal = (r: number) => place(r - OVERSCAN, r + OVERSCAN);
  return { virtual, start, end, rowH: rowH.current, reveal };
}

/** What a row's cells are doing – one row of the table, re-rendered only when its own data or selection changes */
type RowProps = {
  row: DataRow;
  r: number;
  columns: DataColumn[];
  look: Look;
  titleKey: string;
  checked: boolean;
  /** Column of the active cell in this row, or -1 */
  activeC: number;
  /** Columns of the selected range in this row, or -1 / -2 when the row is outside it */
  c1: number;
  c2: number;
  /** Column being edited in this row, or -1, with its draft and tag choices */
  editC: number;
  editValue?: string;
  editOptions?: string[];
  editableCols: boolean[];
  tones: Record<string, TagTone>;
  /** Prefix of the cell ids the grid's aria-activedescendant points at */
  idBase: string;
  api: RowApi;
};
type RowApi = {
  pointerDown: (e: ReactPointerEvent<HTMLTableCellElement>, cell: Cell, isEditing: boolean) => void;
  pointerEnter: (cell: Cell) => void;
  startEdit: (cell: Cell) => void;
  toggle: (id: string) => void;
  editChange: (value: string) => void;
  editDone: (save: boolean, cell: Cell, move?: "down" | "right", picked?: string) => void;
};

/** The id of a cell, for the grid's aria-activedescendant */
const cellId = (base: string, r: number, c: number) => `${base}-${r}-${c}`;

const TableRow = memo(function TableRow({ row, r, columns, look, titleKey, checked, activeC, c1, c2, editC, editValue, editOptions, editableCols, tones, idBase, api }: RowProps) {
  return (
    <tr role="row" aria-rowindex={r + 2} data-selected={checked || undefined}>
      <td className="ui-dt__select" role="gridcell">
        <Checkbox look={look} checked={checked} label={`Select ${text(row[titleKey]) || "row"}`} onChange={() => api.toggle(row.id)} />
      </td>
      {columns.map((col, c) => {
        const isActive = activeC === c;
        const isEditing = editC === c;
        const selected = c >= c1 && c <= c2;
        return (
          <td
            key={col.key}
            id={cellId(idBase, r, c)}
            role="gridcell"
            data-cell={`${r}-${c}`}
            data-type={col.type}
            data-active={isActive || undefined}
            data-in-range={(selected && !isActive) || undefined}
            data-editing={isEditing || undefined}
            aria-selected={selected}
            aria-readonly={!editableCols[c] || undefined}
            onPointerDown={(e) => api.pointerDown(e, { r, c }, isEditing)}
            onPointerEnter={() => api.pointerEnter({ r, c })}
            onDoubleClick={() => api.startEdit({ r, c })}
          >
            {isEditing ? (
              <Editor
                look={look}
                column={col}
                value={editValue ?? ""}
                options={editOptions}
                tones={tones}
                onChange={api.editChange}
                onDone={(save, move, picked) => api.editDone(save, { r, c }, move, picked)}
              />
            ) : (
              <Value column={col} row={row} tone={tones} />
            )}
          </td>
        );
      })}
    </tr>
  );
});

function TableToolbar({ title, icon, editable, look, mod, canUndo, canRedo, onUndo, onRedo }: { title: string; icon?: ReactNode; editable: boolean; look: Look; mod: string; canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  return (
    <header className="ui-dt__head">
      {icon && <span className="ui-dt__title-icon">{icon}</span>}
      <h3 className="ui-dt__title">{title}</h3>
      {editable && (
        <div className="ui-dt__tools">
          <button type="button" className="ui-dt__tool" aria-label={`Undo (${mod} Z)`} title={`Undo · ${mod} Z`} disabled={!canUndo} onClick={onUndo}>
            <UndoIcon look={look} />
          </button>
          <button type="button" className="ui-dt__tool" aria-label={`Redo (${mod} Shift Z)`} title={`Redo · ${mod} ⇧ Z`} disabled={!canRedo} onClick={onRedo}>
            <RedoIcon look={look} />
          </button>
        </div>
      )}
    </header>
  );
}

type FooterProps = { look: Look; editable: boolean; checkedCount: number; summary: string | null; announce: string; onDelete: () => void; onClear: () => void; onAdd: () => void };

function TableFooter({ look, editable, checkedCount, summary, announce, onDelete, onClear, onAdd }: FooterProps) {
  return (
    <footer className="ui-dt__foot">
      {/* Mounted from the start, so changes are announced: the checked count and multi-cell range sums only */}
      <span className="ui-dt__sr" role="status">
        {announce}
      </span>
      {checkedCount > 0 ? (
        <div className="ui-dt__bulk">
          <span>{checkedCount} selected</span>
          {editable && (
            <button type="button" className="ui-dt__add ui-dt__add--danger" onClick={onDelete}>
              <TrashIcon look={look} />
              Delete
            </button>
          )}
          <button type="button" className="ui-dt__add" onClick={onClear}>
            Clear
          </button>
        </div>
      ) : editable ? (
        <button type="button" className="ui-dt__add" onClick={onAdd}>
          <PlusIcon look={look} />
          Add row
        </button>
      ) : (
        <span />
      )}
      <span className="ui-dt__summary" title={summary ?? undefined}>
        {summary ?? (editable ? "Double-click or press Enter to edit" : "")}
      </span>
    </footer>
  );
}

type Range = { r1: number; r2: number; c1: number; c2: number };

/** The status bar: the active cell, or count and sum for a range – like a spreadsheet's */
function rangeSummary(range: Range | null, active: Cell | null, view: DataRow[], columns: DataColumn[]) {
  if (!range || !active) return null;
  const cells = (range.r2 - range.r1 + 1) * (range.c2 - range.c1 + 1);
  if (cells === 1) return `${letter(active.c)}${active.r + 1}`;
  let filled = 0;
  let sum = 0;
  let numeric = false;
  for (let r = range.r1; r <= range.r2; r++)
    for (let c = range.c1; c <= range.c2; c++) {
      const v = view[r]?.[columns[c].key];
      if (text(v) !== "") filled++;
      if (columns[c].type === "number" && typeof v === "number") {
        numeric = true;
        sum += v;
      }
    }
  return `${filled} ${filled === 1 ? "value" : "values"}${numeric ? ` · Sum ${sum.toLocaleString("en-US")}` : ""}`;
}

const blankBlock = (range: Range, fill = "") => Array.from({ length: range.r2 - range.r1 + 1 }, () => Array.from({ length: range.c2 - range.c1 + 1 }, () => fill));

/** The active cell and the anchor of a range; `sel` has the latest of both at once – keys can come faster than renders */
function useCellSelection() {
  const [active, setActiveState] = useState<Cell | null>(null);
  const [anchor, setAnchorState] = useState<Cell | null>(null);
  const sel = useRef<{ active: Cell | null; anchor: Cell | null }>({ active: null, anchor: null });
  const setActive = (cell: Cell | null) => {
    sel.current.active = cell;
    setActiveState(cell);
  };
  const setAnchor = (cell: Cell | null) => {
    sel.current.anchor = cell;
    setAnchorState(cell);
  };
  const range = useMemo<Range | null>(() => {
    if (!active) return null;
    const a = anchor ?? active;
    return { r1: Math.min(a.r, active.r), r2: Math.max(a.r, active.r), c1: Math.min(a.c, active.c), c2: Math.max(a.c, active.c) };
  }, [active, anchor]);
  return { active, setActive, setAnchor, sel, range };
}

type GridKeyContext = {
  editing: boolean;
  rows: number;
  columns: DataColumn[];
  /** The rendered link in a cell, if any */
  linkAt: (cell: Cell) => HTMLAnchorElement | null;
  sel: { active: Cell | null; anchor: Cell | null };
  range: Range | null;
  undo: () => void;
  redo: () => void;
  select: (cell: Cell, extend?: boolean) => void;
  startEdit: (cell: Cell, initial?: string) => void;
  setAnchor: (cell: Cell | null) => void;
  setActive: (cell: Cell | null) => void;
  writeBlock: (start: Cell, matrix: string[][]) => void;
};

/** The grid's keys: arrows (with Shift to extend, ⌘/Ctrl to jump), Enter/F2 to edit, typing to replace, Delete, undo/redo */
function gridKey(e: KeyboardEvent, { editing, rows, columns, linkAt, sel, range, undo, redo, select, startEdit, setAnchor, setActive, writeBlock }: GridKeyContext) {
  if (editing || e.nativeEvent.isComposing) return;
  // Keys bubbling up from the sort buttons, checkboxes or links inside the grid are theirs – Enter/Space work as usual
  const owner = (e.target as HTMLElement).closest("button, a[href], input, select, textarea, [contenteditable], [tabindex]");
  if (owner && owner !== e.currentTarget) return;
  const mod = isMac() ? e.metaKey : e.ctrlKey;
  if (mod && e.key.toLowerCase() === "z") {
    e.preventDefault();
    return e.shiftKey ? redo() : undo();
  }
  if (mod && e.key.toLowerCase() === "y") {
    e.preventDefault();
    return redo();
  }
  if (mod && e.key.toLowerCase() === "a") {
    e.preventDefault();
    setAnchor({ r: 0, c: 0 });
    setActive({ r: rows - 1, c: columns.length - 1 });
    return;
  }
  const current = sel.active;
  if (!current) {
    if (e.key.startsWith("Arrow") || e.key === "Enter") {
      e.preventDefault();
      select({ r: 0, c: 0 });
    }
    return;
  }
  const { r, c } = current;
  const jump = mod;
  const moves: Record<string, Cell> = {
    ArrowUp: { r: jump ? 0 : r - 1, c },
    ArrowDown: { r: jump ? rows - 1 : r + 1, c },
    ArrowLeft: { r, c: jump ? 0 : c - 1 },
    ArrowRight: { r, c: jump ? columns.length - 1 : c + 1 },
    Home: { r: mod ? 0 : r, c: 0 },
    End: { r: mod ? rows - 1 : r, c: columns.length - 1 },
  };
  if (moves[e.key]) {
    e.preventDefault();
    return select(moves[e.key], e.shiftKey);
  }
  // Tab and Shift+Tab are left alone: they move focus out of the grid (ARIA grid pattern, WCAG 2.1.2)
  // A link cell: ⌘/Ctrl+Enter follows the link (Enter still edits), and so does Enter when the column is read only
  const link = e.key === "Enter" ? linkAt(current) : null;
  if (link && (mod || columns[c].editable === false)) {
    e.preventDefault();
    link.click();
    return;
  }
  if (e.key === "Enter" || e.key === "F2") {
    e.preventDefault();
    return startEdit(current);
  }
  if (e.key === "Escape") return setAnchor(null);
  if ((e.key === "Delete" || e.key === "Backspace") && range) {
    e.preventDefault();
    return writeBlock({ r: range.r1, c: range.c1 }, blankBlock(range));
  }
  // Typing a character starts editing with it, like a spreadsheet
  if (e.key.length === 1 && !mod && !e.altKey && columns[c].type !== "tag") {
    e.preventDefault();
    startEdit(current, e.key);
  }
}

/** Clipboard: tab separated values, the format Excel and Google Sheets use */
function clipboard({ editing, range, active, view, columns, writeBlock }: { editing: boolean; range: Range | null; active: Cell | null; view: DataRow[]; columns: DataColumn[]; writeBlock: (start: Cell, matrix: string[][]) => void }) {
  const rangeText = () => {
    if (!range) return "";
    return view
      .slice(range.r1, range.r2 + 1)
      .map((row) =>
        columns
          .slice(range.c1, range.c2 + 1)
          .map((col) => text(row[col.key]).replace(/[\t\n]/g, " "))
          .join("\t"),
      )
      .join("\n");
  };
  const onCopy = (e: ClipboardEvent) => {
    if (editing || !range) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", rangeText());
  };
  const onCut = (e: ClipboardEvent) => {
    if (editing || !range) return;
    onCopy(e);
    writeBlock({ r: range.r1, c: range.c1 }, blankBlock(range));
  };
  const onPaste = (e: ClipboardEvent) => {
    if (editing || !active) return;
    e.preventDefault();
    const raw = e.clipboardData.getData("text/plain").replace(/\r/g, "").replace(/\n$/, "");
    if (!raw) return;
    const matrix = raw.split("\n").map((line) => line.split("\t"));
    // One value pasted into a range fills the whole range
    if (matrix.length === 1 && matrix[0].length === 1 && range) return writeBlock({ r: range.r1, c: range.c1 }, blankBlock(range, matrix[0][0]));
    writeBlock(range ? { r: range.r1, c: range.c1 } : active, matrix);
  };
  return { onCopy, onCut, onPaste };
}

type HeadProps = { look: Look; columns: DataColumn[]; sort: DataSort; range: Range | null; all: boolean; some: boolean; onToggleAll: () => void; onSort: (key: string) => void };

function TableHead({ look, columns, sort, range, all, some, onToggleAll, onSort }: HeadProps) {
  return (
    <thead>
      <tr role="row" aria-rowindex={1}>
        <th className="ui-dt__select" role="columnheader">
          <Checkbox look={look} checked={all} mixed={some} label="Select all rows" onChange={onToggleAll} />
        </th>
        {columns.map((col, c) => {
          const dir = sort?.key === col.key ? sort.dir : null;
          return (
            <th
              key={col.key}
              role="columnheader"
              aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
              data-type={col.type}
              data-col-active={(range && c >= range.c1 && c <= range.c2) || undefined}
            >
              <button type="button" className="ui-dt__th" onClick={() => onSort(col.key)}>
                {col.icon && <span className="ui-dt__col-icon">{col.icon}</span>}
                <span className="ui-dt__th-label">{col.label}</span>
                <span className="ui-dt__sort" data-dir={dir ?? undefined} aria-hidden="true">
                  <SortIcon look={look} />
                </span>
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function DataTable({
  look,
  title,
  icon,
  columns,
  rows: rowsProp,
  defaultRows = NO_ROWS,
  onRowsChange,
  selection: selectionProp,
  defaultSelection = NO_IDS,
  onSelectionChange,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  tagTones = NO_TONES,
  editable = true,
  className,
  ref,
  ...rest
}: DataTableProps) {
  const [rows, setRows] = useControllable(rowsProp, defaultRows, onRowsChange);
  const [selection, setSelection] = useControllable(selectionProp, defaultSelection, onSelectionChange);
  const checked = useMemo(() => new Set(selection), [selection]);
  const [sort, setSort] = useControllable<DataSort>(sortProp, defaultSort, onSortChange);
  const { size: historySize, commitRows, undo, redo } = useRowHistory(rows, setRows);
  // ⌘ or Ctrl in the shortcut hints – read after mount, so server and client render the same first
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(isMac()), []);
  const { active, setActive, setAnchor, sel, range } = useCellSelection();
  const [editing, setEditing] = useState<{ cell: Cell; value: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const morphRef = useSmoothHeight(gridRef);
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const idBase = `ui-dt${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // Delete / Clear remove the bulk bar, Undo / Redo disable themselves: focus goes to the grid, never to <body>
  useFocusRescue(rootRef, { fallback: () => gridRef.current });
  const added = useRef(0);
  const resolvedLook = look ?? DEFAULT_LOOK;

  // Rows as shown: sorted copy of the data, positions refer to this order
  const view = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (text(x) === "") return 1;
      if (text(y) === "") return -1;
      if (col?.type === "number") return (Number(x) - Number(y)) * dir;
      return text(x).localeCompare(text(y), undefined, { numeric: true }) * dir;
    });
  }, [rows, sort, columns]);
  const rowWindow = useRowWindow(view.length, gridRef, resolvedLook);

  const editableCols = useMemo(() => columns.map((col) => editable && col.editable !== false), [columns, editable]);
  const canEdit = (c: number) => !!editableCols[c];
  const titleKey = columns.find((x) => x.type === "title")?.key ?? columns[0].key;

  /** Write values into a block of cells, starting at a cell – used by edit, paste and clear */
  const writeBlock = (start: Cell, matrix: string[][]) => {
    const updates = new Map<string, Record<string, string | number>>();
    matrix.forEach((line, dr) =>
      line.forEach((value, dc) => {
        const row = view[start.r + dr];
        const c = start.c + dc;
        const col = columns[c];
        if (!row || !col || !canEdit(c)) return;
        updates.set(row.id, { ...updates.get(row.id), [col.key]: parse(value, col) });
      }),
    );
    if (updates.size) commitRows((prev) => prev.map((row) => (updates.has(row.id) ? { ...row, ...updates.get(row.id) } : row)));
  };

  const select = (cell: Cell, extend = false) => {
    const r = Math.max(0, Math.min(view.length - 1, cell.r));
    const c = Math.max(0, Math.min(columns.length - 1, cell.c));
    if (!extend) setAnchor(null);
    else if (!sel.current.anchor) setAnchor(sel.current.active ?? { r, c });
    setActive({ r, c });
  };

  const startEdit = (cell: Cell, initial?: string) => {
    if (!canEdit(cell.c) || !view[cell.r]) return;
    setEditing({ cell, value: initial ?? text(view[cell.r][columns[cell.c].key]) });
  };
  const finishEdit = (save: boolean, move?: Cell, picked?: string) => {
    if (editing && save) {
      const value = picked ?? editing.value;
      const current = text(view[editing.cell.r]?.[columns[editing.cell.c].key]);
      if (value !== current) writeBlock(editing.cell, [[value]]);
    }
    setEditing(null);
    if (move) select(move);
    requestAnimationFrame(() => gridRef.current?.focus({ preventScroll: true }));
  };

  // Keep the active cell in view while moving with the keyboard – first bringing its row into the rendered window
  const revealing = useRef(false);
  useEffect(() => {
    revealing.current = !!active;
  }, [active]);
  useEffect(() => {
    if (!active || !revealing.current) return;
    if (active.r < rowWindow.start || active.r >= rowWindow.end) return rowWindow.reveal(active.r);
    revealing.current = false;
    gridRef.current?.querySelector(`[data-cell="${active.r}-${active.c}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active, rowWindow.start, rowWindow.end]); // eslint-disable-line react-hooks/exhaustive-deps -- reveal reads the latest window itself

  // A drag selection ends wherever the pointer is released
  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, [dragging]);

  const onKeyDown = (e: KeyboardEvent) =>
    gridKey(e, {
      editing: !!editing,
      rows: view.length,
      columns,
      linkAt: (cell) => gridRef.current?.querySelector<HTMLAnchorElement>(`[data-cell="${cell.r}-${cell.c}"] a[href]`) ?? null,
      sel: sel.current,
      range,
      undo,
      redo,
      select,
      startEdit,
      setAnchor,
      setActive,
      writeBlock,
    });

  const { onCopy, onCut, onPaste } = clipboard({ editing: !!editing, range, active, view, columns, writeBlock });

  const toggleSort = (key: string) => setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  const updateChecked = (next: Set<string>) => setSelection(rows.filter((r) => next.has(r.id)).map((r) => r.id));
  // Checked rows that are on the table – ids of rows that left don't count
  const checkedCount = view.reduce((n, r) => n + (checked.has(r.id) ? 1 : 0), 0);
  const all = view.length > 0 && checkedCount === view.length;
  const some = checkedCount > 0 && !all;

  const addRow = () => {
    added.current += 1;
    const row: DataRow = { id: `new-${added.current}`, [titleKey]: "" };
    let index = rows.length;
    commitRows((prev) => {
      index = prev.length;
      return [...prev, row];
    });
    setSort(null);
    const cell = { r: index, c: Math.max(0, columns.findIndex((c) => c.key === titleKey)) };
    setActive(cell);
    setAnchor(null);
    setEditing({ cell, value: "" });
  };

  /** The bulk bar is about to go: focus moves to the grid first */
  const leaveBulk = () => rescueFocus(rootRef.current?.querySelector(".ui-dt__bulk"), [gridRef.current]);
  const deleteChecked = () => {
    leaveBulk();
    commitRows((prev) => prev.filter((r) => !checked.has(r.id)));
    updateChecked(new Set());
    setActive(null);
    setAnchor(null);
  };

  const tagOptions = (col: DataColumn) => col.options ?? [...new Set(rows.map((r) => text(r[col.key])).filter(Boolean))];

  // Rows take their handlers from here: one stable object, so a row re-renders only when its own props change
  const handlers = useRef<RowApi | null>(null);
  handlers.current = {
    pointerDown: (e, cell, isEditing) => {
      if (isEditing || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("a")) return;
      e.preventDefault();
      gridRef.current?.focus({ preventScroll: true });
      if (editing) finishEdit(true);
      select(cell, e.shiftKey);
      setDragging(true);
    },
    pointerEnter: (cell) => {
      if (!dragging) return;
      if (!sel.current.anchor) setAnchor(sel.current.active);
      setActive(cell);
    },
    startEdit: (cell) => startEdit(cell),
    toggle: (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      updateChecked(next);
    },
    editChange: (value) => setEditing((e) => e && { cell: e.cell, value }),
    editDone: (save, { r, c }, move, picked) => finishEdit(save, move ? { r: r + (move === "down" ? 1 : 0), c: c + (move === "right" ? 1 : 0) } : undefined, picked),
  };
  const api = useMemo<RowApi>(
    () => ({
      pointerDown: (...a) => handlers.current!.pointerDown(...a),
      pointerEnter: (...a) => handlers.current!.pointerEnter(...a),
      startEdit: (...a) => handlers.current!.startEdit(...a),
      toggle: (...a) => handlers.current!.toggle(...a),
      editChange: (...a) => handlers.current!.editChange(...a),
      editDone: (...a) => handlers.current!.editDone(...a),
    }),
    [],
  );

  const mod = mac ? "⌘" : "Ctrl";
  const { start, end, rowH } = rowWindow;
  // Screen readers hear the active cell: focus stays on the grid, which points at the cell (only once it is rendered)
  const activeId = active && !editing && active.r >= start && active.r < end ? cellId(idBase, active.r, active.c) : undefined;
  const summary = rangeSummary(range, active, view, columns);
  const multiCell = !!range && (range.r2 > range.r1 || range.c2 > range.c1);
  const announce = [checkedCount > 0 ? `${checkedCount} ${checkedCount === 1 ? "row" : "rows"} selected` : "", multiCell ? (summary ?? "") : ""].filter(Boolean).join(". ");
  const spacer = (n: number) =>
    n > 0 && (
      <tr className="ui-dt__spacer" aria-hidden="true">
        <td colSpan={columns.length + 1} style={{ height: n * rowH, padding: 0, border: 0 }} />
      </tr>
    );

  return (
    <>
      <style href="ui-data-table" precedence="default">
        {css}
      </style>
      <section aria-label={title} {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook}>
        <TableToolbar title={title} icon={icon} editable={editable} look={resolvedLook} mod={mod} canUndo={!!historySize.past} canRedo={!!historySize.future} onUndo={undo} onRedo={redo} />

        {/* Standard: a white card on the tray · Clean: the body of the one card */}
        <div className={resolvedLook === "clean" ? "ui-dt__body" : "ui-dt__card"}>
          <div className="ui-dt__morph" ref={morphRef}>
            <div
              ref={gridRef}
              className="ui-dt__scroll"
              role="grid"
              aria-label={title}
              aria-rowcount={view.length + 1}
              aria-multiselectable="true"
              aria-activedescendant={activeId}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onCopy={onCopy}
              onCut={onCut}
              onPaste={onPaste}
              data-dragging={dragging || undefined}
            >
              <table className="ui-dt__table" role="presentation">
                <colgroup>
                  <col style={{ width: resolvedLook === "clean" ? 40 : 44 }} />
                  {columns.map((c) => (
                    <col key={c.key} style={c.width ? { width: c.width } : undefined} />
                  ))}
                </colgroup>
                <TableHead
                  look={resolvedLook}
                  columns={columns}
                  sort={sort}
                  range={range}
                  all={all}
                  some={some}
                  onToggleAll={() => updateChecked(all ? new Set() : new Set(view.map((r) => r.id)))}
                  onSort={toggleSort}
                />
                <tbody>
                  {spacer(start)}
                  {view.slice(start, end).map((row, i) => {
                    const r = start + i;
                    const inRows = !!range && r >= range.r1 && r <= range.r2;
                    const isEditRow = editing?.cell.r === r;
                    const editCol = isEditRow ? columns[editing.cell.c] : undefined;
                    return (
                      <TableRow
                        key={row.id}
                        row={row}
                        r={r}
                        columns={columns}
                        look={resolvedLook}
                        titleKey={titleKey}
                        checked={checked.has(row.id)}
                        activeC={active?.r === r ? active.c : -1}
                        c1={inRows ? range.c1 : -1}
                        c2={inRows ? range.c2 : -2}
                        editC={isEditRow ? editing.cell.c : -1}
                        editValue={isEditRow ? editing.value : undefined}
                        editOptions={editCol?.type === "tag" ? tagOptions(editCol) : undefined}
                        editableCols={editableCols}
                        tones={tagTones}
                        idBase={idBase}
                        api={api}
                      />
                    );
                  })}
                  {spacer(view.length - end)}
                </tbody>
              </table>
              {view.length === 0 && <p className="ui-dt__empty">No rows yet</p>}
            </div>
          </div>
        </div>

        <TableFooter
          look={resolvedLook}
          editable={editable}
          checkedCount={checkedCount}
          summary={summary}
          announce={announce}
          onDelete={deleteChecked}
          onClear={() => {
            leaveBulk();
            updateChecked(new Set());
          }}
          onAdd={addRow}
        />
      </section>
    </>
  );
}

function Value({ column, row, tone }: { column: DataColumn; row: DataRow; tone: Record<string, TagTone> }) {
  const value = row[column.key];
  if (column.type === "title") {
    return (
      <span className="ui-dt__name">
        {row.logo ? <span className="ui-dt__logo">{row.logo}</span> : <span className="ui-dt__logo ui-dt__logo--empty" />}
        <span className="ui-dt__name-text" data-empty={text(value) === "" || undefined}>
          {text(value) || "Untitled"}
        </span>
      </span>
    );
  }
  if (text(value) === "") return null;
  if (column.type === "tag") {
    return (
      <span className="ui-dt__tag" data-tone={tone[text(value)] ?? "blue"}>
        {value}
      </span>
    );
  }
  if (column.type === "link") {
    const href = /^https?:\/\//.test(text(value)) ? text(value) : `https://${text(value)}`;
    return (
      <a className="ui-dt__link" href={href} target="_blank" rel="noreferrer" tabIndex={-1}>
        {text(value).replace(/^https?:\/\//, "")}
      </a>
    );
  }
  if (column.type === "number" && typeof value === "number") {
    return <span className="ui-dt__text">{value.toLocaleString("en-US")}</span>;
  }
  return <span className="ui-dt__text">{value}</span>;
}

/** In-place editor: a text field, or a list of choices for tag columns */
function Editor({
  look,
  column,
  value,
  options,
  tones = {},
  onChange,
  onDone,
}: {
  look: Look;
  column: DataColumn;
  value: string;
  options?: string[];
  tones?: Record<string, TagTone>;
  onChange: (value: string) => void;
  onDone: (save: boolean, move?: "down" | "right", picked?: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  if (options) return <TagPicker look={look} label={column.label} value={value} options={options} tones={tones} onChange={onChange} onDone={onDone} />;

  return (
    <input
      ref={ref}
      className="ui-dt__input"
      value={value}
      inputMode={column.type === "number" ? "decimal" : undefined}
      aria-label={column.label}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onDone(true)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          onDone(true, "down");
        } else if (e.key === "Tab") {
          e.preventDefault();
          onDone(true, "right");
        } else if (e.key === "Escape") {
          e.preventDefault();
          onDone(false);
        }
      }}
    />
  );
}

/**
 * Tag choices for a cell. Drawn in a fixed layer lined up with the cell, so neither the scrolling table nor the
 * rounded card can cut it off – it may overlap the gray footer (Clean: the last row of the card) or anything below. Opens upwards when there's
 * no room below, follows the cell on scroll and resize.
 */
function TagPicker({
  look,
  label,
  value,
  options,
  tones,
  onChange,
  onDone,
}: {
  look: Look;
  label: string;
  value: string;
  options: string[];
  tones: Record<string, TagTone>;
  onChange: (value: string) => void;
  onDone: (save: boolean, move?: "down" | "right", picked?: string) => void;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const clean = look === "clean";

  useLayoutEffect(() => {
    const place = () => {
      const cell = anchorRef.current?.closest("td");
      const menu = menuRef.current;
      if (!cell || !menu) return;
      const box = cell.getBoundingClientRect();
      const height = menu.offsetHeight;
      const below = window.innerHeight - box.top - 4;
      const top = below >= height + 8 ? box.top + 4 : Math.max(8, box.bottom - 4 - height);
      // A transformed or filtered ancestor moves where "fixed" starts – measure that origin and subtract it
      // (Clean only; Standard renders no origin marker and measures from the viewport)
      const origin = originRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
      setPos({ left: box.left + 6 - origin.left, top: top - origin.top, width: Math.max(box.width - 12, 160) });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, []);

  // A click anywhere else keeps the cell as it was
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onDone(false);
    };
    window.addEventListener("pointerdown", away, true);
    return () => window.removeEventListener("pointerdown", away, true);
  }, [onDone]);

  return (
    <span ref={anchorRef} className="ui-dt__picker-anchor">
      {clean && <span ref={originRef} className="ui-dt__picker-origin" aria-hidden="true" />}
      <div
        ref={menuRef}
        className="ui-dt__picker"
        role="listbox"
        aria-label={label}
        style={pos ? { left: pos.left, top: pos.top, minWidth: pos.width } : { visibility: "hidden" }}
      >
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="option"
            aria-selected={o === value}
            className="ui-dt__option"
            // One tab stop: arrows move between the choices, Tab closes the list and returns to the grid
            tabIndex={o === value || (!options.includes(value) && o === options[0]) ? 0 : -1}
            autoFocus={o === value || (!options.includes(value) && o === options[0])}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              onChange(o);
              onDone(true, undefined, o);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Tab") {
                e.preventDefault();
                return onDone(false);
              }
              const items = [...(e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
              const i = items.indexOf(e.currentTarget);
              if (e.key === "ArrowDown") items[Math.min(items.length - 1, i + 1)]?.focus();
              if (e.key === "ArrowUp") items[Math.max(0, i - 1)]?.focus();
              if (e.key === "Home") items[0]?.focus();
              if (e.key === "End") items[items.length - 1]?.focus();
              if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") e.preventDefault();
            }}
          >
            {/* The chosen one carries a check, not only a color */}
            {clean ? (
              <span className="ui-dt__tag" data-tone={tones[o] ?? "blue"}>
                {o}
              </span>
            ) : (
              <span className="ui-dt__option-label">{o}</span>
            )}
            <svg viewBox="0 0 16 16" className="ui-dt__option-check" aria-hidden="true">
              <path d="m4 8.25 2.6 2.6L12 5.25" />
            </svg>
          </button>
        ))}
      </div>
    </span>
  );
}

function Checkbox({
  look,
  checked,
  mixed,
  label,
  onChange,
}: {
  look: Look;
  checked: boolean;
  mixed?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      className="ui-dt__check"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onChange}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {look === "clean" ? (
          mixed ? <path d="M5 8h6" /> : <path d="m4.5 8.25 2.25 2.25L11.5 5.75" />
        ) : mixed ? (
          <path d="M4.5 8h7" />
        ) : (
          <path d="m4.25 8.25 2.5 2.5 5-5.5" />
        )}
      </svg>
    </button>
  );
}

/* ---------- Icons ---------- */
// Standard: 11–15px with 1.3–1.5px lines · Clean: 16px (column icons 14px, sort 12px), thin 1.1px lines with round caps

type IconProps = { look: Look };

const line = (d: string, size = 16) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const PlusIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    line("M8 3.5v9M3.5 8h9")
  ) : (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
const TrashIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    line("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5")
  ) : (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
    </svg>
  );
const UndoIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    line("M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a3.5 3.5 0 0 1 0 7H7")
  ) : (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 3.5 2.5 6.5l3 3M2.5 6.5h7a4 4 0 0 1 0 8H7" />
    </svg>
  );
const RedoIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    line("m10.5 3.5 3 3-3 3M13.5 6.5h-7a3.5 3.5 0 0 0 0 7H9")
  ) : (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m10.5 3.5 3 3-3 3M13.5 6.5h-7a4 4 0 0 0 0 8H9" />
    </svg>
  );
const SortIcon = ({ look }: IconProps) =>
  look === "clean" ? (
    line("M8 3.5v9M5 9.5l3 3 3-3", 12)
  ) : (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2.5v7M3.5 7l2.5 2.5L8.5 7" />
    </svg>
  );

const col = (look: Look, d: string) =>
  look === "clean" ? (
    line(d, 14)
  ) : (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
/** Column icons for your column definitions. `look` defaults to the file's look */
type ColumnIconProps = { look?: Look };
export const TextColumnIcon = ({ look = DEFAULT_LOOK }: ColumnIconProps) => col(look, "M3 4h10M3 7h10M3 10h10M3 13h6");
export const TagColumnIcon = ({ look = DEFAULT_LOOK }: ColumnIconProps) => col(look, "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z");
export const LinkColumnIcon = ({ look = DEFAULT_LOOK }: ColumnIconProps) => col(look, "M6.5 9.5l3-3M7.25 4.75l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M8.75 11.25l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1");
export const NumberColumnIcon = ({ look = DEFAULT_LOOK }: ColumnIconProps) => col(look, "M6 2.5 4.5 13.5M11.5 2.5 10 13.5M2.5 6h11M2 10.5h11");
export const DateColumnIcon = ({ look = DEFAULT_LOOK }: ColumnIconProps) => col(look, "M3 4.5h10v9H3zM3 7.5h10M6 2.5v3M10 2.5v3");

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

/** The outer box follows the inner box's height, with a transition after the first frame */
function useSmoothHeight(inner: RefObject<HTMLElement | null>) {
  const outer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const sync = () => {
      o.style.height = `${i.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(i);
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [inner]);
  return outer;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-dt:where([data-look="standard"]),
.ui-dt__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-border-control: light-dark(#858585, #7c7c82);
  --_tc-border-control-hover: light-dark(#646464, #9a9aa1);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-border-subtle: light-dark(#f0f0f0, rgba(255, 255, 255, 0.06));
  --_tc-card-radius: 16px;
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-selected: light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-6: 24px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-info-bg: light-dark(#eaf1ff, #16243f);
  --_tc-status-info-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tone-amber-bg: light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.14));
  --_tc-tone-amber-fg: light-dark(#a35200, #ffa057);
  --_tc-tone-pink-bg: light-dark(rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.16));
  --_tc-tone-pink-fg: light-dark(#be185d, #f9a8d4);
  --_tc-tone-violet-bg: light-dark(rgba(105, 65, 198, 0.1), rgba(150, 110, 240, 0.16));
  --_tc-tone-violet-fg: light-dark(#6941c6, #b9a2f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-dt:where([data-look="clean"]),
.ui-dt__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-border-control: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-border-control-hover: light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-border-subtle: light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.05));
  --_tc-card-radius: 10px;
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-selected: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-6: 24px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-info-bg: light-dark(rgba(0, 143, 245, 0.1), rgba(0, 119, 255, 0.23));
  --_tc-status-info-fg: light-dark(#0058cf, #70b8ff);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tone-amber-bg: light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.13));
  --_tc-tone-amber-fg: light-dark(#a35200, #ffa057);
  --_tc-tone-pink-bg: light-dark(rgba(236, 72, 153, 0.08), rgba(244, 114, 182, 0.14));
  --_tc-tone-pink-fg: light-dark(#be185d, #f9a8d4);
  --_tc-tone-violet-bg: light-dark(rgba(91, 91, 214, 0.08), rgba(130, 120, 240, 0.15));
  --_tc-tone-violet-fg: light-dark(#5b45b8, #b7a6f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

:where([data-look="standard"], [data-look="standard"] *).ui-dt {
  /* The header of the column holding the active cell: a barely-there blue */
  --tc-data-table-header-bg-active: light-dark(#fafbff, rgba(47, 107, 255, 0.08));
  /* The active cell's frame while the table doesn't have focus */
  --tc-data-table-cell-border-inactive: light-dark(#a9c1ff, rgba(107, 149, 255, 0.55));
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* Like the Chat Composer: a gray tray with the title, the white table card sits on top of it */
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  /* The gray tray frames the white card on every side – the tray recipe */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-dt */
:where([data-look="clean"], [data-look="clean"] *).ui-dt {
  /* The active cell's frame while the table doesn't have focus */
  --tc-data-table-cell-border-inactive: light-dark(rgba(0, 96, 226, 0.35), rgba(77, 141, 255, 0.5));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  /* One white card – the edge is a shadow, not a border */
  overflow: hidden;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-dt *, .ui-dt *::before, .ui-dt *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4-5, var(--_tc-space-4-5));
  min-height: 46px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__title {
  margin: 0;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed));
  letter-spacing: -0.01em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__title-icon { display: grid; }
:where(.ui-dt[data-look="clean"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-dt[data-look="clean"]) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt button:focus-visible,
:where([data-look="clean"], [data-look="clean"] *).ui-dt a:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* Title row: icon, name, undo and redo */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  min-height: 52px;
  padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__title {
  margin: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__title-icon { display: grid; flex: none; }
.ui-dt__title-icon svg { width: 18px; height: 18px; }
.ui-dt__tools {
  display: flex;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  margin-left: auto;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: transparent;
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool:disabled { opacity: 0.35; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__tool:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__card {
  overflow: hidden;
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  border: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-border-default, var(--_tc-border-default));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md, var(--_tc-control-h-md));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__tool:disabled { opacity: 0.4; cursor: default; }
.ui-dt__scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  outline: none;
}
/* The grid has focus but no active cell yet: a ring on the grid (the active cell's frame takes over once there is one) */
.ui-dt__scroll:focus-visible:not(:has(td[data-active])) { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
.ui-dt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-dt__scroll[data-dragging] { cursor: cell; user-select: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
}
/* Every row is 44px high and the selection column 44px wide, so its cells are squares */
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td {
  position: relative;
  height: 44px;
  padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5));
  border-top: 1px solid var(--tc-border-subtle, var(--_tc-border-subtle));
  border-left: 1px solid var(--tc-border-subtle, var(--_tc-border-subtle));
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th:first-child,
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td:first-child { border-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th {
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  border-top: 0;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table th[data-col-active] { background: var(--tc-data-table-header-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: transparent;
  color: inherit !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__th-label { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__col-icon { display: grid; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
}
/* Rows are 40px high, divided by hairlines only – no vertical grid lines */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table th,
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td {
  position: relative;
  height: 40px;
  padding: 0 var(--tc-space-3, var(--_tc-space-3));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Header row: 12px gray labels under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table th {
  height: 36px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table th[data-col-active] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  width: 100%;
  height: 28px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  text-align: left;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__th-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__col-icon { display: grid; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-dt__sort {
  display: grid;
  margin-left: auto;
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-dt__th:hover .ui-dt__sort { opacity: 1; }
.ui-dt__sort[data-dir] { opacity: 1; color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-dt__sort[data-dir="asc"] { transform: rotate(180deg); }
/* Selection column: one checkbox per row, centered */
.ui-dt__table .ui-dt__select { padding: 0; text-align: center; }
.ui-dt__select .ui-dt__check { margin: 0 auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table tbody tr { transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table tbody tr { transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-dt__table tbody tr:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
.ui-dt__table tbody tr[data-selected] { background: var(--tc-fill-selected, var(--_tc-fill-selected)); }
/* Cell selection: a blue frame on the active cell, a soft tint on the rest of the range */
.ui-dt__table td[data-cell] { cursor: cell; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td[data-in-range] { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td[data-active]::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid var(--tc-accent, var(--_tc-accent));
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__scroll:not(:focus-within) td[data-active]::after { border-color: var(--tc-data-table-cell-border-inactive); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__table td[data-editing] {
  padding: 0;
  overflow: visible;
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__input {
  width: 100%;
  height: 100%;
  padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5));
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td[data-in-range] { background: var(--tc-fill-selected, var(--_tc-fill-selected)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td[data-active]::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  box-shadow: inset 0 0 0 1.5px var(--tc-accent-text, var(--_tc-accent-text));
  pointer-events: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__scroll:not(:focus-within) td[data-active]::after { box-shadow: inset 0 0 0 1px var(--tc-data-table-cell-border-inactive); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__table td[data-editing] { padding: 0; overflow: visible; background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__input {
  width: 100%;
  height: 100%;
  padding: 0 var(--tc-space-3, var(--_tc-space-3));
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  caret-color: var(--tc-accent-text, var(--_tc-accent-text));
}
.ui-dt__table td[data-type="number"] .ui-dt__input { font-variant-numeric: tabular-nums; }
/* Tag picker: a fixed layer lined up with the cell, above the card and the gray footer */
.ui-dt__picker-anchor { display: block; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__picker {
  position: fixed;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-dt-drop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border: 0;
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  background: transparent;
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size)) !important;
  text-align: left;
  color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important;
}
.ui-dt__option:hover { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)) !important; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
/* The focused choice gets a real ring (a hover fill alone was 1.09:1) */
.ui-dt__option:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
.ui-dt__option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__name {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__name-text { overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__name-text[data-empty] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
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
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-dt-drop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  text-align: left;
}
.ui-dt__option-check {
  width: 16px;
  height: 16px;
  fill: none;
  flex: none;
  stroke: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg));
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
}
.ui-dt__option[aria-selected="true"] .ui-dt__option-check { opacity: 1; }
/* Title cell: logo and name */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__name { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__name-text { overflow: hidden; text-overflow: ellipsis; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__name-text[data-empty] { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__logo { display: grid; place-items: center; flex: none; width: 16px; height: 16px; }
.ui-dt__logo svg { width: 100%; height: 100%; }
.ui-dt__logo--empty { border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check {
  display: grid;
  place-items: center;
  flex: none;
  position: relative;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--tc-border-control, var(--_tc-border-control));
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check:hover { border-color: var(--tc-border-control-hover, var(--_tc-border-control-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* A 24px hit area around the small box (2.5.8) */
.ui-dt__check::after { content: ""; position: absolute; inset: -5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-spring, var(--_tc-ease-spring));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check[aria-checked="true"],
:where([data-look="standard"], [data-look="standard"] *).ui-dt__check[aria-checked="mixed"] { background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); border-color: var(--tc-surface-inverse, var(--_tc-surface-inverse)); }
/* Checkboxes: 14px with a hairline, a dark chip when checked */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check {
  display: grid;
  place-items: center;
  flex: none;
  position: relative;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  /* The box's edge is its only cue: border-control (≥ 3:1) */
  box-shadow: inset 0 0 0 1px var(--tc-border-control, var(--_tc-border-control));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover, var(--_tc-border-control-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check:focus-visible { outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-spring, var(--_tc-ease-spring));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check[aria-checked="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-dt__check[aria-checked="mixed"] { background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); box-shadow: none; }
.ui-dt__check[aria-checked="true"] svg,
.ui-dt__check[aria-checked="mixed"] svg { opacity: 1; transform: none; }
/* Tags: soft fill with a hairline in the same hue */
:where([data-look="standard"], [data-look="standard"] *)/* Tags: the pill pattern (large size, for table text) in the status / tone colours – every fg ≥ 4.5:1 on its tint */
.ui-dt__tag {
  display: inline-block;
  max-width: 100%;
  height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  overflow: hidden;
  font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
  background: var(--tc-data-table-tag-bg);
  color: var(--tc-data-table-tag-fg);
}
.ui-dt__tag[data-tone="blue"] { --tc-data-table-tag-bg: var(--tc-status-info-bg, var(--_tc-status-info-bg)); --tc-data-table-tag-fg: var(--tc-status-info-fg, var(--_tc-status-info-fg)); }
.ui-dt__tag[data-tone="violet"] { --tc-data-table-tag-bg: var(--tc-tone-violet-bg, var(--_tc-tone-violet-bg)); --tc-data-table-tag-fg: var(--tc-tone-violet-fg, var(--_tc-tone-violet-fg)); }
.ui-dt__tag[data-tone="pink"] { --tc-data-table-tag-bg: var(--tc-tone-pink-bg, var(--_tc-tone-pink-bg)); --tc-data-table-tag-fg: var(--tc-tone-pink-fg, var(--_tc-tone-pink-fg)); }
.ui-dt__tag[data-tone="green"] { --tc-data-table-tag-bg: var(--tc-status-success-bg, var(--_tc-status-success-bg)); --tc-data-table-tag-fg: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-dt__tag[data-tone="amber"] { --tc-data-table-tag-bg: var(--tc-tone-amber-bg, var(--_tc-tone-amber-bg)); --tc-data-table-tag-fg: var(--tc-tone-amber-fg, var(--_tc-tone-amber-fg)); }
.ui-dt__tag[data-tone="gray"] { --tc-data-table-tag-bg: var(--tc-fill-default, var(--_tc-fill-default)); --tc-data-table-tag-fg: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__link {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-decoration: underline;
  text-decoration-color: var(--tc-border-strong, var(--_tc-border-strong));
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__link {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-decoration: underline;
  text-decoration-color: var(--tc-border-strong, var(--_tc-border-strong));
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-dt__link:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); text-decoration-color: currentColor; }
.ui-dt__text { color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__empty {
  margin: 0;
  padding: var(--tc-space-6, var(--_tc-space-6));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  text-align: center;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Gray extension under the card: add row or bulk actions on the left, the selection summary on the right */
:where([data-look="standard"], [data-look="standard"] *).ui-dt__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 44px;
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__bulk {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  padding-left: var(--tc-space-2-5, var(--_tc-space-2-5));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__bulk > span { margin-right: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: none;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add--danger { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add--danger:hover { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__add:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dt__summary {
  overflow: hidden;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__empty { margin: 0; padding: var(--tc-space-6, var(--_tc-space-6)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* The last row inside the card: add row or bulk actions on the left, the selection summary on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-dt__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 44px;
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__bulk { display: flex; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); min-width: 0; padding-left: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__bulk > span { margin-right: var(--tc-space-2, var(--_tc-space-2)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); white-space: nowrap; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 8px;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  white-space: nowrap;
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add:not(:has(svg)) { padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add:hover svg { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger,
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger svg,
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger:hover svg { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__add--danger:hover { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__summary {
  min-width: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-muted, var(--_tc-text-muted));
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
.ui-dt__morph[data-smooth] { transition: height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-dt__morph[data-smooth] { transition: none; }
}
/* Narrow screens: tighter sides, the hint in the last row gives way first */
@media (max-width: 480px) {
:where([data-look="clean"], [data-look="clean"] *).ui-dt__head { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dt__foot { padding-right: var(--tc-space-3-5, var(--_tc-space-3-5)); }
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
:where([data-look="clean"], [data-look="clean"] *).ui-dt *,
:where([data-look="clean"], [data-look="clean"] *).ui-dt *::before,
:where([data-look="clean"], [data-look="clean"] *).ui-dt *::after { animation: none !important; transition: none !important; }
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
.ui-dt input:not([type="checkbox"]):not([type="radio"]):focus-visible,
.ui-dt textarea:focus-visible,
.ui-dt [contenteditable]:focus-visible { outline: none; }
`;
