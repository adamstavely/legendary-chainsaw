---
pattern: grid
status: new
related: investment-balance, budget-burn, usage-meter, person-links
---

## Overview

How loaded each person is. Every row has the person's initials, name and role, their load against their capacity –
“1.2 / 1.0 FTE” – and a bar split into what they work on, one piece per allocation. All bars share one scale, so
loads compare across rows, and a line on each bar marks that person's capacity. Each piece is named under the bar with
its amount, so colour is never the only cue. Anyone over capacity is marked “over” and counted in the header. Rows
are sorted by load, most loaded first, and moving along a bar names each piece in the readout below.

## When to use

- Staffing reviews: who is stretched across too many topics or projects.
- Planning a move of work between people, and checking the result.
- Any “who carries what” view where the unit is FTE, hours a week or a percentage.

## When not to use

- How a budget splits across priority tiers – use `investment-balance`.
- Spend against budgets – use `budget-burn`.
- One person's use against a plan limit – use `usage-meter`.
- Who is linked to whom – use `person-links`.

## Anatomy

1. **Person** `.ui-capb__person` – initials or picture, name, role and load against capacity
2. **Over** `.ui-capb__over` – the mark when load is past capacity
3. **Bar** `.ui-capb__track` – the allocation, one piece per piece of work, on a shared scale
4. **Piece** `.ui-capb__seg` – one allocation; focusable
5. **Capacity line** `.ui-capb__cap` – where the person's capacity falls on the bar
6. **Legend** `.ui-capb__legend` – each piece's name and amount, under the bar
7. **Readout** `.ui-capb__readout` – the person or piece in focus, in full

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Pieces take `--tc-chart-1` to `--tc-chart-6`, by the order work first appears, so the same
topic has the same colour on every row.

## Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the person above or below, at the same place along the bar |
| ← / → | Moves between the person and the pieces of their bar |
| Home / End | Moves to the person, or to the last piece of their bar |
| Enter / Space | Selects the person, or clears them if they're selected |
| Escape | Clears the selected person |
| Tab | Leaves the grid |

## Screen readers

The rows are a `grid` named by the heading and described by “Up and down arrows move between people, left and right
along their work; Enter selects the person”. Each row's first cell is a row header that reads the person and their
load – “Arjun Mehta, Principal Investigator: 1.2 FTE of 1 FTE, over capacity” – and each piece is a cell that reads
its work and amount, “Wildfire Prediction Systems, 0.5 FTE”. The selected row is `aria-selected`, and selecting is
confirmed in a polite status message. The legend and readout repeat the cells, so they're hidden.

## Content

- Give each piece of work a stable `id`, so it keeps its colour across rows.
- Set `capacity` per person when it isn't 1 – part-timers, people on leave.
- Set `unit` to how you count: “FTE”, “h” for hours a week, or “%”.

## Do

- Show everyone on a team, not only the overloaded – the spare capacity is the answer.
- Pair a selected person with their topics or tasks.

## Don't

- Don't mix units across people – one `unit` per element.
- Don't show more than about six pieces per person; group small ones as “Other”.

## Example

```html
<tc-capacity-bars id="capacity" unit="FTE"></tc-capacity-bars>

<script type="module">
  import "trenchcoat/capacity-bars";
  import "trenchcoat/tokens.css";

  const capacity = document.querySelector("#capacity");
  capacity.people = [
    { id: "am", name: "Arjun Mehta", role: "Principal Investigator", capacity: 1, allocations: [
      { id: "crm", label: "Climate Resilience Modeling", amount: 0.7 },
      { id: "wps", label: "Wildfire Prediction Systems", amount: 0.5 },
    ] },
    { id: "jt", name: "Jonah Tran", role: "Staff Scientist", allocations: [{ id: "nc", label: "Neuromorphic Computing", amount: 0.7 }] },
  ];
  capacity.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { CapacityBars, type CapacityPerson } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const people: CapacityPerson[] = [
  { id: "am", name: "Arjun Mehta", role: "Principal Investigator", capacity: 1, allocations: [
    { id: "crm", label: "Climate Resilience Modeling", amount: 0.7 },
    { id: "wps", label: "Wildfire Prediction Systems", amount: 0.5 },
  ] },
  { id: "jt", name: "Jonah Tran", role: "Staff Scientist", allocations: [{ id: "nc", label: "Neuromorphic Computing", amount: 0.7 }] },
];

export function Capacity() {
  const [selected, setSelected] = useState<string | null>(null);
  return <CapacityBars people={people} selected={selected} onSelectedChange={setSelected} />;
}
```
