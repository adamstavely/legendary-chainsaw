---
pattern: feed
status: new
related: feedback-rubric, inline-diff, evaluation-dataset-editor, eval-scorecard
---

## Overview

Turns a conversation into a reviewed example. Reviewers select a span inside any message and label it from your label
set, redact text that mustn't leave the review, rate each answer and write the answer it should have been – shown as a
word diff against the original. Labels appear as marks in the text with a legend that counts them, and every
annotation is listed beside the transcript with a way back to it – hovering or focusing one lights up its span, and
hovering a mark lights up its entry. "Send to dataset" hands your app the example with redacted text already
blanked out; the component stores nothing and sends nothing itself.

## When to use

- Reviewing production conversations to build evaluation or fine-tuning sets.
- Labelling failure modes – wrong facts, unsupported claims, sensitive data – at the span where they happen.
- Quality review where reviewers rate answers and correct the bad ones in the same pass.

## When not to use

- Scoring one answer against several criteria with failure types – use `feedback-rubric`.
- Accepting or rejecting an AI's suggested edits to a piece of text – use `inline-diff`.
- Editing the cases of a test set directly – use `evaluation-dataset-editor`.
- Showing how test cases did across versions – use `eval-scorecard`.

## Anatomy

1. **Legend** `.ui-cva__keys` – a key per label with its shortcut and count, plus Redact
2. **Turn** `.ui-cva__turn` – one message: its role, its rating and its text
3. **Mark** `.ui-cva__mark` – labelled text in the label's colour, followed by the label's name
4. **Redaction** `.ui-cva__redacted` – a bar where redacted text was
5. **Correction** `.ui-cva__fixed` – the corrected answer as a word diff, with Edit and Remove
6. **Annotation list** `.ui-cva__list` – every span, with a jump to it and a remove button
7. **Send** `.ui-cva__send` – hands the reviewed example to your app

## Looks

Standard is a gray tray with the header on the tray and the transcript on a white card; user turns sit on a soft fill,
and the legend keys are filled chips. Clean is one white card: hairline dividers separate the turns, role labels and
the list heading use the caption style, the legend keys are outlined and the selection is a lighter accent tint. Both
draw labels as highlighter fills in the label's tone with a solid edge under them. From 760 px wide the annotation list
sits beside the transcript and stays in view as the page scrolls; narrower, it follows the transcript, and at its
narrowest the rating wraps under the role.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the legend, the active turn, its rating and correction controls, the annotation list and Send |
| ↑ / ↓, Page Up / Page Down | On a turn: moves to the previous or next turn |
| Home / End | On a turn: moves to the first or last turn |
| ← / → | On a turn: moves the caret to the previous or next word; a selection collapses to its start or end |
| Shift + ← / → | On a turn: extends the selection by a word |
| Shift + Home / End | On a turn: extends the selection to the start or end of the message |
| Ctrl + A / ⌘ + A | On a turn: selects the whole message |
| 1–9 | On a turn: applies that label to the selection |
| R | On a turn: redacts the selection |
| Esc | On a turn: clears the selection; in the correction editor: cancels it |
| ← / → / ↑ / ↓ | In the legend: moves between keys; in a rating: picks the previous or next level |
| Enter / Space | On a legend key: applies it; on a rating level: picks it, or clears it when it's already picked |
| Delete / Backspace | On an annotation in the list: removes it |

Selecting with the mouse works too: the selected text becomes the turn's selection and the turn takes focus, so the
number keys apply straight away. The selection is trimmed of spaces at either end before a label is applied.

## Screen readers

The transcript is a `feed` named by the heading; each turn is an `article` named “Assistant, turn 2 of 4” with
`aria-posinset` and `aria-setsize`. Marked text is a `mark` followed by the label in brackets – “60 days (Incorrect)”;
a redaction reads “Redacted – 25 characters”, and the redacted text isn't in the page. The legend is a `toolbar` named
“Labels” and described by the hint under it (“Select text in a message to label it…”, or the selected text and the keys
to press); keys are `aria-disabled` until there's a selection and carry `aria-keyshortcuts`. A rating is a `radiogroup`
named “Rate assistant turn”. In a correction, removed words read “removed: …” and added ones “added: …”. A polite
status region says what happened: “Selected “within 60 days””, “Labelled Unsupported: “60 days””, “Redacted 25
characters”, “Rated Poor”, “Removed Incorrect”, “Select some text first”. In a form, an annotation whose text has
changed makes the control invalid.

## Content

- Name labels for what the reviewer found, in a word or two: “Incorrect”, “Unsupported”, “Sensitive”. Give each a
  `description` – it's the key's tooltip.
- Keep the set short. The first nine get the number keys, and four or five fit on one line.
- Use `roleLabels` for your own role names and `author` for who wrote a message; leave out names the dataset shouldn't
  carry.
- Give the levels of `ratingLevels` a word each – “Poor”, “Okay”, “Good” – they're the button text.

## Do

- Store the value as it is – spans with offsets and quotes, ratings and corrections – and send `example` (or
  `prepareAnnotationExport`) to the dataset, never the raw messages.
- Set `sending` while your app stores the example and `sent` once it has, and clear `sent` when the review changes.
- Pass your own `labels`, `rateRoles` and `correctRoles`; system and tool turns rarely need a rating.

## Don't

- Don't rely on redaction here to remove data from your own systems – it blanks the export copy only.
- Don't change a message's text under existing spans: they're flagged as changed and the form becomes invalid.
- Don't use colour alone for labels in your own views of the data – the component always shows the label's name.

## Example

```html
<tc-conversation-annotation id="review"></tc-conversation-annotation>

<script type="module">
  import "trenchcoat/conversation-annotation";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.heading = "Ticket 48213";
  review.messages = [
    { id: "m1", role: "user", text: "Can I send my backpack back?" },
    { id: "m2", role: "assistant", text: "Yes, within 60 days of purchase." },
  ];
  review.value = { spans: [], ratings: {}, corrections: {} };
  review.addEventListener("tc-send", (e) => console.log(e.detail.example));
</script>
```

```tsx
import { useState } from "react";
import { ConversationAnnotation, type AnnotationMessage, type ConversationAnnotationValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const messages: AnnotationMessage[] = [
  { id: "m1", role: "user", text: "Can I send my backpack back?" },
  { id: "m2", role: "assistant", text: "Yes, within 60 days of purchase." },
];

export function Review() {
  const [value, setValue] = useState<ConversationAnnotationValue>({ spans: [], ratings: {}, corrections: {} });
  return <ConversationAnnotation title="Ticket 48213" messages={messages} value={value} onChange={setValue} onSend={(example) => console.log(example)} />;
}
```
