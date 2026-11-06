---
pattern: none
status: new
related: chord-chart, bar-chart, money-flow, traceability-spine
---

## Overview

How an amount flows between stages: funders to labs to what the labs spend it on. Each name is a node, placed in a
column by its step – sources on the left, ends on the right – and each row of data is a flow, drawn as a band as wide
as its value. A node is as tall as the larger of what comes in and what goes out.

One node is emphasised – by default the largest in the last column – and every flow into or out of it takes the accent
while the rest stay quiet; `highlight` picks others by name or index. Pointing at a node lights its flows and fades the
rest; pointing at a flow lights just that one, and the tooltip gives its share of where it came from. Names and values
sit beside the first and last columns, and on a backing of the card's colour over the flows in between.

The nodes open from their middles column by column, then the flows draw across from left to right; when the data
changes, nodes and bands glide to their new sizes. Ported from ztd-charts (MIT).

## When to use

- Showing how a total splits and recombines across two or more steps: budget to labs to spending, samples through
  intake, sequencing and analysis.
- Comparing the size of flows at a glance, when the path matters as much as the totals.

## When not to use

- Tracing who paid whom, with entity kinds, flags and a list of transfers – use [Money Flow](#/money-flow).
- A chain of linked items from questions to outcomes, one card per item – use [Traceability Spine](#/traceability-spine).
- Exchanges both ways between the same groups – use [Chord Chart](#/chord-chart).
- One split of a total with no steps – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Node** `.ui-snk__node` – one per name, as tall as its total; the emphasised one in the accent
3. **Flow** `.ui-snk__flow` – one per source and target, as wide as its value
4. **Name** `.tc-chart__value` – the node's name, with its value `.tc-chart__tick` under it when there's room
5. **Backing** `.ui-snk__backing` – the card-coloured panel under names that sit over the flows
6. **Tooltip** `.tc-chart__tip` – a node's total and its flows in and out, or a flow's value and share

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. The emphasised node and its flows take
`--tc-plot-accent`; the other flows `--tc-plot-rest`, the other nodes `--tc-plot-line-rest` – override any of them on
the element. Names are written in the text inks beside the nodes, never on a band. `node-width` and `node-padding`
set the nodes' width and the space between them. `still` (or the system's reduced-motion setting) draws everything at
once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move through the nodes, then the flows; the tooltip shows each and it's read with its value |
| Home / End | The first node or the last flow |
| Enter / Space | Picks the node or flow (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: how many nodes and flows, and the three largest flows.
- A table of every node and flow with its value is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces each node or flow with its value and position ("Federal → Genomics: 6, 7 of 13").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- One row per flow: `source`, `target` and `value` (rename the fields with the accessors).
- Keep node names short – the first and last columns give them at most a fifth of the width each.
- Flows that loop back to an earlier node are drawn but don't push columns apart; avoid them where you can.

## Do

- Emphasise the node the reader should follow – the outcome, or the source in question.
- Give `unit` and `format` so the values read as amounts ("4.2M").

## Don't

- Use more than about four columns or a dozen nodes per column; the bands turn to hairlines.
- Draw flows whose values don't add up between steps without saying why – a node's height is the larger side.

## Example

```html
<tc-sankey-chart heading="Grant funding" description="This year, in millions" unit="M"></tc-sankey-chart>

<script type="module">
  import "trenchcoat/sankey-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-sankey-chart").data = [
    { source: "Federal grants", target: "Genomics", value: 6.4 },
    { source: "Foundation", target: "Imaging", value: 2.6 },
    { source: "Genomics", target: "Staff", value: 5.2 },
    { source: "Imaging", target: "Instruments", value: 3.1 },
  ];
</script>
```

```tsx
import { SankeyChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { source: "Federal grants", target: "Genomics", value: 6.4 },
  { source: "Foundation", target: "Imaging", value: 2.6 },
  { source: "Genomics", target: "Staff", value: 5.2 },
  { source: "Imaging", target: "Instruments", value: 3.1 },
];

export function Funding() {
  return <SankeyChart title="Grant funding" description="This year, in millions" unit="M" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
