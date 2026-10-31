---
pattern: none
status: new
related: nothing-found, no-access, toaster, guardrail-notice
---

## Overview

Two connected tiles with the line between them broken and a small warning mark. It tells people a page or request failed, calmly, and suits work where an alarming error would be out of place.

## When to use

- A page or panel that couldn't load, above Try again.
- A connection or service that isn't answering.

## When not to use

- A search that worked and found nothing – use `nothing-found`.
- Someone without permission – use `no-access`.
- A short-lived problem that doesn't replace the page – use `toaster`.

## Anatomy

1. **Tiles** `.ui-swr-tile` – the two ends of the connection
2. **Wires** `.ui-swr-wire` – the line that no longer meets
3. **Mark** `.ui-swr-spark` – the warning and the break, pulsing a few times

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes `role="img"` named
by the label. The heading beside it usually says enough, so leave `label` off unless the picture adds something.

## Content

Pair it with a short heading ("We couldn't load this") and one line on what to do next.

## Do

- Size its container, not the illustration: it fills the width at a 3 : 2 frame.
- Put a real action next to it, such as Try again.

## Don't

- Don't rely on the picture alone to say what happened. Always add words.

## Example

```html
<tc-something-wrong></tc-something-wrong>
<h2>We couldn't load this</h2>

<script type="module">
  import "trenchcoat/something-wrong";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { SomethingWrong } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return (
    <div>
      <SomethingWrong />
      <h2>We couldn't load this</h2>
    </div>
  );
}
```
