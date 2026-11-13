---
pattern: grid
status: new
related: ai-column-create, data-table, fan-out-grid, background-tasks
---

## Overview

A table a model fills in, cell by cell. The source columns are what you already have – a vendor, a website, a country.
The AI columns, marked with a sparkle, are filled by a prompt run on every row; the prompt shows when you point at or
focus the column's header. Each AI cell says where it stands: queued, filling, done (with how sure the model was and a
link to its source), failed (with Retry), or Review when a person should look. The header counts the run in words –
"1,204 of 2,000 cells · 3 failed · ~4 min left" – and the bar under it has Pause / Resume and Retry failed. Only the rows
in view are drawn, so a table of thousands of rows scrolls smoothly.

## When to use

- Enriching a list – vendors, papers, accounts – with columns a model fills from the web or documents.
- A long-running bulk run people watch, pause and fix as it goes.
- Beside a cell inspector, where picking a cell shows why it says what it says.

## When not to use

- A spreadsheet people edit by hand – use `data-table`.
- One job fanned out to workers, where each task is a single square – use `fan-out-grid`.
- Setting up the AI column itself – use `ai-column-create`.

## Anatomy

1. **Bar** `.ui-eng__bar` – a thin meter of the cells filled and failed, with the run's actions
2. **Pause / Resume** `.ui-eng__run` – holds the run or carries it on
3. **Retry failed** `.ui-eng__retry-all` – sends every failed cell again
4. **Grid** `.ui-eng__grid` – the rows, scrolled in `.ui-eng__scroll`, drawn only in view
5. **Column header** `.ui-eng__colhead` – an AI column's has a sparkle `.ui-eng__spark`
6. **Prompt** `.ui-eng__tip` – the AI column's prompt, on hover or focus
7. **Cell** `.ui-eng__cell` – source text, or an AI cell's state and value
8. **Confidence** `.ui-eng__conf` – how sure the model was, "Low" under the threshold
9. **Review** `.ui-eng__review` – a value a person should look at
10. **Source** `.ui-eng__source` – where the value came from
11. **Shimmer** `.ui-eng__shim` – a cell being filled

## Looks

Standard puts the header on the gray tray above a white card holding the bar and the grid. Clean is one white card with
the header its first row. The grid scrolls inside the card, up to `--tc-eng-h` (420 px) tall; a page can change it, the
row height (`--tc-eng-row-h`, 36 px) and the column widths (`--tc-eng-col-w`, `--tc-eng-ai-w`). Narrow, the bar wraps
and the grid scrolls sideways.

## Keyboard

The grid is one tab stop.

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move cell by cell; up from the first row reaches the column headers |
| Home / End | The row's first or last cell |
| Ctrl + Home / Ctrl + End | The first or last row |
| Page Up / Page Down | A screenful up or down |
| Enter / Space | Pick the cell |
| R | Retry a failed cell |
| Escape (on a header) | Hide the prompt |

## Screen readers

The table is a `grid` named by the heading, with `aria-rowcount` for every row, so the rows not drawn still count; each
row has its `aria-rowindex`. The first column's cells are row headers. AI column headers say "(AI column)" and carry the
prompt as their description. Each AI cell reads its value, "Filling", "Queued", "Failed" or "Review", and the
confidence as a percentage; the cell's keys are in a hidden description. While cells are being filled the grid is
`aria-busy`. Pausing, resuming, retrying, picking a cell and the end of the run are announced through `role="status"`.

## Content

- Name AI columns for what they hold: "Headquarters city", not "Prompt 3".
- Write prompts that answer in a few words – the cell shows one line.
- Pass `confidence` when the model gives one; a low one is called out.
- Use `note` on a failed cell for what went wrong, and on a review cell for why to look.

## Do

- Keep `rows` in the page and update cells as they finish; the element only draws them.
- Set `remaining` from the run's pace so the header can say the time left.
- Put a cell inspector beside the grid and fill it from `tc-cell-select`.

## Don't

- Don't render tens of thousands of rows without paging on the server – the grid draws only what's in view, but the
  page still holds every row.
- Don't hide failed cells – Retry failed needs them in the table.

## Example

```html
<tc-enrichment-grid id="vendors" heading="Vendor list" running></tc-enrichment-grid>

<script type="module">
  import "@adamstavely/trenchcoat/enrichment-grid";
  import "@adamstavely/trenchcoat/tokens.css";

  const grid = document.querySelector("#vendors");
  grid.columns = [
    { id: "vendor", label: "Vendor" },
    { id: "website", label: "Website" },
    { id: "industry", label: "Industry", ai: true, prompt: "What industry is {{vendor}} in?" },
  ];
  grid.rows = [
    { id: "v1", cells: { vendor: "Northwind Labs", website: "northwind.example", industry: { state: "done", value: "Software", confidence: 0.92 } } },
    { id: "v2", cells: { vendor: "Cedarfield Supply", website: "cedarfield.example", industry: { state: "running" } } },
    { id: "v3", cells: { vendor: "Harborstone Print", website: "harborstone.example", industry: { state: "failed", note: "The website didn't load" } } },
  ];
  grid.remaining = 240000;
  grid.addEventListener("tc-retry", (e) => console.log("Retry", e.detail.cells));
  grid.addEventListener("tc-cell-select", (e) => console.log("Picked", e.detail.row, e.detail.column));
</script>
```

```tsx
import { useState } from "react";
import { EnrichmentGrid, type EnrichmentColumn, type EnrichmentRow, type EnrichmentSelection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Vendors({ columns, rows, onRetry }: { columns: EnrichmentColumn[]; rows: EnrichmentRow[]; onRetry: (cells: EnrichmentSelection[]) => void }) {
  const [running, setRunning] = useState(true);
  const [picked, setPicked] = useState<EnrichmentSelection | null>(null);
  return (
    <EnrichmentGrid
      title="Vendor list"
      columns={columns}
      rows={rows}
      running={running}
      onRunChange={setRunning}
      selected={picked}
      onCellSelect={(selected) => setPicked(selected)}
      onRetry={onRetry}
    />
  );
}
```
