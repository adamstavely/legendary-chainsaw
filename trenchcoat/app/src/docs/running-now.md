---
pattern: disclosure
status: new
related: background-tasks, agent-inbox, agent-monitor, notification-stack
---

## Overview

A live status of the agents' background work for a header or a sidebar. Closed, it's one quiet pill: a small ring
with how far the running tasks are, and "3 running · 2 need you" – the "need you" part in the attention tone, and left
out when nothing waits on the person. When the last task finishes it says "All done" for a moment, then "Nothing
running". Opened, a panel lists the tasks under Needs you, Running and Recently done, each with a ring that fills as it
goes (or turns while the agent can't tell), the task, the agent, how long it has been going, and one action: Review
for a task that needs the person, Stop for a running one, Open for a finished one.

It's about the agents, and above all about which of them is waiting on the person. Background Tasks is for the
person's own jobs – exports, uploads, reindexes – with Cancel, Retry and Clear finished.

## When to use

- An app where agents work in the background and sometimes stop to ask for a decision or an approval.
- A header or sidebar slot that should say, at a glance, whether anything needs the person.
- Getting from "2 need you" to the task that needs them in two clicks.

## When not to use

- The person's own exports, uploads and imports – use `background-tasks`.
- A full list of the decisions and questions agents have raised – use `agent-inbox`.
- One agent's steps, cost and controls in detail – use `agent-monitor`.
- Messages about things that already happened – use `notification-stack`.

## Anatomy

1. **Pill** `.ui-rnw__pill` – the button: a ring and "3 running · 2 need you"
2. **Ring** `.ui-rnw__ring` – how far the running tasks are, filling or turning
3. **Needs you** `.ui-rnw__need` – the count of tasks waiting on the person, in the attention tone
4. **Group** `.ui-rnw__label` – Needs you, Running or Recently done, with its count
5. **Task** `.ui-rnw__row` – the ring, the task's title, and the agent, progress and elapsed time
6. **Action** `.ui-rnw__act` – Review, Stop or Open

## Looks

Standard is a filled pill with ink rings; Clean is a hairline pill on white, with thinner rings and regular-weight task
titles. The panel uses the menu surface in both, with a plain title row. A page can set `--tc-rnw-ring` for the pill's
ring size.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the pill: opens or closes the panel; focus goes to the first task |
| ↓ / ↑ | In the list: the next or previous task |
| Home / End | In the list: the first or last task |
| Tab | From a task to its action (the list is one tab stop) |
| Escape | Closes the panel and returns focus to the pill |

## Screen readers

The pill is a button with `aria-haspopup="dialog"` and `aria-expanded`, named by its words ("2 running, 1 needs you")
and described by the panel's title. The panel is a non-modal `dialog` named by its title; each group is a `group` named
by its label, such as "Needs you 1". A task is named by its title and described by its line – "Records agent · 42% ·
6m 00s". Actions are named with the task: "Review Draft the audit report". A polite status line says a task that
needs the person or finished – "Check vendor records needs you. Classify contracts done" – once the changes have held
for a moment; progress ticks are never announced.

## Content

- Title a task with what the agent is doing to what: "Check vendor records", "Draft the audit report".
- Name the agent in `agent` when there are several, so people know who's asking.
- Set `needs-you` only when the agent can't go on without the person – a decision, an approval, missing access.
- Give `started` (and `ended` once it's done) so the elapsed time is right; pass `now` if your app keeps the clock.
- Leave `progress` out when the agent can't tell; the ring turns instead of pretending.

## Do

- Put it where people look for status – at the end of the app's header, or at the top of a sidebar.
- Take Review straight to the decision the agent needs; prevent the event to keep the panel open instead.
- Drop finished tasks from the list after a while; "Recently done" is for the last few.

## Don't

- Don't mark every running task as needing the person – the attention tone stops meaning anything.
- Don't use it for the person's own uploads and exports.
- Don't announce progress yourself as well; the element announces what matters.

## Example

```html
<tc-running-now id="agents"></tc-running-now>

<script type="module">
  import "@adamstavely/trenchcoat/running-now";
  import "@adamstavely/trenchcoat/tokens.css";

  const agents = document.querySelector("#agents");
  agents.tasks = [
    { id: "v1", title: "Check vendor records", agent: "Records agent", status: "running", progress: 0.4, started: Date.now() - 360000 },
    { id: "d1", title: "Draft the audit report", agent: "Report agent", status: "needs-you", started: Date.now() - 840000 },
  ];
  agents.addEventListener("tc-task-action", (e) => console.log(e.detail.action, e.detail.id));
</script>
```

```tsx
import { RunningNow, type RunningTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function HeaderStatus({ tasks }: { tasks: RunningTask[] }) {
  return (
    <RunningNow
      tasks={tasks}
      onTaskAction={(action, task) => {
        console.log(action, task.id);
      }}
    />
  );
}
```
