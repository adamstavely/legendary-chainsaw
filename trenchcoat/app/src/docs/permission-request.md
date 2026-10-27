---
pattern: radio
status: stable
related: approval-card, tool-permissions, handoff, budget-guard
---

## Overview

An agent asks for one specific right before it acts: who is asking, what for (“Coder wants to push to main”), where,
why in the agent's own words, and exactly what will happen – the files, recipients or amounts. The person picks how
long the right holds – just once, for a while or always – and allows or denies it. The card then folds into one line
that says what was decided; a timed right shows the time left and a bar that drains until it expires, with Revoke to
take it back early. Destructive actions can never be allowed for always.

For the moment when waiting for the usual approval would do more harm, an emergency scope can be offered. Picking
it asks why it can't wait – required – and how urgent it is, from windows the app supplies. The request goes to the
app as a cancelable event carrying the justification; once granted, the card becomes a banner that says emergency
access is active with the time left as the app reports it, and when the app says it has ended, when the review is due.

## When to use

- An agent needs a right it doesn't have yet – pushing to a branch, sending email, spending money, deleting data.
- The person should see the concrete effect before saying yes, and decide how long the yes lasts.
- Inline in a run or a chat, where the request sits next to what the agent was doing.
- Emergency access, where the normal approval can't happen in time and the use must be justified, time-boxed and
  reviewed afterwards – list `"emergency"` in `scopes`.

## When not to use

- Reviewing a finished piece of work or a plan before it goes ahead – use `approval-card`.
- Setting up in advance which agent may use which tools – use `tool-permissions`.
- The agent is stuck and needs a person to take over – use `handoff`.
- Asking to spend past a limit on a running job – use `budget-guard`.

## Anatomy

1. **Header** `.tc-head` – a key icon and “Permission”, with the risk pill at the right
2. **Request** `.ui-pr__head` – the agent's avatar, “who wants to do what” and the target
3. **Reason** `.ui-pr__why` – why the agent needs it, in its own words
4. **Preview** `.ui-pr__preview` – what will happen, with a count and “N more”
5. **How long** `.ui-pr__scopes` – just once, for a while or always
6. **Answer** `.ui-pr__buttons` – Deny and Allow, with their keys

## Looks

Standard puts the header on a gray tray and the request on a white card below it, with the answer on the tray under that; the scope picker is a
segmented track with the chosen option raised in white, and the buttons are large. Clean is one quiet white card
with the header as its first row, smaller and lighter: the title is in the secondary colour with the names in strong text, the scopes are separate
chips and the buttons are medium. Both fold to the same one-line result, with a thin draining bar for a timed right. Emergency access sits in a white card on the tray in Standard and a hairline box in Clean; once granted, the result turns into a banner on the warning tone in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between “N more”, the chosen scope, Deny and Allow |
| ← / → | In the scopes: picks the previous or next one, wrapping round |
| Enter | Allows, when focus is in the card but not on a button; on a button, presses it |
| Escape | Denies, from anywhere in the card while it waits |
| Space / Enter | On a button: Deny, Allow, Revoke, Change or “N more” |
| ← / → / ↑ / ↓ | In the urgency windows (emergency access): picks the previous or next one, wrapping round |
| Enter (in the justification) | Starts a new line; it never sends the request |

After a decision, focus moves to the result's button (Revoke, Change, End now or Ask again); after Revoke it moves
back to Allow. Requesting emergency access without a justification moves focus to the justification field.

## Screen readers

While it waits, the card is a group named by the request (“Coder wants to push to main”) and described by the reason.
The preview is a section labelled by its heading. The scopes are a radiogroup named “How long”, each option a radio
with `aria-checked`; “N more” has `aria-expanded`. A status region says each outcome once – “Allowed for 1 hour:
Coder may push to main”, “Denied: Coder may not push to main”, “Access expired: Coder may not push to main” – and
the countdown's minutes are not announced. The risk is a visible word (“Risky”, “Destructive”) as well as a colour.

