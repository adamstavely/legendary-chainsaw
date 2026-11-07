---
pattern: combobox
status: new
related: pull-request, environment-list, combobox, change-list
---

## Overview

Which branch or worktree a session works on, and a way to pick or make another. The trigger shows the current branch and
how far it is ahead of and behind its base (↑2 ↓5). It opens a list with a filter, in sections for worktrees, local and
remote branches. Each row has the name, ahead and behind, when it last changed, and a dot when it has uncommitted work.
Typing a name that isn't there offers to create it from the base. Sync beside the trigger asks the page to pull and push.

## When to use

- Choosing the branch or worktree for a session, an editor or a preview.
- A panel that should show the whole list at once – with `inline`.

## When not to use

- Picking from a list that isn't branches – use `combobox`.
- Showing the branch as one line among the machine and folders – use `environment-list`.
- The pull request for the branch – use `pull-request`.

## Anatomy

1. **Trigger** `.ui-brsw__trigger` – the current branch, `.ui-brsw__counts` and a chevron
2. **Sync** `.ui-brsw__sync` – asks the page to pull and push
3. **Popup** `.ui-brsw__pop` – the list, below the trigger
4. **Filter** `.ui-brsw__filter` – finds a branch, or names a new one
5. **Section** `.ui-brsw__group` – Worktrees, Local or Remote, with `.ui-brsw__group-head`
6. **Row** `.ui-brsw__option` – the name, `.ui-brsw__meta`, the counts and a check on the current one
7. **Dirty dot** `.ui-brsw__dirty` – uncommitted changes
8. **Create** `.ui-brsw__create` – the row that makes a new branch from the base

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-brsw-list-h`, the list's height before it scrolls, and
`--tc-brsw-pop-w`, the popup's width.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the trigger | Opens the list, with focus in the filter |
| ↑ / ↓ | Move through the rows, across sections |
| Enter | Picks the row, or creates the branch |
| Escape | Closes the list and returns focus to the trigger; inline, it clears the filter |
| Tab | Leaves the list |

## Screen readers

The trigger names the branch, then "2 ahead, 5 behind of main" and "uncommitted changes" when they apply, and says it
opens a dialog. The filter is a combobox that controls a listbox; the active row is its `aria-activedescendant`. Rows are
grouped by section, and the current branch is the selected option. Picking or creating is announced through
`role="status"`.

## Content

- Pass `ahead` and `behind` against the same `base` the element is given.
- Give worktrees their `path`, so two worktrees on similar branches can be told apart.
- Remote branches keep their remote's prefix (`origin/main`); creating a branch named after one isn't offered. A local
  `feature/login` doesn't stop "Create login".
- A typed name is cleaned into one git accepts (`toBranchName`): spaces become dashes, and `..`, `~`, `//`, a leading dot
  in a part and a trailing `.lock` are dropped.

## Do

- Add the new branch to `branches` after `tc-create`, and set `current` to it.
- Set `busy` while switching or syncing.

## Don't

- Don't switch the branch on `tc-current-change` while there are uncommitted changes without asking first; prevent the
  event and ask.
- Don't rely on the name clean-up for safety; the server still checks the name.

## Example

```html
<tc-branch-switcher id="branch" current="feature/booking-calendar" base="main"></tc-branch-switcher>

<script type="module">
  import "@adamstavely/trenchcoat/branch-switcher";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#branch");
  el.branches = [
    { name: "main", kind: "local" },
    { name: "feature/booking-calendar", kind: "local", ahead: 2, behind: 5 },
  ];
  el.addEventListener("tc-create", (e) => console.log("Create", e.detail.name, "from", e.detail.from));
</script>
```

```tsx
import { useState } from "react";
import { BranchSwitcher, type BranchItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const branches: BranchItem[] = [
  { name: "main", kind: "local" },
  { name: "feature/booking-calendar", kind: "local", ahead: 2, behind: 5 },
];

export function Branch() {
  const [current, setCurrent] = useState("main");
  return <BranchSwitcher branches={branches} current={current} onCurrentChange={setCurrent} base="main" />;
}
```
