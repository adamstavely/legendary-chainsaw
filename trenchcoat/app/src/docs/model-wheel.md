---
pattern: none
status: stable
related: logo-cluster, integration-beam, model-picker
---

## Overview

An illustration that shows a product works with many AI models: the models' names and marks sit on a drum that
turns one model at a time, the rows bending away and fading at the top and bottom. The model in the middle sits on a
soft gray fill that grows or shrinks to the length of its name. It turns once round the drum and rests; people can
also grab it and spin it, and a flick keeps it turning until it snaps onto the closest model. It ships with eight
models and takes your own list.

## When to use

- On a landing, pricing or onboarding page, to say “bring any model” without a table of logos.
- Beside copy about model choice or routing, where the turning drum stands for switching between them.

## When not to use

- To let people pick the model a feature uses – use `model-picker`.
- To show which tools or services connect to the product – use `logo-cluster` or `integration-beam`.

## Anatomy

1. **Fill** `.ui-mw-fill` – the soft gray pill behind the model in the middle, sized to its name
2. **Drum** `.ui-mw-drum` – the turning cylinder, faded towards the top and bottom
3. **Row** `.ui-mw-row` – one model: its mark and its name

## Keyboard

Nothing to operate from the keyboard – the wheel takes no focus. Spinning it by pointer or touch is a flourish; it
carries no information that isn't in the page's text.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and screen readers skip it. Set `label` and the host becomes
`role="img"` named by it (“Works with Claude, ChatGPT, Gemini and more”); the rows themselves stay hidden.

## Do

- Give it at least seven models, so the drum stays full above and below the middle.
- Set `label` when the wheel is the only place the page says which models are supported.
- Leave `turns` at its default, so the wheel stops by itself (WCAG 2.2.2).

## Don't

- Don't set `turns` to `Infinity` on a page people read for a while – the movement pulls the eye.
- Don't put models on it that the product doesn't support.
- Don't make it the only list of supported models – the drum shows a few at a time; list them in text as well.

## Example

```html
<tc-model-wheel id="models" hold="2000" label="Works with Claude, ChatGPT, Gemini and more"></tc-model-wheel>

<script type="module">
  import "trenchcoat/model-wheel";
  import "trenchcoat/tokens.css";

  const wheel = document.querySelector("#models");
  wheel.turns = 3;
</script>
```

```tsx
import { ModelWheel, modelWheelDefaults } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const models = modelWheelDefaults.filter((m) => m.name !== "Perplexity");

export function Models() {
  return <ModelWheel models={models} hold={2000} label="Works with Claude, Gemini and more" />;
}
```
