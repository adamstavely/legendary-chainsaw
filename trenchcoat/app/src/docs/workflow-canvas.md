---
pattern: button
status: new
related: step-picker, step-inspector, playbook-canvas, agent-graph
---

## Overview

An agent workflow drawn as a node graph. Each step is a compact card: its kind's icon, the kind (Trigger, AI, Tool,
Condition, Approval, Output), the title, a one-line summary and, during a run, its status in a mark and a word.
Curved connectors with arrowheads join the steps, labelled where a branch needs it ("over 10k"). While a run is in
flight, the steps colour by status and the connector into the running step flows.

People build the workflow on the canvas. They drag steps to arrange them and drag from a step's output port onto
another step to connect them. The keyboard does everything the pointer does: move a step, connect it from a menu,
add a step after it, or remove it. The same graph is also a list of steps and where each one leads, for screen
readers and narrow screens.

## When to use

- Building or editing an agent workflow with branches – conditions, approvals, several outputs.
- Watching a workflow run, step by step, with failures standing out.
- Any small directed graph people arrange by hand: a pipeline, a routing plan, an escalation path.

## When not to use

- A playbook set out phase by phase, without a free layout – use `playbook-canvas`.
- Agents calling tools as a live network, laid out for you – use `agent-graph`.
- Adding a step from a catalogue – use `step-picker`, opened from this canvas's `tc-add-request`.
- Editing one step's inputs – use `step-inspector` for the selected step.

## Anatomy

1. **Toolbar** `.ui-wfc__tools` – zoom out, zoom in, Fit, Add step, Connect, Move, Delete and List, and the zoom level
2. **Canvas** `.ui-wfc__viewport` – the dotted surface you pan and zoom
3. **Step** `.ui-wfc__node` – a step card: icon, kind, title, summary and status
4. **Status** `.ui-wfc__status` – the run status as a mark and a word
5. **Port** `.ui-wfc__port` – the dot on a step's right edge to drag a connector from
6. **Connector** `.ui-wfc__edge` – a curved line with an arrowhead, and its label `.ui-wfc__edge-label`
7. **Connect menu** `.ui-wfc__menu` – "Connect … to", a checkable list of the other steps
8. **List** `.ui-wfc__list` – the same steps as a numbered list, each with where it leads

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The canvas, steps and connectors are the same in both. Set the canvas height with
`--tc-wfc-h`, and each kind's icon colour with `--tc-wfc-trigger`, `--tc-wfc-llm`, `--tc-wfc-tool`,
`--tc-wfc-condition`, `--tc-wfc-approval` and `--tc-wfc-output`.

## Keyboard

The toolbar, the canvas and the steps are a tab stop each.

| Key | What it does |
|---|---|
| ← / → | In the toolbar, move between its buttons |
| Arrow keys | On the canvas, pan; on a step, move to the nearest step in that direction |
| + / − / 0 | On the canvas, zoom in, zoom out, or fit every step – never below 75%, so a large workflow opens at its first step and the rest is a pan away |
| Enter / Space | Selects the step |
| M | Starts moving the step: arrows move it 8 px (Shift: 32 px), Enter or M keeps it, Escape puts it back |
| C | Opens "Connect … to": ↑ / ↓ move, Enter connects or disconnects, Escape closes |
| A | Asks the page to add a step after this one |
| Delete / Backspace | Removes the step and its connectors |
| Escape | Clears the selection |
| Home / End | Moves to the first or last step |

## Screen readers

The canvas is a group named by the heading and described by its keys. Each step is a toggle button, pressed while
it's selected, that reads its kind, title, summary, status and where it leads ("Leads to Manager approval (over
10k), Post to ledger (10k or less)"), and is described by the step keys. The connectors, ports and labels are hidden;
each step's description carries them. The toolbar is a toolbar; Connect opens a menu of checkable items, one per
step. Selecting, moving, connecting, removing and zooming are confirmed in a polite status message. The List view
is a numbered list of the same steps.

## Content

- Title steps with a verb and an object: "Extract fields", "Match purchase order", "Post to ledger".
- Use `summary` for the one thing worth knowing at a glance – the mailbox, the rule, the system it writes to.
- Label a connector only where it's a branch: "over 10k", "approved", "rejected".
- Place steps left to right in the order they run; branches above and below.

## Do

- Open a `step-picker` on `tc-add-request`, and place the new step to the right of `after`.
- Show `status` only while a run is in flight or just finished.
- Keep the page's copy of `nodes` and `edges` in step through `tc-nodes-change` and `tc-edges-change`.

## Don't

- Don't use colour alone for a step's status – the mark and the word come with it.
- Don't draw more than a couple of dozen steps; group them into sub-workflows instead.
- Don't let a connector loop back on the same step.

## Example

```html
<tc-workflow-canvas id="flow" heading="Invoice approval"></tc-workflow-canvas>

<script type="module">
  import "@adamstavely/trenchcoat/workflow-canvas";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  flow.nodes = [
    { id: "received", kind: "trigger", title: "Invoice received", x: 0, y: 80, status: "done" },
    { id: "extract", kind: "llm", title: "Extract fields", summary: "Vendor, amount, PO number", x: 250, y: 80, status: "running" },
    { id: "post", kind: "output", title: "Post to ledger", x: 500, y: 80 },
  ];
  flow.edges = [
    { from: "received", to: "extract" },
    { from: "extract", to: "post" },
  ];
  flow.addEventListener("tc-add-request", (e) => console.log("add a step after", e.detail.after));
</script>
```

```tsx
import { useState } from "react";
import { WorkflowCanvas, type WorkflowEdge, type WorkflowNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function InvoiceFlow({ onAdd }: { onAdd: (after: string | null) => void }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: "received", kind: "trigger", title: "Invoice received", x: 0, y: 80 },
    { id: "post", kind: "output", title: "Post to ledger", x: 250, y: 80 },
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([{ from: "received", to: "post" }]);
  return <WorkflowCanvas title="Invoice approval" nodes={nodes} edges={edges} onNodesChange={setNodes} onEdgesChange={setEdges} onAddRequest={onAdd} />;
}
```
