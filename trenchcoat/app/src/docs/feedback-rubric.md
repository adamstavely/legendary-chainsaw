---
pattern: radio
status: new
related: message-actions, segmented-control, eval-scorecard, inline-diff
---

## Overview

A structured rating of one answer, for the people who review a model's work. Each rubric criterion – accuracy,
completeness, tone by default – gets a score on its own scale, the reviewer marks what kind of failure it was
(hallucination, missing context, wrong tone…), and can write the answer it should have been, starting from the
answer itself. “What gets sent” shows the payload as JSON, and Send fires it as one event once every required
criterion has a score. The result is data a team can train and evaluate on – which a thumbs-down isn't.

## When to use

- Review queues where people grade answers against a rubric.
- Turning a bad answer into an eval case: the scores, the failure type and the ideal answer in one go.
- Collecting corrections from experts, where the fixed answer matters more than the score.

## When not to use

- Quick feedback under every chat message – use `message-actions` and its thumbs.
- Picking one of a few options outside a rating – use `segmented-control`.
- Reading the results of many rated cases – use `eval-scorecard`.
- Suggesting edits to a draft for someone else to accept – use `inline-diff`.

## Anatomy

1. **Answer** `.ui-fbr__answer` – the answer being rated, folded to three lines when long
2. **Criteria** `.ui-fbr__crits` – each criterion's name and question, and its scale
3. **Scale** `.ui-fbr__scale` – the levels as a segmented radio group, the picked word beside it
4. **Failure types** `.ui-fbr__chips` – toggles for what went wrong, any number of them
5. **Correction** `.ui-fbr__fix` – the ideal answer: a button that starts it from the answer, then the editor
6. **Foot** `.ui-fbr__foot` – “What gets sent” and Send; once sent, “Rating sent” and “Edit rating”

## Looks

Standard puts the heading and the scored count on a gray tray and the rubric on a white card inside it; the failure
types are gray chips. Clean is one white card with hairline dividers, uppercase section captions and outlined chips.
Narrow (under 480 px), each scale goes under its criterion and fills the width.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Show all (when the answer folds), each scale (one stop each), the failure types, the correction, “What gets sent” and Send |
| → / ↓ | In a scale, picks the next level, wrapping round; with nothing picked, picks the first |
| ← / ↑ | In a scale, picks the previous level, wrapping round; with nothing picked, picks the last |
| Home / End | In a scale, picks the first or last level |
| Enter / Space | Picks a level, toggles a failure type, or presses the focused button |

## Screen readers

The card is a `group` named by the heading. Each scale is a `radiogroup` named by its criterion and described by its
question, with `aria-required` unless the criterion is optional; each level is a `radio` named with its number and
word (“4, Good”) and `aria-checked`. When Send finds a criterion without a score, its group gets `aria-invalid` and is
described by “Pick a score”, focus moves to it, and a status region says “Score 2 more criteria before sending”. The
failure types are a `group` named “What went wrong” of toggle buttons with `aria-pressed`. The correction is a
textarea labelled “The ideal answer” and described by its change count (“3 changes to the answer”). “What gets sent”
is a disclosure button with `aria-expanded`; the JSON it shows is focusable and named “What gets sent, as JSON”. Send
has `aria-busy` while the app saves, and the status region says “Rating sent” when it's done.

## Content

- Phrase each criterion's `description` as the question a reviewer answers: “Is everything it says true?”.
- Give every level a word, so a score reads the same to everyone – “4, Good”, not a bare 4.
- Keep failure types to the kinds your team acts on differently; put the explanation in `description`, which shows as
  the tooltip.
- Use `meta` for what ties the rating to its answer – the message id, the model, the prompt version – not for text
  people should read.

## Do

- Mark criteria that don't always apply `optional`, so reviewers aren't forced to guess.
- Set `sending` while you save, and prevent `tc-submit` (or return false from `onSubmit`) if the save can fail.
- Keep the rubric the same across reviewers and over time – changing the scale breaks comparisons.

## Don't

- Don't ask for more than four or five criteria at once – reviewers start scoring by feel.
- Don't seed the correction with an ideal answer of your own; it starts from the answer being rated.
- Don't hide “What gets sent” – reviewers trust a rating more when they can see what leaves the page.

## Example

```html
<tc-feedback-rubric id="rubric"></tc-feedback-rubric>

<script type="module">
  import "trenchcoat/feedback-rubric";
  import "trenchcoat/tokens.css";

  const rubric = document.querySelector("#rubric");
  rubric.answer = "You can return it to any store for a full refund and a $15 voucher.";
  rubric.meta = { messageId: "msg_8812_3", model: "claude-sonnet" };
  rubric.addEventListener("tc-submit", (e) => fetch("/ratings", { method: "POST", body: JSON.stringify(e.detail) }));
</script>
```

```tsx
import { FeedbackRubric, type FeedbackRubricSubmit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ReviewItem({ answer, onSave }: { answer: string; onSave: (rating: FeedbackRubricSubmit) => void }) {
  return (
    <FeedbackRubric
      answer={answer}
      criteria={[
        { id: "accuracy", label: "Accuracy", description: "Is everything it says true?" },
        { id: "grounded", label: "Grounded", description: "Does it stick to the sources?", optional: true },
      ]}
      onSubmit={onSave}
    />
  );
}
```