Emergency access is a group named by its note. The justification is a labelled, `aria-required` text area (“Why
can't this wait?”); asked for without one, it becomes `aria-invalid` and is described by “Say why it can't wait to
ask for emergency access”. The urgency windows are a radiogroup named “How urgent”. Granted, the status region says
“Emergency access active: Ops agent may restore the orders database”, and once ended, “Emergency access ended: … .
Review due by Fri 31 Oct”. The time left is on screen, not announced, as with the timed countdown.

## Content

- Write `action` in lower case so it reads after “wants to”: “push to main”, “send 3 emails”, “refund $240.00”.
- Let `reason` be the agent's own explanation in one or two sentences – what it found and why this step helps.
- Make preview rows concrete: file paths with “+48 −12”, recipients, amounts. Title the list with the count:
  “5 files will change”.
- Use `target` for where it happens (“acme/web”); without it, the agent's model shows there.
- For emergency access, name the urgency windows in your own policy's words through `urgencies` (`{ id, label,
  window }` – “Urgent”, “15 min”), and say what emergency access means where you work in `emergencyNote`.
- Pass `emergencyRemaining` as your server reports it (“3 h 12 min”), and `reviewDue` as a phrase that reads after
  “Review due”: “by Fri 31 Oct”, “within 5 working days”.

## Do

- Set `risk` honestly: `destructive` for anything that can't be undone – it removes “always” and turns Allow red.
- Listen to `tc-decision-change` and only let the agent act once it says allow; listen to `tc-expire` to stop it
  when a timed right runs out.
- Pass `now` when the page owns the clock (server time, a test, a replay); otherwise the element keeps its own.
- Listen to `tc-emergency-request` to log the justification, notify whoever must know and start the clock on your
  server; call `preventDefault()` to refuse it. Set `emergencyEnded` when your server ends the access.

## Don't

- Don't ask for several rights in one card – one request, one card.
- Don't leave the preview empty for a risky or destructive action; people need to see what changes.
- Don't offer `always` for anything that spends money or sends messages on someone's behalf.
- Don't offer the emergency scope by default – only where a real break-glass policy stands behind it, with a review.

## Example

```html
<tc-permission-request id="push" action="push to main" target="acme/web" risk="risky" duration="60"></tc-permission-request>

<script type="module">
  import "trenchcoat/permission-request";
  import "trenchcoat/tokens.css";

  const request = document.querySelector("#push");
  request.agent = { name: "Coder", model: "Claude Sonnet" };
  request.reason = "The checkout fix passed all 214 tests on the branch.";
  request.previewTitle = "2 files will change";
  request.preview = [
    { id: "1", label: "src/checkout/payment.ts", meta: "+48 −12" },
    { id: "2", label: "src/checkout/payment.test.ts", meta: "+96" },
  ];
  request.addEventListener("tc-decision-change", (e) => console.log(e.detail.decision));

  // Emergency access: offer it, hear the request, report the time left
  request.scopes = ["once", "timed", "emergency"];
  request.reviewDue = "within 5 working days";
  request.addEventListener("tc-emergency-request", (e) => {
    fetch("/api/break-glass", { method: "POST", body: JSON.stringify({ why: e.detail.justification, urgency: e.detail.urgency?.id }) });
  });
</script>
```

```tsx
import { PermissionRequest, type PermissionDecision, type PermissionEmergencyRequest } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PushRequest({
  onDecide,
  onEmergency,
  timeLeft,
}: {
  onDecide: (d: PermissionDecision | null) => void;
  onEmergency: (r: PermissionEmergencyRequest) => void;
  /** As the server reports it, e.g. "42 min" – empty until access is granted */
  timeLeft: string;
}) {
  return (
    <PermissionRequest
      agent={{ name: "Coder", model: "Claude Sonnet" }}
      action="push to main"
      target="acme/web"
      risk="risky"
      reason="The checkout fix passed all 214 tests on the branch."
      previewTitle="2 files will change"
      preview={[
        { id: "1", label: "src/checkout/payment.ts", meta: "+48 −12" },
        { id: "2", label: "src/checkout/payment.test.ts", meta: "+96" },
      ]}
      scopes={["once", "timed", "emergency"]}
      defaultScope="timed"
      duration={60}
      onDecisionChange={onDecide}
      onEmergencyRequest={onEmergency}
      emergencyRemaining={timeLeft}
      reviewDue="within 5 working days"
    />
  );
}
```
