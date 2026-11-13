---
pattern: grid
status: new
related: extraction-review, data-table, generated-ui, document-list
---

## Overview

The rows a model reads off a document – an invoice, a receipt, an expense claim – for a person to fix, total and
confirm. Rows arrive as they stream. A row read with low confidence says "Low confidence", and each cell the model
wasn't sure of says "Check" until someone edits it. Every cell edits in place, and numbers are read the way the locale
writes them. The subtotal, tax and total recompute as you type, in the document's currency. When the document states
its own total, a mismatch is called out in words with the difference. Rows can be added and removed, and Confirm hands
the rows and totals back.

## When to use

- Line items extracted from a document by a model, before they're posted or paid.
- An expense claim or purchase order a person checks row by row.
- Any streamed table of amounts where the total has to match a figure on the source.

## When not to use

- Named fields read off a page (an invoice number, a due date) – use `extraction-review`.
- A general spreadsheet with sorting, ranges and paste – use `data-table`.
- A read-only list of documents – use `document-list`.

## Anatomy

1. **Grid** `.ui-lni__grid` – the rows, with a header row of column names
2. **Row** `.ui-lni__row` – one line item
3. **Cell** `.ui-lni__cell` – description, quantity, unit price or amount, edited in place
4. **Check** `.ui-lni__check` – a cell the model wasn't sure of
5. **Low confidence** `.ui-lni__low` – a row read with low confidence
6. **Flag** `.ui-lni__flag` – a warning about the row, in words
7. **Remove** `.ui-lni__remove` – takes the row out
8. **Totals** `.ui-lni__totals` – subtotal, tax and total
9. **Match** `.ui-lni__match` – whether the total matches the document's
10. **Add row** `.ui-lni__add` and **Confirm** `.ui-lni__confirm`

## Looks

Standard puts the header on the gray tray above a white card, with the totals and Confirm on the tray below it. Clean
is one white card: the header its first row, the totals its last. Narrower than 520 px, each row becomes a stacked card
with its cells labelled.

## Keyboard

The grid is one tab stop.

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move cell by cell |
| Home / End | The row's first or last cell |
| Ctrl + Home / Ctrl + End | The first or last row |
| Enter / F2 | Edit the cell |
| A character | Start editing with it |
| Enter (editing) | Save |
| Escape (editing) | Cancel |
| Delete | Remove the row |

## Screen readers

The rows are a `grid` named by the heading, with column headers; while rows stream it is `aria-busy`. Each cell reads
its value, "Check" when the model wasn't sure, and the keys through a hidden description. The edit field is named by
its column and row ("Qty, Hotel, 3 nights") and is `aria-invalid` when what's typed isn't a number. Edits, added and
removed rows, the end of streaming ("5 line items read") and a confirmation are announced through `role="status"`.
While rows stream, Confirm is `aria-disabled` with the reason as its description.

## Content

- Write descriptions as the document does, shortened: "Hotel, 3 nights", not a product code.
- Use `category` for the bucket a person would file it under.
- Keep `flag` to one line about what to look at: "Receipt is hard to read".
- Pass `statedTotal` whenever the document prints its own total – it's the check people care most about.

## Do

- Pass `uncertain` for the cells the model guessed at, so people check those first.
- Keep `items` in the page and update it from `tc-items-change` when the server has to agree to each edit.
- Set `currency` and `locale` from the document, not the reader's browser.

## Don't

- Don't use Confirm as approval: the server still has to check who may post the rows.
- Don't hide a mismatch by adjusting a row silently – let the person fix it.

## Example

```html
<tc-line-items id="claim" heading="Expense claim" currency="EUR" stated-total="1365.9"></tc-line-items>

<script type="module">
  import "@adamstavely/trenchcoat/line-items";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#claim");
  el.items = [
    { id: "reg", description: "Conference registration", quantity: 1, unitPrice: 640 },
    { id: "hotel", description: "Hotel, 3 nights", quantity: 3, unitPrice: 148.5, uncertain: ["quantity"] },
    { id: "taxi", description: "Taxi to the venue", amount: 24, confidence: 0.5, flag: "Receipt is hard to read" },
  ];
  el.addEventListener("tc-confirm", (e) => console.log("Confirmed", e.detail.total));
</script>
```

```tsx
import { useState } from "react";
import { LineItems, type LineItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Claim({ rows, onPost }: { rows: LineItem[]; onPost: (items: LineItem[], total: number) => void }) {
  const [items, setItems] = useState(rows);
  return (
    <LineItems
      title="Expense claim"
      currency="EUR"
      statedTotal={1365.9}
      items={items}
      onItemsChange={setItems}
      onConfirm={({ items, total }) => onPost(items, total)}
    />
  );
}
```
