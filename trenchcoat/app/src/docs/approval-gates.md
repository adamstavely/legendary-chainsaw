---
pattern: list
status: new
related: approval-card, decision-inbox, gate-config, review-center
---

## Overview

The approval requests of one agent run, as a stack of cards. The request to decide now is on top: who asks, what
kind of request it is, what exactly would change – a file change as a diff, or a call's arguments – and the steps of
the run it holds back. The other open requests peek out behind it, and a line says which one you're on (“1 of 2”).

Approve, Reject or Ask for changes – with a note – and the card drops into the Decided list below while the next one
rises. A strip above it says where things stand in words: “Waiting on you 2 · Decided 1/3 · Paused – 3 steps wait on
2 gates”. Decided rows fold open to show what was decided, the note, and the diff or arguments.

## When to use

- An agent run pauses at several points that need a person, and some of them hold up the steps after them.
- People should decide one request at a time, in order, with the next one waiting in view.
- Requests whose exact change matters – a file edit, a command's arguments, a message's recipients.

## When not to use

- A single request on its own, in a chat or a timeline – use `approval-card`.
- Quick yes/no questions from several agents, not tied to one run – use `decision-inbox`.
- Setting up which actions need a person in the first place – use `gate-config`.
- A risk-sorted queue across many runs, with flagged spans to review – use `review-center`.

## Anatomy

1. **Header** – the shared card header: the heading, the run, and a pill – “Waiting on you” or “All decided”
2. **Strip** `.ui-apg__stats` – waiting, decided out of all, and what the run is doing, in words
3. **Stack** `.ui-apg__stack` – the top request, with the open ones behind it `.ui-apg__peek`
4. **Request** `.ui-apg__gate` – who asks and when, the title, the reason, the diff or arguments, “Full context”, and
   what it holds `.ui-apg__holds`
5. **Note** `.ui-apg__note` – what should change, before Ask for changes is sent
6. **Buttons** `.ui-apg__actions` – Ask for changes, Reject and Approve
7. **Decided** `.ui-apg__decided` – a row per decision `.ui-apg__row`, folding open to `.ui-apg__detail`

## Looks

Standard puts the header on a gray tray above a white card holding the strip, the stack and the decided list. Clean
is one white card with the header as its first row. In both, the top request is a raised card with a hairline, and
up to two cards peek out under it.

Component tokens on `[data-ui="apg"]`: `--tc-approval-gates-peek` (6px) – how far each card behind peeks out;
`--tc-approval-gates-mark` (22px) – the round mark of a decided row; `--tc-approval-gates-spin` – the spinner's
turn. The diff and the arguments use tc-approval-card's styles and its `--tc-approval-card-code-max`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the top request's controls – the diff or arguments, Full context, Ask for changes, Reject, Approve – then to the Decided list |
| Enter / Space | On a button, presses it; on a decided row, folds it open or shut |
| ⌘ Enter / Ctrl Enter | In the note, sends Ask for changes |
| Escape | In the note, closes it and returns focus to Ask for changes |
| ↓ / ↑ | In the Decided list, moves to the next or previous row |
| Home / End | In the Decided list, moves to the first or last row |

After a decision, focus moves to the next request's card – not onto its Approve, so a second Enter can't approve it
by accident – or to the decided row when nothing else waits.

## Screen readers

The card is a `group` named by the heading. The top request is a `group` named by its title and described by its
reason; its diff and arguments are regions named “Changes: <path>” and “Arguments”, and changed lines start with
“Added:” or “Removed:”. Full context and the decided rows are disclosure buttons (`aria-expanded`, `aria-controls`).
The Decided list is a list named “Decided”. A status region says each decision and what comes next: “Approved: Move
the embargo forward a week. Next: Run the station ID migration.” While a decision is on its way the request is
`aria-busy`; if it fails, an alert says so and the request stays open.

## Content

- Write each title as the action in plain words – “Email 1,284 newsletter subscribers”, not the tool's name.
- Use `reason` for the consequence: who or what it changes, and when.
- List in `holds` the run's steps that wait on the request, by their names in the run.
- Put what led up to it in `context.before` and the files or systems it changes in `context.touches`.
- Mark `blocking` only on requests that stop the whole run, so the word keeps its weight.
- Order `gates` the way they should be decided; the first open one is on top.

## Do

- Return a promise from `onDecide` – the button shows a spinner, and on failure the request stays open with an error.
- Pass `now` when the page has a clock, so times read “6m ago”; without it they show the time of day.
- Keep the decided gates in `gates`, so people can see what they already let through.

## Don't

- Don't use it for one request – the strip and the stack only make sense with several.
- Don't put more than one file in a request's diff – split it into requests, or show the change elsewhere.
- Don't reorder `gates` while someone is deciding – the request under their pointer would change.

## Example

```html
<tc-approval-gates id="gates" run="Publish the 2026 field-survey report"></tc-approval-gates>

<script type="module">
  import "@adamstavely/trenchcoat/approval-gates";
  import "@adamstavely/trenchcoat/tokens.css";

  const gates = document.querySelector("#gates");
  gates.now = Date.UTC(2026, 10, 6, 14, 10);
  gates.gates = [
    {
      id: "embargo",
      title: "Move the embargo forward a week",
      agent: "Writer",
      kind: "File change",
      status: "open",
      holds: ["Build the report site", "Publish to the archive"],
      diff: {
        path: "survey-2026/report.config.ts",
        lines: [
          { kind: "remove", text: '  embargo: "2026-11-20T09:00Z",' },
          { kind: "add", text: '  embargo: "2026-11-13T09:00Z",' },
        ],
      },
    },
    { id: "migration", title: "Run the station ID migration", agent: "Analyst", kind: "Command", status: "open", args: { rows: 48210, dry_run: false } },
  ];
  gates.onDecide = ({ gate, decision, note }) => fetch(`/api/gates/${gate.id}`, { method: "POST", body: JSON.stringify({ decision, note }) });
  gates.addEventListener("tc-gates-change", (e) => console.log(e.detail.decision, e.detail.gate.title));
</script>
```

```tsx
import { ApprovalGates, type ApprovalGate } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
import { useState } from "react";

export function RunApprovals({ initial, send }: { initial: ApprovalGate[]; send: (id: string, decision: string, note: string) => Promise<void> }) {
  const [gates, setGates] = useState(initial);
  return (
    <ApprovalGates
      run="Publish the 2026 field-survey report"
      gates={gates}
      onGatesChange={(next) => setGates(next)}
      onDecide={({ gate, decision, note }) => send(gate.id, decision, note)}
    />
  );
}
```
