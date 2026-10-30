---
pattern: listbox
status: new
related: segmented-control, date-range-picker, activity-calendar, breadcrumbs
---

## Overview

A column of years to choose one from, newest first, beside a page that shows one year at a time – contributions,
annual reports, statements. The chosen year is filled; each year can carry a count. Give it `from` and `to` for an
unbroken run of years, or `years` for any list. On a narrow page `orientation="horizontal"` lays it out as a row
that scrolls. Typing a year's digits jumps to it.

## When to use

- Switching a page between years of the same records, where every year is a choice and the list is long.
- Beside an activity calendar or a yearly report, as the page's year navigation.

## When not to use

- Two to six options of any kind – use `segmented-control`.
- A range of dates, or any date inside a year – use `date-range-picker`.
- Going up a hierarchy – use `breadcrumbs`.

## Anatomy

1. **List** `.ui-yl__list` – the years, named by `label`
2. **Year** `.ui-yl__year` – one year; the chosen one is filled
3. **Count** `.ui-yl__count` – the year's count, when `counts` has one

## Looks

Both looks are the bare list, with no card. In Standard the chosen year is a filled accent pill; in Clean it's a
tinted row. A page can set `--tc-yl-width` (a column's width, 136 px), `--tc-yl-chosen-bg` and `--tc-yl-chosen-fg`.

## Keyboard

One tab stop: the chosen year, or the one last moved to.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous year (→ / ← in a row) |
| Home / End | Moves to the first or last year |
| Enter / Space | Chooses the year |
| Digits | Jumps to the year that starts or ends with them: “2019” or “19” |

Moving doesn't choose, so a page that loads a year on `tc-selected-change` loads only the one chosen.

## Screen readers

It's a `listbox` named by `label`, vertical or horizontal, with each year an `option` and the chosen one
`aria-selected`. A count is read after its year with `count-label` (“2025, 128 reports”), and choosing is announced
(“2025 chosen”).

## Content

- Name the list for what the years select: “Report year”, “Contribution year”.
- Put the newest year first – the default for `from` and `to`.
- Set `count-label` to what the counts are when you give `counts`.

## Do

- Keep it beside the content it switches, so the change is seen.
- Use the row on narrow pages rather than a long column above the content.

## Don't

- Don't use it for a handful of non-year options – that's `segmented-control`.
- Don't load a year as focus moves; load on `tc-selected-change`.

## Example

```html
<tc-year-list id="years" label="Report year" from="2013" to="2026" selected="2026" count-label="reports"></tc-year-list>

<script type="module">
  import "trenchcoat/year-list";
  import "trenchcoat/tokens.css";

  const years = document.querySelector("#years");
  years.counts = { 2026: 41, 2025: 128, 2024: 117 };
  years.addEventListener("tc-selected-change", (e) => console.log("Load", e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { YearList } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ReportYears() {
  const [year, setYear] = useState<number | null>(2026);
  return <YearList label="Report year" from={2013} to={2026} selected={year} onSelectedChange={setYear} />;
}
```
