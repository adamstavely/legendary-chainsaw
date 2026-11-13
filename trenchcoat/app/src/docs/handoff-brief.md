---
pattern: button
status: new
related: handoff, review-conflict, approval-card, setup-guide
---

## Overview

Work passing from one person to another for good – a case, an account, a review. The receiver gets three sections:
a summary of where it stands, the items still unresolved and the commitments already made. They acknowledge each
section separately, so the open items and promises can't be waved through with one click, and a progress line at
the top shows how far they are. If the work refers to material the receiver can't open, the handoff is blocked:
the card leads with exactly what's missing and a Request access button, and Accept stays off until access is
granted.

It also hands on an agent run that's still going. Given a `run`, the card is the sender's: it leads with the run's
status and the step it's on, says what the receiver takes over (its pending approvals, its notifications, stopping
it), asks whether the run should pause until they accept, and offers the people to hand it to and a note. The
sections show what the receiver will read, without Acknowledge. Hand off sends it and the card waits – “Waiting for
Priya to accept” – with Cancel handoff.

## When to use

- Reassigning work between people: a colleague going on leave, changing teams or handing over a shift.
- Anywhere a receiver must confirm they've read the open items and commitments before taking over.
- When access to the underlying material has to be checked before the handover completes.
- Handing an agent run that's still going to a teammate, with the context they need to pick it up (`run`).

## When not to use

- An agent handing a running task to a person and taking it back – use `handoff`.
- Two reviewers disagreeing about the same item – use `review-conflict`.
- Approving a single action – use `approval-card`.
- A checklist of set-up steps – use `setup-guide`.

## Anatomy

1. **State** `.ui-hob__state` – progress, the block and what's missing, or accepted
2. **Section** `.ui-hob__section` – summary, unresolved items or commitments made
3. **Acknowledge** `.ui-hob__ack` – the receiver's acknowledgement of one section
4. **Missing** `.ui-hob__missing` – the material the receiver can't open
5. **Accept** `.ui-hob__foot` – what's left to do, and Accept handoff (Hand off, for a run)
6. **Run** `.ui-hob__run-card` – an in-flight run: its status in a mark and a word, its title, the step it's on, and
   who started it when
7. **Takes over** `.ui-hob__takes` – what the receiver of a run takes over
8. **Receiver and choices** `.ui-hob__form` – Hand to, whether the run pauses until they accept, and a note

## Looks

Standard puts the header on the gray tray, the state and sections on a white card, and the Accept row back on the
tray. Clean is one white card with the Accept row as its last row under a hairline. Both colour the state – red
when blocked, green once accepted – and number each section, turning the number into a check when it's
acknowledged. A run sits in a well, its status a dot and a word – green and pulsing while running, amber while it
waits for input – and the waiting line after Hand off is quiet, with a turning mark.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Request access (when blocked), each section's Acknowledge, then Accept handoff |
| Enter / Space | Presses the focused button: acknowledges or un-acknowledges a section, requests access, accepts |

With a `run`, Tab reaches Hand to (a native select), the pause choice (two radio buttons – arrow keys switch them),
the note, then Hand off; after it's sent, Cancel handoff.

Accept handoff and Hand off are disabled until they can be pressed; the hint beside each says why. After accepting,
focus moves to the “Accepted” line; after handing off, to the “Waiting for …” line.

## Screen readers

The card is a `group` named by its heading. Each section is a `group` named by its title. Acknowledge is a toggle
button (`aria-pressed`) named with its section – “Acknowledge Unresolved items”, then “Acknowledged Unresolved
items”. The progress is a `progressbar` named “Sections acknowledged”, valued “1 of 3”. When blocked, the missing
material is a list named “What you can't open”. Accept is described by its hint (“Acknowledge 2 more sections to
accept.”, “Blocked until you can open everything it refers to.”). A polite status announces each acknowledgement
(“Summary acknowledged. 1 of 3.”), the access request, “Access granted. Nothing blocks the handoff.” and “Handoff
accepted. The work is yours now.”

