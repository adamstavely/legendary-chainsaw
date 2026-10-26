---
pattern: none
status: stable
related: fan-out-grid, agent-lanes, budget-guard, agent-inbox
---

## Overview

The work waiting for your agents, and how fast it moves. Jobs wait in a queue on the left, a free worker pulls the
front one and runs it as a growing bar, and it lands in Done – or flashes into Failed, or goes back in the queue to
retry. Above the flow, four numbers say how it's going (Waiting, Running, Throughput, Wait p95); below it, a chart of
the queue depth over the last minutes shows the backlog build up while the provider rate-limits the workers and
drain when they resume. People can point at or focus any job for its details, pin its card, move it to the front or
cancel it, and pause the queue or change the number of workers.

## When to use

- Monitoring a pool of agent workers that pull from a shared queue – LLM calls, tool calls, sub-agents, reviews.
- Showing rate limits and backpressure as they happen, so people can see why work is slow.
- Operating the queue: pausing it, adding workers, promoting or cancelling a job.

## When not to use

- One big job split across many parallel tasks, shown as a grid that fills in – use `fan-out-grid`.
- What each agent is doing over time, with hand-offs between them – use `agent-lanes`.
- Spend and token limits for a run – use `budget-guard`.
- A list of background tasks people review and act on one by one – use `agent-inbox`.

## Anatomy

1. **Header** `.ui-agq__head` – the heading, the Live / Paused / Rate limited state, Pause and the worker stepper
2. **Numbers** `.ui-agq__stats` – Waiting, Running, Throughput and Wait p95
3. **Job** `.ui-agq__job` – a waiting card or a running bar; the rest of the backlog is a heap of squares
4. **Worker** `.ui-agq__slot` – one worker and the job it's running, or Idle / Paused
5. **Done and Failed** `.ui-agq__bin` – where finished jobs land, with their counts
6. **Depth chart** `.ui-agq__chart` – waiting jobs over the last minutes, rate-limited stretches and the backpressure line

## Looks

Standard sets the flow and the chart in a white card on the gray tray, with the header on the tray above it. Clean
is one quiet white card with hairlines between its parts. Jobs move, flash and land the same way in both, and the
workers turn amber with a countdown in both while a rate limit is active.

## Keyboard

The jobs are one tab stop; the arrows walk through the running jobs, then the queue.

| Key | What it does |
|---|---|
| Tab | Moves to the jobs (the last one used), then to the pinned card, if any |
| → / ↓ | Moves to the next job |
| ← / ↑ | Moves to the previous job |
| Home / End | Moves to the first or the last job |
| Enter / Space | Pins the focused job's card, or closes it again |
| Escape | Closes the pinned card (from the job or inside the card); otherwise hides the hover card |

Focusing a job shows the same small card as hovering it. Pause, Resume and the – / + worker buttons are ordinary
buttons in the header.

## Screen readers

Each job is a button whose name starts with what it shows and adds what it is and where it stands – “Summarise
ticket 12s, LLM call, waiting 12s, position 3 of 9, high priority” – with `aria-haspopup="dialog"` and
`aria-expanded` for its card. The jobs sit in a group named “Jobs: 3 running, 9 waiting”. A hovered or focused card
is a `tooltip`; a pinned one is a `dialog` named “Summarise ticket details” with a “Close details” button. The chart
is an image described in words: “Queue depth over the last 2 min: 9 waiting now, peak 14, average 6.2, rate limited
once.” A polite live region reports what matters as it happens – “Rate limited – workers paused for 20 seconds”,
“Rate limit lifted – workers resumed”, “18 jobs waiting – above the backpressure line of 14”, a failure with its
error, and “failed – retrying, attempt 2 of 3”. Pause is a toggle button named “Pause the queue” or “Resume the
queue”; the stepper is a group named “Workers” whose count is announced as it changes.

## Content

- Name jobs by what they do, in a few words: “Summarise ticket”, “Refund check” – the name is what people see on a
  small card.
- Use `detail` for the source, target or model, and `error` for what went wrong in plain words.
- Set `name` to the queue's own name (“support-automation”) when there's more than one.
- Name workers by agent or model, so a running bar says who's on it.

## Do

- Set `backpressure` to the depth that means trouble – above it, Waiting turns amber and the line shows on the chart.
- Pass `rateLimits` with the provider's real windows, so the pause and countdown match what's happening.
- Keep finished jobs in `jobs` for the chart's window, or pass `totals` for counts since the start.

## Don't

- Don't use it for a handful of one-off tasks – a list says more.
- Don't move jobs between statuses faster than people can follow; update a few times a second at most.
- Don't hide failures by removing failed jobs straight away – let them land in Failed.

## Example

```html
<tc-agent-queue id="queue" name="support-automation" pausable stepper backpressure="14"></tc-agent-queue>

<script type="module">
  import "trenchcoat/agent-queue";
  import "trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.workers = [{ id: "w1", name: "Sonnet" }, { id: "w2", name: "Haiku" }];
  queue.jobs = [
    { id: "j1", name: "Summarise ticket", kind: "llm", status: "running", worker: "w1", enqueuedAt: Date.now() - 9000, startedAt: Date.now() - 4000, estimate: 8000 },
    { id: "j2", name: "Refund check", kind: "tool", status: "queued", enqueuedAt: Date.now() - 3000 },
  ];
  queue.addEventListener("tc-paused-change", (e) => fetch("/api/queue", { method: "PATCH", body: JSON.stringify({ paused: e.detail.paused }) }));
</script>
```

```tsx
import { useState } from "react";
import { AgentQueue, type QueueJob, type QueueWorker } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const workers: QueueWorker[] = [{ id: "w1", name: "Sonnet" }, { id: "w2", name: "Haiku" }];

export function Queue({ jobs }: { jobs: QueueJob[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <AgentQueue
      title="Queue"
      name="support-automation"
      jobs={jobs}
      workers={workers}
      paused={paused}
      onPausedChange={setPaused}
      backpressure={14}
      onCancel={(job) => fetch(`/api/jobs/${job.id}`, { method: "DELETE" })}
    />
  );
}
```
