---
pattern: toolbar
status: new
related: traceability-spine, eval-scorecard, feedback-rubric, compact-breakdown
---

## Overview

How a set of assessments came out, in one compact strip. Each grade shows its count over its name – by default
Outstanding, Excellent, Satisfactory and Dissatisfactory – and the heading says how many were assessed: “Paper grades
· 10 assessed”. Grades with no assessments are muted, so the ones that happened stand out. An optional bar underneath
shows the grades in proportion, and with `selectable` a grade can be picked as a filter for a list beside it.

## When to use

- Summing up how papers, proposals, reviews or projects were assessed.
- A filter above a list of assessed items, where the counts help people choose.
- A small summary on an overview page, next to a topic's or a team's other numbers.

## When not to use

- Test cases passing and failing across versions – use `eval-scorecard`.
- Rating one answer against criteria – use `feedback-rubric`.
- A share of a whole across many categories – use `compact-breakdown`.
- Tracing what came of a question – use `traceability-spine`.

## Anatomy

1. **Heading** `.ui-grd__head` – the name and how many were assessed
2. **Grade** `.ui-grd__grade` – a count over its name, coloured by its tone; muted at zero
3. **Pick** `.ui-grd__pick` – with `selectable`, the grade as a toggle button
4. **Bar** `.ui-grd__bar` – with `bar`, the grades in proportion

## Looks

Standard puts the heading on a gray tray above a white card. Clean is one white card with the heading as its first
row. The counts, colours and bar are the same in both.

## Keyboard

Without `selectable` the strip has no tab stops. With it, the grades are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next grade |
| Home / End | Moves to the first or last grade |
| Enter / Space | Picks the grade as a filter, or clears it if it's picked |
| Escape | Clears the picked grade |
| Tab | Leaves the strip |

## Screen readers

The grades are a list – or, with `selectable`, a toolbar – named “Paper grades, 10 assessed”. Each grade reads its
count and name, “3 Outstanding”; picked, its toggle button is pressed. The bar is hidden; the counts say the same.

## Content

- Order grades from best to worst, and keep the names to one word.
- Set `assessed-label` to what was assessed when “assessed” isn't clear: “papers graded”.
- Use tones that match the grades' meaning: success for the best, danger for the worst.

## Do

- Show every grade, even at zero, so the scale is clear.
- Pair `selectable` with a list that filters as a grade is picked.

## Don't

- Don't use more than five or six grades – past that, use a chart.
- Don't make it selectable when nothing on the page filters.

## Example

```html
<tc-grade-distribution id="grades" heading="Paper grades" bar selectable></tc-grade-distribution>

<script type="module">
  import "trenchcoat/grade-distribution";
  import "trenchcoat/tokens.css";

  const grades = document.querySelector("#grades");
  grades.grades = [
    { id: "outstanding", label: "Outstanding", count: 1, tone: "success" },
    { id: "excellent", label: "Excellent", count: 0, tone: "info" },
    { id: "satisfactory", label: "Satisfactory", count: 1 },
    { id: "dissatisfactory", label: "Dissatisfactory", count: 0, tone: "danger" },
  ];
  grades.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { GradeDistribution, type Grade } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const grades: Grade[] = [
  { id: "outstanding", label: "Outstanding", count: 1, tone: "success" },
  { id: "satisfactory", label: "Satisfactory", count: 1 },
];

export function Grades() {
  const [selected, setSelected] = useState<string | null>(null);
  return <GradeDistribution title="Paper grades" grades={grades} bar selectable selected={selected} onSelectedChange={setSelected} />;
}
```
