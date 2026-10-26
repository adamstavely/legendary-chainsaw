---
pattern: tabs
status: new
related: inline-diff, answer-arena, parallel-attempts, trace-waterfall
---

## Overview

Two runs of an agent, or two versions of a prompt, side by side – the baseline on the left, the candidate on the
right – with every difference highlighted. Outputs and prompts are compared word by word; steps are lined up by name
and marked Added, Dropped or Changed; time, cost, tokens, steps and score sit under each run, the candidate's with
its change against the baseline in green or red. It answers “what did my change actually do?” before someone ships a
new prompt or model. A candidate that is still running streams in, and the comparison follows as it grows.

## When to use

- Checking a new prompt or model against the current one on the same input, before rolling it out.
- Explaining why one run cost more, took longer or failed where another didn't.
- Letting people keep the better of two runs – turn on `can-pick` (or pass `onPick`) for “Use this”.

## When not to use

- Two models' answers to a chat prompt, for people to vote on – use `answer-arena`.
- Three or more attempts at once – use `parallel-attempts`.
- A change to one piece of text, to accept or reject – use `inline-diff`.
- Where one run spent its time, step by step – use `trace-waterfall`.

## Anatomy

1. **Header** `.ui-rc__bar` – the heading, the number of differences and the tabs
2. **Tabs** `.ui-rc__tabs` – Output, Steps and Prompt, each with its count of differences
3. **Run** `.ui-rc__run` – one side's label, model, status and numbers
4. **Numbers** `.ui-rc__nums` – time, cost, tokens, steps and score, with the candidate's change
5. **Comparison** `.ui-rc__panel` – the open tab: the two texts or the lined-up steps

## Looks

Standard puts the header on a gray tray and the comparison on a white card inside it. Clean is one white card with
hairline dividers, and its struck words are gray and its added words keep the text colour, over the same tints. Both stack the
two sides – baseline above candidate – when the component is narrow.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the open tab, then into the comparison (and to “Use this”, when shown) |
| → / ← | Opens the next or previous tab, wrapping round |
| Home / End | Opens the first or last tab |
| Enter / Space | On “Use this”, picks that run |

## Screen readers

The tabs are a `tablist` named by the heading; each `tab` has `aria-selected` and its count read as words (“Output,
3 differences”), and controls one `tabpanel`. Words only one run has are `<del>` (baseline) and `<ins>` (candidate)
elements. Each side's numbers are a description list named “Prompt v4 in numbers”, and the candidate's changes are
read with their tone: “(−18%, better)”. Steps say Added, Dropped, Changed, Failed and Skipped in words, and the
missing side reads “Not in this run” or “Not taken”. Once both runs are through, a `status` region sums up: “Prompt
v4 against Prompt v3: 12 differences in the output, 2 steps differ. −18% time, better”. “Use this” buttons are named
with the run: “Use this: Prompt v4”.

## Content

- Make the heading the task both runs did: “Refund reply”, not “Comparison”.
- Label runs so people can tell them apart at a glance – “Prompt v4”, “Run #4182” – and use `model` for what else
  sets them apart.
- Give steps stable names (a tool's name works) – steps are matched by name, so a renamed step reads as one dropped
  and one added.
- Keep step details to one line: the arguments or the result that matters.

## Do

- Put the version people already trust on the left as `baseline`.
- Pass a `formatCost` that matches your billing – the default is dollars.
- Add `score` from your evals, so the comparison isn't only about speed and cost.

## Don't

- Don't compare runs on different inputs – the differences would be about the input, not your change.
- Don't rely on colour alone in your own surroundings; the component already says better and worse in words.
- Don't offer “Use this” when nothing happens after a pick.

## Example

```html
<tc-run-compare id="compare" heading="Refund reply" can-pick></tc-run-compare>

<script type="module">
  import "trenchcoat/run-compare";
  import "trenchcoat/tokens.css";

  const compare = document.querySelector("#compare");
  compare.baseline = { id: "v3", label: "Prompt v3", output: "I've started a refund of $89.00.", duration: 5200, cost: 0.031 };
  compare.candidate = { id: "v4", label: "Prompt v4", output: "Your refund of $89.00 is on its way.", duration: 4300, cost: 0.024 };
  compare.addEventListener("tc-pick", (e) => console.log(e.detail.run.id));
</script>
```

```tsx
import { RunCompare, type RunCompareRun } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const v3: RunCompareRun = { id: "v3", label: "Prompt v3", output: "I've started a refund of $89.00.", duration: 5200, cost: 0.031 };
const v4: RunCompareRun = { id: "v4", label: "Prompt v4", output: "Your refund of $89.00 is on its way.", duration: 4300, cost: 0.024 };

export function PromptReview({ onKeep }: { onKeep: (id: string) => void }) {
  return <RunCompare title="Refund reply" baseline={v3} candidate={v4} onPick={(pick) => onKeep(pick.run.id)} />;
}
```
