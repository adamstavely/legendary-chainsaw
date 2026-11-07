---
pattern: none
status: new
related: pie-chart, donut-chart, bar-chart, capacity-bars
---

## Overview

Shares of one whole as a single bar cut into parts, with a list underneath of each part's name, value and share.
Parts are ordered from the largest (`sort={false}` keeps the data's order); the largest takes the accent and the rest
step down through quiet shades, so the bar reads at a glance; `highlight` picks a different part, and
`color-mode="categorical"` gives each part its own chart ink. `variant="thin"` draws a slim bar for a card or a row,
and `list={false}` leaves the list out.

Parts grow in from the left when the chart scrolls into view and glide to their new sizes when the data changes.
Not to be confused with [Segmented Control](#/segmented-control), a set of buttons. Ported from ztd-charts (MIT).

## When to use

- Showing how one total splits into a few parts, in a strip that fits a card.
- When the shares need their names and values beside them, in one place.

## When not to use

- A few shares where a round shape reads better – use [Donut Chart](#/donut-chart).
- Comparing parts across several totals – use [Bar Chart](#/bar-chart) with `layout="percent"`.
- How full something is against its limit – use [Capacity Bars](#/capacity-bars).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Part** `.ui-sgb__part` – one item's share of the bar; the emphasised one in the accent
3. **Swatch** `.ui-sgb__swatch` – the part's ink in the list
4. **Value** `.tc-chart__value` – the part's value in the list, with its name and share beside it
5. **Tooltip** `.tc-chart__tip` – the part's value and share

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised part, `--tc-plot-rest` and
`--tc-plot-line-rest` for the shades of the rest, `--tc-plot-ink-1` … `-6` for categorical parts. Shares are written in
the list, never on the parts, so they stay legible whatever the inks are. `still` (or the system's reduced-motion
setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous part; the tooltip shows it and it's read with its value and share |
| Home / End | The first or last part |
| Enter / Space | Picks the part (fires `tc-mark-click`) |
| Escape | Lets go of the part; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (the total and each part's share).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the part ("Genomics: 4,200 h (40%), 1 of 5").
- The drawing itself is hidden; nothing is said by colour alone – the list names every part.

## Content

- Keep it to about six parts; smaller ones become slivers.
- Give `unit` (" h", " TB") rather than baking it into the values.
- Values below zero count as nothing; a part worth nothing stays in the list but not in the bar.

## Do

- Let one part carry the accent – the point of the bar.
- Keep the list when the bar stands alone; drop it only where the parts are named nearby.

## Don't

- Use it for values that don't add up to a meaningful whole.
- Compare two segmented bars by eye; use a bar chart to percent instead.

## Example

```html
<tc-segmented-bar heading="GPU hours by lab" description="This month" unit=" h"></tc-segmented-bar>

<script type="module">
  import "@adamstavely/trenchcoat/segmented-bar";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-segmented-bar").data = [
    { label: "Genomics", value: 4200 },
    { label: "Imaging", value: 2650 },
    { label: "Climate", value: 1800 },
  ];
</script>
```

```tsx
import { SegmentedBar } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", value: 4200 },
  { label: "Imaging", value: 2650 },
  { label: "Climate", value: 1800 },
];

export function GpuHours() {
  return <SegmentedBar title="GPU hours by lab" description="This month" unit=" h" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
