---
pattern: disclosure
status: new
related: feedback-rubric, eval-scorecard, instruction-editor, review-queue
---

## Overview

Where a team writes down what an LLM judge should ask about each answer. Each criterion is a question with its kind
of answer – pass or fail, a whole number on a scale with words at its ends, or one of a few labels – a weight, and
optionally worked examples the judge can learn from. Weights show as each criterion's share of the overall score, so
"3" reads as "50%".

Criteria fold to one row each – number, name, kind and share – and open to edit in place. Problems are said in words
beside the field: no name, no question, two criteria with one name, a scale the wrong way round, a label kind with
fewer than two labels. "Judge prompt" shows the prompt the criteria assemble into, read-only with Copy, and "Try on
sample" hands the criteria to the page once nothing is wrong.

## When to use

- Setting up an automated judge for an agent's evals.
- Reviewing and changing a judge's rubric with the team, where the prompt itself should stay visible.
- Keeping human review and the judge on the same criteria.

## When not to use

- Rating one answer against a rubric – use `feedback-rubric`.
- Reading how versions scored – use `eval-scorecard`.
- Writing the agent's own instructions – use `instruction-editor`.
- Grading outputs by hand, one after another – use `review-queue`.

## Anatomy

1. **Row** `.ui-ece__row` – the disclosure with the number, name, kind and any problems, the share, and Move up, Move down and Remove
2. **Share** `.ui-ece__share` – the criterion's share of the score as a bar and a percentage
3. **Body** `.ui-ece__body` – the open criterion's name, weight, question, answer kind and examples
4. **Kind fields** `.ui-ece__scale` – a scale's ends and their words; a label kind has a comma-separated field instead
5. **Examples** `.ui-ece__examples` – worked examples: an answer, its verdict and why
6. **Bar** `.ui-ece__bar` – Add criterion, the Judge prompt disclosure, and Try on sample
7. **Prompt** `.ui-ece__prompt` – the assembled judge prompt with Copy

## Looks

Standard puts the heading and the count on a gray tray with the criteria on a white card. Clean is one white card with
hairline dividers and uppercase captions. A criterion with problems after Try gets a red edge, and its problems are
said in words. Below 520 px the kind and the share bar leave the row, and the fields stack.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each row, its Move and Remove buttons, the open criterion's fields, Add criterion, Judge prompt and Try |
| Enter / Space | On a row, opens or closes it; on a button, presses it |
| Alt + ↑ / Alt + ↓ | On a row, moves the criterion up or down; focus stays on it |
| ← → | In the answer kinds, picks the next or previous one |

## Screen readers

Each row is a disclosure button with `aria-expanded`, described by "Alt plus up or down arrow moves it"; the open body
is a `group` named by the row. Every field has a visible label; a problem sets `aria-invalid` and is linked with
`aria-describedby`. The answer kind is a group of native radios with the legend "Answer". The share reads "50% of the
score". The Move and Remove buttons name the criterion they act on. A status region says what changed: "Moved Tone to
position 1 of 3", "Removed Helpful", "Criterion 4 added", "2 problems to fix before trying". The prompt is a focusable,
labelled block that scrolls.

## Content

- Write each question as the judge should read it: "Does the answer state the policy correctly, with the right figures?".
- Name criteria with one word where you can – the name becomes the key in the judge's JSON reply.
- Put words on a scale's ends ("Not at all", "Fully") so the judge and people read the numbers the same way.
- Add an example for the cases the judge gets wrong, with why in a short clause.

## Do

- Show the judge prompt to reviewers – they should know exactly what the judge is asked.
- Keep the criteria in the order people think about them; the judge asks them in that order.
- Re-run the judge on a sample after every change, with "Try on sample".

## Don't

- Don't use weights to hide a criterion – remove it instead.
- Don't ask two questions in one criterion; split them.
- Don't change criteria in the middle of a comparison between versions.

## Example

```html
<tc-eval-criteria-editor id="judge"></tc-eval-criteria-editor>

<script type="module">
  import "@adamstavely/trenchcoat/eval-criteria-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const judge = document.querySelector("#judge");
  judge.criteria = [
    { id: "correct", name: "Correct", question: "Is the policy stated correctly?", type: "pass-fail", weight: 3 },
    { id: "helpful", name: "Helpful", question: "How well does it answer?", type: "scale", scale: { min: 1, max: 5, anchors: { 1: "Not at all", 5: "Fully" } }, weight: 2 },
  ];
  judge.addEventListener("tc-try", (e) => console.log(e.detail.prompt));
</script>
```

```tsx
import { useState } from "react";
import { EvalCriteriaEditor, type JudgeCriterion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function JudgeSetup({ initial, run }: { initial: JudgeCriterion[]; run: (prompt: string) => void }) {
  const [criteria, setCriteria] = useState(initial);
  return <EvalCriteriaEditor criteria={criteria} onCriteriaChange={setCriteria} onTry={(_, prompt) => run(prompt)} />;
}
```
