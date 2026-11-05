---
pattern: none
status: new
related: awaiting-review, all-done, scan-status, progress-bar
---

## Overview

A document with a progress ring on it, with the words Processing. It's for a long job that's still running – an export, a scan, an import, an agent's background task – so people know it's under way and that they can leave and come back. It's only a picture: it doesn't show how far along the job is.

## When to use

- A job that takes longer than people will want to watch, with a promise of what happens when it's done ("we'll email you").
- The empty space where a result will appear once the job finishes.

## When not to use

- Content held until someone approves it – use `awaiting-review`.
- Progress you can measure – use `progress-bar`, with this beside it if you like.
- A short wait of a second or two – use `shimmer-loader`.
- A scan with steps and a result – use `scan-status`.

## Anatomy

1. **Page** `.ui-pcs-page` – the work being done
2. **Mark** `.ui-pcs-badge` – the round badge, with the turning ring `.ui-pcs-ring`
3. **Words** `.ui-pcs-caption` – what's happening; the default is Processing

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say beside it what's being done and roughly how long it takes: "Preparing your export – a few minutes". Say what happens
next – an email, the result appearing here – so people don't start the job twice.

## Do

- Give a time if you have one, and let people leave: the job shouldn't need the page open.
- Show a `progress-bar` beside it when you can measure progress.

## Don't

- Don't use it for a wait of a second or two; a shimmer or spinner in place is calmer.
- Don't leave it up after the job failed; say what went wrong instead.

## Example

```html
<tc-processing></tc-processing>

<script type="module">
  import "trenchcoat/processing";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { Processing } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function State() {
  return <Processing />;
}
```
