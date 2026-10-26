---
pattern: radio
status: react-twin
related: combobox, filter-menu, data-table
---

## Overview

A row of two to six options where exactly one is picked – a view (List, Grid, Board), a period (Monthly, Yearly), a
filter (All, Unread, Mentions). The picked option sits on a raised pill or an underline that glides to the next
pick, stretching a little on the way, and people can drag the pill across the options to pick as they go. Options
can carry an icon, a count or a badge. With `kind="tabs"` the same control becomes a set of tabs that switch panels.

## When to use

- Switching how one set of content is shown – view modes, chart ranges, sort orders.
- A small choice that takes effect at once and should stay visible: billing period, units, a filter.
- A few tabs over one panel, with `kind="tabs"` and `variant="underline"`.

## When not to use

- More than six options, or options that don't fit in one row – use `combobox`.
- Several choices at once, or filters across more than one facet – use `filter-menu`.
- Turning one setting on and off – use a checkbox or a switch.
- Actions (“Export”, “Share”) rather than a choice – use a `button` for each.

## Anatomy

1. **Indicator** `.ui-seg__pill` – the raised pill (or underline) under the picked option
2. **Option** `.ui-seg__opt:nth-of-type(3)` – one choice: a label, an icon or both
3. **Count** `.ui-seg__count` – a small number after the label, such as unread items
4. **Badge** `.ui-seg__badge` – a small tinted tag, such as “Save 20%”

## Looks

Standard is a gray tray with a white raised pill that glides and stretches to the picked option, and the picked
label turns bold without shifting the layout. Clean defaults to separate quiet chips with the picked one filled, and
glides faster. Both offer the underline variant for tabs; `variant="buttons"` only exists in Clean – Standard shows
it as the tray.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the control, onto the picked option; the next Tab leaves it |
| → / ↓ | Picks the next option, wrapping to the first (with `kind="tabs"`, → only) |
| ← / ↑ | Picks the previous option, wrapping to the last (with `kind="tabs"`, ← only) |
| Home / End | Picks the first or the last option |
| Enter / Space | Picks the focused option |

Arrow keys, Home and End skip disabled options, and the pick follows the focus.

## Screen readers

The options sit in a `radiogroup`, each a `radio` with `aria-checked`; with `kind="tabs"` they're a horizontal
`tablist` of `tab`s with `aria-selected` and `aria-controls` pointing at each option's `controls` panel. The
`aria-label` or `aria-labelledby` you set on the element names the group. A count is part of the option's name
(“Unread 8”); an icon-only option is named by its `ariaLabel`. A disabled control sets `aria-disabled` on the group.

## Content

- Label the group with what's being chosen: “View”, “Billing period” – it's what screen readers announce first.
- Keep option labels to one or two words, in the same form: “List, Grid, Board”, not “List, Show as grid”.
- Give every icon-only option an `ariaLabel`, and use icons alone only where they're well known.
- Use `badge` for one short tag (“Save 20%”), not for a sentence.

## Do

- Show the result of the pick right away – the control implies an immediate change.
- Use `fullWidth` for two or three options that should fill a card or a form row.
- Set `name` to submit the pick with a form, through the hidden input.

## Don't

- Don't use it as a step indicator or for navigation between pages.
- Don't mix icon-only and labelled options in one control.
- Don't disable an option without saying why nearby – a gray option with no reason reads as broken.

## Example

```html
<tc-segmented-control id="view" aria-label="View"></tc-segmented-control>

<script type="module">
  import "trenchcoat/segmented-control";
  import "trenchcoat/tokens.css";

  const view = document.querySelector("#view");
  view.options = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
    { value: "board", label: "Board", count: 3 },
  ];
  view.value = "list";
  view.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { SegmentedControl } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function BillingPeriod() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  return (
    <SegmentedControl
      aria-label="Billing period"
      fullWidth
      value={period}
      onChange={setPeriod}
      options={[
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly", badge: "Save 20%" },
      ]}
    />
  );
}
```
