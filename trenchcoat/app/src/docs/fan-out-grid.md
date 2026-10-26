---
pattern: listbox
status: stable
related: agent-queue, parallel-attempts, plan-vs-actual, delegate-board
---

## Overview

One agent hands a big job to many workers, and every task is a cell on a grid that fills in as they get through
it. Cells are tinted by state – queued, running with a sweeping shine, retrying, done, failed – and the bar on top
counts what is done, what it cost and the time left. Pointing at a cell, or moving to it with the arrow keys, shows
the task's details; the counts under the grid filter it to one state, and failed tasks can be sent again together.
People see the shape of a large run at once and can still find the one task that went wrong.

## When to use

- Batch jobs an agent splits into dozens to thousands of similar tasks: enriching leads, tagging documents,
  checking pages.
- Showing progress, failures and cost of a run while it goes on, and what to retry when it ends.

## When not to use

- A queue of different jobs waiting for an agent – use `agent-queue`.
- A few attempts at the same task, compared side by side – use `parallel-attempts`.
- A handful of dependent steps with planned times – use `plan-vs-actual`.
- Assigning work between agents and people – use `delegate-board`.

## Anatomy

1. **Bar** `.ui-fog__bar` – the title, the job, done of total, the cost and the time left
2. **Grid** `.ui-fog__grid` – every task as a cell, tinted by its state
3. **Cell** `.ui-fog__cell` – one task; hover, focus or click shows its details
4. **Details** `.ui-fog__tip` – the task's label and state, worker, time, cost, attempts, and its result or error
5. **Counts** `.ui-fog__legend` – done, running, retrying and failed; each one filters the grid
6. **Retry failed** `.ui-fog__retry` – sends the failed tasks again, while some have failed

## Looks

Standard puts the grid on a white card in the gray tray, with the counts and Retry on the tray under it. Clean has
no tray: a bar on top and one white panel holding the grid, with the counts as a quiet line inside it, under the
grid. The cells, states and keys are the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the grid – on the kept task, or the first – and on to the counts and Retry failed |
| ← / → / ↑ / ↓ | Moves from cell to cell, row by row; the details follow |
| Home / End | Moves to the first or last task |
| Enter / Space | Keeps the task's details open, or lets them go |
| Escape | Closes the details and lets go of the kept task; with the pointer on a cell, hides its details |

## Screen readers

The grid is a listbox named with the number of tasks and how to use it (“140 tasks – arrow keys move, Enter keeps the
details”), with the active cell given by `aria-activedescendant` and the details as its description. Each cell is an
option named with its label and state (“northwind.io, failed”); the kept task is `aria-selected`. The counts are
toggle buttons in a group named “Show only”. A polite live region reports progress in steps of ten percent (“40% of
140 tasks done.”) and then the result (“Finished: 132 done, 8 failed, $1.84.”). If Retry failed fails, an alert says
“Couldn't retry the failed tasks.”

## Content

- Label tasks with the thing they work on, as short as it can be: a domain, a file name, an id people recognise.
- Write `error` as what went wrong, in a few words – “Site blocked the crawler”, not a stack trace.
- Write `result` as one line of what came out: “Found 3 contacts”.
- Name `job` with a verb and the number: “Enrich 240 leads”.

## Do

- Pass `workers` so the time left counts what really runs at once.
- Set `onRetry` when failed tasks can be run again; return a promise so the button waits while it runs.
- Pass `elapsed` from the job's own clock, so the grid and the job agree.

## Don't

- Don't use it for fewer than about twenty tasks – a list says more.
- Don't change task ids as they are retried – the cell would jump and lose its place.
- Don't hide failures behind a filter by default; let people choose to look away.

## Example

```html
<tc-fan-out-grid id="job" heading="Lead enrichment" job="Enrich 3 leads"></tc-fan-out-grid>

<script type="module">
  import "trenchcoat/fan-out-grid";
  import "trenchcoat/tokens.css";

  const grid = document.querySelector("#job");
  grid.tasks = [
    { id: "t1", label: "northwind.io", status: "done", start: 0, end: 4200, cost: 0.012, result: "Found 3 contacts" },
    { id: "t2", label: "acme.dev", status: "failed", start: 0, end: 3100, error: "Site blocked the crawler" },
    { id: "t3", label: "globex.com", status: "running", start: 3100, worker: "Researcher 2" },
  ];
  grid.elapsed = 5000;
  grid.onRetry = (ids) => console.log("retry", ids);
  grid.addEventListener("tc-select", (e) => console.log(e.detail.task));
</script>
```

```tsx
import { FanoutGrid, type FanoutTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Enrichment({ tasks, elapsed, retry }: { tasks: FanoutTask[]; elapsed: number; retry: (ids: string[]) => Promise<void> }) {
  return <FanoutGrid title="Lead enrichment" job={`Enrich ${tasks.length} leads`} tasks={tasks} elapsed={elapsed} workers={8} onRetry={retry} />;
}
```
