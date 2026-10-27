---
pattern: listbox
status: stable
related: chat-composer, answer-arena, segmented-control, combobox
---

## Overview

The model menu of an AI chat. A small trigger – the model's glyph, its name and a chevron – sits in the composer's
toolbar and opens a menu with one row per model. Each row carries three small bars for Speed, Quality and Cost that
fill when you point at it, and the line at the bottom says what that model costs you: the time to the first token
and the price per million tokens, rolling to new numbers as you move. Extended thinking and Web search are switches
below the list; turning thinking on unfolds an Effort control (Low / Medium / High) and stretches the first-token
time to match.

## When to use

- Letting people choose which model answers, inside a chat composer or a prompt field.
- When the trade-off between speed, quality and cost should be visible at the moment of choosing.
- Pairing the model choice with the two settings people change most: thinking and web search.

## When not to use

- Comparing two models' answers to the same prompt – use `answer-arena`.
- A long list of options people search by typing – use `combobox`.
- Two or three plain options that all fit on screen – use `segmented-control`.

## Anatomy

1. **Trigger** `.ui-mdp__trigger` – the chosen model's glyph and name; a bulb shows while thinking is on
2. **Menu** `.ui-mdp__pop` – the popover that unfolds from the trigger
3. **Model row** `.ui-mdp__option` – name, one-line description, and a check on the chosen model
4. **Strength bars** `.ui-mdp__bars` – Speed, Quality and Cost from 1 to 5; “Varies” for a router like Auto
5. **Switch** `.ui-mdp__toggle` – Extended thinking or Web search
6. **Effort** `.ui-mdp__segmented` – Low / Medium / High, shown while thinking is on
7. **Cost line** `.ui-mdp__foot` – first-token time and price of the model you point at

## Looks

Standard puts the list and switches on a white card inside a gray tray, with the cost line on the tray below it.
Clean drops the tray: one white popover with hairline shadows and a blue accent, the cost line as its last row, icons
a size larger with thinner lines, and an Effort fill measured to sit under the chosen level. Both open the same menu
and use the same keys.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger: opens the menu with focus on the list, or closes it. In the list: picks the active model and closes the menu |
| ↓ / ↑ | On the trigger: opens the menu. In the list: moves to the next or previous model, wrapping round |
| Home / End | In the list: first or last model |
| Tab | Moves from the list to the switches and the Effort control; leaving the menu closes it |
| ← / → or ↑ / ↓ | In Effort: picks the previous or next level |
| Escape | Closes the menu and returns focus to the trigger |

## Screen readers

The trigger names the choice (“Model: Atlas, extended thinking”) with `aria-haspopup="dialog"` and
`aria-expanded`. The menu is a `dialog` named “Model settings” holding a `listbox` named “Model”; the list keeps focus
and `aria-activedescendant` points at the active row. Each option's name adds what the bars and the cost line show
(“Atlas Balanced for everyday work. Speed 4, quality 4, cost 3 of 5, about 0.9s to the first token, $15 per million
tokens”), and the chosen one is `aria-selected`. Extended thinking and Web search are `switch`es; Effort is a
`radiogroup`. A status region confirms a pick: “Atlas selected”.

## Content

- Keep model names short – they sit in the trigger next to the message.
- Write `description` as what the model is good for, in a few words: “Hardest problems, deep reasoning”.
- Rate strengths relative to the other models in the list, and leave all three out for a router.
- Give `latencyMs` without thinking; the menu multiplies it for the chosen effort.

## Do

- Put the menu above the trigger (`side="top"`) when the composer sits at the bottom of the screen.
- Use `align="end"` when the trigger sits at the right edge of the toolbar.
- Give each model an `icon` so the trigger is recognisable at a glance.

## Don't

- Don't list more than about six models – the bars stop being comparable.
- Don't put unrelated settings in the menu; it holds the model, thinking and web search only.
- Don't leave strengths out of a real model – a row without bars reads “Varies”, which is meant for a router.

## Example

```html
<tc-model-picker id="model" value="atlas" side="top"></tc-model-picker>

<script type="module">
  import "trenchcoat/model-picker";
  import "trenchcoat/tokens.css";

  const picker = document.querySelector("#model");
  picker.models = [
    { id: "auto", name: "Auto", description: "Picks the right model per message" },
    { id: "atlas", name: "Atlas", description: "Balanced for everyday work", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 15 },
    { id: "atlas-mini", name: "Atlas Mini", description: "Fast answers, lowest cost", speed: 5, quality: 3, cost: 1, latencyMs: 350, pricePerM: 1.25 },
  ];
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { ModelPicker, type ModelEffort, type PickerModel } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const models: PickerModel[] = [
  { id: "auto", name: "Auto", description: "Picks the right model per message" },
  { id: "atlas", name: "Atlas", description: "Balanced for everyday work", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 15 },
];

export function ComposerModel() {
  const [model, setModel] = useState("atlas");
  const [thinking, setThinking] = useState(false);
  const [effort, setEffort] = useState<ModelEffort>("medium");
  return (
    <ModelPicker
      models={models}
      value={model}
      onChange={setModel}
      thinking={thinking}
      onThinkingChange={setThinking}
      effort={effort}
      onEffortChange={setEffort}
      side="top"
    />
  );
}
```
