---
pattern: none
status: stable
related: agent-plan, handoff, approval-card
---

## Overview

Steer an agent while it works, without stopping it. The card shows the run – what the agent is doing, which model,
a live clock – and its plan: the done steps, the active one with its own clock, and the steps still to come. Below
it, people type a note: Enter queues it for the next step, and when the agent takes it in, the note glides up into
the plan under the step that used it. When something can't wait, ⌘↵ (Ctrl+Enter) or “Now” on a queued note sends it
to the active step right away.

## When to use

- Long agent runs where people notice something mid-way – a constraint, a correction – and want it used without
  starting over.
- When it should be clear which step picked up which instruction.
- Alongside Pause and Resume, for runs people supervise.

## When not to use

- Reviewing and editing the plan before the run starts – use `agent-plan`.
- The agent stopping to hand the task to a person – use `handoff`.
- The agent asking for permission before an action – use `approval-card`.

## Anatomy

1. **Header** – the shared card header: the task, the agent, “Step 2 of 5”, and on the right the run clock and Pause / Resume
2. **Plan** `.ui-st__plan` – the steps, done, active and to come; notes the agent took in sit under their step
3. **Active step** `.ui-st__step[data-status="active"]` – the step running now, with a spinner and its own clock
4. **Queue** `.ui-st__queue` – notes waiting for the next step, each with “Now” and ✕
5. **Field** `.ui-st__field` – “Steer the agent…” and the send button
6. **Hint** `.ui-st__hint` – the keys, or why a note didn't go through

## Looks

Standard puts the header on a soft gray tray above a white card with the plan, with the queue and the field on the tray below
it. Clean is one white card with the header as its first row: the queued notes and the field sit inside it, at the bottom. Both glide a taken-in note
from the queue into the plan the same way.

## Keyboard

| Key | What it does |
|---|---|
| Enter | In the field: queues the note for the next step |
| ⌘ Enter / Ctrl Enter | In the field: sends the note to the active step right away (with `onInterrupt` set) |
| Shift Enter | In the field: a new line |
| Escape | In the field: clears what was typed |
| Tab | Moves between Pause / Resume, “Now” and ✕ on each queued note, the field and the send button |

When a queued note goes – applied with “Now” or removed with ✕ – focus moves to the same button on the next note,
then the one before, then the field, instead of the page.

## Screen readers

The plan is a list named “Plan”; each step starts with “Done:”, “In progress:” or “To do:”, and the active one is
`aria-current="step"`. The field is named “Steer the agent” and described by the hint below it. A status region
says what happened to each note: “Queued for the next step: …”, “Interrupting: …”, “Opus 5.5 picked up: …” and
“Couldn't send: …”; a failed send is also an alert, “Couldn't send – try again”. The buttons say what they act on:
“Apply now: “Keep the old column””, “Remove “Keep the old column””, “Pause the run”, “Queue for the next step”.

## Content

- Write step titles as what the agent does, in the imperative: “Backfill 1.2M rows in batches of 10k”.
- Give `agent` the name people know – it's said when the agent picks up a note.
- Keep the placeholder an invitation to steer: “Steer the agent…”, “Add an instruction…”.
- Leave `onInterrupt` out when your agent can't take a note mid-step – “Now” and the ⌘↵ hint go with it.

## Do

- Move a note from `queue` to the step's `notes` (with `picked: "next"`, or `"now"` when interrupting) when the agent
  takes it in – that's what makes it glide.
- Return a promise from `onQueue` / `onInterrupt` and reject it when sending fails; the text comes back to the field.
- Pass `startedAt` on the run and on the active step so the clocks are right from the start.

## Don't

- Don't drop queued notes silently when the run ends – the field says “Notes still in the queue were not used”, so
  leave them in `queue`.
- Don't use it for a run people can't influence; show its progress with `agent-plan` instead.

## Example

```html
<tc-agent-steering id="run" heading="Add email verification to users" agent="Opus 5.5" removable></tc-agent-steering>

<script type="module">
  import "trenchcoat/agent-steering";
  import "trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.startedAt = Date.now() - 41000;
  run.steps = [
    { id: "s1", title: "Read the users table schema", status: "done", duration: 38000 },
    { id: "s2", title: "Write the migration", status: "active", startedAt: Date.now() - 3000 },
    { id: "s3", title: "Run the test suite", status: "pending" },
  ];
  run.queue = [{ id: "n1", text: "Keep the old column until Friday" }];
  run.onQueue = (text) => (run.queue = [...run.queue, { id: crypto.randomUUID(), text }]);
  run.addEventListener("tc-remove", (e) => (run.queue = run.queue.filter((n) => n.id !== e.detail.id)));
</script>
```

```tsx
import { useState } from "react";
import { AgentSteering, type SteerNote, type SteerStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SteerRun({ steps, startedAt }: { steps: SteerStep[]; startedAt: number }) {
  const [queue, setQueue] = useState<SteerNote[]>([]);
  return (
    <AgentSteering
      title="Add email verification to users"
      agent="Opus 5.5"
      startedAt={startedAt}
      steps={steps}
      queue={queue}
      onQueue={(text) => setQueue((q) => [...q, { id: crypto.randomUUID(), text }])}
      onRemove={(id) => setQueue((q) => q.filter((n) => n.id !== id))}
    />
  );
}
```
