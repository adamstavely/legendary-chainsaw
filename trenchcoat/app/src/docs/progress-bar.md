---
pattern: none
status: new
related: shimmer-loader, usage-meter, progress-tracker, background-tasks
---

## Overview

A thin bar for a page or panel. With `value` it shows how far along things are; without it, a sweep says work is happening. `done` fills it, fades it out and ends the sweep.

## When to use

- A page or panel loading, or one job running.
- A wait of a few seconds or more, where a spinner says too little.

## When not to use

- Placeholders for content that's on its way – use `shimmer-loader`.
- How much of a limit is used – use `usage-meter`.
- Several jobs at once – use `background-tasks`.

## Anatomy

1. **Track** `.ui-pgb-track` – the `role="progressbar"`
2. **Fill** `.ui-pgb-fill` – how far along
3. **Word** `.ui-pgb-word` – shown beside a still bar with reduced motion

## Looks

No look of its own. A page can set `--tc-progress-bar-height`, `--tc-progress-bar-track` and `--tc-progress-bar-fill`.

## Keyboard

Nothing to operate. It takes no focus.

## Screen readers

The track is a `progressbar` named by `label`, with `aria-valuenow` as a percentage when `value` is known and none when it isn't.

## Content

Write `label` as what's being waited for: "Loading results". An unknown wait sweeps until `done`, so always set `done` or remove it.

## Do

- Set `value` when you know it. A real number is more reassuring than a sweep.

## Don't

- Don't leave an unknown wait sweeping if the work failed. Replace it with what went wrong.

## Example

```html
<tc-progress-bar label="Loading results"></tc-progress-bar>

<script type="module">
  import "trenchcoat/progress-bar";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { ProgressBar } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Import({ share }: { share: number }) {
  return <ProgressBar label="Importing" value={share} done={share >= 1} />;
}
```
