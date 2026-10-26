---
pattern: none
status: react-twin
related: permission-request, autonomy-dial, handoff, tool-call-card
---

## Overview

An agent asks before it does something consequential. The card names the action, shows its risk and a preview –
recipients, key-value details, anything that helps someone judge it – and offers Approve and Deny, with ⌘↵ and Esc
as shortcuts. An optional countdown denies the request when time runs out; it pauses while people hover or focus the
card, and Stop turns it off. Once decided, the card folds into a compact row that says what happened and when, so a
run's history stays readable.

## When to use

- An agent is about to send, pay, delete or publish, and a person must say yes first.
- Inside a chat or a run's timeline, where the decision belongs next to what led up to it.
- Requests that shouldn't wait forever – set `expires-in` so an unanswered one is denied.

## When not to use

- Granting an agent access to a tool, scope or account – use `permission-request`.
- Setting in advance what the agent may do without asking – use `autonomy-dial`.
- Handing a task to a person to do, not just approve – use `handoff`.
- Showing a tool call that has already run – use `tool-call-card`.

## Anatomy

1. **Label** `.ui-ap__label` – where the request comes from, e.g. “Step 4 · gmail.send”
2. **Header** `.ui-ap__head` – the icon, the action, a line of context and the risk badge
3. **Preview** `.ui-ap__preview` – custom content and the key-value details
4. **Always allow** `.ui-ap__always` – approve this action from now on
5. **Countdown** `.ui-ap__timer` – the time left, and Stop
6. **Buttons** `.ui-ap__actions` – Edit, Deny and Approve, with their shortcuts

## Looks

Standard is a white card – header, preview, “Always allow” – on a gray tray, with the countdown and buttons on the
tray below it. In Standard the preview sits in its own gray box. Clean is one white card: the preview
as plain rows under a hairline, then “Always allow” and the countdown, with Edit, Deny and Approve at the bottom. `actions="tray"` or `actions="card"` moves the buttons
in either look.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the preview's controls, “Always allow”, Stop, Edit, Deny and Approve |
| ⌘ Enter / Ctrl Enter | Approves, from anywhere in the card |
| Escape | Denies, from anywhere in the card – except inside the preview content or a text field |
| Space | On “Always allow”, ticks or clears it |

## Screen readers

The card is a `group` named by the action and described by its context line and, while a countdown runs, by “Expires
in 42 seconds unless approved. The timer pauses while the card is hovered or focused.” Deny and Approve carry
`aria-keyshortcuts`. The risk reads as “High risk”. A status region says the decision – “Approved: Send campaign
email”, “Denied: …” or “Expired: …” – and, once only, “20 seconds left to decide: Send campaign email. Stop the timer
to keep it open.” While an approval is on its way the card is `aria-busy`; if it fails, an alert says
`errorLabel`. After a decision focus moves to the resolved row, which then names the group.

## Content

- Write the heading as the action in plain words: “Send campaign email”, not the tool's name.
- Use `description` for the consequence: who is affected and how many.
- Put what someone must check in `details` – To, Subject, Amount, When – not everything the agent knows.
- Match `risk` to the harm if it goes wrong: `high` for what reaches customers or money, or can't be undone.

## Do

- Return a promise from `onApprove` – the card shows a spinner, and on failure stays pending with an error so people
  can try again.
- Give people enough time: a countdown under 30 seconds rarely is, and keep Stop available.
- Offer `editable` when the agent's draft can be changed before it runs.

## Don't

- Don't ask for approval of harmless actions – people learn to click Approve without reading.
- Don't hide the risk badge on high-risk actions to make the card calmer.
- Don't turn off `allow-stop-timer` unless the deadline is real and can't be extended.

## Example

```html
<tc-approval-card id="ask" heading="Send campaign email" risk="high" expires-in="45"></tc-approval-card>

<script type="module">
  import "trenchcoat/approval-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#ask");
  card.description = "The October product update goes to 2,412 customers.";
  card.details = [
    { label: "Subject", value: "What's new in October" },
    { label: "Scheduled", value: "Today, 14:00" },
  ];
  card.onApprove = ({ always }) => fetch("/api/campaigns/oct/send", { method: "POST", body: JSON.stringify({ always }) });
  card.addEventListener("tc-deny", (e) => console.log(e.detail.reason));
</script>
```

```tsx
import { ApprovalCard } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SendCampaign({ send }: { send: (always: boolean) => Promise<void> }) {
  return (
    <ApprovalCard
      title="Send campaign email"
      description="The October product update goes to 2,412 customers."
      risk="high"
      details={[
        { label: "Subject", value: "What's new in October" },
        { label: "Scheduled", value: "Today, 14:00" },
      ]}
      expiresIn={45}
      onApprove={({ always }) => send(always)}
      onDeny={({ reason }) => console.log(reason)}
    />
  );
}
```
