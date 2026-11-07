---
pattern: none
status: new
related: chord-chart, treemap, waffle-chart, heatmap
---

## Overview

How two or three sets overlap. Each set is a circle whose area is its size, and the circles are placed so each pair
overlaps by about what the two share – exactly for two sets, as near as circles allow for three. Rows follow venn.js:
`{ sets: ["Genomics"], size: 64 }` gives a set, and `{ sets: ["Genomics", "Imaging"], size: 14 }` everything the two
share, including anyone also in a third.

Each region – a set alone, two sets only, all three – carries its own count on a chip of the card's colour, worked out
from those totals. The sets' names sit outside their circles. With more than three sets the three largest are drawn
and a note under the drawing says so; the table still lists every row. The circles grow from their centres when the
chart scrolls into view and glide when the data changes.

## When to use

- Who or what belongs to more than one group: researchers across labs, samples across studies, sources that agree.
- The overlap is the point – how much two lists share, or what only one of them has.

## When not to use

- Four or more sets that all matter – use [Heatmap](#/heatmap) of pairs, or an UpSet-style table.
- Flows between groups rather than shared members – use [Chord Chart](#/chord-chart).
- Parts of one whole that don't overlap – use [Treemap](#/treemap) or [Waffle Chart](#/waffle-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Circle** `.ui-vnn__circle` – a set, a translucent fill of its ink; `.ui-vnn__edge` its outline
3. **Region** `.ui-vnn__region` – one area of the diagram, lit in the accent when it's the active one
4. **Chip** `.ui-vnn__chip` – the region's own count, on the card's colour
5. **Name** `.tc-chart__tick` – the set's name, outside its circle
6. **Note** `.ui-vnn__note` – under the drawing when more than three sets were given
7. **Tooltip** `.tc-chart__tip` – the region, its count and its share of everyone

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. Circles take `--tc-plot-ink-1` to `-3` at `--tc-vnn-fill-opacity`; the active region is lit in
`--tc-plot-accent` at `--tc-vnn-active-opacity`. Counts never sit on a fill directly – each is on a chip of
`--tc-plot-bg`. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous region; the tooltip shows it and it's read with its count and share |
| Home / End | The first or last region |
| Enter / Space | Picks the region (fires `tc-mark-click`) |
| Escape | Lets go of the region; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: everyone counted, then every region and its count.
- A table of every region is always there for screen readers; the Table button shows it to everyone. With more than
  three sets the rows not drawn follow, and are read from the keyboard too.
- Moving with the arrows announces the region ("Genomics and Imaging only: 10 (8%), 4 of 7").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Give every set's size, and every pair's (and the triple's) shared size; a missing overlap is taken as none.
- Keep set names short – they sit beside the circles.
- Rename the region names and note through `vennLabels`, and the shared words through `labels`.

## Do

- Use it for two or three sets, where the reader can see every region at once.
- Let the counts carry the numbers; the areas show the proportions only roughly.

## Don't

- Read precise sizes from the areas – three circles can't always match every overlap.
- Feed it more than three sets and expect them drawn; it shows the three largest.

## Example

```html
<tc-venn-diagram heading="Researchers by lab" description="This year"></tc-venn-diagram>

<script type="module">
  import "@adamstavely/trenchcoat/venn-diagram";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-venn-diagram").data = [
    { sets: ["Genomics"], size: 64 },
    { sets: ["Imaging"], size: 48 },
    { sets: ["Genomics", "Imaging"], size: 14 },
  ];
</script>
```

```tsx
import { VennDiagram } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { sets: ["Genomics"], size: 64 },
  { sets: ["Imaging"], size: 48 },
  { sets: ["Genomics", "Imaging"], size: 14 },
];

export function Labs() {
  return <VennDiagram title="Researchers by lab" description="This year" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
