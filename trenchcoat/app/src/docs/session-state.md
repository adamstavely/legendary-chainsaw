---
pattern: none
status: new
related: session-context-bar, context-map, context-window, agent-plan
---

## Overview

“Where are we?” for a long LLM session, in one compact header. A health pill sits beside the title – Healthy,
Drifting, At risk or Stalled – and a row of tiles below gives the primary goal, the open loops, the artifacts still to
come and how full the context is. A row of status chips underneath says the rest in a few words: “Intent stable”,
“No approval blocked”, “2 files in context”, “1 inferred assumption”. Someone coming back to the session after an hour
knows in a glance whether it's on track and what's still open.

## When to use

- At the top of a long chat or agent session, so the person can re-orient after a break.
- When work spans many turns and loose ends pile up: open questions, artifacts promised, assumptions made.
- When the context is filling and the person should know before the model starts forgetting.

## When not to use

- The session's declared terms – intent, scope, limits, budget – use `session-context-bar`.
- What fills the context, part by part – use `context-map` or `context-window`.
- The agent's steps and their progress – use `agent-plan`.

## Anatomy

1. **Health** `.ui-sst__health` – how the session is going, as a tint, a mark and a word
2. **Tiles** `.ui-sst__tiles` – the goal, open loops, pending artifacts and context pressure, or the page's own
3. **Tile** `.ui-sst__tile` – a big figure, what it counts and one line of detail; a button with `actionable`
4. **Meter** `.ui-sst__meter` – a share such as context pressure, warning at 75% and danger at 90%
5. **Chips** `.ui-sst__chips` – short statuses, each in a tone; a chip with `action` is a button

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and the tiles as sunken wells. Clean is
one white card with the header as its first row and the tiles outlined with a hairline. The pill, meters and chips are
the same in both. The tiles sit four across, two by two in a narrower container, then in one column.

## Keyboard

With `actionable`, the tiles are one tab stop.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the previous or next tile |
| Home / End | Moves to the first or last tile |
| Enter / Space | Presses the tile – fires tc-action |
| Tab | Moves on to the chips that are buttons, then out |

## Screen readers

The tiles are a list named by the heading. Each tile reads its figure, what it counts and its detail – “3, Open loops,
prototype · naming · integration”. A meter's tile adds its level in words: “68%, Context pressure, comfortable”, “high”
from `warn-at` and “critical” from `danger-at`; the bar itself is hidden. The health pill reads its word, “Healthy”,
and its mark is hidden. The chips are a list labelled “Status”; a chip that's a button reads as one.

## Content

- Write the goal as the outcome the session is for: “Ship the onboarding flow”, not “Chat about onboarding”.
- Name loops in a word or two each – they're joined with “ · ”.
- Write chips as states, not advice: “2 files in context”, “1 inferred assumption”.
- Use `drifting` when the intent has moved from the goal, `at-risk` when something blocks it, `stalled` when nothing
  has moved for a while.

## Do

- Make the tiles actionable when there's somewhere to go: the loops list, the artifacts, the context.
- Keep chips to four or five, the ones that change what the person does next.
- Lower `warn-at` for models that degrade early as the context fills.

## Don't

- Don't repeat the session's terms here – that's `session-context-bar`'s job.
- Don't show Healthy when you don't know – leave `health` unset.
- Don't use chip tones for decoration – each tone should mean the same thing everywhere on the page.

## Example

```html
<tc-session-state id="state" description="Where this session stands." health="healthy" goal="Ship the onboarding flow" pressure="0.68" actionable></tc-session-state>

<script type="module">
  import "trenchcoat/session-state";
  import "trenchcoat/tokens.css";

  const state = document.querySelector("#state");
  state.loops = ["copy", "empty state", "analytics"];
  state.artifacts = ["demo", "TSX starter"];
  state.chips = [
    { id: "intent", label: "Intent stable", tone: "violet" },
    { id: "files", label: "2 files in context", tone: "teal", action: true },
  ];
  state.addEventListener("tc-action", (e) => console.log(e.detail.id, e.detail.kind));
</script>
```

```tsx
import { SessionState } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Where() {
  return (
    <SessionState
      health="healthy"
      goal="Ship the onboarding flow"
      loops={["copy", "empty state", "analytics"]}
      artifacts={["demo", "TSX starter"]}
      pressure={0.68}
      chips={[{ id: "intent", label: "Intent stable", tone: "violet" }]}
      actionable
      onAction={(id) => console.log(id)}
    />
  );
}
```
