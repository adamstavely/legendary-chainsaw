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

## When to use

- An agent needs a right it doesn't have yet – pushing to a branch, sending email, spending money, deleting data.
- The person should see the concrete effect before saying yes, and decide how long the yes lasts.
- Inline in a run or a chat, where the request sits next to what the agent was doing.

## When not to use

- Reviewing a finished piece of work or a plan before it goes ahead – use `approval-card`.
- Setting up in advance which agent may use which tools – use `tool-permissions`.
- The agent is stuck and needs a person to take over – use `handoff`.
- Asking to spend past a limit on a running job – use `budget-guard`.

## Anatomy

1. **Request** `.ui-pr__head` – the agent's avatar, “who wants to do what”, the target and the risk pill
2. **Reason** `.ui-pr__why` – why the agent needs it, in its own words
3. **Preview** `.ui-pr__preview` – what will happen, with a count and “N more”
4. **How long** `.ui-pr__scopes` – just once, for a while or always
5. **Answer** `.ui-pr__buttons` – Deny and Allow, with their keys

## Looks

Standard puts the request on a white card inside a gray tray, with the answer on the tray below; the scope picker is a
segmented track with the chosen option raised in white, and the buttons are large. Clean is one quiet white card,
smaller and lighter: the title is in the secondary colour with the names in strong text, the scopes are separate
chips and the buttons are medium. Both fold to the same one-line result, with a thin draining bar for a timed right.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between “N more”, the chosen scope, Deny and Allow |
| ← / → | In the scopes: picks the previous or next one, wrapping round |
| Enter | Allows, when focus is in the card but not on a button; on a button, presses it |
| Escape | Denies, from anywhere in the card while it waits |
| Space / Enter | On a button: Deny, Allow, Revoke, Change or “N more” |

After a decision, focus moves to the result's button (Revoke, Change or Ask again); after Revoke it moves back to
Allow.

## Screen readers

While it waits, the card is a group named by the request (“Coder wants to push to main”) and described by the reason.
The preview is a section labelled by its heading. The scopes are a radiogroup named “How long”, each option a radio
with `aria-checked`; “N more” has `aria-expanded`. A status region says each outcome once – “Allowed for 1 hour:
Coder may push to main”, “Denied: Coder may not push to main”, “Access expired: Coder may not push to main” – and
the countdown's minutes are not announced. The risk is a visible word (“Risky”, “Destructive”) as well as a colour.

## Content

- Write `action` in lower case so it reads after “wants to”: “push to main”, “send 3 emails”, “refund $240.00”.
- Let `reason` be the agent's own explanation in one or two sentences – what it found and why this step helps.
- Make preview rows concrete: file paths with “+48 −12”, recipients, amounts. Title the list with the count:
  “5 files will change”.
- Use `target` for where it happens (“acme/web”); without it, the agent's model shows there.

## Do

- Set `risk` honestly: `destructive` for anything that can't be undone – it removes “always” and turns Allow red.
- Listen to `tc-decision-change` and only let the agent act once it says allow; listen to `tc-expire` to stop it
  when a timed right runs out.
- Pass `now` when the page owns the clock (server time, a test, a replay); otherwise the element keeps its own.

## Don't

- Don't ask for several rights in one card – one request, one card.
- Don't leave the preview empty for a risky or destructive action; people need to see what changes.
- Don't offer `always` for anything that spends money or sends messages on someone's behalf.

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
</script>
```

```tsx
import { PermissionRequest, type PermissionDecision } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PushRequest({ onDecide }: { onDecide: (d: PermissionDecision | null) => void }) {
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
      defaultScope="timed"
      duration={60}
      onDecisionChange={onDecide}
    />
  );
}
```
