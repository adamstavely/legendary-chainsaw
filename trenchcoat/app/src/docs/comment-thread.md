---
pattern: none
status: stable
related: comments-panel, ai-answer, chat-composer, inline-diff
---

## Overview

One comment and its replies, pinned to a part of a document – with an assistant that can take part. People reply
from the field at the bottom; when the app hands back an answer, the assistant shows “Thinking…” and then posts it,
with a short status line (“Edited 3 cells in Pricing”) that folds open to list exactly what it changed. If the answer
fails, the thread says so and offers Try again. Times read as “12min ago” and keep up with the clock.

## When to use

- A comment anchored to a cell, paragraph or design element, where an assistant can be asked to act on it.
- Showing what an assistant changed in reply to a request, with the details one click away.
- A short exchange – a handful of replies – about one thing.

## When not to use

- Every comment on a document, with filters and resolve – use `comments-panel`.
- A conversation with the assistant that isn't about one spot – use `chat-composer` and `ai-answer`.
- Reviewing the assistant's edits word by word – use `inline-diff`.

## Anatomy

1. **Header** `.ui-ct__head` – the heading, the message count and the close button
2. **Message** `.ui-ct__msg` – avatar, name, time and text
3. **Status line** `.ui-ct__status-btn` – what the assistant did; folds open its details
4. **Reply field** `.ui-ct__composer` – the input and the send button

## Looks

Standard is a gray tray: the header and the reply field sit on the tray and the messages in a white card between
them, with 24 px avatars. Clean is one white panel with hairline rules, 20 px avatars, thinner icons and a
shimmering “Thinking…”. Both fold details the same way and keep the card's height while the
conversation scrolls.

## Keyboard

| Key | What it does |
|---|---|
| Enter | In the reply field: sends the reply (not while an IME is composing or the assistant is thinking) |
| Enter / Space | On a status line: folds its details open or closed |
| Tab | Moves through the message list (scrollable with the arrow keys), status lines, the reply field, Send and Close |

## Screen readers

The thread is a `region` named by `heading` (unless the page names it); the messages sit in a focusable region
“Messages”. Status lines are buttons with `aria-expanded`, disabled when there are no details. The input is named
“Reply”, the buttons “Send reply” and “Close comment”; avatars are hidden. While the assistant works, its placeholder
message is named “Assistant is thinking”. The conversation itself isn't live: a polite status region reads each new
message from someone else once, as the name, the text and the status line (“Assistant: Done – I updated the
discount… Edited 3 cells in Pricing”), and a failure as
“Assistant couldn't answer.” (or “Couldn't post the reply.” with no assistant).

## Content

- Make `heading` the thing commented on: “Pricing table”, not “Comment”.
- Write the assistant's `status` as a past-tense count of what changed: “Edited 3 cells in Pricing”.
- Make each detail one change, before → after: “Starter: $96 → $86.40 / yr”.
- Keep the assistant's reply to a sentence or two; the details carry the rest.
- A reply starting with `/edit` shows the command as a chip – use it for instructions to the assistant.

## Do

- Set `assistant` so the field invites people to ask it (“Reply, or ask @Assistant…”) and the thinking state shows.
- Return a promise from `onReply` and reject it when the assistant fails, so people get Try again.
- Store the list from `tc-messages-change` and pass it back – ids keep replies from doubling.

## Don't

- Don't let a thread run to dozens of replies – move the discussion to `comments-panel` or a chat.
- Don't put long logs in `details`; link to them instead.
- Don't use relative times you work out yourself – pass `createdAt` and let the thread keep them current.

## Example

```html
<tc-comment-thread id="thread" heading="Pricing table" closable></tc-comment-thread>

<script type="module">
  import "trenchcoat/comment-thread";
  import "trenchcoat/tokens.css";

  const thread = document.querySelector("#thread");
  const assistant = { name: "Assistant", assistant: true };
  thread.currentUser = { name: "Jordan Lee" };
  thread.assistant = assistant;
  thread.messages = [
    { id: "m1", author: { name: "Maya Chen" }, createdAt: Date.now() - 600000, text: "@Assistant can you fix the totals?" },
  ];
  thread.onReply = async (text) => ({
    id: crypto.randomUUID(), author: assistant, createdAt: Date.now(),
    text: "Done – the totals are fixed.", status: "Edited 3 cells", details: ["Team: $288 → $259.20"],
  });
  thread.addEventListener("tc-messages-change", (e) => (thread.messages = e.detail.messages));
</script>
```

```tsx
import { useState } from "react";
import { CommentThread, AssistantMark, type ThreadAuthor, type ThreadMessage } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const assistant: ThreadAuthor = { name: "Assistant", assistant: true, avatar: <AssistantMark /> };
const you: ThreadAuthor = { name: "Jordan Lee" };

export function PricingComment({ initial }: { initial: ThreadMessage[] }) {
  const [messages, setMessages] = useState(initial);
  return (
    <CommentThread
      title="Pricing table"
      messages={messages}
      currentUser={you}
      assistant={assistant}
      onMessagesChange={setMessages}
      onReply={async () => ({
        id: crypto.randomUUID(),
        author: assistant,
        createdAt: Date.now(),
        text: "Done – the totals are fixed.",
        status: "Edited 3 cells",
        details: ["Team: $288 → $259.20"],
      })}
    />
  );
}
```
