---
pattern: toolbar
status: new
related: message-actions, chat-composer, notifications, comment-thread
---

## Overview

The quiet row under a message the person sent. It says where the message is – a clock while it's sending, one tick once
sent, two once delivered, two in the accent once read, and a red alert with Not sent when it failed – and when it was
sent, as a relative time that keeps itself fresh. After a dot come the controls: Copy, Send again and Branch into a new
chat, and Edit if the page asks for it. Like `message-actions`, the controls wait until the message is hovered or
focused; the receipt and time always show, and a failed message keeps its Retry button in view.

## When to use

- Under the person's own messages in a chat with an assistant or with other people.
- Where people need to know a message got through, and to resend or fork the conversation from it.

## When not to use

- Under an assistant's answer – copy, regenerate, feedback and read aloud: use `message-actions`.
- A list of messages or alerts with read state: use `notifications`.
- Replies and resolution on a comment: use `comment-thread`.

## Anatomy

1. **Row** `.ui-mst__row` – the whole line, at the end for one's own message (`align="start"` for the other side)
2. **Receipt** `.ui-mst__receipt` – the mark `.ui-mst__mark`; for sending and failed also the word `.ui-mst__word`
3. **Time** `.ui-mst__time` – the relative time in a `<time datetime>`, the full date in its tooltip
4. **Dot** `.ui-mst__dot` – between the time and the controls
5. **Controls** `.ui-mst__bar` – the toolbar of `.ui-mst__btn` icon buttons, each with a tooltip `.ui-mst__tip`

## Looks

Standard draws the icons at a heavier stroke on small buttons with the dark tooltip. Clean uses a thinner stroke,
bigger hit targets and the white popover tooltip. A page can set `--tc-mst-btn`, the buttons' size. Read uses
`--tc-accent-text`, failed `--tc-status-danger-fg`.

## Keyboard

The controls are one tab stop.

| Key | What it does |
|---|---|
| Tab | Moves into the controls, on the last one used |
| Left / Right | Moves between the controls (wrapping) |
| Home / End | Moves to the first or last control |
| Enter / Space | Uses the control |
| Escape | Hides the tooltip without moving focus |

## Screen readers

The receipt is read as a word – Sending…, Sent, Delivered, Read or Not sent – and a change of receipt is announced
politely, as are Copied, Sending again… and Couldn't send. The time is a `<time>` element read as shown. The controls
are a `toolbar` named Message controls, each button named by its tooltip; a failed message's Retry is named by its
visible word. Below 220px the time steps out of sight but is still read.

## Content

Pass `time` as a Date, ISO string or epoch ms; it shows as Just now, 2 min ago, 3 hr ago, Yesterday or a short date.
Pass `text` so Copy has something to copy. Keep `receipt` in step with the server: sending until it's acknowledged,
failed with a way to retry. `labels` renames every word, including the time phrases, and `locale` sets the date format.

## Do

- Set `receipt` to failed when a send fails, and give `onRetry` a promise so the arrow spins until it settles.
- Wrap the message and this row in `data-ui-message`, so hovering the bubble shows the controls.
- Show Read only when the other side has really read it.

## Don't

- Don't use read receipts where people haven't agreed to share them.
- Don't add controls that act on someone else's message here: this row is for the person's own.

## Example

```html
<div data-ui-message>
  <p class="bubble">Can you chart last spring's tide readings?</p>
  <tc-message-status id="status" receipt="read" text="Can you chart last spring's tide readings?"></tc-message-status>
</div>

<script type="module">
  import "trenchcoat/message-status";
  import "trenchcoat/tokens.css";

  const status = document.querySelector("#status");
  status.time = new Date();
  status.addEventListener("tc-retry", () => {
    status.receipt = "sending";
  });
  status.addEventListener("tc-branch", () => console.log("Start a new chat from here"));
</script>
```

```tsx
import { MessageStatus, type MessageReceipt } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Sent({ text, sentAt, receipt, resend }: { text: string; sentAt: number; receipt: MessageReceipt; resend: () => Promise<void> }) {
  return (
    <div data-ui-message="">
      <p>{text}</p>
      <MessageStatus receipt={receipt} time={sentAt} text={text} onRetry={resend} onBranch={() => console.log("branch")} />
    </div>
  );
}
```
