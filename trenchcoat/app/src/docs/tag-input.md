---
pattern: combobox
status: new
related: combobox, mention-picker, stepper-form, tree-select
---

## Overview

A field of free-text chips: keywords, labels, email domains, anything people name themselves. Type and press Enter,
a comma or Tab to add what you typed; paste “a, b, c” to add three at once. `suggestions` offers known values in a
list under the field, and `allow-custom="false"` accepts only those. Tags are unique (ignoring case) by default,
`max` caps how many, and `validate` can refuse one with a reason, shown under the field. Chips are removed with ×,
with Backspace in the empty field, or with Delete on a focused chip. It is a form control: each tag is submitted
under `name`, `required` needs at least one, and it resets with the form.

## When to use

- Keywords and labels people make up as they go, with or without a set of usual values.
- A list of short values typed by hand: email domains, file extensions, hostnames.

## When not to use

- Picking from a fixed list of known options with avatars or groups – use `combobox`.
- Mentioning people inside text someone is writing – use `mention-picker`.
- One step of a longer guided form – `stepper-form` has its own tags field.
- Choosing from a hierarchy – use `tree-select`.

## Anatomy

1. **Label** `.ui-tgi__label` – names the field; a page `<label for>` works too
2. **Field** `.ui-tgi__field` – the chips and the input together
3. **Chip** `.ui-tgi__chip` – one tag, with × to remove it
4. **Input** `.ui-tgi__input` – where a new tag is typed
5. **Suggestions** `.ui-tgi__pop` – the matching suggestions, the typed text marked
6. **Error** `.ui-tgi__error` – why the last tag was refused

## Looks

Standard sets the field in the gray tray with outlined chips. Clean is a white field with filled chips in a smaller,
medium-weight type. Both grow line by line as chips are added.

## Keyboard

| Key | What it does |
|---|---|
| Enter | Adds what's typed, or the highlighted suggestion |
| , | Adds what's typed |
| Tab | With text typed: adds it; otherwise moves on |
| ↓ / ↑ | Opens the suggestions; then moves through them |
| Escape | Closes the suggestions; then clears what's typed |
| Backspace (empty input) | The first press marks the last chip, the second removes it |
| ← (at the start of the text) | Moves onto the last chip |
| ← / → (on a chip) | Previous or next chip; → past the last returns to the input |
| Delete / Backspace (on a chip) | Removes it |

## Screen readers

The input is a textbox, or a `combobox` with `aria-controls`, `aria-expanded` and `aria-activedescendant` when there
are suggestions. Chips sit in a list named after the field (“Keywords, added”); each is a button described as
“Press Delete to remove”, and each × is named “Remove Tides”. A polite status confirms adds and removals with the
count (“Added Tides. 3 tags”), and a refused tag's reason is announced and linked to the input with
`aria-describedby`.

## Content

- Label the field with what the tags are, as a plural noun: “Keywords”, “Domains”.
- Write `validate` messages that say what to do: “Keywords need at least three letters.”
- Keep suggestions to the values people reuse; they're filtered as people type.

## Do

- Pass `suggestions` from values already in use, so the same tag isn't spelled three ways.
- Use `max` when the list feeds something with a limit, and say so in the label or description.

## Don't

- Don't use tags for long text – each chip is cut at about 200px.
- Don't turn off `unique` unless repeats mean something.

## Example

```html
<tc-tag-input label="Keywords" name="keywords" max="8"></tc-tag-input>

<script type="module">
  import "trenchcoat/tag-input";
  import "trenchcoat/tokens.css";

  const field = document.querySelector("tc-tag-input");
  field.value = ["Harbours", "Tides"];
  field.suggestions = ["Archives", "Cartography", "Navigation"];
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.added, e.detail.removed));
</script>
```

```tsx
import { useState } from "react";
import { TagInput } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Keywords() {
  const [value, setValue] = useState(["Harbours", "Tides"]);
  return (
    <TagInput
      label="Keywords"
      value={value}
      onChange={setValue}
      suggestions={["Archives", "Cartography", "Navigation"]}
      validate={(text) => (text.length < 3 ? "Keywords need at least three letters." : undefined)}
    />
  );
}
```
