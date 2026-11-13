---
pattern: tabs
status: new
related: session-list, chat-history, thread-header, panel-dock
---

## Overview

Open chats as a row of tabs above a chat thread. Each tab has the chat's title, cut off with an ellipsis with the whole
title in its tooltip; a mark for what the chat is doing – running, needs you or failed – with the word for screen
readers; an unread dot; and a close button. A "+" opens a new chat. Drag a tab to move it, or move it from the
keyboard. When the tabs don't fit, they shrink to a minimum width, then scroll sideways with soft edges, and a "more"
button lists the ones out of view.

## When to use

- Several chats open at once that people switch between often, the way they'd use browser tabs.
- A workspace where the status of a background chat (running, needs you) should be seen without opening it.

## When not to use

- Every past chat, searchable and grouped – use `chat-history`.
- Sessions in a sidebar, grouped by project – use `session-list`.
- The bar above one thread, with its title and actions – use `thread-header`.
- Switching between two to six views of one thing – use `segmented-control`.

## Anatomy

1. **Bar** `.ui-stab__bar` – the strip; fades at an edge that has more tabs past it
2. **Tab list** `.ui-stab__list` – the `tablist`
3. **Tab** `.ui-stab__tab` – one chat: its `.ui-stab__open` button and `.ui-stab__close`
4. **Mark** `.ui-stab__mark` – the status's shape, for running, needs you and failed
5. **Title** `.ui-stab__title` – cut off with an ellipsis
6. **Unread** `.ui-stab__unread` – something new since it was last open
7. **More** `.ui-stab__more` – the count of tabs out of view, opening `.ui-stab__menu`
8. **New** `.ui-stab__new` – the "+" button

## Looks

Standard puts the strip on the gray tray, with the open tab a white card on it. Clean is one white bar; the open tab is
filled, with an accent underline. Component tokens: `--tc-stab-min` and `--tc-stab-max` (a tab's narrowest and widest),
`--tc-stab-fade` (how far the edges fade).

## Keyboard

The tabs are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Move between tabs (wrapping) |
| Home / End | Go to the first or last tab |
| Enter / Space | Open the focused tab |
| Delete / Backspace | Close the focused tab |
| Alt+Shift+← / → | Move the focused tab one place |
| ↑ / ↓ in the more menu | Move between the hidden tabs; Escape closes the menu |

## Screen readers

The tabs are a `tablist` named "Open chats"; each tab says its title, then its status in words ("Needs you") and
"unread", and `aria-selected` marks the open one. A hidden description of the keys is read with each tab. The close
buttons are mouse targets, hidden from screen readers and left out of the tab order: Delete closes the focused tab, and
the key description says so. Moving and
closing are announced through `role="status"` ("Moved Board pack draft to position 2 of 6"). The more button says how
many tabs it holds and opens a `menu`.

## Content

- Titles say what the chat is about in a few words: "Vendor risk summary".
- Use `waiting` only when the chat needs the person; it's the status that draws the eye.
- Give `controls` the id of the panel a tab shows, so the tab points at it.

## Do

- Remove the tab from `tabs` on `tc-close`; the element opens its neighbour if it was the open one.
- Clear `unread` when a tab is opened.

## Don't

- Don't put more than a dozen chats in tabs; past that, use `chat-history`.
- Don't use tabs for things that aren't chats or sessions.

## Example

```html
<tc-session-tabs id="tabs" active="q3"></tc-session-tabs>

<script type="module">
  import "@adamstavely/trenchcoat/session-tabs";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#tabs");
  el.tabs = [
    { id: "q3", title: "Q3 reconciliation" },
    { id: "vendor", title: "Vendor risk summary", status: "running" },
  ];
  el.addEventListener("tc-active-change", (e) => console.log("Open", e.detail.active));
  el.addEventListener("tc-close", (e) => (el.tabs = el.tabs.filter((t) => t.id !== e.detail.id)));
</script>
```

```tsx
import { useState } from "react";
import { SessionTabs, type SessionTab } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Chats() {
  const [tabs, setTabs] = useState<SessionTab[]>([
    { id: "q3", title: "Q3 reconciliation" },
    { id: "vendor", title: "Vendor risk summary", status: "running" },
  ]);
  const [active, setActive] = useState<string | null>("q3");
  return (
    <SessionTabs
      tabs={tabs}
      active={active}
      onActiveChange={setActive}
      onTcClose={(e) => setTabs((list) => list.filter((t) => t.id !== e.detail.id))}
    />
  );
}
```
