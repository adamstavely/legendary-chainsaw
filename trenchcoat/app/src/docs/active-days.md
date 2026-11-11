---
pattern: grid
status: new
related: activity-calendar, calendar-heatmap, multi-calendar, score-ring
---

## Overview

How many days met their goal, month by month. A calendar runs on down the card, a block per month under a name that
sticks while it scrolls. Each day is its date inside a small ring filled to how much of the daily goal it reached: a
full ring and a check when it met it, an empty outline when there's no data, and no ring on days still to come. Above
the calendar, for the month in view, the header counts the days at goal and a line gives the goal, the best streak and
the busiest weekday. The footer reads out the day under the pointer or focus with its share of the goal, and selecting
a day reports it to the page.

## When to use

- A daily target people work towards: reviews done, records checked, hours logged, check-ins.
- Showing streaks and misses over the last few months at a size you can read day by day.
- A team or personal page where the month's progress matters more than the year's shape.

## When not to use

- A year of activity at a glance, without a goal – use `activity-calendar`.
- An amount per day over several years, shaded – use `calendar-heatmap`.
- Picking dates or showing events on them – use `multi-calendar`.
- One score made of parts – use `score-ring`.

## Anatomy

1. **Count** `.ui-acd__total` – the days at goal in the month in view, beside the heading
2. **Facts** `.ui-acd__stats` – the goal, the month's best streak and its busiest weekday
3. **Weekdays** `.ui-acd__weekdays` – the weekday initials, fixed at the top while the months scroll
4. **Month** `.ui-acd__month-name` – each month's name, sticking under the weekdays
5. **Day** `.ui-acd__cell` – the date in a ring filled towards the goal, a check when it's met
6. **Readout** `.ui-acd__readout` – the day under the pointer or focus, its value and share of the goal

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The calendar, facts and readout are the same in both. `--tc-acd-ink` fills a ring towards the goal
(by default `--tc-chart-1`), `--tc-acd-met` fills a ring that met it (`--tc-status-success-fg`), `--tc-acd-track` is
the empty ring, `--tc-acd-cell` the size of a day (40 px, 30 px when the card is narrower than 360 px) and
`--tc-acd-height` how tall the calendar gets before it scrolls (360 px); set any of them on the element.

## Keyboard

The calendar is one tab stop, on the selected day, else today; inside it the arrows move between days.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next day |
| ↑ / ↓ | Moves to the same weekday in the previous or next week |
| Home / End | Moves to the first or last day of the week |
| Page Up / Page Down | Moves to the same date in the previous or next month |
| Enter / Space | Selects the day, or clears it if it's selected |
| Escape | Clears the selected day |
| Tab | Leaves the calendar |

The header's count and facts follow the month of the focused day, and a day moved to off the edge scrolls into view.

## Screen readers

The calendar is a `grid` named by the heading and described by “Left and right arrows move a day, up and down a week,
Page Up and Page Down a month; Enter selects the day”. Weekdays are column headers and each month's name a row header.
Each day reads its value, its share of the goal and its date: “Goal met: 44 reviews, 110% of the goal, Tuesday, October
27, 2026”, “No data, …” or “…, upcoming”, and the selected day is `aria-selected`. Selecting is confirmed in a polite
status message, “Selected Tuesday, October 27, 2026: 44 reviews”, and clearing with “Selection cleared”. The readout
repeats what the focused day says, so it's hidden from screen readers.

## Content

- Set `unit` to what the values count, plural: “reviews”, “check-ins”, “hours”.
- Set `goal` to the daily target; a day at or over it is a full ring.
- Only list days you have numbers for: a day not in `days` has no data. Use 0 for a day with nothing done.
- Pass `now` when “today” should be a fixed day, such as in a report.

## Do

- Show two to four months, so streaks across month ends read.
- Set `week-start` to match the viewer's calendar: 1 for Monday in most of Europe.
- Pair a selected day with what was done on it.

## Don't

- Don't use it without a meaningful goal – a ring that's always full or always empty says nothing.
- Don't change the goal from day to day – the rings stop being comparable.
- Don't pass 0 for days without data – a 0 reads as a missed day, a missing day as a gap in the record.

## Example

```html
<tc-active-days id="reviews" heading="Daily reviews" unit="reviews" goal="40" week-start="1"></tc-active-days>

<script type="module">
  import "@adamstavely/trenchcoat/active-days";
  import "@adamstavely/trenchcoat/tokens.css";

  const cal = document.querySelector("#reviews");
  cal.now = Date.parse("2026-10-27T12:00");
  cal.days = [
    { date: "2026-10-26", value: 44 },
    { date: "2026-10-27", value: 31 },
    { date: "2026-10-23", value: null },
  ];
  cal.addEventListener("tc-date-change", (e) => console.log(e.detail.date, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { ActiveDays, type ActiveDaysDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const days: ActiveDaysDay[] = [
  { date: "2026-10-26", value: 44 },
  { date: "2026-10-27", value: 31 },
];

export function Reviews() {
  const [date, setDate] = useState<string | null>(null);
  return <ActiveDays title="Daily reviews" unit="reviews" goal={40} days={days} now={Date.parse("2026-10-27T12:00")} weekStart={1} date={date} onDateChange={setDate} />;
}
```
