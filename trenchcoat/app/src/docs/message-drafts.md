---
pattern: tabs
status: new
related: email-draft, message-actions, chat-composer, recipe-card
---

## Overview

A short text message an assistant drafted, in two to four variants – Friendly, Brief, Formal – ready to send. Each
variant has a tab; the message is edited in place, with its length underneath in characters and in SMS messages. Copy
puts it on the clipboard, Send hands it to your app, and Open in Messages (optional) opens the phone's messaging app
with the text filled in. Once sent, the card folds into a receipt with Write another.

The SMS count follows the standard: 160 characters per message in the GSM alphabet (153 each once it's split), 70
once the text needs Unicode – an emoji, a curly quote, most non-Latin scripts (67 each once split).

## When to use

- The result of a "draft a text to…" tool in an assistant.
- Any short message where people pick a tone and send.

## When not to use

- Emails, with subjects, recipients and attachments – use [Email Draft](#/email-draft).
- Writing a message to the assistant itself – use [Chat Composer](#/chat-composer).

## Anatomy

1. **Tabs** `.ui-mdr__tabs` – one per variant, named by its tone
2. **Message** `.ui-mdr__text` – the draft, edited in place
3. **Length** `.ui-mdr__meta` – characters and SMS messages, and "(Unicode)" when it needs it
4. **Actions** `.ui-mdr__actions` – Copy, Open in Messages and Send
5. **Receipt** `.ui-mdr__sent` – after Send: who it went to, the message, and Write another

## Looks

Standard sets the header (the recipient and number) on a gray tray above a white card; Clean is one white card with
the header as its first row. The length turns to the warning colour once the message takes more than one SMS. Narrow,
the actions fill the width.

## Keyboard

| Key | Does |
| --- | --- |
| ← / → / Home / End on the tabs | Picks another variant |
| Tab | From the tabs into the message, then Copy, Open in Messages and Send |

## Screen readers

- The variants are a `tablist`; the message area is their `tabpanel`. The text area is named for its tone ("Brief
  message") and described by its length.
- Copying and sending are announced in a polite status line ("Copied: Brief", "Sent to Sam Okafor"). After sending,
  focus moves to Write another.

## Content

- Give each variant a one-word tone people can choose between.
- Keep drafts to one SMS when you can – the length line shows when they aren't.
- Give `to` in international form (+1 555 0142) so the sms: link works on every phone.

## Do

- Send it yourself in `tc-send` (or `onSend`) and set `status` back to `draft` if it fails.
- Keep `variants` in your store when edits should survive (`tc-variants-change`).

## Don't

- Send without the person pressing Send.
- Offer more than four variants – the extra ones aren't shown.

## Example

```html
<tc-message-drafts recipient="Sam Okafor" to="+1 555 0142" open-link></tc-message-drafts>
<script type="module">
  const drafts = document.querySelector("tc-message-drafts");
  drafts.variants = [
    { id: "friendly", tone: "Friendly", text: "Hi Sam! We've moved the audit review to Thursday at 2pm – does that still work?" },
    { id: "brief", tone: "Brief", text: "Audit review moved to Thu 2pm. OK for you?" },
  ];
  drafts.addEventListener("tc-send", (e) => console.log("Send", e.detail.text, "to", e.detail.to));
</script>
```

```tsx
import { useState } from "react";
import { MessageDrafts, type MessageVariant } from "@adamstavely/trenchcoat/react";

export function Reschedule({ drafts }: { drafts: MessageVariant[] }) {
  const [selected, setSelected] = useState(drafts[0]?.id);
  return (
    <MessageDrafts
      recipient="Sam Okafor"
      to="+1 555 0142"
      defaultVariants={drafts}
      selected={selected}
      onSelectedChange={setSelected}
      onSend={({ text, to }) => console.log("Send", text, "to", to)}
    />
  );
}
```
