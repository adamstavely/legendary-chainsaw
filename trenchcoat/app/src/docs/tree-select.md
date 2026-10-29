---
pattern: combobox
status: new
related: combobox, filter-menu, breadcrumbs, tag-input
---

## Overview

A field for picking from a hierarchy: subject categories, folders, org units, regions. Closed, it shows the picked
option's whole path – “Sciences › Physics › Optics” – so people know which Optics they chose. Open, it shows the
tree: branches fold and unfold, typing filters it while keeping the parents of every match, and with `multiple`
every row has a checkbox, where checking a parent checks everything beneath it. It is a form control: it submits its
value under `name`, checks `required`, and resets with the form.

## When to use

- The options form a hierarchy, and where an option sits matters for picking it (two “General” folders in
  different places).
- Picking several branches and leaves at once, such as the subjects a reading list covers.
- Long hierarchies people search more than they browse.

## When not to use

- A flat list – use `combobox`.
- Narrowing a list or a table by several facets – use `filter-menu`.
- Showing where someone is in a hierarchy, not choosing from it – use `breadcrumbs`.
- Free-text labels people make up as they go – use `tag-input`.

## Anatomy

1. **Label** `.ui-tsel__label` – names the field; a page `<label for>` works too
2. **Field** `.ui-tsel__field` – the picked path, or chips and “+N more” with `multiple`
3. **Clear** `.ui-tsel__clear` – × to clear what's picked
4. **Popover** `.ui-tsel__pop` – the filter and the tree, the width of the field
5. **Filter** `.ui-tsel__filter` – type to narrow the tree
6. **Tree item** `.ui-tsel__item` – one option: its twisty, its checkbox with `multiple`, its label and description
7. **Footer** `.ui-tsel__foot` – with `multiple`, the count and Clear

## Looks

Standard sets the field in the gray tray and the tree on a white card inside a tray. Clean is a white field and one
white popover. Both indent each level by `--tc-tsel-indent`, which a page can override on `tc-tree-select`; below
380px the indent tightens and descriptions hide.

## Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ / Enter / Space (field) | Opens the tree and focuses the picked option, or the first |
| ↓ / ↑ | Next or previous visible option; ↑ from the first goes to the filter |
| → | Unfolds a branch; on an unfolded branch, moves to its first child |
| ← | Folds a branch; otherwise moves to the parent |
| Home / End | First or last visible option |
| * | Unfolds every branch beside the focused one |
| Enter / Space | Picks the option (closes the tree), or with `multiple` checks or unchecks it |
| Any letter | Types into the filter |
| Escape | In the filter: clears it, then closes; in the tree: closes and returns to the field |
| Delete / Backspace (field) | Clears the value |

## Screen readers

The field is a select-only `combobox` with `aria-haspopup="tree"`, named by its label and the picked path. The
popover holds a `tree` whose items carry `aria-level`, `aria-setsize`, `aria-posinset` and, on branches,
`aria-expanded`. One item is focusable at a time. A single pick is `aria-selected`; with `multiple` the tree is
`aria-multiselectable` and each item `aria-checked` – “mixed” for a parent with some children checked. A polite
status confirms picks (“Sciences, Physics selected”, “Optics checked. 3 selected”).

## Content

- Label the field with what's chosen, as a noun: “Subject”, “Folder”.
- Keep labels short and unique among their siblings; use `description` for what tells similar options apart.
- Mark options people can see but not pick as `disabled`, rather than leaving them out, so the tree reads the same
  for everyone.

## Do

- Use `multiple` with `cascade` when picking a parent means “all of it”.
- Give ids that stay the same when labels change, so stored values keep working.

## Don't

- Don't nest deeper than about four levels – people lose their place.
- Don't use it for a handful of options that would fit as radio buttons.

## Example

```html
<tc-tree-select label="Subject" name="subject"></tc-tree-select>

<script type="module">
  import "trenchcoat/tree-select";
  import "trenchcoat/tokens.css";

  const field = document.querySelector("tc-tree-select");
  field.options = [
    { id: "sciences", label: "Sciences", children: [{ id: "optics", label: "Optics" }, { id: "botany", label: "Botany" }] },
    { id: "maps", label: "Maps & atlases" },
  ];
  field.value = "optics";
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { TreeSelect, type TreeOption, type TreeSelectValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const subjects: TreeOption[] = [
  { id: "sciences", label: "Sciences", children: [{ id: "optics", label: "Optics" }, { id: "botany", label: "Botany" }] },
  { id: "maps", label: "Maps & atlases" },
];

export function Subjects() {
  const [value, setValue] = useState<TreeSelectValue>(["optics"]);
  return <TreeSelect label="Covers" multiple options={subjects} value={value} onChange={setValue} />;
}
```
