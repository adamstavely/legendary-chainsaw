---
pattern: none
status: new
related: number-ticker, attention-pulse, status-morph, usage-meter
---

## Overview

A number that briefly highlights when it changes, tinted by direction, with an arrow and a word for screen readers while it does. It never highlights on first render, so nothing flashes because a page loaded.

## When to use

- A live count or total that updates while someone's reading.
- A value someone just changed elsewhere on the page.

## When not to use

- Counting up to a number, digit by digit – use `number-ticker`.
- Drawing the eye to something that isn't a number – use `attention-pulse`.

## Anatomy

1. **Number** `.ui-nch-value` – the formatted number
2. **Arrow** `.ui-nch-arrow` – which way it moved, while highlighted

## Looks

No look of its own. A page can set `--tc-number-change-up` and `--tc-number-change-down`.

## Keyboard

Nothing to operate. It takes no focus.

## Screen readers

The number is plain text. While highlighted, a hidden word says up or down, and the arrow is hidden. It isn't a live region, so wrap it in a `role="status"` where a change must be announced.

## Content

Use `format` for currency, percentages and units. Up is only a direction, so swap the tints where up is bad news, such as errors.

## Do

- Use `direction="none"` where any change is routine.

## Don't

- Don't highlight many numbers at once. Nothing stands out then.

## Example

```html
<tc-number-change value="128"></tc-number-change>

<script type="module">
  import "trenchcoat/number-change";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { NumberChange } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Total({ value }: { value: number }) {
  return <NumberChange value={value} format={{ style: "currency", currency: "USD" }} />;
}
```
