---
pattern: none
status: new
related: sankey-chart, pie-chart, money-flow, lineage-graph
---

## Overview

What a handful of groups exchange with each other: hours each lab books on another's instruments, staff moving
between teams. Each group is an arc round a circle, sized by everything it sends and receives; each pair is joined by
a ribbon whose two ends are what each side sent the other, so a lopsided ribbon shows which way most of it went.

The largest group is emphasised and every ribbon touching it takes the accent while the rest stay quiet; `highlight`
picks others by name or index. Pointing at a group lights its ribbons and fades the rest, with what it sent and
received in the tooltip; pointing at a ribbon lights just that one and gives both directions. Names sit outside the
arcs.

The arcs sweep round from twelve o'clock and the ribbons fade in after them; when the data changes, arcs and ribbons
glide to their new angles. Ported from ztd-charts (MIT).

## When to use

- Exchanges in both directions among three to about ten groups, where who trades most with whom is the point.
- Showing that one group dominates the traffic, or that a pair is lopsided.

## When not to use

- Flows that move in one direction through steps – use [Sankey Chart](#/sankey-chart).
- Who paid whom, with entity kinds and flagged transfers – use [Money Flow](#/money-flow).
- How data or work items derive from each other – use [Lineage Graph](#/lineage-graph).
- Shares of one whole with no exchange – use [Pie Chart](#/pie-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Arc** `.ui-cdc__arc` – one per group, as long as what it sends and receives; the emphasised one in the accent
3. **Ribbon** `.ui-cdc__ribbon` – one per pair, each end as wide as what that side sent
4. **Name** `.tc-chart__value` – the group's name outside its arc
5. **Tooltip** `.tc-chart__tip` – a group's sent and received, or a pair's two directions

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. The emphasised group and its ribbons take
`--tc-plot-accent`; the other ribbons `--tc-plot-rest`, the other arcs `--tc-plot-line-rest` – override any of them
on the element. Ribbons are parted by a hairline of the card's colour. `pad-angle` sets the gap between groups in
radians. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move through the groups, then the ribbons; the tooltip shows each and it's read with its values |
| Home / End | The first group or the last ribbon |
| Enter / Space | Picks the group or ribbon (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: each group with its total.
- A table of every group and pair with its values is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces each group with its share, and each pair with both directions ("Genomics ↔
  Imaging: Genomics → Imaging 40, Imaging → Genomics 28, 4 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- One row per direction: `source`, `target` and `value`; rows with `from` and `to` work too. Rows for the same pair
  and direction add up.
- Keep group names short; they sit outside the circle and shrink it as they grow.
- A row from a group to itself draws a loop back into its own arc.

## Do

- Emphasise the group the reader should follow.
- Give `unit` (" h", " people") so both directions read as amounts.

## Don't

- Draw more than about ten groups; the arcs and ribbons get too thin to point at.
- Use it for one-way flows – the ribbon's two ends would be one value and nothing.

## Example

```html
<tc-chord-chart heading="Shared instrument time" description="Hours booked across labs" unit=" h"></tc-chord-chart>

<script type="module">
  import "@adamstavely/trenchcoat/chord-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-chord-chart").data = [
    { source: "Genomics", target: "Imaging", value: 40 },
    { source: "Imaging", target: "Genomics", value: 28 },
    { source: "Genomics", target: "Proteomics", value: 62 },
    { source: "Proteomics", target: "Genomics", value: 55 },
  ];
</script>
```

```tsx
import { ChordChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { source: "Genomics", target: "Imaging", value: 40 },
  { source: "Imaging", target: "Genomics", value: 28 },
  { source: "Genomics", target: "Proteomics", value: 62 },
  { source: "Proteomics", target: "Genomics", value: 55 },
];

export function Instruments() {
  return <ChordChart title="Shared instrument time" description="Hours booked across labs" unit=" h" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
