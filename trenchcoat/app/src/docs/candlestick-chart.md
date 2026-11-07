---
pattern: none
status: new
related: line-chart, area-chart, box-plot, sparkline
---

## Overview

A reading's open, high, low and close for each period, as candles: a thin wick from the low to the high and a body
from the open to the close. A period that closed higher than it opened is a hollow body outlined in the "up" ink; one
that closed lower is a solid body in the "down" ink, so the shape tells them apart as well as the colour. The
highlighted period – by default the last – has its close drawn across the plot and tagged on the value axis at the
right.

`ma` adds moving averages of the close (up to three, each with its own ink and dash), `volume` a strip of bars under
the candles, and periods too many for the width merge into fewer candles (`max-candles`). Candles sweep in from the
left when the chart scrolls into view and glide when the data changes. Ported from ztd-charts (MIT).

With `brush="select"`, dragging across the candles (or Shift+arrows and Enter) picks a range and shows its change
from the first open to the last close, with its high and low, firing `tc-brush`; `brush="zoom"` narrows the chart to
the range, with a Show all button to undo it.

## When to use

- A measurement sampled many times per period where the range matters as well as the trend: a freezer's daily
  temperature, an instrument's hourly drift, a queue's daily depth.

## When not to use

- One value per period – use [Line Chart](#/line-chart) or [Area Chart](#/area-chart).
- The spread of many values without an order in time – use [Box Plot](#/box-plot).
- A trend inside a sentence or a table cell – use [Sparkline](#/sparkline).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the key (up, down, averages) and the Table button
2. **Candle** `.ui-cdl__candle` – one per period, `data-dir="up"` or `"down"`
3. **Body** `.ui-cdl__body` – open to close; hollow when it rose
4. **Wick** `.ui-cdl__wick` – low to high
5. **Moving average** `.ui-cdl__ma` – a line per period in `ma`, its value at the top left
6. **Volume** `.ui-cdl__volume` – a bar per period under the candles, with `volume`
7. **Close tag** `.ui-cdl__last` – the highlighted close across the plot and on the axis
8. **Axis** `.tc-chart__grid` – the value grid at the right, the dates below
9. **Tooltip** `.tc-chart__tip` – open, high, low, close, change from the previous close, volume and averages

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Up and down take the status inks through component
tokens, `--tc-cdl-up` (`--tc-status-success-solid`) and `--tc-cdl-down` (`--tc-status-danger-solid`); override them
on the element where rising is bad. The averages are `--tc-cdl-ma-1` … `-3`, solid, dashed and dotted. The close tag
is outlined rather than filled, so its number stays in the text ink. `still` (or the system's reduced-motion setting)
draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous candle; the tooltip shows it and it's read with its open, high, low and close |
| Home / End | The first or last candle |
| Enter / Space | Picks the candle (fires `tc-mark-click`) |
| Shift + ← / → | With `brush`, widens a range from the candle; Enter settles it (or zooms into it) |
| Escape | Clears a picked range, then a zoom, then lets go of the candle; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words (the span, the first open, the last close and the
  change, the high and the low).
- A table of every candle is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the candle ("Oct 3, 2026: open -79.1, high -78.9, low -80.2, close -80, 3 of 30").
- The drawing itself is hidden; up and down are told apart by shape and in the tooltip's words, not by colour alone.

## Content

- Give dates as ISO strings ("2026-10-03") or epoch ms; anything else is a label, in data order.
- Give `unit` (" °C") rather than baking it into the values.
- Rename the tooltip's and key's words through `candleLabels`, and the shared ones through `labels`.

## Do

- Keep to one or two moving averages; three is the most it draws.
- Swap `--tc-cdl-up` and `--tc-cdl-down` when a rise is the bad news, as for a freezer warming.

## Don't

- Use it for prices or trades in a product that isn't about them – a line chart is plainer.
- Pack in more periods than the width holds; let them merge, or show a shorter span.

## Example

```html
<tc-candlestick-chart heading="Freezer B" description="October, daily temperature" unit=" °C"></tc-candlestick-chart>

<script type="module">
  import "@adamstavely/trenchcoat/candlestick-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const el = document.querySelector("tc-candlestick-chart");
  el.ma = [5];
  el.data = [
    { date: "2026-10-01", open: -80.1, high: -79.2, low: -80.4, close: -79.4 },
    { date: "2026-10-02", open: -79.4, high: -78.8, low: -79.9, close: -79.1 },
    { date: "2026-10-03", open: -79.1, high: -78.9, low: -80.2, close: -80.0 },
  ];
</script>
```

```tsx
import { CandlestickChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { date: "2026-10-01", open: -80.1, high: -79.2, low: -80.4, close: -79.4 },
  { date: "2026-10-02", open: -79.4, high: -78.8, low: -79.9, close: -79.1 },
  { date: "2026-10-03", open: -79.1, high: -78.9, low: -80.2, close: -80.0 },
];

export function FreezerB() {
  return <CandlestickChart title="Freezer B" unit=" °C" data={data} ma={[5]} onMarkClick={(e) => console.log(e.label)} />;
}
```
