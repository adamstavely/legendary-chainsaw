---
pattern: none
status: new
related: thinking-loader, thinking-state, background-tasks, diff-table
---

## Overview

A small row that says some work is under way: a 5 × 5 grid of dots lit in a pattern, a label with a light sweeping
over it, and how long the work has taken so far – 0.2s, 12s, 1m 4s. Four patterns give different kinds of work their
own feel: a diagonal wave, a lit dot driving a snake path, a seeded twinkle and an orbit round the edge. When the work
ends, the dots settle into a check for done or a cross for an error, and the clock stops.

## When to use

- A step that takes a few seconds or more, where seeing the time pass reassures – reading files, matching records,
  exporting.
- Several jobs at once, each with its own pattern so they're told apart at a glance.
- A row in a list of tasks, with `size="sm"`.

## When not to use

- The gap before a chat reply, with phases – use `thinking-loader`.
- Showing the sources and reasoning steps as they happen – use `thinking-state`.
- Long jobs people leave and come back to – use `background-tasks`.

## Anatomy

1. **Grid** `.ui-pxl__grid` – 25 dots, `.ui-pxl__dot`, lit in the pattern, then in a check or a cross
2. **Label** `.ui-pxl__label` – what the work is, with `.ui-pxl__shine` sweeping over it while it runs
3. **Time** `.ui-pxl__time` – the time since `started`
4. **Status** `.ui-pxl__sr` – the hidden line screen readers announce

## Looks

Standard is a capsule with a hairline border and dark dots. Clean is a white chip with a hairline shadow and accent
dots. Done lights the check in the success colour; error lights the cross in the danger colour – the shape says it as
well as the colour. Pages can resize the grid with `--tc-pixel-loader-dot` and `--tc-pixel-loader-gap`, and slow or
speed the pattern with `--tc-pixel-loader-cycle`.

## Keyboard

Nothing to operate – the loader only reports.

## Screen readers

A hidden `role="status"` line announces the label when the loader appears and again when the work ends (“Done:
Exporting the register”, “Failed: Uploading to the archive”). The grid, the moving label and the ticking time are
hidden, so the time isn't read out every tenth of a second.

## Content

- Write the label as a short present-tense activity, sentence case, no full stop: “Reading the audit log”.
- Keep it to a few words – a long label is cut off.
- Rename the ending words with `labels` (`{ done, error }`) when the page has its own.

## Do

- Pass `started` when the work began before the loader appeared, so the time is the real time.
- Set `state` to `done` or `error` as soon as you know – the clock stops there.
- Pass `now` from your own clock when many loaders share one page, so they tick together.

## Don't

- Don't leave a loader working after the work has ended; it keeps counting.
- Don't use the colour of the end shape alone to say what happened – keep the label clear.
- Don't put several loaders on the same piece of work.

## Example

```html
<tc-pixel-loader id="loader" label="Reading the audit log" pattern="orbit"></tc-pixel-loader>

<script type="module">
  import "@adamstavely/trenchcoat/pixel-loader";
  import "@adamstavely/trenchcoat/tokens.css";

  const loader = document.querySelector("#loader");
  loader.started = Date.now() - 1200;
  // Later, when the work ends:
  setTimeout(() => (loader.state = "done"), 4000);
</script>
```

```tsx
import { PixelLoader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Export({ done, started }: { done: boolean; started: number }) {
  return <PixelLoader label="Exporting the register" pattern="drive" started={started} state={done ? "done" : "working"} />;
}
```
