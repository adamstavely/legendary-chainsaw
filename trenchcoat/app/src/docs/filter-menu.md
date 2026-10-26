---
pattern: checkbox
status: react-twin
related: combobox, data-table, segmented-control
---

## Overview

Grouped filters for narrowing a list or a table. Each facet – status, score, region – is a group that folds open
to its options as checkboxes, with a count of how many are picked; the active filters sit on top as chips people can
remove one by one, or all at once with Clear all. Every part works from the keyboard. It is a form control too: with
`name`, the picked options are submitted with the surrounding form.

## When to use

- Narrowing a list, a table or search results by several facets at once.
- Facets with a handful to a few dozen options each – long groups stay fast, rendering only the rows in view.
- A side panel or popover where people should see every active filter at a glance.

## When not to use

- Picking values for a field from a long, searchable list – use `combobox`.
- Switching between two to five views of the same thing – use `segmented-control`.
- Sorting and filtering inside the table's own columns – use `data-table`.

## Anatomy

1. **Head** `.ui-fm__head` – the heading and Clear all
2. **Chip** `.ui-fm__chips > .ui-fm__chip` – an active filter, with × to remove it
3. **Group** `.ui-fm__group-head` – a facet: its name, how many options it has and how many are picked
4. **Option** `.ui-fm__option` – a checkbox for one value of the facet
5. **Keyboard hints** `.ui-fm__hints` – the keys that work here; `hints="false"` hides them

## Looks

Standard sets the menu in a white card on a gray tray, with the keyboard hints on the tray below, dark checkboxes and
chips that wrap onto as many lines as they need. Clean is one white card: chips stay on one line – as many as fit,
then a “+N” button that shows the rest – checkboxes are smaller and blue, and the hints are the card's last row.

## Keyboard

Every group head and visible option is in the Tab order; the arrow keys move through them too.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous group head or option |
| Home / End | Moves to the first or the last row – group head or visible option |
| Enter / Space | On a group head: opens or folds the group. On an option: picks or removes it |
| → | Opens the group |
| ← | Folds the group and moves focus to its head |
| Tab | Moves through Clear all, the chips' × buttons, the group heads and options |

When a chip is removed, focus moves to the chip that took its place, so people can remove several in a row.

## Screen readers

Each group head is a button with `aria-expanded` and `aria-controls`; the options are a group named after the facet,
each a `role="checkbox"` button with `aria-checked`, and folded groups are inert. Chip buttons are named “Remove
Qualified” (with the `chipPrefix`: “Remove Score: 90–100”); Clean's “+N” is named “Show 2 more: …” with the hidden
filters, and has `aria-expanded`. After each change a status region says how many filters are on – “3 filters
active”, or “No filters”. `disabled` marks every option `aria-disabled`.

## Content

- Name groups with the facet as a noun: “Status”, “Lead score”, “Region”.
- Keep option labels short and parallel within a group; ranges read best as “80–89”, “Below 60”.
- Use `chipPrefix` where an option means nothing on its own: a chip that says “90–100” needs “Score: ”.
- Change `heading` to say what's being filtered – “Filter leads” – when the menu sits apart from the list.

## Do

- Open the groups people use most with `open` (or `defaultOpen`); unset, only the first is open.
- Show the result count next to the menu, so people see what a filter did.
- Give `name` when the filters live in a form – each pick submits as `name[groupId]`.

## Don't

- Don't use it for a single yes-or-no filter – a switch or checkbox is enough.
- Don't put more than a few dozen options in a group without search; long lists belong in `combobox`.
- Don't apply filters only on a separate Apply button – the menu reports every change as it happens.

## Example

```html
<tc-filter-menu id="filters" heading="Filter leads" name="f"></tc-filter-menu>

<script type="module">
  import "trenchcoat/filter-menu";
  import "trenchcoat/tokens.css";

  const menu = document.querySelector("#filters");
  menu.groups = [
    { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
    { id: "score", label: "Lead score", chipPrefix: "Score: ", options: [{ id: "90", label: "90–100" }, { id: "80", label: "80–89" }] },
  ];
  menu.value = { status: ["won"] };
  menu.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { FilterMenu, type FilterGroup, type FilterValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const groups: FilterGroup[] = [
  { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
  { id: "score", label: "Lead score", chipPrefix: "Score: ", options: [{ id: "90", label: "90–100" }, { id: "80", label: "80–89" }] },
];

export function LeadFilters() {
  const [value, setValue] = useState<FilterValue>({ status: ["won"] });
  return <FilterMenu title="Filter leads" groups={groups} value={value} onChange={setValue} defaultOpen={["status", "score"]} />;
}
```
