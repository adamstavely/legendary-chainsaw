---
pattern: grid
status: new
related: tool-permissions, data-table, policy-simulator, breakdown-chart
---

## Overview

Which checks cover which parts, at a glance. Checks – test suites, controls, policies – are the rows, the parts they
protect are the columns, and every cell says covered, partial or gap, or that the check doesn't apply. Each row and
column has a total, the overall share sits beside the heading, and the legend counts every status, so the weakest
spots stand out before anyone reads a number. Pick a cell and its detail opens below the grid: what covers it, what's
missing and the evidence behind it.

## When to use

- Red-team or adversarial test coverage across the surfaces an assistant ships on.
- Controls or policies mapped against systems, for an audit or a security review.
- Any checks-by-parts question where the gaps matter more than the exact values.

## When not to use

- Setting what each agent may do with each tool – use `tool-permissions`.
- Rows of records people sort, filter and edit – use `data-table`.
- Trying one action against the policy – use `policy-simulator`.
- A share of a whole across a few categories – use `breakdown-chart`.

## Anatomy

1. **Overall** `.ui-cov__overall` – the share covered across every applicable cell
2. **Legend** `.ui-cov__legend` – each status, its mark and how many cells have it
3. **Check** `.ui-cov__check` – a row: what does the covering, with a quiet description
4. **Part** `.ui-cov__part` – a column: what gets covered
5. **Cell** `.ui-cov__cell` – the status as a tinted tile with its mark
6. **Total** `.ui-cov__total` – a row's or column's share covered, with a slim meter
7. **Detail** `.ui-cov__detail` – the open cell: its status, what covers it and the evidence

## Looks

Standard is a white card on a gray tray, with medium-weight labels. Clean is one white card with quieter labels and
thinner marks. The tiles, totals and detail are the same in both.

## Keyboard

The matrix is one tab stop; inside it the arrows move between cells, totals included.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the next cell in that direction |
| Home / End | Moves to the first or last cell in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell of the matrix |
| Page Up / Page Down | Moves five rows up or down |
| Enter / Space | Opens the cell's detail, or closes it if it's open (totals have none) |
| Escape | Closes the open detail |
| Tab | Leaves the matrix; with a detail open, the next stop is its Close button |

Close returns focus to the cell.

## Screen readers

The matrix is a `grid` named by the heading and described by “Arrow keys move between cells; Enter opens a cell's
detail”. Parts are column headers and checks row headers; the last row and column are headed with `totalLabel`
(“Coverage”). A cell reads its status – “Covered”, “Partial”, “Gap”, “Not applicable” – and “detail shown” while its
detail is open, which it then controls (`aria-controls`). A total reads its share, “50%”. Opening a cell is confirmed in
a polite status message, “Personal data for Email agent: Gap. Nothing tests forwarding.”, and closing it with “Detail
closed”. The detail is a section headed “Personal data for Email agent”; its Close button is labelled “Close detail”.
The legend is a list labelled “Legend”; the marks are hidden, the words read.

## Content

- Name checks as what they test or enforce: “Prompt injection”, “Personal data”, not suite ids.
- Name parts as people know them: “Email agent”, “Billing”, not service names.
- Write a cell's `detail` as what's covered and what isn't: “Covers web results, not uploaded PDFs.”
- Put counts, dates and ticket numbers in `evidence`: “142 cases · last run 2 h ago”, “Open: RT-212”.
- Use `none` where a check can't apply, rather than leaving it a gap – gaps should mean work to do.

## Do

- Give a gap a `detail` and an `evidence` line with the ticket that will close it.
- Set `partial-weight` to match how your team counts partial coverage, and say so in `description`.
- Keep to about eight parts so the matrix fits without scrolling sideways.

## Don't

- Don't use the tints for anything but the three statuses – the heatmap only works if colour means one thing.
- Don't open a detail on load unless it's the reason the page was opened, such as a link from a ticket.
- Don't leave cells out of `coverage` to mean “not applicable” – a missing cell is `default-status`, a gap by default.

## Example

```html
<tc-coverage-matrix id="cov" heading="Red-team coverage"></tc-coverage-matrix>

<script type="module">
  import "trenchcoat/coverage-matrix";
  import "trenchcoat/tokens.css";

  const cov = document.querySelector("#cov");
  cov.checks = [{ id: "injection", label: "Prompt injection" }, { id: "pii", label: "Personal data" }];
  cov.parts = [{ id: "chat", label: "Chat" }, { id: "email", label: "Email agent" }];
  cov.coverage = {
    injection: { chat: "covered", email: { status: "partial", detail: "Attachments aren't tested." } },
    pii: { chat: "covered", email: { status: "gap", evidence: "Open: RT-212" } },
  };
  cov.addEventListener("tc-open-change", (e) => console.log(e.detail.open));
</script>
```

```tsx
import { useState } from "react";
import { CoverageMatrix, type CoverageCellRef, type CoverageMap } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const coverage: CoverageMap = {
  injection: { chat: "covered", email: { status: "partial", detail: "Attachments aren't tested." } },
  pii: { chat: "covered", email: { status: "gap", evidence: "Open: RT-212" } },
};

export function Coverage() {
  const [open, setOpen] = useState<CoverageCellRef | null>(null);
  return (
    <CoverageMatrix
      title="Red-team coverage"
      checks={[{ id: "injection", label: "Prompt injection" }, { id: "pii", label: "Personal data" }]}
      parts={[{ id: "chat", label: "Chat" }, { id: "email", label: "Email agent" }]}
      coverage={coverage}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
```
