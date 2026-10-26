---
pattern: none
status: stable
related: agent-plan, trace-waterfall, fan-out-grid, budget-guard
---

## Overview

An agent's plan set against what is really happening, as a live Gantt chart. Every step shows its planned time as a
dashed ghost, with its real bar growing over it; the part that runs past the plan turns amber, the steps that wait
on it slide right, and the expected finish moves away from the planned one. The bar on top keeps time and cost so
far against the plan, and says whether the run is on plan, behind or ahead. People see at a glance whether a run
will finish when it was meant to – and which step is to blame if it won't.

## When to use

- Long agent runs with a plan of dependent steps, where finishing on time or within budget matters.
- Explaining afterwards why a run took longer or cost more than planned.
- Any multi-step job with estimates per step and a live clock.

## When not to use

- Following the steps of a plan without timings – use `agent-plan`.
- Timing the calls inside one request or one step – use `trace-waterfall`.
- Hundreds of parallel tasks rather than a handful of planned steps – use `fan-out-grid`.
- Watching spend against a hard cap – use `budget-guard`.

## Anatomy

1. **Header** `.ui-pvac__head` – the heading, the task, time and cost against the plan, and the verdict
2. **Verdict** `.ui-pvac__verdict` – “On plan”, “+12s behind”, “8s ahead”, then “late” or “early” once finished
3. **Step** `.ui-pvac__row` – the step's state, its title and its bars
4. **Plan ghost** `.ui-pvac__ghost` – the dashed bar where the step was planned to run
5. **Actual bar** `.ui-pvac__bar` – where it really ran, or is now expected to; the overrun is amber
6. **Finish lines** `.ui-pvac__finish` – the planned finish (dashed) and the expected finish (solid)

## Looks

Clean only: the element always renders the Clean look – one white card with hairline gridlines – whatever `look` or
the page's provider say.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each step in turn; a focused step shows what it waits for, what waits for it and its cost |

Nothing else is operated – the chart only reports.

## Screen readers

The steps are a list named by the heading (“Plan vs actual”). Each step is a focusable list item whose name says
where it stands: “Draft the copy: took 0:19, planned 0:14, $0.17. Waits for Read the brief”, “Build the layout:
running for 0:08 of 0:18 planned”, or “Wire up the pricing table: starts in about 0:21, planned 0:10”. The header's
time, cost and verdict are plain text, read in order. The ticks, finish lines, dependency links and key are hidden
from assistive technology. Nothing is announced as the run moves on.

## Content

- Title steps with a verb and an object, in a few words: “Build the layout”, “Wire up the pricing table”.
- Set `task` to what the run is for, in the product's words: “Ship the pricing page”.
- Plan times should be the agent's own estimates – the chart is only as honest as the plan.
- Pass `formatCost` for other currencies or credits, and `formatTime` for runs measured in hours.

## Do

- Give steps their `deps`, so a late step pushes what waits for it and the expected finish moves with it.
- Pass `elapsed` (or `now`) from the run's own clock when you have one, so the chart and the run agree.
- Add `cost` and `planCost` per step when spend matters – the header then compares them.

## Don't

- Don't use it for a run with no plan – without plan times there is nothing to compare.
- Don't show more than about a dozen steps; group small steps into one.
- Don't rely on colour alone in surrounding text – say “behind” or “late”, as the verdict does.

## Example

```html
<tc-plan-vs-actual id="run" task="Ship the pricing page"></tc-plan-vs-actual>

<script type="module">
  import "trenchcoat/plan-vs-actual";
  import "trenchcoat/tokens.css";

  const chart = document.querySelector("#run");
  chart.steps = [
    { id: "brief", title: "Read the brief", plan: 6000, start: 0, end: 5000 },
    { id: "copy", title: "Draft the copy", plan: 14000, deps: ["brief"], start: 5000 },
    { id: "layout", title: "Build the layout", plan: 18000, deps: ["brief"], start: 5000 },
  ];
  chart.elapsed = 21000;
</script>
```

```tsx
import { PlanVsActual, type PlanVsActualStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const steps: PlanVsActualStep[] = [
  { id: "brief", title: "Read the brief", plan: 6000, start: 0, end: 5000, cost: 0.02, planCost: 0.02 },
  { id: "copy", title: "Draft the copy", plan: 14000, deps: ["brief"], start: 5000, cost: 0.14, planCost: 0.12 },
];

export function RunPlan({ elapsed }: { elapsed: number }) {
  return <PlanVsActual task="Ship the pricing page" steps={steps} elapsed={elapsed} />;
}
```
