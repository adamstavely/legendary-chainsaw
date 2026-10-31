---
pattern: grid
status: new
related: fan-out-grid, agent-lanes, parallel-attempts, inline-diff
---

## Overview

Which agents working in parallel touch the same files, and where they collide. Each row is a file and each column an agent, with conflicts first, and picking a file shows who touched which lines.

## When to use

- Several agents working on their own branches at once.
- Deciding what to merge first, or which agent to stop.

## When not to use

- Reading a file's changes – use `inline-diff`.
- Watching how far many workers have got – use `fan-out-grid`.
- Two people disagreeing about a verdict – use `review-conflict`.

## Anatomy

1. **Filters** `.ui-cfr__filters` – All and Conflicts, with how many
2. **Grid** `.ui-cfr__grid` – files by agents
3. **File** `.ui-cfr__file` – the path and `.ui-cfr__status`, in a word and a mark
4. **Cell** `.ui-cfr__cell` – the lines that agent changed
5. **Detail** `.ui-cfr__detail` – who touched what, with `.ui-cfr__resolve`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. On a narrow page the grid scrolls in its own box, with the file column staying put.

## Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between cells |
| Home / End | Go to the row's ends |
| Enter / Space | Opens or closes the file |
| Escape | Closes the file |

## Screen readers

It's a `grid` named by the heading, with one tab stop and its keys in a hidden description. Files are row headers, agents column headers, and an empty cell says Not touched. Status is always a word, and `role="status"` says how many conflicts there are.

## Content

Give `lines` wherever you know them, because only crossing line ranges count as a conflict. Without them, two agents on a file is an overlap. A file's own `status` wins, for when your merge tool knows better.

## Do

- Keep `branch` short, because it sits in a column header.
- Listen for `tc-resolve` and start your own merge flow.

## Don't

- Don't read Clear as safe to merge. Two changes can break each other without touching the same lines.

## Example

```html
<tc-conflict-radar id="radar"></tc-conflict-radar>

<script type="module">
  import "trenchcoat/conflict-radar";
  import "trenchcoat/tokens.css";

  const radar = document.querySelector("#radar");
  radar.agents = [{ id: "a", name: "Schema agent", branch: "schema-v3" }, { id: "b", name: "Import agent" }];
  radar.files = [{ path: "src/schema.ts", edits: [{ agent: "a", lines: [12, 60] }, { agent: "b", lines: [48, 75] }] }];
</script>
```

```tsx
import { ConflictRadar, type ConflictAgent, type ConflictFile } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const agents: ConflictAgent[] = [{ id: "a", name: "Schema agent" }, { id: "b", name: "Import agent" }];
const files: ConflictFile[] = [{ path: "src/schema.ts", edits: [{ agent: "a", lines: [12, 60] }, { agent: "b", lines: [48, 75] }] }];

export function Radar() {
  return <ConflictRadar agents={agents} files={files} onResolve={(f) => console.log(f.path)} />;
}
```
