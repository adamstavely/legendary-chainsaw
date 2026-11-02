---
pattern: accordion
status: new
related: code-block, change-list, inline-diff, session-panel
---

## Overview

The changes to a set of files. The top gives the totals, and each file is a row with its status and the lines added and
removed, opening to a line diff with long unchanged runs folded. Give it each file's text before and after; any source
works, and it doesn't need to know about Git.

## When to use

- A Changes view in a session or review panel: everything a branch, run or agent changed.
- Showing what a set of edits would do before someone accepts them.

## When not to use

- A list of pull requests – use `change-list`.
- One block of code against its current file – use `code-block`.
- Edits to prose, word by word – use `inline-diff`.

## Anatomy

1. **Totals** `.ui-dfv__totals` – files, lines added and removed
2. **Expand all** `.ui-dfv__all` – opens or closes every file
3. **File** `.ui-dfv__file` – one changed file
4. **Row** `.ui-dfv__toggle` – opens the file's diff
5. **Status** `.ui-dfv__status` – Added, Modified, Deleted or Renamed; hidden when narrow
6. **Counts** `.ui-dfv__counts` – lines added and removed
7. **Diff** `.ui-dfv__body` – a `tc-code-block` in its diff view

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Keyboard

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between file rows |
| Home / End | Go to the first or last row |
| Enter / Space | Open or close the file |
| Tab | Moves on to the file's diff, which scrolls with the arrow keys |

## Screen readers

Rows are buttons with `aria-expanded`, in a list named by the heading. Each names its path, status and counts. Every diff
is a region named after its changes, with added and removed lines marked as Code Block marks them. `role="status"` says
when a file opens or closes.

## Content

- Leave `before` out for a new file and `after` out for a deleted one, and the status follows.
- Set `previousPath` for a rename, and `binary` for a file with no text to compare.

## Do

- Keep `autoExpand` small on a large change: only open files draw a diff.
- List files in an order that helps, such as the most important first.

## Don't

- Don't use it to apply or reject changes. It only shows them; put those actions beside it.

## Example

```html
<tc-diff-viewer id="changes"></tc-diff-viewer>

<script type="module">
  import "trenchcoat/diff-viewer";
  import "trenchcoat/tokens.css";

  document.querySelector("#changes").files = [
    { path: "src/limit.ts", before: "export const LIMIT = 1;\n", after: "export const LIMIT = 2;\n" },
    { path: "src/new.ts", after: "export {};\n" },
  ];
</script>
```

```tsx
import { DiffViewer, type DiffFile } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const files: DiffFile[] = [
  { path: "src/limit.ts", before: "export const LIMIT = 1;\n", after: "export const LIMIT = 2;\n" },
  { path: "src/new.ts", after: "export {};\n" },
];

export function Changes() {
  return <DiffViewer files={files} description="Compared with main" />;
}
```
