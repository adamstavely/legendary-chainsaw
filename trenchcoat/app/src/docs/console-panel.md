---
pattern: tree
status: new
related: network-log, preview-frame, problem-list, terminal
---

## Overview

A web page's browser console. Errors, warnings, info, logs and debug lines appear oldest first. Each row has a mark for its
level, the message in monospace, a badge when it repeated, and the file and line it came from. Level chips with counts
and a text filter narrow the list, and Clear empties it. An error or warning with a stack folds open to show the frames.
Nothing here reads a real console: the page passes `entries` and decides what Clear means.

## When to use

- The console of a page shown in a `preview-frame`, beside a session or editor.
- Messages captured from a test run or a user's session replay, where each came from a line of code.
- Any log of levelled, short messages that a reader filters by level.

## When not to use

- Raw command output with colours – use `terminal`.
- Findings from a type check or linter, grouped by file – use `problem-list`.
- The page's requests – use `network-log`.
- Steps an agent took in a sandbox – use `sandbox-log`.

## Anatomy

1. **Toolbar** `.ui-dcon__toolbar` – the level chips `.ui-dcon__chips`, the text filter `.ui-dcon__field` and Clear `.ui-dcon__clear`
2. **Entry** `.ui-dcon__entry` – a level mark `.ui-dcon__mark`, the time `.ui-dcon__time`, the message `.ui-dcon__message` and the source `.ui-dcon__source`
3. **Repeat badge** `.ui-dcon__count` – how many times the message came in a row
4. **Stack frame** `.ui-dcon__frame` – one line of an open stack, under its entry
5. **Summary** `.ui-dcon__summary` – the error and warning counts in the header
6. **Empty** `.ui-dcon__empty` – "No messages", or "No messages match" when the filters hide everything

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Error rows are tinted red with a circled cross and warning rows amber with a triangle; info has a circled i, logs a
chevron and debug a code mark in a quieter colour. A page can set `--tc-dcon-indent`, how far stack frames sit under
their entry, and `--tc-dcon-mark-nudge`, which lines the mark up with the message's first line. When the card is
narrower than 420 px, sources drop under their message, times are left out and the chips show only their marks and
counts.

## Keyboard

The level chips, the text filter, Clear and the list are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in the chips | Move between level chips |
| Enter / Space on a chip | Shows or hides that level |
| Esc in the text filter | Clears it |
| ↑ / ↓ | Move between messages and open stack frames |
| → | Opens a message's stack, or goes to its first frame |
| ← | Closes a stack, or goes from a frame back to its message |
| Home / End | Go to the first or last row |
| Enter / Space | Opens or closes a message's stack |

## Screen readers

The list is a `tree` named by the heading. Messages are `treeitem`s at level 1, with `aria-expanded` when they have a
stack, and stack frames are at level 2. Each message's level is read as a word before it, for example "Error: Cannot
read properties of undefined", and a repeat badge as "4 times". The level chips are toggle buttons with
`aria-pressed`, in a group named "Levels". A `role="status"` says how many messages are shown.

## Content

- Pass messages as the console printed them, with `source` as "file:line".
- Give each entry a stable `id`; open stacks are kept by id.
- Fold repeats into one entry with a `count`, as browsers do, rather than passing the same message many times.
- `time` is epoch ms and shows as hours, minutes, seconds and milliseconds in the `locale`.

## Do

- Keep `entries` in the order they arrived, and append new ones.
- Prevent `tc-clear` when the page clears its own store, then pass the empty list.
- Unprevented, Clear hides the messages that were there, by `id`, even when the same list is passed again – as React does
  on every render – so a cleared console stays clear; messages with new ids show.

## Don't

- Don't pass thousands of lines at once. Every row is drawn, so trim old messages or filter first.
- Don't put HTML in messages. They're shown as text.

## Example

```html
<tc-console-panel id="console"></tc-console-panel>

<script type="module">
  import "trenchcoat/console-panel";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#console");
  panel.entries = [
    { id: "1", level: "warn", message: "'unload' event listeners are deprecated.", source: "session.js:31" },
    { id: "2", level: "error", message: "Cannot read properties of undefined (reading 'deadline')", source: "reviewer-panel.js:142", stack: ["at ReviewerPanel.render (reviewer-panel.js:142:31)"] },
  ];
  panel.addEventListener("tc-clear", () => console.log("cleared"));
</script>
```

```tsx
import { ConsolePanel, type ConsoleEntry } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PageConsole({ entries, clear }: { entries: ConsoleEntry[]; clear: () => void }) {
  return <ConsolePanel entries={entries} defaultLevels={["error", "warn"]} onTcClear={(e) => { e.preventDefault(); clear(); }} />;
}
```
