---
pattern: toolbar
status: new
related: session-tabs, panel-dock, share-panel, chat-history
---

## Overview

The bar at the top of a chat thread. It holds the thread's title, which people rename in place; the model and the
project as quiet chips; Share; a toggle for each side panel the page offers (sources, an artifact, a preview); and a
menu of the rest – Export, Archive and Delete by default. When the header is narrow, the chips hide and Share and the
toggles fold into the menu.

## When to use

- The top of a chat or agent thread, where the title, sharing and the side panels belong together.
- A thread whose title people should be able to fix without opening a settings page.

## When not to use

- Switching between several open chats – use `session-tabs`.
- Choosing who a thread is shared with – put `share-panel` behind Share.
- The panel the toggles open – use `panel-dock`.

## Anatomy

1. **Title** `.ui-thd__title` – a heading; its `.ui-thd__title-btn` starts renaming, and `.ui-thd__input` is the field
2. **Chips** `.ui-thd__chips` – the model and the project, each a `.ui-thd__chip`
3. **Share** `.ui-thd__share`
4. **Toggles** `.ui-thd__toggles` – one `.ui-thd__toggle` per side panel
5. **More** `.ui-thd__more` – opens `.ui-thd__menu`
6. **Menu item** `.ui-thd__menu-item` – an action; danger ones after a `.ui-thd__sep`

## Looks

Standard is a bar on the gray tray; Clean is one white bar. Under about 32rem of its own width, the chips hide and Share
and the toggles move into the menu, where the toggles are checkable items. Component tokens: `--tc-thd-chip-max` (a
chip's widest) and `--tc-thd-menu-w`.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space / F2 on the title | Start renaming |
| Enter in the field | Save the new title |
| Escape in the field | Cancel |
| Enter / Space on a toggle | Show or hide its panel |
| ↑ / ↓, Home / End in the menu | Move between items |
| Escape / Tab in the menu | Close it; focus goes back to More |

## Screen readers

The title is a heading (`level`, 2 by default) holding a button that reads the title and then "Rename"; the field is
named "Chat title". The chips read "Model: …" and "Project: …". The toggles are a group named "Panels", each a pressed
button named by its label. More has `aria-haspopup="menu"` and `aria-expanded`; in the menu the toggles are
`menuitemcheckbox` items. A rename is announced through `role="status"`.

## Content

- Keep titles short enough to read in the bar: "Q3 reconciliation", not a sentence.
- Name toggles by what they show ("Sources", "Report draft"), not by an action.
- Put destructive actions last with `danger: true`.

## Do

- Show and hide the panels from `tc-panels-change`, or control `panels`.
- Save the title from `tc-title-change`; prevent it to reject a name.

## Don't

- Don't add more than three toggles; the bar gets crowded and they fold away early.
- Don't use the menu for navigation.

## Example

```html
<tc-thread-header id="head" heading="Q3 reconciliation" model="Analyst model" project="Annual audit"></tc-thread-header>

<script type="module">
  import "@adamstavely/trenchcoat/thread-header";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#head");
  el.toggles = [{ id: "sources", label: "Sources" }];
  el.addEventListener("tc-title-change", (e) => console.log("Renamed to", e.detail.title));
  el.addEventListener("tc-panels-change", (e) => console.log("Open panels", e.detail.panels));
  el.addEventListener("tc-action", (e) => console.log("Action", e.detail.action));
</script>
```

```tsx
import { useState } from "react";
import { ThreadHeader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Header() {
  const [title, setTitle] = useState("Q3 reconciliation");
  const [panels, setPanels] = useState<string[]>(["sources"]);
  return (
    <ThreadHeader
      title={title}
      onTitleChange={setTitle}
      model="Analyst model"
      toggles={[{ id: "sources", label: "Sources" }]}
      panels={panels}
      onPanelsChange={setPanels}
      onTcAction={(e) => console.log(e.detail.action)}
    />
  );
}
```
