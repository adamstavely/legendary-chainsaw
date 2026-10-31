---
pattern: none
status: new
related: something-wrong, no-access, results-list, ai-search
---

## Overview

A magnifying glass passing over a list of blank results. It tells people the search worked and simply matched nothing, so they try different words instead of waiting.

## When to use

- A search with no results, above a suggestion to change the words.
- A list whose filters leave nothing, beside a way to clear them.

## When not to use

- Somewhere with nothing in it yet – use `glass-folder` or `empty-calendar`.
- Results someone isn't allowed to see – use `no-access`.
- A search that failed – use `something-wrong`.

## Anatomy

1. **List** `.ui-nfd-card` – the blank results
2. **Row** `.ui-nfd-row` – one blank result
3. **Glass** `.ui-nfd-glass` – looks across a few times, then rests

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes `role="img"` named
by the label. The heading beside it usually says enough, so leave `label` off unless the picture adds something.

## Content

Pair it with a short heading ("No results for that search") and one line on what to do next.

## Do

- Size its container, not the illustration: it fills the width at a 3 : 2 frame.
- Put a real action next to it, such as Clear filters.

## Don't

- Don't rely on the picture alone to say what happened. Always add words.

## Example

```html
<tc-nothing-found></tc-nothing-found>
<h2>No results for that search</h2>

<script type="module">
  import "trenchcoat/nothing-found";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { NothingFound } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return (
    <div>
      <NothingFound />
      <h2>No results for that search</h2>
    </div>
  );
}
```
