import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDataTable, type DataColumn as ElementColumn, type DataRow as ElementRow, type DataSort } from "../data-table";
import type { Look } from "../internal/look";
import { h, isNode, useControlled, useStaged } from "./internal";

export type DataColumn = Omit<ElementColumn, "icon"> & { icon?: React.ReactNode };
export type DataRow = { id: string; logo?: React.ReactNode | string; [key: string]: React.ReactNode | string | number | undefined };
export type { DataSort, TagTone } from "../data-table";

const RawDataTable = createComponent({
  tagName: "tc-data-table",
  elementClass: TcDataTable,
  react: React,
  events: {
    onTcRowsChange: "tc-rows-change" as EventName<CustomEvent<{ rows: ElementRow[] }>>,
    onTcSelectionChange: "tc-selection-change" as EventName<CustomEvent<{ selection: string[] }>>,
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<{ sort: DataSort }>>,
  },
});
type RawDataTableProps = React.ComponentProps<typeof RawDataTable>;
export type DataTableProps = Omit<RawDataTableProps, "rows" | "selection" | "sort" | "heading" | "readonly" | "onTcRowsChange" | "onTcSelectionChange" | "onTcSortChange" | "columns" | "icon" | "renderCell"> & {
  /** Draws a cell itself: a DOM node or a string; undefined leaves the cell to the table. Gets the row as the app gave it */
  renderCell?: (row: DataRow, column: DataColumn) => Node | string | undefined;
  /** The table's heading and the grid's name */
  title: string;
  /** Icon in front of the title */
  icon?: React.ReactNode;
  columns: DataColumn[];
  rows?: DataRow[];
  defaultRows?: DataRow[];
  onRowsChange?: (rows: DataRow[]) => void;
  selection?: string[];
  defaultSelection?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sort?: DataSort;
  defaultSort?: DataSort;
  onSortChange?: (sort: DataSort) => void;
  /** false turns the table read only */
  editable?: boolean;
};
export function DataTable({ title, icon, renderCell, columns, rows, defaultRows = [], onRowsChange, selection, defaultSelection = [], onSelectionChange, sort, defaultSort = null, onSortChange, editable = true, ...props }: DataTableProps) {
  const r = useControlled(rows, defaultRows, onRowsChange);
  // Icons and logos given as React nodes render in the staging box; the element gets their DOM nodes
  const nodes: [string, React.ReactNode][] = [];
  if (isNode(icon)) nodes.push(["icon", icon]);
  for (const c of columns) if (isNode(c.icon)) nodes.push([`col:${c.key}`, c.icon]);
  for (const row of r.value) if (isNode(row.logo)) nodes.push([`row:${row.id}`, row.logo]);
  const { stage, els } = useStaged(nodes);
  const cols = React.useMemo(() => columns.map((c) => (isNode(c.icon) ? { ...c, icon: els[`col:${c.key}`] } : c)) as ElementColumn[], [columns, els]);
  const toElementRows = (list: DataRow[]) => list.map((row) => (isNode(row.logo) ? { ...row, logo: els[`row:${row.id}`] } : row)) as ElementRow[];
  const s = useControlled(selection, defaultSelection, onSelectionChange);
  const o = useControlled(sort, defaultSort, onSortChange);
  // Edits come back with the element's rows; logos are put back as the React nodes the app gave
  const byId = new Map(r.value.map((row) => [row.id, row]));
  const latest = React.useRef({ renderCell, byId, columns });
  latest.current = { renderCell, byId, columns };
  // One stable function, so the table doesn't redraw every render; it hands the app its own row and column objects
  const draw = React.useCallback((row: ElementRow, column: ElementColumn) => {
    const { renderCell: fn, byId: rows, columns: cols } = latest.current;
    return fn?.(rows.get(row.id) ?? (row as DataRow), cols.find((c) => c.key === column.key) ?? (column as DataColumn));
  }, []);
  const fromElementRows = (list: ElementRow[]) => list.map((row) => (byId.has(row.id) && isNode(byId.get(row.id)!.logo) ? { ...row, logo: byId.get(row.id)!.logo } : row)) as DataRow[];
  return h(React.Fragment, null, stage, h(RawDataTable, {
    ...props,
    heading: title,
    renderCell: renderCell ? draw : undefined,
    icon: isNode(icon) ? els.icon : (icon as Element | undefined),
    columns: cols,
    readonly: !editable,
    rows: toElementRows(r.value),
    selection: s.value,
    sort: o.value,
    onTcRowsChange: (e: CustomEvent<{ rows: ElementRow[] }>) => r.handler(fromElementRows(e.detail.rows), e),
    onTcSelectionChange: (e: CustomEvent<{ selection: string[] }>) => s.handler(e.detail.selection, e),
    onTcSortChange: (e: CustomEvent<{ sort: DataSort }>) => o.handler(e.detail.sort, e),
  }));
}

/* ---------- Column icons as React components (Standard 15px · Clean 14px) ---------- */

const columnIcon = (d: string) =>
  function ColumnIcon({ look = "standard" }: { look?: Look }) {
    const clean = look === "clean";
    const size = clean ? 14 : 15;
    return h("svg", { viewBox: "0 0 16 16", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: clean ? 1.1 : 1.3, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, h("path", { d }));
  };
export const TextColumnIcon = columnIcon("M3 4h10M3 7h10M3 10h10M3 13h6");
export const TagColumnIcon = columnIcon("M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z");
export const LinkColumnIcon = columnIcon("M6.5 9.5l3-3M7.25 4.75l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M8.75 11.25l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1");
export const NumberColumnIcon = columnIcon("M6 2.5 4.5 13.5M11.5 2.5 10 13.5M2.5 6h11M2 10.5h11");
export const DateColumnIcon = columnIcon("M3 4.5h10v9H3zM3 7.5h10M6 2.5v3M10 2.5v3");
