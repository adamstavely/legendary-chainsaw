---
pattern: none
status: new
related: activity-clock, activity-calendar, kpi-chart, breakdown-chart
---

## Overview

A typical day as a strip of blocks, midnight to midnight. Each block is a kind of place or activity – Home, Work,
Transit, Focus – named by the page, and can name the place itself. Show one strip, or a row per kind of day, such as
weekdays and the weekend, with the row's name beside it. Hour ticks run along the bottom, a legend names the kinds,
and an optional marker shows the time now. Each block carries its kind's colour as a tint with a solid edge, and its
kind in words when it's wide enough. The readout under the strips names the block under the pointer or focus in
full: “Work · 08:00–18:00 · Harbour office”.

## When to use

- A routine at a glance: when someone usually works, travels, rests or is reachable.
- Comparing the shape of different days – weekdays against the weekend, this month against last.
- Planning around a routine: on-call cover, delivery windows, the best time to reach someone.

## When not to use

- How busy each hour was, rather than what it was spent on – use `activity-clock`.
- Activity across months – use `activity-calendar`.
- One number over time – use `kpi-chart`.
- Shares of a whole by category – use `breakdown-chart`.

## Anatomy

1. **Row** `.ui-drh__row-label` – the kind of day, beside its strip, when there's more than one row
2. **Block** `.ui-drh__seg` – a stretch of the day, in its kind's colour, with the kind in words when wide enough
3. **Ticks** `.ui-drh__ticks` – 00, 06, 12, 18 and 24 along the bottom
4. **Now** `.ui-drh__now` – the time now, on the ticks and as a line through every strip
5. **Readout** `.ui-drh__readout` – the block under the pointer or focus, in full
6. **Legend** `.ui-drh__legend` – each kind and its colour

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight row names. Clean is
one white card with the header as its first row. The strips, ticks and legend are the same in both. A kind takes a
chart colour, `--tc-chart-1` to `-6` in order, or the one its `color` names.

## Keyboard

The blocks are one tab stop; inside it the arrows move between blocks.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next block in the row |
| ↑ / ↓ | Moves to the block at the same time of day in the row above or below |
| Home / End | Moves to the first or last block in the row |
| Enter / Space | Chooses the block: fires `tc-select` |
| Tab | Leaves the strips |

## Screen readers

Each strip is a list named by its row, “Weekdays” (or by the heading, with a single unnamed row), and described by
“Arrow keys move between blocks; up and down move between rows”. Each block is a button that reads in full, “Work ·
08:00–18:00 · Harbour office”. The time now is read once, “Now 14:20”. The words on the blocks, the ticks and the
readout repeat what the buttons say, so they're hidden from screen readers; the legend is a list labelled “Legend”.

## Content

- Name kinds by what the time is for, in a word: “Home”, “Work”, “Transit”.
- Name places as people know them: “Harbour office”, “Riverside gym”, not addresses or ids.
- Give times in minutes from midnight; a block that runs past midnight has an `end` before its `start`.
- Name rows as the kind of day: “Weekdays”, “Weekend”, “On-call days”.

## Do

- Keep to about six kinds, so the colours stay distinct and the legend fits on one line.
- Leave gaps where the routine isn't known, rather than filling them with a guess.
- Use `now` on a live view, so people can see where they are in the day.

## Don't

- Don't use it for a single day's real timeline with exact events – it's for a typical day.
- Don't give two kinds the same colour.
- Don't make every block a different kind – the pattern is the point.

## Example

```html
<tc-day-rhythm id="day" heading="Daily rhythm" now="860"></tc-day-rhythm>

<script type="module">
  import "trenchcoat/day-rhythm";
  import "trenchcoat/tokens.css";

  const day = document.querySelector("#day");
  day.kinds = [
    { id: "home", label: "Home" },
    { id: "work", label: "Work" },
    { id: "transit", label: "Transit" },
  ];
  day.rows = [
    {
      id: "weekdays",
      label: "Weekdays",
      segments: [
        { start: 1170, end: 450, kind: "home", place: "Home" },
        { start: 450, end: 495, kind: "transit", place: "Tram 4" },
        { start: 495, end: 1050, kind: "work", place: "Harbour office" },
      ],
    },
  ];
  day.addEventListener("tc-select", (e) => console.log(e.detail.row, e.detail.segment));
</script>
```

```tsx
import { DayRhythm, type RhythmKind, type RhythmRow } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const kinds: RhythmKind[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
];
const rows: RhythmRow[] = [
  { id: "weekdays", label: "Weekdays", segments: [{ start: 1170, end: 480, kind: "home" }, { start: 480, end: 1050, kind: "work", place: "Harbour office" }] },
];

export function Routine() {
  return <DayRhythm title="Daily rhythm" kinds={kinds} rows={rows} now={860} onSelect={(row, segment) => console.log(row, segment.place)} />;
}
```
