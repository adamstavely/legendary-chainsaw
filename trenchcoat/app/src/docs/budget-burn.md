---
pattern: list
status: new
related: investment-balance, capacity-bars, usage-meter, kpi-chart
---

## Overview

How fast each budget is being spent. Every row shows what's funded and who leads it, spent against budget – “$1.9M /
$3.8M” – the burn as a percentage and a bar, the people on it and their initials, and an optional priority badge.
With `period` set to how far through the year or project you are, a line on each bar marks where spend should be by
now, and the row says “Ahead of pace”, “On pace” or “Behind pace” in words. The header totals what's allocated, spent
and committed, and a small segmented control sorts the rows by budget or by burn.

## When to use

- Mid-year budget reviews across topics, projects or programs.
- Spotting work that's burning faster than planned, or money that isn't moving.
- Any list of budgets where spend against plan matters more than the absolute numbers.

## When not to use

- Whether money follows priority across tiers – use `investment-balance`.
- How loaded each person is – use `capacity-bars`.
- One plan's usage against its limit – use `usage-meter`.
- Spend as a trend over time – use `kpi-chart`.

## Anatomy

1. **Sort** `.ui-bburn__sort` – Budget or Burn, as a segmented control
2. **Totals** `.ui-bburn__totals` – allocated, spent, committed and how far through the period
3. **Item** `.ui-bburn__what` – the priority badge, name and owner
4. **Money** `.ui-bburn__money` – spent against budget
5. **Burn** `.ui-bburn__burn` – the burn percentage, the pace in words and the bar
6. **Pace marker** `.ui-bburn__marker` – where spend should be by now
7. **People** `.ui-bburn__people` – FTE and the team's initials

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Bars use the meter tokens; a row ahead of pace fills with `--tc-status-warning-solid`, and
says so in words.

## Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row |
| Tab | Moves between the sort buttons and the rows |

## Screen readers

The rows are a list of buttons, named by the heading. Each button reads the whole row: “Neuromorphic Computing, Marcus
Okonkwo; $1.9M of $3.8M spent, 50%; On pace; 2 FTE; priority 1”. The sort is a group labelled “Sort by” of two
toggle buttons (`aria-pressed`), and a change is confirmed in a polite status message, “Sorted by burn”. The totals
are a description list.

## Content

- Set `period` from your own calendar – the element never guesses where you are in the year.
- Use `committed` for money under contract but not yet spent, so the header shows what's really left.
- Keep `owner` to a name; put teams in `team`.

## Do

- Sort by burn in reviews to see the fastest spenders first.
- Set `tolerance` to the gap your finance team cares about; 0.1 (ten points) is the default.

## Don't

- Don't mix currencies in one view – `currency` applies to every row.
- Don't read “Ahead of pace” as bad by itself: front-loaded work burns early. The words say where to look.

## Example

```html
<tc-budget-burn id="burn" period="0.45"></tc-budget-burn>

<script type="module">
  import "trenchcoat/budget-burn";
  import "trenchcoat/tokens.css";

  const burn = document.querySelector("#burn");
  burn.items = [
    { id: "nc", priority: "1", label: "Neuromorphic Computing", owner: "Marcus Okonkwo", budget: 3800000, spent: 1900000, people: 2, team: ["Marcus Okonkwo", "Jonah Tran"] },
    { id: "qs", priority: "2", label: "Quantum Sensing", owner: "Priya Raman", budget: 2400000, spent: 1300000, people: 0.5 },
  ];
  burn.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { BudgetBurn, type BurnItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: BurnItem[] = [
  { id: "nc", priority: "1", label: "Neuromorphic Computing", owner: "Marcus Okonkwo", budget: 3800000, spent: 1900000, people: 2, team: ["Marcus Okonkwo", "Jonah Tran"] },
  { id: "qs", priority: "2", label: "Quantum Sensing", owner: "Priya Raman", budget: 2400000, spent: 1300000, people: 0.5 },
];

export function Burn() {
  return <BudgetBurn items={items} period={0.45} onOpen={(id) => console.log(id)} />;
}
```
