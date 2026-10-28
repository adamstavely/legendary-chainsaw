---
pattern: grid
status: new
related: agent-queue, progress-tracker, coverage-matrix, filter-menu, data-table
---

## Overview

A kanban board for a sprint. A breadcrumb names the board; a bar counts the tasks and holds search, a label filter
and a compact view. Each status is a gray lane of white cards – key, title, assignee, priority, estimate, due date,
subtasks, pull request and labels. Drag cards between lanes and reorder them, add a card at the top of a lane, or open
a card in a panel that slides in from the right to change its status, priority, labels, assignee and title, or delete
it.

## When to use

- Sprint and project boards where work moves through a few fixed statuses.
- Triage views where people sort, label and assign many small items.

## When not to use

- Work an agent is doing, with its own states and approvals – use `agent-queue`.
- A checklist of steps toward one goal – use `progress-tracker`.
- Items checked against many criteria – use `coverage-matrix`.
- Many items with many columns to sort – use `data-table`.

## Anatomy

1. **Breadcrumb** `.ui-tb__crumbs` – where the board sits, the last step the board itself, and a favourite star
2. **Bar** `.ui-tb__bar` – the task count, search, the label filter and the compact toggle
3. **Lane** `.ui-tb__column` – a status: its icon, name, count and an add button, then its cards
4. **Card** `.ui-tb__card` – a task's key, title, assignee and properties; drag it, or open it
5. **Property** `.ui-tb__prop` – a pill: priority, estimate, due date, subtasks, pull request or label
6. **Drop line** `.ui-tb__drop` – where a dragged card will land
7. **Panel** `.ui-tb__panel` – the open card: title, status, priority, labels, assignee and Delete

## Looks

Standard is a white panel with a hairline border; Clean lifts it with the card shadow and rounds the lanes and cards
a little less. Lanes, cards and the panel are the same in both. `--tc-tb-scrim` sets the wash behind the open panel.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bar's controls, each lane's add button and the cards |
| Enter / Space on a card | Opens it in the panel |
| Escape | Closes the panel; focus returns to the card |
| ↓ / ↑ on the filter | Opens the label menu on its first or last item |
| ↑ / ↓, Home / End in the menu | Moves between labels |
| Escape in the menu | Closes it; focus returns to the filter |
| Enter in a new card's field | Adds the card and focuses it |
| Escape in a new card's field | Cancels; focus returns to the add button |

Dragging is the pointer's way to move a card; the panel's Status choices do the same from the keyboard.

## Screen readers

The board is a region named by its breadcrumb ("Northwind / Web app / Sprint 24"), and the breadcrumb a navigation
landmark with the last step as the current page. The task count is a status message, so searching and filtering
announce "1 task of 11". Each card reads its key and title; priority is in words. The label menu is a menu of
checkbox items; the filter button says how many labels are selected. The panel is a complementary region named "Task
details", inert while closed; its choices are toggle buttons.

## Content

- Keep titles short enough for two lines – details belong in your own app's task view.
- Give `dueIn` in whole days: negative is late ("1d late"), 0 is "Today", 1–2 are "soon".
- Status icons are elements – a 14 px SVG ring per status reads well; the React wrapper takes React nodes.

## Do

- Listen for `tc-tasks-change` and save `tasks`, or control `tasks` and apply the change yourself.
- Give each label a colour with enough contrast as a dot; the name is always shown beside it.

## Don't

- Don't use more than six lanes – the board scrolls sideways beyond that.
- Don't rely on dragging alone in your own instructions – the panel's Status choices move cards too.

## Example

```html
<tc-task-board id="board"></tc-task-board>

<script type="module">
  import "trenchcoat/task-board";
  import "trenchcoat/tokens.css";

  const board = document.querySelector("#board");
  board.path = ["Northwind", "Web app", "Sprint 24"];
  board.statuses = [
    { id: "todo", label: "Todo" },
    { id: "done", label: "Done" },
  ];
  board.labels = [{ id: "bug", label: "Bug", color: "#ef4444" }];
  board.people = [{ id: "maya", name: "Maya Kim" }];
  board.tasks = [{ id: "t1", key: "NW-201", title: "Fix the invite flow", status: "todo", priority: 3, labels: ["bug"], created: "Oct 2" }];
  board.addEventListener("tc-tasks-change", (e) => console.log(e.detail.change, e.detail.task));
</script>
```

```tsx
import { useState } from "react";
import { TaskBoard, type Task } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const statuses = [
  { id: "todo", label: "Todo" },
  { id: "done", label: "Done" },
];

export function Sprint({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  return <TaskBoard tasks={tasks} onTasksChange={setTasks} statuses={statuses} labels={[]} people={[]} path={["Web app", "Sprint 24"]} />;
}
```
