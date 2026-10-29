---
pattern: listbox
status: new
related: money-flow, co-occurrence, agent-graph, profile-header
---

## Overview

Who's connected to whom, around one person or organisation. The one in focus (the ego) sits in the middle. Their
direct connections are on a ring around them; at depth 2, their connections' connections are on an outer ring. People
are circles and organisations are rounded squares. Each line is a relationship ("employs", "co-author", "funds"),
thicker the stronger it is. The layout comes from the data alone: each ring is sorted by kind, then name. The same
data always draws the same picture.

Click someone to put them in the middle; the nodes glide to their new places. The panel beside the drawing names
what's selected and lists its connections by relationship, with counts. A list of every node shown is the way in for
keyboards and screen readers.

## When to use

- A person's or an organisation's page, to show who they work with, for and alongside.
- Exploring a small network – a consortium, a supplier's links, a research group – one hop or two at a time.

## When not to use

- Money moving between parties – use [Money Flow](#/money-flow).
- Who appears with whom across events, ranked – use [Co-occurrence](#/co-occurrence).
- Agents and the work they hand each other – use [Agent Graph](#/agent-graph).
- Hundreds of nodes at once – a radial ego view is for tens; filter or page the data first.

## Anatomy

1. **Depth** `.ui-rgr__depth` – Direct or 2 steps, in the header
2. **Legend** `.ui-rgr__legend` – each kind with its colour and shape; pressing one hides or shows it
3. **Drawing** `.ui-rgr__svg` – the ego in the middle, rings of connections, lines by strength
4. **Panel** `.ui-rgr__panel` – what's selected and its connections, grouped by relationship
5. **Node list** `.ui-rgr__list` – every node shown, in ring order: the keyboard's way in

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Each kind takes a tone: people violet, organisations teal, then amber, pink and rose in the order kinds appear. Lines
run from 1 to 4 px by `weight` (1–5). Below 620 px the panel goes under the drawing. A page can set
`--tc-rgr-side-w` for the panel's width.

## Keyboard

| Key | Does |
| --- | --- |
| ↑ / ↓ in the node list | The previous / next node, in ring order; the drawing rings it |
| Home / End | The first (the ego) / last node |
| Enter | Puts the node in the middle |
| Space | Selects the node, or unselects |
| ← / → on the depth switch | Direct or 2 steps |

## Screen readers

- The drawing is hidden from assistive tech. The node list is a `listbox` with the same nodes, each saying its ring,
  kind and number of connections.
- The panel's connections are buttons that put that node in the middle.
- The legend's kinds are toggle buttons with their pressed state.
- Re-centring is announced in a polite status line: "Ines Okafor in the middle, 5 connections".

## Content

- Give each relationship a short verb in the present tense ("employs", "funds", "co-author").
- Keep kinds few – person, organisation and one or two more – and name them in `kindLabels`.
- Use `weight` for strength people can explain (shared papers, years, money), not decoration.

## Do

- Start the ego on the person or organisation the page is about.
- Offer depth 2 for exploring, but open at depth 1.

## Don't

- Draw relationships you can't explain in the panel.
- Rely on colour alone: shape and the kind's name go with it.

## Example

```html
<tc-relationship-graph heading="Consortium"></tc-relationship-graph>
<script type="module">
  const g = document.querySelector("tc-relationship-graph");
  g.nodes = [
    { id: "ines", label: "Ines Okafor", kind: "person" },
    { id: "uni", label: "Northfield University", kind: "organisation" },
  ];
  g.edges = [{ from: "uni", to: "ines", label: "employs", weight: 5 }];
  g.addEventListener("tc-ego-change", (e) => console.log("centred on", e.detail.node.label));
</script>
```

```tsx
import { RelationshipGraph, type RelationEdge, type RelationNode } from "trenchcoat/react";

export function Network({ nodes, edges }: { nodes: RelationNode[]; edges: RelationEdge[] }) {
  return <RelationshipGraph title="Consortium" nodes={nodes} edges={edges} defaultDepth={1} onEgoChange={(id) => console.log(id)} />;
}
```
