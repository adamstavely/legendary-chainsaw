---
pattern: tabs
status: new
related: agent-handoff, agent-tree, tool-call-card, chat-composer, comment-thread
---

## Overview

What the agents in a run say to each other, as a quiet chat. Every message says who it is from and who it is for –
“Researcher → Orchestrator” – with its time. Handoffs and other run events (“Orchestrator started Researcher”) are
slim rows between the messages. A question addressed to you is tagged “Needs you” and carries its own answer box.
Files are chips that open a preview, and every message can unfold a details card with its model, tokens, cost, time
and the tool calls it made. Tabs filter the stream – Everyone, You and one per agent – and a composer at the bottom
writes to everyone or to one participant, with @ to name someone.

## When to use

- Multi-agent runs where the conversation between agents is the thing to follow: who asked whom for what, and what
  came back.
- Runs that sometimes stop to ask a person – the question sits in the stream where it came up, and is answered there.
- Showing a run live: messages stream in, the log follows the newest one, and a “Live” pill sits in the header.

## When not to use

- A task passed along a chain, where what carried over at each step matters – use `agent-handoff`.
- Who started whom, with costs rolled up – use `agent-tree`.
- One agent's single tool call in detail – use `tool-call-card`.
- A person chatting with one assistant – use `chat-composer` with your own message list.
- People discussing a document – use `comment-thread`.

## Anatomy

1. **Header** `.tc-head` – the shared card header: icon, heading, an optional line, and “needs you” and Live on the right
2. **Card** `.ui-cls__card` – holds the tabs, the log and the composer
3. **Tabs** `.ui-cls__tabs` – Everyone, You and one per agent, each with a count
4. **Log** `.ui-cls__log` – the messages, scrolling, pinned to the newest one
5. **Message** `.ui-cls__msg` – avatar, who to whom, time, the text, then files, an answer box and details
6. **Event** `.ui-cls__event` – a handoff or run event as a slim row
7. **Tag** `.ui-cls__tag` – “Needs you” on a question for you, “Answered” once it's answered
8. **File chip** `.ui-cls__chip` – opens the file's preview `.ui-cls__preview`
9. **Details** `.ui-cls__more` – unfolds `.ui-cls__details`: model, tokens, cost, time and tool calls with results
10. **Composer** `.ui-cls__composer` – the message box, the To picker and Send
11. **New messages** `.ui-cls__new` – appears when messages arrive while you're scrolled up

## Looks

Standard sets the header on a gray tray above a white card that holds the tabs, the log and the composer. Clean is
one white card with the header as its first row and a hairline under it. Both narrow the same way: under 480 px the
model and cost leave the message header (they stay in Details) and the tabs scroll sideways.

Component token: `--tc-collaboration-stream-log-h` – the log's maximum height (420 px).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the selected tab, the log, then each message's chips, answer box and Details, then the composer |
| ← / → | On the tabs: picks the previous or next filter |
| Home / End | On the tabs: picks the first or last filter |
| Enter | In the composer or an answer box: sends. Shift + Enter adds a line |
| @ | In the composer: opens the participant list – ↑ ↓ move, Enter or Tab picks, Escape closes |
| Escape | In a file preview: closes it and returns focus to its chip |

## Screen readers

The tabs are a `tablist` named “Show messages for”; each tab reads its name and count (“Researcher, 2”) and controls
the log, a `tabpanel` named after the filter (“Messages – Everyone”) that can be focused to scroll. The messages are a
list; each one reads who it's from, “to” and who it's for, and its time. A message still being written is
`aria-busy`, and its text isn't announced as it grows: a polite status says “Writer is writing”, then the finished
message (“Writer to Orchestrator: …”). File chips and Details are disclosure buttons with `aria-expanded` and
`aria-controls`; the preview is a region named after the file. An answer box is named after the asker (“Answer
Writer”). A send whose promise rejects shows an alert, “Didn't go through – try again”. Avatars, arrows and icons are
hidden.

## Content

- Name agents by their role in the run (“Researcher”, “Data checker”); put the model in `model`.
- Keep messages to what one agent asked or told another – the work itself belongs in files and details.
- Write a handoff as what happened: “Orchestrator started Researcher”.
- Write a question so it can be answered in a line: “Should the report cover 2023–2024, or 2016 onwards?”.
- Give tool calls a summary that says what they did: “6 searches – plot counts 2016–2025”.

## Do

- Add the answer the user sends as a new message, and mark the question `answered`.
- Return a promise from `onSend` so the box waits and a failure keeps the text.
- Set `streaming` while a message is being written, and clear it when it's done.

## Don't

- Don't put every token of a long tool result in the message; use `details.tools[].results`.
- Don't use it for a single assistant's chat with a person.
- Don't hide who a message is for – “to everyone” is a choice, not a default to leave unsaid.

## Example

```html
<tc-collaboration-stream id="run" heading="Annual field-survey report"></tc-collaboration-stream>

<script type="module">
  import "@adamstavely/trenchcoat/collaboration-stream";
  import "@adamstavely/trenchcoat/tokens.css";

  const stream = document.querySelector("#run");
  stream.participants = [
    { id: "you", name: "You", kind: "person" },
    { id: "orch", name: "Orchestrator", kind: "agent", model: "Opus 5.5" },
    { id: "res", name: "Researcher", kind: "agent", model: "Sonnet 5.5" },
  ];
  stream.messages = [
    { id: "m1", from: "orch", to: "res", at: Date.UTC(2026, 10, 5, 13, 2), text: "Collect the plot counts since 2016." },
    { id: "q1", from: "res", to: "you", at: Date.UTC(2026, 10, 5, 13, 6), kind: "question", text: "Include Upper Meadow?" },
  ];
  stream.addEventListener("tc-send", (e) => console.log(e.detail.text, e.detail.to));
</script>
```

```tsx
import { CollaborationStream, type CollabMessage, type CollabParticipant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const participants: CollabParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "orch", name: "Orchestrator", kind: "agent", model: "Opus 5.5" },
  { id: "res", name: "Researcher", kind: "agent", model: "Sonnet 5.5" },
];
const messages: CollabMessage[] = [
  { id: "m1", from: "orch", to: "res", at: Date.UTC(2026, 10, 5, 13, 2), text: "Collect the plot counts since 2016." },
  { id: "q1", from: "res", to: "you", at: Date.UTC(2026, 10, 5, 13, 6), kind: "question", text: "Include Upper Meadow?" },
];

export function Run() {
  return <CollaborationStream title="Annual field-survey report" participants={participants} messages={messages} onSend={(m) => console.log(m.text, m.to)} />;
}
```
