---
pattern: listbox
status: new
related: spend-limits, budget-alerts, breakdown-chart, budget-burn
---

## Overview

Where AI spend goes. A switch splits the period's spend by model, feature, user or team, and a select picks the
period. The ranked view lists each slice biggest first – its cost, its share of the total and its change on the period
before in words (“Up 12%”, “Down 8%”, “New”) – with a bar to compare them. The daily view stacks each day's spend by
the top five slices and Other; the table view gives every slice's numbers with a total. Picking a slice marks it,
fades the others in the daily view and fires `tc-slice-select`, so the page can filter what's around it. The total and
its change sit in the header, in the page's currency.

## When to use

- A usage or billing page that explains a bill: which model, feature or team the money went to.
- Comparing this period's spend with the last, slice by slice.
- Letting people narrow a dashboard to one model, feature or team.

## When not to use

- Spend against a cap per member, team or key – use `spend-limits`.
- Setting alerts on the month's budget – use `budget-alerts`.
- A general-purpose stacked bar with measure and segment pickers – use `breakdown-chart`.
- Budgets per project against their plan – use `budget-burn`.

## Anatomy

1. **Total** `.ui-spb__total` – the period's spend and its change on the period before
2. **Dimension switch** `.ui-spb__seg` – Model, Feature, User or Team
3. **Period** `.ui-spb__select` – the period the page passes entries for
4. **Slice** `.ui-spb__slice` – a ranked row: name, cost, share, change and bar
5. **Daily chart** `.ui-spb__daily` – a stacked bar per day with a legend
6. **Table** `.ui-spb__table` – every slice's cost, share and change, with a total
7. **Filter line** `.ui-spb__filter` – the picked slice, with Clear

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Slices take the chart palette (`--tc-chart-1` to `--tc-chart-5`, then `--tc-chart-neutral` for Other).
`--tc-spb-chart-h` sets the daily chart's height. A rise in spend is shown in the warning colour and a fall in the
success colour, always with the words.

## Keyboard

The ranked slices are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next slice |
| Home / End | Moves to the first or last slice |
| Enter / Space | Picks the slice, or clears the pick |
| Tab | Moves between the switches, the period select, the slices and Clear |

## Screen readers

The ranked view is a listbox named by the heading; each option reads its name, cost, share of the total and change,
and says whether it's selected. The switches are groups (“Split by”, “View”) of toggle buttons with `aria-pressed`. The
daily chart is hidden from screen readers and replaced by a caption naming the highest day; the table view carries
every number, with a caption. Switching the dimension and picking a slice are confirmed in a polite status message.

## Content

- Pass one entry per day and slice; the element sums them, so finer entries work too.
- Give `previous` the period before's entries to get the change in words, or leave it null.
- Keep slice names short – a model id, a feature's name, a person or a team.

## Do

- Load the new period's entries when `tc-period-change` fires.
- Use the pick to filter the rest of the page.

## Don't

- Don't mix currencies – `currency` applies to every number.
- Don't read “Up” as bad on its own: a feature that's growing on purpose will be up.

## Example

```html
<tc-spend-breakdown id="spend" currency="USD"></tc-spend-breakdown>

<script type="module">
  import "@adamstavely/trenchcoat/spend-breakdown";
  import "@adamstavely/trenchcoat/tokens.css";

  const spend = document.querySelector("#spend");
  spend.entries = [
    { date: "2026-11-02", cost: 412, by: { model: "large-1", feature: "Invoice matcher", team: "Audit" } },
    { date: "2026-11-02", cost: 96, by: { model: "small-2", feature: "Policy Q&A", team: "Operations" } },
    { date: "2026-11-03", cost: 388, by: { model: "large-1", feature: "Report drafting", team: "Research" } },
  ];
  spend.addEventListener("tc-slice-select", (e) => console.log(e.detail.dimension, e.detail.selected));
</script>
```

```tsx
import { SpendBreakdown, type SpendEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const entries: SpendEntry[] = [
  { date: "2026-11-02", cost: 412, by: { model: "large-1", feature: "Invoice matcher", team: "Audit" } },
  { date: "2026-11-02", cost: 96, by: { model: "small-2", feature: "Policy Q&A", team: "Operations" } },
];

export function Spend() {
  return <SpendBreakdown entries={entries} defaultDimension="feature" onSliceSelect={(id) => console.log(id)} />;
}
```
