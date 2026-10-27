---
pattern: toolbar
status: new
related: chat-composer, thinking-state, writing-assistant, ai-answer
---

## Overview

The screen for a spoken conversation with the model. The voice orb shows what the assistant is doing – ready,
listening, thinking or speaking – and every turn is captioned as it's spoken, so people can read along, catch what
they missed, or follow without sound. A toolbar holds Mute, Captions, Interrupt and End. The component shows the
conversation; the audio stays with your app, which passes in the state, the turns and the loudness and listens for
the buttons.

## When to use

- A hands-free or voice-first conversation with an assistant.
- Anywhere spoken answers need captions for people who can't or don't want to listen.
- Letting people cut the assistant off mid-answer and say something else.

## When not to use

- Typing a message, with dictation as an extra – use `chat-composer`.
- Showing that the model is working on a typed request – use `thinking-state`.
- Dictating into a document – use `writing-assistant`.
- A written answer people read and copy – use `ai-answer`.

## Anatomy

1. **Orb** `.ui-vm__orb` – moves with the conversation: calm when ready, with the voice when listening or speaking
2. **State** `.ui-vm__state` – “Listening”, “Thinking”, “Speaking”, “Ready” or “Muted”
3. **Captions** `.ui-vm__captions` – every turn with who said it; the one still coming in has a caret
4. **Toggles** `.ui-vm__toggles` – Mute and Captions
5. **Interrupt** `.ui-vm__interrupt` – stops the assistant while it thinks or speaks
6. **End** `.ui-vm__end` – ends the conversation

## Looks

Standard is a white card on a gray tray, with the controls on the tray below it and a larger orb. Clean is one white
card with hairline shadows; the controls are its last row and the orb is a little smaller. Both caption the same
way and blink the state dots a few times before they hold still.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the captions (to scroll them) and then into the toolbar – one stop for all four buttons |
| ← / → | In the toolbar: moves to the previous or next button, wrapping round |
| Home / End | In the toolbar: moves to the first or last button |
| Enter / Space | Presses the focused button |
| Escape | Anywhere in the component: interrupts while the assistant thinks or speaks |

## Screen readers

The controls are a `toolbar` named “Voice controls”. Mute and Captions are toggle buttons with `aria-pressed`;
Interrupt carries `aria-keyshortcuts="Escape"` and is `aria-disabled` unless the assistant is thinking or speaking.
The captions are a focusable region named “Captions” – not a live region. Instead, a polite status region reads each
turn once it's finished, with who said it – “Atlas: The forecast for tomorrow is…” – never word by word while it
streams in. The orb is hidden from assistive technology.

## Content

- Set `name` to the assistant's name; it labels its turns and starts what screen readers hear.
- Keep `placeholder` to one line that invites people to speak: “Start talking – your words show up here.”
- Override `labels` only to match your product's voice – one word per state works best.
- Pass turns as they're recognised, with `partial: true` until each is final.

## Do

- Pass `level` from the real microphone or speech output, so the orb moves with the voice.
- Stop the audio in your `tc-interrupt` handler and set `state` to `listening` – the component only reports the
  press.
- Keep captions on by default; people who turn them off can.

## Don't

- Don't announce partial turns yourself – the component already reads each finished turn once.
- Don't leave `state` on `speaking` after the audio has stopped – Interrupt and Escape stay active.
- Don't use End to mean “pause” – it fires `tc-end` and should close the conversation.

## Example

```html
<tc-voice-mode id="voice" name="Atlas" state="listening"></tc-voice-mode>

<script type="module">
  import "trenchcoat/voice-mode";
  import "trenchcoat/tokens.css";

  const voice = document.querySelector("#voice");
  voice.turns = [
    { id: "t1", role: "user", text: "What's the weather tomorrow in Lisbon?" },
    { id: "t2", role: "assistant", text: "Sunny, with a high of", partial: true },
  ];
  voice.level = 0.4;
  voice.addEventListener("tc-interrupt", () => console.log("Stop speaking"));
</script>
```

```tsx
import { VoiceMode, type VoiceModeState, type VoiceTurn } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Conversation({
  state,
  turns,
  stop,
  hangUp,
}: {
  state: VoiceModeState;
  turns: VoiceTurn[];
  stop: () => void;
  hangUp: () => void;
}) {
  return <VoiceMode name="Atlas" state={state} turns={turns} onInterrupt={stop} onEnd={hangUp} />;
}
```
