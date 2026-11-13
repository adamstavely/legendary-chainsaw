---
pattern: radio
status: new
related: feedback-rubric, verification-queue, eval-scorecard, eval-criteria-editor
---

## Overview

A queue for grading real outputs one at a time, fast, from the keyboard. Each item shows what the model was asked,
what it answered and – when there is one – the answer it should have given. Under it are quick grades: pass or fail
for some criteria, a number on a scale for others. There's a note, and an overall verdict that's suggested from the
grades and can be changed. Submit, and the next ungraded item comes up.

Progress reads "12 of 40 · 3 skipped" with a bar. Skipped items wait at the end, Undo takes back the last submit, and
when everything is done a summary offers to go back to the skipped ones.

## When to use

- Grading samples of live traffic against a fixed set of criteria.
- Building or checking an eval set by hand, where reviewers get through hundreds of items.
- Calibrating reviewers, when everyone grades the same queue.

## When not to use

- Rating one answer in depth, with failure types and a corrected answer – use `feedback-rubric`.
- Checking the claims inside one document – use `verification-queue`.
- Reading pass rates across versions – use `eval-scorecard`.
- Defining what a judge model asks – use `eval-criteria-editor`.

## Anatomy

1. **Progress** `.ui-rvq__progress` – how many are graded and skipped, with a bar, in the header
2. **Item bar** `.ui-rvq__nav` – Previous, "Item 4 of 40", where the item came from, and Next
3. **Blocks** `.ui-rvq__blocks` – the input, the output and the reference side by side, stacked when narrow
4. **Criteria** `.ui-rvq__crits` – each criterion's name and question, and its grades as a segmented radio group
5. **Note and verdict** `.ui-rvq__bottom` – an optional note, and Pass or Fail, marked "suggested" until changed
6. **Foot** `.ui-rvq__foot` – Keys, Undo last, Skip and Submit
7. **Done** `.ui-rvq__done` – the summary when every item is graded or skipped
8. **Keys dialog** `.ui-rvq__dialog` – every shortcut, in a table

## Looks

Standard puts the heading and progress on a gray tray with the queue on a white card. Clean is one white card with
hairline dividers and uppercase captions. A picked Pass is green and a picked Fail red, each with a mark and the word.
Below 560 px wide, the blocks stack and each criterion's grades go under its name. Long inputs and outputs scroll
within `--tc-rvq-text-h` (180 px).

## Keyboard

Single-key shortcuts work anywhere in the queue except while typing in the note, and never with Ctrl, ⌘ or Alt held.

| Key | What it does |
|---|---|
| P / F | Pass or fail the current criterion – the focused one, else the first without a grade – then move to the next |
| 1 – 5 | Score the current criterion when it's a scale |
| V, then P / F | Set the overall verdict |
| Enter | Submit and go to the next ungraded item (on a button other than a grade, presses that button) |
| J / K | Next or previous item |
| S | Skip the item |
| U | Undo the last submit and go back to it, grades and note restored |
| N | Go to the note; Escape leaves it, Ctrl/⌘ + Enter submits from it |
| ? | Show the keys |
| ← → ↑ ↓ / Home / End | In a criterion's grades, move and pick, wrapping round |

## Screen readers

The queue is a `group` named by the heading and described by a short list of the shortcuts. Progress is a
`progressbar` whose value text reads "12 of 40 · 3 skipped". The input, output and reference are regions named by
their labels. Each criterion is a `radiogroup` named by the criterion and described by its question, with
`aria-required`; when Submit finds it ungraded it gets `aria-invalid`, the description "Pick a grade", and focus. A
status region says each grade as it's set ("Correct: Pass"), "Submitted, failed. 13 of 40 graded", skips, undo and
moves between items. The keys open in a modal `dialog` named "Keyboard shortcuts" that returns focus when closed.

## Content

- Phrase each criterion's `description` as the question a reviewer answers: "Does it stick to the policy text?".
- Use pass or fail where the answer is yes or no; keep scales for things with degrees, and to 1–5.
- Give items a `source` – the channel and date – so reviewers can spot patterns.
- Keep notes optional; ask for one in your guidelines when the verdict is Fail.

## Do

- Save each grade when `tc-grade` fires, and prevent it if the save fails so the item stays open.
- Show the reference answer when you have one – it makes grading faster and more consistent.
- Keep the criteria the same for the whole queue.

## Don't

- Don't use more than four or five criteria – speed is the point.
- Don't hide the shortcuts; the Keys button and `?` are how people find them.
- Don't reorder items while someone is working through the queue.

## Example

```html
<tc-review-queue id="queue"></tc-review-queue>

<script type="module">
  import "@adamstavely/trenchcoat/review-queue";
  import "@adamstavely/trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.items = [
    { id: "r1", input: "Do I need an itemised receipt for a €30 dinner?", output: "Yes – anything over €25 needs one.", reference: "Itemised above €25 (6.2)." },
    { id: "r2", input: "What's the hotel cap in Geneva?", output: "CHF 180 a night.", reference: "CHF 240 a night (table B)." },
  ];
  queue.addEventListener("tc-grade", (e) => console.log("Graded", e.detail.id, e.detail.verdict, e.detail.grades));
</script>
```

```tsx
import { ReviewQueue, type ReviewQueueGrade, type ReviewQueueItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function GradeSample({ items, save }: { items: ReviewQueueItem[]; save: (grade: ReviewQueueGrade) => void }) {
  return (
    <ReviewQueue
      items={items}
      criteria={[
        { id: "correct", label: "Correct", description: "Is everything it says true?" },
        { id: "helpful", label: "Helpful", description: "How well does it answer?", kind: "scale", min: 1, max: 5 },
      ]}
      onGrade={save}
    />
  );
}
```