With a run, the run is a `region` named “In-flight run”; its status is a word as well as a colour. The receiver, the
pause choice (a `fieldset` named “Until they accept”) and the note are labelled form controls, and Hand off is
described by its hint (“Priya Shah will be asked to accept. The run pauses until then.”). The status announces
“Handed off to Priya Shah. Waiting for Priya Shah to accept.” and “Handoff cancelled. The run is still yours.”

## Content

- Write the summary for someone who wasn't there: where it stands, what's at risk, what's next.
- Phrase unresolved items as things to do (“Confirm Northwind's Q3 capacity”), with `detail` for context.
- Put the deadline or the person a commitment was made to in `meta`.
- Name missing material as the receiver would find it, and say where the brief refers to it in `where`.
- Title a run with what it's doing (“Reconcile the Q3 ledger”) and give `step` in words, with its place if you know
  it (“Matching invoices to payments, step 3 of 5”).
- Change `takesOver` to what really moves with the run in your app – nothing it doesn't.

## Do

- Clear `missing` as soon as access is granted, so the block lifts without a reload.
- Record `acknowledged` with the handoff – it shows the receiver saw each section.
- Let the receiver acknowledge while blocked; only Accept waits for access.
- Keep the run's `status` and `step` current while the card is open – it's a live run.
- Default to pausing a run until the receiver accepts, so nothing happens with no one watching.

## Don't

- Don't collapse the three sections into one “I've read this”.
- Don't let the handoff complete with references the receiver can't open.
- Don't use it for a handoff the sender can take back mid-task – that's `handoff`. (Cancel handoff only withdraws
  an offer the receiver hasn't accepted yet.)
- Don't offer people who can't open what the run touches; leave them out of `people`.

## Example

```html
<tc-handoff-brief id="brief" heading="Q3 supplier review" summary="Two-thirds done; Northwind is the only supplier at risk."></tc-handoff-brief>

<script type="module">
  import "@adamstavely/trenchcoat/handoff-brief";
  import "@adamstavely/trenchcoat/tokens.css";

  const brief = document.querySelector("#brief");
  brief.from = { name: "Ana Ruiz" };
  brief.to = { name: "Sam Patel" };
  brief.unresolved = [{ id: "u1", text: "Confirm Northwind's Q3 capacity", meta: "Due Thu" }];
  brief.commitments = [{ id: "c1", text: "Send the risk summary to Procurement", meta: "Fri" }];
  brief.missing = [{ id: "contract", label: "Northwind supplier contract", where: "Unresolved item 1" }];
  brief.addEventListener("tc-access-request", (e) => console.log("request access to", e.detail.items));
  brief.addEventListener("tc-accept", () => console.log("accepted"));
</script>
```

```tsx
import { useState } from "react";
import { HandoffBrief, type HandoffBriefAccess, type HandoffBriefSection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReviewHandoff({ missing, onAccepted }: { missing: HandoffBriefAccess[]; onAccepted: () => void }) {
  const [acknowledged, setAcknowledged] = useState<HandoffBriefSection[]>([]);
  return (
    <HandoffBrief
      title="Q3 supplier review"
      from={{ name: "Ana Ruiz" }}
      to={{ name: "Sam Patel" }}
      summary="Two-thirds done; Northwind is the only supplier at risk."
      unresolved={[{ id: "u1", text: "Confirm Northwind's Q3 capacity", meta: "Due Thu" }]}
      commitments={[{ id: "c1", text: "Send the risk summary to Procurement", meta: "Fri" }]}
      missing={missing}
      acknowledged={acknowledged}
      onAcknowledgedChange={setAcknowledged}
      onAccept={onAccepted}
    />
  );
}

export function RunHandoff({ send }: { send: (to: string, pause: boolean, note: string) => void }) {
  const [to, setTo] = useState("");
  return (
    <HandoffBrief
      title="Hand on a running task"
      from={{ name: "Ana Ruiz" }}
      run={{ id: "recon-q3", title: "Reconcile the Q3 ledger", status: "running", step: "Matching invoices to payments" }}
      people={[
        { id: "sam", name: "Sam Patel" },
        { id: "priya", name: "Priya Shah" },
      ]}
      handoffTo={to}
      onHandoffToChange={setTo}
      summary="About 60% of invoices matched."
      onHandoff={(h) => send(h.to.name, h.pauseUntilAccepted, h.note)}
    />
  );
}
```
