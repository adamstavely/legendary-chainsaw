---
pattern: none
status: new
related: voice-orb, thinking-loader, thinking-state, session-state
---

## Overview

Donovan's face. It shows what the agent is doing, in nine states, and moves between them on springs. Each state holds
for a moment, so an agent that changes its mind quickly doesn't make the face flicker. The shape is a placeholder until
Donovan's logo artwork is available.

## When to use

- Beside the agent's name, in a chat composer or at the top of an answer, where a live sign of what it's doing helps.
- Anywhere Donovan speaks as a character, from a 16 px mark to a 256 px greeting.

## When not to use

- A voice conversation, where the sound level is the point – use `voice-orb`.
- Explaining what the agent is working on in words – use `thinking-state`.
- As the only sign of an error or a wait. Say what's happening in text as well.

## Anatomy

1. **Face** `.ui-afc__face` – the `<agent-face>` element, which holds the canvas

## Looks

There's no Standard or Clean, because the face has no card. It has one gradient and floating white hands with a thin black outline, which read on light and dark surfaces. At 26 px and below there are no hands.
Motion overhangs the box without moving the layout, so leave some room around it, and don't clip a parent to its size.

## Keyboard

The face takes no input, so it has no tab stop.

## Screen readers

The canvas is an image named for the state, such as "Donovan is thinking". Set `labels` to translate, `name` to change
who it names, or `label` for one name in every state. Changes stay silent unless you set `announce`, which adds a polite
`role="status"`. Leave it off where the chat already announces the same thing.

## Content

| State | Use it when |
|---|---|
| `idle` | Ready, with nothing going on |
| `listening` | The person is typing or talking |
| `thinking` | Working towards an answer |
| `speaking` | Writing or saying the answer; `amplitude` can follow real audio |
| `happy` | Something finished well. Keep it brief |
| `confused` | It needs clarification |
| `sleeping` | Paused or away |
| `error` | Something failed |
| `surprised` | Something unexpected turned up |

## Do

- Reuse one `state` across every face that stands for the same agent.
- Use `playGesture` for moments: a wave hello, or a nod when a task finishes.
- Keep `happy` and `hop` away from serious results, such as a declined payment or a fraud decision.

## Don't

- Don't rely on the face alone at 16 or 26 px, where most states are hard to tell apart.
- Don't use it for a person, or for an agent other than Donovan without changing `name`.

## Example

```html
<tc-agent-face id="donovan" state="thinking" size="64"></tc-agent-face>

<script type="module">
  import "trenchcoat/agent-face";
  import "trenchcoat/tokens.css";

  const face = document.querySelector("#donovan");
  face.state = "speaking";
  face.playGesture("nod");
</script>
```

```tsx
import { AgentFace } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Status({ busy }: { busy: boolean }) {
  return <AgentFace state={busy ? "thinking" : "idle"} size={26} />;
}
```
