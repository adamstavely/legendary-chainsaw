---
pattern: listbox
status: new
related: gate-config, run-checkpoints, delegate-board, trigger-builder
---

## Overview

Edits an agent's workflow, phase by phase: what starts a run, what comes in, what the agent looks up, what it works
out and who signs off before anything leaves. People add steps to a phase, reorder them by dragging or from the
keyboard, and set each one up below the board – its title, its type, instructions for the agent and what happens if it
fails. A review step pauses the run for a person and carries its own gate. Saved versions are listed with the current
one marked, and a dry run shows which steps would run, which are skipped and where a gate pauses – before anything
runs for real. It is an editor of phases and steps, not a free-form canvas.

## When to use

- Building or changing the steps an agent runs for a recurring job – refunds, triage, report drafting.
- Putting human review where the team can see and change it, inside the workflow it guards.
- Letting people check a change with a dry run before they save it as a new version.

## When not to use

- Setting up one review gate on its own – use `gate-config`.
- Going back to a point in a run that already happened – use `run-checkpoints`.
- Handing tasks to agents – use `delegate-board`.
- Setting only when an automation starts – use `trigger-builder`.

## Anatomy

1. **Header** `.ui-pb__head` – the name, the version and Edited, the step and gate counts, Versions and Dry run
2. **Phase** `.ui-pb__phase` – a column (or a row, when narrow) with its number, name, line and Add step
3. **Step** `.ui-pb__step` – one step: its grip, type icon, title, type and the dry run's mark
4. **Dry run** `.ui-pb__dry` – the result in one line, or that it's out of date
5. **Settings** `.ui-pb__panel` – the picked step's title, type, instructions and what happens if it fails
6. **Hints** `.ui-pb__hints` – the keys for moving and reordering steps

## Looks

Standard is a white card on a gray tray: each phase sits on a gray well with white step cards, and the keyboard hints
sit in the tray under the card. Clean is one white card: the phases are outlined with a hairline, the step cards are
lighter, and the hints are the card's last row. From about 860 px the phases sit side by side with an arrow from each
to the next; narrower, they stack, joined by a rail. Below 480 px the labels sit above their fields and the hints go.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the steps once, on the step last used; then Add step, the settings and the header buttons |
| ↓ / ↑ | Moves to the next or previous step, across phases, and picks it |
| → / ← | Moves to the first step of the next or previous phase that has steps |
| Home / End | Moves to the first or last step |
| Alt + ↑ / ↓ | Moves the step earlier or later; past the first or last step of a phase it goes into the neighbouring phase |
| Alt + ← / → | Moves the step to the previous or next phase, keeping its place in the list where it can |
| Enter | Picks the step and moves focus to its title in the settings |
| Space | Picks the step |
| Delete / Backspace | Removes the step; focus moves to the next step, else the one before, else Add step |
| Escape | In the settings: back to the step on the board |
| ← / → / Home / End | In the settings' toolbar: between Move earlier, Move later and Remove |

A step moves only into a phase its type is allowed in; trigger types stay in Trigger. Pointer users drag a step by
its card (on touch, by its grip) and a line shows where it will land.

## Screen readers

The host is a region named by the heading. Each phase is a section named by its title, and its steps are a listbox
named by the same title; each step is an option, `aria-selected` when it's the one being set up, with its number read
first (“Step 3: Check the order”) and described by the keyboard hints. The settings are a section named “Step 3 ·
Intake”; Move earlier, Move later and Remove form a toolbar named “Step”, and a move that isn't possible is
`aria-disabled`. A review step's gate is a group named “Lead signs off – review gate”. A status region reports
each change: “Added Agent task to Analysis, step 2 of 2”, “Moved Read the request to Intake, step 2 of 2”,
“Removed Check the order”, “Can't move Request arrives – When an event happens steps only go in Trigger”, and the
dry run's result, “Dry run: 4 of 6 steps run · 1 skipped · pauses at Lead signs off”.

## Content

- Title steps as what the agent does, starting with a verb: “Look up the refund policy”, “Draft the reply”.
- Phase labels are short nouns; the line under each says what happens there.
- Name review steps after who decides: “Team lead signs off”.
- Version notes say what changed, not who changed it – the meta line carries the date and the author.

## Do

- Answer `tc-dry-run` from the server with the same rules the real run uses, and set `dryRun` with one entry per
  step it reached. Steps without an entry show as not reached.
- Save a new version when people are done – the element marks the playbook Edited until `currentVersion` changes.
- Pass `gateConditions`, `gateReviewers`, `gateViews` and `gateActions` so review steps use your product's words.

## Don't

- Don't use it for a branching graph or free placement – it orders steps within phases, nothing more.
- Don't run anything on `tc-dry-run` that sends, pays or writes – it's a rehearsal.
- Don't restrict types to phases without saying why in the type's label; people only learn the rule when a move fails.

## Example

```html
<tc-playbook-canvas id="playbook" heading="Refund requests" current-version="v7"></tc-playbook-canvas>

<script type="module">
  import "trenchcoat/playbook-canvas";
  import "trenchcoat/tokens.css";

  const playbook = document.querySelector("#playbook");
  playbook.value = {
    steps: [
      { id: "arrives", phase: "trigger", type: "event", title: "A refund request arrives" },
      { id: "decide", phase: "analysis", type: "agent", title: "Decide: full, partial or no refund" },
      { id: "gate", phase: "review", type: "review", title: "Team lead signs off" },
    ],
  };
  playbook.versions = [{ id: "v7", label: "v7", note: "Look up the policy first", meta: "Oct 24 · Maya Chen" }];
  playbook.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
  playbook.addEventListener("tc-dry-run", async (e) => {
    playbook.dryRun = await fetch("/playbooks/dry-run", { method: "POST", body: JSON.stringify(e.detail.value) }).then((r) => r.json());
  });
</script>
```

```tsx
import { useState } from "react";
import { PlaybookCanvas, type Playbook, type PlaybookDryRun } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function RefundPlaybook({ initial, dryRunOn }: { initial: Playbook; dryRunOn: (p: Playbook) => Promise<PlaybookDryRun> }) {
  const [value, setValue] = useState<Playbook>(initial);
  const [dryRun, setDryRun] = useState<PlaybookDryRun | null>(null);
  return (
    <PlaybookCanvas
      title="Refund requests"
      value={value}
      onChange={setValue}
      dryRun={dryRun}
      onDryRun={(p) => dryRunOn(p).then(setDryRun)}
      onDryRunClear={() => setDryRun(null)}
    />
  );
}
```
