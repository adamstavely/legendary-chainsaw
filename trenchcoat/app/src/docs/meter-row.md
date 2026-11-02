---
pattern: none
status: new
related: panel-card, usage-meter, context-window, background-tasks
---

## Overview

How full something is, on one line: a label, a percentage and a tiny bar. Past a threshold the tone changes, with a mark
and a word as well as the colour.

## When to use

- A single figure in a side panel or settings list, such as storage used.
- A summary that opens the details, with `interactive`.
- Beside a `panel-card`'s value, with `compact`.

## When not to use

- Plan usage split by category – use `usage-meter`.
- What fills a model's context – use `context-window` or `context-map`.
- A wait for something to finish – use `progress-bar`.

## Anatomy

1. **Row** `.ui-mrw__row` – the line, with its `data-tone`
2. **Name** `.ui-mrw__name` – the label
3. **Meter** `.ui-mrw__meter` – the figure and bar
4. **Mark** `.ui-mrw__mark` – shown when getting full
5. **Value** `.ui-mrw__value` – the percentage, or `valueText`
6. **Bar** `.ui-mrw__bar` – the track, holding `.ui-mrw__fill`
7. **Button** `.ui-mrw__open` – covers the row when `interactive`

## Looks

Standard is a white card on the gray tray; Clean is one white card. `bare` and `compact` drop both. A page can set
`--tc-mrw-bar`, the bar's width, and `--tc-mrw-bar-h`, its height.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the row, when `interactive` |
| Enter / Space | Fires `tc-open` |

## Screen readers

It's a `meter` named by the label, even when `compact` hides it, with its value as text. Past a threshold the word is part
of that text. When `interactive`, the button is named by the label, beside the meter.

## Content

Name what's measured, not the unit: "Sample storage". Use `valueText` when a count says more than a percentage. Values
outside 0 to `max` are held to the ends, and anything that isn't a number counts as 0. Rename the words with `labels`.

## Do

- Set `warnAt` and `dangerAt` to where someone should act.
- Use `compact` only where the surrounding row already says what's measured.

## Don't

- Don't use it to show progress through a task: a meter measures an amount.
- Don't leave `label` empty: it's the meter's name.

## Example

```html
<tc-meter-row id="storage" label="Sample storage" value="0.17" interactive></tc-meter-row>

<script type="module">
  import "trenchcoat/meter-row";
  import "trenchcoat/tokens.css";

  document.querySelector("#storage").addEventListener("tc-open", () => {
    console.log("open the details");
  });
</script>
```

```tsx
import { MeterRow } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Storage({ onOpen }: { onOpen: () => void }) {
  return <MeterRow label="Sample storage" value={812} max={1000} valueText="812 of 1,000" interactive onTcOpen={onOpen} />;
}
```
