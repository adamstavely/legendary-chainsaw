---
pattern: tabs
status: new
related: artifact-panel, ai-side-pane, thread-header, session-tabs
---

## Overview

One side panel beside a chat, with a tab for each item open in it – an artifact the agent made, a file, a source, a
preview. The page puts each item's content in the element as a child with `slot` set to the item's id; the dock shows
the active one as its tab panel and hides the rest. Drag the panel's edge to resize it, fold it to a rail of icons, or
close it. When the space it docks in is narrower than `breakpoint` (640 px), it becomes a full-width sheet over the page.

## When to use

- A chat that opens things beside it, where people keep two or three open and move between them.
- Any layout with a single resizable side panel that holds more than one thing.

## When not to use

- Everything one run produced, with versions and downloads – use `artifact-panel`, perhaps inside the dock.
- An assistant docked beside a page – use `ai-side-pane`.
- Open chats as tabs – use `session-tabs`.

## Anatomy

1. **Handle** `.ui-pdk__handle` – the splitter on the edge toward the chat
2. **Head** `.ui-pdk__head` – the tabs and the tools
3. **Tab** `.ui-pdk__tab` – an item's `.ui-pdk__tab-btn` and `.ui-pdk__tab-close`
4. **Tools** `.ui-pdk__tools` – `.ui-pdk__collapse` and `.ui-pdk__close`
5. **Content** `.ui-pdk__content` – the page's child for the active item, made the tab panel
6. **Rail** `.ui-pdk__rail` – collapsed: `.ui-pdk__expand` and a `.ui-pdk__rail-item` per item
7. **Empty** `.ui-pdk__empty` – no items open

## Looks

Standard puts the tabs on the gray tray above a white card holding the content; Clean is one white panel with the tabs
as its first row. `side="left"` docks it on the left, with the handle on its right edge. The element sizes itself from
`width`; give it a height through its container. Component tokens: `--tc-pdk-rail` (the rail's width),
`--tc-pdk-handle` (the splitter's hit area) and `--tc-pdk-tab-max`.

## Keyboard

| Key | What it does |
|---|---|
| ← / → on the tabs | Move between items |
| Home / End on the tabs | Go to the first or last item |
| Enter / Space | Show the focused item |
| Delete / Backspace | Close the focused item |
| ← / → on the handle | Resize by 16 px (on the right, ← widens) |
| Home / End on the handle | Narrowest / widest |
| Escape anywhere inside | Close the panel; focus goes back to where it came from |

## Screen readers

The panel is a region named "Side panel". The tabs are a `tablist` named "Open items"; each tab reads its title and its
kind ("Q3 report draft, Artifact"), and the content child gets `role="tabpanel"`, labelled by its tab. The handle is a
vertical `separator` with its width as `aria-valuenow` and in words. Collapsed, the rail lists the items as buttons
with `aria-current` on the shown one. The tabs' close buttons are mouse targets, hidden from screen readers – Delete
closes the focused tab. Closing an item is announced.

## Content

- Titles name the thing, not the action: "ledger-q3.csv", "Expense policy §4.2".
- Give `kind` so the tab says what it is, and an `icon` so the rail can be told apart.

## Do

- Take the item out of `items` on `tc-close`, and its child with it.
- Keep `width` across visits by controlling it.

## Don't

- Don't nest one dock in another.
- Don't put the chat itself in the dock; the dock is beside it.

## Example

```html
<tc-panel-dock id="dock" active="draft">
  <article slot="draft">The report draft…</article>
  <div slot="ledger">1,284 rows</div>
</tc-panel-dock>

<script type="module">
  import "@adamstavely/trenchcoat/panel-dock";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#dock");
  el.items = [
    { id: "draft", title: "Q3 report draft", kind: "Artifact" },
    { id: "ledger", title: "ledger-q3.csv", kind: "File" },
  ];
  el.addEventListener("tc-close", (e) => (el.items = el.items.filter((i) => i.id !== e.detail.id)));
  el.addEventListener("tc-width-change", (e) => console.log("Width", e.detail.width));
</script>
```

```tsx
import { useState } from "react";
import { PanelDock, type PanelDockItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Dock() {
  const [items, setItems] = useState<PanelDockItem[]>([{ id: "draft", title: "Q3 report draft", kind: "Artifact" }]);
  const [width, setWidth] = useState(420);
  return (
    <PanelDock items={items} width={width} onWidthChange={setWidth} onTcClose={(e) => setItems((l) => l.filter((i) => i.id !== e.detail.id))}>
      <article slot="draft">The report draft…</article>
    </PanelDock>
  );
}
```
