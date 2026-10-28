---
pattern: grid
status: new
related: ops-overview, breakdown-chart, kpi-chart, capacity-bars
---

## Overview

How well service levels are being met, at a glance. A headline gives the share on time – “94% on time” – beside a
legend that counts the work in each outcome: Met, At risk and Breached, in words and marks as well as colour. An
optional trend draws the on-time share week by week. Below, a bar splits the whole period, and optional rows split each
type of request – Review, Approval, Clearance – so the type that's slipping stands out. A period chooser (7d / 30d /
90d) asks the page for another period's numbers.

## When to use

- A legal, support or operations team's on-time delivery against its service levels.
- Comparing service levels across types of request or teams.
- The SLA panel of a team metrics page, beside its workload and capacity.

## When not to use

- A strip of counts with their changes – use `ops-overview`.
- Any share of a whole across categories – use `breakdown-chart`.
- One metric over time – use `kpi-chart`.
- How loaded each person is – use `capacity-bars`.

## Anatomy

1. **Periods** `.ui-sla__periods` – the period shown: 7d, 30d or 90d
2. **Headline** `.ui-sla__headline` – the share on time
3. **Legend** `.ui-sla__legend` – each outcome's mark, name, count and share
4. **Trend** `.ui-sla__trend` – the on-time share week by week
5. **Bar** `.ui-sla__row` – the whole period, then one per type, with its on-time share
6. **Segment** `.ui-sla__seg` – an outcome's part of a bar, sized by its count
7. **Readout** `.ui-sla__readout` – the segment under the pointer or focus

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and a medium-weight whole-period row.
Clean is one white card with the header as its first row. The bars, marks and readout are the same in both. In a narrow
container each bar's label sits above it.

## Keyboard

The bars are one tab stop; inside them the arrows move between segments. The period chooser is a radio group of its
own.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next segment in the bar |
| ↑ / ↓ | Moves to the same outcome in the previous or next bar, skipping empty ones |
| Home / End | Moves to the bar's first or last segment |
| Tab | Leaves the bars |

## Screen readers

The bars are a `grid` named by the heading and described by “Left and right arrows move between a bar's segments, up
and down between bars”. Each bar is a row headed by its name and on-time share; each segment reads its outcome, count
and share, “Breached: 2 requests, 6%”. The legend is a list labelled “Outcomes”; the trend is an image labelled “On
time over 4 weeks, from 89% to 94%”. The readout repeats the focused segment, so it's hidden from screen readers. The
period chooser is a radio group labelled “Period”.

## Content

- Set `unit` to what's counted, plural: “requests”, “tickets”.
- Rename outcomes to your team's words with `labels`: `{ atRisk: "Due soon" }`.
- Keep rows to the four to six types people manage separately.
- Supply the numbers for the period shown; listen for `tc-period-change` and pass the new ones.

## Do

- Order rows by volume, or in the order work flows.
- Show the trend when people ask “is it getting better?”.
- Pair a row with the list of its breached requests.

## Don't

- Don't use the outcome tones for anything else on the page.
- Don't mix periods: the bars, legend and trend should all be for the period picked.
- Don't hide At risk – it's the part people can still do something about.

## Example

```html
<tc-sla-status id="sla" heading="SLA performance" unit="requests"></tc-sla-status>

<script type="module">
  import "trenchcoat/sla-status";
  import "trenchcoat/tokens.css";

  const sla = document.querySelector("#sla");
  sla.split = { met: 233, atRisk: 10, breached: 5 };
  sla.rows = [
    { id: "review", label: "Review", met: 92, atRisk: 3, breached: 1 },
    { id: "approval", label: "Approval", met: 70, atRisk: 4, breached: 3 },
  ];
  sla.trend = [0.89, 0.91, 0.93, 0.94];
  sla.addEventListener("tc-period-change", (e) => console.log("load", e.detail.period));
</script>
```

```tsx
import { useState } from "react";
import { SlaStatus, type SlaSplit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const split: SlaSplit = { met: 233, atRisk: 10, breached: 5 };

export function Sla() {
  const [period, setPeriod] = useState("30d");
  return <SlaStatus title="SLA performance" split={split} trend={[0.89, 0.91, 0.94]} period={period} onPeriodChange={setPeriod} />;
}
```
