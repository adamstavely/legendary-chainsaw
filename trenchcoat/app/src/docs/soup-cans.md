---
pattern: none
status: new
related: all-done, first-use, nothing-found, awaiting-review
---

## Overview

Three plain soup cans with no labels, standing together at different heights – tall, medium and short – with ridge
rings round each. It's for things that are there but not yet named, sorted or described: uncategorised items, a pantry
or inventory, a pile to work through. The short can in front wobbles a couple of times and rests.

## When to use

- Items that have arrived but haven't been labelled, tagged or categorised.
- A pantry, stock or inventory page with nothing in it yet, or an onboarding step about sorting.

## When not to use

- A search or filter with no matches – use `nothing-found`.
- An inbox or queue with nothing left to do – use `all-done`.
- A brand-new workspace – use `first-use`.

## Anatomy

1. **Cans** `.ui-sop-can` – three tins, each with a body, rims, ridge rings `.ui-sop-ridge` and a lid; `.ui-sop-front` is the short one in front
2. **Glow** `.ui-sop-glow` – the soft shadow beneath the heap
3. **Words** `.ui-sop-caption` – optional; none by default

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

Decorative by default, and skipped. Give it a `caption` to show words under it, which also name it, or a `label` to
name it without showing anything; the host is then `role="img"`.

## Content

When it stands for a state, say it in words beside it or as the caption: "Nothing sorted yet", and what to do next.

## Do

- Pair it with the action that gives things their labels: "Add categories".
- Keep it at a size where the three cans read; it works from about 160px wide.

## Don't

- Don't put words or logos on the cans; they're unlabeled on purpose.
- Don't use it for an error.

## Example

```html
<tc-soup-cans caption="Nothing sorted yet"></tc-soup-cans>

<script type="module">
  import "trenchcoat/soup-cans";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { SoupCans } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <SoupCans caption="Nothing sorted yet" />;
}
```
