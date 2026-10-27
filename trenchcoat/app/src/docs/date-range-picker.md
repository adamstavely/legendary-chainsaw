---
pattern: grid
status: stable
related: filter-menu, kpi-chart, trigger-builder, segmented-control
---

## Overview

Picks a period for a report or a chart. A trigger shows the applied range (“Sep 9 – Oct 8, 2026”); it opens a panel
with presets on the left – Last 7 days, This month, Year to date – and two months on the right, where people click a
start, see the range follow the pointer, and click an end. It can also compare the range with the period before or
the same days a year back, drawn as a second band and named in the trigger (“vs. Aug 10 – Sep 8, 2026”). Nothing
changes until Apply, so people can explore freely; with `name` the range submits with a form.

## When to use

- Setting the period of a dashboard, a report or an analytics chart.
- Comparing a period with the one before it, or with last year, in the same step.
- Forms that need a start and an end date, where most people want a common preset.

## When not to use

- Filtering a list by several facets, of which the date is only one – use `filter-menu`.
- Scheduling something to run at set times – use `trigger-builder`.
- Switching between a few fixed periods (Day, Week, Month) – use `segmented-control`.

## Anatomy

1. **Trigger** `.ui-drp__trigger` – the applied range, and the comparison when there is one
2. **Presets** `.ui-drp__presets` – quick ranges; “Custom” lights up when none matches
3. **Calendars** `.ui-drp__months` – two months of days, with the range and the comparison band
4. **Month buttons** `.ui-drp__nav` – the previous and next month
5. **Summary** `.ui-drp__summary` – the picked range, its length in days and the Compare control
6. **Buttons** `.ui-drp__buttons` – Cancel and Apply

## Looks

Standard shows the comparison on a second line of the trigger, sets the presets and calendars on a white card inside a
gray tray, and puts the summary and buttons on the tray; a highlight glides between the presets and between the
Compare options. Clean has no tray: a white one-line field, with the comparison beside the range, opens one white
popover. In both, a narrow panel turns the presets into a row of chips and shows one month.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger, opens the panel with focus on a day; on a day, picks it as the start or the end |
| ← / → | Moves to the previous or next day |
| ↑ / ↓ | Moves a week back or forward |
| Page Up / Page Down | Moves a month back or forward, keeping the day where it can |
| Home / End | Moves to the first or last day of the week |
| ← / → / ↑ / ↓ | In Compare, picks the previous or next option, wrapping round |
| Tab | Moves between the presets, the month buttons, the calendar, Compare, Cancel and Apply |
| Escape | Closes the panel and returns to the trigger |

The calendar keeps one tab stop, on the focused day, and the arrow keys stop at `min` and `max`.

## Screen readers

The trigger has `aria-haspopup="dialog"` and `aria-expanded`; the panel is a `dialog` named “Choose a date range”.
Each month is a `grid` named by the month (“October 2026”); days are buttons named in full (“Thursday, October 8,
2026”), today carries `aria-current="date"`, and days in the range are `aria-selected`. The presets are a group of
toggle buttons with `aria-pressed`; Compare is a `radiogroup` named “Compare to”. Status regions say the months on
show (“September 2026 – October 2026”) and the pick: “Start Oct 1, 2026 – pick an end”, then “Oct 1 – Oct 8, 2026,
8 days”.

## Content

- Keep preset labels short and relative to today: “Last 7 days”, “This quarter”.
- Offer the presets people use most for this data – the default nine are a starting point, not a rule.
- Label the field around the trigger with what the period is for: “Report period”.

## Do

- Set `max` (it defaults to today) and `min` to the dates your data covers.
- Set `week-starts-on` to match your users' calendar – 1 for Monday, 0 for Sunday.
- Read `compare` from `tc-value-change` and show both periods in the chart it drives.

## Don't

- Don't apply the range on every click – people expect Apply, and the trigger shows only what's applied.
- Don't hide Compare when your charts can show two periods; turn it off (`compare = false`) only when they can't.
- Don't use it for a single date.

## Example

```html
<p>Report period</p>
<tc-date-range-picker id="period" name="period" week-starts-on="1"></tc-date-range-picker>

<script type="module">
  import "trenchcoat/date-range-picker";
  import "trenchcoat/tokens.css";

  const picker = document.querySelector("#period");
  picker.value = { start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) };
  picker.min = new Date(2025, 0, 1);
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.compare));
</script>
```

```tsx
import { useState } from "react";
import { DateRangePicker, formatRange, type DateRange } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ReportPeriod() {
  const [range, setRange] = useState<DateRange>({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) });
  const [previous, setPrevious] = useState<DateRange | null>(null);
  return (
    <div>
      <DateRangePicker
        value={range}
        onChange={(next, compare) => {
          setRange(next);
          setPrevious(compare);
        }}
        weekStartsOn={1}
      />
      {previous && <p>Compared with {formatRange(previous)}</p>}
    </div>
  );
}
```
