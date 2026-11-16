---
pattern: grid
status: new
related: diff-viewer, change-list, pull-request, trace-waterfall, run-compare
---

## Overview

What a coding agent changed in a pull request, edit by edit over time. On top, the lines added and removed so far, as two lines over each other. Under it, a row per file in the order the agent reached it, each with its edits as marks on the same time axis and a small bar of its own lines added and removed. Pointing at or focusing an edit shows its diff below the rows; a click or Enter keeps it there. A scrubber and Play replay the run, and a file's row appears when the agent first reaches it.

## When to use

- Showing what a coding agent did to a pull request – live while it works, or as a replay afterwards.
- Review screens where people want to see when the big changes happened and which files they touched.

## When not to use

- The final changes, file by file with full line diffs – use `diff-viewer`.
- A list of pull requests or proposed changes – use `change-list`.
- Hundreds of edits or files: the rows get too thin. Group them by folder first.
- Comparing more than one run – use `run-compare`.

## Anatomy

1. **Totals** `.ui-dtl__totals` – lines added and removed so far, and how many files, in the header
2. **Chart** `.ui-dtl__plot` – a `.ui-dtl__series` for lines added and one for lines removed, and `.ui-dtl__cursor` while replaying
3. **Controls** `.ui-dtl__controls` – `.ui-dtl__play` and the `.ui-dtl__scrub` scrubber
4. **Rows** `.ui-dtl__rows` – a `.ui-dtl__row` per file: `.ui-dtl__path`, a `.ui-dtl__track` of `.ui-dtl__mark` edits, and `.ui-dtl__bar`
5. **Detail** `.ui-dtl__detail` – the edit's summary and its `.ui-dtl__diff`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-dtl-chart` (the chart's height), `--tc-dtl-path` and `--tc-dtl-bar` (the column widths), `--tc-dtl-mark` (an edit's dot), and `--tc-dtl-added` and `--tc-dtl-removed` (the two colours). The removed line is dashed, so the two don't rely on colour alone.

## Keyboard

| Key | What it does |
|---|---|
| ← → | Move to the previous or next edit in the file |
| ↑ ↓ | Move to the nearest edit in the file above or below |
| Home / End | Go to the file's first or last edit |
| Enter / Space | Keep the edit's diff open, or let it go |
| Escape | Close the diff, and go back to the edit |
| ← → on the scrubber | Move the replay a second at a time |

## Screen readers

The chart is an image whose name gives the totals. The rows are a grid with one tab stop: each row's header is the file's path, and each edit's name says when it happened, the lines added and removed, and its summary. In the diff, added and removed lines start with the words "Added" and "Removed", not just + and −. The scrubber reads its position as time from the start.

## Content

- `summary` says what the edit did in a few words: "Shift forward by the gap's length".
- `diff` is a few lines only, each starting with "+", "-" or a space – it's a taste of the edit, not the whole file.
- Times are epoch ms; `start` and `end` default to the first and last edit.

## Do

- Set `live` while the agent works, and add edits to `files` as they come.
- Own `time` when the replay position should survive a reload or be shared in a link.

## Don't

- Don't pass every line of every edit in `diff` – link to the full diff instead.
- Don't use it for edits by several agents at once.

## Example

```html
<tc-diff-timeline id="pr" heading="Fix parsing in the skipped hour"></tc-diff-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/diff-timeline";
  import "@adamstavely/trenchcoat/tokens.css";

  const pr = document.querySelector("#pr");
  const start = Date.now() - 600000;
  pr.files = [
    {
      path: "src/parse/local.ts",
      edits: [
        { id: "a", at: start + 60000, added: 14, removed: 6, summary: "Detect a skipped hour", diff: "-  const offset = zone.offsetAt(naive);\n+  if (zone.isGap(naive)) return shiftForward(naive, zone);" },
        { id: "b", at: start + 300000, added: 9, removed: 2, summary: "Shift forward by the gap" },
      ],
    },
    { path: "test/parse-dst.test.ts", edits: [{ id: "c", at: start + 420000, added: 42, removed: 0, summary: "Tests for both changes" }] },
  ];
  pr.addEventListener("tc-time-change", (e) => console.log(e.detail.time));
</script>
```

```tsx
import { useState } from "react";
import { DiffTimeline, type DiffTimelineFile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PullRequestReplay({ files }: { files: DiffTimelineFile[] }) {
  const [time, setTime] = useState<number | null>(null);
  return <DiffTimeline title="Fix parsing in the skipped hour" files={files} time={time} onTimeChange={setTime} />;
}
```
