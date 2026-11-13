---
pattern: grid
status: new
related: run-receipt, agent-inbox, trace-waterfall, data-table
---

## Overview

Every agent run on one line: its status as a mark and a word, the agent, what started it, when, how long it took, its
steps, tokens and cost, and who it ran for. Chips filter by status, agent and trigger, a search matches any text on the
line, and a time range keeps the recent ones. A failed run opens in place to its error, and Enter opens the run itself.
With `live`, runs that arrive after the first render wait behind "Show 3 new runs" – announced, but never pushing the
rows the reader is looking at – until they're let in.

## When to use

- The run history of a workspace or of one agent, where people look for what failed and when.
- An operations page that keeps receiving runs, with `live`, so the list doesn't jump under the reader.
- Finding a run by its id, user or error text before opening its trace.

## When not to use

- Runs that need a person's answer – use `agent-inbox`.
- One run's steps and timing – use `trace-waterfall`.
- What one run cost, line by line – use `run-receipt`.
- A general table of records – use `data-table`.

## Anatomy

1. **Search and range** `.ui-runl__tools` – the search field `.ui-runl__query` and the time range `.ui-runl__range`
2. **Filters** `.ui-runl__filters` – chip groups `.ui-runl__chips` for status, agent and trigger, each chip `.ui-runl__chip` with its count
3. **Show new** `.ui-runl__new` – in live mode, how many runs are waiting
4. **Header row** `.ui-runl__head` – the column names
5. **Run** `.ui-runl__row` – status `.ui-runl__status` with its mark `.ui-runl__mark`, agent `.ui-runl__agent`, trigger `.ui-runl__trigger`, started `.ui-runl__started`, duration, steps, tokens, cost `.ui-runl__cost` and user `.ui-runl__user`
6. **Error** `.ui-runl__error` – a failed run's error, under its line
7. **Footer** `.ui-runl__foot` – how many runs show, how many failed and what they cost
8. **Empty** `.ui-runl__empty` – "No runs yet", or "No runs match" with Clear filters `.ui-runl__clear`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Each status has a mark and a word as well as a colour: a check for Succeeded, a cross for Failed, a dot for
Running and Queued, a slash for Cancelled. Failed runs have a chevron that turns when their error is open, and the error
sits on a red-tinted row in a monospace face. A page can set `--tc-runl-cols` and `--tc-runl-cols-narrow`, the column
widths, and `--tc-runl-icon`. When the card is narrower than 560 px only status, agent, started and cost show.

## Keyboard

The search, the range, each chip group, Show new and the list are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in a chip group | Move between chips |
| Enter / Space on a chip | Turns that filter on or off |
| ↑ / ↓ | Move between runs |
| Home / End | Go to the newest or oldest run shown |
| Enter | Opens the run |
| → / Space on a failed run | Shows its error |
| ← / Space on a failed run | Hides its error |

## Screen readers

The list is a `treegrid` named by the heading, with column headers: each run is a level-1 row, and a failed run's
error is its level-2 child row. A failed run's row has `aria-expanded`, and when open, `aria-controls` points at its
error row. Every row is described by a hidden line saying Enter opens it and → or Space
shows a failed run's error. Status marks are hidden; the word is read. The chips are toggle buttons with `aria-pressed`
in named groups ("Filter by status"…). In live mode a `role="status"` says "3 new runs" when runs arrive, and Show new
moves focus to the newest run.

## Content

- Give `startedAt` in epoch ms. Pass `now` for relative times ("4 minutes ago"); without it, a date and time show.
- Leave `duration` out while a run is going; the cell shows a dash.
- Keep `trigger` to a word or two ("Webhook", "Schedule", "Chat"); the chips are built from it.
- Write `error` as the reason a person can act on, not a stack trace.

## Do

- Use `live` on pages that keep receiving runs, so readers keep their place.
- Keep `filter`, `query` and `range` in the URL when the page is shared.

## Don't

- Don't put personal data in `user` beyond what the reader may see.
- Don't pass thousands of runs at once; page them on the server and pass a window.

## Example

```html
<tc-run-log id="runs"></tc-run-log>

<script type="module">
  import "@adamstavely/trenchcoat/run-log";
  import "@adamstavely/trenchcoat/tokens.css";

  const log = document.querySelector("#runs");
  const now = Date.UTC(2026, 10, 3, 11, 0);
  log.now = now;
  log.runs = [
    { id: "run_9a07", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: now - 360000, duration: 4200, steps: 2, tokens: 3100, cost: 0.011 },
    { id: "run_9a02", status: "failed", agent: "Invoice matcher", trigger: "Webhook", startedAt: now - 840000, duration: 31800, steps: 5, tokens: 41200, cost: 0.29, error: "Purchase order not found" },
  ];
  log.addEventListener("tc-run-open", (e) => console.log("open", e.detail.id));
</script>
```

```tsx
import { RunLog, type RunLogRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Runs({ runs, now }: { runs: RunLogRun[]; now: number }) {
  return <RunLog runs={runs} now={now} live defaultRange="24h" onRunOpen={(id) => console.log("open", id)} />;
}
```
