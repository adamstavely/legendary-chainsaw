---
pattern: form
status: beta
related: checkbox, segmented-control, data-controls, integration-settings
---

## Overview

On or off for something that applies right away – a feature, a notification, a mode. A label and an optional second
line, with the switch before them (the default) or, with `placement="end"`, at the far end of a full-width settings
row with the words on the left. The thumb stretches a little while it's pressed.

## When to use

- Settings that take effect the moment they're flipped: notifications, features, a mode.
- Settings rows with the label on the left and the switch on the right – `placement="end"`.

## When not to use

- Choices saved later with a form, or agreeing to something – use the Checkbox.
- More than two states – use the Segmented Control or the Select.
- Stopping a running system – use the Kill Switch, which confirms what it halts.

## Anatomy

1. **Row** `.ui-switch__row` – the label element: the switch and the words, clickable as one.
2. **Words** `.ui-switch__text` – the label and the second line.
3. **Label** `.ui-switch__label` – names the switch.
4. **Second line** `.ui-switch__description` – describes it.

## Looks

Standard and Clean draw the same track and thumb from the switch tokens (`--tc-switch-w`, `--tc-switch-h`,
`--tc-switch-knob`, `--tc-switch-on`, `--tc-switch-off`). `--tc-switch-stretch` sets how far the thumb stretches while
pressed; under reduced motion it doesn't.

## Keyboard

| Key | Does |
| --- | --- |
| Tab / Shift+Tab | Moves to and from the switch |
| Space | Turns it on or off |

## Screen readers

A native checkbox with `role="switch"`, named by its label and described by its second line, read as "on" or "off".

## Content

- Name the thing being switched, not the action: "Email digest", not "Turn on email digest".
- Use the second line for what it does or when: "Once a day, at 8:00".

## Do

- Apply the change at once, and say so if it can fail.
- Line switches up at the end of their rows in a settings list, so the eye can run down one column.
- Keep `value` application-owned with `value` and `onChange`, or start it with `defaultValue`.

## Don't

- Don't ask for a Save after flipping a switch – use a checkbox in a form instead.
- Don't mix start and end placement in the same list.

## Example

```html
<tc-switch id="caching" label="Enable caching"></tc-switch>
<tc-switch id="digest" label="Email digest" description="Once a day, at 8:00" placement="end"></tc-switch>

<script type="module">
  import "@adamstavely/trenchcoat/switch";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#caching");
  el.value = true;
  el.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
  document.querySelector("#digest").addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { Switch } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Example() {
  return (
    <>
      <Switch label="Enable caching" defaultValue />
      <Switch label="Email digest" description="Once a day, at 8:00" placement="end" />
    </>
  );
}
```
