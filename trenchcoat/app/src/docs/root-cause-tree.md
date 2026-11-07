---
pattern: tree
status: new
related: decision-tree, agent-findings, traceability-spine, sandbox-log
---

## Overview

How an agent finds out why something failed, drawn as a fault tree. The failure sits at the top, and the hypotheses
that could explain it sit underneath, each with the evidence it's checked against: a file, a log, a table. Narrower
hypotheses nest under broader ones, and a branch says how its children combine. OR means any one of them could cause
it; AND means only all of them together. As the agent works, the page updates each hypothesis: not checked, checking,
ruled out or confirmed. Ruled-out branches go quiet. Once a hypothesis is confirmed, the way from it up to the failure
lights up, drawn from the cause upwards. The header sums it up in words: "5 hypotheses · 2 ruled out", then
"Cause found". Open any node for its evidence and what the agent found.

## When to use

- Showing an agent's investigation of a failed run, test, import or deploy while it happens, and its result after.
- Any diagnosis where several suspects are checked against evidence and most are ruled out.
- Letting someone check the agent's reasoning: what it ruled out, on what evidence, and why it settled on the cause.

## When not to use

- Questions the agent puts to a person, with branches for the answers – use `decision-tree`.
- Several agents reporting findings as they go, without a tree of suspects – use `agent-findings`.
- A chain of linked items across stages – use `traceability-spine`.
- The raw commands and output the agent ran – use `sandbox-log`.

## Anatomy

1. **Summary** `.ui-rct__summary` – in the header: how many hypotheses, how many ruled out, and the state in words
2. **Tree** `.ui-rct__board` – the drawing, kept at its size and scrolled sideways when the card is narrower
3. **Node** `.ui-rct__node` – the failure or a hypothesis: its status mark and word, title and evidence
4. **Status** `.ui-rct__status` – the mark and the word: Not checked, Checking, Ruled out, Confirmed
5. **Evidence** `.ui-rct__ref` – what the node was checked against, in monospace
6. **Gate** `.ui-rct__gate` – OR or AND where a branch splits
7. **Lines** `.ui-rct__lines` – the links between nodes; a ruled-out branch's are dashed
8. **Lit way up** `.ui-rct__glow` – from the confirmed cause to the failure, drawn link by link
9. **Panel** `.ui-rct__panel` – the open node's status, evidence, finding and how its children combine

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The tree is the same in both. The colour of the lit way up comes from `--tc-rct-path` (the danger
colour by default) and how long each link takes to draw from `--tc-rct-draw`; set either on the element. With reduced
motion the way up appears at once and the Checking mark doesn't turn.

## Keyboard

The nodes are one tab stop; inside the tree the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next node in reading order |
| → | Moves to the node's first child |
| ← | Moves to the node's parent |
| Home / End | Moves to the failure, or to the last node |
| Enter / Space | Opens the node's evidence below the tree, or closes it if it's open |
| Escape | Closes the evidence |
| Tab | Leaves the tree; the panel's Close button comes after it |

## Screen readers

The drawing is a tree named by the heading and described by "Arrow keys move through the tree; Enter opens a node's
evidence". Each node is a tree item with its level, its place among its siblings and whether it's open. Its name is
its status word, title and evidence, and for a branch how its children combine: "Only all 2 below together could
cause this". Opening a node is confirmed in a polite status message, "Opened Station codes are stale", and a newly
confirmed cause is announced: "Cause found: Survey CSV schema changed". The marks, lines and gates are hidden; the
words carry them.

## Content

- Write hypotheses as short claims that can be true or false: "Station codes are stale", not "Station codes?".
- Make `ref` the thing the agent checked: a file name, a log, a table.
- Put what the agent found in `note`, in a sentence, for ruled-out and confirmed nodes alike.
- Use `gate: "and"` only when the cause needs all the children together; OR is the default.

## Do

- Update the hypotheses as the agent works, so people can watch it narrow down.
- Mark the cause and its parent hypothesis confirmed, so the whole way up lights.
- Keep the tree to two or three levels and a handful of hypotheses at each.

## Don't

- Don't remove ruled-out hypotheses; seeing what was excluded is the point.
- Don't put long logs in a note; link to the log with `ref` and summarise it.
- Don't use the tree for steps the agent will take; use a plan for that.

## Example

```html
<tc-root-cause-tree id="why" heading="Why did the import fail?"></tc-root-cause-tree>

<script type="module">
  import "@adamstavely/trenchcoat/root-cause-tree";
  import "@adamstavely/trenchcoat/tokens.css";

  const why = document.querySelector("#why");
  why.failure = { title: "Nightly survey import failed", ref: "import.log", detail: "4 of 12 batches" };
  why.hypotheses = [
    { id: "schema", title: "Survey CSV schema changed", ref: "survey.csv", status: "confirmed", note: "A new column shifted depth." },
    { id: "stations", title: "Station codes are stale", ref: "stations.json", status: "ruled-out", note: "All codes are current." },
    { id: "geocode", title: "Geocoding service timed out", ref: "geocode.log", status: "checking" },
  ];
  why.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.node));
</script>
```

```tsx
import { useState } from "react";
import { RootCauseTree, type RootCauseHypothesis } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const hypotheses: RootCauseHypothesis[] = [
  { id: "schema", title: "Survey CSV schema changed", ref: "survey.csv", status: "confirmed" },
  { id: "stations", title: "Station codes are stale", ref: "stations.json", status: "ruled-out" },
];

export function Investigation() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <RootCauseTree
      title="Why did the import fail?"
      failure={{ title: "Nightly survey import failed", ref: "import.log" }}
      hypotheses={hypotheses}
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}
```
