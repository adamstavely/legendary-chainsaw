---
pattern: list
status: new
related: trace-waterfall, agent-lanes, collaboration-stream, agent-tree
---

## Overview

One agent run as a sequence diagram. You, every agent and every tool get a column – a lifeline – and each message is
an arrow from one lifeline to another, in the order it was sent: calls are solid, replies dashed, and a failure is in
the danger tone with the word "Failed" on its tag. A bar on a lifeline shows a participant at work, from the call it
got to the answer it sent; while it hasn't answered, the bar runs to the bottom and its head says "Working". Labelled
frames gather messages that ran in parallel and messages that were retried. In a live run every new message draws
itself across with a light at its tip, and the diagram follows the newest one unless the reader has scrolled up.
Picking a message or a participant opens a details card under the diagram.

## When to use

- Showing who talked to whom in one agent run – you, the agents and the tools they called, message by message.
- Debugging a multi-agent run: which call waited on which reply, what ran in parallel, where a retry happened and
  what failed.
- A live view of a run as it happens.

## When not to use

- How long each step took on a time axis – use `trace-waterfall`.
- Many agents over a long stretch of time, lane by lane – use `agent-lanes`.
- What agents actually said, as a conversation – use `collaboration-stream`.
- The structure of a crew rather than its messages – use `agent-tree`.

## Anatomy

1. **Heads** `.ui-aseq__heads` – a button per participant `.ui-aseq__head` with its mark `.ui-aseq__avatar`, name `.ui-aseq__name` and role or "Working" `.ui-aseq__role`
2. **Lifelines** `.ui-aseq__lanes` – a dashed line per participant `.ui-aseq__lane`, with work bars `.ui-aseq__active`
3. **Frames** `.ui-aseq__frame` – a parallel or retried group, with its tag `.ui-aseq__frame-tag`
4. **Messages** `.ui-aseq__msgs` – a button per message `.ui-aseq__msg`, its arrow `.ui-aseq__arrow` with the line `.ui-aseq__line` and its tag `.ui-aseq__label`
5. **Details** `.ui-aseq__detail` – the picked message's or participant's card, with Close `.ui-aseq__close`
6. **Empty** `.ui-aseq__empty` – "No messages yet"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. A call's line and tag are in the primary ink, a reply's are dashed and muted, and a failure's are in the danger
tone with a cross and the word "Failed", so colour is never the only cue. Agents have an accent-tinted mark, tools a
gray one and you a round one. Parallel frames have a solid edge; retry frames a dashed amber one. A page can set
`--tc-aseq-col` (a column's least width), `--tc-aseq-row` (a message's height), `--tc-aseq-max-h` (the height
before the diagram scrolls) and the inks `--tc-aseq-call`, `--tc-aseq-reply` and `--tc-aseq-error`. When the card
is narrower than its columns need, the diagram scrolls sideways, and the heads stay on top while it scrolls down.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the participants and the messages – one stop each |
| ← / → | Moves between participants, or between messages |
| ↑ / ↓ | Moves between messages |
| Home / End | Goes to the first or last |
| Enter / Space | Opens or closes the details |
| Escape | Closes the details and returns to what opened them |

## Screen readers

The participants are a toolbar of buttons; the messages are an ordered list of buttons, each named by its tag and then,
in screen-reader-only words, who sent it to whom, its kind and its frame ("Gather Q3 sampling data, Planner to
Researcher, Call"). Each button says whether its details are expanded and points to the details region. The arrows,
lifelines, bars and frames are drawn and hidden. A live run says each new message in a `role="status"` region.

## Content

- Give participants short names – they share a column's width with their mark.
- Keep a message's `label` to a few words; put the full text in `input` or `output` for the details.
- Ids must be unique across messages and participants, since `openId` can be either.
- Use `group` for messages that ran together or were retried, and name the frame in `groups`.

## Do

- Pass `start` and `end` (ms from the start of the run) so the details can say when a message was sent and how long
  its answer took.
- Set `live` while the run is going, and turn it off when it ends.

## Don't

- Don't use it for runs with hundreds of messages – group them first, or use `trace-waterfall`.
- Don't put secrets in labels or previews – the details show them as they are.

## Example

```html
<tc-agent-sequence id="sequence" subtitle="Q3 water-quality report"></tc-agent-sequence>

<script type="module">
  import "@adamstavely/trenchcoat/agent-sequence";
  import "@adamstavely/trenchcoat/tokens.css";

  const sequence = document.querySelector("#sequence");
  sequence.participants = [
    { id: "you", name: "You", kind: "user" },
    { id: "planner", name: "Planner", kind: "agent", detail: "large-1" },
    { id: "researcher", name: "Researcher", kind: "agent" },
    { id: "pdf", name: "PDF reader", kind: "tool" },
  ];
  sequence.groups = [{ id: "retry", kind: "retry", label: "2nd try" }];
  sequence.messages = [
    { id: "m1", from: "you", to: "planner", kind: "call", label: "Draft the Q3 report" },
    { id: "m2", from: "planner", to: "researcher", kind: "call", label: "Gather the data" },
    { id: "m3", from: "researcher", to: "pdf", kind: "call", label: "read lab-results.pdf" },
    { id: "m4", from: "pdf", to: "researcher", kind: "error", label: "page 4 unreadable" },
    { id: "m5", from: "researcher", to: "pdf", kind: "call", label: "read with OCR", group: "retry" },
    { id: "m6", from: "pdf", to: "researcher", kind: "reply", label: "42 rows", group: "retry" },
    { id: "m7", from: "researcher", to: "planner", kind: "reply", label: "Data and sources" },
  ];
  sequence.addEventListener("tc-open-change", (e) => console.log(e.detail.openId));
</script>
```

```tsx
import { useState } from "react";
import { AgentSequence, type SequenceMessage, type SequenceParticipant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunSequence({ participants, messages, live }: { participants: SequenceParticipant[]; messages: SequenceMessage[]; live: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <AgentSequence participants={participants} messages={messages} live={live} openId={openId} onOpenChange={setOpenId} />;
}
```
