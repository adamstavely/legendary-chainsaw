---
pattern: radio
status: stable
related: breakdown-chart, kpi-chart, change-summary, usage-meter
---

## Overview

One total and what it's made of, in a card small enough for a dashboard row: a big number, a thin stacked bar and
the parts as a ranked list with their values and shares. An optional period switch (7D · 30D · 90D) rolls every
number to the new period, glides the bar to the new split and lets the rows trade places when the ranking changes,
so people see what moved rather than a new card. Pointing at a part in the bar or the list dims the rest and rolls
the big number to that part's value.

## When to use

- A total with three to six parts people compare: revenue by channel, spend by team, tokens by model.
- Dashboard cards where the split matters as much as the total.
- Comparing the same split across a few periods – pass `periods` and swap `items` and `delta` on each change.

## When not to use

- Parts over time, or slicing by more than one dimension – use `breakdown-chart`.
- One metric and its trend line – use `kpi-chart`.
- Several unrelated metrics and how each moved – use `change-summary`.
- Usage against a limit or plan – use `usage-meter`.

## Anatomy

1. **Heading** `.ui-cb__title` – names the card and the group
2. **Period switch** `.ui-cb__switch` – the periods, with a pill that slides to the chosen one
3. **Total** `.ui-cb__big` – the big number, with the change against the previous period beside it
4. **Bar** `.ui-cb__bar` – every part's share as a segment
5. **Parts** `.ui-cb__list` – each part's colour, label, value and share, largest first
6. **Footer** `.ui-cb__foot` – the largest part, or your own line

## Looks

Standard sets the card in white on a gray tray, with the footer line in the tray below it. Clean is a single white
card with hairline shadows and the footer as its last row. The numbers, the bar and the ranking move the same way
in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the chosen period in the switch, then on |
| → / ↓ | Picks the next period (wraps at the end) |
| ← / ↑ | Picks the previous period (wraps at the start) |
| Home / End | Picks the first or the last period |
| Enter / Space | Picks the focused period |

Highlighting a part follows the pointer only; the list states every part's value and share for keyboard and
screen reader users.

## Screen readers

The card is a `group` named by its heading. The animated big number and its caption are hidden; in their place a
visually hidden line reads the total and the change – “Total revenue: $40,860, up 12.4% against the previous
period”. The period switch is a `radiogroup` named “Period” whose options are radios with `aria-checked`. The
parts are a list, each item reading its label, value and share (“Organic search $18,420 44%”). The bar is hidden.
A period change isn't announced on its own – the newly checked radio is.

## Content

- Make the heading say what's split and by what: “Revenue by channel”, “Spend by team”.
- Set `totalLabel` to name the total (“Total revenue”); it's also what screen readers hear first.
- Keep part labels to one or two words – long ones are cut with an ellipsis and their full text in a tooltip.
- Pass a `format` that suits the unit, like `(n) => "$" + Math.round(n).toLocaleString("en-US")`.
- Use short period labels: “7D”, “30D”, “90D”.

## Do

- Give each part a stable `id`, so it keeps its colour and place in the bar across periods.
- Pass `delta` for the period shown; it's hidden while a part is highlighted.
- Keep to five parts or fewer for the default colours; group the long tail into “Other”.

## Don't

- Don't use it for values that don't add up to a total – negative values count as zero.
- Don't change `items` without changing `period` (or the other way round) – the card animates whatever pair it's
  given.
- Don't hide the footer just to save space; the largest part is useful context.

## Example

```html
<tc-compact-breakdown id="revenue" heading="Revenue by channel" total-label="Total revenue"></tc-compact-breakdown>

<script type="module">
  import "trenchcoat/compact-breakdown";
  import "trenchcoat/tokens.css";

  const data = {
    "7d": [{ id: "organic", label: "Organic search", value: 18420 }, { id: "paid", label: "Paid ads", value: 9310 }],
    "30d": [{ id: "organic", label: "Organic search", value: 64200 }, { id: "paid", label: "Paid ads", value: 48900 }],
  };
  const card = document.querySelector("#revenue");
  card.periods = [{ id: "7d", label: "7D" }, { id: "30d", label: "30D" }];
  card.items = data["7d"];
  card.format = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
  card.addEventListener("tc-period-change", (e) => (card.items = data[e.detail.period]));
</script>
```

```tsx
import { useState } from "react";
import { CompactBreakdown, type BreakdownItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data: Record<string, BreakdownItem[]> = {
  "7d": [{ id: "organic", label: "Organic search", value: 18420 }, { id: "paid", label: "Paid ads", value: 9310 }],
  "30d": [{ id: "organic", label: "Organic search", value: 64200 }, { id: "paid", label: "Paid ads", value: 48900 }],
};

export function Revenue() {
  const [period, setPeriod] = useState("7d");
  return (
    <CompactBreakdown
      title="Revenue by channel"
      totalLabel="Total revenue"
      periods={[{ id: "7d", label: "7D" }, { id: "30d", label: "30D" }]}
      period={period}
      onPeriodChange={setPeriod}
      items={data[period]}
      format={(n) => `$${Math.round(n).toLocaleString("en-US")}`}
    />
  );
}
```
