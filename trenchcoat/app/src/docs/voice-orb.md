---
pattern: none
status: stable
related: voice-mode, writing-assistant, thinking-loader
---

## Overview

The face of a voice assistant: a sphere of dots that shows what the assistant is doing. Idle, it turns slowly and
breathes; listening, its dots jump outward with the input level; thinking, it collapses into a fast spinning ring
with a light running round it; speaking, waves travel from pole to pole. States melt into each other, the dots give
way to the pointer, and a short line underneath says the state in words. Feed it `level` from real audio, or leave
it unset and the orb fakes a natural one.

## When to use

- The centre of a voice conversation, showing whether the assistant is waiting, hearing, working or talking.
- A start button for voice input – set `pressable` (or pass `onPress` in React) and listen for `tc-press`.
- Driven by a microphone or playback meter, through `level` from 0 to 1.

## When not to use

- The whole voice conversation – transcript, mute, interrupt and end – use `voice-mode`, which can sit around the
  orb.
- Dictating into a text field of a chat card – use `writing-assistant`.
- A plain “working on it” indicator in text or chat – use `thinking-loader`.

## Anatomy

1. **Sphere** `.ui-vo__canvas` – the dots, drawn on a canvas at `size` pixels square
2. **State line** `.ui-vo__label` – the state in words (“Tap to speak”, “Listening”), with blinking dots while busy

## Keyboard

Not pressable, there is nothing to operate. Pressable, the orb is a native button:

| Key | What it does |
|---|---|
| Tab | Moves focus to the orb |
| Enter / Space | Presses it – fires `tc-press` |

## Screen readers

Not pressable, the host is `role="img"` named by the state: “Voice assistant: Listening” (an `aria-label` or
`aria-labelledby` the page sets itself is kept). Pressable, a native `<button>` inside holds the orb; its name is
the state line (“Tap to speak”), or “Voice assistant: Tap to speak” when `label` is `false`, and ARIA attributes set
on the host move to the button. The state line is a polite live region (`aria-live="polite"`) that is re-rendered
with each new state. The canvas is hidden from assistive tech.

## Content

- The default lines are “Tap to speak”, “Listening”, “Thinking” and “Speaking”. Replace single ones with an object
  – `{ idle: "Ask anything" }` – and keep them to one or two words.
- Write the idle line as what to do; write the others as what the assistant is doing.
- Hide the line (`label = false`) only when the same state is shown in words nearby.

## Do

- Pass a real `level` while listening or speaking, so the dots move with the voice.
- Set `accent` to your brand colour – the moving dots take it on; the resting dots stay in the text colour.
- Lower `dots` for small orbs or many on one page – fewer dots draw faster.

## Don't

- Don't use the motion as the only signal of state – keep the line, or show the state elsewhere.
- Don't leave it in `listening` when the microphone is off – switch back to `idle`.
- Don't set `pressable` when nothing happens on a press; an orb that looks like a button should act like one.

## Example

```html
<tc-voice-orb id="orb" pressable></tc-voice-orb>

<script type="module">
  import "trenchcoat/voice-orb";
  import "trenchcoat/tokens.css";

  const orb = document.querySelector("#orb");
  orb.label = { idle: "Ask anything" };
  orb.addEventListener("tc-press", () => {
    orb.state = orb.state === "idle" ? "listening" : "idle";
  });
</script>
```

```tsx
import { useState } from "react";
import { VoiceOrb, type VoiceOrbState } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function VoiceButton() {
  const [state, setState] = useState<VoiceOrbState>("idle");
  return <VoiceOrb state={state} size={180} onPress={() => setState((s) => (s === "idle" ? "listening" : "idle"))} />;
}
```
