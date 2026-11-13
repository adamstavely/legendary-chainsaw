---
pattern: toolbar
status: new
related: routine-form, scheduled-runs, trigger-builder, background-tasks
---

## Overview

A recurring agent task at a glance. The card shows the task's name, its schedule in words – “Every weekday at 09:00,
Europe/London” – and when it runs next, with a countdown that keeps itself fresh. Under it, the last runs sit in a
strip of marks: succeeded, failed, skipped or running, each with a mark as well as a colour, and a tooltip saying when
it ran, how long it took and any note. Run now, Pause or Resume, and Edit sit in the footer. A paused task says so in
words and shows no countdown.

## When to use

- A routine an agent runs on a schedule – a weekly reconciliation, a nightly digest, a daily check.
- A dashboard or sidebar of an agent's recurring jobs, one card each.
- Showing at a glance whether a schedule has been healthy lately.

## When not to use

- Setting up or editing the schedule – use `routine-form`.
- Fitting many tasks into a week under usage limits – use `scheduled-runs`.
- Choosing what starts an agent, event or schedule – use `trigger-builder`.
- Long jobs that are running now – use `background-tasks`.

## Anatomy

1. **Next run** `.ui-scd__next` – the next run's date and time, with the countdown
2. **Countdown** `.ui-scd__countdown` – “in 2 h 10 min”, or “Due now”
3. **Paused notice** `.ui-scd__paused` – in place of the next run while the task is paused
4. **Last runs** `.ui-scd__strip` – the last runs as marks, oldest first
5. **Run** `.ui-scd__run` – one run: a mark in its tone, with a tooltip
6. **Tally** `.ui-scd__tally` – how many of the finished runs succeeded
7. **Actions** `.ui-scd__actions` – Run now, Pause or Resume, and Edit

## Looks

Standard is a white card on a gray tray, with the header and schedule on the tray above it. Clean is one white card
with the header as its first row. The marks, tooltip and buttons are the same in both. The run marks' width is the
component token `--tc-scd-mark`.

## Keyboard

The strip of runs is one tab stop; the buttons are tab stops of their own.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next run, showing its tooltip |
| Home / End | Moves to the oldest or newest run |
| Enter / Space | Opens the run (`tc-run-open`) |
| Escape | Hides the tooltip until the next hover or focus |

## Screen readers

Each run is a button whose name says its status, when it ran, how long it took and its note: “Failed, Mon 21 Sep,
09:00, took 2m 06s, 3 invoices didn't match the ledger”. The tooltip repeats that and is hidden from screen readers.
The strip is a list named “Last runs”, with a hidden description of its keys. The next run is a `time` element.
Pausing and resuming are confirmed in a polite status message. Status is never colour alone: each run has a mark –
a tick, a cross, a dash or a dot.

## Content

- Write the schedule the way a person would say it, with the time zone: “Every Monday at 09:00, Europe/London”.
- Keep notes to one short line that explains a failure or a skip: “The ledger export timed out”.
- Show enough runs to see a pattern – the last 10 to 14 – not the whole history.

## Do

- Pass `now` when the page already keeps a clock, so several cards tick together.
- Explain every failed or skipped run with a note.
- Open the run's details from `tc-run-open`.

## Don't

- Don't use the card to edit the schedule – Edit hands that to `routine-form`.
- Don't show a countdown for a paused task; the card hides it for you.
- Don't rely on the tones to tell runs apart – keep the default marks or give your own words.

## Example

```html
<tc-schedule-card id="task" heading="Ledger reconciliation" schedule="Every Monday at 09:00, Europe/London"></tc-schedule-card>

<script type="module">
  import "@adamstavely/trenchcoat/schedule-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#task");
  const week = 7 * 24 * 3600 * 1000;
  card.nextRun = Date.now() + 2 * 3600 * 1000;
  card.runs = [
    { id: "r1", at: Date.now() - 3 * week, status: "succeeded", duration: 125000 },
    { id: "r2", at: Date.now() - 2 * week, status: "failed", duration: 61000, note: "3 invoices didn't match" },
    { id: "r3", at: Date.now() - week, status: "succeeded", duration: 118000 },
  ];
  card.addEventListener("tc-run-now", () => console.log("run now"));
  card.addEventListener("tc-paused-change", (e) => console.log(e.detail.paused));
</script>
```

```tsx
import { useState } from "react";
import { ScheduleCard, type ScheduleRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reconciliation({ runs, nextRun }: { runs: ScheduleRun[]; nextRun: number }) {
  const [paused, setPaused] = useState(false);
  return (
    <ScheduleCard
      title="Ledger reconciliation"
      schedule="Every Monday at 09:00, Europe/London"
      nextRun={nextRun}
      runs={runs}
      paused={paused}
      onPausedChange={setPaused}
      onRunNow={() => console.log("run now")}
      onRunOpen={(id) => console.log("open", id)}
    />
  );
}
```
