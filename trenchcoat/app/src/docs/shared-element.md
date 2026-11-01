---
pattern: none
status: new
related: collapse, blur-crossfade, dialog, file-details
---

## Overview

A piece of content grows into its detail view, so people keep their place. The detail grows out of the summary's box and shrinks back into it, and focus moves with it. With reduced motion it simply switches.

## When to use

- A row or card that opens into more of itself.
- A preview that becomes the full view in the same spot.

## When not to use

- Opening a section in place – use `collapse`.
- Swapping unrelated content – use `blur-crossfade`.
- A task that needs its own focus and blocks the page – use `dialog`.

## Anatomy

1. **Summary** `[data-shared="summary"]` – what shows when shut
2. **Detail** `[data-shared="detail"]` – what it grows into
3. **Toggle** `[data-shared-toggle]` – opens or closes it

## Looks

No look of its own. It follows `--tc-duration-slow` and `--tc-ease-move`. Style the two parts yourself.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on a toggle | Opens or closes it |
| Escape | Closes it |

On opening, focus goes to the detail's first control; on closing, back to the summary.

## Screen readers

The part that isn't showing is `hidden`, so it's skipped. Toggles get `aria-expanded`. Focus moving tells people where they've landed.

## Content

Use real buttons as toggles. Give the detail a heading that repeats the summary's name.

## Do

- Keep the two parts visibly the same thing, so the growth makes sense.

## Don't

- Don't use it for detail far larger than the page. The growth gets hard to follow.

## Example

```html
<tc-shared-element>
  <button data-shared="summary" data-shared-toggle>Trial 12</button>
  <div data-shared="detail"><button data-shared-toggle>Close</button> The whole report</div>
</tc-shared-element>

<script type="module">
  import "trenchcoat/shared-element";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { SharedElement } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Row() {
  return (
    <SharedElement>
      <button data-shared="summary" data-shared-toggle>Trial 12</button>
      <div data-shared="detail"><button data-shared-toggle>Close</button> The whole report</div>
    </SharedElement>
  );
}
```
