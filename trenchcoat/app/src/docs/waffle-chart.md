---
pattern: none
status: new
related: pie-chart, donut-chart, funnel-chart, marimekko-chart, meter-row
---

## Overview

Shares of a whole as a grid of cells – 100 by default, ten to a row – each category filling its share of them in
reading order, so "42 of 100 cells" reads at a glance. The cells are handed out by the largest remainder, so they
always add up. The first category (or the one `highlight` picks) takes the accent and its share is written large beside
the grid, with its name and the other categories' values under it; the other categories take the chart inks in order,
named in the legend. With a `total` above the values' sum, the cells left over stay empty.

The cells pop in one after another when the chart scrolls into view and the large share counts up; when the data
changes the cells change ink and the share glides. Ported from ztd-charts (MIT).

## When to use

- One share of a whole that people should feel, not just read: "a third of the cluster's hours".
- A handful of categories whose shares add up to something countable.

## When not to use

- Many small shares, or shares that don't make a whole – use [Bar Chart](#/bar-chart).
- Shares of a whole with a total to show in the middle – use [Donut Chart](#/donut-chart).
- How full one thing is, inline – use [Meter Row](#/meter-row).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Cell** `.ui-wff__cell` – one of the grid's cells, in its category's ink, or empty
3. **Share** `.ui-wff__figure` – the emphasised category's share, written large
4. **Name** `.ui-wff__name` – the words under the share; the other categories' values under those
5. **Tooltip** `.tc-chart__tip` – the category's value, share and number of cells

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised category, `--tc-plot-ink-2` … `-6` for the
others (`--tc-plot-rest` when there's only one), and `--tc-wff-empty` for the cells left over. `--tc-wff-stagger` sets
the delay between cells as they pop in. The share and its words sit beside the grid, never on it. `still` (or the
system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous category; its cells are ringed, the tooltip shows it and it's read with its value |
| Home / End | The first or last category |
| Enter / Space | Picks the category (fires `tc-mark-click`) |
| Escape | Lets go of the category; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words ("Out of 100 cells: Genomics 42, Climate 27, …").
- A table of every category's value and share is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the category with its value, share and position ("Climate: 2,680 h · 27%, 2 of 4").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Keep to about five categories; past that the inks repeat and the cells get hard to tell apart.
- Use `summary-label` when the share needs a sentence ("of the cluster's hours") rather than the category's name.
- Set `total` when the categories don't make the whole – the rest of the grid stays empty and says so.

## Do

- Put the category that matters first, or name it in `highlight`.
- Use 100 cells so each one is a percent.

## Don't

- Use a waffle for values that don't add up to a whole.
- Lean on the grid for small differences – 27 and 29 cells look alike; the table has the numbers.

## Example

```html
<tc-waffle-chart heading="GPU hours" description="This quarter, by lab" unit=" h"></tc-waffle-chart>

<script type="module">
  import "@adamstavely/trenchcoat/waffle-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-waffle-chart").data = [
    { label: "Genomics", value: 4120 },
    { label: "Climate", value: 2680 },
    { label: "Imaging", value: 1890 },
  ];
</script>
```

```tsx
import { WaffleChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", value: 4120 },
  { label: "Climate", value: 2680 },
  { label: "Imaging", value: 1890 },
];

export function GpuHours() {
  return <WaffleChart title="GPU hours" description="This quarter, by lab" unit=" h" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
