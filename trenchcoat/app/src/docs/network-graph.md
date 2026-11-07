---
pattern: none
status: new
related: relationship-graph, agent-graph, chord-chart, sankey-chart
---

## Overview

Any nodes and the links between them, laid out by force: linked nodes pull together and the rest push apart, so
clusters, bridges and loners show for themselves. Give it `nodes` and `links`, or rows in `data` with `source`,
`target` and `value` – the nodes are then the ones the links name, which is how a `tc-chart` spec draws one.

With a `group` on the nodes each group takes its own chart ink, with a legend in the header; without groups the
most-linked node takes the accent and the rest stay quiet (`highlight` picks others). A node's size is its `size`, or
how many links it has; a link's width is its `value`, and stronger links are also shorter. The most-linked nodes are
named beside their circles where the names fit, up to `max-labels` (fewer in a narrow card); every node is named in
the tooltip and the table.

Pointing at a node, or moving to it with the arrows, lights it, its links and its neighbours and quiets the rest. With
`drag-nodes`, a node dragged somewhere stays there – drawn with a dashed ring – and the others settle round it;
double-click it, or call `unpin()`, to let it go. The layout has no randomness: the same graph always draws the same
picture, and a changed graph starts from the last layout, so nodes glide rather than jump. Above `canvas-threshold`
nodes (1,500 by default) the links are painted on a canvas under the drawing.

Unlike [Relationship Graph](#/relationship-graph), nothing is put in the middle, and unlike
[Agent Graph](#/agent-graph) it isn't about agents and their calls: the layout comes from the links alone.

## When to use

- Who works with whom, what depends on what, which topics appear together – where the shape of the network is the
  point: clusters, the people who bridge them, the ones on their own.
- A few dozen to a few thousand nodes.

## When not to use

- One person or organisation and their connections, ring by ring – use [Relationship Graph](#/relationship-graph).
- Agents, their tools and live calls – use [Agent Graph](#/agent-graph).
- How much a handful of groups exchange – use [Chord Chart](#/chord-chart).
- Amounts flowing one way through stages – use [Sankey Chart](#/sankey-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend of groups, and the Table button
2. **Link** `.ui-nwg__link` – one per pair of nodes, as wide as its value
3. **Node** `.ui-nwg__node` – a circle sized by `size` or its links, in its group's ink or the emphasis inks; a pinned
   one has a dashed ring
4. **Name** `.tc-chart__value` – on a chip of the card's colour `.ui-nwg__chip` beside the node
5. **Tooltip** `.tc-chart__tip` – the node's name, group, number of links and who it's linked to

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Groups take `--tc-plot-ink-1` to `--tc-plot-ink-6`;
without groups the emphasised node takes `--tc-plot-accent` and the rest `--tc-plot-rest`. Links use
`--tc-nwg-link` (by default `--tc-plot-line-rest`); nodes are parted by a ring of `--tc-plot-bg`. Names sit on chips
of the card's colour, never on a node or across a line. `still` (or the system's reduced-motion setting) draws
everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move from node to node, most-linked first; the tooltip shows each, its neighbourhood is lit, and it's read with its links |
| Home / End | The most- or least-linked node |
| Enter / Space | Picks the node (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

Dragging is for the pointer only; everything it shows is reachable from the keyboard.

## Screen readers

- The plot is a group named by the heading, described in words: how many nodes, links and groups, and the most-linked
  node.
- A table of every node with its group, number of links and neighbours is always there for screen readers (the first
  60, and how many more); the Table button shows it to everyone.
- Moving with the arrows announces each node with its group and who it's linked to ("I. Ko Genomics: 5 links: R.
  Mehta, S. Varga, …, 1 of 40").
- The drawing itself is hidden; groups are named in the legend and the table, never by colour alone.

## Content

- Give each node a short `label`; the id is used when there isn't one, and names longer than a few words crowd the
  drawing.
- Links name nodes by id, in either direction; links between the same two nodes add up, and a link from a node to
  itself is left out.
- Use `group` for a handful of groups (up to six inks); with more, the inks repeat.

## Do

- Say in the description what a link means ("papers written together this year").
- Keep `max-labels` low on a busy graph; the tooltip names the rest.

## Don't

- Read distances as measurements – the layout places nodes so the structure shows, not to scale.
- Use it for a strict hierarchy; a [Treemap](#/treemap) or a tree reads better.

## Example

```html
<tc-network-graph heading="Co-authors" description="Papers written together this year" drag-nodes></tc-network-graph>

<script type="module">
  import "trenchcoat/network-graph";
  import "trenchcoat/tokens.css";
  const graph = document.querySelector("tc-network-graph");
  graph.nodes = [
    { id: "I. Ko", group: "Genomics" },
    { id: "R. Mehta", group: "Genomics" },
    { id: "P. Adeyemi", group: "Imaging" },
    { id: "E. Sato", group: "Imaging" },
  ];
  graph.links = [
    { source: "I. Ko", target: "R. Mehta", value: 3 },
    { source: "I. Ko", target: "P. Adeyemi", value: 1 },
    { source: "P. Adeyemi", target: "E. Sato", value: 2 },
  ];
</script>
```

```tsx
import { NetworkGraph } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const nodes = [
  { id: "I. Ko", group: "Genomics" },
  { id: "R. Mehta", group: "Genomics" },
  { id: "P. Adeyemi", group: "Imaging" },
  { id: "E. Sato", group: "Imaging" },
];
const links = [
  { source: "I. Ko", target: "R. Mehta", value: 3 },
  { source: "I. Ko", target: "P. Adeyemi", value: 1 },
  { source: "P. Adeyemi", target: "E. Sato", value: 2 },
];

export function Coauthors() {
  return <NetworkGraph title="Co-authors" description="Papers written together this year" nodes={nodes} links={links} dragNodes onMarkClick={(e) => console.log(e.label)} />;
}
```
