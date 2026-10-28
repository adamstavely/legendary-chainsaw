---
pattern: list
status: new
related: document-list, asset-list, secret-field, profile-header
---

## Overview

The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address. Each row shows:
- the value, masked until someone shows it – an email keeps its first letter and domain, a phone number its last two
  digits, an address its town;
- its role – Primary, Work, Backup, Linked to alias – and, for messaging, the service;
- when it was last used;
- how far it's verified – Verified, Unverified, Bounced, Dormant, Flagged, or states of your own.

A shown value can be copied, and the page can add its own actions to every row, such as Message or Call. The heading
counts how many are verified. Showing a value is one row at a time and fires a cancelable event, so a page can ask
for a reason or log it first.

## When to use

- A customer's or member's contact details on a support, account or onboarding page.
- Checking which ways to reach someone still work before sending something important.
- Any record where contact details are personal data and shouldn't sit on screen in full.

## When not to use

- Identity and record documents – use `document-list`.
- Vehicles, devices and other assets – use `asset-list`.
- One secret value, such as an API key – use `secret-field`.
- The top of a person's page, with their name and key facts – use `profile-header`.

## Anatomy

1. **Group** `.ui-cch__group-head` – the kind of contact point, with its icon
2. **Row** `.ui-cch__row` – one contact point
3. **Value** `.ui-cch__value` – the address, number, handle or postal address, masked until shown
4. **Role** `.ui-cch__role` – what it's for
5. **Last used** `.ui-cch__used` – when it was last used
6. **Note** `.ui-cch__note` – one line on why it bounced or is flagged
7. **State** `.ui-cch__pill` – the verification state as a tint, a mark and a word
8. **Show** `.ui-cch__reveal` – shows or masks the value again
9. **Copy** `.ui-cch__copy` – copies a shown value
10. **Actions** `.ui-cch__action` – the page's own actions

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight roles. Clean is one
white card with the header as its first row. The masking, pills and buttons are the same in both.

## Keyboard

The rows' buttons are one tab stop across every group; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row, across groups |
| ← / → | Moves between a row's Show, Copy and action buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the value, copies it, or runs the action |
| Tab | Leaves the list |

## Screen readers

Each group is a section named by its kind, holding a list described by “Up and down arrows move between contact
points, left and right between a contact point's buttons”. A masked value reads what's left of it, “at example.com,
hidden”, “ending 07, hidden”, “in Madrid, hidden”; a shown one reads in full. Show is a toggle button (`aria-pressed`)
labelled with the kind and role, “Show Email, Primary”. Copy is labelled “Copy Email, Primary”, then “Copied …” for a
moment. The page's actions are labelled with the row, “Message, Phone, Primary”. Showing, masking and copying are
confirmed in a polite status message.

## Content

- Give every contact point a `role`, so two emails can be told apart while masked.
- Write a `note` for every bounced or flagged contact point, saying what happened: “Bounced twice in May”.
- Keep page actions to one or two short verbs: Message, Call.
- Rename or add states with `states`, and groups with `kindLabels`.

## Do

- Keep `masked` on wherever contact details are personal data, and log reveals from `tc-revealed-change`.
- Use `tc-copy` to log copies, or call `preventDefault()` to stop them for people without access.
- Show Dormant and Bounced contact points rather than hiding them, so nobody relies on them by mistake.

## Don't

- Don't put the full value in `note` or `role`; that defeats the masking.
- Don't use the verification tones for anything but how far a contact point is verified.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Example

```html
<tc-contact-channels id="contact" heading="Contact points"></tc-contact-channels>

<script type="module">
  import "trenchcoat/contact-channels";
  import "trenchcoat/tokens.css";

  const contact = document.querySelector("#contact");
  contact.channels = [
    { id: "e1", kind: "email", value: "elena.ruiz@example.com", role: "Primary", state: "verified" },
    { id: "p1", kind: "phone", value: "+34 612 448 107", role: "Primary", state: "verified" },
  ];
  contact.actions = [{ id: "message", label: "Message" }];
  contact.addEventListener("tc-action", (e) => console.log(e.detail.action, e.detail.channel.id));
</script>
```

```tsx
import { ContactChannels, type ContactChannel } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const channels: ContactChannel[] = [
  { id: "e1", kind: "email", value: "elena.ruiz@example.com", role: "Primary", state: "verified" },
  { id: "e2", kind: "email", value: "e.ruiz@work.example", role: "Work", state: "bounced", note: "Bounced twice in May" },
];

export function Contact() {
  return <ContactChannels title="Contact points" channels={channels} onCopy={(channel) => console.log("copied", channel.id)} />;
}
```
