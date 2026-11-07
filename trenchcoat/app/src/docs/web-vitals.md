---
pattern: radio
status: new
related: preview-frame, meter-row, kpi-chart, route-map
---

## Overview

How a page loads and responds, one tile per measure: the short and full name, the value, a word for how it rates
("Good", "Needs improvement", "Poor"), a track with the three zones and a marker at the value, and a small line of
earlier readings. LCP, INP, CLS, FCP and TTFB know their usual limits; any other measure passes its own `good` and
`poor`. With `device` set, the header has a Mobile / Desktop switch and the page swaps the numbers.

## When to use

- Beside a preview of a page, to show whether a change made it slower or jumpier.
- A route's performance summary in a deploy or review panel.

## When not to use

- A measure over time on its own – use `kpi-chart`.
- How full something is – use `meter-row`.
- Every route's load time at once – use `route-map`.

## Anatomy

1. **Tile** `.ui-wvit__tile` – one measure, with its `data-rating`
2. **Short name** `.ui-wvit__short` and **full name** `.ui-wvit__name` – "LCP", "Largest Contentful Paint"
3. **Value** `.ui-wvit__value` – "180 ms", "2.1 s" or "0.08"
4. **Rating** `.ui-wvit__rating` – a mark (circle, triangle or square) and a word
5. **Track** `.ui-wvit__track` – the good, needs-improvement and poor zones, with a **marker** `.ui-wvit__marker` at the value
6. **Trend** `.ui-wvit__spark` – earlier readings, oldest first
7. **Count** `.ui-wvit__count` – how many measures are good, in the header
8. **Device switch** `.ui-wvit__devs` – Mobile and Desktop

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The tiles reflow from a grid to one column as it narrows. A page can set `--tc-wvit-tile-min`, the narrowest a tile gets
before the grid drops a column, and `--tc-wvit-track-h`, the track's thickness.

## Keyboard

The tiles are read-only. The device switch is one tab stop.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Switches between Mobile and Desktop |
| Home / End | Chooses Mobile or Desktop |

## Screen readers

The tiles are a list named by the heading; each reads its names, its value and its rating word. The track and the line
are drawn for the eye and hidden; a hidden sentence lists the earlier readings. The device switch is a `radiogroup`
named "Device".

## Content

- Pass values in the unit given: ms for timings unless `unit` says "s", and a plain number for CLS.
- Say where the numbers come from in `description`: the route and the period, or "lab run".
- Give `history` the same unit as `value`, oldest first.

## Do

- Keep the default limits for the five known measures, so ratings match what people see elsewhere.
- Show the device the numbers are for whenever both are measured.

## Don't

- Don't colour-code a measure with no limits; pass `good` and `poor` or leave it out.
- Don't mix lab and field numbers in one set of tiles.

## Example

```html
<tc-web-vitals id="vitals" description="/grants · last 28 days" device="mobile"></tc-web-vitals>

<script type="module">
  import "@adamstavely/trenchcoat/web-vitals";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#vitals");
  el.metrics = [
    { id: "lcp", value: 3120, history: [2650, 2900, 3120] },
    { id: "inp", value: 184 },
    { id: "cls", value: 0.28 },
  ];
  el.addEventListener("tc-device-change", (e) => console.log("load numbers for", e.detail.device));
</script>
```

```tsx
import { useState } from "react";
import { WebVitals, type WebVital, type WebVitalDevice } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Vitals({ byDevice }: { byDevice: Record<WebVitalDevice, WebVital[]> }) {
  const [device, setDevice] = useState<WebVitalDevice>("mobile");
  return <WebVitals description="/grants" metrics={byDevice[device]} device={device} onDeviceChange={setDevice} />;
}
```
