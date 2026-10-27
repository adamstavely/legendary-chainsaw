---
pattern: toolbar
status: new
related: text-annotator, inline-diff, chat-composer, ai-answer
---

## Overview

Lets people act on part of a model's answer instead of the whole of it. Select a passage with the pointer or the
keyboard and a small toolbar offers Reply, Ask why and Edit. Reply quotes the passage: quotes collect as chips under
the answer until “Reply with 2 quotes” hands them to your composer. Ask why sends a follow-up about that passage.
Edit asks for a rewrite – shorter, simpler, more formal or in the person's own words – and the new wording comes back
inline as a word diff to accept or reject. The component never calls a model: it asks your app through events, and
shows the passage working, the answer, or an error with Retry.

## When to use

- Under an assistant's finished answer, so people can quote exact sentences back, question a claim or fix one
  paragraph without regenerating everything.
- Wherever several passages from one answer might go into the next message.
- When a rewrite of a passage should be reviewed in place before it replaces the original.

## When not to use

- Highlighting and commenting on a document for review – use `text-annotator`.
- Reviewing a whole suggested rewrite of a text – use `inline-diff`.
- Showing an answer while it streams, with its sources – use `ai-answer`, and switch to this once the answer is done.

## Anatomy

1. **Answer** `.ui-rsel__text` – the model's answer; one tab stop with a caret for selecting by keyboard
2. **Quoted passage** `.ui-rsel__quote` – a passage collected for the reply, marked in blue
3. **Suggested edit** `.ui-rsel__edit` – the rewrite as a word diff, with Accept and Reject after it
4. **Quotes** `.ui-rsel__tray` – the collected quotes as chips, Clear, and Reply with N quotes

## Looks

Neither look draws a card: the answer sits on the surface that holds it, such as a chat bubble. Standard sets the
answer a step larger (14 px), gives the quote chips a raised fill and Reject a secondary button. Clean keeps the
answer at body size, draws the chips as hairline outlines and greys the removed words, with thinner icons.

## Keyboard

| Key | What it does |
|---|---|
| ← / → | In the answer: moves the caret a character (with a selection, collapses it to that end) |
| Ctrl + ← / → (Alt on a Mac) | Moves the caret a word |
| ↑ / ↓ | Moves the caret a line |
| Home / End (⌘ + ← / → on a Mac) | To the start or end of the line; with Ctrl (⌘ + ↑ / ↓ on a Mac), of the text |
| Shift + any of these | Extends the selection |
| Ctrl / ⌘ + A | Selects the whole answer |
| Tab | With a selection: into the toolbar. Otherwise to Cancel, or to Accept and Reject, when they're showing |
| ← / → / Home / End | In the toolbar or the quote chips: moves between buttons |
| Enter / Space | On Edit: opens the edit menu, focus on its first item |
| ↑ / ↓ / Home / End | In the edit menu: moves between items |
| Enter | In the edit menu: asks for that edit; in “Your own words…”: sends what you typed |
| Escape | Closes the menu (back to Edit), then the toolbar (back to the answer); with a request pending and nothing selected, cancels it |
| Shift + Tab | In the toolbar: back to the answer |

## Screen readers

The answer is a `document` named “Answer”, described by how to select and act on it. The toolbar is a `toolbar`
named “Selection”; Edit has `aria-haspopup="menu"` and `aria-expanded`, and opens a `menu` named “Request an edit”
whose items are `menuitem`s. “Your own words…” is a small dialog with a field named “How should it change?”. A
quoted passage starts with “Quoted:”, a passage being rewritten with “Being rewritten:”, and while it is the answer
is `aria-busy`. In a suggested edit, removed words start with “removed:” and new ones with “added:”; Accept and Reject
are a group named “Suggested edit”. The quote chips are a `toolbar` named “Quoted passages”, each Remove button
named after its quote. A polite status region says what happened:

- “Selected “Yes”. Tab for reply, ask why and edit”;
- “Quoted “30 days a year”. 1 quote ready to reply with”, “Quote removed. 1 quote left”, “Replying with 2 quotes”;
- “Asked why: “…””;
- “Rewriting “…”. Escape cancels”, “Edit request cancelled”;
- “Suggested edit ready. Tab to Accept or Reject”, “Couldn't rewrite: The model is busy. Retry or dismiss”;
- “Edit accepted”, “Edit rejected”.

## Content

- `text` is the finished answer as plain text, with paragraphs separated by blank lines. Offsets index into it, so
  don't change it while a request is out except by accepting an edit.
- Keep presets short and verb-free (“Shorter”, “More formal”); their `instruction` is what your app sends to the
  model, so write it as an instruction (“Make this shorter”).
- An error in `edit.error` is shown as written, next to Retry: say what went wrong in a few words (“The model is
  busy”), not a code.
- `replyLabel` takes `{n}` for the count – “Reply with {n}” becomes “Reply with 2 quotes”.

## Do

- Answer `tc-edit-request` by setting `edit` to `{ start, end, replacement }` from the request; stop the work when
  `signal` aborts.
- Put the quotes from `tc-reply` (or a single `tc-quote`) into your composer as block quotes the person can still
  edit.
- Store `text` from `tc-text-change` so the accepted wording is what the conversation keeps.

## Don't

- Don't call a model from the page that renders this without telling the person – the passage shimmers and says
  “Rewriting…” only while a request is out.
- Don't set `edit` for a range that no longer matches the text – answer the request you were given.
- Don't use it on text people type into; it acts on fixed text.

## Example

```html
<tc-response-selection id="answer"></tc-response-selection>

<script type="module">
  import "trenchcoat/response-selection";
  import "trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.text = "Yes – you can work from abroad for up to 30 days a year, as long as you tell your manager first.";
  // `rewrite` is your own call to your model
  answer.addEventListener("tc-edit-request", async (e) => {
    const { start, end, passage, instruction, signal } = e.detail;
    try {
      const replacement = await rewrite(passage, instruction, { signal });
      answer.edit = { start, end, replacement };
    } catch {
      if (!signal.aborted) answer.edit = { start, end, error: "The model is busy" };
    }
  });
  // Your composer takes the quotes
  answer.addEventListener("tc-reply", (e) => console.log(e.detail.quotes.map((q) => q.text)));
</script>
```

```tsx
import { useState } from "react";
import { ResponseSelection, type ResponseEdit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

declare function rewrite(passage: string, instruction: string, signal: AbortSignal): Promise<string>;

export function Answer({ answer, onQuote }: { answer: string; onQuote: (quotes: string[]) => void }) {
  const [text, setText] = useState(answer);
  const [edit, setEdit] = useState<ResponseEdit | null>(null);
  return (
    <ResponseSelection
      text={text}
      onTextChange={setText}
      edit={edit}
      onEditReject={() => setEdit(null)}
      onEditRequest={({ start, end, passage, instruction, signal }) => {
        setEdit(null);
        rewrite(passage, instruction, signal).then(
          (replacement) => setEdit({ start, end, replacement }),
          () => !signal.aborted && setEdit({ start, end, error: "The model is busy" }),
        );
      }}
      onReply={(quotes) => onQuote(quotes.map((q) => q.text))}
    />
  );
}
```
