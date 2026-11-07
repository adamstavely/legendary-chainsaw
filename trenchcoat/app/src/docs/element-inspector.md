---
pattern: tree
status: new
related: preview-frame, file-tree, json-viewer, problem-list
---

## Overview

A page's elements as a tree, written the way the markup reads – `<form id="apply" class="form wide">` – beside the
chosen element's box model and styles. The page passes the tree and, for the chosen element, its details; nothing here
reads a real page. Hovering or focusing an element fires `tc-highlight`, so the page can outline it in a
`preview-frame`. Wide, the tree and the details sit side by side; narrow, the details go under the tree.

## When to use

- Beside a preview of the page being built, to show which element is which and why it's the size it is.
- Explaining a layout bug: the box model shows the margin, border and padding at a glance.

## When not to use

- A project's files – use `file-tree`.
- Raw data such as an API response – use `json-viewer`.
- Problems the build or a linter found – use `problem-list`.

## Anatomy

1. **Tree** `.ui-elin__tree` – the elements, one row each; folded elements end in `…</tag>`
2. **Row** `.ui-elin__row` – an element: the fold chevron and its opening tag
3. **Tag** `.ui-elin__tag`, **attribute** `.ui-elin__attr` and **value** `.ui-elin__value` – coloured like code
4. **Text** `.ui-elin__text` – a short text inside the element
5. **Details** `.ui-elin__details` – the chosen element's tag, box model and styles
6. **Box model** `.ui-elin__box` – margin, border, padding and content, nested, with a number per side
7. **Styles** `.ui-elin__styles` – property, value and where it comes from

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The box model's layers use the amber, warning, teal and info tints. A page can set `--tc-elin-indent`, the step per
level of the tree.

## Keyboard

The tree is one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the element above or below |
| → | Opens a closed element, or moves to its first child |
| ← | Closes an open element, or moves to its parent |
| Home / End | Moves to the first or last element |
| Enter / Space | Chooses the element |

## Screen readers

The tree is a `tree` of `treeitem`s with their level, position, open state and `aria-selected`; it's named "Elements"
and described by a hidden note of the keys. The details are a region named "Details", with a heading per section. The
box-model drawing is hidden from screen readers; a sentence under it reads the content size and each layer's four sides.

## Content

- Give each node a stable `id` – the one `selected`, `expanded` and the events hold.
- Keep `text` to a few words: it's a hint, not the element's content.
- Pass `details` for the chosen element only, and swap them when `tc-selected-change` fires. Until they change, the new
  element's heading shows with "Loading details" rather than the last element's box and styles.

## Do

- Outline the element from `tc-highlight` in the preview beside it, and clear the outline when `id` is null.
- Show the styles that matter for the question at hand, with their `source`.

## Don't

- Don't pass a whole document at once: open the branches people need, and pass more as they open.
- Don't put real visitors' form entries in `text` or attribute values.

## Example

```html
<tc-element-inspector id="dom" description="staging.halden.example/grants/218/apply"></tc-element-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/element-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#dom");
  el.nodes = [{ id: "form", tag: "form", attrs: { id: "apply", class: "form" }, children: [{ id: "submit", tag: "button", text: "Submit" }] }];
  el.expanded = ["form"];
  el.addEventListener("tc-selected-change", (e) => {
    el.details = { box: { width: 182, height: 36, padding: [8, 16, 8, 16] }, styles: [{ property: "display", value: "inline-flex" }] };
  });
  el.addEventListener("tc-highlight", (e) => console.log("outline", e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { ElementInspector, type InspectorDetails, type InspectorNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Inspector({ nodes, detailsFor }: { nodes: InspectorNode[]; detailsFor: (id: string) => InspectorDetails }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <ElementInspector nodes={nodes} selected={selected} onSelectedChange={setSelected} details={selected ? detailsFor(selected) : null} />;
}
```
