---
pattern: disclosure
status: new
related: results-list, filter-menu, query-builder, date-range-picker
---

## Overview

The filters beside search results, each saying how many results it would leave. Facets are sections that fold. A
facet can be checkboxes (any of), radios (one of), a range with two thumbs and number fields, or a from–to date. The
filters in use sit on top as chips, each removable, with Clear all. An option no result has is dimmed but can still
be picked. A long facet shows five options and "Show 7 more", and one with more than eight has its own search box.

Every change fires one cancelable `tc-value-change` with the whole value as it will be, so the filters can live in
the URL or a store.

## When to use

- Narrowing a results page: by kind, owner, programme, size or date.
- When the counts help people choose – "Lab notes 64" says where the results are.

## When not to use

- A compact dropdown of filters above a list – use [Filter Menu](#/filter-menu).
- Conditions joined with AND / OR – use [Query Builder](#/query-builder).
- Picking a date range on its own – use [Date Range Picker](#/date-range-picker).

## Anatomy

1. **Chips** `.ui-fct__chips` – the filters in use, each with ×
2. **Facet** `.ui-fct__facet` – its name, how many are on, and the fold
3. **Search** `.ui-fct__search` – inside a facet with more than eight options
4. **Option** `.ui-fct__option` – a checkbox or radio, its label and count
5. **Range** `.ui-fct__range` – a track with two thumbs, and From and To fields
6. **Show more** `.ui-fct__more` – the rest of a long facet

## Looks

Standard puts the header and Clear all on a gray tray above a white card; Clean is one white card. Picked boxes are
filled (ink in Standard, accent in Clean) with a tick that draws itself, and a facet's badge says how many of its
options are on. It's made for a sidebar about 280 px wide.

A page can set `--tc-fct-thumb` (the range thumbs' size).

## Keyboard

| Key | Does |
| --- | --- |
| Enter / Space on a facet's name | Folds or opens it |
| Space on an option | Picks or drops it |
| ↑ / ↓ in radios | Moves the choice |
| ← / → on a range thumb | One step (Shift: ten) |
| Page Up / Page Down | A tenth of the range |
| Home / End on a thumb | To its end |

## Screen readers

- Each facet's name is a button that says whether it's open; its options are a group (or radiogroup) named by it.
- Options are real checkboxes and radios named by their label and count.
- Range thumbs are sliders: "Length, lowest", with the value and its unit ("5 pages").
- Chips are a list; each × says what it removes. Changes are announced in a polite status line, and focus moves to
  the next chip when one goes.

## Content

- Name facets with one noun: "Kind", "Programme", "Updated".
- Order options by count or by meaning, not alphabetically, unless the list is long.
- Give the range a unit people read naturally: "pages", "MB", "%".

## Do

- Keep the counts up to date with the results, so a choice never leads to nothing without warning.
- Put the most used facets first and fold the rest.

## Don't

- Disable options that have no results – dim them; someone may still want them.
- Use a range for a handful of values – checkboxes are quicker.

## Example

```html
<tc-facet-sidebar></tc-facet-sidebar>
<script type="module">
  const sidebar = document.querySelector("tc-facet-sidebar");
  sidebar.facets = [{ id: "kind", label: "Kind", type: "checkbox", options: [{ value: "doc", label: "Documents", count: 128 }] }];
  sidebar.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { FacetSidebar, type Facet, type FacetValues } from "trenchcoat/react";

const FACETS: Facet[] = [{ id: "pages", label: "Length", type: "range", min: 1, max: 200, unit: "pages" }];

export function Filters() {
  const [value, setValue] = useState<FacetValues>({});
  return <FacetSidebar facets={FACETS} value={value} onValueChange={setValue} />;
}
```
