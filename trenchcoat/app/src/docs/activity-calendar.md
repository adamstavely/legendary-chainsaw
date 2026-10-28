---
pattern: grid
status: new
related: activity-clock, kpi-chart, date-range-picker, coverage-matrix
---

## Overview

A year of activity at a glance, in the familiar contribution-graph layout. Each column is a week and each row a
weekday, and every day is a small square shaded by how much happened on it. Month names run along the top and weekday
names down the side. The newest week is on the right and starts in view. The shading goes in a few steps from empty to
full, scaled to the busiest day shown, so streaks, quiet spells and holidays stand out before anyone reads a number.
The header shows the total, the footer reads out the day under the pointer or focus, and selecting a day reports it to
the page.

## When to use

- How regularly someone or something was active over months: reviews, commits, runs, sign-ins, check-ins.
- Showing streaks and gaps – a habit, an on-call rota, a model retraining schedule.
- A profile or account page that sums up a year of work in one glance.

## When not to use

- When in the day activity happens – use `activity-clock`.
- One number and its trend over time – use `kpi-chart`.
- Picking dates – use `date-range-picker`.
- Which checks cover which parts – use `coverage-matrix`.

## Anatomy

1. **Total** `.ui-acal__total` – everything counted in the range shown, beside the heading
2. **Months** `.ui-acal__month` – each month's name over the week holding its 1st
3. **Weekdays** `.ui-acal__weekday` – every other weekday's name down the side
4. **Day** `.ui-acal__cell` – a square shaded by its value; outlined when there's no data
5. **Readout** `.ui-acal__readout` – the day under the pointer or focus, or the selected day, and its value
6. **Legend** `.ui-acal__legend` – the shades from less to more, and no data when some days have none

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The squares, readout and legend are the same in both. The shades mix `--tc-acal-ink` (by default
`--tc-chart-1`) into `--tc-acal-track`, and `--tc-acal-cell` sets the size of a day (11 px, 14 px on touch screens);
set any of them on the element.

## Keyboard

The calendar is one tab stop, on the selected day or else the last day; inside it the arrows move between days.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next day |
| ← / → | Moves to the same weekday in the previous or next week |
| Page Up / Page Down | Moves four weeks back or forward |
| Home / End | Moves to the first or last week in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last day shown |
| Enter / Space | Selects the day, or clears it if it's selected |
| Escape | Clears the selected day |
| Tab | Leaves the calendar |

A day moved to off the edge of the scrolling area scrolls into view.

## Screen readers

The calendar is a `grid` named by the heading and described by “Up and down arrows move a day, left and right a week;
Enter selects the day”. Weekdays are row headers and weeks column headers, named by their month or “Week of Oct 5”.
Each day reads its value and date, “12 reviews, Tuesday, October 27, 2026”, or “No data, …”, and the selected day is
`aria-selected`. Selecting is confirmed in a polite status message, “Selected Tuesday, October 27, 2026: 12 reviews”,
and clearing with “Selection cleared”. The readout repeats what the focused day says, so it's hidden from screen
readers.

## Content

- Set `unit` to what the values count, plural: “reviews”, “commits”, “runs”. For anything else, pass `format`.
- Only list days with activity: a day not in `days` counts as 0. Use null for a day you have no data for.
- Give `end` when the range should end on a fixed day, such as today, rather than on the latest day with data.
- Set `week-start` to match the viewer's calendar: 1 for Monday in most of Europe.

## Do

- Show a whole year (53 weeks), or a fixed stretch people know, so the shape is familiar.
- Set `max` when several calendars on a page should share one scale.
- Pair a selected day with a list of what happened on it.

## Don't

- Don't use it for fewer than about eight weeks – a short stretch reads better as a bar chart.
- Don't use the shades for anything but how much happened – one colour, one meaning.
- Don't pass 0 for days without data – a 0 reads as a quiet day, null as a gap in the record.

## Example

```html
<tc-activity-calendar id="cal" heading="Code reviews" unit="reviews" week-start="1"></tc-activity-calendar>

<script type="module">
  import "trenchcoat/activity-calendar";
  import "trenchcoat/tokens.css";

  const cal = document.querySelector("#cal");
  cal.end = Date.parse("2026-10-27T12:00");
  cal.days = [
    { date: Date.parse("2026-10-26T12:00"), value: 7 },
    { date: Date.parse("2026-10-27T12:00"), value: 3 },
    { date: Date.parse("2026-10-20T12:00"), value: null },
  ];
  cal.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { ActivityCalendar, type ActivityCalendarDay } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const days: ActivityCalendarDay[] = [
  { date: Date.parse("2026-10-26T12:00"), value: 7 },
  { date: Date.parse("2026-10-27T12:00"), value: 3 },
  { date: Date.parse("2026-10-20T12:00"), value: null },
];

export function Reviews() {
  const [selected, setSelected] = useState<number | null>(null);
  return <ActivityCalendar title="Code reviews" unit="reviews" days={days} end={Date.parse("2026-10-27T12:00")} weekStart={1} selected={selected} onSelectedChange={setSelected} />;
}
```
