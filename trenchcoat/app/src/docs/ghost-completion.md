---
pattern: none
status: new
related: inline-diff, writing-assistant, chat-composer, selection-toolbar
---

## Overview

A text field that offers the rest of what you're writing as dimmed text after the caret. The page supplies the
suggestion – from a `suggest(text, signal)` function asked a moment after typing stops, or by setting `suggestion`
itself. Tab takes all of it, Ctrl/⌘ + → takes its next word, and Escape dismisses it. Typing the same letters the
suggestion shows uses them up instead of asking again; typing anything else drops it and asks for a new one. The
suggestion only shows while the caret is at the end of the text, and a small "Tab to accept" hint shows with the
first one.

## When to use

- Writing long-form text where the next sentence is often predictable: findings, summaries, replies, descriptions.
- When suggestions should stay out of the way – visible, but never inserted without a key press.
- A field where a model can complete the current sentence from what's already written.

## When not to use

- Rewriting text that's already there, change by change – use `inline-diff`.
- A conversation with a model about the text – use `writing-assistant` or `chat-composer`.
- Acting on a selection (bold, link, ask) – use `selection-toolbar`.
- Picking from a list of matches as you type – use `combobox` or `mention-picker`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the heading, and "Suggesting…" while one is on its way
2. **Label** `.ui-ghc__label` – the field's visible label
3. **Field** `.ui-ghc__field` – the textarea and its mirror in one cell
4. **Mirror** `.ui-ghc__mirror` – the same text, hidden, so the suggestion lands right after the caret
5. **Suggestion** `.ui-ghc__ghost` – the dimmed text after what's typed
6. **Hint** `.ui-ghc__hint` – "Tab to accept", shown until the first suggestion is taken or dismissed

## Looks

Standard sets the header on a gray tray and the field in a white card below it. Clean is one white card with the
header as its first row. In both the field uses the library's field tokens, and the suggestion is drawn in
`--tc-ghc-ghost` (default `--tc-text-muted`, a colour that passes contrast, never opacity). Under reduced motion the
suggestion appears without a fade; in forced colours it's drawn in `GrayText`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Takes the whole suggestion. With no suggestion showing, moves focus as usual |
| Ctrl + → / ⌘ + → | Takes the suggestion's next word |
| Escape | Dismisses the suggestion until typing asks for another |
| Typing | Matching letters use the suggestion up; other letters drop it |
| Moving the caret | Off the end of the text, the suggestion goes away |

## Screen readers

The textarea is named by its visible label and described by the keys ("Suggestions appear after the cursor as you
type. Tab accepts one…"). A polite status region reads each new suggestion as "Suggestion: …", at most one every two
seconds, so typing isn't drowned out; the drawn mirror is hidden from assistive tech. Tab only takes a suggestion
when one is showing, so keyboard users can still leave the field with Tab otherwise.

## Content

- Suggest the rest of the current sentence, or one short sentence – not a paragraph.
- Start the suggestion with the space it needs: " last completed in March", so it joins the typed text cleanly.
- Return an empty string when you have nothing useful; nothing shows.
- Rename the hint and the announcements with `labels` for other languages.

## Do

- Abort your request when the signal aborts – the person has started typing again.
- Keep `debounce` short enough to feel responsive (200–400 ms) and long enough not to ask on every key.
- Use the value change and `tc-accept` to learn what people take.

## Don't

- Don't insert suggestions into the text yourself – the point is that nothing lands without a key press.
- Don't suggest while the caret is in the middle of the text; the field already hides it there.
- Don't use it for short single-line fields where a list of matches is clearer.

## Example

```html
<tc-ghost-completion id="finding" heading="Finding 4" label="Finding" value="Access reviews for the payments vendor were"></tc-ghost-completion>

<script type="module">
  import "@adamstavely/trenchcoat/ghost-completion";
  import "@adamstavely/trenchcoat/tokens.css";

  const field = document.querySelector("#finding");
  field.suggest = (text, signal) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(text.endsWith("were") ? " last completed in March." : ""), 300);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
  field.addEventListener("tc-accept", (e) => console.log("took", e.detail.text));
</script>
```

```tsx
import { useState } from "react";
import { GhostCompletion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Finding({ complete }: { complete: (text: string, signal: AbortSignal) => Promise<string> }) {
  const [text, setText] = useState("Access reviews for the payments vendor were");
  return <GhostCompletion title="Finding 4" label="Finding" value={text} onValueChange={setText} suggest={complete} />;
}
```
