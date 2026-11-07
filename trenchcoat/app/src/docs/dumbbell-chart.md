---
pattern: none
status: new
related: slope-chart, lollipop-chart, bar-chart, kpi-chart
---

## Overview

Two values per item joined by a bar – before and after, target and actual, this audit and the last. Each row is an
item: its first value a hollow dot, its second a solid one, so the direction reads by shape as well as position. Rows
are ordered by the second value (`sort="false"` keeps the data's order); the item that moved most takes the accent and
the rest stay quiet, and `highlight` picks a different one, or several. `startLabel` and `endLabel` name the two
values in the legend and tooltip; the axis fits the values unless `zero` starts it at zero.

The second value is written past its dot. The bars stretch from the first dot to the second when the chart scrolls
into view and glide when the data changes. Ported from ztd-charts (MIT).

## When to use

- Showing how each item changed between two moments, where the size of the gap matters.
- Comparing an actual value with its target, item by item.

## When not to use

- Changes where crossings and rank matter more than gaps – use [Slope Chart](#/slope-chart).
- One value per item – use [Lollipop Chart](#/lollipop-chart) or [Bar Chart](#/bar-chart).
- One headline metric against its target – use [KPI Chart](#/kpi-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend naming the two dots, and the Table button
2. **Bar** `.ui-dmb__bar` – from the first value to the second; the emphasised one in the accent
3. **Start** `.ui-dmb__start` – the first value, a hollow dot
4. **End** `.ui-dmb__end` – the second value, a solid dot
5. **Value** `.tc-chart__value` – the second value, past its dot
6. **Axis** `.tc-chart__grid` – the grid lines and their values; the item names on the left
7. **Tooltip** `.tc-chart__tip` – both values and the difference

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, and draws the legend above the rows instead. Inks come from the chart tokens through
overridable component tokens on the element: `--tc-plot-accent` for the emphasised item, `--tc-plot-rest` for the
quiet bars and `--tc-plot-line-rest` for the dots. `--tc-dmb-bar` sets the bar's width. Values are written in the text
inks beside the dots, never on them. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous row; the tooltip shows it and it's read with both values |
| Home / End | The first or last row |
| Enter / Space | Picks the row (fires `tc-mark-click`) |
| Escape | Lets go of the row; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (each item, from one value to the other).
- A table of every row is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the row with both values and its position ("Neuro: Spring 69 → Autumn 84, 1 of 7").
- The drawing itself is hidden; the two values are told apart by shape and by name, not colour alone.

## Content

- Name the two values with `startLabel` and `endLabel` ("Spring", "Autumn"; "Target", "Actual").
- Give `unit` (" pts", "%") rather than baking it into the values; the tooltip's difference uses it too.
- Rows missing either value are left out.

## Do

- Order the values so the second is the newer or the actual one – it's the one written and sorted on.
- Set `zero` when the gap only makes sense against zero.

## Don't

- Use it for more than about fifteen rows – the dots crowd.
- Swap the meanings of the two dots between charts on one page.

## Example

```html
<tc-dumbbell-chart heading="Safety audit score" start-label="Spring" end-label="Autumn"></tc-dumbbell-chart>

<script type="module">
  import "@adamstavely/trenchcoat/dumbbell-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-dumbbell-chart").data = [
    { label: "Genomics", start: 62, end: 81 },
    { label: "Imaging", start: 74, end: 79 },
    { label: "Neuro", start: 69, end: 84 },
  ];
</script>
```

```tsx
import { DumbbellChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", start: 62, end: 81 },
  { label: "Imaging", start: 74, end: 79 },
  { label: "Neuro", start: 69, end: 84 },
];

export function Audits() {
  return <DumbbellChart title="Safety audit score" data={data} startLabel="Spring" endLabel="Autumn" onMarkClick={(e) => console.log(e.label)} />;
}
```
