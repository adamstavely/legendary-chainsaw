---
pattern: none
status: new
related: chart, line-chart, bar-chart
---

## Overview

One chart repeated in a grid, a panel per value of a field: samples by month as a line per lab, instrument time as a
donut per site. It takes the same JSON spec as [Chart](#/chart) – any chart type a spec can draw – plus `facet`, the
field whose values make the panels; or set `type`, `data`, `encoding` and `options` directly. The spec is checked once,
before the rows are split, and a problem – a missing `facet` field among them – is shown instead of the grid and
reported in `tc-spec-check`.

Each panel is the chart drawn bare under its facet value, all in one card with the heading, the description and, for
Line, Area and Bar charts with several series, one legend for every panel; each panel then has every series in the
same order, so its inks match the legend. Panels follow the data's order, `sort="alpha"`, or `sort="value"` – the
largest total of the value channel first.

`shared="y"`, the default, gives every panel the same value axis so their heights compare honestly. It applies to the
charts with a value range to set – Line, Area and Bar (their `yDomain`) – counting stacked totals when the chart
stacks; other charts, a donut or a treemap, always fit their own data. `shared="both"` also gives Line, Area and Bar
panels the same x values, a gap where a panel has no row; `"none"` lets each panel fit itself.

Columns fit the width: as many as fit at `min-panel-width` (220px by default), down to one. `columns` fixes the count,
but never so many that a panel drops under 160px. Pointing at an x in one panel shows the same x in every other panel,
without their tooltips, so a month can be read across labs at a glance.

## When to use

- Comparing the shape of one measure across many groups – more than a few series would tangle on one chart.
- The same breakdown for each site, team or period, side by side.

## When not to use

- Two to four series that read well together – use one [Line Chart](#/line-chart) or [Bar Chart](#/bar-chart).
- One chart from a spec – use [Chart](#/chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading, description and the series legend
2. **Grid** `.ui-sml__grid` – a list of the panels, as many columns as fit
3. **Panel** `.ui-sml__panel` – a list item: its facet value `.ui-sml__name` and its chart, drawn bare
4. **Problem** `.ui-sml__problem` – what's wrong with the spec, in place of the grid

## Looks

Standard puts the header on the gray tray above one white card holding the grid; Clean is one white card with the
header as its first row. The panels are bare charts – no tray or card of their own – so the grid reads as one figure.
The legend uses the charts' own swatches and inks; the facet names are in the strong text ink above each panel.

## Keyboard

Each panel's chart is its own tab stop: Tab moves panel to panel, and inside one the arrows move through its marks as
in any chart. Moving with the arrows lights the same x in the other panels too.

## Screen readers

- The grid is a list named "6 charts, one per lab"; each panel is a list item whose chart is named by its facet value.
- Each chart is described, tabled and announced as any chart is; the linked highlight in other panels says nothing.
- A refused spec is an alert: "These charts can't be drawn", then each problem.

## Content

- Pick a `facet` with a handful to a couple of dozen values; past that, the panels get too small to read.
- Keep the label order the same in every group for pies and donuts, so a slice's ink means the same thing in each.
- Say in the description what the scale is shared over ("on one scale").

## Do

- Leave `shared="y"` on when the point is comparing sizes across groups.
- Sort by value when the order of the groups means nothing.

## Don't

- Turn off the shared scale and then compare heights between panels.
- Put a whole dashboard of different charts in it – every panel is the same chart.

## Example

```html
<tc-small-multiples facet="lab" sort="value"></tc-small-multiples>

<script type="module">
  import "@adamstavely/trenchcoat/small-multiples";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-small-multiples").spec = {
    type: "line",
    title: "Samples processed by lab",
    data: [
      { lab: "Genomics", month: "2026-01", samples: 182 },
      { lab: "Genomics", month: "2026-02", samples: 196 },
      { lab: "Imaging", month: "2026-01", samples: 96 },
      { lab: "Imaging", month: "2026-02", samples: 102 },
    ],
    encoding: { x: "month", y: "samples" },
  };
</script>
```

```tsx
import { SmallMultiples } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const rows = [
  { lab: "Genomics", month: "2026-01", samples: 182 },
  { lab: "Imaging", month: "2026-01", samples: 96 },
];

export function Labs() {
  return <SmallMultiples title="Samples processed by lab" spec={{ type: "line", data: rows, encoding: { x: "month", y: "samples" } }} facet="lab" onMarkClick={(e) => console.log(e.label)} />;
}
```
