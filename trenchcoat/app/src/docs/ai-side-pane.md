---
pattern: disclosure
status: new
related: chat-composer, ai-answer, claim-answer, chat-history, prompt-starters, reflection-gate, message-actions
---

## Overview

An assistant docked beside a page, holding a conversation about what's on it. The element's children are the page;
the pane sits beside them with a header (title, the open conversation, New chat, History, Collapse, Close), the
conversation and the chat composer with its toolbar – model, settings, prompts and the page-context chip. Answers are
`ai-answer`, or `claim-answer` when they come as claims, each with one row of message actions; answers the app marks
high-stakes get a `reflection-gate`. Before the first message, `prompt-starters` offer suggestions from the page.
Drag the pane's edge to resize it, collapse it to a narrow rail, or close it to a floating "Ask AI" button; below its
breakpoint it becomes a sheet over the page.

## When to use

- An assistant that works on what the person is looking at: a report, a document, a record, a dashboard.
- Products where the assistant should stay beside the work instead of replacing it.

## When not to use

- A whole assistant app with its own sidebar and projects – use the `chat-composer` in a full-page layout.
- A single answer on a page, with no conversation – use `ai-answer` or `claim-answer`.
- A list of past chats on its own – use `chat-history`.

## Anatomy

1. **Page** – the element's children, beside the pane
2. **Edge** `.ui-sp__handle` – drag it or use the arrow keys to resize the pane
3. **Pane** `.ui-sp__pane` – the header, the conversation and the composer; a sheet below the breakpoint
4. **Message** `.ui-sp__msg` – the person's bubble, or an answer with its actions, gate or error
5. **History** `.ui-sp__history` – past conversations, in place of the conversation
6. **Composer** `.ui-sp__composer` – the chat composer with its toolbar and the disclaimer
7. **Rail** `.ui-sp__rail` – the collapsed pane: Expand and New chat
8. **Launcher** `.ui-sp__launcher` – "Ask AI" while the pane is closed

## Looks

Standard puts the header on the gray tray with the conversation and composer on a white card, and a hairline between
page and pane. Clean is one white surface: the header is its first row, with a hairline from the page. Every part
inside – answers, gate, history, composer – takes the same look.

## Keyboard

| Key | What it does |
|---|---|
| ⌘. / Ctrl+. | Opens the pane and focuses the composer; pressed inside it, closes it (`shortcut` changes it) |
| ← / → on the edge | Widens or narrows the pane by 16 px (Shift: 64 px) |
| Home / End on the edge | The narrowest or widest width |
| Enter on the edge | Back to `defaultWidth` |
| Escape | Closes History; as a sheet, closes the pane |
| Tab | As a sheet, stays inside the pane (it wraps) |

Focus moves into the composer when the pane opens and goes back to where it was (or the launcher) when it closes.
Collapsing focuses Expand; History's search takes focus and gives it back to History.

## Screen readers

Docked, the pane is a complementary landmark named by its title; as a sheet it is a modal dialog, and the page behind
it is inert. The edge is a vertical separator whose value is the width ("400 pixels wide"). Each message is an article
named "You" or "Assistant"; what was attached reads "Sent with Q3 report". A failed answer is an alert with Try again.
The launcher and Close name the shortcut through `aria-keyshortcuts`.

## Content

- Name the pane for what it is in your product – "Assistant", "Copilot", "Ask Finance".
- Give `pageContext` a short title ("Q3 report") and its sections as items, so people see what the assistant reads.
- Derive `starters` from what's on the page; keep them short and specific.
- Mark answers that lead to decisions with `reflect` – "checkpoint" for claims, "prior" to ask for an expectation first.

## Do

- Append to `messages` on tc-send and grow the answer's `text` while `streaming` is set.
- Remember `width`, `open` and `collapsed` per person by listening to their change events.

## Don't

- Don't put a second assistant launcher on the page – set `launcher` to false if you have your own.
- Don't hide the disclaimer without a better one of your own.

## Example

```html
<tc-ai-side-pane id="assistant" heading="Assistant" style="height: 640px">
  <article>… the report …</article>
</tc-ai-side-pane>

<script type="module">
  import "trenchcoat/ai-side-pane";
  import "trenchcoat/tokens.css";

  const pane = document.querySelector("#assistant");
  pane.pageContext = { title: "Q3 report", connected: true, count: 4 };
  pane.messages = [];
  pane.addEventListener("tc-send", (e) => {
    pane.messages = [...pane.messages, { id: crypto.randomUUID(), role: "user", text: e.detail.message }];
  });
</script>
```

```tsx
import { useState } from "react";
import { AiSidePane, type SidePaneMessage } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Report() {
  const [messages, setMessages] = useState<SidePaneMessage[]>([]);
  return (
    <AiSidePane
      title="Assistant"
      messages={messages}
      onSend={(text) => setMessages((list) => [...list, { id: String(list.length), role: "user", text }])}
    >
      <article>The report</article>
    </AiSidePane>
  );
}
```
