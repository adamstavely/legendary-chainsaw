---
pattern: radio
status: new
related: collaboration-stream, agent-plan, context-window, meter-row, agent-lanes
---

## Overview

Work with a team of agents while they work. In the middle, what they say to each other and to you, in the library's
Collaboration Stream with its composer. Beside it, the team's plan ticking off step by step, each step with the agent
it belongs to. Under the plan, how full the shared context is, in the library's Meter Row. Pick an agent at the top
and its steps stand out in the plan while the others go quiet, and the stream shows that agent's messages; picking an
agent's tab in the stream picks it here too. Narrow, the plan goes under the stream.

## When to use

- A workspace where a person works alongside several agents on one job and answers their questions as they come.
- Following one agent's part of the plan without losing the rest of the team.
- Keeping an eye on the shared context while the team talks.

## When not to use

- The conversation on its own – use `collaboration-stream`.
- One agent's plan – use `agent-plan`.
- When each agent was busy over time – use `agent-lanes`.
- What fills the context and why – use `context-window`.

## Anatomy

1. **Intro** `.ui-lses__intro` – the heading and the agent picker
2. **Stream** `.ui-lses__stream` – the Collaboration Stream, with its tabs and composer
3. **Plan** `.ui-lses__plan` – the team's steps, with how many are done
4. **Step** `.ui-lses__step` – a step's mark, title, detail and agent
5. **Context** `.ui-lses__context` – how full the shared context is

## Looks

The block is a page section, not a card. In Standard the plan is a gray tray with its steps on a white card; in Clean
it's one white card. The stream and the meter carry the look the rest of the way. The picked agent's steps take the
accent tint with a bar on the left; the others' titles go muted but stay readable.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the agent picker, the stream's tabs, log, messages and composer |
| ← / → | In the agent picker or the stream's tabs, picks the previous or next one |
| Enter | In the composer or an answer box: sends. Shift + Enter adds a line |

The stream keeps its own keys – @ to name a participant, Escape to close a file preview.

## Screen readers

The heading is the block's heading. The agent picker is a radio group named “Show agent”, with “Whole team” first. The
plan is a region named “Plan”, with its progress beside the title – “4 of 8 done”; each step reads its title and its
status in a word – “Up next”, “In progress”, “Done”, “Failed” or “Skipped” – and its agent. With an agent picked, a
line above the steps says “Scheduler: 2 steps”. The context is a `meter` named “Shared context” with its value in
words. Marks are hidden. The stream announces its own messages.

## Content

- Give each step a short `title` and the `agentId` of the participant it belongs to; leave it out for a step the team
  shares.
- Use a step's `detail` for why it stands still: “Waiting for your answer”.
- Give the context in words with `context-text`: “124k of 200k tokens”. Leave out `context` to leave out the meter.
- Set `you` to your participant id when it isn't “you”.
- Rename the words with `labels`, e.g. `{ team: "Everyone" }`.

## Do

- Listen for `tc-agent-change` (`onAgentChange` in React) to follow the picked agent elsewhere on the page.
- Return a promise from `onSend` so the composer waits and a failure is shown.
- Ask the person questions as messages with `kind: "question"`, so they get an answer box.

## Don't

- Don't put the plan's steps in the stream as messages – the plan is beside it.
- Don't give every step an agent's name in its title; the chip says whose it is.
- Don't put it in a card – it's a page section.

## Example

```html
<tc-live-session id="live" context="0.62" context-text="124k of 200k tokens" agent="scheduler"></tc-live-session>

<script type="module">
  import "@adamstavely/trenchcoat/live-session";
  import "@adamstavely/trenchcoat/tokens.css";

  const T = Date.UTC(2026, 10, 14, 9, 0);
  const MIN = 60_000;
  const live = document.querySelector("#live");
  live.participants = [
    { id: "you", name: "You", kind: "person" },
    { id: "planner", name: "Planner", kind: "agent", model: "Sonnet 5.5" },
    { id: "scheduler", name: "Scheduler", kind: "agent", model: "Opus 5.5" },
  ];
  live.messages = [
    { id: "m1", from: "planner", to: "everyone", at: T - 12 * MIN, text: "41 of 212 stops change on 8 December." },
    { id: "m2", from: "scheduler", to: "you", at: T - 6 * MIN, kind: "question", text: "Should the notice publish route 31's earlier last run?" },
  ];
  live.steps = [
    { id: "s1", title: "List the stops that change", agentId: "planner", status: "done" },
    { id: "s2", title: "Route 31's last run", agentId: "scheduler", status: "active", detail: "Waiting for your answer" },
    { id: "s3", title: "Send to the print shop", status: "pending" },
  ];
  live.onSend = (message) => console.log(message.text, message.to);
  live.addEventListener("tc-agent-change", (e) => console.log(e.detail.agent));
</script>
```

```tsx
import { useState } from "react";
import { LiveSession, type LiveSessionMessage, type LiveSessionParticipant, type LiveSessionStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const T = Date.UTC(2026, 10, 14, 9, 0);
const MIN = 60_000;

const team: LiveSessionParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "translator", name: "Translator", kind: "agent", model: "Sonnet 5.5" },
];
const messages: LiveSessionMessage[] = [
  { id: "m1", from: "translator", to: "everyone", at: T - 3 * MIN, text: "Spanish is done. Waiting on the route-name glossary." },
];
const steps: LiveSessionStep[] = [
  { id: "s1", title: "Translate into Spanish", agentId: "translator", status: "done" },
  { id: "s2", title: "Translate into Vietnamese", agentId: "translator", status: "failed", detail: "Needs the route-name glossary" },
];

export function Session() {
  const [agent, setAgent] = useState<string | null>(null);
  return (
    <LiveSession
      participants={team}
      messages={messages}
      steps={steps}
      context={0.62}
      contextText="124k of 200k tokens"
      agent={agent}
      onAgentChange={(id) => setAgent(id)}
      onSend={async (message) => console.log(message.text)}
    />
  );
}
```
