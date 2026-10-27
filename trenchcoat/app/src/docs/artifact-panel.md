---
pattern: listbox
status: new
related: code-block, inline-diff, run-compare, image-grid
---

## Overview

Everything an agent run produced, in one place: documents, code, images and tables, listed on the left with a preview
of the one picked. Each artifact keeps its versions, so people can step back through them and turn on Compare to see
what changed since the version before – words for documents, lines for code, rows for tables, before and after for
images. Download saves the version shown. An artifact the run is still writing says “Writing” in the list and streams
into its preview.

## When to use

- Beside a chat or an agent run that produces files people will keep: reports, scripts, charts, exports.
- When the same file goes through several drafts and people want to see what each draft changed.
- Collecting outputs of different types – text, code, images, tables – behind one list.

## When not to use

- A single piece of code with Copy and Apply – use `code-block`.
- Showing the changes in one text, without a list or versions – use `inline-diff`.
- Comparing two whole runs side by side – use `run-compare`.
- A grid of generated images to pick from – use `image-grid`.

## Anatomy

1. **List** `.ui-artp__list` – everything the run produced, with type, size and version count
2. **Artifact** `.ui-artp__option:nth-child(3)` – one file in the list; “Writing” while the run produces it
3. **Title bar** `.ui-artp__bar` – the file's name and the version's note; version chips and Compare sit below it
4. **Download** `.ui-artp__bar .ui-artp__btn` – saves the version shown
5. **Preview** `.ui-artp__preview` – the document, code, image or table
6. **Caption** `.ui-artp__foot` – how many files and versions, or what's being written

## Looks

Standard sets a white card on the gray tray, with the list on a gray column and the picked file raised on it; the
caption (“3 files · 6 versions”) sits on the tray below. Clean is one white card with hairline rows, the picked file
on a light fill, and the caption as the card's last row. On a narrow card both put the list above the preview.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the list, Download, the versions, Compare and the preview |
| ↓ / ↑ | In the list: picks the next or previous file |
| Home / End | In the list: the first or last file; in the versions: the first or latest version |
| A letter | In the list: jumps to the next file whose name starts with what was typed |
| → / ← (or ↓ / ↑) | In the versions: picks the next or previous version, wrapping around |
| Enter / Space | Presses Download or Compare |

Selection follows focus in the list and in the versions. The document and table previews are focusable so they
can be scrolled with the arrow keys.

## Screen readers

The panel is a region named by its heading (“Artifacts”). The list is a listbox named “Files”; each option reads
its name and then its type, size and number of versions, and whether it's selected. The versions
are a radio group named “Versions”, each read with its time and note (“v3, 2 min ago, Tightened the intro,
latest”). Compare is a toggle button (`aria-pressed`). In a comparison, removed and added text is introduced as
“Removed:” and “Added:”, and table rows as “Added row:” or “Removed row:”. Download is named “Download
churn-report.md”, and a status region says “Downloading churn-report.md”. A document still being written is
`aria-busy`.

## Content

- Use the real file name with its extension in `name` – it's what people recognise, and the download's name.
- Write each version's `note` as what changed, in a few words: “Tightened the intro”, “Added Q2 comparison”.
- Give images an `alt` that says what the picture shows, not the file name.
- Keep `time` relative and short: “2 min ago”.

## Do

- Mark an artifact `status: "writing"` while the run produces it, and add versions as they arrive.
- Set `language` on code so it gets the right colours and label.
- Listen for `tc-download` (React: `onDownload`) and call `preventDefault()` to serve the file from your own storage.

## Don't

- Don't put unrelated uploads in it – it's for what the run produced.
- Don't create a new artifact for each draft of the same file; add a version instead, so Compare works.
- Don't set `previewHeight` so tall that the versions and the preview don't fit on screen together.

## Example

```html
<tc-artifact-panel id="outputs"></tc-artifact-panel>

<script type="module">
  import "trenchcoat/artifact-panel";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#outputs");
  panel.artifacts = [
    {
      id: "report",
      name: "churn-report.md",
      kind: "text",
      versions: [
        { id: "r1", note: "First draft", content: "# Q3 churn\n\nChurn rose to 4.1%." },
        { id: "r2", note: "Added the cause", content: "# Q3 churn\n\nChurn rose to 4.1%, mostly on Starter." },
      ],
    },
    { id: "plot", name: "plot.py", kind: "code", language: "py", versions: [{ id: "p1", content: "import pandas as pd\n" }] },
  ];
  panel.addEventListener("tc-download", (e) => console.log("Saving", e.detail.artifact.name));
</script>
```

```tsx
import { ArtifactPanel, type Artifact } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const artifacts: Artifact[] = [
  {
    id: "report",
    name: "churn-report.md",
    kind: "text",
    size: "2.1 KB",
    versions: [
      { id: "r1", time: "14 min ago", note: "First draft", content: "# Q3 churn\n\nChurn rose to 4.1%." },
      { id: "r2", time: "2 min ago", note: "Added the cause", content: "# Q3 churn\n\nChurn rose to 4.1%, mostly on Starter." },
    ],
  },
];

export function RunOutputs() {
  return <ArtifactPanel artifacts={artifacts} defaultView="diff" onDownload={(artifact) => console.log(artifact.name)} />;
}
```
