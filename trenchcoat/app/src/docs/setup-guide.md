---
pattern: disclosure
status: react-twin
related: stepper-form, progress-tracker, tips-panel
---

## Overview

An onboarding checklist for getting a new account ready: a progress bar for all the tasks, and the tasks in groups
that fold open one at a time. Tasks unlock in order – the first open task in a group is the current one, the ones
after it wait – and ticking a task strikes it through. When the last task of a group is ticked, the group folds away
and the next unfinished one opens. People can minimise the guide to its header and come back to it.

## When to use

- First-run setup that takes several sessions: connecting a domain, adding products, inviting a team.
- Tasks that build on each other, where doing them in order matters.
- A panel at the side of a dashboard, alongside the work people are setting up.

## When not to use

- A form people fill in one step at a time, in one sitting – use `stepper-form`.
- Showing where a single job or order is in its process – use `progress-tracker`.
- Hints and tips without tasks to finish – use `tips-panel`.

## Anatomy

1. **Header** `.tc-head` – the icon, the title, Edit, Minimise and Close
2. **Progress** `.ui-sg__track` – how many of all the tasks are done
3. **Group** `.ui-sg__group-head` – a group's title, which opens and closes it
4. **Task** `.ui-sg__task` – a tick box and the task; struck through when done, waiting when locked

## Looks

Standard puts the header on a gray tray above a white card with a meter-style progress bar across it; the current task's tick box has a visible edge and
a finished group's title has a line drawn through it. Clean is one white card with hairline shadows, a thin blue
progress line with a “4/9” count next to it, an open ring for the current task, a dashed ring for locked ones and a
hairline through finished titles. Groups fold open and closed the same way in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Edit, Minimise, Close, the group headers and the open group's tasks |
| Enter / Space | On a group header: opens or closes it; on a task: ticks or clears it |
| Enter / Space | On Minimise: collapses the guide to its header, or expands it |

Locked tasks are disabled, so Tab skips them. When the last task of a group is ticked, focus moves to that group's
header before the group folds away.

## Screen readers

The host is a region named by the heading. The progress bar is a `progressbar` named “Setup guide progress” with its
percentage. Minimise is named “Minimize setup guide” or “Expand setup guide” and has `aria-expanded`; Close is “Close
setup guide”. Group headers are buttons with `aria-expanded` and `aria-controls`, and a finished group adds “, done” to
its title. Tasks are checkboxes with `aria-checked`; a locked task adds “– finish the task before it first”. Closed
groups and a minimised body are inert.

## Content

- Name groups by the outcome: “Set up your store”, “Get ready to launch”.
- Start each task with a verb and keep it to one line: “Connect a custom domain”, “Place a test order”.
- Order tasks the way they depend on each other – only the first unfinished one in a group can be ticked.
- Keep it to three to five groups of two to five tasks.

## Do

- Mark tasks the product already knows are done with `done: true` – the guide follows the flags when they change.
- Tick tasks for people when they finish them elsewhere in the product, by updating the flags or `done`.
- Offer `closable` once the guide is mostly done, and a way to bring it back.

## Don't

- Don't put tasks in a group that can be done in any order and lock them anyway – split them into groups instead.
- Don't use it for required steps people can't skip; it's a guide, not a gate.
- Don't rely on Edit or Close doing anything on their own: they only fire `tc-edit` and `tc-close`.

## Example

```html
<tc-setup-guide id="guide" heading="Setup guide" closable></tc-setup-guide>

<script type="module">
  import "trenchcoat/setup-guide";
  import "trenchcoat/tokens.css";

  const guide = document.querySelector("#guide");
  guide.groups = [
    {
      id: "basics",
      title: "Set up your store",
      tasks: [
        { id: "name", label: "Name your store", done: true },
        { id: "domain", label: "Connect a custom domain" },
      ],
    },
    { id: "products", title: "Add products", tasks: [{ id: "first-product", label: "Add your first product" }] },
  ];
  guide.addEventListener("tc-done-change", (e) => console.log(e.detail.done));
</script>
```

```tsx
import { SetupGuide, type SetupGroup } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const groups: SetupGroup[] = [
  {
    id: "basics",
    title: "Set up your store",
    tasks: [
      { id: "name", label: "Name your store", done: true },
      { id: "domain", label: "Connect a custom domain" },
    ],
  },
  { id: "products", title: "Add products", tasks: [{ id: "first-product", label: "Add your first product" }] },
];

export function Onboarding({ onHide }: { onHide: () => void }) {
  return <SetupGuide title="Setup guide" groups={groups} onDoneChange={(done) => console.log(done)} onClose={onHide} />;
}
```
