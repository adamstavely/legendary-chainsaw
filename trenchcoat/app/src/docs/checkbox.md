---
pattern: form
status: beta
related: switch, radio-group, segmented-control, terms-dialog
---

## Overview

A yes / no choice that's saved with a form: a box, its label and an optional second line. Three extras cover the cases
a bare checkbox doesn't:

- **Partly checked.** `indeterminate` shows a dash – a Select all over a list where only some items are picked.
  Clicking it checks it.
- **Card.** `variant="card"` draws the choice as a bordered row you can click anywhere on, tinted once it's checked –
  for a short list of options with a line of explanation each.
- **Error.** `error-message`, or a required box left empty when the form checks it, shows an error under the choice.

The check draws itself when it's ticked.

## When to use

- Yes or no choices that are saved with a form: agreeing to terms, opting in, picking several items of a list.
- Select all over a list, with the partly checked state while only some of it is picked.
- A handful of options with a sentence each, as card rows.

## When not to use

- A setting that applies the moment it's flipped – use the Switch.
- One choice out of several – use the Radio Group, the Segmented Control or the Select.
- A long list to filter and pick from – use the Combobox or the Filter Menu.

## Anatomy

1. **Row** `.ui-checkbox__row` – the label element: the box and the words, clickable as one; a bordered card with
   `variant="card"`.
2. **Box** `.ui-checkbox__box` – the native checkbox, drawn with tokens.
3. **Tick** `.ui-checkbox__tick` – the check (drawn in when ticked) and the dash for partly checked.
4. **Label** `.ui-checkbox__label` – names the checkbox.
5. **Second line** `.ui-checkbox__description` – describes it.
6. **Error** `.ui-checkbox__error` – what's wrong, under the row.

## Looks

Standard fills a ticked box with the inverse surface; Clean fills it with the accent. Both draw the card row the same
way: a hairline edge that turns into the selected border and an accent tint once checked. `--tc-checkbox-tick` sets the
size of the check and the dash.

## Keyboard

| Key | Does |
| --- | --- |
| Tab / Shift+Tab | Moves to and from the checkbox |
| Space | Checks or unchecks it; a partly checked box becomes checked |

## Screen readers

A native checkbox named by its label (`aria-labelledby`) and described by its second line and its error
(`aria-describedby`). A partly checked box reads as "mixed". With an error it's `aria-invalid`. The tick is decorative.

## Content

- Write the label as the thing that becomes true: "Include citations", "Email me the weekly digest".
- Keep the second line to what the person needs to decide – what it costs, when it happens.
- Say how to fix an error: "Accept the terms to go on", not "Invalid".

## Do

- Use the partly checked state only for a parent over a list, and set it from the list's own state.
- Use card rows for two to six options with a line each.
- Keep `value` application-owned with `value` and `onChange`, or start it with `defaultValue`.

## Don't

- Don't use a checkbox for something that takes effect at once – that's a Switch.
- Don't leave `indeterminate` on once every item or none is picked.
- Don't treat a checked box as consent the server can trust; check it there too.

## Example

```html
<tc-checkbox id="all" label="Select all" description="12 of 30 vendors picked" indeterminate></tc-checkbox>
<tc-checkbox id="digest" variant="card" label="Weekly digest" description="Every Monday at 8:00"></tc-checkbox>

<script type="module">
  import "@adamstavely/trenchcoat/checkbox";
  import "@adamstavely/trenchcoat/tokens.css";

  const all = document.querySelector("#all");
  all.addEventListener("tc-value-change", (e) => console.log("select all", e.detail.value));
  document.querySelector("#digest").addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { Checkbox } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Example() {
  const [picked, setPicked] = useState(12);
  const all = picked === 30;
  return (
    <>
      <Checkbox label="Select all" description={`${picked} of 30 vendors picked`} value={all} indeterminate={picked > 0 && !all} onChange={(v) => setPicked(v ? 30 : 0)} />
      <Checkbox variant="card" label="Weekly digest" description="Every Monday at 8:00" defaultValue />
    </>
  );
}
```
