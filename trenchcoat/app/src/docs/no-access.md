---
pattern: none
status: new
related: access-request, share-panel, nothing-found, something-wrong
---

## Overview

A folder held shut by a padlock. It tells people they've reached something they aren't entitled to see, which reads clearer and calmer than a bare error.

## When to use

- The page shown when someone opens data they aren't entitled to, above a way to ask for access.
- A file or folder that's listed but restricted.

## When not to use

- The request itself – use `access-request`.
- Nothing to show, with no restriction – use `nothing-found`.
- Something that failed – use `something-wrong`.

## Anatomy

1. **Folder** `.ui-nac-front` – the pocket the page sits behind
2. **Page** `.ui-nac-page` – what's inside, faint and out of reach
3. **Lock** `.ui-nac-lock` – settles a few times, then rests

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes `role="img"` named
by the label. The heading beside it usually says enough, so leave `label` off unless the picture adds something.

## Content

Pair it with a short heading ("You don't have access to this") and one line on what to do next.

## Do

- Size its container, not the illustration: it fills the width at a 3 : 2 frame.
- Put a real action next to it, such as Request access.

## Don't

- Don't rely on the picture alone to say what happened. Always add words.

## Example

```html
<tc-no-access></tc-no-access>
<h2>You don't have access to this</h2>

<script type="module">
  import "trenchcoat/no-access";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { NoAccess } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return (
    <div>
      <NoAccess />
      <h2>You don't have access to this</h2>
    </div>
  );
}
```
