---
pattern: none
status: new
related: kpi-chart, ops-overview, score-summary, heatmap
---

## Overview

A small trend chart that sits in a sentence or a table cell. It shows the shape of a series – rising, falling, steady,
spiky – without axes or labels, and takes its height from the text around it, so it lines up with the words beside
it. It draws a line, an area, bars from zero, or win-loss bars (up for a gain, down for a loss). Gaps in the data break
the line. Markers can pick out the last, first, highest and lowest points, a dashed reference line can show a target,
and with `good` it turns green when it moved the good way and red when it didn't. With `interactive` it becomes one tab
stop that steps through the points with a tooltip.

## When to use

- A trend beside a number in a table row, a list or a KPI tile: throughput, latency, sign-ups.
- A trend inside a sentence, so the reader sees the shape without leaving the text.
- Many small series compared at a glance, each on its own scale.

## When not to use

- One metric where the exact values, axes and several series matter – use `kpi-chart`.
- A dashboard strip of counts with their changes – use `ops-overview`, which can carry its own sparkline.
- Values across two dimensions, such as weekday by hour – use `heatmap`.
- A survey score with its bands and comments – use `score-summary`.

## Anatomy

1. **Plot** `.ui-spk__plot` – the chart's box: an image, or a group in interactive mode
2. **Line** `.ui-spk__line` – the series, broken at gaps; with `area`, filled by `.ui-spk__area`
3. **Bar** `.ui-spk__bar` – one per value for `bars` and `win-loss`
4. **Reference** `.ui-spk__ref` – the dashed line at `reference`
5. **Marker** `.ui-spk__dot` – the last, first, highest or lowest point, and the point being read
6. **Tooltip** `.ui-spk__tip` – the point's label and value, in interactive mode

## Looks

There's no tray or card: it's inline, so Standard and Clean draw it the same. It takes the colour of its tone –
`--tc-spk-ink`, by default `--tc-chart-1` – and its size from `--tc-spk-w` (5em) and `--tc-spk-h` (1.25em), or from
`width` and `height` in px. `--tc-spk-stroke` sets the line's width. All of them can be set on the element.

## Keyboard

Only in interactive mode, where it's one tab stop.

| Key | What it does |
|---|---|
| ← / → | Steps to the previous or next point; the first press starts at the newest |
| Home / End | Goes to the first or last point |
| Escape | Hides the tooltip |
| Tab | Leaves the chart |

## Screen readers

It's an image named by its summary: “Samples per day: from 112 to 148, high 152, low 98”, with “; target 140” when
there's a reference line. Win-loss charts count instead: “Trend: 7 up, 3 down, 1 level”. In interactive mode it's a
group with the role description “sparkline”, the same name, and the description “Left and right arrows step through
the points”; each step is announced politely, “Wed 21: 148 runs, 7 of 14”.

## Content

- Set `label` to what it measures, so the summary starts with it rather than “Trend”.
- Set `unit` (plural) or `format`, so the summary and tooltip read as values, not bare numbers.
- Pass `labels` – usually dates – when it's interactive, so each point says when it was.
- Use null for a missing value: the line breaks there instead of dropping to zero.

## Do

- Keep it next to the number it explains, such as today's value in the cell beside it.
- Set `min` and `max` when sparklines in one table should share a scale.
- Use `good` when the direction matters, so the colour says whether the change is welcome.

## Don't

- Don't use it for exact values – that's what the number beside it, or `kpi-chart`, is for.
- Don't make every sparkline in a long table interactive – one tab stop per row adds up.
- Don't rely on its colour alone – the summary and the numbers around it carry the meaning.

## Example

```html
<p>Samples this week <tc-sparkline id="spark" label="Samples per day" unit="samples" good="up" markers="last max"></tc-sparkline></p>

<script type="module">
  import "trenchcoat/sparkline";
  import "trenchcoat/tokens.css";

  const spark = document.querySelector("#spark");
  spark.values = [112, 120, 98, 131, 152, 148];
  spark.reference = 140;
</script>
```

```tsx
import { Sparkline } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Throughput({ values, days }: { values: number[]; days: string[] }) {
  return (
    <p>
      Sequencing ran <Sparkline interactive label="Runs per day" unit="runs" values={values} labels={days} reference={50} good="up" onPointFocus={(i, v) => console.log(i, v)} /> this fortnight.
    </p>
  );
}
```
