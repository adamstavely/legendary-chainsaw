---
pattern: none
status: new
related: comment-thread, collaboration-stream, chat-composer, mention-picker
---

## Overview

One chat thread shared by several people and one model. Every message shows who wrote it, and a run of messages from
one person within five minutes groups under one name. Joins and leaves are quiet rows in the conversation. Above it, a
presence strip shows who's here – a small dot on anyone typing – and a switch for when the model answers: only when
someone @-mentions it, or every message. The model's replies say whose message they answer ("Replying to Priya").
Typing @ in the composer offers the model and the other people.

## When to use

- A team working a problem together with a model in one conversation – a review, an incident, a planning session.
- When it matters who asked the model what, and when it should stay quiet.
- Showing who's here and who's typing in a shared AI chat.

## When not to use

- One person talking to a model – use `chat-composer` with `ai-answer`.
- Agents talking to each other during a run – use `collaboration-stream`.
- A comment pinned to one spot in a document – use `comment-thread`.

## Anatomy

1. **Header** – the shared card header: a boxed icon and the heading
2. **Presence strip** `.ui-mpt__presence` – who's here, how many, and the mode switch
3. **Mode switch** `.ui-mpt__mode` – the model answers when mentioned, or every message
4. **Conversation** `.ui-mpt__log` – messages, joins and leaves, and who's typing
5. **Message** `.ui-mpt__msg` – avatar, name, role, time and text; grouped messages leave the avatar out
6. **Replying to** `.ui-mpt__reply-to` – on the model's messages, whose message it answers
7. **Mention** `.ui-mpt__mention` – an @-mention of a person or the model, marked in the text
8. **Composer** `.ui-mpt__composer` – the field, Send, and a hint about when the model answers

## Looks

Standard puts the header, the presence strip and the composer on a gray tray, with the conversation in a white card
between them. Clean is one white card: header, presence, conversation and composer as rows divided by hairlines, with
smaller avatars. `--tc-mpt-max-height` sets how tall the conversation grows before it scrolls.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the mode switch, the conversation (scrollable with the arrow keys), the field and Send |
| ← → | In the mode switch: changes when the model answers |
| @ | In the field: opens the list of people and the model; ↑ ↓ move, Enter or Tab inserts |
| Enter | Sends the message (Shift + Enter for a new line) |

## Screen readers

The thread is a `region` named by `heading`. The conversation is a `log` named "Messages", so new messages are read
politely as they arrive; it holds a list with one item per message, join or leave. Grouped messages repeat the
author's name in hidden text, so every message says who wrote it. Who's typing is announced in a separate status
region ("Priya is typing…", "Assistant is answering…"); the dots and the faces are hidden. The mode switch is a
fieldset of two radios named "Assistant answers"; the field is described by the hint ("Mention @Assistant to ask it").

## Content

- Give people their full names and, where useful, a role ("Lead", "Reviewer").
- Set `replyTo` on the model's messages so everyone sees whose question it answers.
- Keep `present` and `typing` current from your realtime channel; put `"model"` in `typing` while it's answering.

## Do

- Use `modelAnswers` from `tc-send` to decide whether to call the model.
- Add sent messages to `items` yourself – the thread shows what you pass.
- Hide the mode switch with `hide-mode` when your app decides when the model answers.

## Don't

- Don't let the model answer every message by default in a busy thread – it drowns out the people.
- Don't put the model's thinking or tool calls in the text; show them with `thinking-state` or `tool-call-card`.

## Example

```html
<tc-multiplayer-thread id="review" heading="Vendor review" current-user="ana"></tc-multiplayer-thread>

<script type="module">
  import "@adamstavely/trenchcoat/multiplayer-thread";
  import "@adamstavely/trenchcoat/tokens.css";

  const thread = document.querySelector("#review");
  thread.people = [
    { id: "ana", name: "Ana Ruiz", role: "Lead" },
    { id: "priya", name: "Priya Shah", role: "Analyst" },
  ];
  thread.model = { name: "Assistant" };
  thread.present = ["ana", "priya", "model"];
  thread.items = [{ id: "m1", authorId: "priya", at: Date.now(), text: "@Assistant is a 14-month-old SOC 2 report acceptable?" }];
  thread.addEventListener("tc-send", (e) => {
    thread.items = [...thread.items, { id: String(Date.now()), authorId: "ana", at: Date.now(), text: e.detail.text }];
  });
</script>
```

```tsx
import { useState } from "react";
import { MultiplayerThread, type MultiplayerItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Review({ ask }: { ask: (text: string) => Promise<string> }) {
  const [items, setItems] = useState<MultiplayerItem[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  return (
    <MultiplayerThread
      title="Vendor review"
      people={[
        { id: "ana", name: "Ana Ruiz", role: "Lead" },
        { id: "priya", name: "Priya Shah", role: "Analyst" },
      ]}
      model={{ name: "Assistant" }}
      currentUser="ana"
      present={["ana", "priya", "model"]}
      typing={typing}
      items={items}
      onSend={async (text, _mentions, modelAnswers) => {
        setItems((list) => [...list, { id: crypto.randomUUID(), authorId: "ana", at: Date.now(), text }]);
        if (!modelAnswers) return;
        setTyping(["model"]);
        const answer = await ask(text);
        setTyping([]);
        setItems((list) => [...list, { id: crypto.randomUUID(), authorId: "model", replyTo: "ana", at: Date.now(), text: answer }]);
      }}
    />
  );
}
```
