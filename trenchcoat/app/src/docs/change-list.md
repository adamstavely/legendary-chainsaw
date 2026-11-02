---
pattern: list
status: new
related: check-status, environment-list, inline-diff, audit-trail
---

## Overview

Proposed code changes as compact rows: a mark for draft, open, merged or closed, the title, where it is, lines added and
removed, and how its checks went. It works from plain data and doesn't talk to any server, so it suits any code host.

## When to use

- A side panel or dashboard listing the changes a session or a person is working on.
- Showing a few recent changes, with the rest behind Show more.

## When not to use

- Edits to prose, accepted word by word – use `inline-diff`.
- A record of who did what – use `audit-trail`.
- The details of one change's checks – use `check-status`.

## Anatomy

1. **Row** `.ui-chl__row` – one change
2. **Mark** `.ui-chl__mark` – the state's shape
3. **Title** `.ui-chl__title` – cut off when there isn't room, whole in its tooltip
4. **Where** `.ui-chl__where` – repository and number
5. **Numbers** `.ui-chl__side` – `.ui-chl__add`, `.ui-chl__del` and a compact `tc-check-status`
6. **More** `.ui-chl__more` – opens `.ui-chl__menu`
7. **Show more** `.ui-chl__toggle` – the rest of the list

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. In a narrow place the numbers drop under the title.

## Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between rows, or through an open menu |
| ← / → | Move between a row and its More button |
| Home / End | Go to the first or last row or menu item |
| Enter / Space | Open the change, open the menu or choose an action |
| Escape | Close the menu and return to More |

After Show more, focus goes to the first row it revealed.

## Screen readers

The rows are a list named by the heading. Each row's button reads the state, title, where it is, lines added and removed,
and the checks in words. More is named for its row, says it opens a menu and whether it's open.

## Content

- Use the change's own title; don't add its state to it.
- Leave `additions` and `deletions` out when they aren't known, rather than sending 0.

## Do

- Listen for `tc-open` to open the change wherever the page likes.
- Use `rowActions` for the few things people do from the list.

## Don't

- Don't put provider-specific logic in the page's labels: `state` covers draft, open, merged and closed.
- Don't set a very low `limit` in a place people scan, since a title may be all they get.

## Example

```html
<tc-change-list id="changes"></tc-change-list>

<script type="module">
  import "trenchcoat/change-list";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#changes");
  el.items = [{ id: "1", title: "Add freezer locations", repo: "institute/sample-tracker", number: 214, state: "open", additions: 120, deletions: 30 }];
  el.rowActions = [{ id: "copy", label: "Copy link" }];
  el.addEventListener("tc-open", (e) => console.log(e.detail.item.title));
</script>
```

```tsx
import { ChangeList, type ChangeItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: ChangeItem[] = [{ id: "1", title: "Add freezer locations", repo: "institute/sample-tracker", number: 214, state: "open", additions: 120, deletions: 30 }];

export function Changes({ onOpen }: { onOpen: (id: string) => void }) {
  return <ChangeList items={items} rowActions={[{ id: "copy", label: "Copy link" }]} onTcOpen={(e) => onOpen(e.detail.id)} />;
}
```
