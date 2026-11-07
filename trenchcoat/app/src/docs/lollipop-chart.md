---
pattern: none
status: new
related: bar-chart, dumbbell-chart, slope-chart, breakdown-chart
---

## Overview

One value per item as a thin stem with a dot at its end – the same reading as a bar chart, with far less ink, so it
stays light when there are many items. Items are ordered from the largest (`sort="false"` keeps the data's order);
the largest takes the accent and the rest stay quiet, so the eye lands on what matters, and `highlight` picks a
different one, or several. The stems lie down with the names on the left by default; `orientation="vertical"` stands
them up with the names below.

Values sit past the dots. A missing value is drawn at zero and written "–", so it never reads as 0. Stems grow from
the baseline when the chart scrolls into view and glide to new values, and new places, when the data changes.
Ported from ztd-charts (MIT).

## When to use

- Ranking a dozen or more items by one value, where a wall of bars would feel heavy.
- A value per item whose names are long – lying down, they read in full on the left.

## When not to use

- Several series per category, stacked or grouped – use [Bar Chart](#/bar-chart).
- Two values per item, before and after – use [Dumbbell Chart](#/dumbbell-chart).
- A stacked bar people slice by measure and segment – use [Breakdown Chart](#/breakdown-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Stem** `.ui-lpp__stem` – from the baseline to the value; the emphasised one in the accent
3. **Dot** `.ui-lpp__dot` – at the value, ringed in the card's colour
4. **Value** `.tc-chart__value` – the value past the dot
5. **Axis** `.tc-chart__grid` – the grid lines and their values; the item names beside or under the stems
6. **Tooltip** `.tc-chart__tip` – the item and its value

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised item, `--tc-plot-rest` and
`--tc-plot-line-rest` for the quiet stems and dots, `--tc-plot-grid` for grid lines. `--tc-lpp-stem` sets the stem's
width. Values are written in the text inks beside the dots, never on them. `still` (or the system's reduced-motion
setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous item; the tooltip shows it and it's read with its value |
| Home / End | The first or last item |
| Enter / Space | Picks the item (fires `tc-mark-click`) |
| Escape | Lets go of the item; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with the chart described in words (each item and its value, in order).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the item with its value and position ("Neuro: 377 h, 2 of 8").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep item names short enough to read whole; long ones are shortened with an ellipsis at about a third of the width.
- Give `unit` (" h", "%") rather than baking it into the values.
- Leave a missing value missing (null) rather than 0 – it's written "–".

## Do

- Let one item carry the accent – the point of the chart.
- Keep the default order unless the data's own order means something (`sort="false"`).

## Don't

- Use it for a handful of items where bars would read faster – use [Bar Chart](#/bar-chart).
- Put more than one value per item on it.

## Example

```html
<tc-lollipop-chart heading="GPU hours" description="This month, by lab" unit=" h"></tc-lollipop-chart>

<script type="module">
  import "@adamstavely/trenchcoat/lollipop-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-lollipop-chart").data = [
    { label: "Genomics", value: 412 },
    { label: "Imaging", value: 236 },
    { label: "Neuro", value: 377 },
  ];
</script>
```

```tsx
import { LollipopChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", value: 412 },
  { label: "Imaging", value: 236 },
  { label: "Neuro", value: 377 },
];

export function GpuHours() {
  return <LollipopChart title="GPU hours" description="This month, by lab" data={data} unit=" h" onMarkClick={(e) => console.log(e.label)} />;
}
```
