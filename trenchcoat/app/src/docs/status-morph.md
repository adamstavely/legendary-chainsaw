---
pattern: none
status: new
related: success-check, number-change, blur-crossfade, share-panel
---

## Overview

One state's mark changing into the next, with its word. The old mark fades and shrinks as the new one grows in, so a change of status is seen without any jump. Nothing loops.

## When to use

- A check or job moving through states, such as checking to done.
- A row whose status changes while someone's reading it.

## When not to use

- A one-time tick for something finished – use `success-check`.
- Swapping whole pieces of content – use `blur-crossfade`.
- A long list of steps – use `progress-tracker`.

## Anatomy

1. **Mark** `.ui-smo-mark` – holds `.ui-smo-icon`, the state's mark
2. **Word** `.ui-smo-word` – the state in words

## Looks

No look of its own. It follows the status tokens, `--tc-duration-moderate` and `--tc-ease-move`, and sizes to the surrounding text.

## Keyboard

Nothing to operate. It takes no focus.

## Screen readers

The word is plain text and the mark is hidden. Changes aren't announced unless `announce` is set, which adds a `role="status"` message.

## Content

Rename words with `labels`, or set `label` for one in context: "Checking access".

## Do

- Set `announce` when a change matters and people aren't looking at it.

## Don't

- Don't use it for states that change many times a second. The movement stops meaning anything.

## Example

```html
<tc-status-morph status="checking" announce></tc-status-morph>

<script type="module">
  import "trenchcoat/status-morph";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { StatusMorph } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Check({ done }: { done: boolean }) {
  return <StatusMorph status={done ? "done" : "checking"} announce />;
}
```
