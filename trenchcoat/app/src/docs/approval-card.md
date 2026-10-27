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

For decisions that need more than a glance, four optional properties add the reasoning behind the request: `why`
(“Why you're seeing this” – the rule or threshold that made the agent ask), `consequences` (“If you approve” and “If
you deny”, side by side), `editableDetails` (an “Edit arguments” mode that turns the text details into fields, so
people can fix a recipient or an amount before approving) and `evidence` (chips that open the sources the request
rests on). Left unset, the card looks exactly as it always has.

## When to use

- An agent is about to send, pay, delete or publish, and a person must say yes first.
- Inside a chat or a run's timeline, where the decision belongs next to what led up to it.
- Requests that shouldn't wait forever – set `expires-in` so an unanswered one is denied.
- High-stakes requests where people need the reason, the consequences or the sources – add `why`, `consequences`
  and `evidence`.
- Actions whose arguments a person may correct rather than deny – set `editable-details`.

## When not to use

- Granting an agent access to a tool, scope or account – use `permission-request`.
- Setting in advance what the agent may do without asking – use `autonomy-dial`.
- Handing a task to a person to do, not just approve – use `handoff`.
- Showing a tool call that has already run – use `tool-call-card`.

## Anatomy

1. **Label** `.ui-ap__label` – where the request comes from, e.g. “Step 4 · gmail.send”
2. **Header** – the shared card header: a boxed icon, the action, a line of context and the risk badge
3. **Preview** `.ui-ap__preview` – custom content and the key-value details
4. **Always allow** `.ui-ap__always` – approve this action from now on
5. **Countdown** `.ui-ap__timer` – the time left, and Stop
6. **Buttons** `.ui-ap__actions` – Edit, Deny and Approve, with their shortcuts

## Looks

Standard puts the header on a gray tray, above a white card with the preview and “Always allow”, and the countdown
and buttons on the tray below it. In Standard the preview sits in its own gray box. Clean is one white card with the header as its first row: the preview
as plain rows under a hairline, then “Always allow” and the countdown, with Edit, Deny and Approve at the bottom. `actions="tray"` or `actions="card"` moves the buttons
in either look.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the preview's controls, “Always allow”, Stop, Edit, Deny and Approve |
| ⌘ Enter / Ctrl Enter | Approves, from anywhere in the card |
| Escape | Denies, from anywhere in the card – except inside the preview content or a text field |
| Space | On “Always allow”, ticks or clears it |
| Enter / Space | On “Edit arguments”, turns the text details into fields and focuses the first; on “Done”, turns them back |
| Escape | In an argument field, leaves “Edit arguments” (keeping the edits) and returns focus to its button – it doesn't deny |

## Screen readers

The card is a `group` named by the action and described by its context line and, while a countdown runs, by “Expires
in 42 seconds unless approved. The timer pauses while the card is hovered or focused.” Deny and Approve carry
`aria-keyshortcuts`. The risk reads as “High risk”. A status region says the decision – “Approved: Send campaign
email”, “Denied: …” or “Expired: …” – and, once only, “20 seconds left to decide: Send campaign email. Stop the timer
to keep it open.” While an approval is on its way the card is `aria-busy`; if it fails, an alert says
`errorLabel`. After a decision focus moves to the resolved row, which then names the group.

With `why`, the card is also described by the reason line. Each argument field is named by its row's label (“To”,
“Amount”), and an edited row says “Edited”. The evidence chips are a list labelled “Evidence”: links when they have an
`href` (opening in a new tab), buttons otherwise.

## Content

- Write the heading as the action in plain words: “Send campaign email”, not the tool's name.
- Use `description` for the consequence: who is affected and how many.
- Put what someone must check in `details` – To, Subject, Amount, When – not everything the agent knows.
- Match `risk` to the harm if it goes wrong: `high` for what reaches customers or money, or can't be undone.
- Write `why` as the trigger, not the action again: “Refunds over $1,000 need a person – this one is $2,400.”
- Write each consequence as what actually happens next, including what can't be undone: “The email goes to 2,412
  contacts now. It can't be recalled.” – and for deny, what the agent does instead.
- Label evidence chips by what they are (“Invoice INV-2291”), with the type or age in `detail`.

## Do

- Return a promise from `onApprove` – the card shows a spinner, and on failure stays pending with an error so people
  can try again.
- Give people enough time: a countdown under 30 seconds rarely is, and keep Stop available.
- Offer `editable` when the agent's draft can be changed before it runs.
- Use `editable-details` for short values a person might correct – a recipient, an amount, a date – and set
  `editable: false` on rows that must not change.
- Handle `tc-details-change` and run the action with the edited arguments, not the agent's originals.

## Don't

- Don't ask for approval of harmless actions – people learn to click Approve without reading.
- Don't hide the risk badge on high-risk actions to make the card calmer.
- Don't turn off `allow-stop-timer` unless the deadline is real and can't be extended.
- Don't fill `why` and `consequences` with boilerplate on every card – they lose their weight.

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
  card.why = "Campaigns to more than 500 contacts need a person.";
  card.consequences = { approve: "The email goes out now and can't be recalled.", deny: "Nothing is sent." };
  card.evidence = [{ label: "Draft v3", detail: "Doc", href: "/drafts/oct" }];
  card.editableDetails = true;
  card.onApprove = ({ always }) => fetch("/api/campaigns/oct/send", { method: "POST", body: JSON.stringify({ always, details: card.details }) });
  card.addEventListener("tc-details-change", (e) => console.log(e.detail.label, e.detail.value));
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
      why="Campaigns to more than 500 contacts need a person."
      consequences={{ approve: "The email goes out now and can't be recalled.", deny: "Nothing is sent." }}
      evidence={[{ label: "Draft v3", detail: "Doc", href: "/drafts/oct" }]}
      editableDetails
      details={[
        { label: "Subject", value: "What's new in October" },
        { label: "Scheduled", value: "Today, 14:00", editable: false },
      ]}
      expiresIn={45}
      onApprove={({ always }) => send(always)}
      onDeny={({ reason }) => console.log(reason)}
    />
  );
}
```
