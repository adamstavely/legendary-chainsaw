---
pattern: combobox
status: react-twin
related: command-menu, filter-menu, mention-picker, segmented-control
---

## Overview

A field for picking one or many options from a list that's too long to scan. People type to filter, pick with
the keyboard or the pointer, and see what they picked as chips in the field. Options can carry an avatar, a colour
dot or an icon, sit under group headings, and match on extra keywords – and the combobox can offer to create an
option that doesn't exist yet. It is a form control: it submits its values under `name`, checks `required`, and
resets with the form.

## When to use

- Assigning people, labels, tags or projects, where the list has more than about ten options.
- Picking several values at once and seeing them all in place.
- Lists that grow as people use them – turn on `creatable` to add what's missing.

## When not to use

- Two to five options that all fit on screen – use `segmented-control` (one choice) or checkboxes.
- Running commands or jumping somewhere – use `command-menu`.
- Narrowing a list or a table by several facets at once – use `filter-menu`.
- Mentioning people or files inside text someone is writing – use `mention-picker`.

## Anatomy

1. **Label** `.ui-cbx__label` – names the field; a page `<label for>` works too
2. **Field** `.ui-cbx__field` – the chips and the text input together
3. **Chip** `.ui-cbx__chip` – one picked option, with × to remove it
4. **Input** `.ui-cbx__input` – where people type to filter
5. **Toggle** `.ui-cbx__toggle` – opens and closes the list
6. **List** `.ui-cbx__pop` – the grouped options, the typed text marked in each

## Looks

Standard sets the field in the gray tray and lets it grow line by line as chips are added. Clean is a white field
with a hairline shadow that stays one line high; chips that don't fit fold into a “+N” count. Both open the same
list, glide to their new height, and use the same keys.

## Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Opens the list; then moves to the next or previous option |
| Enter | Picks the active option (or removes it, if it's picked already) |
| Escape | Closes the list; with the list closed, clears what was typed |
| Backspace | In an empty input: the first press marks the last chip, the second removes it |
| Tab | Closes the list and moves on |

## Screen readers

The input is the combobox: `aria-expanded` says whether the list is open, `aria-controls` points at the listbox and
`aria-activedescendant` at the active option, so focus never leaves the input. Picked options are
`aria-selected`. A polite live region confirms each pick and removal with the new count (“Maya Chen selected. 2
selected”), and the first Backspace says which chip it marked (“Bug – press Backspace again to remove”).

## Content

- Label the field with what's being picked, as a noun: “Assignees”, “Labels” – not “Select assignees”.
- Use `hint` for what tells two options apart (a role, an email), not for a description of every option.
- Keep option labels short; put synonyms people might type in `keywords`.
- Write `emptyText` for the list: “No one found” reads better than the default “No results” – the combobox adds
  “for ‘…’” with what was typed.

## Do

- Group long lists (`group`) so people can find their place.
- Give each person an avatar and each label a colour, so chips are recognisable at a glance.
- Use `single` when exactly one value makes sense – the field then shows one choice and closes after a pick.

## Don't

- Don't use it for fewer than about six options – a visible choice is faster.
- Don't put actions (“Delete project”) in the list next to values.
- Don't hide which options are picked: keep the chips visible, or use Clean's “+N” for the overflow.

## Example

```html
<label for="assignees">Assignees</label>
<tc-combobox id="assignees" name="assignees"></tc-combobox>

<script type="module">
  import "trenchcoat/combobox";
  import "trenchcoat/tokens.css";

  const field = document.querySelector("#assignees");
  field.options = [
    { value: "maya", label: "Maya Chen", hint: "Design lead", avatar: true, group: "Design" },
    { value: "jonas", label: "Jonas Weber", hint: "Frontend", avatar: true, group: "Engineering" },
  ];
  field.value = ["maya"];
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { Combobox, type ComboboxOption } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const people: ComboboxOption[] = [
  { value: "maya", label: "Maya Chen", hint: "Design lead", avatar: true, group: "Design" },
  { value: "jonas", label: "Jonas Weber", hint: "Frontend", avatar: true, group: "Engineering" },
];

export function Assignees() {
  const [value, setValue] = useState(["maya"]);
  return <Combobox label="Assignees" options={people} value={value} onChange={setValue} />;
}
```
