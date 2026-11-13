---
pattern: form
status: new
related: edit-region, image-grid, cited-answer, comment-thread
---

## Overview

Point at part of an image, then ask about it. A click drops a numbered pin and a drag draws a box; each mark gets its
own short question, and one question can cover them all. Ask hands the page every mark with its question, in fractions
of the image, and the page streams answers back – one under each mark, and one for the overall question. Marks can be
dragged, nudged and resized from the keyboard, and “Add pin” and “Add box” drop one in the middle, so the whole task
works without a pointer.

## When to use

- Asking a vision model about specific parts of a picture: a chart, a scanned form, a photo, a screenshot.
- Reviewing an image with an assistant – “what does this figure mean?”, “is this label right?”.
- Any question where “this part” is easier to point at than to describe.

## When not to use

- Changing part of an image – use `edit-region`.
- Asking about text with citations to sources – use `cited-answer`.
- Leaving notes on a design for people, not a model – use `comment-thread`.

## Anatomy

1. **Image** `.ui-paq__stage` – the image at its own shape; click or drag on `.ui-paq__surface`
2. **Mark** `.ui-paq__mark` – a numbered pin or a box (`data-kind`), selected with `data-selected`
3. **Add** `.ui-paq__adds` – Add pin, Add box and Clear all
4. **List** `.ui-paq__list` – a row per mark (`.ui-paq__item`): its number button, its question and Remove
5. **Mark answer** `.ui-paq__answer` – the answer under a mark, from `answers`
6. **Question** `.ui-paq__field` – the question over all the marks
7. **Ask** `.ui-paq__ask` – sends it; `.ui-paq__hint` says what's missing first
8. **Answer** `.ui-paq__overall` – the answer to the overall question, from `answer`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Pins are accent discs with their number; boxes are an accent outline with the number on their corner. The list
sits beside the image from 640 px wide and below it when narrower (`--tc-paq-side-min` sets the list's narrowest
width). `--tc-paq-pin` sets a pin's size.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the selected mark on the image (one tab stop), then Add pin, Add box, the list, the question and Ask |
| Arrow keys (mark) | Move the mark 1 px |
| Shift + arrow keys (mark) | Move it 10 px |
| Alt + arrow keys (box) | Resize the box (Shift for 10 px) |
| Delete / Backspace (mark) | Remove the mark; focus moves to the next one |
| Enter (mark) | Go to the mark's question |
| Enter / Space (number in the list) | Select the mark and focus it on the image |
| Ctrl / ⌘ + Enter (question) | Ask |

## Screen readers

The marks are a group named “Marks on the image”; each is a button named by its kind, number and question (“Pin 1: Why
is Q4 the highest?”) and described by the keys. The list is an ordered list named “Marks”; each question field is
labelled “Ask about this: Pin 1” and each Remove button “Remove Pin 1”. A polite live region says “Pin 3 added”, “Box 2
removed” and “Answers ready” when `busy` turns off. While `busy` the card is `aria-busy` and Ask reads “Asking…”.

## Content

- Write the image's `alt` as what it shows, so marks have context for screen-reader users.
- Keep mark questions short – the mark says where, the question says what.
- Stream answers as plain text; keep each to a few sentences.

## Do

- Send coordinates as fractions (`tc-ask` does) and map them to the image's own pixels on the server.
- Clear `busy` when the last answer has arrived, so people can ask again.
- Keep the marks after asking, so follow-up questions point at the same places.

## Don't

- Don't require a mark – a question about the whole image is fine.
- Don't renumber marks behind people's backs; numbers follow the list order.
- Don't put long answers in the overall box when they belong to one mark.

## Example

```html
<tc-point-and-ask
  heading="Ask about page 4"
  src="/images/report-page-4.png"
  alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
></tc-point-and-ask>

<script type="module">
  import "@adamstavely/trenchcoat/point-and-ask";
  import "@adamstavely/trenchcoat/tokens.css";

  const viewer = document.querySelector("tc-point-and-ask");
  viewer.addEventListener("tc-ask", async (e) => {
    const res = await fetch("/api/images/page-4/ask", { method: "POST", body: JSON.stringify(e.detail) });
    const { answers, answer } = await res.json();
    viewer.answers = answers;
    viewer.answer = answer;
    viewer.busy = false;
  });
</script>
```

```tsx
import { useState } from "react";
import { PointAndAsk, type PointAsk, type PointMark } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AskAboutPage({ src, ask }: { src: string; ask: (q: PointAsk) => Promise<{ answers: Record<string, string>; answer: string }> }) {
  const [marks, setMarks] = useState<PointMark[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <PointAndAsk
      title="Ask about page 4"
      src={src}
      alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
      marks={marks}
      onMarksChange={setMarks}
      answers={answers}
      answer={answer}
      busy={busy}
      onAsk={(q) => {
        setBusy(true);
        void ask(q).then((r) => {
          setAnswers(r.answers);
          setAnswer(r.answer);
          setBusy(false);
        });
      }}
    />
  );
}
```
