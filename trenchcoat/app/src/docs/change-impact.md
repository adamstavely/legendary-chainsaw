---
pattern: list
status: new
related: quality-trend, quality-drop, run-compare, dumbbell-chart
---

## Overview

Did this change make the agent better or worse? For one change – a prompt version, a model, a tool – the card sets
the chats before it against the chats after it. Each judge criterion is a row: the two means as a dumbbell, the
difference, and a verdict in words – "Better, likely", "No clear change" or "Worse, likely" – worked out from the
counts the page sends, so a wobble on a quiet week isn't read as a result. Cost per chat and latency follow, with the
sample sizes and a line that sums it all up. A segment switch reads the same change for one slice of the traffic.

## When to use

- Deciding whether to keep a change that has been live for a while, or a canary running beside the old version.
- Explaining a release's effect to people who won't read a chart.
- Finding which slice of the traffic a change hurt or helped.

## When not to use

- Scores day by day with every change on the axis – use `quality-trend`.
- One drop that needs a decision now – use `quality-drop`.
- Two single runs step by step – use `run-compare`.
- Before and after for many items with no verdict – use `dumbbell-chart`.

## Anatomy

1. **Summary** `.ui-chi__line` – the verdicts in one sentence, and the cost change
2. **Samples** `.ui-chi__samples` – how many chats each side rests on
3. **Segment** `.ui-chi__seg` – all traffic or one slice
4. **Row** `.ui-chi__row` – a criterion: name and chats, the dumbbell, before → after and the difference, the verdict
5. **Examples** `.ui-chi__examples` – buttons for each side's example chats
6. **Cost and latency** `.ui-chi__metrics` – before → after and the change in %

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card. The overall verdict is a pill in
the header – Better, Worse, Mixed or No clear change. A row's "after" dot and the bar between the dots take
`--tc-change-impact-better`, `--tc-change-impact-worse` or `--tc-change-impact-same`, beside an arrow and the verdict's
words. Narrow, each row stacks: name and verdict, the dumbbell, then the numbers and examples.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the segment switch, then each row's before and after example buttons |
| ↑ / ↓ | In the segment switch, picks another segment |
| Enter / Space | On an example button, asks for that side's example chats (tc-examples-open) |

## Screen readers

The rows are a list named "Criteria"; each reads its name, chats, "4.42 to 3.81 −0.61" and its verdict in words. The
dumbbell is hidden – the numbers say it. The example buttons read "v13 examples, Correctness". Cost and latency are a
description list ("Cost per chat £0.012 to £0.0096, −19%, lower"). Changing the segment says the new summary in a
status region.

## Content

- Send pass counts (`{ passes, n }`) for yes/no criteria and means with their spread (`{ mean, n, sd }`) for scores.
- Name the sides as people know them – "v13" and "v14", or "Atlas 2" and "Atlas 3".
- Set `higherIsBetter: false` on a criterion where less is better, such as a refusal rate.
- Compare like with like: the same days of the week, the same traffic mix, on each side.

## Do

- Wait for enough chats – a "No clear change" on a small sample is an honest answer.
- Add the segments people ask about (topic, language, customer tier).

## Don't

- Don't read "No clear change" as "no change": it means the data can't tell yet.
- Don't mix judges or rubric versions between the two sides.

## Example

```html
<tc-change-impact id="impact"></tc-change-impact>

<script type="module">
  import "@adamstavely/trenchcoat/change-impact";
  import "@adamstavely/trenchcoat/tokens.css";

  const impact = document.querySelector("#impact");
  impact.change = { label: "Prompt v13 → v14", before: "v13", after: "v14" };
  impact.criteria = [
    { id: "correct", label: "Correctness", before: { mean: 4.42, n: 1240, sd: 0.9 }, after: { mean: 3.81, n: 1184, sd: 1.1 } },
    { id: "cites", label: "Cites policy", before: { passes: 1066, n: 1240 }, after: { passes: 829, n: 1184 } },
    { id: "tone", label: "Tone", before: { mean: 4.31, n: 1240 }, after: { mean: 4.52, n: 1184 } },
  ];
  impact.cost = { before: 0.0118, after: 0.0096 };
  impact.addEventListener("tc-examples-open", (e) => console.log(e.detail.criterion, e.detail.side));
</script>
```

```tsx
import { ChangeImpact, type ImpactCriterion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReleaseImpact({ criteria }: { criteria: ImpactCriterion[] }) {
  return (
    <ChangeImpact
      title="Did v14 help?"
      change={{ label: "Prompt v13 → v14", before: "v13", after: "v14" }}
      criteria={criteria}
      onExamplesOpen={(criterion, side) => console.log(criterion, side)}
    />
  );
}
```
