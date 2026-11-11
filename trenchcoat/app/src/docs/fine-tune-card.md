---
pattern: form
status: new
related: element-inspector, model-settings, color-picker, number-field, smart-recommendation
---

## Overview

An inspector where an agent tunes a design and the person can take over. Sections hold fields – numbers with a unit
such as width, height and radius, a percentage for opacity, a choice of text style and a row of colour swatches – under
a small preview that follows the size, corners, opacity and fill. Adjust asks the agent to tune. When it changes a
field, the number counts to its new value with a brief highlight, and an Agent marker stays on the field until the
person edits it. Revert agent changes puts back everything the agent changed.

## When to use

- An assistant adjusting a card, a chart or a layout, where people should see what it touched and be able to undo it.
- A design tool's properties panel where an agent and a person share the controls.

## When not to use

- Inspecting a real page's elements and styles – use `element-inspector`.
- Settings for a model or an agent itself – use `model-settings`.
- One colour with a full picker – use `color-picker`; one number on its own – use `number-field`.
- An agent suggesting a change people accept or dismiss before anything moves – use `smart-recommendation`.

## Anatomy

1. **Adjust** `.ui-ftc__adjust` – asks the agent to tune, in the header
2. **Preview** `.ui-ftc__preview` – the design drawn small, `.ui-ftc__shape`
3. **Section** `.ui-ftc__section` – a titled group of fields
4. **Field** `.ui-ftc__field` – one property
5. **Scrub handle** `.ui-ftc__scrub` – a number's label; drag it or use the arrows
6. **Value** `.ui-ftc__input` – the number, typed, with its `.ui-ftc__unit`
7. **Choice** `.ui-ftc__select` – a short list of options
8. **Swatches** `.ui-ftc__swatches` – the colours, `.ui-ftc__swatch`
9. **Agent marker** `.ui-ftc__agent` – on each field the agent set
10. **Revert** `.ui-ftc__revert` – puts back the agent's changes, with a count

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The fields sit on sunken wells two to a row, and one to a row when the card is narrow. The agent's changes flash an
accent ring and carry an accent Agent pill with a spark – a word, not just a colour.

## Keyboard

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | On a scrub handle: step the number; Shift steps ×10 |
| Home / End | On a scrub handle: go to the minimum or maximum |
| ↑ / ↓ | In a number's box: step it; Shift steps ×10 |
| Enter | In a number's box: commit what was typed |
| Escape | In a number's box: put back the current value |
| ← / → / ↑ / ↓ | In the swatches: move to the next colour and choose it |
| Enter / Space | Press Adjust or Revert agent changes |

## Screen readers

Each number has a slider (its scrub handle) and a text box, both named with the field's full `name` (“Width”, “Width
(px)”), and the slider reads its value with the unit. The text style is a labelled select, and the swatches are a radio
group named by their field, each swatch named by its colour. The sections are fieldsets with their titles as legends.
The preview repeats what the fields say, so it's hidden. While `adjusting` is set, a hidden status line says so.

## Content

- Give each field a short `label` (W, H, R) and a full `name` (Width, Height, Radius).
- Name swatches for what they mean – “Blue tint” – not their hex codes.
- Keep sections to a handful of fields each; split a long list into more sections.

## Do

- Set `adjusting` while the agent works, and pass its changes as `agentChanges` when it's done.
- Listen to `tc-values-change` and read `source` to tell the person's changes from the agent's.
- Keep `min` and `max` on numbers so scrubbing can't go anywhere silly.

## Don't

- Don't apply the agent's changes by setting `values` directly – they won't be marked or revertible.
- Don't remove the Agent markers yourself; they go when the person edits the field or reverts.
- Don't use it for settings that take effect somewhere people can't see – the preview is the point.

## Example

```html
<tc-fine-tune-card id="tune" heading="Findings summary"></tc-fine-tune-card>

<script type="module">
  import "@adamstavely/trenchcoat/fine-tune-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#tune");
  el.sections = [{ label: "Layout", fields: [
    { id: "w", label: "W", name: "Width", kind: "number", unit: "px", min: 120, max: 640 },
    { id: "opacity", label: "O", name: "Opacity", kind: "percent" },
  ] }];
  el.values = { w: 320, opacity: 100 };
  el.addEventListener("tc-adjust-request", () => {
    el.adjusting = true;
    // When your agent answers:
    setTimeout(() => {
      el.adjusting = false;
      el.agentChanges = [{ field: "w", to: 360 }];
    }, 800);
  });
</script>
```

```tsx
import { useState } from "react";
import { FineTuneCard, type FineTuneAgentChange, type FineTuneValues } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Tune({ agent }: { agent: FineTuneAgentChange[] }) {
  const [values, setValues] = useState<FineTuneValues>({ w: 320, opacity: 100 });
  return (
    <FineTuneCard
      title="Findings summary"
      sections={[{ label: "Layout", fields: [{ id: "w", label: "W", name: "Width", kind: "number", unit: "px" }, { id: "opacity", label: "O", name: "Opacity", kind: "percent" }] }]}
      values={values}
      agentChanges={agent}
      onValuesChange={setValues}
    />
  );
}
```
