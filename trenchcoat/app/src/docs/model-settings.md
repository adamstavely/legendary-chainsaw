---
pattern: slider
status: new
related: model-picker, model-routing, instruction-editor, segmented-control
---

## Overview

Sets how one model generates – temperature, top-p, output length, reasoning effort – for the model the app says is
in use. Only the parameters that model supports are shown, each with a plain line on what it does, so people don't
tune a setting the model ignores. A strip at the top shows every value against its range with the default and the
presets marked, presets set several values at once, and the component says when two settings fight each other or a
value is set that the model will drop. A read-back at the bottom lists what differs from the defaults, with Reset
all. It is a form control: with `name` it submits the supported values as JSON.

## When to use

- A settings page or playground where people tune generation for a configured model.
- Next to `instruction-editor` when people adjust a prompt and its sampling together.
- Anywhere a team needs to see at a glance which settings were moved from the defaults.

## When not to use

- Choosing which model to use – use `model-picker`.
- Deciding which model each request goes to – use `model-routing`.
- One option out of two to five, with nothing else around it – use `segmented-control`.

## Anatomy

1. **Header** `.tc-head` – a sliders icon, the title and the model with its one-line description
2. **Signature** `.ui-mset__profile` – with `signature` set: each value on its range, the default as a tick, presets as letters
3. **Presets** `.ui-mset__presets` – Precise, Balanced, Creative, or Custom once a value moves
4. **Parameter** `.ui-mset__param` – the label, its value, what it does and the control, with Reset when changed
5. **Feedback** `.ui-mset__issues` – conflicting settings and values the model ignores
6. **Changes** `.ui-mset__summary` – what differs from the defaults, with Reset all

## Looks

Standard is a white card on a gray tray: the signature sits in a gray well, values are in filled chips, the slider
fill and the picked preset letter are ink. Clean is one white card with hairline dividers: the signature has a
hairline frame, values are plain text, the slider fill and the picked preset are the accent, and the read-back of
changes is accent-tinted. In a narrow container the signature puts each name above its track.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the presets, each parameter's control and Reset, Clear on an ignored value, and Reset all |
| ← / → / ↑ / ↓ | On a slider: the value down or up by one step; on the presets or a choice: the previous or next option |
| Page Up / Page Down | On a slider: a larger step, as the browser sets it |
| Home / End | On a slider: the minimum or maximum; on the presets or a choice: the first or last option |
| Space / Enter | On a Reset, Clear or Reset all button: does it |

The sliders are native range inputs, so their keys are the browser's own.

## Screen readers

The host is a group named by the heading. Each slider is named by its label, described by its line, and reads its
value with its unit through `aria-valuetext` (“4,096 tokens”). The presets and each choice are radiogroups named by
their label. A Reset button is named for what it does – “Reset temperature to 1.0”. The signature strip is hidden
from assistive tech: the controls say the same in words. A status region announces presets applied and resets –
“Precise preset applied”, “Temperature reset to 1.0”, “Every setting is back to its default” – but not every slider
step.

## Content

- Describe each parameter by its effect on the answer, not its maths: “How much the wording varies between answers”.
- Give the model a one-line `description` that says what kind of model it is – “Reasoning model · works a problem
  through before it answers”.
- Write `ignores` reasons for the app's real behaviour: “Reasoning models choose their own sampling.”
- Keep preset descriptions to what they're for: “for extraction, classification and facts”.

## Do

- Pass the model's real `supports` list and its own `defaults`, so people see what the provider accepts.
- Add your own `conflicts` for pairs your provider warns about.
- Store only `value` – the settings people changed – and let the defaults fill the rest when you call the model.

## Don't

- Don't offer the model's reasoning or chain of thought as something to configure, show or export – reasoning effort
  sets how much work it does, nothing more.
- Don't show parameters the model ignores to keep a layout tidy; leave them out and let the component say they're
  unavailable.
- Don't add more than three or four presets; they share one row.

## Example

```html
<tc-model-settings id="settings" name="generation"></tc-model-settings>

<script type="module">
  import "trenchcoat/model-settings";
  import "trenchcoat/tokens.css";

  const settings = document.querySelector("#settings");
  settings.heading = "Reply drafts";
  settings.model = { id: "atlas-2", label: "Atlas 2", description: "General model", supports: ["temperature", "topP", "maxOutputTokens"] };
  settings.value = { temperature: 0.4 };
  settings.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.changed));
</script>
```

```tsx
import { useState } from "react";
import { ModelSettings, type ModelSettingsModel, type ModelSettingsValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const model: ModelSettingsModel = { id: "atlas-2", label: "Atlas 2", supports: ["temperature", "topP", "maxOutputTokens"] };

export function DraftSettings() {
  const [value, setValue] = useState<ModelSettingsValue>({ temperature: 0.4 });
  return <ModelSettings title="Reply drafts" model={model} value={value} onChange={(next) => setValue(next)} />;
}
```
