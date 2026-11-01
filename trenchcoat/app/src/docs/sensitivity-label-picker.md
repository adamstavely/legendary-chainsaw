---
pattern: listbox
status: new
related: team-flag-picker, share-panel, file-details, access-review
---

## Overview

Sets a file's classification. A small button shows the label's mark and word, and opens a list with what each label means.
Raising it happens at once, and lowering it first asks why, because it may let more people see the file.

## When to use

- Classifying files or records as Public, Internal, Confidential or Restricted, or your own levels.
- A row in a file list, or a file's details.

## When not to use

- A team's own markers, with no order to them – use `team-flag-picker`.
- Choosing who can see a file – use `share-panel`.

## Anatomy

1. **Button** `.ui-slp__trigger` – `.ui-slp__mark` and `.ui-slp__label`
2. **List** `.ui-slp__list` – the labels, least sensitive first
3. **Option** `.ui-slp__option` – `.ui-slp__name` and `.ui-slp__about`
4. **Reason** `.ui-slp__ask` – asked before lowering, with a required `.ui-slp__reason`

## Looks

The same control in Standard and Clean, drawn from the shared button and menu tokens. A page can set
`--tc-slp-list-width` and `--tc-slp-mark`. A label's `color` overrides the mark's colour.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the button | Opens the list, on the current label |
| ↑ ↓ / Home End | Move through the list |
| Enter / Space on a label | Picks it, or asks why if that lowers it |
| Escape | Closes the list and returns to the button |

## Screen readers

The button names the label and the file. The list is a `listbox` with `aria-selected`. The level is shown as filled bars and
the label's word, so colour is never the only cue. The reason is `aria-required`, and `role="status"` announces changes.

## Content

Use `description` to say who a label is for. Set `level` so higher means more sensitive: it decides what counts as lowering.

## Do

- Store `reason` and `direction` from `tc-value-change` for your audit trail.
- Apply what a label means on the server, and use it in `share-panel`'s entitlement check.

## Don't

- Don't treat the label as enforcement. It records the choice.

## Example

```html
<tc-sensitivity-label-picker id="label" file-name="Q3 audit.pdf" value="internal"></tc-sensitivity-label-picker>

<script type="module">
  import "trenchcoat/sensitivity-label-picker";
  import "trenchcoat/tokens.css";

  document.querySelector("#label").addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.reason));
</script>
```

```tsx
import { useState } from "react";
import { SensitivityLabelPicker } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function FileLabel() {
  const [value, setValue] = useState<string | null>("internal");
  return <SensitivityLabelPicker fileName="Q3 audit.pdf" value={value} onValueChange={(next) => setValue(next)} />;
}
```
