---
pattern: grid
status: new
related: coverage-matrix, kpi-chart, breakdown-chart, usage-meter
---

## Overview

When activity happens, a clock per day. Each clock has two rings of twelve hour segments: the inner ring is AM, the
outer ring PM – each labelled at 12 o'clock – with 12 at the top, so the 3 PM segment sits where 3 is on a clock face. Each segment is shaded by how
much happened in that hour, in a few steps from empty to full. The shading is scaled to the busiest hour across every
day shown, so a quiet Sunday looks quiet next to a busy Tuesday. The middle of a clock shows its day – the weekday
and the date – or, under the pointer or focus, the hour and its value. The header names the busiest hour, and selecting
an hour reports it to the page.

## When to use

- When people, agents or systems are busy across the day and the week: runs, messages, sign-ins, deploys, alerts.
- Picking a time for maintenance, a meeting or a release, by seeing when things are quiet.
- Spotting a pattern that a total hides: a night-time spike, a lunch dip, a weekend that isn't quiet.

## When not to use

- One number and its trend over time – use `kpi-chart`.
- A share of a whole across categories – use `breakdown-chart`.
- Use against a limit or a plan – use `usage-meter`.
- Which checks cover which parts – use `coverage-matrix`.

## Anatomy

1. **Busiest** `.ui-aclk__peak` – the busiest day and hour shown, beside the heading
2. **Clock** `.ui-aclk__clock` – one day: the AM ring inside, the PM ring outside
3. **Segment** `.ui-aclk__seg` – an hour, shaded by its value; outlined with a dashed line when there's no data
4. **Ring labels** `.ui-aclk__ring-label` – at 12 o'clock: AM just inside the inner ring, PM just outside the outer one
5. **Middle** `.ui-aclk__centre` – the weekday and date, “Tue 27”, or the hour under the pointer or focus and its value
6. **Legend** `.ui-aclk__legend` – the shades from less to more, no data, and which ring is which

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight weekdays. Clean is
one white card with the header as its first row and quieter labels. The rings, shades and legend are the same in both.
The shades mix `--tc-aclk-ink` (by default `--tc-chart-1`) into `--tc-aclk-track`; set either on the element to
change them.

## Keyboard

The clocks are one tab stop; inside them the arrows move between hours.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next hour of the day |
| ↑ / ↓ | Moves to the same hour on the previous or next day |
| Page Up / Page Down | Moves between the AM and PM ring: 3 AM ↔ 3 PM |
| Home / End | Moves to the day's first or last hour |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first hour of the first day, or the last hour of the last day |
| Enter / Space | Selects the hour, or clears it if it's selected |
| Escape | Clears the selected hour |
| Tab | Leaves the clocks |

## Screen readers

The clocks are a `grid` named by the heading and described by “Left and right arrows move an hour, up and down a
day; Enter selects the hour”. Each day is a row named by its full date, “Tuesday, October 27”, and each hour a
cell that reads its range and value, “3 PM to 4 PM, 42 runs”, or “no data”. The selected hour is `aria-selected`.
Selecting is confirmed in a polite status message, “Selected Tuesday, October 27, 3 PM to 4 PM: 42 runs”, and
clearing with “Selection cleared”. The middle of each clock and the AM and PM labels repeat what the row and cells
say, so they're hidden from screen readers.

## Content

- Set `unit` to what the values count, plural: “runs”, “messages”, “sign-ins”. For anything else, pass `format`.
- Use null for an hour you have no data for, not 0 – the two look different, and 0 means nothing happened.
- Give `date` as any moment in the day, in the viewer's time zone; set `label` when the weekday isn't enough, such as
  “Today” – it replaces the weekday in the middle, above the date.

## Do

- Show whole weeks, or another fixed stretch, so the days compare fairly.
- Set `max` when several activity clocks on a page should share one scale.
- Pair a selected hour with a detail panel or a filtered list of what happened in it.

## Don't

- Don't show more than about fourteen days – past that, the clocks get too small to read.
- Don't use the shades for anything but how busy an hour was – one colour, one meaning.
- Don't leave hours out of `values` to mean zero – a missing hour reads as no data.

## Example

```html
<tc-activity-clock id="clock" heading="Agent runs by hour" unit="runs"></tc-activity-clock>

<script type="module">
  import "trenchcoat/activity-clock";
  import "trenchcoat/tokens.css";

  const clock = document.querySelector("#clock");
  clock.days = [
    { date: Date.parse("2026-10-26T12:00"), values: [0, 0, 0, 0, 0, 1, 3, 8, 20, 31, 42, 38, 22, 25, 33, 36, 30, 18, 9, 6, 4, 2, 1, 0] },
    { date: Date.parse("2026-10-27T12:00"), values: [0, 0, 0, 0, 1, 2, 5, 11, 24, 35, 40, 33, 19, 28, 41, 39, 27, 15, 8, 5, null, null, 1, 0] },
  ];
  clock.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { ActivityClock, type ActivityDay, type ActivityHourRef } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const days: ActivityDay[] = [
  { date: Date.parse("2026-10-26T12:00"), values: [0, 0, 0, 0, 0, 1, 3, 8, 20, 31, 42, 38, 22, 25, 33, 36, 30, 18, 9, 6, 4, 2, 1, 0] },
  { date: Date.parse("2026-10-27T12:00"), values: [0, 0, 0, 0, 1, 2, 5, 11, 24, 35, 40, 33, 19, 28, 41, 39, 27, 15, 8, 5, null, null, 1, 0] },
];

export function Runs() {
  const [selected, setSelected] = useState<ActivityHourRef | null>(null);
  return <ActivityClock title="Agent runs by hour" unit="runs" days={days} selected={selected} onSelectedChange={setSelected} />;
}
```
