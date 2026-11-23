---
pattern: disclosure
status: new
related: judge-bracket, eval-scorecard, parallel-attempts, budget-guard
---

## Overview

An agent improving its own work against a stated bar, round by round, with a visible end. The bar and "Round 3 of 5" head it, and a small step chart plots each round's score against the bar's line, with a slot for every round up to the cap so the end is always in view. Beside it, the latest critique is the list of remaining issues. The rounds below open one at a time to show what each changed and what the critic said. When the loop ends, a line says how in words: "Met the bar in round 3", or "Stopped at the cap (5 rounds) – 2 issues remain", with those issues kept beside the result.

## When to use

- An agent that drafts, has its draft scored or critiqued, and revises, such as a report revised against a rubric.
- Any loop a person should be able to see the end of, stop, or accept early.

## When not to use

- Several attempts at once with the best one picked – use `parallel-attempts`.
- An LLM judge comparing attempts head to head – use `judge-bracket`.
- Test cases scored across prompt or model versions – use `eval-scorecard`.

## Anatomy

1. **Bar** `.ui-rvl__bar` – what the work must meet, in words
2. **Outcome** `.ui-rvl__outcome` – where the loop stands, with `.ui-rvl__mark`
3. **Chart** `.ui-rvl__plot` – `.ui-rvl__line` and `.ui-rvl__dot` per round, `.ui-rvl__target` for the bar, `.ui-rvl__pending` for a running round, and `.ui-rvl__tick` labels up to the cap
4. **Issues** `.ui-rvl__issues` – the latest critique, each `.ui-rvl__issue`
5. **Rounds** `.ui-rvl__round-list` – each `.ui-rvl__round` with `.ui-rvl__score`, `.ui-rvl__delta` and `.ui-rvl__changed-line`, opening `.ui-rvl__detail`
6. **Actions** `.ui-rvl__actions` – Stop, Accept as is and Run another round; `.ui-rvl__accepted` once accepted

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. When narrow, the chart sits above the issues. A page can set `--tc-rvl-line` for the score line and `--tc-rvl-tick` for the chart's text.

## Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between finished rounds |
| Home / End | Go to the first or last finished round |
| Enter / Space | Open or close a round |
| Escape | Close the open round |
| Tab | Moves to the rounds, then the actions |

## Screen readers

The chart is an image named with every score and the bar ("Score by round: 5.2/10, 6.6/10. The bar is 8/10."). Each finished round is a button with `aria-expanded`, and its change against the round before is read in words. The outcome is a word and a shape as well as a colour. `role="status"` announces each newly scored round and how the loop ended, and never the rounds there at the start.

## Content

Write `bar.label` the way a person would say it: "Rubric score ≥ 8/10". Give `unit` to show after each score. Keep `changed` to one line about what the round did, and each critique item to one issue. Append a round with `status: "running"` as it starts, then replace it with its score and critique. Set `outcome` when the loop ends: `met` when it reaches the bar, `capped` at the cap.

## Do

- Set `cap`, so the end is visible from the first round.
- In React, set `outcome` and `cap` yourself in `onTcStop` and `onTcExtend`, since the wrapper passes them again on every render.

## Don't

- Don't hide the remaining issues when the loop is capped. Those are what the person accepts.
- Don't run past the cap without asking. Run another round is the person's choice.

## Example

```html
<tc-revision-loop id="loop" cap="5"></tc-revision-loop>

<script type="module">
  import "@adamstavely/trenchcoat/revision-loop";
  import "@adamstavely/trenchcoat/tokens.css";

  const loop = document.querySelector("#loop");
  loop.bar = { label: "Rubric score ≥ 8/10", target: 8, unit: "/10", max: 10 };
  loop.rounds = [
    { n: 1, status: "done", score: 6.2, critique: ["No summary up front"] },
    { n: 2, status: "running" },
  ];
  loop.addEventListener("tc-stop", () => console.log("stopped"));
</script>
```

```tsx
import { RevisionLoop, type RevisionLoopRound } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const rounds: RevisionLoopRound[] = [
  { n: 1, status: "done", score: 6.2, critique: ["No summary up front"] },
  { n: 2, status: "done", score: 8.1, critique: [] },
];

export function Loop() {
  return <RevisionLoop bar={{ label: "Rubric score ≥ 8/10", target: 8, unit: "/10", max: 10 }} cap={5} rounds={rounds} outcome="met" />;
}
```
