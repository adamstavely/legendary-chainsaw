---
pattern: none
status: new
related: dumbbell-chart, line-chart, lollipop-chart, bar-chart
---

## Overview

How each item changed between two moments: a line from its first value on the left to its last on the right, so
rises, falls and changes of rank read at a glance. It takes a long table – one row per item and period, with `x` the
period and `value` the number; the first and last periods are drawn – or a wide one, with `start` and `end` naming
the two value fields. The item that rose most takes the accent and the rest stay quiet; `highlight` picks a different
one, or several.

Each side writes the item's name and its value, nudged apart so none overlap; names are shortened before values are.
The sides are headed by the periods, or by `startLabel` and `endLabel`. Lines draw themselves from left to right when
the chart scrolls into view and glide when the data changes. Ported from ztd-charts (MIT).

## When to use

- Comparing a handful of items at two moments, where who overtook whom matters.
- Before and after a change, when both the direction and the new rank count.

## When not to use

- Many moments in between – use [Line Chart](#/line-chart).
- The size of each gap matters more than rank – use [Dumbbell Chart](#/dumbbell-chart).
- One value per item – use [Lollipop Chart](#/lollipop-chart) or [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Period** `.ui-slc__period` – the heading over each side
3. **Line** `.ui-slc__line` – one per item, from its first value to its last; the emphasised one in the accent
4. **Dot** `.ui-slc__dot` – at each end of a line
5. **Label** `.tc-chart__tick` – the item's name and value on each side
6. **Tooltip** `.tc-chart__tip` – both values and the change

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised line, `--tc-plot-rest` for the quiet ones,
`--tc-plot-line-rest` for the line under the pointer, `--tc-plot-grid` for the two side rules. `--tc-slc-line` and
`--tc-slc-line-hi` set the lines' widths. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous line; the tooltip shows it and it's read with both values |
| Home / End | The first or last line |
| Enter / Space | Picks the line (fires `tc-mark-click`) |
| Escape | Lets go of the line; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (the two periods, then each item from
  one value to the other).
- A table of every item is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the item with both values and its position ("Genomics: 2024 31% → 2025 38%, 1 of 5").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep to about ten items; past that the labels crowd and get nudged far from their lines.
- Keep item names short – they share each side with the value.
- Give `unit` ("%", " pts") rather than baking it into the values; the tooltip's change uses it too.

## Do

- Let one line carry the accent – the change the chart is about.
- Name the periods plainly with `startLabel` and `endLabel` when the field names aren't words.

## Don't

- Use it for more than two moments – the ones in between are ignored.
- Compare items measured in different units on one chart.

## Example

```html
<tc-slope-chart heading="Grant success rate" start="y2024" end="y2025" start-label="2024" end-label="2025" unit="%"></tc-slope-chart>

<script type="module">
  import "@adamstavely/trenchcoat/slope-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-slope-chart").data = [
    { label: "Genomics", y2024: 31, y2025: 38 },
    { label: "Imaging", y2024: 27, y2025: 22 },
    { label: "Proteomics", y2024: 19, y2025: 29 },
  ];
</script>
```

```tsx
import { SlopeChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", y2024: 31, y2025: 38 },
  { label: "Imaging", y2024: 27, y2025: 22 },
  { label: "Proteomics", y2024: 19, y2025: 29 },
];

export function GrantSuccess() {
  return <SlopeChart title="Grant success rate" data={data} start="y2024" end="y2025" startLabel="2024" endLabel="2025" unit="%" onMarkClick={(e) => console.log(e.label)} />;
}
```
