---
pattern: toolbar
status: new
related: response-selection, text-annotator, message-actions
---

## Overview

Translates part of a text where it stands, so people can read a sentence in another language without leaving the
page. Select a passage and choose Translate: a card under it shows the translation in the chosen language, the
language your app detected, and Copy, Replace in place (when the text is editable) and Show original. The target
language is a property your app can remember. The component never calls a translation service: it asks your app
through an event or a resolver function, shows loading, error and Retry, and keeps each answer for the same text and
language.

## When to use

- Messages, notes, reviews or tickets written in other languages, where people need one sentence at a time.
- Shared text people may edit, where a translated sentence can replace the original.
- Anywhere a full-page translation would lose the context around the passage.

## When not to use

- Acting on a model's answer – quoting, asking why, rewriting – use `response-selection`.
- Highlighting and commenting on a document – use `text-annotator`.
- Copying, rating or acting on a whole message – use `message-actions`.

## Anatomy

1. **Text** `.ui-strn__text` – the text; one tab stop with a caret for selecting by keyboard
2. **Toolbar** `.ui-strn__pop` – Translate, over the selection
3. **Card** `.ui-strn__card` – the translation, the detected language and the target select
4. **Actions** `.ui-strn__acts` – Copy, Replace and Show original

## Looks

Neither look draws a card around the text; both use the shared popover surface for the toolbar and the card. Standard
sets the text and the translation a step larger, with Copy as a secondary button and Replace filled. Clean keeps both
at body size, all its actions as ghost buttons with Replace in the accent colour, and thinner icons.

## Keyboard

| Key | What it does |
|---|---|
| ← / → | In the text: moves the caret a character (with a selection, collapses it to that end) |
| Ctrl + ← / → (Alt on a Mac) | Moves the caret a word |
| ↑ / ↓ | Moves the caret a line |
| Home / End (⌘ + ← / → on a Mac) | To the start or end of the line; with Ctrl (⌘ + ↑ / ↓ on a Mac), of the text |
| Shift + any of these | Extends the selection |
| Ctrl / ⌘ + A | Selects all the text |
| Tab | With a selection: to Translate |
| Enter / Space | On Translate: opens the card, focus on its language select |
| Tab / Shift + Tab | In the card: between the select, Copy, Replace, Show original and Close |
| Escape | Closes the card and puts the caret after the passage; closes the toolbar |
| Shift + Tab | On Translate: back to the text |

## Screen readers

The text is a `document` named “Text” (set `text-label`), described by how to select and translate. Set `lang` on the
element for the text's language. The toolbar is a `toolbar` named “Selection”. The card is a non-modal `dialog`
named “Translation” and is `aria-busy` while loading; its select is named “Translate to”, the translation carries the
target's `lang`, and the detected language reads “Detected: French”. Show original is a disclosure button
(`aria-expanded`). While the card is open, the passage starts with “Translating:”. A polite status region says:

- “Selected “Le colis”. Tab to translate”;
- “Translating to English…”;
- “Translated from French to English: The parcel arrived this morning.”;
- “Couldn't translate: Service unavailable. Retry is in the card”;
- “Copied”, “Replaced with the English translation”.

## Content

- `text` is plain text with paragraphs separated by blank lines; it is shown as written.
- Give `languages` the targets your service supports, with names in the language of your interface.
- Return the detected source as a code (“fr”) and the component names it from `languages` or the browser; a name you
  return (“French”) is shown as given.
- Errors are shown as “Couldn't translate: ” and your message – keep it short and plain (“Service unavailable”).

## Do

- Answer with `detail.respondWith()` or `resolveTranslate`, and stop work when `signal` aborts.
- Store `target` from `tc-target-change`, so the next card uses the person's choice.
- Set `editable` only where the text belongs to the person and Replace really changes it.

## Don't

- Don't fire network requests on every selection – the component asks only when Translate is chosen, and caches the
  answer.
- Don't translate the passage silently in place; let people see the translation and choose Replace.
- Don't rely on Replace for text people can't edit: without `editable` it isn't offered.

## Example

```html
<tc-selection-translate id="note" lang="fr" target="en" editable></tc-selection-translate>

<script type="module">
  import "trenchcoat/selection-translate";
  import "trenchcoat/tokens.css";

  const note = document.querySelector("#note");
  note.text = "Le salon de Lyon a attiré plus de visiteurs que prévu.";
  // `translateWithYourService` is your own call to your translation service
  note.resolveTranslate = (text, target, signal) => translateWithYourService(text, target, { signal });
  note.addEventListener("tc-target-change", (e) => localStorage.setItem("target", e.detail.target));
</script>
```

```tsx
import { useState } from "react";
import { SelectionTranslate, type SelectionTranslation } from "trenchcoat/react";
import "trenchcoat/tokens.css";

declare function translateWithYourService(text: string, target: string, signal: AbortSignal): Promise<SelectionTranslation>;

export function Note({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [target, setTarget] = useState("en");
  return (
    <SelectionTranslate
      lang="fr"
      text={text}
      onTextChange={setText}
      editable
      target={target}
      onTargetChange={setTarget}
      resolveTranslate={translateWithYourService}
    />
  );
}
```
