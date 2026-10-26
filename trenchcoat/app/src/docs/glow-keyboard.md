---
pattern: none
status: stable
related: chat-composer, gradient-floor, voice-orb, writing-assistant
---

## Overview

A hero scene for an AI product: a chat input floating above a glass keyboard and a moving gradient floor. The input
types its prompts by itself, key by key, with a human rhythm and the odd typo, and sends each one with Enter. Every
key press lights up the drawn key, sends a wave up out of the gradient and a flash through the input's glow. People
can click anywhere on it and type themselves – their keys light up the same way. After each prompt has been typed
once, the scene rests.

## When to use

- The hero of a landing page or a launch post for an AI assistant, where typing is the product.
- An onboarding or empty screen that invites people to write their first prompt – listen for `tc-submit`, which
  fires for the prompts it types itself as well as for people's.

## When not to use

- The real input of a chat – use `chat-composer`.
- A gradient glow behind other content – use `gradient-floor`.
- A voice assistant – use `voice-orb`.
- An assistant card people actually work in – use `writing-assistant`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves focus into the input; the self-typing demo stops for good |
| Any key | Types into the input and lights up the matching key on the drawn keyboard |
| Enter | Sends what was typed (`tc-submit`) and clears the input – not while an IME is composing |

## Screen readers

The element is a group named by `label` (“AI chat input above a glass keyboard and a moving colour gradient” by
default) unless the page names it; the input inside is named by `placeholder`. The keyboard, the floor and the glow
are hidden. Reduced motion keeps the scene still and skips the self-typing; typing still works.

## Content

- Write `prompts` as things your users would really ask, short enough to type in a few seconds: “Find a quiet hike
  near Zermatt”.
- Two or three prompts are enough – each is typed once, then the scene rests.
- Make `placeholder` an invitation: “Ask AI anything...”.

## Example

```html
<tc-glow-keyboard id="hero" placeholder="Ask AI anything..."></tc-glow-keyboard>

<script type="module">
  import "trenchcoat/glow-keyboard";
  import "trenchcoat/tokens.css";

  const scene = document.querySelector("#hero");
  scene.prompts = ["Summarise this week's support tickets", "Draft a reply to Maya"];
  scene.addEventListener("tc-submit", (e) => console.log(e.detail.text));
</script>
```

```tsx
import { GlowKeyboard } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Hero() {
  return (
    <GlowKeyboard
      prompts={["Summarise this week's support tickets", "Draft a reply to Maya"]}
      onSubmit={(text) => console.log(text)}
    />
  );
}
```
