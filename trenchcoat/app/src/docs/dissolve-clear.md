---
pattern: button
status: new
related: ai-search, search-history, facet-sidebar, text-reveal
---

## Overview

Wraps a text input and adds a clear button that shows while the input has text. Clearing empties the field at once, so the page's state changes straight away, while a copy of the old text dissolves over it: each letter drifts and blurs out from left to right. Focus stays in the input, and Escape in the input clears it too. With reduced motion the text goes at once, with no dissolve.

## When to use

- Search and filter fields, where people clear and start again often.
- Short text fields with a quick way to start over.

## When not to use

- Long text in a textarea – the dissolve is for a line.
- Fields where clearing loses work that can't be typed again quickly.
- A field that should reset to a default rather than empty – reset it with a button that says so.

## Anatomy

1. **Host** `[data-ui="dclr"]` – wraps the page's input
2. **Clear button** `.ui-dclr__clear` – the ×, shown while there's text
3. **Ghost** `.ui-dclr__ghost` – the copy of the text that dissolves, made of `.ui-dclr__letter`s

## Looks

No look of its own: the input keeps the page's styles, with room at its end for the button. A page can set `--tc-dissolve-clear-button` (the button's size) and `--tc-dissolve-clear-room` (the input's end padding).

## Keyboard

| Key | What it does |
|---|---|
| Escape (in the input) | Clears the text |
| Tab | Moves to the clear button while there's text |
| Enter or Space (on the button) | Clears the text, and focus goes back to the input |

## Screen readers

The button's name is `clear-label` ("Clear"). After clearing, a polite status says `cleared-label` ("Cleared"). The dissolving copy is hidden from screen readers.

## Content

- Give the input its own label; the element doesn't add one.
- Rename the button for the field when it helps: "Clear search".

## Do

- Let `tc-clear` (or `onClear`) undo filtering that depended on the text.

## Don't

- Don't add a second clear button – the native search × is hidden inside it.

## Example

```html
<tc-dissolve-clear clear-label="Clear search">
  <input type="search" placeholder="Search findings" aria-label="Search findings" />
</tc-dissolve-clear>

<script type="module">
  import "@adamstavely/trenchcoat/dissolve-clear";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { useState } from "react";
import { DissolveClear } from "@adamstavely/trenchcoat/react";

export function FindingSearch() {
  const [query, setQuery] = useState("");
  return (
    <DissolveClear clearLabel="Clear search" onClear={(value) => console.log("cleared", value)}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search findings" aria-label="Search findings" />
    </DissolveClear>
  );
}
```
