---
pattern: tree
status: new
related: check-status, search-results, file-tree, terminal
---

## Overview

What a build, type check or linter found. Problems are grouped by file, worst files first, and each shows a mark for its
severity, the message, where it came from and its line. The header counts errors, warnings and notes; a severity filter
with counts and a text filter narrow the list. A problem with a quick fix has a button for it. Nothing here runs a check:
the page passes `problems` and a `status`, and decides what opening one or applying a fix means.

## When to use

- A Problems view beside an editor, terminal or session.
- The result of a CI job or a local check, where each finding points at a line.
- Validation findings on a set of files, such as a content or data lint.

## When not to use

- Whether checks passed, without their details – use `check-status`.
- A finding that needs evidence and a review, such as a security finding – use `agent-findings`.
- Raw tool output – use `terminal`.

## Anatomy

1. **Filters** `.ui-prob__filters` – the severity filter `.ui-prob__segs` with counts, and the text filter `.ui-prob__field`
2. **File** `.ui-prob__file` – a file's name, folder `.ui-prob__folder` and count `.ui-prob__count`
3. **Problem** `.ui-prob__problem` – the severity mark `.ui-prob__mark`, the message `.ui-prob__message` and its details `.ui-prob__meta`
4. **Where** `.ui-prob__where` – the line and column
5. **Fix** `.ui-prob__fix` – a quick fix's button
6. **Summary** `.ui-prob__summary` – the counts in the header
7. **Empty** `.ui-prob__empty` – "No problems", with a check

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Errors are red with a circled cross, warnings amber with a triangle, notes blue with a circled i. A page can set
`--tc-prob-indent`, how far problems sit under their file, and `--tc-prob-mark-nudge`, which lines the mark up with the
message's first line. When the card is narrower than 360 px, fix buttons show only their icon and folders are left out.

## Keyboard

The severity filter, the text filter and the list are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in the severity filter | Chooses the next or previous severity |
| Esc in the text filter | Clears it |
| ↑ / ↓ | Move between files and problems |
| → | Opens a file, goes to its first problem, or to a problem's fix |
| ← | Goes back from a fix, closes a file, or goes from a problem to its file |
| Home / End | Go to the first or last row |
| Enter / Space | Opens a problem, folds a file, or applies the fix that has focus |

## Screen readers

The list is a `tree` named by the heading. Files are `treeitem`s at level 1 with `aria-expanded`, and problems are at
level 2 with `aria-selected`. Each problem's severity is read as a word before the message, for example "Error: Cannot
find name 'Reading'.", and its line as "Line 3:50". The severity filter is a `radiogroup`. A `role="status"` says how many
problems are shown, or that a check is running, and the list is `aria-busy` while it runs.

## Content

- Write messages as the tool gives them. Put the tool in `source` and its rule or error number in `code`.
- Give each problem an `id` if the same message can appear twice on a line. Otherwise `problemKey` builds one from its
  place, severity, source, code and message, and exact copies get `#2`, `#3`… so each row is still its own.
- A `fix` is the fix's label, such as "Import 'Reading'". The element does nothing else with it: the page applies it on
  `tc-fix`.
- `group-by="none"` lists problems without files, each with its path, for a short list.

## Do

- Set `status` to "running" while a check runs. The last results stay until new ones arrive.
- Remove or update a problem once its fix is applied, so the list stays true.

## Don't

- Don't use it for thousands of problems at once. Every row is drawn, so filter to a file or a severity first.
- Don't put colour-only meaning in messages. The mark and the word already say how serious a problem is.

## Example

```html
<tc-problem-list id="problems"></tc-problem-list>

<script type="module">
  import "trenchcoat/problem-list";
  import "trenchcoat/tokens.css";

  const list = document.querySelector("#problems");
  list.problems = [
    { path: "src/lib/freezer.ts", line: 3, column: 50, severity: "error", message: "Cannot find name 'Reading'.", source: "ts", code: "TS2304" },
  ];
  list.addEventListener("tc-open", (e) => console.log(e.detail.path, e.detail.line));
</script>
```

```tsx
import { ProblemList, type ProblemItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Problems({ problems, open, fix }: { problems: ProblemItem[]; open: (path: string, line: number) => void; fix: (p: ProblemItem) => void }) {
  return <ProblemList problems={problems} defaultFilter="error" onTcOpen={(e) => open(e.detail.path, e.detail.line)} onTcFix={(e) => fix(e.detail.problem)} />;
}
```
