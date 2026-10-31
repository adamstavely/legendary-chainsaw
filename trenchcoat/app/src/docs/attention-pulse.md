---
pattern: none
status: new
related: success-check, notification-stack, guardrail-notice, share-panel
---

## Overview

Draws the eye once. Wrap what's new, such as a notice, and when `pulse-key` changes a soft ring passes around it a single time. It never loops and never fires on page load.

## When to use

- A notice that has just appeared or changed, such as an entitlement warning.
- A value someone needs to see has updated.

## When not to use

- An ongoing state – show it in words.
- Something on first load, where nothing has changed.
- Announcing to screen readers – use a `role="status"` message.

## Anatomy

1. **Host** `[data-ui="atp"]` – wraps the content, and carries the ring

## Looks

No look of its own. A page can set `--tc-attention-pulse-color`, `--tc-attention-pulse-radius` and `--tc-attention-pulse-reach`.

## Keyboard

Nothing to operate. It takes no focus.

## Screen readers

It says nothing, because it's only a visual cue. Announce anything important in words as well.

## Content

Set `--tc-attention-pulse-radius` to match what it wraps.

## Do

- Use it rarely, so it still means something.

## Don't

- Don't pulse on a timer. Flashing and repeated motion is distracting and an accessibility problem.

## Example

```html
<tc-attention-pulse pulse-key="1"><p>1 person isn't authorized.</p></tc-attention-pulse>

<script type="module">
  import "trenchcoat/attention-pulse";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { AttentionPulse } from "trenchcoat/react";

export function Notice({ id, text }: { id: string; text: string }) {
  return <AttentionPulse pulseKey={id}><p>{text}</p></AttentionPulse>;
}
```
