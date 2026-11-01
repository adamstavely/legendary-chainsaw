---
pattern: none
status: new
related: list-motion, text-reveal, blur-crossfade, collapse
---

## Overview

Children arrive one after another, once, the first time they're seen. The waits are capped, so a long list doesn't keep anyone waiting. Only the animation hides children, so without JavaScript or with reduced motion they're simply there.

## When to use

- A list, set of cards or dashboard appearing for the first time.
- A short result set arriving together.

## When not to use

- Rows that are reordered, added or removed later – use `list-motion`.
- Text arriving word by word – use `text-reveal`.

## Anatomy

1. **Host** `[data-ui="srv"]` – each direct child arrives in turn

## Looks

No look of its own. It follows `--tc-duration-slow` and `--tc-ease-move`. Lay out its children by styling the element as you would the list.

## Keyboard

Nothing to operate. Children can take focus as soon as they're there.

## Screen readers

It adds no role, and children are in the page throughout, so they're read in order.

## Content

Each direct child is one item. Children added later arrive without the stagger.

## Do

- Keep `delay` short, and let `max-delay` do its job.

## Don't

- Don't use it on every view of a page people return to often. It only plays once for each element, so remounting it replays it.

## Example

```html
<tc-staggered-reveal><div>One</div><div>Two</div></tc-staggered-reveal>

<script type="module">
  import "trenchcoat/staggered-reveal";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { StaggeredReveal } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Cards({ names }: { names: string[] }) {
  return <StaggeredReveal>{names.map((n) => <div key={n}>{n}</div>)}</StaggeredReveal>;
}
```
