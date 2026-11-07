---
pattern: none
status: new
related: nothing-found, awaiting-review, empty-calendar, first-use
---

## Overview

An empty tray with a check above it, with the words You're all caught up. It's the positive empty state for an inbox, a queue or a to-do list when nothing is waiting – a finish, not a failure.

## When to use

- An inbox, review queue or notification list that's been cleared.
- A list of tasks where everything is done.

## When not to use

- A search or filter that matched nothing – use `nothing-found`.
- A workspace that's new and has nothing in it yet – use `first-use`.
- A day or week with nothing scheduled – use `empty-calendar`.

## Anatomy

1. **Tray** `.ui-ald-tray` – the empty tray, with its rim `.ui-ald-rim`
2. **Mark** `.ui-ald-mark` – the round badge with the check `.ui-ald-check`
3. **Words** `.ui-ald-caption` – what's happened; the default is You're all caught up

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Keep it short and warm, and say what comes next if anything: "New proposals will show up here". Don't congratulate
people for an empty list they didn't empty.

## Do

- Show it only when the list is truly empty, not while it's still loading.
- Offer a next step if there's a useful one, such as viewing what was done.

## Don't

- Don't use it when a filter hides items – say the filter is on and offer to clear it.
- Don't make it bigger than the list it replaces.

## Example

```html
<tc-all-done></tc-all-done>

<script type="module">
  import "@adamstavely/trenchcoat/all-done";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { AllDone } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <AllDone />;
}
```
