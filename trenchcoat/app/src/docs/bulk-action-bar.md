---
pattern: toolbar
status: new
related: data-table, access-review, team-flag-picker, toaster
---

## Overview

What can be done to everything selected. It appears when `count` is above zero, says how many, and offers the page's actions with Select all and Clear. A danger action can ask first, naming how many, and Undo stays for a few seconds after an action.

## When to use

- A list or table where people select several items and act on them together.
- Flagging, sharing or removing many files at once.

## When not to use

- Actions on one item – put them on its row.
- A general app toolbar that doesn't depend on a selection.
- Selecting the items themselves – use `data-table`.

## Anatomy

1. **Bar** `.ui-bab__bar` – the toolbar
2. **Count** `.ui-bab__count` – how many are selected
3. **Action** `.ui-bab__action` – one of the page's actions
4. **Select all and Clear** `.ui-bab__all`, `.ui-bab__clear`
5. **Question** `.ui-bab__question` – asked before a danger action with `confirm`
6. **Undo** `.ui-bab__undo` – on offer after an action, with `.ui-bab__left` for the time left

## Looks

The same in Standard and Clean, drawn from the shared button tokens. `sticky` keeps it at the bottom of the scrolling area.

## Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between the bar's buttons |
| Home / End | Go to the first or last button |
| Enter / Space | Press a button |
| Escape | Backs out of a question |

It's one tab stop. After an action, focus goes to Undo.

## Screen readers

It's a `toolbar` with a name. `role="status"` announces the count as it changes, what an action did, and when it's been undone. A question names how many it will affect.

## Content

Name actions with a plain verb. Say `confirm` on anything hard to undo. Set `undoable: false` on an action you can't reverse, and don't offer Undo for it.

## Do

- Keep the selection in the page, and pass `count` and `total`.
- Do the work on `tc-action`, and reverse it on `tc-undo`.
- Delay a destructive change on the server until Undo has passed, if you can.

## Don't

- Don't promise Undo for an action your server can't reverse.

## Example

```html
<tc-bulk-action-bar id="bar" count="3" total="40"></tc-bulk-action-bar>

<script type="module">
  import "trenchcoat/bulk-action-bar";
  import "trenchcoat/tokens.css";

  const bar = document.querySelector("#bar");
  bar.actions = [{ id: "flag", label: "Flag" }, { id: "remove", label: "Remove", danger: true, confirm: true }];
  bar.addEventListener("tc-action", (e) => console.log(e.detail.action.id, e.detail.count));
</script>
```

```tsx
import { BulkActionBar, type BulkAction } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const actions: BulkAction[] = [{ id: "flag", label: "Flag" }];

export function Selected({ count, onClear }: { count: number; onClear: () => void }) {
  return <BulkActionBar count={count} total={40} actions={actions} onTcClear={onClear} />;
}
```
