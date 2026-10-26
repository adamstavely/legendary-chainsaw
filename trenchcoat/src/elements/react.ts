/*
 * React wrappers for the Trenchcoat elements (decision L9) – `import { Button, Combobox, DataTable } from
 * "trenchcoat/react"`. They keep the React components' API:
 *   · <Button>Save</Button>: string children become the label; `icon` / `iconRight` render as slot="icon" children
 *   · value props are controlled when given: the wrapper calls preventDefault() on the element's change event and
 *     reports the change through the callback, so React state stays the source of truth (acceptance check 9);
 *     without them the element keeps its own state, starting at the default
 *   · `title` on DataTable is the table's heading (the element calls it `heading`, since `title` is a tooltip)
 *   · icons and logos may be React nodes, as before: the wrapper renders them into a hidden staging box and hands
 *     the element their DOM nodes, which it clones (the elements take icons as data – audit/lit-patterns.md)
 */
import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcButton } from "./button";
import { TcCombobox, type ComboboxOption, type ComboboxValueChange } from "./combobox";
import { TcDataTable, type DataColumn as ElementColumn, type DataRow as ElementRow, type DataSort } from "./data-table";
import { TcLookProvider, type Look } from "./internal/look";

export type { DataSort, Look };
export type { TagTone } from "./data-table";

/** React nodes in place of elements: icons and logos */
export type ComboboxOptionNode = Omit<ComboboxOption, "icon"> & { icon?: React.ReactNode };
export type DataColumn = Omit<ElementColumn, "icon"> & { icon?: React.ReactNode };
export type DataRow = { id: string; logo?: React.ReactNode | string; [key: string]: React.ReactNode | string | number | undefined };
export type { ComboboxOptionNode as ComboboxOption };

const h = React.createElement;

/**
 * Renders React nodes into a hidden box and returns their DOM elements by key, once they're mounted. The box is part
 * of the wrapper's output, so the nodes render the normal React way (hooks, context) and update with it.
 */
function useStaged(nodes: [string, React.ReactNode][]) {
  const box = React.useRef<HTMLDivElement>(null);
  const [els, setEls] = React.useState<Record<string, Element | undefined>>({});
  React.useLayoutEffect(() => {
    const next: Record<string, Element | undefined> = {};
    box.current?.querySelectorAll<HTMLElement>(":scope > [data-k]").forEach((s) => (next[s.dataset.k!] = s.firstElementChild ?? undefined));
    if (Object.keys(next).length !== Object.keys(els).length || Object.entries(next).some(([k, v]) => els[k] !== v)) setEls(next);
  });
  const stage = nodes.length ? h("div", { ref: box, hidden: true, "aria-hidden": "true" }, nodes.map(([k, n]) => h("span", { key: k, "data-k": k }, n))) : null;
  return { stage, els };
}
const isNode = (v: unknown) => v != null && typeof v === "object" && !(v instanceof Element);

export const LookProvider = createComponent({ tagName: "tc-look-provider", elementClass: TcLookProvider, react: React });

/* ---------- Button ---------- */

const RawButton = createComponent({ tagName: "tc-button", elementClass: TcButton, react: React });
type RawButtonProps = React.ComponentProps<typeof RawButton>;
export type ButtonProps = Omit<RawButtonProps, "children" | "label"> & {
  /** The label – a string (or set `label`) */
  children?: React.ReactNode;
  label?: string;
  /** Icon before the label */
  icon?: React.ReactNode;
  /** Icon after the label */
  iconRight?: React.ReactNode;
};
export function Button({ children, label, icon, iconRight, ...props }: ButtonProps) {
  const text = label ?? (typeof children === "string" || typeof children === "number" ? String(children) : undefined);
  return h(
    RawButton,
    { ...props, label: text ?? "" },
    icon != null ? h("span", { slot: "icon", "aria-hidden": "true" }, icon) : null,
    iconRight != null ? h("span", { slot: "icon-right", "aria-hidden": "true" }, iconRight) : null,
  );
}

/* ---------- Controlled values ---------- */

/** A value that's controlled when `value` is given, else kept by the element from `defaultValue` */
function useControlled<T>(value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined) {
  const [initial] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const handler = React.useCallback(
    (next: T, event: Event) => {
      if (controlled) event.preventDefault();
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return { value: controlled ? value : initial, handler, controlled };
}

/* ---------- Combobox ---------- */

const RawCombobox = createComponent({
  tagName: "tc-combobox",
  elementClass: TcCombobox,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<ComboboxValueChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
  },
});
type RawComboboxProps = React.ComponentProps<typeof RawCombobox>;
export type ComboboxProps = Omit<RawComboboxProps, "value" | "open" | "onTcValueChange" | "onTcOpenChange" | "single" | "onChange" | "options"> & {
  options: ComboboxOptionNode[];
  /** Pick many (the default) or one */
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: ComboboxOption[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export function Combobox({ multiple = true, value, defaultValue = [], onChange, open, defaultOpen = false, onOpenChange, options, ...props }: ComboboxProps) {
  const last = React.useRef<ComboboxOption[]>([]);
  const { stage, els } = useStaged(options.filter((o) => isNode(o.icon)).map((o) => [o.value, o.icon]));
  const opts = React.useMemo(() => options.map((o) => (isNode(o.icon) ? { ...o, icon: els[o.value] } : o)) as ComboboxOption[], [options, els]);
  const v = useControlled(value, defaultValue, (next) => onChange?.(next, last.current));
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(React.Fragment, null, stage, h(RawCombobox, {
    ...props,
    options: opts,
    single: !multiple,
    value: v.value,
    open: o.value,
    onTcValueChange: (e: CustomEvent<ComboboxValueChange>) => {
      last.current = e.detail.options;
      v.handler(e.detail.value, e);
    },
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
  }));
}

/* ---------- DataTable ---------- */

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
export type DataTableProps = Omit<RawDataTableProps, "rows" | "selection" | "sort" | "heading" | "readonly" | "onTcRowsChange" | "onTcSelectionChange" | "onTcSortChange" | "columns" | "icon"> & {
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
export function DataTable({ title, icon, columns, rows, defaultRows = [], onRowsChange, selection, defaultSelection = [], onSelectionChange, sort, defaultSort = null, onSortChange, editable = true, ...props }: DataTableProps) {
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
  const fromElementRows = (list: ElementRow[]) => list.map((row) => (byId.has(row.id) && isNode(byId.get(row.id)!.logo) ? { ...row, logo: byId.get(row.id)!.logo } : row)) as DataRow[];
  return h(React.Fragment, null, stage, h(RawDataTable, {
    ...props,
    heading: title,
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
