---
pattern: disclosure
status: new
related: agent-queue, notification-stack, progress-tracker, toaster
---

## Overview

The person's own long-running jobs – an export, an upload, an agent run, a reindex – at a glance, while they carry
on with something else. An icon button in the app's header shows how many are active and a ring with their overall
progress; once nothing is running it turns to a check when everything finished, or an alert when something failed,
until the person opens it. It opens a panel that lists the tasks under Running, Queued, Done and Failed, each with
its progress, the time left and elapsed as the app reports them, and Cancel, Retry or Open. The app owns the tasks:
every action is a cancelable event.

## When to use

- Exports, uploads, imports and reindexes that take more than a few seconds and shouldn't block the page.
- Agent runs the person started and wants to come back to when they're done.
- Anywhere people need to find a finished file again, or retry what failed, without a notification for every job.

## When not to use

- Watching a pool of agent workers and their throughput – use `agent-queue`.
- A one-off message that something happened – use `toaster`; a stack of notices to read – use `notification-stack`.
- Steps the person ticks off themselves – use `progress-tracker`.

## Anatomy

1. **Indicator** `.ui-bgt__trigger` – the header button: a ring with the overall progress, a check or an alert
2. **Badge** `.ui-bgt__badge` – how many tasks are running or queued
3. **Section** `.ui-bgt__label` – Running, Queued, Done or Failed, with its count
4. **Task** `.ui-bgt__row` – the kind's icon, the label and detail, and the status line
5. **Progress** `.ui-bgt__bar` – how far a running task is, or a sliding bar while it's working
6. **Actions** `.ui-bgt__acts` – Cancel, Retry or Open
7. **Clear finished** `.ui-bgt__clear` – removes the done and failed tasks

## Looks

Standard sets the panel's header on the gray tray, the list on a white card and Clear finished on the tray below it;
its progress ring and bars are ink. Clean is one white card with the header as its first row, section labels as
small capitals, quieter task labels, accent-coloured bars and thinner icons. Opened from the indicator, both looks
use the menu surface with a plain title row, since a popover carries no card header.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the indicator: opens or closes the panel; focus goes to the first task |
| ↓ / ↑ | In the list: the next or previous task |
| Home / End | In the list: the first or last task |
| Tab | From a task to its actions, then Clear finished (the list is one tab stop) |
| Escape | Closes the panel and returns focus to the indicator |

## Screen readers

The indicator is a button with `aria-haspopup="dialog"` and `aria-expanded`, named with the counts: “Background tasks,
3 active (2 running, 1 queued), 1 failed”. The panel is a non-modal `dialog` named by its title. Each section is a
`group` named by its label, such as “Running 2”. A task is named by its label and described by its detail and its
status line – “40% · 1m 05s left · 12s elapsed”, “Waiting to start”, “Done · took 42s”, or the error. A running
task's bar is a `progressbar` named by the label, with its percentage, or “Working” when the app doesn't know it. The
actions are named with the task: “Cancel Export Q3 revenue”, “Retry Upload assets”, “Open invoices.zip”. A polite
status region says “Export Q3 revenue ready” or “Upload assets failed” when a task finishes or fails – never each
progress tick – and “… cancelled”, “… queued again” and “Cleared 2 finished tasks” after an action.

## Content

- Label a task with what it does to what, in a few words: “Export Q3 revenue”, “Upload brand-assets.zip”.
- Put the size, the count or the source in `detail`: “CSV · 48,210 rows”.
- Give `remaining` and `elapsed` only when you have them; the component reads no clock, and a missing time is
  better than a guessed one. Leave `progress` out when you can't measure it – the task shows “Working…”.
- Write `error` as what happened, not a code: “Connection lost at 62%”.
- Give a done task a `result` with the file's name, so Open says what it opens.
- Use `announce` to word the announcements your own way (“Your export is ready”).

## Do

- Keep the tasks in your own state and pass them back after each action; prevent the event when the action really
  happens on your server.
- Mark jobs that can't be stopped with `cancelable: false` and ones that can't be repeated with `retryable: false`.
- Put the indicator where people look for status – at the end of the app's header.

## Don't

- Don't push a notification for every progress step as well – the ring and the panel already show it.
- Don't list other people's jobs or system work here; it's the person's own tasks.
- Don't remove a failed task on your own: leave it until the person retries or clears it.

## Example

```html
<tc-background-tasks id="jobs"></tc-background-tasks>

<script type="module">
  import "trenchcoat/background-tasks";
  import "trenchcoat/tokens.css";

  const jobs = document.querySelector("#jobs");
  jobs.tasks = [
    { id: "e1", label: "Export Q3 revenue", kind: "export", status: "running", progress: 0.4, remaining: 65000 },
    { id: "u1", label: "Upload brand-assets.zip", kind: "upload", status: "failed", error: "Connection lost" },
  ];
  jobs.addEventListener("tc-task-retry", (e) => {
    e.preventDefault(); // the app restarts the upload and updates the list
    console.log("retry", e.detail.task.id);
  });
</script>
```

```tsx
import { useState } from "react";
import { BackgroundTasks, type BackgroundTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Header() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([
    { id: "e1", label: "Export Q3 revenue", kind: "export", status: "done", elapsed: 42000, result: { label: "q3-revenue.csv", href: "/files/q3-revenue.csv" } },
  ]);
  return <BackgroundTasks tasks={tasks} onTasksChange={(next) => setTasks(next)} onOpen={(task) => console.log("open", task.id)} />;
}
```
