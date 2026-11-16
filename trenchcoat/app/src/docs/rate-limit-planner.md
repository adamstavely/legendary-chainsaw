---
pattern: none
status: new
related: rate-limit-status, scheduled-runs, schedule-card, budget-alerts
---

## Overview

Plan when agent runs happen so they stay under one API rate limit, in tokens a minute. On top, the day's load as a
stepped area with the limit as a line; whatever goes over it is hatched in the danger colour. Below, a row per run –
its name, agent, times and tokens a minute – with a bar on the same time axis that you drag, or focus and move with the
arrow keys, and the chart follows as it moves. The words above the chart say the peak and how far over it goes (“Peak
570K a minute at 02:00 – 43% over the limit”) and when (“Over the limit for 1 h 30 min: 01:00–02:30”). Spread out
proposes start times that lower the peak; the page may accept them or not.

## When to use

- Scheduling agent runs, cron jobs or batch work against one API rate limit.
- Showing why a night's runs hit 429s – which overlap and when the load goes over.
- An ops or settings page where people move their own jobs and watch the peak change.

## When not to use

- Live usage against each model's limits – use `rate-limit-status`.
- Placing tasks into sessions under usage limits across a week – use `scheduled-runs`.
- One recurring task and its next run – use `schedule-card`.
- Several limits at once (per model, per key) – use one planner per limit.

## Anatomy

1. **Words** `.ui-rlp__words` – the peak and the time over the limit
2. **Chart** `.ui-rlp__chart` – the load as a stepped area
3. **Limit** `.ui-rlp__limit` – the dashed line, labelled
4. **Overflow** `.ui-rlp__over` – the load above the limit, hatched
5. **Time axis** `.ui-rlp__ticks`
6. **Run row** `.ui-rlp__row` – name, agent, times and tokens a minute
7. **Bar** `.ui-rlp__bar` – the run on the axis; drag it or use the keys. Striped where it runs while over the limit;
   gray with a lock when fixed
8. **Spread out** `.ui-rlp__spread`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The load uses the accent, the limit and the overflow the danger colour. `--tc-rlp-names` sets the name
column, `--tc-rlp-chart-h` the chart's height, `--tc-rlp-bar-h` a bar's height and `--tc-rlp-min` the narrowest the
axis gets before it scrolls sideways.

## Keyboard

The bars are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves the run by `step` minutes (15) |
| Shift + ← / → | Moves it by an hour |
| Home / End | Moves it to the start or the end of the day |
| ↑ / ↓ | Goes to the run above or below |
| Tab | Leaves the runs for Spread out |

## Screen readers

Each movable bar is a `slider` named “Wire summaries start”, with value text “Starts 00:30, ends 03:00, while over the
limit” and a description of its keys. A fixed run says so in words. The chart is an image named by the peak and the time
over the limit, and the same words are on the page above it. Moving with the keys and Spread out are confirmed in a
polite status message with the new peak.

## Content

- Pass `day` (epoch ms) for where the axis starts and `time-zone` for the times people plan in.
- Give each run the load it puts on the limit while it runs, in tokens a minute.
- Mark runs that must run when they do as `fixed`.

## Do

- Keep it to about ten runs; group small ones per agent first.
- Show the limit your provider enforces, not the one you'd like.

## Don't

- Don't use it for live monitoring – it plans a day.

## Example

```html
<tc-rate-limit-planner id="plan" limit="400000" hours="12" time-zone="UTC"></tc-rate-limit-planner>

<script type="module">
  import "@adamstavely/trenchcoat/rate-limit-planner";
  import "@adamstavely/trenchcoat/tokens.css";

  const plan = document.querySelector("#plan");
  const day = Date.UTC(2026, 10, 16);
  const at = (h, m = 0) => day + (h * 60 + m) * 60000;
  plan.day = day;
  plan.runs = [
    { id: "wire", name: "Wire summaries", agent: "Wire desk", start: at(0, 30), minutes: 150, tokensPerMinute: 180000 },
    { id: "translate", name: "Translation batch", agent: "Languages desk", start: at(1), minutes: 120, tokensPerMinute: 160000 },
    { id: "archive", name: "Archive tagging", agent: "Archive", start: at(1, 30), minutes: 180, tokensPerMinute: 140000 },
    { id: "briefing", name: "Morning briefing", agent: "Briefing", start: at(5), minutes: 60, tokensPerMinute: 120000, fixed: true },
  ];
  plan.addEventListener("tc-runs-change", (e) => console.log(e.detail.change, e.detail.runs));
</script>
```

```tsx
import { useState } from "react";
import { RateLimitPlanner, type PlannedRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const day = Date.UTC(2026, 10, 16);

export function Overnight() {
  const [runs, setRuns] = useState<PlannedRun[]>([
    { id: "wire", name: "Wire summaries", start: day + 30 * 60_000, minutes: 150, tokensPerMinute: 180_000 },
    { id: "translate", name: "Translation batch", start: day + 60 * 60_000, minutes: 120, tokensPerMinute: 160_000 },
  ]);
  return <RateLimitPlanner limit={300_000} day={day} hours={12} runs={runs} onRunsChange={(next) => setRuns(next)} />;
}
```
