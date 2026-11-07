---
pattern: none
status: new
related: box-plot, ridgeline-chart, beeswarm-chart, bar-chart
---

## Overview

How a set of raw numbers spreads. The values are binned on round edges into touching bars, each as tall as the number
of values in its bin. The bin count is worked out from the data (Freedman–Diaconis, kept to 5–40) unless `bins` asks
for about so many or `bin-width` fixes the width; `domain` fixes the range and leaves out anything beyond it. The
tallest bin takes the accent and the rest stay quiet; `highlight` picks others by bin index or range.

`cumulative` turns the bars into a running total. `density` lays a smoothed curve over the bars, scaled to the counts.
`markers` draws the mean, the median or both as dashed lines, named above the plot. Bars grow up from the baseline when
the chart scrolls into view and glide when the data changes.

## When to use

- One measure's shape from many raw values: assay turnaround, response times, sample sizes.
- Spotting skew, a second hump, or a long tail that an average would hide.
- "How many finished within…" questions – with `cumulative`.

## When not to use

- Comparing the spread of several groups – use [Box Plot](#/box-plot) or [Ridgeline Chart](#/ridgeline-chart).
- A few dozen values where each one matters – use [Beeswarm Chart](#/beeswarm-chart).
- Values that are already counts per category – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Bar** `.ui-hst__bar` – one per bin, touching its neighbours; the tallest in the accent
3. **Baseline** `.ui-hst__base` – the zero line under the bars
4. **Density** `.ui-hst__density` – the smoothed curve, with `density`
5. **Marker** `.ui-hst__marker` – the dashed mean or median line, named above the plot
6. **Axis** `.tc-chart__grid` – the count grid and its values; the value ticks under the bars
7. **Tooltip** `.tc-chart__tip` – the bin's range, count and share (and running total)

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. Bars take `--tc-plot-accent` and `--tc-plot-rest`, parted by a hairline of `--tc-plot-bg`. The
density curve and marker lines take component tokens, `--tc-hst-density` and `--tc-hst-marker`. No text sits on a
bar; the markers' names are on the card above the plot. `still` (or the system's reduced-motion setting) draws
everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous bin; the tooltip shows it and it's read with its range, count and share |
| Home / End | The first or last bin |
| Enter / Space | Picks the bin (fires `tc-mark-click`) |
| Escape | Lets go of the bin; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words: how many values, the bins and range, and the
  busiest bin.
- A table of every bin's range, count and share is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the bin ("[2, 4) h: 5 (50%), 2 of 5"); the last bin's range is closed, "]".
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Give it raw values, one per row – at least 30 or so for the shape to mean much.
- Give `unit` (" h", " ms") rather than baking it into the values; it follows each range.
- Rename the tooltip's and summary's words through `histogramLabels`, and the shared ones through `labels`.

## Do

- Let the automatic bins stand unless a round width reads better ("2-hour bins").
- Use `markers="both"` when the mean and median part ways – it shows the skew.

## Don't

- Put spaces between the bars – the bins are continuous; that's what tells it from a bar chart.
- Use `density` with very few values; the curve suggests a smoothness the data doesn't have.

## Example

```html
<tc-histogram heading="Assay turnaround" description="This month, hours" unit=" h" markers="both"></tc-histogram>

<script type="module">
  import "@adamstavely/trenchcoat/histogram";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-histogram").data = [{ value: 21.5 }, { value: 18 }, { value: 24.2 }, { value: 39 }];
</script>
```

```tsx
import { Histogram } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [{ value: 21.5 }, { value: 18 }, { value: 24.2 }, { value: 39 }];

export function Turnaround() {
  return <Histogram title="Assay turnaround" description="This month, hours" unit=" h" density markers="both" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
