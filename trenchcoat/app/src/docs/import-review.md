---
pattern: grid
status: new
related: file-import, column-mapper, data-table, extraction-review
---

## Overview

The last step of an import: the rows, checked before they land. Every cell is checked against its column – a required
cell left empty, an email that isn't one, a date or a number that can't be read, or the page's own `validate` – and a
cell with a problem is marked and says what's wrong in words. Rows that share a `duplicate-key` value are grouped as
duplicates, each with Keep this (skip the others) and Merge (fill this row's blanks from the others, then skip them).
Tabs filter All, With problems and Duplicates, each with its count. Any cell can be edited in place, any row skipped
or restored. The summary says “412 rows ready, 9 to fix, 3 duplicates”, and Import waits, saying why, until nothing's
left to fix – or until “Skip rows with problems” is ticked.

## When to use

- After `column-mapper`, before rows are written – a vendor list, contacts, assets.
- When some rows will be wrong and people should fix or skip them rather than lose the whole file.
- When the same record may appear twice and people should choose which to keep.

## When not to use

- A table of records already saved, edited like a spreadsheet – use `data-table`.
- Fields read from a document image – use `extraction-review`.
- Reading the file or matching its columns – use `file-import` and `column-mapper`.

## Anatomy

1. **Tabs** `.ui-imr__tab` – All, With problems and Duplicates, with counts
2. **Grid** `.ui-imr__grid` – one row per record, the row number first and stuck in place when scrolling
3. **Cell** `.ui-imr__cell` – the value; a cell with a problem is tinted and says what's wrong under the value
4. **Status** `.ui-imr__status` – Ready, “2 to fix”, “Duplicate of row 2” or Skipped, with a mark
5. **Actions** `.ui-imr__act` – Keep this and Merge for duplicates, and Skip or Restore
6. **Skip rows with problems** `.ui-imr__check` – lets Import go ahead, leaving those rows and extra duplicates out
7. **Import** `.ui-imr__import` – with how many rows are ready; held, with the reason, while rows need fixing

## Looks

Standard puts the header on the gray tray above a white card and the summary and Import on the tray below. Clean is one
white card with the summary as its last row. `--tc-import-review-height` sets how tall the grid grows before it
scrolls (420px), and `--tc-import-review-cell-w` the widest a column gets (170px).

## Keyboard

| Key | What it does |
|---|---|
| ← / → | Moves along the row: the row number, each cell, the status, the actions |
| ↑ / ↓ | Moves to the row above or below |
| Home / End | First or last cell of the row |
| Ctrl Home / Ctrl End | First or last row |
| Page Up / Page Down | Ten rows up or down |
| Enter or F2 (on a cell) | Edits it; Enter saves, Escape cancels |
| Enter or Space (on an action) | Presses it |
| ← / → (on the tabs) | Moves between All, With problems and Duplicates |

## Screen readers

The tabs are a `tablist` controlling the grid's `tabpanel`; each tab reads its count (“With problems, 3”). The grid is
named by the heading, with column headers (required ones say so) and a `rowheader` per row (“Row 4”). A cell with a
problem reads its value and the problem (“hello@northfield, Not an email address”); an empty one reads “empty”. The
status cell reads every problem in the row in words. Actions name their row (“Keep this, row 2”). The edit field is
labelled by its column and row and described by “Enter saves, Escape cancels”. A status region says what happened
(“Row 4 skipped”, “Merged 2 rows into row 2”, “Contact email in row 3 changed”). Import is `aria-disabled` and
described by why (“To import, fix 3 rows and resolve 1 duplicate, or skip rows with problems”).

## Content

- Name columns as in your app, and mark `required` only what a record can't be saved without.
- Write `validate` messages as the problem, in a few words: “Not a known country”, “Before the contract start”.
- Pick a `duplicate-key` that really identifies a record – an email or an external id, not a name.

## Do

- Keep `rows` with the import job, so fixes survive going back a step.
- Let people skip what they can't fix now; they can import the rest and come back.
- Show the left-out rows afterwards – `tc-import` hands them over as `skipped`.

## Don't

- Don't fix values for people silently; mark them, and let people edit or skip.
- Don't import duplicates without asking – Keep this and Merge are one press each.
- Don't use it for thousands of rows at once without `page-size`; Show more rows adds a page at a time.

## Example

```html
<tc-import-review id="review" heading="Review vendors" duplicate-key="email"></tc-import-review>

<script type="module">
  import "@adamstavely/trenchcoat/import-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#review");
  el.columns = [
    { id: "name", label: "Vendor name", required: true },
    { id: "email", label: "Contact email", type: "email", required: true },
    { id: "start", label: "Contract start", type: "date" },
  ];
  el.rows = [
    { id: "r1", cells: { name: "Kestrel Lab Supplies", email: "orders@kestrel-lab.example", start: "2024-03-01" } },
    { id: "r2", cells: { name: "Northfield Survey Co.", email: "hello@northfield", start: "2025-01-06" } },
    { id: "r3", cells: { name: "Kestrel Lab Supplies Ltd", email: "orders@kestrel-lab.example", start: "" } },
  ];
  el.addEventListener("tc-import", (e) => console.log("import", e.detail.rows, "left out", e.detail.skipped));
</script>
```

```tsx
import { useState } from "react";
import { ImportReview, type ImportReviewColumn, type ImportReviewRow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReviewVendors({ columns, initial, save }: { columns: ImportReviewColumn[]; initial: ImportReviewRow[]; save: (rows: ImportReviewRow[]) => void }) {
  const [rows, setRows] = useState(initial);
  return <ImportReview title="Review vendors" columns={columns} duplicateKey="email" rows={rows} onRowsChange={setRows} onImport={(ok) => save(ok)} />;
}
```
