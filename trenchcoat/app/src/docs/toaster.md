---
pattern: landmark
status: stable
related: notification-stack, approval-card, decision-inbox
---

## Overview

Short, calm confirmations that something happened – “Invoice sent”, “Conversation archived” – shown in a corner of
the page and gone after a few seconds. Put one `<tc-toaster>` near the root and call `toast()` from anywhere: plain,
success, error, info and loading toasts, toasts with an action such as Undo, and promise toasts whose spinner turns
into a check or a cross when the work finishes. Toasts stack with the newest in front; hovering or focusing the stack
fans it out into a list, and people can swipe a toast away or press Esc. Timers pause while someone is reading.

## When to use

- Confirming an action people took, when the result isn't visible where they are.
- Offering a short-lived undo after something reversible (“Archived · Undo”).
- Following background work that takes a few seconds – a deploy, an upload – with `toast.promise`.

## When not to use

- Notifications people need to come back to or act on later – use `notification-stack`.
- Anything people must not miss or must decide before work goes on – a toast can time out or be dismissed unread.
  Use `approval-card` or `decision-inbox`.

## Anatomy

1. **Stack** `.ui-ts__list` – the toasts in their corner, newest in front, two more peeking behind it
2. **Toast** `.ui-ts__toast` – one message, with its status icon; a timed one has a 1px line that runs down
3. **Text** `.ui-ts__text` – the title, and the description under it
4. **Action** `.ui-ts__action` – one button, such as Undo
5. **Close** `.ui-ts__close` – the × that shows on hover and focus (always on touch screens)

## Looks

Standard draws 18 px status icons, a muted description and a smaller action button. Clean uses 16 px icons, an info
icon in the accent colour, a darker description and a full-height action button. Both stack, fan out, swipe and
time out the same way.

## Keyboard

| Key | What it does |
|---|---|
| F8 | Moves focus to the newest toast (set `hotkey` to change the key, or `false` to turn it off) |
| Tab / Shift+Tab | Moves between toasts and their action and close buttons; the stack fans out while keyboard focus is in it |
| Escape | Dismisses the focused toast, or the newest one; focus moves to the next toast, or back to where it was before F8 |
| Enter / Space | Presses the focused action or close button |

## Screen readers

The toaster is a `region` named by `label` and its hotkey (“Notifications (F8)”). New and changed toasts are read
out from live regions: errors through an alert, everything else through a polite status, with the title and
description in one message. A promise toast is read again when it
settles. The close button is “Dismiss notification”. When a toast with focus closes – by its timer, an action or
Esc – focus goes to the next toast, to where it was before the hotkey, or to the region, never to the page body.

## Content

- Lead with what happened, in the past tense: “Invoice sent”, “File uploaded” – not “Success!”.
- Put the detail people may want – which invoice, how much – in the description, on one line if you can.
- Say what went wrong in an error and, if you can, what to do: “report-q3.pdf is larger than 25 MB.”
- Keep action labels to one verb: “Undo”, “View”, “Retry”.

## Do

- Use one toaster per page; add a second stack (`stack`, or `id` in React) only for a separate area such as a panel.
- Pass an `id` to update a toast in place instead of stacking a second one.
- Let toasts with an action stay until dismissed – the default – so people have time to use it (WCAG 2.2.1).

## Don't

- Don't show a toast for every small change that's already visible on screen.
- Don't put more than one action in a toast, or links people must follow.
- Don't use `toast.loading` without updating or dismissing it – it has no timer.
- Don't report an error in a form with a toast – show it next to the field, where people fix it.

## Example

```html
<tc-toaster position="bottom-right"></tc-toaster>

<script type="module">
  import { toast } from "trenchcoat/toaster";
  import "trenchcoat/tokens.css";

  document.querySelector("tc-toaster").duration = 5000;
  toast.success("Invoice sent", { description: "INV-2041 · $1,280.00 to Northwind Ltd." });
  toast("Conversation archived", {
    action: { label: "Undo", onClick: () => toast.success("Conversation restored") },
    onDismiss: (id) => console.log("closed", id),
  });
</script>
```

```tsx
import { Toaster, toast } from "trenchcoat/react";
import "trenchcoat/tokens.css";

function deploy() {
  return new Promise<string>((resolve) => setTimeout(() => resolve("v2.14.0"), 2000));
}

export function App() {
  return (
    <>
      <button
        type="button"
        onClick={() =>
          toast.promise(deploy, {
            loading: "Deploying to production…",
            success: (version) => `Deployed ${version}`,
            error: "Deploy failed",
          })
        }
      >
        Deploy
      </button>
      <Toaster position="bottom-right" />
    </>
  );
}
```
