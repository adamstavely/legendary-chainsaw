---
pattern: tree
status: new
related: diff-viewer, terminal, tree-select, session-panel
---

## Overview

A project's files. Folders fold, a filter keeps the matches and the folders they're in, and each file has an icon for its
kind and an optional Git status. It works with any source of files, and long trees stay fast because only the rows near the
view are drawn.

## When to use

- A Files view in a session, editor or review panel.
- Choosing a file from a project, with `tc-open` to show it.

## When not to use

- Choosing a value from a hierarchy in a form – use `tree-select`.
- What changed in a set of files, with diffs – use `diff-viewer`.

## Anatomy

1. **Filter** `.ui-ftr__filter` – narrows the tree as you type
2. **Row** `.ui-ftr__row` – one file or folder, with its `data-kind`
3. **Chevron** `.ui-ftr__chevron` – a folder's state
4. **Icon** `.ui-ftr__icon` – a file's kind
5. **Name** `.ui-ftr__name` – what the filter matched is marked with `.ui-ftr__hit`
6. **Status** `.ui-ftr__status` – a letter for its Git status
7. **Actions** `.ui-ftr__actions` – buttons in the header

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A
page can set `--tc-file-tree-indent`, the step for each level.

## Keyboard

The tree is one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between rows |
| → | Opens a folder, then goes to its first child |
| ← | Closes a folder, or goes to the parent |
| Home / End | Go to the first or last row |
| Enter / Space | Opens a file, or folds a folder |
| Letters | Jump to the next name that starts with them |
| ↓ in the filter | Moves into the tree |
| Esc in the filter | Clears it |

## Screen readers

It's a `tree` named by the heading, and rows are `treeitem`s with their level, position, `aria-expanded` and `aria-selected`.
A Git status is read as a word. `role="status"` says how many files match the filter.

## Content

- `fileTreeFromPaths` builds `nodes` from a flat list such as Git's. A path ending in `/` is an empty folder. Backslashes
  count as slashes, `.` parts are dropped and `..` goes up a folder, so `./lib/a.ts` and `lib\a.ts` are one file.
- Set `lazy` on a folder whose children aren't known, then add `children` when `tc-load` fires.
- While filtering, folders with a match start open, and a folder whose own name matches shows everything in it. Folders
  can still be opened and closed; that's the filter's own view and doesn't change `expanded`.
- `selected` and `expanded` hold paths from the root, so two files can't share one.

## Do

- Listen for `tc-open` to show a file: it also fires for a file that's already selected.
- Use `searchable` only if the page can search inside files. The tree finds names; `tc-search` is yours to answer.

## Don't

- Don't filter lazy folders and expect their contents to match: only names already loaded are searched.
- Don't add rename, move or delete here. Put those in `actions` or a menu beside it.

## Example

```html
<tc-file-tree id="files"></tc-file-tree>

<script type="module">
  import { fileTreeFromPaths } from "trenchcoat/file-tree";
  import "trenchcoat/tokens.css";

  const tree = document.querySelector("#files");
  tree.nodes = fileTreeFromPaths(["src/index.ts", "src/a.ts", "README.md"]);
  tree.addEventListener("tc-open", (e) => console.log(e.detail.path));
</script>
```

```tsx
import { FileTree, fileTreeFromPaths } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const nodes = fileTreeFromPaths(["src/index.ts", "src/a.ts", "README.md"]);

export function Files({ open }: { open: (path: string) => void }) {
  return <FileTree nodes={nodes} defaultExpanded={["src"]} onTcOpen={(e) => open(e.detail.path)} />;
}
```
