---
pattern: none
status: stable
related: date-range-picker, stepper-form, budget-guard
---

## Overview

A form for one phase of a billing plan – what a customer pays, how often, from when. People name the phase, pick a
start date and a duration, add products from your catalog, and set for each how often it repeats, its price and
whether it's billed in advance or in arrears. A discount and a minimum commitment can be added once each. The phase's
dates and two totals – the first invoice and what the whole phase is worth – update as they go, and a note says when
the minimum applies. It is a form field: with `name`, the schedule is submitted as JSON.

## When to use

- Setting up a contract or a subscription phase by hand: a ramp-up, a pilot, a renewal term.
- Sales or finance tools where people need to see the first invoice and the phase total before they commit.
- Quoting from a fixed catalog of products with standard prices that can be adjusted per deal.

## When not to use

- Picking only a period of time – use `date-range-picker`.
- A longer set-up where billing is one step among several – use `stepper-form`, and put the schedule in its step.
- Watching spend against a limit while something runs – use `budget-guard`.

## Anatomy

1. **Header** – the shared card header: a boxed receipt icon and what's being set up
2. **Phase summary** `.ui-bs__summary` – the editable phase name, the start date and where the phase ends
3. **Dates** `.ui-bs__fields` – the start date and the duration menu
4. **Line** `.ui-bs__row[data-line]` – a product with its repeat, price and billing timing; or the discount or minimum
5. **Add buttons** `.ui-bs__actions` – Add product (from the catalog), Add discount, Add minimum
6. **Totals** `.ui-bs__totals` – the first invoice and the phase total

## Looks

Standard sets the header and the totals on the gray tray around a white card that holds the form. Clean is one white
card with hairline shadows: the header is its first row with the phase summary under it, and the totals are its last row, each
with its own label.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the phase name, the dates, each line's fields and Remove, and the add buttons |
| ↓ / ↑ | On Duration or Add product: opens the list on its first or last item. In the list: moves to the next or previous item, wrapping |
| Home / End | In an open list: moves to the first or last item |
| Enter / Space | On Duration or Add product: opens or closes the list. On an item: picks it and returns focus to the button |
| Escape | Closes the open list and returns focus to its button |
| Enter | In a price, percent or amount field: commits the number |

Repeats and billing timing are native selects. When a line is removed, focus moves to the next line's Remove, the one
before, or Add product.

## Screen readers

The lines are a `table` named “Billing lines”, with Name, Repeats and Price column headers. Each field is named after
its line: “Platform licence repeats”, “Platform licence price”, “Platform licence billed”, “Discount percent”,
“Minimum commitment”, and each Remove button “Remove Platform licence”. Duration opens a `listbox` with the current
length `aria-selected`; Add product opens a `menu`. A number field that can't take what was typed is `aria-invalid`
and described by its message (“Not a number – kept the previous value”, “Capped at 100%”). The totals are a status
region, so the first invoice and the phase total are read out after each change.

## Content

- Name phases by what they're for: “Pilot”, “Phase 1 · Ramp-up” – not “Phase A”.
- Give catalog products the name that appears on the invoice, with a count in brackets where it matters
  (“Extra seats (10)”).
- Keep the heading to what the person is doing: “Billing schedule”, “Create a billing schedule”.

## Do

- Pass your own `catalog` with your real products and list prices.
- Set `currency` to the symbol customers will see on the invoice.
- Use `name` inside a form, or listen to `tc-schedule-change` and save the whole schedule.

## Don't

- Don't rely on it for tax, proration or invoicing rules – the totals are an estimate for the phase, worked out from
  the prices, repeats, discount and minimum.
- Don't put the same product in the catalog twice at different prices; adjust the price on the line instead.

## Example

```html
<form>
  <tc-billing-schedule id="schedule" name="schedule" heading="Billing schedule"></tc-billing-schedule>
</form>

<script type="module">
  import "trenchcoat/billing-schedule";
  import "trenchcoat/tokens.css";

  const schedule = document.querySelector("#schedule");
  schedule.catalog = [
    { name: "Implementation fee", repeat: "once", price: 7500 },
    { name: "Analytics platform", repeat: "monthly", price: 2400 },
  ];
  schedule.start = "2026-11-01";
  schedule.duration = "6m";
  schedule.addEventListener("tc-schedule-change", (e) => console.log(e.detail.lines));
</script>
```

```tsx
import { useState } from "react";
import { BillingSchedule, type CatalogItem, type ScheduleLine } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const catalog: CatalogItem[] = [
  { name: "Implementation fee", repeat: "once", price: 7500 },
  { name: "Analytics platform", repeat: "monthly", price: 2400 },
];

export function Schedule() {
  const [lines, setLines] = useState<ScheduleLine[]>([
    { id: "l1", kind: "product", name: "Implementation fee", repeat: "once", price: 7500, timing: "advance" },
  ]);
  return <BillingSchedule title="Billing schedule" catalog={catalog} lines={lines} onLinesChange={setLines} />;
}
```
