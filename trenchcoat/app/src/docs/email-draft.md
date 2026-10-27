---
pattern: listbox
status: stable
related: approval-card, writing-assistant, inline-diff
---

## Overview

An email an agent wrote, waiting for a person to check it before it goes out. The record it's about – a reference,
its status, an amount – sits above the email; the email itself has a recipient people can switch, an attachment they
can remove, tone variants (Friendly, Short, Formal) and text they can click to edit. Send and Discard fold the card
into a one-line receipt, with Undo where it can be honoured. People stay in charge of what goes out in their name
without rewriting it from scratch.

## When to use

- Agent-drafted messages about a record – a renewal, an overdue invoice, a support case – that a person sends.
- Where the main choices are who it goes to and how it sounds, with light edits on top.
- Review queues, where each draft is approved or discarded in a few seconds.

## When not to use

- Approving an action that isn't a message – use `approval-card`.
- Writing a message with the AI from a prompt, in a chat – use `writing-assistant`.
- Reviewing the AI's changes to existing text, word by word – use `inline-diff`.

## Anatomy

1. **Header** `.tc-head` – the record the email is about: its reference, account, status and amount
2. **Recipient** `.ui-ed__recipient` – who it goes to; opens the list of contacts
3. **Attachment** `.ui-ed__file` – the attached file, with × to remove it
4. **Text** `.ui-ed__body` – the email; click it (or the pencil) to edit
5. **Tones** `.ui-ed__tones` – the text variants and the Edit button
6. **Send and Discard** `.ui-ed__buttons` – send the email or throw the draft away

## Looks

Standard puts the record on a gray tray above a white card with the email, and Discard and Send sit in the card next
to the tones; the footer names the agent. Clean has no tray: one white card, the record at its head, then the email,
and a last row with the agent, its state, Discard and Send. Both fold to the same receipt.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the recipient, the attachment, the link, the tones, Edit, Discard and Send |
| ↓ / ↑ | On the recipient, opens the list (↑ starts at the last contact); in the list, moves between contacts |
| Home / End | In the list, jumps to the first or last contact |
| Enter / Space | In the list, picks the contact; elsewhere, presses the button |
| Escape | Closes the list and returns to the recipient; in the text field, stops editing and returns to Edit |
| ⌘ Enter / Ctrl Enter | In the text field, sends the email |

## Screen readers

The recipient is a button with `aria-haspopup="listbox"` and `aria-expanded`, named “to Jonas Weber (jonas@…)”;
the list is a `listbox` named “Recipient” whose options are `aria-selected`, with `aria-activedescendant` following
the arrow keys. The tones are a group named “Tone” of toggle buttons with `aria-pressed`; the pencil is “Edit text”
and the field “Email text”. The remove button is named “Remove Renewal-quote.pdf”. While sending, Send says
“Sending” and stays focused with `aria-disabled`. A status region says the result – “Email sent to Jonas Weber.”,
“Draft discarded.”, “Sending undone – the draft is back.” – and when a tone replaces someone's edits: “Your edits
were replaced by the Short text. Restore my edits brings them back.” A failed send shows an alert: “The email
couldn't be sent. Try again.”

## Content

- `reference`, `status` and `amount` describe the record, not the email: “INV-4471”, “6 days overdue”, “$12,450”.
- Name `agent` by its job: “Collections agent”.
- Label tones by how they sound – Friendly, Short, Formal – and keep them to three or four.
- Write each tone's `body` as a function of the contact, so switching recipient keeps the greeting right.
- Make the link label the action the reader takes: “Pay invoice”, “Review quote”.

## Do

- Pass `onSend` and return a promise – the card stays in its sending state until it settles, and a failure brings the
  draft back with an error.
- Pass `onUndo` only if you can really take a send back; otherwise the receipt offers no Undo for it.
- Keep `contacts` to the people who can sensibly receive this email.

## Don't

- Don't leave `onSend` unset in a product – sending is then simulated (with a console warning unless `demo` is set).
- Don't hide the recipient: who it goes to is the first thing people check.
- Don't write tone variants that change the facts; they should only change the voice.

## Example

```html
<tc-email-draft id="draft" reference="INV-4471" account="Lumen Health" amount="$12,450" status="6 days overdue"
  agent="Collections agent" attachment="INV-4471.pdf"></tc-email-draft>

<script type="module">
  import "trenchcoat/email-draft";
  import "trenchcoat/tokens.css";

  const draft = document.querySelector("#draft");
  draft.contacts = [{ name: "Ava Patel", email: "ava@lumenhealth.com" }];
  draft.tones = [{ id: "short", label: "Short", body: (c) => `Hi ${c.name}, invoice INV-4471 is 6 days overdue. Pay online:` }];
  draft.link = { label: "Pay invoice", href: "https://pay.example.com/INV-4471" };
  draft.onSend = (email) => fetch("/api/send", { method: "POST", body: JSON.stringify(email) });
  draft.addEventListener("tc-discard", () => console.log("discarded"));
</script>
```

```tsx
import { EmailDraft, type DraftContact, type DraftEmail } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const contacts: DraftContact[] = [{ name: "Ava Patel", email: "ava@lumenhealth.com" }];

export function OverdueReminder({ send }: { send: (email: DraftEmail) => Promise<void> }) {
  return (
    <EmailDraft
      reference="INV-4471"
      account="Lumen Health"
      amount="$12,450"
      status="6 days overdue"
      agent="Collections agent"
      contacts={contacts}
      attachment="INV-4471.pdf"
      tones={[{ id: "short", label: "Short", body: (c) => `Hi ${c.name}, invoice INV-4471 is 6 days overdue. Pay online:` }]}
      link={{ label: "Pay invoice", href: "https://pay.example.com/INV-4471" }}
      onSend={send}
      onDiscard={() => console.log("discarded")}
    />
  );
}
```
