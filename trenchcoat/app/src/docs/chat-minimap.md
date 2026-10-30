---
pattern: listbox
status: new
related: chat-history, conversation-branches, chat-composer, message-actions
---

## Overview

A slim rail beside a long chat with a tick for each message the person sent – longer ticks for longer messages – and
the one in view lit. Pointing at a tick shows the message with where it falls (“3 of 12”); a click scrolls the chat back
to it. It follows the chat's scrolling by itself: give it the element the chat scrolls in (`scrollRoot`) and each
message's element id (`target`, else `id`). With `manual` the page sets `current` and handles the jump.

## When to use

- Long conversations people come back to, where finding an earlier question means a lot of scrolling.
- Beside a transcript or an agent run with many turns, to show where you are in it.

## When not to use

- Moving between saved conversations – use `chat-history`.
- Choosing between alternative replies to one message – use `conversation-branches`.
- Short chats that fit on a screen or two – the rail adds nothing.

## Anatomy

1. **Rail** `.ui-cmm__rail` – the ticks, a listbox named by `label`
2. **Mark** `.ui-cmm__mark` – one message, an option; the one in view is selected
3. **Tick** `.ui-cmm__tick` – short, medium or long by the message's length; lit for the one in view
4. **Message** `.ui-cmm__tip` – the message and “3 of 12”, beside the rail on hover or with the keys

## Looks

Both looks are the bare rail, with no card. Ticks are muted; the one in view is longer and the accent colour. A page can set `--tc-cmm-pitch` (the space for each tick, 16 px), the three
lengths `--tc-cmm-sm`, `--tc-cmm-md` and `--tc-cmm-lg`, `--tc-cmm-tick` and `--tc-cmm-here`, and
`--tc-cmm-tip-width`. `tip-side="right"` shows the message on the rail's right, for a rail on the left of the chat.

## Keyboard

One tab stop: the rail.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous message and shows it |
| Home / End | Moves to the first or last message |
| Enter / Space | Jumps the chat to that message |
| Escape | Hides the message shown |

## Screen readers

It's a `listbox` named by `label` (“Your messages”), with the tick moved to as its active option. Each option is read
as the message, where it falls and whether it's in view: “Why was the March 14 transfer flagged?, 3 of 12, in view”.
The ticks and the hover bubble repeat that, so they're hidden.

## Content

- Pass only what the person wrote, not the replies – the rail is for finding your own questions.
- Keep each `id` stable as the chat grows, so the one in view stays lit.
- Give each message's element an id the rail can find (`target`), inside the scroller you pass.

## Do

- Put the rail beside the chat's scroller, centred on it, and pass that scroller as `scrollRoot`.
- Use `manual` when the chat is virtualised and messages aren't all in the page – scroll to them yourself on `tc-jump`.

## Don't

- Don't show it for a chat of a few messages.
- Don't add a tick per reply – the rail gets twice as long and half as useful.

## Example

```html
<div style="display: flex; gap: 8px">
  <div id="chat" style="height: 480px; overflow-y: auto"><!-- messages, each with an id --></div>
  <tc-chat-minimap id="rail" label="Your questions"></tc-chat-minimap>
</div>

<script type="module">
  import "trenchcoat/chat-minimap";
  import "trenchcoat/tokens.css";

  const rail = document.querySelector("#rail");
  rail.scrollRoot = document.querySelector("#chat");
  rail.items = [
    { id: "q1", text: "Summarise the open alerts on the account." },
    { id: "q2", text: "Why was the March 14 transfer flagged?" },
  ];
</script>
```

```tsx
import { useState } from "react";
import { ChatMinimap } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function QuestionRail({ chat }: { chat: HTMLElement | null }) {
  const [current, setCurrent] = useState<string | null>(null);
  return (
    <ChatMinimap
      label="Your questions"
      scrollRoot={chat}
      items={[
        { id: "q1", text: "Summarise the open alerts on the account." },
        { id: "q2", text: "Why was the March 14 transfer flagged?" },
      ]}
      current={current}
      onCurrentChange={setCurrent}
    />
  );
}
```
