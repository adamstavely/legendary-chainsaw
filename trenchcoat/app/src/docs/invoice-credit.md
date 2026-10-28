---
pattern: tabs
status: new
related: billing-schedule, data-table, segmented-control, budget-burn
---

## Overview

An invoice and its credit note, stacked like sheets of paper. The invoice shows the amount due, the parties, the
terms, its lines (grouped where a line has a `group`) and its totals. The credit note shows the same terms with a
link back to the invoice, then the lines to credit in a tray: tick which lines count and adjust each amount, and the
subtotal, tax and adjustment update as you type. Switch between the sheets with the tabs, or press "Credit invoice"
to bring the credit note forward; then issue it. `onIssue` can return a promise – the button shows Issuing… until it
settles, and a rejection keeps the note editable with the error.

## When to use

- A billing screen where an invoice can be credited in full or in part.
- Reviewing a refund before it's issued.

## When not to use

- A plan's upcoming charges – use `billing-schedule`.
- Many invoices to sort and filter – use `data-table`.
- Spend against a budget – use `budget-burn`.
- Just switching between two views – use `segmented-control`.

## Anatomy

1. **Switch** `.ui-iv__bar` – the Invoice / Credit note tabs, PDF and Credit invoice
2. **Sheet** `.ui-iv__sheet` – a document; the one behind (`[data-behind]`) peeks out above
3. **Head** `.ui-iv__head` – the amount (`.ui-iv__big`), the due date or credited total, and the seller's mark
4. **Terms** `.ui-iv__terms` – numbers, dates and the billing period
5. **Lines** `.ui-iv__table` – the invoice's lines, grouped
6. **Lines to credit** `.ui-iv__tray` – a checkbox (`.ui-iv__check`) and an amount (`.ui-iv__amount`) per line
7. **Totals** `.ui-iv__totals` – subtotal, tax and the total or adjustment
8. **Issue** `.ui-iv__issue` – the Issue / Edit button and any error

## Looks

One look in both Standard and Clean, as the block it came from: a gray tray whose cards are the two sheets, with the
lines to credit in a tray and card of their own. `--tc-iv-figure-size` sets the display amount.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the tabs, the buttons, the related invoice link, each line's checkbox and amount, and Issue |
| ← / → | On the tabs: switches sheet |
| Space | Ticks or unticks a line |
| Enter | In an amount: commits it |

When a control on a sheet sends it behind – Credit invoice, the related invoice link – focus moves to the sheet that
came forward. Issue and Edit are one button, so focus stays on it.

## Screen readers

The switch is a tab list whose tabs control the sheets; each sheet is a tab panel named "Invoice" or "Credit note",
and the one behind is hidden and inert. Each line's checkbox is named "Credit <line>" and each amount "Credit amount
for <line>". A status region, there from the start, announces "Issued"; an error is an alert.

## Content

- Write dates and periods the way your invoices print them – they're shown as given.
- Name lines as they appear on the invoice, so the credit note matches line for line.
- Reject `onIssue` with a message people can act on: "The ledger is locked until month end."

## Do

- Return a promise from `onIssue` for the real request.
- Control `view` when another part of the page opens the credit note.

## Don't

- Don't use it for invoices with hundreds of lines – the credit tray lists every line.
- Don't change the lines while a note is being issued.

## Example

```html
<tc-invoice-credit id="doc" invoice-no="INV-2041" currency="€" currency-code="EUR"></tc-invoice-credit>

<script type="module">
  import "trenchcoat/invoice-credit";
  import "trenchcoat/tokens.css";

  const doc = document.querySelector("#doc");
  doc.lines = [
    { id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 },
    { id: "seats", name: "Extra seats", qty: 12, rate: 40, tax: 0.2 },
  ];
  doc.onIssue = (credits, total) => fetch("/api/credit-notes", { method: "POST", body: JSON.stringify({ credits, total }) });
  doc.addEventListener("tc-issue", (e) => console.log(e.detail.total));
</script>
```

```tsx
import { useState } from "react";
import { InvoiceCredit, type InvoiceView } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Invoice() {
  const [view, setView] = useState<InvoiceView>("invoice");
  return (
    <InvoiceCredit
      view={view}
      onViewChange={setView}
      lines={[{ id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 }]}
      onIssue={(credits, total) => fetch("/api/credit-notes", { method: "POST", body: JSON.stringify({ credits, total }) })}
    />
  );
}
```
