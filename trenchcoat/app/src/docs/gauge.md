---
pattern: none
status: new
related: coverage-ring, reliance-gauge, usage-meter, slider-field
---

## Overview

One value against its range: a 270° dial, a half dial or a straight bar. The value is in big type in the middle, with
the band it falls in under it – “Warning”, in the band's colour with a mark. The bands themselves (normal, warning,
critical …) run round the outside with a tick between each, a target is a line across the dial, and `previous` adds
the change under it, coloured by whether it went the good way. A new value sweeps to its place. With `editable` it's a
slider the user can drag or move with the arrow keys.

## When to use

- A reading against limits: a temperature, a pressure, a load, a fill level.
- A single figure on a dashboard where the band it's in matters more than the exact number.
- Setting a threshold by feel, with `editable`, where the bands give context.

## When not to use

- A share of a whole, with a breakdown beneath – use `coverage-ring`.
- Whether trust in a model matches how it performs – use `reliance-gauge`.
- Usage against a quota or plan, with what's left – use `usage-meter`.
- Entering an exact number in a form – use `slider-field`.

## Anatomy

1. **Label** `.ui-gau__label` – what it measures, naming the meter
2. **Dial** `.ui-gau__svg` – the track and the fill to the value, for `arc` and `semicircle`
3. **Bands** `.ui-gau__band` – the bands round the outside, with `.ui-gau__tick` between them
4. **Target** `.ui-gau__target` – a line across the dial at `target`
5. **Value** `.ui-gau__value` – the value in big type
6. **Band** `.ui-gau__band-label` – the band the value is in, with a mark in its colour
7. **Bar** `.ui-gau__rail` – the track, fill, bands and target for `bar`
8. **Change** `.ui-gau__change` – the change since `previous`
9. **Target text** `.ui-gau__target-text` – the target's name and value

## Looks

Standard is a white card on a gray tray; Clean is one white card. The dial is the same in both. The fill takes the
current band's solid status colour (`--tc-gau-ink` without bands, from `tone`), and `size` sets the dial to 112, 168 or
216 px through `--tc-gau-dial`, which a page can also set directly.

## Keyboard

Only when `editable`, where it's one tab stop.

| Key | What it does |
|---|---|
| ← / ↓ | Lowers the value by `step` |
| → / ↑ | Raises the value by `step` |
| Page Down / Page Up | Lowers or raises it by ten steps |
| Home / End | Goes to `min` or `max` |

Pressing or dragging along the dial or the bar sets the value too.

## Screen readers

It's a `meter` – a `slider` when editable – named by its label, with `aria-valuemin`, `aria-valuemax` and
`aria-valuenow`, and the value read with its band: “72%, Warning”. The drawing and the big number repeat that, so
they're hidden; the change (“Up 4% from last time”) and the target (“Target 80%”) are plain text after it.

## Content

- Give each band a word that says what it means for the reader – “In range”, “Too warm” – not just a colour name.
- List bands from `min` upwards; each runs to its `to`, and the last one to `max`.
- Set `unit` – “%”, “°C”, “GB” – or `format` for anything else.
- Name when `previous` was with `previous-label`: “the last reading”, “last month”.

## Do

- Set `good` when a change has a direction that's welcome, so the change is coloured.
- Use the bar for narrow spaces and lists; the dial where there's room for it to be the focus.
- Show the target when the reading is being held to one.

## Don't

- Don't use a gauge for a value without a meaningful range – a plain number reads better.
- Don't put several gauges in a row for things people need to compare – use a bar chart.
- Don't use colour alone for the band – keep the band's word.

## Example

```html
<tc-gauge id="freezer" label="Freezer B-3" unit="°C" min="-90" max="-60" value="-78" previous-label="the last reading" good="down"></tc-gauge>

<script type="module">
  import "trenchcoat/gauge";
  import "trenchcoat/tokens.css";

  const gauge = document.querySelector("#freezer");
  gauge.bands = [
    { to: -75, tone: "success", label: "In range" },
    { to: -68, tone: "warning", label: "Warming" },
    { to: -60, tone: "danger", label: "Too warm" },
  ];
  gauge.previous = -80;
  gauge.target = -70;
</script>
```

```tsx
import { useState } from "react";
import { Gauge } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AlarmLevel() {
  const [value, setValue] = useState(-70);
  return <Gauge label="Alarm level" variant="bar" unit="°C" min={-90} max={-60} step={0.5} editable value={value} onValueChange={setValue} />;
}
```
