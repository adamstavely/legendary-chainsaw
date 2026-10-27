---
pattern: radio
status: stable
related: run-compare, answer-arena, fan-out-grid, model-picker
---

## Overview

An agent tries the same task several ways at once, and the best one wins. Every attempt races as a row with its
model, its approach and a live bar showing how far it is and what it's doing; once it's through it gets a score or
says why it failed. When all are through, the best finished attempt is marked “Best” and picked on its own – and
people can switch to another with “Use this one”. The bar on top counts how many are done and what they cost
together.

## When to use

- Running one task with several models or strategies and keeping the best result.
- Showing why one result was chosen – scores side by side – and letting people overrule the choice.
- Fixes, drafts or plans where a few tries are cheap and one good answer is what counts.

## When not to use

- Comparing two runs or prompt versions in depth, output by output – use `run-compare`.
- Two answers that a person judges themselves – use `answer-arena`.
- Many different sub-tasks running at once, not one task tried several ways – use `fan-out-grid`.
- Choosing a model before anything runs – use `model-picker`.

## Anatomy

1. **Header** `.tc-head` – a lanes icon, the heading and the task, with “2 of 4 done” and the total cost at the right
2. **Attempt** `.ui-pa__row` – one try: its mark, name, model, approach and current step or outcome
3. **Mark** `.ui-pa__icon` – the model maker's logo, or the attempt's first letter
4. **Lane** `.ui-pa__lane` – the bar that fills as the attempt runs
5. **Result** `.ui-pa__end` – the percentage, then the score or “Failed”; “Use this one” once all are through

## Looks

Standard stacks a white card per attempt on the gray tray, with the header on the tray above them. Clean drops the
tray: the header sits above the list and every attempt is a quiet card with hairline shadows. Both race the same bars, fade
the attempts not in use, and mark the best one green.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the “Use this one” buttons – one stop for the group, on the one in use |
| ↓ / → | Picks the next finished attempt and moves focus to it, wrapping round |
| ↑ / ← | Picks the previous finished attempt |
| Enter / Space | Picks the focused attempt |

The buttons appear once every attempt is through; only finished attempts with a result can be picked.

## Screen readers

The attempts are a `radiogroup` named by the heading (“Best of 4” unless set); each “Use this one” is a `radio` with
`aria-checked`, named “Use this one: Attempt A, score 92” or “In use: Attempt A, score 92”. The progress bars are
hidden – a status region doesn't read running percentages, only the result once all are through and each pick: “4
of 4 done, best: Attempt A. Using Attempt A.”

## Content

- Name attempts plainly (“Attempt A”) and put the difference in `approach`: “Mock the payment API”, “Add explicit
  waits”.
- Write `step` as what it's doing now, with a count where there is one: “Running tests 12/20”.
- Use `note` for the outcome in a few words – “20/20 runs green” – or the error when it failed.
- Set `task` to the goal they share: “Fix the flaky checkout test”.

## Do

- Score every finished attempt on the same 0–100 scale, so the best one is the highest.
- Listen to `tc-picked-change` (`onPick`) for both the automatic pick (`auto: true`) and a person's choice.
- Pass `took` and `cost`, so people can weigh a slightly better result against a slower or dearer one.

## Don't

- Don't race more than about five attempts – the rows get hard to compare.
- Don't leave `score` empty on a finished attempt you want to win – an attempt without one counts as 0.
- Don't pick for people once they've chosen – keep `picked` on their choice.

## Example

```html
<tc-parallel-attempts id="race" task="Fix the flaky checkout test"></tc-parallel-attempts>

<script type="module">
  import "trenchcoat/parallel-attempts";
  import "trenchcoat/tokens.css";

  const race = document.querySelector("#race");
  race.attempts = [
    {
      id: "a",
      name: "Attempt A",
      approach: "Mock the payment API",
      model: "Claude Sonnet",
      status: "done",
      score: 92,
      note: "20/20 runs green",
      took: 41000,
      cost: 0.31,
    },
    {
      id: "b",
      name: "Attempt B",
      approach: "Add explicit waits",
      model: "Claude Haiku",
      status: "running",
      progress: 0.6,
      step: "Running tests 12/20",
    },
  ];
  race.addEventListener("tc-picked-change", (e) => console.log(e.detail.picked, e.detail.auto));
</script>
```

```tsx
import { ParallelAttempts, type Attempt } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function FixRace({ attempts, apply }: { attempts: Attempt[]; apply: (id: string) => void }) {
  return (
    <ParallelAttempts
      title="Parallel attempts"
      task="Fix the flaky checkout test"
      attempts={attempts}
      onPick={(attempt) => apply(attempt.id)}
    />
  );
}
```
