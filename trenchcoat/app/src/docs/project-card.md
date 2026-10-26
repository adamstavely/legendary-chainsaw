---
pattern: disclosure
status: stable
related: experiment-card, progress-tracker, setup-guide, agent-inbox
---

## Overview

A project in two lines – its name, a progress ring, the status and the due date – that unfolds when people point at
it or open it. The ring is cut into one segment per subtask, so progress reads as “3 of 6” at a glance. Open, it lists
the subtasks to tick off, lets people change the status in place, and filters the list to one person's subtasks
when their avatar is hovered or pressed. A line under the card always says what's under the pointer: who a subtask
is assigned to, how far a person has got, or how many are left.

## When to use

- A board or dashboard of projects, where each needs to stay small until someone looks closer.
- Projects with a handful of subtasks (three to about ten) and a few people on them.
- Changing a project's status or ticking a subtask without opening the project page.

## When not to use

- An onboarding checklist for one person – use `progress-tracker` or `setup-guide`.
- An A/B test or other experiment – use `experiment-card`.
- Work being done by agents – use `agent-inbox`.

## Anatomy

1. **Progress ring** `.ui-pc__progress` – one segment per subtask, the done count in the middle
2. **Status** `.ui-pc__status` – the current status; opens the picker
3. **People** `.ui-pc__people` – avatars that filter the subtasks to one person's
4. **Subtasks** `.ui-pc__tasks` – each one a row to tick off, with its assignee's avatar
5. **Tray** `.ui-pc__foot` – what's under the pointer, and the action button

## Looks

Standard sets the white card on a gray tray, with the line and the action as a text link on the tray below. Clean
keeps everything in one white card – the line becomes its last row, the action a dark button – with blue ticks and
colour dots instead of icons in the status picker. Both open on hover, tick from the rows or the ring and filter by
person the same way.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the head: opens or closes the card. On a subtask: ticks or unticks it. On a person: keeps the list filtered to them, or stops |
| Enter / Space | On the status: opens or closes the status picker |
| ← → ↑ ↓ | In the status picker: picks the previous or next status, wrapping |
| Home / End | In the status picker: picks the first or last status |
| Escape | Closes the status picker onto the status; then closes the card onto the head |
| Tab | Moves through the head, and with the card open, the status, people, subtasks and action |

## Screen readers

The head is a button with `aria-expanded` that reads the whole summary: “Onboarding revamp: 3 of 6 done, In
progress, due Nov 14”. The status is a button with `aria-expanded`; the picker is a radio group named “Status” with
one tab stop. Subtasks are checkboxes with `aria-checked`. Each person is a toggle button with `aria-pressed`, named
“Only Maya Chen's subtasks”. The ring and avatars are hidden, and the line under the card isn't a live region – it
repeats what's on screen. While closed, everything but the head is inert.

## Content

- Name the project as people know it: “Onboarding revamp”.
- Write subtasks as short actions: “Design empty states”, not “Empty states design work”.
- Give `due` ready to read – “Nov 14” – the card adds “Due”.
- Keep statuses to four or five, each with a tone that matches its meaning: green for done, red for blocked.
- Label the action with where it goes: “Open project”.

## Do

- Set an `assignee` on each subtask that matches a member's `name`, so the people filter and avatars work.
- Pass the list from `tc-tasks-change` back, and move the status to Done when every subtask is ticked if that's
  your rule – the card doesn't do it for you.
- Use `trigger="click"` where cards sit close together and hovering would open them by accident.

## Don't

- Don't give a project more than about ten subtasks – the ring segments get too thin to point at.
- Don't put long descriptions in subtask labels; they're cut to one line.
- Don't use the action for something destructive – it's one press on a card that opens on hover.

## Example

```html
<tc-project-card id="project" heading="Onboarding revamp" due="Nov 14" status="progress" action-label="Open project"></tc-project-card>

<script type="module">
  import "trenchcoat/project-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#project");
  card.members = [{ name: "Maya Chen" }, { name: "Jonas Weber" }];
  card.tasks = [
    { id: "t1", label: "Design empty states", done: true, assignee: "Maya Chen" },
    { id: "t2", label: "Build progress tracker", assignee: "Jonas Weber" },
  ];
  card.addEventListener("tc-tasks-change", (e) => console.log(e.detail.tasks));
</script>
```

```tsx
import { useState } from "react";
import { ProjectCard, type ProjectTask } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const members = [{ name: "Maya Chen" }, { name: "Jonas Weber" }];

export function Onboarding({ initial }: { initial: ProjectTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [status, setStatus] = useState("progress");
  return (
    <ProjectCard
      title="Onboarding revamp"
      tasks={tasks}
      onTasksChange={setTasks}
      status={status}
      onStatusChange={setStatus}
      due="Nov 14"
      members={members}
      action={{ label: "Open project", onClick: () => console.log("open") }}
    />
  );
}
```
