---
pattern: listbox
status: new
related: team-flag-editor, combobox, tag-input, file-summary
---

## Overview

Picks one of a team's flags for a file. A small button shows the flag's colour and name, and opens a list of the team's
flags with what each one means, so people choose by meaning and not by remembering what orange stands for. The team
defines the flags in `team-flag-editor`.

## When to use

- A file, document or record that carries one shared, team-defined marker.
- A table or list of files, with one picker in each row.

## When not to use

- Several free-text labels on one item – use `tag-input`.
- Defining the flags – use `team-flag-editor`.
- A long list of values to search – use `combobox`.

## Anatomy

1. **Button** `.ui-tfp__trigger` – the flag's colour and name
2. **Popover** `.ui-tfp__pop` – what opens from it
3. **List** `.ui-tfp__list` – No flag, then the team's flags
4. **Option** `.ui-tfp__option` – a flag's name and `.ui-tfp__meaning`, with `.ui-tfp__check` on the current one
5. **Manage** `.ui-tfp__manage` – the link to the team's flags, with `manageable`

## Looks

The same control in Standard and Clean, drawn from the shared secondary-button and menu tokens. A page can set
`--tc-tfp-list-width`.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the button | Opens the list, on the current flag |
| ↑ ↓ | Move through the list |
| Home / End | Go to the first or last option |
| Enter / Space on an option | Picks it and closes the list |
| Escape | Closes the list and returns to the button |

## Screen readers

The button names the flag and the file, and says it opens a dialog holding a `listbox` named for that file. Each option
is an `option` with `aria-selected`. Colour is decorative: the name always says which flag it is, and `role="status"`
announces a pick.

## Content

Pass the same `flags` to every picker on a page. A file whose flag has been removed shows "Removed flag" with an empty
flag, and keeps its value until someone picks again, so your data isn't changed without anyone choosing to.

## Do

- Give `file-name`, so a row of pickers can be told apart by ear.
- Set `manageable` only for people who may edit the team's flags, and open the editor on `tc-manage`.

## Don't

- Don't use colour alone to show a flag elsewhere on the page. Show its name too.

## Example

```html
<tc-team-flag-picker id="flag" file-name="Q3 audit.pdf" value="review"></tc-team-flag-picker>

<script type="module">
  import "trenchcoat/team-flag-picker";
  import "trenchcoat/tokens.css";

  const picker = document.querySelector("#flag");
  picker.flags = [{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }];
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { TeamFlagPicker, type TeamFlag } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const flags: TeamFlag[] = [{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }];

export function FileFlag() {
  const [value, setValue] = useState<string | null>("review");
  return <TeamFlagPicker flags={flags} value={value} fileName="Q3 audit.pdf" onValueChange={(next) => setValue(next)} />;
}
```
