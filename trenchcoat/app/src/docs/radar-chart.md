---
pattern: none
status: new
related: breakdown-chart, coverage-ring, heatmap, eval-scorecard
---

## Overview

A few measures of one thing on axes round a centre, with the values joined into a shape. Each axis runs from nothing
at the centre to `max` at its end – by default the largest value, or 100 when the unit is “%”. One series shows its
value over each axis's name (“90% Commits”), so the shape and the numbers read together; up to three series compare,
each in its own colour, named in a legend. `grid="web"` adds polygon rings and `grid="circle"` round ones, at each
quarter or as many steps as `levels` says. The shapes grow from the centre when the chart comes on screen and glide to
their new places when the data changes; `still` or reduced motion draws them in place at once. The Table button swaps
the drawing for the same numbers as a plain table.

## When to use

- How one thing splits across a handful of kinds of activity: commits, reviews, issues and pull requests.
- Two or three things scored on the same few measures, where the overall shape matters more than any one number.
- A profile of strengths and gaps across five to eight skills or practices.

## When not to use

- A total split into parts that add up – use `breakdown-chart` or `coverage-ring`.
- Many rows by many columns – use `heatmap`.
- Scores people need to compare exactly – use `eval-scorecard` or a bar chart.

## Anatomy

1. **Drawing** `.ui-rdr__plot` – the axes, rings and shapes, an image named by the heading
2. **Axes** `.ui-rdr__axis` – a line from the centre to each axis's end
3. **Rings** `.ui-rdr__ring` – `levels` steps out to the edge (quarters by default): polygons with `grid="web"`,
   circles with `grid="circle"`
4. **Shape** `.ui-rdr__shape` – a series' values joined, with `.ui-rdr__dot` at each value
5. **Axis name** `.ui-rdr__label` – each axis's name at its end, with `.ui-rdr__value` over it for one series
6. **Legend** `.ui-rdr__legend` – the series' names and colours, when there's more than one
7. **Table** `.ui-rdr__table` – the same numbers, from the Table button

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. The drawing is the same in both. A page can set `--tc-rdr-width` (the drawing's widest, 420 px; narrower, it shrinks to fit), `--tc-rdr-axis`
(the axes' colour) and `--tc-rdr-ink-1` to `--tc-rdr-ink-3` (each series' colour, from the chart palette).

The motion is the same as the other charts': the entrance waits until a quarter of the chart is on screen, each series
following the one before by a moment; a data change glides every shape from wherever it is, a new series growing from
the centre and a removed one shrinking back into it. `still` turns it off for that chart, and the system's reduced
motion setting turns it off everywhere. `replay()` plays the entrance again.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the Table button |
| Enter / Space | Switches between the drawing and the table |

The drawing itself takes no focus; the table holds the same numbers.

## Screen readers

The drawing is an image named by the heading and read as its numbers: “Activity overview, Code review 0%, Issues 0%,
Pull requests 10%, Commits 90%”, or each series in turn when there are several. The names and values drawn on it
repeat that, so they're hidden. The Table button is a toggle (`aria-pressed`), and the table has the heading as its
caption, the axes as row headers and the series as column headers.

## Content

- Use three to eight axes; fewer reads better as bars, more crowds the names.
- Keep axis names short – two words – since they sit at the ends of the axes.
- Give every series a value for every axis; `null` is drawn at the centre and read as “No data”.
- Set `max` when the scale has a natural top (“out of 5”); leave it for shares, which top out at 100%.

## Do

- Order the axes so related measures sit next to each other – the shape means more.
- Use `grid="web"` when people will judge distances from the centre, not just the shape; `grid="circle"` when the
  axes are many and a polygon web would look busy.
- Match `levels` to the scale – five rings for scores out of 5 – so each ring is a value people can name.
- Keep to one series where you can; compare at most three.

## Don't

- Don't use it for values that add up to a total – the shape's area means nothing there.
- Don't rely on colour alone to tell series apart – the legend names them and the table lists them.
- Don't mix units across axes; scale them to one measure first.
- Don't set `still` just to calm a page – reduced motion already turns the motion off for those who ask.

## Example

```html
<tc-radar-chart id="activity" heading="Activity overview" description="Contributions in 2026" unit="%"></tc-radar-chart>

<script type="module">
  import "trenchcoat/radar-chart";
  import "trenchcoat/tokens.css";

  const chart = document.querySelector("#activity");
  chart.axes = ["Code review", "Issues", "Pull requests", "Commits"];
  chart.series = [{ name: "Contributions", values: [0, 0, 10, 90] }];
</script>
```

```tsx
import { RadarChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function LabPractices() {
  return (
    <RadarChart
      title="Lab practices"
      grid="circle"
      levels={5}
      max={5}
      axes={["Testing", "Documentation", "Code review", "Reproducibility", "Data handling"]}
      series={[
        { name: "Genomics", values: [4.5, 3, 4, 4.5, 3.5] },
        { name: "Imaging", values: [3, 4.5, 3.5, 2.5, 4] },
      ]}
    />
  );
}
```
