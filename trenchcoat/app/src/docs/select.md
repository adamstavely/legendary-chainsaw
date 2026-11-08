---
pattern: listbox
status: new
related: segmented-control, combobox, tree-select, model-picker
---

## Overview

A plain single-choice dropdown. The trigger is a secondary button showing the chosen option and a chevron, so it sits
in a page header beside other buttons; it opens a list of options under it, with a check on the chosen one and an
optional description line under each. Options can be disabled: they show, but can't be picked and the keys skip them.

## When to use

- Picking one value from a short, fixed list that doesn't all fit on screen: a reporting period, a sort order, a team.
- A filter or view setting in a page or card header, next to `button`s.
- Inside a form, with `label-visible` and `name`.

## When not to use

- Two to five options that fit side by side – use `segmented-control`.
- A long list people search by typing, or several values at once – use `combobox`.
- Options nested in a hierarchy – use `tree-select`.
- Choosing an AI model with its settings – use `model-picker`.

## Anatomy

1. **Label** `.ui-select__label` – shown above the trigger with `label-visible`, or before it on the same line with
   `label-placement="start"` as well; otherwise read by screen readers only
2. **Trigger** `.ui-select__trigger` – the chosen option's label, or the placeholder, and a chevron
3. **List** `.ui-select__list` – the options, in a popover under the trigger
4. **Option** `.ui-select__option` – label, optional description, and a check on the chosen one

## Looks

Both looks use the same trigger, list and keys. The trigger takes the secondary button's tokens and the list the menu
pattern's, so Standard's is a white button with a ring and a 32 px height, Clean's a 28 px button with a hairline
shadow; the visible label follows the fields' labels in each look.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger: opens the list with focus on it, or closes it. In the list: picks the active option and closes |
| ↓ / ↑ | On the trigger: opens the list. In the list: moves to the next or previous option, skipping disabled ones, wrapping round |
| Home / End | In the list: first or last option that can be picked |
| Letters | In the list: jumps to the next option starting with them; letters typed quickly search together |
| Escape | Closes the list and returns focus to the trigger |
| Tab | Closes the list and moves on |

## Screen readers

The trigger is a button with `aria-haspopup="listbox"` and `aria-expanded`. Its name is the label and the chosen
option: “Reporting period: This quarter” (the label in screen-reader-only text, or the visible label through
`aria-labelledby`), so the visible words are part of the name. The list is a `listbox` named by the label; it keeps
focus and `aria-activedescendant` points at the active option. Options are `option`s with `aria-selected`, and
disabled ones carry `aria-disabled`. Option ids come from their position, never from their values.

## Content

- Write option labels short and parallel: “This month”, “Last month”, “This quarter”.
- Use `description` for what isn't obvious from the label – a date range, why an option is disabled.
- Give every select a `label`, even when it isn't shown.
- Keep the placeholder a prompt (“Choose…”, “Any team”), not an option.

## Do

- Use `align="end"` when the select sits at the right edge of a header.
- Show the label (`label-visible`) inside forms, where the trigger alone doesn't say what it sets.
- In a toolbar or a page header, put the label on the trigger's line with `label-visible label-placement="start"`: a
  small caption (the `--tc-caption-*` tokens), vertically centred, with the list still opening under the trigger. The
  visible label stays optional – `label-placement` does nothing without `label-visible` (false by default), so removing
  `label-visible` turns it off and the label is the accessible name only, with the trigger unchanged.
- Control `value` and prevent `tc-value-change` when the page decides whether a pick applies.

## Don't

- Don't use it for actions – a menu of commands belongs in a button's menu, not a select.
- Don't list more than about fifteen options; offer a `combobox` to search instead.
- Don't disable an option without saying why in its description.

## Example

```html
<tc-select id="period" label="Reporting period" value="this-month" align="end"></tc-select>

<script type="module">
  import "@adamstavely/trenchcoat/select";
  import "@adamstavely/trenchcoat/tokens.css";

  const select = document.querySelector("#period");
  select.options = [
    { value: "this-month", label: "This month" },
    { value: "last-month", label: "Last month" },
    { value: "this-quarter", label: "This quarter" },
  ];
  select.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { Select, type SelectOption } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const periods: SelectOption[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-quarter", label: "This quarter" },
];

export function ReportingPeriod() {
  const [period, setPeriod] = useState("this-month");
  return <Select label="Reporting period" options={periods} value={period} onChange={setPeriod} align="end" />;
}
```
