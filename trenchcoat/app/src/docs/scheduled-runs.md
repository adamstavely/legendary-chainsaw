---
pattern: list
status: new
related: trigger-builder, routine-form, usage-meter, agent-queue
---

## Overview

Agent tasks placed into a week's sessions under usage limits. Pinned tasks go first, big tasks split across sessions as linked parts, small tasks fill the gaps, and what can't fit waits in a To schedule column. Sessions lay out as a calendar by day and time. In Manual you move tasks by dragging or with a list, and Auto plans them.

## When to use

- Agent work that has to share a limited weekly allowance.
- Showing what will run when, and letting someone move it.

## When not to use

- Setting when one job runs – use `trigger-builder` or `routine-form`.
- Work running right now – use `agent-queue`.
- Overall spend – use `usage-meter`.

## Anatomy

1. **Session** `.ui-sdr__session` – its name, `.ui-sdr__day`, `.ui-sdr__meter` and `.ui-sdr__usage`
2. **Task** `.ui-sdr__task` – its name, cost and `.ui-sdr__part`
3. **Move** `.ui-sdr__move` – which session it's in
4. **To schedule** `.ui-sdr__waiting` – what doesn't fit
5. **Mode** `.ui-sdr__mode` – Auto or Manual, with `.ui-sdr__auto-note` saying why moving is off
6. **Share** `.ui-sdr__share` – how much of the session's limit the task uses, with `.ui-sdr__stats`
7. **Grip** `.ui-sdr__grip` – where a finger drags from
8. **Now** `.ui-sdr__now` – a line in the session happening now
9. **Refusal** `.ui-sdr__refusal` – why a drop wasn't allowed

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. With `layout="calendar"` days are columns and times are rows, and `layout="cards"` lets sessions wrap. Both stack on a narrow page. A calendar with no days or times falls back to cards.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each task's Move to list |
| ↑ ↓ | Choose a session in the list |
| ← → in the mode | Switch between Auto and Manual |
| Escape while dragging | Cancels the drag |

Dragging is a pointer shortcut. Every move can also be made with the list.

## Screen readers

Each session is a section named by its heading, and its meter is `role="progressbar"` with what's used in words. Each list is named for its task and part. `role="status"` announces moves and refused drops, and the same reason shows on screen. The day and time are part of each session's name, the mode is a labelled segmented control, and shares are numbers in words. The Now line says Now.

## Content

Name tasks by what they do. `planRuns` is exported, so the server can plan the same way, and `movePlacement` applies a move. Moves within the element can't overfill a session, because sessions without room are disabled in the list and refuse a drop. Give `start`, `end` and `now` to show the Now line: the element never reads the clock. Give `icon` as your own element, and avoid third-party logos.

## Do

- Save on `tc-placements-change`, and call `preventDefault()` if the move is refused. Its `task` is null when Auto redid the plan.
- Use `pinned` only when a task really has to run then, because a pinned task that doesn't fit becomes unscheduled.

## Don't

- Don't treat this as the scheduler. It shows and edits a plan, and your system runs it and enforces the limits.

## Example

```html
<tc-scheduled-runs id="runs"></tc-scheduled-runs>

<script type="module">
  import "trenchcoat/scheduled-runs";
  import "trenchcoat/tokens.css";

  const runs = document.querySelector("#runs");
  runs.sessions = [{ id: "mon", label: "Morning", day: "Monday", time: "07:00", limit: 100 }];
  runs.tasks = [{ id: "reindex", name: "Reindex the archive", cost: 40 }];
</script>
```

```tsx
import { ScheduledRuns, type ScheduledSession, type ScheduledTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sessions: ScheduledSession[] = [{ id: "mon", label: "Session 1", limit: 100 }];
const tasks: ScheduledTask[] = [{ id: "reindex", name: "Reindex the archive", cost: 40 }];

export function Runs() {
  return <ScheduledRuns sessions={sessions} tasks={tasks} onPlacementsChange={(p) => console.log(p)} />;
}
```
