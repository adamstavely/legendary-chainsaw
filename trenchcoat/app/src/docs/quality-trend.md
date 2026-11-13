---
pattern: toolbar
status: new
related: quality-drop, change-impact, kpi-chart, eval-scorecard
---

## Overview

How an agent's answers are scoring on live traffic, day by day, and what changed along the way. A judge scores every
chat on a few criteria – correctness, citing the source, helpfulness, tone – and each criterion is a line. Round each
line is a band that is wide on quiet days, when the mean rests on a few chats, and narrow on busy ones. The changes
made to the agent sit on the time axis as pins: a new prompt version, a model switch, a new tool. A sentence above the
chart says what moved since the latest change – "Correctness 4.4 → 3.8 since v14 on 3 Nov" – so the chart is read
before it is studied.

## When to use

- Watching a production agent's judge scores after a release.
- Seeing whether a prompt, model or tool change lines up with a rise or a fall.
- A quality page with a few criteria on one scale (1–5, or 0–1).

## When not to use

- One drop to act on – what fell, why, and a rollback – use `quality-drop`.
- Before against after for one change, with how sure the difference is – use `change-impact`.
- One metric with a headline number and a delta – use `kpi-chart`.
- A fixed set of test cases across versions – use `eval-scorecard`.

## Anatomy

1. **Summary** `.ui-qtr__summary` – what moved since the latest change in range, in words
2. **Range** `.ui-qtr__range` – 7, 30 or 90 days
3. **Table** `.ui-qtr__view` – swaps the chart for the same days as a table
4. **Legend** `.ui-qtr__legend` – a toggle per criterion, with its line style and average
5. **Chart** `.ui-qtr__plot` – a line and a band per criterion, the score scale and the dates
6. **Change pins** `.ui-qtr__pins` – a mark per change on its date, with a tooltip

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Criteria take `--tc-chart-1…6` in order, or their own `color`, and each is drawn solid, dashed, dotted or dash-dot too.
The band's strength is `--tc-quality-trend-band` (0.14); the pin's size `--tc-quality-trend-pin`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the range, Table, each criterion toggle, the change pins, then the table when it shows |
| ← / → / ↑ / ↓ | In the range, picks the previous or next range |
| ← / → / Home / End | In the change pins, moves between them and shows each one's tooltip |
| Enter / Space | On a pin, opens the change (tc-change-open); on a toggle, shows or hides the criterion |
| Escape | Hides the open pin's tooltip |

## Screen readers

The chart is a `figure` named by the heading and described by the summary sentence; the drawing itself is hidden,
because the summary and the table carry its numbers. Table switches to a real `table` of the days, newest first, with
each criterion's mean and chats. The range is a `radiogroup` named "Range" ("7d, last 7 days"). The criterion toggles
are a group of buttons with `aria-pressed`, each read with its average. The pins are a `toolbar` named "Changes", each
read as "Prompt v13 → v14, 3 Nov" with its detail. Changing the range or a toggle is said in a status region.

## Content

- Keep criteria to two to five, named as the judge names them.
- Give each change a short name for the summary (`short: "v14"`) and a label that says what changed.
- Send the day's chat count with each score – the band and the summary weigh by it.
- Send days as midnight UTC, or set `time-zone` to the zone they were cut in.

## Do

- Put every release on the axis, even the ones you expect nothing from – a flat line after a change is news too.
- Set `min` and `max` to the judge's scale, so a fall of 0.5 looks like what it is.

## Don't

- Don't plot criteria on different scales together.
- Don't hide the band to make a line look steadier.
- Don't use it to compare two versions running side by side – the dates mix them; use `change-impact`.

## Example

```html
<tc-quality-trend id="trend" heading="Policy Q&A · judge scores" range="7d"></tc-quality-trend>

<script type="module">
  import "@adamstavely/trenchcoat/quality-trend";
  import "@adamstavely/trenchcoat/tokens.css";

  const DAY = 86400000;
  const end = Date.UTC(2026, 10, 10);
  const trend = document.querySelector("#trend");
  trend.criteria = [
    { id: "correct", label: "Correctness" },
    { id: "cites", label: "Cites policy" },
  ];
  trend.days = Array.from({ length: 7 }, (_, i) => ({
    date: end - (6 - i) * DAY,
    scores: { correct: { mean: i < 3 ? 4.4 : 3.8, n: 160 }, cites: { mean: i < 3 ? 4.1 : 3.7, n: 160 } },
  }));
  trend.changes = [{ id: "v14", at: end - 3 * DAY, label: "Prompt v13 → v14", short: "v14", kind: "prompt" }];
  trend.addEventListener("tc-change-open", (e) => console.log(e.detail.change.label));
</script>
```

```tsx
import { QualityTrend, type QualityChange, type QualityCriterion, type QualityDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function JudgeScores({ criteria, days, changes }: { criteria: QualityCriterion[]; days: QualityDay[]; changes: QualityChange[] }) {
  return (
    <QualityTrend
      title="Policy Q&A · judge scores"
      criteria={criteria}
      days={days}
      changes={changes}
      defaultRange="30d"
      onChangeOpen={(change) => console.log("Open", change.id)}
    />
  );
}
```
