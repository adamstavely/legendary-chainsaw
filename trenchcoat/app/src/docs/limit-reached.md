---
pattern: none
status: new
related: something-wrong, offline, no-access, budget-burn
---

## Overview

A gauge with its arc full and its needle at the end, a clock beside it, and the words Usage limit reached. It's for work that's stopped until a quota or rate limit resets – an agent's run, an API's calls, a plan's allowance. It's drawn like the other state illustrations: a soft tile, one pastel mark, a soft glow beneath.

## When to use

- A quota, a plan's allowance or a rate limit has stopped the work until a reset.
- An agent or model run that can't go on until more budget is approved.

## When not to use

- A request that failed for another reason – use `something-wrong`.
- No network – use `offline`.
- Someone without permission – use `no-access`.

## Anatomy

1. **Gauge** `.ui-ulm-tile` – the meter, its arc full to the end
2. **Needle** `.ui-ulm-needle` – pressed against the limit
3. **Clock** `.ui-ulm-clock` – the reset still to come
4. **Words** `.ui-ulm-caption` – what's happened; the default is Usage limit reached

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say when it resets and what people can do now: "Your team's 500 runs reset on 1 December. Ask an admin to raise the limit." Give the exact time in their time zone.

## Do

- Say when the limit resets, and what raising it involves.
- Keep their work: say it will continue, or can be resumed, after the reset.

## Don't

- Don't make it look like an error people caused.
- Don't hide which limit it was when there are several.

## Example

```html
<tc-limit-reached></tc-limit-reached>

<script type="module">
  import "trenchcoat/limit-reached";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { LimitReached } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <LimitReached />;
}
```
