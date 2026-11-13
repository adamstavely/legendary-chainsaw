---
pattern: form
status: new
related: embed-widget, color-picker, tag-input, code-block
---

## Overview

Style the chat widget a site embeds, beside a live preview of it. The settings are on the left: the title, the
greeting, up to four starter prompts, the accent colour, the corner it sits in, the corner radius, the launcher's
words and the domains it may load on. On the right, the widget itself (`embed-widget`), open, shows each change as
it's made – and answers a test message to say it's a preview. Under both is the install snippet: a script tag whose
data attributes carry the settings, ready to copy.

The accent is checked as you pick it, in words: whether text on it is readable (the widget puts dark or white text on
it, whichever reads better) and whether the launcher stands out on a white page. Domains are checked as host names –
`help.example.org`, `*.example.org` or `localhost`.

## When to use

- The settings page where a team sets up the chat widget for its website.
- Letting people see the widget with their brand before they install it.

## When not to use

- The widget on the site itself – use `embed-widget`.
- The settings of an agent's behaviour (its instructions, tools or model) – use `instruction-editor`,
  `tool-permissions` or `model-settings`.
- Picking a colour alone – use `color-picker`.

## Anatomy

1. **Header** `.tc-head` – the icon, the heading and a line under it
2. **Settings** `.ui-emc__settings` – labelled rows `.ui-emc__row`, a label `.ui-emc__label` beside each control
3. **Starter prompts** `.ui-emc__starters` – a field per prompt `.ui-emc__starter` with Move up, Move down and Remove, and Add a prompt `.ui-emc__add`
4. **Accent** `.ui-emc__accent` – the swatch, its hex and Change, which opens the colour picker `.ui-emc__picker`
5. **Contrast** `.ui-emc__checks` – what the colour means for text and for the launcher, with a mark and words
6. **Radius** `.ui-emc__range` – a slider with the value in px
7. **Preview** `.ui-emc__preview` – the open widget on a sunken stage `.ui-emc__stage`
8. **Install snippet** `.ui-emc__snippet` – the script tag in a code block with Copy

## Looks

Standard puts the header on a gray tray above one white card that holds the settings, the preview and the snippet;
Clean is one white card with the header as its first row. The preview sits on a sunken surface in both, so the widget
reads as something placed on a page. Below 760px the preview goes under the settings, and below 480px the labels go
above their fields. `--tc-emc-label-w` sets the label column (132px).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the settings, the preview and the snippet's Copy |
| Enter / Space on Move up / Move down | Moves the prompt; focus stays with it |
| Enter / Space on Change | Opens or closes the colour picker under the swatch |
| ← / → on the corner | Picks Right or Left |
| ← / → on the radius | Changes it by 1px |
| Enter or , in the domains | Adds the domain, or says why it can't be added |

## Screen readers

Each setting is a labelled field. The starter prompts are a group named "Starter prompts", and each prompt's field
and buttons say which prompt they belong to ("Move up, Prompt 2"); moving one is announced ("Moved to 1 of 3"). Change
has `aria-expanded` and controls the picker. The contrast lines are text, with their marks hidden. The radius slider
reads its value in px. The preview is the widget, with its own dialog and log, under a "Preview" heading.

## Content

- Keep the title short – it's the widget's header on a phone too.
- Starter prompts read best as questions a visitor would ask, three or four at most.
- Add every domain the widget may load on, including staging sites while you test.

## Do

- Fix the accent when the contrast line warns – visitors read their own messages on it.
- Copy the snippet after the last change; it's rebuilt from the settings each time.
- Control `value` and save it, so the settings survive a reload.

## Don't

- Don't paste URLs into the domains – just the host, such as `help.example.org`.
- Don't use the preview to test real answers; it only says it's a preview.

## Example

```html
<tc-embed-configurator id="widget" heading="Help widget" widget-id="inst-help"></tc-embed-configurator>

<script type="module">
  import "@adamstavely/trenchcoat/embed-configurator";
  import "@adamstavely/trenchcoat/tokens.css";

  const widget = document.querySelector("#widget");
  widget.value = {
    title: "Ask the Institute",
    greeting: "Hi! I can help with visits, data requests and publications.",
    starters: ["When is the reading room open?", "How do I request a dataset?"],
    accent: "#0f766e",
    position: "right",
    radius: 16,
    launcherLabel: "Chat with us",
    domains: ["institute.example.org"],
  };
  widget.addEventListener("tc-value-change", (e) => console.log(e.detail.field, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { EmbedConfigurator, defaultEmbedConfig, type EmbedConfig } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function WidgetSettings({ save }: { save: (value: EmbedConfig) => void }) {
  const [value, setValue] = useState<EmbedConfig>({ ...defaultEmbedConfig, title: "Ask the Institute", accent: "#0f766e" });
  return (
    <EmbedConfigurator
      title="Help widget"
      widgetId="inst-help"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        save(next);
      }}
    />
  );
}
```
