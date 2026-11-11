---
pattern: none
status: new
related: bar-chart, activity-calendar, kpi-chart, calendar-heatmap, stage-bars
---

## Overview

A week of daily totals as rounded bars – documents reviewed, samples logged, tickets closed – against an optional
daily goal drawn as a dashed line. Days that reach the goal take the accent and the rest stay quiet. The headline is
the week's total, counting up when it changes, with the average per day under it; pointing at a day (or moving to it
with the keys) outlines its bar, writes its value above it and rolls the headline to that day.

A switcher in the header steps between weeks, and the bars glide from one week to the next on one shared scale, so
taller really means more. `today` marks a day of the latest week. The bars grow in when the card first comes on screen.

## When to use

- A daily count where the week is the natural unit and a daily target matters.
- A personal or team card on a dashboard: "how are we doing this week, and against last week".

## When not to use

- Many weeks or a whole year of days at once – use [Calendar Heatmap](#/calendar-heatmap) or
  [Activity Calendar](#/activity-calendar).
- Categories that aren't days, or several series – use [Bar Chart](#/bar-chart).
- A trend over time with a headline – use [KPI Chart](#/kpi-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the week switcher and the Table button
2. **Week switcher** `.ui-wkb__switch` – previous and next buttons `.ui-wkb__step` round the week's label `.ui-wkb__week`
3. **Headline** `.ui-wkb__big` – the week's total, or the pointed-at day's value; the caption `.ui-wkb__caption` has the average per day
4. **Plot** `.ui-wkb__plot` – the bars, one tab stop
5. **Bar** `.ui-wkb__bar` – one per day; at or over the goal in the accent
6. **Value** `.ui-wkb__value` – the pointed-at day's value, above its bar
7. **Goal** `.ui-wkb__goal` – the dashed line with its label `.ui-wkb__goal-label`
8. **Day name** `.ui-wkb__label` – under each bar; today's in the strong weight with a dot under it
9. **Table** `.ui-wkb__table` – the table view: each day's total and whether it met the goal

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Inks are component tokens on the element: `--tc-wkb-met` for days at or over the goal (all days when there's no
goal), `--tc-wkb-rest` for the others and `--tc-wkb-goal` for the line; `--tc-wkb-plot-h` sets the bars' height.
While a day is in front, the other bars fade by colour, not opacity. `still` (or the system's reduced-motion setting)
draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop; the switcher's buttons and the Table button come before it |
| ← / → | Move to the previous or next day; it's outlined, its value shown and read out |
| Home / End | The first or last day |
| Page Up / Page Down | The week before or after (fires `tc-week-change`) |
| Escape | Lets go of the day |

## Screen readers

- The plot is a group named by the heading and described in words: every day's total, whether it met the goal, and
  the week's total.
- Moving with the arrows announces the day ("Tue: 472, goal met, 2 of 7"); today is said as "today".
- The switcher's buttons are "Previous week" and "Next week", and the week's label is read when it changes.
- The bars are hidden; the Table button shows the same numbers as a table.

## Content

- Day names are short ("Mon"); give `short` when the first letter isn't the right narrow name.
- Week labels are short spans: "Mar 17–23".
- Days still to come are 0 – they draw as a hairline, so the week still reads as seven days.
- Rename the words with `labels` – "a day" after the average, "Goal", "goal met".

## Do

- Set a `goal` when there is one: the line and the colours answer "did we make it" at a glance.
- Keep weeks oldest first, so the next button moves forward in time.

## Don't

- Change the scale between weeks – one scale across every week is what makes the glide honest.
- Put more than a week in one week's `days`; use another chart for longer spans.

## Example

```html
<tc-week-bars heading="Documents reviewed" goal="400" today="3"></tc-week-bars>

<script type="module">
  import "@adamstavely/trenchcoat/week-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const week = (label, values) => ({ label, days: days.map((d, i) => ({ label: d, value: values[i] })) });
  const bars = document.querySelector("tc-week-bars");
  bars.weeks = [week("Mar 10–16", [428, 395, 452, 410, 386, 140, 90]), week("Mar 17–23", [446, 472, 381, 412, 0, 0, 0])];
  bars.addEventListener("tc-week-change", (e) => console.log(e.detail.week));
</script>
```

```tsx
import { WeekBars } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = (label: string, values: number[]) => ({ label, days: days.map((d, i) => ({ label: d, value: values[i] })) });
const weeks = [week("Mar 10–16", [428, 395, 452, 410, 386, 140, 90]), week("Mar 17–23", [446, 472, 381, 412, 0, 0, 0])];

export function Reviewed() {
  const [w, setW] = useState(1);
  return <WeekBars title="Documents reviewed" weeks={weeks} week={w} onWeekChange={setW} goal={400} today={3} />;
}
```
