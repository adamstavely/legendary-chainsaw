---
pattern: toolbar
status: new
related: conversation-annotation, comment-thread, comments-panel, inline-diff
---

## Overview

A document people can mark up together. Select a passage with the pointer or the keyboard and a small toolbar offers
a highlight colour, Comment and Copy. Highlights stay in the text as coloured marks; comments sit in a margin rail
beside the passage they're about, and move under the text when the component is narrow. Each note can be edited,
resolved or removed, and the rail can be narrowed to one colour, one person or the open notes only. The app owns the
annotations: every change is a cancelable event.

## When to use

- Reviewing a draft, a brief, a contract or a post-mortem, where comments belong to exact sentences.
- Letting readers keep their own highlights in long text, in a colour code they choose.
- Showing a document someone else has annotated, read-only, with the notes beside the passages.

## When not to use

- Labelling turns of a conversation for a dataset (redaction, ratings, corrections) – use `conversation-annotation`.
- A discussion about a whole item rather than a passage – use `comment-thread`, or `comments-panel` for many threads.
- Proposing a rewrite to accept or reject – use `inline-diff`.

## Anatomy

1. **Text** `.ui-tan__text` – the document; one tab stop with a caret for selecting by keyboard
2. **Highlight** `.ui-tan__mark` – a passage marked in a colour; resolved ones are a dotted underline
3. **Filters** `.ui-tan__filterbar` – show one colour, one person or the open notes only
4. **Rail** `.ui-tan__rail` – the notes, each beside its highlight (under the text when narrow)
5. **Note** `.ui-tan__note` – who and when, the comment, and Edit, Resolve and Remove

## Looks

Standard puts the header on the gray tray and the document on a white card; each note is a small raised card with a
coloured edge. Clean is one white card with the header as its first row, notes as quiet rows that tint on hover, and
thinner icons. Both use the highlight colour tokens (`--tc-highlight-*`); Clean's fills
are a step lighter in the light theme.

## Keyboard

| Key | What it does |
|---|---|
| ← / → | In the text: moves the caret a character (with a selection, collapses it to that end) |
| Ctrl + ← / → (Alt on a Mac) | Moves the caret a word |
| ↑ / ↓ | Moves the caret a line |
| Home / End (⌘ + ← / → on a Mac) | To the start or end of the line; with Ctrl (⌘ + ↑ / ↓ on a Mac), of the text |
| Shift + any of these | Extends the selection |
| Ctrl / ⌘ + A | Selects all the text |
| Tab | With a selection: into the toolbar |
| 1–5 | With a selection: highlights it in that colour |
| Enter | With the caret in a highlight, or on a highlight: opens its comment to write or edit |
| Delete / Backspace | With the caret in a highlight, or on a highlight: removes it |
| ← → ↑ ↓ / Home / End | On a highlight: the previous or next highlight, the first or last |
| Escape | Closes the toolbar or collapses the selection; on a highlight, back to the text; in a note, back to its highlight; in the editor, cancels |
| ← / → / Home / End | In the toolbar or the filters: moves between buttons |
| Ctrl / ⌘ + Enter | In the editor: saves |
| Ctrl / ⌘ + Z | Restores the highlight just removed |

## Screen readers

The component is a region named by its heading. The text is a `document` named “Document text”, described by how to
select and act on it. The highlights are one tab stop. Each one starts with its colour and comment count – “Yellow
highlight, 1 comment:” – read before its text, and points at its comment with `aria-describedby`. The toolbar is a
`toolbar` named “Selection”; its swatches are “Highlight yellow” and so on. The editor's colours are a `radiogroup`.
A polite status region says what happened:

- “Selected “The export”. Tab for highlight, comment and copy”;
- “Highlighted pink: “Large files””;
- “Green highlight, no comments. Enter opens the comment, Delete removes it” when the caret enters one;
- “Yellow highlight removed. Press Ctrl+Z or Undo to restore it”;
- “Showing 1 of 3 annotations”, “Copied”, “Comment discarded”.

## Content

- `text` is plain text with paragraphs separated by blank lines; it is shown as written. Offsets index into it, so
  keep it stable while annotations point at it.
- Give `author` the person's display name – it's on every note they add and in the author filter.
- Pass `timestamp` to stamp new notes; the component reads no clock. Times are written in `locale`.
- Rename the colours with `colorNames` if your product gives them meanings (“Question”, “Decision”) – they're what
  people hear.

## Do

- Store the whole value from `tc-value-change` and pass it back; `change.type` says what happened, for an activity
  log.
- Use `readonly` to show someone else's annotations: people can still select and copy.
- Offer fewer colours with `colors` when each one means something.

## Don't

- Don't change `text` under existing annotations without moving their offsets – they'd mark the wrong words.
- Don't put the comment's meaning in the colour alone; the colour is a cue, the comment says why.
- Don't use it for text people edit – it annotates fixed text.

## Example

```html
<tc-text-annotator id="review" heading="Post-mortem review" author="Jo Park"></tc-text-annotator>

<script type="module">
  import "trenchcoat/text-annotator";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.text = "Why the welcome emails stopped\n\nFor nine days in March, new customers didn't get their welcome email.";
  review.value = [{ id: "n1", start: 32, end: 54, color: "yellow", author: "Maya Chen", comment: "Exact dates?" }];
  review.timestamp = () => new Date().toISOString();
  review.addEventListener("tc-value-change", (e) => console.log(e.detail.change.type, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { TextAnnotator, type TextAnnotation } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const text = "Why the welcome emails stopped\n\nFor nine days in March, new customers didn't get their welcome email.";

export function Review() {
  const [notes, setNotes] = useState<TextAnnotation[]>([{ id: "n1", start: 32, end: 54, color: "yellow", author: "Maya Chen", comment: "Exact dates?" }]);
  return <TextAnnotator title="Post-mortem review" text={text} author="Jo Park" value={notes} onChange={setNotes} timestamp={() => new Date().toISOString()} />;
}
```
