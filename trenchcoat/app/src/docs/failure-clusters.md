---
pattern: disclosure
status: new
related: eval-scorecard, evaluation-dataset-editor, quality-alerts, feedback-rubric
---

## Overview

A production agent's failing chats, grouped by topic, the biggest group first. Each cluster is a row with its rank,
its name, a bar for its size, the number of chats and their share of all failures, its trend over the period in a
word and an arrow – "Up 18%", "Flat", "Down 9%" – and the criteria its chats fail. A row opens to a summary of what
goes wrong, a few quotes from the chats, and three actions: Open chats, Add to dataset (to turn the cluster into eval
cases) and Mark as known. Known clusters drop to the bottom and go quiet, so new problems stay on top. Radio chips
filter the clusters to those failing one criterion, and the header says how many failing chats there are in words.
A Bubbles view shows the clusters as circles sized by count, for a glance at where the failures are.

## When to use

- Triage of an agent's failures after a judge has scored live chats.
- Deciding which failures to fix first, and which to turn into eval cases.
- A weekly quality review, with the period in the description.

## When not to use

- Pass and fail per test case across versions – use `eval-scorecard`.
- Editing the eval cases themselves – use `evaluation-dataset-editor`.
- Rating a single answer – use `feedback-rubric`.
- Being told when quality drops – use `quality-alerts`.

## Anatomy

1. **Filter** `.ui-fcl__filter` – radio chips, one per criterion, and All criteria
2. **Views** `.ui-fcl__views` – List or Bubbles
3. **Row** `.ui-fcl__row` – a cluster: rank, name, bar, count and share, trend and criteria; opens the detail
4. **Bar** `.ui-fcl__bar` – the cluster's size against the biggest
5. **Trend** `.ui-fcl__trend` – an arrow and a word: Up, Down or Flat, with the change
6. **Detail** `.ui-fcl__detail` – the summary, quotes and actions of an open cluster
7. **Quote** `.ui-fcl__quote` – a line from a failing chat
8. **Actions** `.ui-fcl__actions` – Open chats, Add to dataset, Mark as known
9. **Bubble** `.ui-fcl__bubble` – in Bubbles view, a cluster as a circle sized by count

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. A page can resize the bars with `--tc-fcl-bar-h` and the largest bubble with `--tc-fcl-bubble`.

## Keyboard

The rows (or bubbles) are one tab stop; the filter's chips are a radio group.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next cluster |
| Home / End | Moves to the first or last cluster |
| Enter / Space | Opens or closes the cluster |
| Tab | Moves into the open cluster's actions, then on |
| ← / → in the filter | Chooses the previous or next criterion |

## Screen readers

The clusters are an ordered list named by the heading. Each row is a button named by the cluster and described by
its facts in words, "142 chats, 34%, Up 18%, fails Correctness, fails Cites policy", with `aria-expanded` and
`aria-controls` pointing at its detail. The trend never rests on colour: the word says which way it went. The detail
is a region named by the cluster; its actions are described by the cluster's name, so "Add to dataset" is heard with
what it adds. Mark as known is a toggle button. Marking a cluster and adding it to the dataset are confirmed in a
polite status message.

## Content

- Name clusters for the topic people asked about, not the failure: "Expense limits abroad", not "Wrong answers".
- Write the summary as what the agent does wrong, in one or two sentences.
- Quote the shortest part of a chat that shows the failure – the question and the wrong answer.
- Keep criterion names the same as the judge's rubric.

## Do

- Pass `total` when the clusters don't cover every failing chat, so shares stay honest.
- Mark clusters that are already being fixed as known, so new ones stand out.
- Put the agent and period in the description.

## Don't

- Don't show every cluster the clustering found; merge the small ones into "Other".
- Don't rely on the colours of the trend – the words carry it.
- Don't put personal details in quotes; redact names before they reach the page.

## Example

```html
<tc-failure-clusters id="clusters" heading="Failure clusters" description="Policy desk · last 7 days"></tc-failure-clusters>

<script type="module">
  import "@adamstavely/trenchcoat/failure-clusters";
  import "@adamstavely/trenchcoat/tokens.css";

  const clusters = document.querySelector("#clusters");
  clusters.clusters = [
    { id: "abroad", label: "Expense limits abroad", count: 142, trend: { direction: "up", change: 18 }, criteria: ["Correctness", "Cites policy"],
      summary: "Quotes the domestic limits for overseas trips.", examples: [{ id: "e1", quote: "What's the hotel limit in Lisbon? — 180 a night." }] },
    { id: "leave", label: "Carrying over annual leave", count: 96, trend: { direction: "flat" }, criteria: ["Correctness"] },
  ];
  clusters.addEventListener("tc-add-to-dataset", (e) => console.log("add", e.detail.id));
</script>
```

```tsx
import { FailureClusters, type FailureCluster } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const clusters: FailureCluster[] = [
  { id: "abroad", label: "Expense limits abroad", count: 142, trend: { direction: "up", change: 18 }, criteria: ["Correctness", "Cites policy"] },
  { id: "leave", label: "Carrying over annual leave", count: 96, trend: { direction: "flat" }, criteria: ["Correctness"] },
];

export function Failures() {
  return <FailureClusters title="Failure clusters" clusters={clusters} onClusterOpen={(id) => console.log("open", id)} onAddToDataset={(id) => console.log("add", id)} />;
}
```
