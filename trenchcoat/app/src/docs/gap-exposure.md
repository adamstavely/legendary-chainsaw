---
pattern: list
status: new
related: priority-list, coverage-ring, coverage-matrix, data-table
---

## Overview

The gaps or risks across a portfolio, and whether anyone is working on them. Each row has a severity – Critical,
High, Medium or Low, with a mark and a word as well as a colour – what's missing, the item it belongs to with that
item's priority, its coverage ("No work" or "2 in work"), the owner's initials and what's been invested so far ("$900K
· 1.2 FTE invested"). The header counts what's open, what's uncovered and the exposure: the severe gaps with nothing
in work, which also get a panel of their own at the top so they can't be missed. The list groups by the item's
priority or by severity, and can show only the uncovered gaps.

## When to use

- A portfolio review: which gaps are open, which have work against them and where the money and people go.
- Finding the severe gaps nobody owns yet, before they turn into a problem.
- A risk register where each risk belongs to a project and coverage is the question.

## When not to use

- The items themselves, ranked by priority – use `priority-list`.
- One share of coverage across everything – use `coverage-ring`.
- Which checks cover which parts, as a grid – use `coverage-matrix`.
- Many columns to sort, filter and edit – use `data-table`.

## Anatomy

1. **Stats** `.ui-gexp__stats` – open, uncovered and exposure counts
2. **Exposure** `.ui-gexp__exposure` – the severe gaps with nothing in work, each opening the gap
3. **Group by** `.ui-gexp__seg` – priority or severity
4. **Uncovered only** `.ui-gexp__toggle` – a switch that hides gaps with work on them
5. **Group header** `.ui-gexp__group-head` – the tier or severity, its count and how many are uncovered
6. **Row** `.ui-gexp__row` – one gap; opens on Enter or a click
7. **Severity** `.ui-gexp__sev` – a mark and a word in its status colour
8. **Coverage** `.ui-gexp__cov` – “No work”, outlined in the warning colour, or how much is in work
9. **Owner** `.ui-gexp__owner` – the owner's initials
10. **Invested** `.ui-gexp__money` – money and people put in so far

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The rows, panel and controls are the same in both. As the element narrows, the investment
column goes first, then each row stacks: severity and coverage on top, the gap below.

## Keyboard

The exposure panel and the list are each one tab stop; the controls sit between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next gap in the panel or the list, across groups |
| Home / End | Moves to the first or last gap |
| Enter / Space | Opens the gap: fires `tc-open`; on a control, switches it |
| Tab | Moves from the panel to the controls to the list |

## Screen readers

The stats are a description list: “Open 10, Uncovered 4, Exposure 3”. The exposure panel is a region headed
“Exposure critical / high gaps with nothing in work”. Each row is a button that reads the gap in full: “High
Memristor endurance data above 10⁸ cycles is missing. Priority 1: Neuromorphic Computing No work Owner Jonah Tran”.
The marks are hidden; the severity is read as a word. Group by is a group of two toggle buttons; Uncovered only is a
switch. Each group is a region named by its tier or severity.

## Content

- Write the gap as what's missing, in a sentence: “No coupled flood–grid failure dataset exists.”
- Set `work` to the number of pieces of work on the gap; 0 means it's uncovered.
- Give `budget` in `currency` units and `fte` in full-time equivalents; they're written compactly.
- Set `exposureSeverities` to the severities your team won't leave uncovered.

## Do

- Give every gap an owner, even an uncovered one – it says who decides what happens next.
- Start grouped by priority for planning, and by severity for a risk review.
- Pair it with `priority-list` on a portfolio page, each opening the other's item.

## Don't

- Don't use the severities for anything but how bad the gap is.
- Don't put a gap under exposure by hand; it follows from severity and work.
- Don't hide the exposure panel – it's the reason the component exists.

## Example

```html
<tc-gap-exposure id="gaps" heading="Gaps & coverage"></tc-gap-exposure>

<script type="module">
  import "trenchcoat/gap-exposure";
  import "trenchcoat/tokens.css";

  const gaps = document.querySelector("#gaps");
  gaps.gaps = [
    { id: "g1", text: "No coupled flood–grid failure dataset exists.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 0, owner: "Arjun Mehta" },
    { id: "g2", text: "Cascading-failure model is uncalibrated.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 1, owner: "Arjun Mehta", budget: 700000, fte: 0.8 },
  ];
  gaps.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { GapExposure, type ExposureGap } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const gaps: ExposureGap[] = [
  { id: "g1", text: "No coupled flood–grid failure dataset exists.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 0, owner: "Arjun Mehta" },
  { id: "g2", text: "Cascading-failure model is uncalibrated.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 1, owner: "Arjun Mehta", budget: 700000, fte: 0.8 },
];

export function Gaps() {
  return <GapExposure title="Gaps & coverage" gaps={gaps} defaultGroupBy="severity" onOpen={(id) => console.log(id)} />;
}
```
