---
pattern: toolbar
status: new
related: panel-card, command-menu, profile-menu, meter-row
---

## Overview

A row of icon buttons at the top of a panel. One can be chosen, each has a tooltip, and a More menu can hold the rest.

## When to use

- Switching what a side panel shows.
- A few actions that are familiar enough to work as icons.

## When not to use

- Views that need their names always in sight – use tabs with words.
- Search across many commands – use `command-menu`.
- An account's actions – use `profile-menu`.

## Anatomy

1. **Rail** `.ui-irl__rail` – the toolbar
2. **Slot** `.ui-irl__slot` – a button and its tooltip
3. **Button** `.ui-irl__button` – the icon button
4. **Tooltip** `.ui-irl__tip` – the label, on hover and focus
5. **Menu** `.ui-irl__menu` – the More menu's list of `.ui-irl__item`

## Looks

Standard is a white card on the gray tray; Clean is one white card. `bare` drops both. When narrow the row wraps, and the
buttons keep their size. A page can set `--tc-irl-size`, a button's size, and `--tc-irl-glyph`, its icon's.

## Keyboard

One tab stop for the whole rail.

| Key | What it does |
|---|---|
| Left / Right | Moves along the rail |
| Home / End | Moves to the first or last button |
| Enter / Space | Chooses the button, or lets it go; opens More |
| Up / Down on More | Opens the menu at its last or first item |
| Up / Down in the menu | Moves through its items |
| Escape | Shuts the menu, back on More |

## Screen readers

It's a `toolbar` named by `label`. Each button is named by its own label and says whether it's pressed. More says it opens
a `menu` and whether it's open. The tooltip repeats the name, so it's hidden from them.

## Content

Give every item a short label, as the icon alone may not be clear. `icon` is SVG path data for a 24×24 stroked icon, or an
array of paths. Use `moreItems` for what's used least.

## Do

- Keep to the few views people really switch between.
- Prevent `tc-selected-change` when a view can't open yet, and say why.

## Don't

- Don't use unfamiliar icons with no other cue: a tooltip doesn't help on touch.
- Don't put a destructive action in the rail without a confirmation.

## Example

```html
<tc-icon-rail id="rail" label="Panel views" selected="details"></tc-icon-rail>

<script type="module">
  import "trenchcoat/icon-rail";
  import "trenchcoat/tokens.css";

  const rail = document.querySelector("#rail");
  rail.items = [
    { id: "details", label: "Details", icon: "M8 6h13M8 12h13M8 18h13" },
    { id: "add", label: "Add sample", icon: ["M12 5v14", "M5 12h14"] },
  ];
  rail.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { IconRail } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Views() {
  const [selected, setSelected] = useState<string | null>("details");
  return (
    <IconRail
      label="Panel views"
      selected={selected}
      onSelectedChange={(next) => setSelected(next)}
      items={[{ id: "details", label: "Details", icon: "M8 6h13M8 12h13M8 18h13" }]}
      moreItems={[{ id: "export", label: "Export list" }]}
    />
  );
}
```
