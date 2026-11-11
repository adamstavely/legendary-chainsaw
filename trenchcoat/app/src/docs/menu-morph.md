---
pattern: menu
status: new
related: shared-element, collapse, command-menu, filter-menu
---

## Overview

A button that grows into its menu. The menu's surface starts as the button's own box and stretches into the panel,
the items rise one after another, and when the menu closes it shrinks back into the button – so it's clear where the
menu came from and where it went. The button and the menu are yours: mark the button `data-menu-trigger` and the
panel `data-menu`, and the element adds the menu button pattern's roles and keys. The panel opens below the button,
above it when there's no room, and floats in the top layer where the browser has the Popover API. For people who ask
for reduced motion, the menu opens and closes without the morph.

## When to use

- An actions menu on a row, a card or a finding – a handful of commands behind one button.
- A small "more" menu in a toolbar where a plain popover would appear from nowhere.

## When not to use

- Searching or picking from many items – use `command-menu`.
- Choosing filters that stay applied – use `filter-menu`.
- Content that opens in place below a heading – use `collapse`.
- A card that grows into its full detail view – use `shared-element`.

## Keyboard

| Key | Does |
|---|---|
| Enter, Space or ↓ on the button | Opens the menu on its first item |
| ↑ on the button | Opens the menu on its last item |
| ↓ / ↑ | Next or previous item, wrapping round |
| Home / End | First or last item |
| A letter | The next item that starts with it |
| Enter or Space on an item | Chooses it and closes the menu (unless the item has `data-keep-open`) |
| Escape | Closes the menu; focus goes back to the button |
| Tab | Closes the menu and moves on |

## Screen readers

The button gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the panel gets `role="menu"` and, unless
you give it an `aria-label`, is labelled by the button. Items are `role="menuitem"` (or `menuitemcheckbox` /
`menuitemradio`) – yours to set, since they're your elements. Only the focused item is in the tab order.

## Do

- Keep it to a handful of short commands, each a verb: “Assign reviewer”, “Export finding”.
- Give the panel an `aria-label` that names what the commands act on when the button's words don't.
- Listen for `tc-open-change` and call `preventDefault()` to keep it open or shut while something is saving.

## Don't

- Don't put form fields or long text in the panel – a menu holds commands.
- Don't nest another menu inside; open a dialog for anything that needs more choices.

## Example

```html
<tc-menu-morph>
  <button type="button" data-menu-trigger>Actions</button>
  <div data-menu aria-label="Finding F-214 actions">
    <button type="button" role="menuitem">Assign reviewer</button>
    <button type="button" role="menuitem">Request evidence</button>
    <button type="button" role="menuitem">Export finding</button>
  </div>
</tc-menu-morph>

<script type="module">
  import "@adamstavely/trenchcoat/menu-morph";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("tc-menu-morph").addEventListener("tc-open-change", (e) => console.log("open:", e.detail.open));
</script>
```

```tsx
import { MenuMorph } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FindingActions({ onAction }: { onAction: (action: string) => void }) {
  return (
    <MenuMorph onOpenChange={(open) => console.log("open:", open)}>
      <button type="button" data-menu-trigger>Actions</button>
      <div data-menu aria-label="Finding F-214 actions">
        {["Assign reviewer", "Request evidence", "Export finding"].map((a) => (
          <button key={a} type="button" role="menuitem" onClick={() => onAction(a)}>
            {a}
          </button>
        ))}
      </div>
    </MenuMorph>
  );
}
```
