---
pattern: grid
status: react-twin
related: filter-menu, breakdown-chart, kpi-chart
---

## Overview

A database-style table that works like a small spreadsheet. People select a cell or drag across a range, edit in
place by typing or double-clicking, copy and paste blocks to and from Excel or Google Sheets, undo and redo, sort by
any column, and check rows to delete them together. Columns can hold a title with a logo, coloured tags with a picker,
links, numbers or text, and a range of numbers shows its sum in the footer. Above 60 rows only the rows near the
viewport render, so it stays quick with thousands of rows.

## When to use

- Records people edit in bulk – accounts, contacts, inventory, line items – where a form per row would be slow.
- Data people move between the product and a spreadsheet by copy and paste.
- Lists long enough to sort, from a handful of rows to tens of thousands.

## When not to use

- Narrowing a table by several facets – pair it with `filter-menu`; the table itself doesn't filter.
- Showing how a total splits up, where the shape matters more than the numbers – use `breakdown-chart`.
- One metric over time – use `kpi-chart`.

## Anatomy

1. **Title** `.ui-dt__head` – the icon, the name, and Undo and Redo
2. **Column header** `.ui-dt__th` – the column's icon and label; click to sort
3. **Checkbox** `.ui-dt__check` – checks a row; the one in the header checks them all
4. **Title cell** `.ui-dt__name` – the row's logo and name
5. **Tag** `.ui-dt__tag` – a value from a set list, picked from a menu when edited
6. **Footer** `.ui-dt__foot` – Add row or the bulk actions, and the range's count and sum

## Looks

Standard sets the title and the footer on a gray tray with the table on a white card between them; rows are 44px high
with square checkbox cells, and tags are coloured pills. Clean has no tray: one white card with hairline shadows, 40px rows divided by hairlines
only, 12px gray header labels, a soft blue fill for selected cells, and the footer as the card's last row.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves focus into and out of the grid – one tab stop for all the cells |
| ← / → / ↑ / ↓ | Moves the active cell; with Shift, extends the range |
| ⌘/Ctrl + arrow | Jumps to the first or last row or column |
| Home / End | Jumps to the first or last column; with ⌘/Ctrl, to the first or last cell |
| ⌘/Ctrl+A | Selects every cell |
| Enter / F2 | Edits the active cell; in a tag column, opens its picker |
| ⌘/Ctrl+Enter | On a link, opens it; Enter alone does too in a read-only column |
| Any character | Starts editing the active cell with that character (not in tag columns) |
| Delete / Backspace | Clears the selected cells |
| Escape | Collapses the range to the active cell |
| ⌘/Ctrl+C, X, V | Copies, cuts or pastes the range as tab-separated text; one value pasted into a range fills it |
| ⌘/Ctrl+Z, ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y | Undoes or redoes |

While editing: Enter saves and moves down, Tab saves and moves right, Escape cancels; leaving the field saves. In the tag
picker, ↑ / ↓ / Home / End move between choices, Enter or Space picks one, and Escape or Tab closes it unchanged.

## Screen readers

The table is a `grid` named by the heading, with `aria-rowcount` and `aria-multiselectable`; rows carry
`aria-rowindex`, so the count is right even when only part of a long table is rendered. Focus stays on the grid and
`aria-activedescendant` points at the active cell; cells in the range are `aria-selected`, and read-only cells
`aria-readonly`. Column headers carry `aria-sort`. Checkboxes are named “Select all rows” and “Select Linear” (the row's
title) with `aria-checked`, the header's is “mixed” when some rows are checked. Undo and Redo are named with their keys (“Undo (⌘ Z)”).
A status region says how many rows are checked and, for a range, its summary: “2 rows selected. 6 values · Sum
1,200”.

## Content

- Label columns with short nouns – “Company”, “Stage”, “ARR ($)” – and put the unit in the label, not in every cell.
- Give tag columns their `options` in a meaningful order, and `tagTones` so each value keeps its colour.
- Use `editable: false` for columns the product owns (an owner, an id) so edits, pastes and clears skip them.
- The empty table says “No rows yet”; an untitled row reads “Untitled”.

## Do

- Save with `tc-rows-change` – it fires for every edit, paste, clear, add, delete, undo and redo, with all the rows.
- Pass new `rows` from the server when they change elsewhere; the table takes them and starts a fresh undo history.
- Set `readonly` (or `editable={false}` in React) for tables people should only read and copy from.

## Don't

- Don't rely on Tab to move between cells – it leaves the grid, as the grid pattern expects; arrows move inside it.
- Don't put buttons or other controls in cells through `renderCell`; the grid handles the keys, not your controls.
- Don't give two rows the same `id` – checking, logos and edits find rows by it.

## Example

```html
<tc-data-table id="accounts" heading="Accounts"></tc-data-table>

<script type="module">
  import "trenchcoat/data-table";
  import "trenchcoat/tokens.css";

  const table = document.querySelector("#accounts");
  table.columns = [
    { key: "name", label: "Company", type: "title", width: "170px" },
    { key: "stage", label: "Stage", type: "tag", options: ["Lead", "Qualified", "Customer"] },
    { key: "arr", label: "ARR ($)", type: "number" },
    { key: "owner", label: "Owner", editable: false },
  ];
  table.rows = [
    { id: "r1", name: "Linear", stage: "Customer", arr: 48000, owner: "Maya" },
    { id: "r2", name: "Vercel", stage: "Qualified", arr: 38000, owner: "Leo" },
  ];
  table.tagTones = { Lead: "gray", Qualified: "violet", Customer: "green" };
  table.addEventListener("tc-rows-change", (e) => console.log(e.detail.rows));
</script>
```

```tsx
import { useState } from "react";
import { DataTable, type DataColumn, type DataRow } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const columns: DataColumn[] = [
  { key: "name", label: "Company", type: "title", width: "170px" },
  { key: "stage", label: "Stage", type: "tag", options: ["Lead", "Qualified", "Customer"] },
  { key: "arr", label: "ARR ($)", type: "number" },
  { key: "owner", label: "Owner", editable: false },
];

export function Accounts({ initial }: { initial: DataRow[] }) {
  const [rows, setRows] = useState(initial);
  return <DataTable title="Accounts" columns={columns} rows={rows} onRowsChange={setRows} tagTones={{ Customer: "green" }} />;
}
```
