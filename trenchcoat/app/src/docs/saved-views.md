---
pattern: tabs
status: new
related: filter-menu, data-table, session-tabs, bulk-action-bar, assignee-picker
---

## Overview

The tabs above a list or table, each a saved set of filters, sort and columns – "My open cases", "High risk this week", "Waiting on customer". Each tab shows how many items it holds, a mark when it's shared with the team, and a pin on the default view – the one that opens first.

View options – the ⋯ button beside the tabs, or the chevron on a tab – renames a view in place, duplicates it, shares it with the team or stops sharing, sets it as the default, and deletes it after asking in place. When the filters on screen no longer match the open view, the page sets `dirty`: the tab says Edited, and a bar below offers Save changes, Save as new view (named in place) and Reset. "+ New view" asks for a name in place too.

The page owns the views. Every action is a request – `tc-view-save`, `tc-view-create`, `tc-view-reset`, `tc-view-rename`, `tc-view-duplicate`, `tc-view-share`, `tc-view-default`, `tc-view-delete` – and the page changes `views` in answer. Which view is open is the element's own (`active`), unless a `tc-active-change` listener prevents it.

When the tabs don't fit, they scroll sideways with soft edges, the open one kept in view, and More views lists the ones out of sight.

## When to use

- A list or table people filter the same few ways every day, and want to come back to.
- Views that a team shares – a queue everyone works from.
- Pairing with `filter-menu` for the filters themselves, and `data-table` for the rows.

## When not to use

- Fixed sections that aren't saved filters – use `segmented-control`.
- Open documents or chats – use `session-tabs`.
- One-off filtering that nobody saves – use `filter-menu` on its own.

## Anatomy

1. **Tabs** `.ui-svw__list` – the tablist; each `.ui-svw__tab` holds `.ui-svw__open` (the tab) with `.ui-svw__name`, `.ui-svw__count`, a `.ui-svw__mark` for shared and default, `.ui-svw__edited` when the open view has changed, and `.ui-svw__chevron`
2. **Tools** `.ui-svw__tools` – `.ui-svw__options` (View options for the open view), `.ui-svw__more` when tabs are out of view, and `.ui-svw__new`
3. **Menu** `.ui-svw__menu` – `.ui-svw__item` actions, or `.ui-svw__confirm` to confirm a delete
4. **Edited bar** `.ui-svw__dirty` – `.ui-svw__dirty-note` and Reset, Save as new view and `.ui-svw__save`, or `.ui-svw__naming` while a name is given
5. **Rename** `.ui-svw__rename` – the name field that takes a tab's place while it's renamed

## Looks

Standard: the strip sits on the gray tray and the open view is a white card on it. Clean: one white bar, the open view filled with an accent underline. `--tc-svw-min` and `--tc-svw-max` bound a tab's width, `--tc-svw-menu-w` sets the menu's.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Move to the views (one tab stop), then View options, More views and New view |
| ← / → | Move between views |
| Home / End | First or last view |
| Enter / Space | Open the focused view |
| ↑ / ↓ in a menu | Move through its items; Escape closes it and returns to its button |
| Enter / Escape while renaming | Save the name, or keep the old one |

## Screen readers

The views are a tablist named "Saved views"; each tab is named by its view, then its count, whose it is, shared with the team, default view and edited, as they apply. With `controls`, each tab says which list it controls. View options is a menu button named "Options for" the open view; Delete opens a small dialog that asks before anything goes. The Edited bar is a group named "This view has unsaved changes". A rename and a delete are announced.

## Content

- Name views by what they hold, from the reader's side: "My open cases", not "Filter 3".
- Keep names short – about 24 characters – so several tabs fit.
- Give `count` when it's cheap to know; leave it out rather than show a stale number.

## Do

- Set `dirty` from the page whenever the filters, sort or columns on screen differ from the open view.
- Keep one default view.
- Save the view the person last had open, so they come back to it.

## Don't

- Don't delete a shared view without saying it goes for everyone – the confirmation says so when it's shared.
- Don't let the tabs grow into dozens – that's a library of reports, not a set of views.

## Example

```html
<tc-saved-views id="views" active="mine" controls="case-list"></tc-saved-views>
<div id="case-list">…</div>

<script type="module">
  import "@adamstavely/trenchcoat/saved-views";
  import "@adamstavely/trenchcoat/tokens.css";

  const views = document.querySelector("#views");
  views.views = [
    { id: "mine", name: "My open cases", count: 14, isDefault: true },
    { id: "high", name: "High risk this week", count: 6, shared: true },
    { id: "all", name: "All cases", count: 212 },
  ];
  views.addEventListener("tc-view-rename", (e) => {
    views.views = views.views.map((v) => (v.id === e.detail.id ? { ...v, name: e.detail.name } : v));
  });
</script>
```

```tsx
import { useState } from "react";
import { SavedViews, type SavedView } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CaseViews({ edited, onSave }: { edited: boolean; onSave: (id: string) => void }) {
  const [views, setViews] = useState<SavedView[]>([
    { id: "mine", name: "My open cases", count: 14, isDefault: true },
    { id: "high", name: "High risk this week", count: 6, shared: true },
  ]);
  const [active, setActive] = useState<string | null>("mine");
  return (
    <SavedViews
      views={views}
      active={active}
      onActiveChange={setActive}
      dirty={edited}
      onViewSave={onSave}
      onViewRename={({ id, name }) => setViews((all) => all.map((v) => (v.id === id ? { ...v, name } : v)))}
      onViewDelete={(id) => setViews((all) => all.filter((v) => v.id !== id))}
    />
  );
}
```
