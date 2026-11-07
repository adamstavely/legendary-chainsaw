---
pattern: none
status: new
related: bar-chart, area-chart, waffle-chart, funnel-chart, breakdown-chart
---

## Overview

Two shares in one picture: each column is as wide as its share of the whole, and the series stacked in it fill it to
100%, so every block's area is its share of everything. A budget by lab and kind of spend shows at once which labs are
big and what each spends on. The first series (or the one `highlight` names) takes the accent and the others the chart
inks after it, named in the legend; under each column sit its name and its share of the whole. Rows with the same
column and series add up.

The blocks rise column after column when the chart scrolls into view, and widths and heights glide when the data
changes. Ported from ztd-charts (MIT).

## When to use

- A whole split two ways, where both splits matter: spend by lab and by kind, samples by site and by outcome.
- A few columns (up to about eight) and a few series (up to about five).

## When not to use

- Only the mix matters, not the columns' sizes – use [Bar Chart](#/bar-chart) with `layout="percent"`.
- The make-up changing over time – use [Area Chart](#/area-chart).
- One split of a whole – use [Waffle Chart](#/waffle-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Block** `.ui-mmk__block` – one per column and series, its height the share in the column
3. **Axis** `.tc-chart__grid` – the 0, 50 and 100% lines and their values
4. **Column label** `.tc-chart__tick` – each column's name and its share of the whole, under it
5. **Tooltip** `.tc-chart__tip` – the block's share in its column, its value and the column's share

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised series, `--tc-plot-ink-2` … `-6` for the others
(`--tc-plot-rest` when there's only one), and blocks are parted by lines of `--tc-plot-bg`. Shares are left to the
tooltip and the table rather than written on the blocks, so they stay legible whatever the inks are. `still` (or the
system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous block, up each column then on to the next; the tooltip shows it and it's read with its share |
| Home / End | The first or last block |
| Enter / Space | Picks the block (fires `tc-mark-click`) |
| Escape | Lets go of the block; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (each column with its share, then the series).
- A table of every block's share and value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the column and series with the share and position ("Imaging Staff: 40% · 460,
  4 of 15").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Name columns briefly – a narrow column truncates its name.
- Put the series that matters first, or name it in `highlight`.
- Give `unit` and `format` for the values; the shares are written for you.

## Do

- Order columns by size when their order carries no meaning.
- Keep the same series order in every column – it's set by first appearance.

## Don't

- Use it for negative values; they count as zero.
- Use more than about five series; the thin blocks become hard to point at.

## Example

```html
<tc-marimekko-chart heading="Spend by lab" description="This year, k€"></tc-marimekko-chart>

<script type="module">
  import "@adamstavely/trenchcoat/marimekko-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-marimekko-chart").data = [
    { x: "Genomics", series: "Staff", value: 820 },
    { x: "Genomics", series: "Instruments", value: 540 },
    { x: "Imaging", series: "Staff", value: 460 },
    { x: "Imaging", series: "Instruments", value: 610 },
  ];
</script>
```

```tsx
import { MarimekkoChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { x: "Genomics", series: "Staff", value: 820 },
  { x: "Genomics", series: "Instruments", value: 540 },
  { x: "Imaging", series: "Staff", value: 460 },
  { x: "Imaging", series: "Instruments", value: 610 },
];

export function Spend() {
  return <MarimekkoChart title="Spend by lab" description="This year, k€" data={data} onMarkClick={(e) => console.log(e.label, e.series)} />;
}
```
