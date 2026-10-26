---
pattern: listbox
status: new
related: agent-plan, run-compare, conversation-branches
---

## Overview

An agent run's restore points on a timeline – “go back to step 4 and try again”. The agent saves a checkpoint
before each step; pick one and the card shows what it captured (the conversation, memory, the workspace) and what
going back discards: that step and every later one, the files they changed and what they spent. A note for the
agent goes along with the restore, so the retry can go differently. People see the cost of rewinding before they
commit to it.

## When to use

- Long agent runs where a wrong turn halfway through shouldn't mean starting over.
- Letting people retry a failed step with a different instruction (“use the staging database instead”).
- Making the cost of going back visible – discarded steps, file changes, tokens and money.

## When not to use

- Reviewing and editing an agent's plan before it runs – use `agent-plan`.
- Comparing two finished runs side by side – use `run-compare`.
- Forking a chat by editing an earlier message – use `conversation-branches`.

## Anatomy

1. **Head** `.ui-rcp__head` – how many checkpoints, the run's status and its goal
2. **Timeline** `.ui-rcp__strip` – the run as a line, a dot per checkpoint; what going back discards is hatched
3. **Step** `.ui-rcp__row` – one checkpoint: its number, the step, a detail, the tool and when it was taken
4. **Details** `.ui-rcp__panel` – what the picked checkpoint captured and what going back discards
5. **Note** `.ui-rcp__note` – an optional instruction for the retry
6. **Foot** `.ui-rcp__foot` – where the run starts again and “Go back to step N”

## Looks

Standard sets the timeline, steps and details in a white card on a gray tray, with the foot and the Go back button
on the tray below. Clean is one white card: the foot is its last row under a hairline, and the details' captions
are small capitals. Both mark the picked step with an accent bar and hatch what going back discards.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the list – to the picked step, else the newest one that can be restored – and on to the details |
| ↓ / ↑ | Moves to the next or previous step and picks it (a step without a snapshot takes focus but isn't picked) |
| Home / End | Moves to the first or last step and picks it |
| Space | Picks the focused step |
| Enter | Picks the focused step and moves to the note |
| Escape | On a step: clears the pick. In the note: returns to the picked step, the pick stays |
| Enter in the note | Goes back to the picked step |

## Screen readers

The card is a region named by the run's goal. The steps are a listbox, “Restore points”, whose options read “Step 4:
Run the test suite, Failed, at 41 seconds”, with “no snapshot – can't go back here” and “discarded by going back”
added where they apply; the picked step is `aria-selected`, one without a snapshot is `aria-disabled` and the running
one is `aria-current="step"`. The status pill reads “Live run”. The details are two sections headed “Captured before
step 4” and “Going back discards”; the note is named “Note for the agent when it runs step 4 again”, and the button
is `aria-busy` while a restore is on its way. A polite live region says “Step 4 picked. Going back discards 3 steps
and 1 file change.”, then “Went back to step 4 with your note.”; a failed restore shows an alert, “Couldn't go back
– try again”.

## Content

- Title each checkpoint with the step that starts there, as a verb phrase: “Run the test suite”.
- Use `detail` for the outcome people would look for (“3 failed: invoice totals off by a cent”), one line.
- List what was captured in people's words (“Conversation – 14 messages”); without `captured`, the workspace is described for you.
- Write a `placeholder` that invites a concrete change: the default is “What should it do differently? (optional)”.

## Do

- Mark the running step `status: "active"` and a failed one `"failed"`, so the timeline shows where it went wrong.
- Give each step its `files`, `tokens` and `cost`, so people can weigh what going back throws away.
- Return a promise from `restorer` (`onRestore`) when rewinding takes time – the button waits and reports a failure.

## Don't

- Don't offer a checkpoint the run can't return to – set `restorable: false` and it says “No snapshot”.
- Don't keep `status` running after the run stops; the component reads no clock, so `elapsed` and `status` are yours to update.
- Don't use it for undo inside a document – it's for runs.

## Example

```html
<tc-run-checkpoints id="run" heading="Move billing from MySQL to Postgres" status="running"></tc-run-checkpoints>

<script type="module">
  import "trenchcoat/run-checkpoints";
  import "trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.elapsed = 70000;
  run.checkpoints = [
    { id: "s1", title: "Read the billing schema", tool: "read_files", at: 0, tokens: 4200 },
    { id: "s2", title: "Run the test suite", tool: "run_tests", at: 41000, status: "failed", files: ["test_invoice.py"], tokens: 7300, cost: 0.04 },
  ];
  run.addEventListener("tc-restore", (e) => console.log(e.detail.checkpointId, e.detail.instruction));
</script>
```

```tsx
import { RunCheckpoints, type RunCheckpoint } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const checkpoints: RunCheckpoint[] = [
  { id: "s1", title: "Read the billing schema", tool: "read_files", at: 0, tokens: 4200 },
  { id: "s2", title: "Run the test suite", tool: "run_tests", at: 41000, status: "failed", files: ["test_invoice.py"], tokens: 7300, cost: 0.04 },
];

export function Rewind({ restore }: { restore: (id: string, note: string) => Promise<void> }) {
  return (
    <RunCheckpoints
      title="Move billing from MySQL to Postgres"
      checkpoints={checkpoints}
      status="running"
      elapsed={70_000}
      onRestore={(id, note) => restore(id, note)}
    />
  );
}
```
