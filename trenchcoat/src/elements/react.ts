/*
 * React wrappers for the Trenchcoat elements (decision L9) – `import { Button, Combobox, DataTable } from
 * "trenchcoat/react"`. They keep the React components' API:
 *   · <Button>Save</Button>: string children become the label; `icon` / `iconRight` render as slot="icon" children
 *   · value props are controlled when given: the wrapper calls preventDefault() on the element's change event and
 *     reports the change through the callback, so React state stays the source of truth (acceptance check 9);
 *     without them the element keeps its own state, starting at the default
 *   · `title` on DataTable is the table's heading (the element calls it `heading`, since `title` is a tooltip)
 */
import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcButton } from "./button";
import { TcCombobox, type ComboboxOption, type ComboboxValueChange } from "./combobox";
import { TcDataTable, type DataRow, type DataSort } from "./data-table";
import { TcLookProvider, type Look } from "./internal/look";

export type { ComboboxOption, DataRow, DataSort, Look };
export type { DataColumn, TagTone } from "./data-table";

const h = React.createElement;

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
export type ComboboxProps = Omit<RawComboboxProps, "value" | "open" | "onTcValueChange" | "onTcOpenChange" | "single" | "onChange"> & {
  /** Pick many (the default) or one */
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: ComboboxOption[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export function Combobox({ multiple = true, value, defaultValue = [], onChange, open, defaultOpen = false, onOpenChange, ...props }: ComboboxProps) {
  const last = React.useRef<ComboboxOption[]>([]);
  const v = useControlled(value, defaultValue, (next) => onChange?.(next, last.current));
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawCombobox, {
    ...props,
    single: !multiple,
    value: v.value,
    open: o.value,
    onTcValueChange: (e: CustomEvent<ComboboxValueChange>) => {
      last.current = e.detail.options;
      v.handler(e.detail.value, e);
    },
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
  });
}

/* ---------- DataTable ---------- */

const RawDataTable = createComponent({
  tagName: "tc-data-table",
  elementClass: TcDataTable,
  react: React,
  events: {
    onTcRowsChange: "tc-rows-change" as EventName<CustomEvent<{ rows: DataRow[] }>>,
    onTcSelectionChange: "tc-selection-change" as EventName<CustomEvent<{ selection: string[] }>>,
    onTcSortChange: "tc-sort-change" as EventName<CustomEvent<{ sort: DataSort }>>,
  },
});
type RawDataTableProps = React.ComponentProps<typeof RawDataTable>;
export type DataTableProps = Omit<RawDataTableProps, "rows" | "selection" | "sort" | "heading" | "readonly" | "onTcRowsChange" | "onTcSelectionChange" | "onTcSortChange"> & {
  /** The table's heading and the grid's name */
  title: string;
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
export function DataTable({ title, rows, defaultRows = [], onRowsChange, selection, defaultSelection = [], onSelectionChange, sort, defaultSort = null, onSortChange, editable = true, ...props }: DataTableProps) {
  const r = useControlled(rows, defaultRows, onRowsChange);
  const s = useControlled(selection, defaultSelection, onSelectionChange);
  const o = useControlled(sort, defaultSort, onSortChange);
  return h(RawDataTable, {
    ...props,
    heading: title,
    readonly: !editable,
    rows: r.value,
    selection: s.value,
    sort: o.value,
    onTcRowsChange: (e: CustomEvent<{ rows: DataRow[] }>) => r.handler(e.detail.rows, e),
    onTcSelectionChange: (e: CustomEvent<{ selection: string[] }>) => s.handler(e.detail.selection, e),
    onTcSortChange: (e: CustomEvent<{ sort: DataSort }>) => o.handler(e.detail.sort, e),
  });
}
