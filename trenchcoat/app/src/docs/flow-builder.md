---
pattern: none
status: new
related: workflow-canvas, step-picker, playbook-canvas, trigger-builder, agent-plan
---

## Overview

An automation drawn as a top-down flow you build in place. The trigger sits at the top and the steps run down a column
joined by lines. A + on every line opens a short menu of steps to insert there – AI step, Send message, Wait, If / else
and Approval by default, or your own. If / else forks into named paths side by side that join again below, each path a
column of its own with its own + buttons. Steps are renamed in place, moved up and down within their path and removed,
and Undo and Redo walk the edits back and forth. Test run asks the page to run the flow; while it does, a light runs down
the line into the step that's working, and each step shows its status in a mark and a word.

## When to use

- Automation and agent products where people put together what happens after a trigger – onboarding, routing,
  follow-ups.
- A flow that branches on a condition, built and tested in place, in a settings page, a side panel or a dialog.

## When not to use

- A free-form graph where any step connects to any other – use `workflow-canvas`.
- Reviewing an agent's own plan before it runs – use `agent-plan`.
- Choosing from a large catalogue of steps and tools – pair a + with `step-picker`, or pass your own `options`.
- Setting when an automation starts – use `trigger-builder`.

## Anatomy

1. **Trigger** `.ui-flb__step[data-trigger]` – what starts the flow, at the top
2. **Step** `.ui-flb__step` – its kind's icon, the kind, the title (click to rename), a detail line and, in a run, its
   status
3. **Line** `.ui-flb__link` – joins two steps; lit while the step below it is running
4. **Add** `.ui-flb__add` – the + on a line, opening the menu
5. **Menu** `.ui-flb__menu` – the steps that can go in there
6. **Paths** `.ui-flb__branches` – an If / else's paths, side by side
7. **Path name** `.ui-flb__path` – click to rename
8. **Step actions** `.ui-flb__actions` – move up, move down and remove, shown on hover
9. **Undo, Redo and Test run** `.ui-flb__tools`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Each kind's icon has its own colour – `--tc-flb-trigger`, `--tc-flb-llm`, `--tc-flb-tool`,
`--tc-flb-condition`, `--tc-flb-approval`, `--tc-flb-output` and `--tc-flb-wait` – and `--tc-flb-step-w`,
`--tc-flb-link-h` and `--tc-flb-line` size the cards and the lines. Narrower than 520 px, an If / else's paths stack.

## Keyboard

The steps, the path names and the + buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves between steps, path names and + buttons, in reading order |
| Home / End | Goes to the first or the last |
| Enter / Space on a + | Opens the menu; ↑ / ↓ move in it, Enter adds the step, Escape closes it |
| Enter or F2 on a step or path name | Renames it; Enter keeps the new name, Escape leaves it as it was |
| Alt + ↑ / ↓ on a step | Moves it up or down within its path |
| Delete / Backspace on a step | Removes it, with the steps in its paths |
| ⌘Z / Ctrl+Z | Undoes the last edit |
| ⇧⌘Z / Ctrl+Y | Redoes it |

## Screen readers

The flow is a group named by the heading. Each step is a button named by its kind, title and, in a run, its status
(“AI step: Draft a correction, Running”), with a description of its keys. Each + is named by where it adds (“Add a step
after Sort the request”) and opens a `menu` of `menuitem`s. An If / else's paths are a group, and each path's name is
a button (“Path: Factual error”). Adding, removing, moving, renaming, undoing and redoing are confirmed in a polite
status message.

## Content

- Name steps for what they do: “Draft a correction”, not “LLM call 2”.
- Name an If / else for its question (“Is it a factual error?”) and its paths for their answers.
- Pass `statuses` by step id while a test run goes, and clear them when it's done.

## Do

- Keep the + menu short; offer a fuller `step-picker` from your own menu item when there are many steps.
- Let people undo; it makes removing a step safe.

## Don't

- Don't nest more than two If / elses deep – the paths get too narrow to read.
- Don't run the real automation from Test run without saying so; test with sample data.

## Example

```html
<tc-flow-builder id="flow" heading="Correction requests"></tc-flow-builder>

<script type="module">
  import "@adamstavely/trenchcoat/flow-builder";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  flow.trigger = { title: "Correction form submitted" };
  flow.flow = [
    { id: "classify", kind: "llm", title: "Sort the request" },
    {
      id: "factual",
      kind: "condition",
      title: "Is it a factual error?",
      branches: [
        { id: "yes", label: "Factual error", steps: [{ id: "draft", kind: "llm", title: "Draft a correction" }] },
        { id: "no", label: "Anything else", steps: [{ id: "reply", kind: "output", title: "Send the standard reply" }] },
      ],
    },
    { id: "log", kind: "output", title: "Log it in the corrections sheet" },
  ];
  flow.statuses = { classify: "done", factual: "done", draft: "running" };
  flow.addEventListener("tc-flow-change", (e) => console.log(e.detail.change, e.detail.flow));
</script>
```

```tsx
import { useState } from "react";
import { FlowBuilder, type FlowStep, type FlowStepStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Corrections() {
  const [flow, setFlow] = useState<FlowStep[]>([{ id: "classify", kind: "llm", title: "Sort the request" }]);
  const [statuses, setStatuses] = useState<Record<string, FlowStepStatus>>({});
  return (
    <FlowBuilder
      title="Correction requests"
      trigger={{ title: "Correction form submitted" }}
      flow={flow}
      onFlowChange={setFlow}
      statuses={statuses}
      onTestRun={() => setStatuses({ classify: "running" })}
    />
  );
}
```
