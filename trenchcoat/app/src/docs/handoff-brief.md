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

## When to use

- Reassigning work between people: a colleague going on leave, changing teams or handing over a shift.
- Anywhere a receiver must confirm they've read the open items and commitments before taking over.
- When access to the underlying material has to be checked before the handover completes.

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
5. **Accept** `.ui-hob__foot` – what's left to do, and Accept handoff

## Looks

Standard puts the header on the gray tray, the state and sections on a white card, and the Accept row back on the
tray. Clean is one white card with the Accept row as its last row under a hairline. Both colour the state – red
when blocked, green once accepted – and number each section, turning the number into a check when it's
acknowledged.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Request access (when blocked), each section's Acknowledge, then Accept handoff |
| Enter / Space | Presses the focused button: acknowledges or un-acknowledges a section, requests access, accepts |

Accept handoff is disabled until it can be pressed; the hint beside it says why. After accepting, focus moves to the
“Accepted” line.

## Screen readers

The card is a `group` named by its heading. Each section is a `group` named by its title. Acknowledge is a toggle
button (`aria-pressed`) named with its section – “Acknowledge Unresolved items”, then “Acknowledged Unresolved
items”. The progress is a `progressbar` named “Sections acknowledged”, valued “1 of 3”. When blocked, the missing
material is a list named “What you can't open”. Accept is described by its hint (“Acknowledge 2 more sections to
accept.”, “Blocked until you can open everything it refers to.”). A polite status announces each acknowledgement
(“Summary acknowledged. 1 of 3.”), the access request, “Access granted. Nothing blocks the handoff.” and “Handoff
accepted. The work is yours now.”

## Content

- Write the summary for someone who wasn't there: where it stands, what's at risk, what's next.
- Phrase unresolved items as things to do (“Confirm Northwind's Q3 capacity”), with `detail` for context.
- Put the deadline or the person a commitment was made to in `meta`.
- Name missing material as the receiver would find it, and say where the brief refers to it in `where`.

## Do

- Clear `missing` as soon as access is granted, so the block lifts without a reload.
- Record `acknowledged` with the handoff – it shows the receiver saw each section.
- Let the receiver acknowledge while blocked; only Accept waits for access.

## Don't

- Don't collapse the three sections into one “I've read this”.
- Don't let the handoff complete with references the receiver can't open.
- Don't use it for a handoff the sender can take back mid-task – that's `handoff`.

## Example

```html
<tc-handoff-brief id="brief" heading="Q3 supplier review" summary="Two-thirds done; Northwind is the only supplier at risk."></tc-handoff-brief>

<script type="module">
  import "trenchcoat/handoff-brief";
  import "trenchcoat/tokens.css";

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
import { HandoffBrief, type HandoffBriefAccess, type HandoffBriefSection } from "trenchcoat/react";
import "trenchcoat/tokens.css";

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
```
