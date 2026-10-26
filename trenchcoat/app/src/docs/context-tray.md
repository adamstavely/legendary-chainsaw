---
pattern: toolbar
status: new
related: context-window, mention-picker, chat-composer, memory-panel
---

## Overview

What the model can see in a conversation, as chips: the files, people (@-mentions) and sources attached, each with
how many tokens it takes. A thin meter shows the total against the context window, with one segment per chip, so
people can see what's heavy and make room. They pin what must survive when the conversation is compacted and remove
what's no longer needed – and undo a removal from the tray or with ⌘Z. The tray warns as the window fills up.

## When to use

- Under or beside a chat composer, to show what's attached to the next message or the whole conversation.
- When context is limited and people need to choose what stays – long documents, logs, large sources.
- Agent runs that pull sources in on their own, so people can see and correct what was added.

## When not to use

- Only the total against the window, without the individual items – use `context-window`.
- Adding files, people or sources while typing – use `mention-picker`, then show the result here.
- Long-term facts the assistant remembers across conversations – use `memory-panel`.

## Anatomy

1. **Heading** `.ui-ctt__head` – the title, the number of chips and the total against the window
2. **Meter** `.ui-ctt__meter` – the window, one segment per chip plus the reserved part
3. **Chip** `.ui-ctt__chip` – one file, person or source with its token weight
4. **Pin** `.ui-ctt__pin` – the chip's icon; pins it to keep it through compaction
5. **Remove** `.ui-ctt__remove` – × takes the chip out of context
6. **Caption** `.ui-ctt__foot` – what's free or over, the last removal, and Undo

## Looks

Standard is a white card on a gray tray, with the caption and Undo in the tray below the card. Clean is one white
card with a hairline shadow, quieter chips and thinner icons, and the caption as its last row. In both, hovering a
chip lights its segment in the meter, and a removed chip folds away.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the chips (one stop), then on to Undo when it's there |
| → / ← | Moves to the next or previous button – each chip has Pin, then Remove |
| Home / End | Moves to the first or last button |
| Enter / Space | Pins or unpins the chip, or removes it |
| Delete / Backspace | Removes the chip in focus |
| ⌘Z / Ctrl Z | Puts back the last removed chip, while focus is in the tray |

When a chip is removed, focus moves to the same button on the next chip, else the one before, else Undo.

## Screen readers

The tray is a group named by its heading (“In context”). The total is read as “86.1K of 200K tokens used, 43
percent, 4 items”. The chips are a toolbar (“In context: 4 items”); each chip is a group named with its weight
(“billing-spec.md, 18.6K tokens, pinned”) holding a “Pin billing-spec.md” toggle button (`aria-pressed`) and a
“Remove billing-spec.md” button. A status region says what changed: “Removed stripe-webhooks.log. Undo is in the
tray”, “Put back stripe-webhooks.log”, “Pinned schema.prisma”, and “Context window is almost full” or “Context is
over the window” when the level changes. The meter itself is hidden; Undo carries `aria-keyshortcuts`.

## Content

- Use the name people know the item by: the file name, “@Priya Shah”, the page title – with the path or URL in `hint`.
- Set `reserved` to what the system prompt, tools and conversation already take, so the total is honest.
- Write `emptyText` as how to add something: the default is “Nothing in context yet – type @ to add files, people or
  sources”.
- Keep the heading short – it names the group and the toolbar.

## Do

- Use `kind` (`file`, `mention`, `source`) so each chip gets the right icon and meter colour.
- Pass the real context window as `limit`; without it the tray shows only the total.
- Keep the items in your own state through `tc-items-change` (React: `onChange`) when other parts of the app add them.

## Don't

- Don't round token counts yourself – the tray shortens them (“18.6K”).
- Don't turn off undo (`undoTimeout` 0) – removing a source by accident is easy and costly to redo.
- Don't show it when the model has no context limit people can act on.

## Example

```html
<tc-context-tray id="context" limit="200000" reserved="46000"></tc-context-tray>

<script type="module">
  import "trenchcoat/context-tray";
  import "trenchcoat/tokens.css";

  const tray = document.querySelector("#context");
  tray.items = [
    { id: "spec", label: "billing-spec.md", kind: "file", tokens: 18600, pinned: true, hint: "docs/billing-spec.md" },
    { id: "priya", label: "@Priya Shah", kind: "mention", tokens: 1200 },
  ];
  tray.addEventListener("tc-items-change", (e) => console.log(e.detail.change.type, e.detail.change.item.label));
</script>
```

```tsx
import { useState } from "react";
import { ContextTray, type ContextTrayEntry } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Attached() {
  const [items, setItems] = useState<ContextTrayEntry[]>([
    { id: "spec", label: "billing-spec.md", kind: "file", tokens: 18600, pinned: true },
    { id: "stripe", label: "Stripe API reference", kind: "source", tokens: 34800, hint: "stripe.com/docs/api" },
  ]);
  return <ContextTray items={items} limit={200_000} reserved={46_000} onChange={(next) => setItems(next)} />;
}
```
