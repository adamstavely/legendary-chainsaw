---
pattern: grid
status: new
related: inline-diff, data-table, diff-viewer, extraction-review, pixel-loader
---

## Overview

An AI's proposed edits to a table, reviewed where they sit. Each changed cell shows the old value struck on a red tint
and the new one on a green tint; rows the AI wants to add or remove are tinted and marked with a plus or a minus. People
accept or reject a single edit, everything in a row, or everything at once, and Undo steps back. A count in the header
says how many are left. While the edits are still arriving, `streaming` sweeps them in a row at a time.

## When to use

- An assistant proposing a cleanup of records – a register, a price list, a set of findings.
- Bulk changes someone must sign off before they're applied.
- Showing the proposal as it streams in, so people can start reading early.

## When not to use

- Edits to prose, accepted word by word – use `inline-diff`.
- Editing a table freely, without a proposal to review – use `data-table`.
- Changes to code or files – use `diff-viewer`.
- Checking values the AI pulled out of documents against their sources – use `extraction-review`.

## Anatomy

1. **Toolbar** `.ui-dftb__bar` – Accept all, Reject all and Undo
2. **Count** `.ui-dftb__count` – how many edits are pending, or All reviewed
3. **Table** `.ui-dftb__table` – the rows, with the first column `.ui-dftb__cell--head` held still while the rest scrolls
4. **Edited cell** `.ui-dftb__chg` – the old value `.ui-dftb__del` and the new one `.ui-dftb__ins`
5. **Row mark** `.ui-dftb__rowmark` – a plus for a new row, a minus for a removed one
6. **Row review** `.ui-dftb__cell--review` – the row's Accept and Reject, or its verdict
7. **Popover** `.ui-dftb__pop` – the old and new values, the reason and both choices

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Pending edits are tinted, accepted ones show the new value with a check, and rejected ones keep the old value with a
cross – each also says so to screen readers, so colour is never the only cue. `--tc-diff-table-bg` sets the cells' and
sticky column's background.

## Keyboard

The cells are a grid with one tab stop; a row's Accept and Reject buttons are the last two stops in it.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Move between cells |
| Home / End | Go to the start or end of the row |
| Ctrl+Home / Ctrl+End | Go to the first or last cell |
| A | Accept the focused edit |
| R | Reject the focused edit |
| Enter / Space | Open the focused edit's popover, or press a button |
| Escape | Close the popover and return to its cell |

## Screen readers

The table is a grid named by the heading, with row headers from the first column and a hidden description of the
keys. An edited cell reads “Was Jan 2026, now Jan 2027, pending”, then “Jan 2027, Accepted” once decided. New and
removed rows start with “New row” or “Removed row”. A row's buttons are named with the row (“Accept Clearwater
Analytics”). A hidden status line announces how many edits are left after each decision. The popover is a dialog
named after the row and column.

## Content

- Keep `reason` to a sentence that says what the AI saw – people decide faster with it.
- Give every row a first column that names it; it labels the row's buttons and the popover.
- Put the current values in `rows` and the proposed ones in `edits`; for a new row, `cells` are the proposed values.

## Do

- Apply nothing until people have decided; read the verdicts from `tc-decisions-change`.
- Use `defaultDecisions` or `decisions` to restore a review that was left half done.
- Turn `streaming` off when the proposal is complete.

## Don't

- Don't propose more edits than someone can check – split a big cleanup into batches.
- Don't hide the reason for an edit that changes who owns something or whether it's active.
- Don't colour a value without the struck or new marking; it's what makes the change readable.

## Example

```html
<tc-diff-table id="cleanup" heading="Proposed register cleanup"></tc-diff-table>

<script type="module">
  import "@adamstavely/trenchcoat/diff-table";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#cleanup");
  el.columns = [
    { key: "vendor", label: "Vendor" },
    { key: "review", label: "Next review" },
  ];
  el.rows = [{ id: "v2", cells: { vendor: "Clearwater Analytics", review: "Jan 2026" } }];
  el.edits = [{ id: "e1", row: "v2", column: "review", from: "Jan 2026", to: "Jan 2027", reason: "Renewed in December." }];
  el.addEventListener("tc-decisions-change", (e) => console.log(e.detail.decisions));
</script>
```

```tsx
import { useState } from "react";
import { DiffTable, type DiffTableDecisions } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Cleanup() {
  const [decisions, setDecisions] = useState<DiffTableDecisions>({});
  return (
    <DiffTable
      title="Proposed register cleanup"
      columns={[{ key: "vendor", label: "Vendor" }, { key: "review", label: "Next review" }]}
      rows={[{ id: "v2", cells: { vendor: "Clearwater Analytics", review: "Jan 2026" } }]}
      edits={[{ id: "e1", row: "v2", column: "review", from: "Jan 2026", to: "Jan 2027" }]}
      decisions={decisions}
      onDecisionsChange={setDecisions}
    />
  );
}
```
