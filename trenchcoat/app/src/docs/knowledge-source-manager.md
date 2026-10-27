---
pattern: listbox
status: new
related: retrieval-settings, retrieval-inspector, dropzone, kill-switch
---

## Overview

Lists the sources a knowledge base answers from – files, sites and connectors – and where each one stands: queued,
indexing with its progress, ready, paused, or failed with the reason. Every row shows its documents and chunks, when it
last synced and how often it syncs, and a Stale or Duplicate flag when the app raises one. Picking a source opens it
beside the list with its warnings explained, its sync schedule, and Review chunks, Resync, Pause and Remove; Remove
asks first and says what leaves the index. It stays fast with thousands of sources. The element ingests nothing –
Add, Resync, Pause and Review chunks are events, and the app reports progress back through `sources`.

## When to use

- The sources page of an assistant, a help-centre search or any product built on retrieval.
- Anywhere people need to see why answers are missing something: a failed import, a stale site, two copies of the
  same documents.
- As the first step of a knowledge workflow, handing off to chunk review and to `retrieval-settings`.

## When not to use

- Uploading files and watching each upload – use `dropzone`, then add the uploads as a source.
- Tuning how sources are searched – use `retrieval-settings`.
- Seeing which chunks one answer used – use `retrieval-inspector`.

## Anatomy

1. **Header** `.tc-head` – a book icon, the title, how many sources and chunks there are, and Add source
2. **Filter** `.ui-ksm__show` – All, or Needs attention with its count
3. **Source** `.ui-ksm__row` – name and flags, counts and sync (or the failure), and the state
4. **State** `.ui-ksm__state` – an icon and a label; a ring that fills while indexing
5. **Open source** `.ui-ksm__detail` – facts, warnings, the schedule and the actions

## Looks

Standard is a gray tray holding the header and Add source, with the list on a white card; kinds sit on tinted tiles
and states are tinted pills. Clean is one white card with hairline dividers: outlined kind tiles, states as a coloured
icon and plain label, thinner icons. Wide, the open source sits beside the list; narrow, below it, and in a narrow
container the state shows as its icon alone.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Add source, the filter, the list, then the open source's controls |
| ↑ / ↓ | In the list: moves to the previous or next source and opens it |
| Home / End | In the list: the first or last source |
| Page Up / Page Down | In the list: eight sources up or down |
| Delete / Backspace | In the list: asks to remove the source in focus (focus goes to Cancel) |
| Escape | In the list or the open source: closes it; while confirming a removal, cancels and returns to Remove |
| ← / → / ↑ / ↓ | In the filter: switches between All and Needs attention |

After a removal the next source opens and focus returns to the list; when the last source goes, focus moves to Add
source.

## Screen readers

The list is a `listbox` named by the heading, with `aria-activedescendant` on the active `option`; options carry
`aria-posinset` and `aria-setsize`, so a windowed list still reads “1,204 of 2,000”. Each option reads its name, its
flags, its state and its line – “Product docs, Indexing 42%. 860 docs · 9.4k chunks · Synced 1 day ago · Every hour”.
The open source is a section named by the source; indexing shows a `progressbar` named “Indexing Product docs”. The
removal question is a group named by its sentence – “Remove Pricing PDFs? Its 240 chunks leave the index and answers
stop citing it.” A status region says when a source finishes or fails (“Product docs is ready”, “Pricing PDFs failed:
…”), when one is removed, and how many sources the filter shows.

## Content

- Name sources as people know them – “Help centre”, “Pricing PDFs” – and put the path or URL in `location`.
- Write `error` as what went wrong and what fixes it: “3 of 14 files are scanned images with no text. Upload text
  versions or turn on OCR.”
- Pass `stale` as the reason when you have one (“12 pages changed since”); `true` gets a generic line.
- Point `duplicateOf` at the other source's id, so the warning names it.

## Do

- Send `now`, so last syncs read “2h ago” rather than a date.
- Move sources through queued → indexing → ready yourself and pass `progress`; the element only shows it.
- Wire `onReviewChunks` to your chunk editor, so a stale or duplicate source can be checked before it's removed.

## Don't

- Don't remove a source without the confirmation – chunks leave the index and answers change.
- Don't mark sources stale on a timer alone; say what changed.
- Don't use it as an upload queue – a source is something that syncs, not a one-off file transfer.

## Example

```html
<tc-knowledge-source-manager id="ksm"></tc-knowledge-source-manager>

<script type="module">
  import "trenchcoat/knowledge-source-manager";
  import "trenchcoat/tokens.css";

  const ksm = document.querySelector("#ksm");
  ksm.now = Date.now();
  ksm.sources = [
    { id: "help", name: "Help centre", kind: "site", state: "ready", docs: 1204, chunks: 18310, lastSync: Date.now() - 7200000, schedule: "daily" },
    { id: "docs", name: "Product docs", kind: "connector", state: "indexing", progress: 0.4 },
  ];
  ksm.addEventListener("tc-resync", (e) => console.log("sync", e.detail.source.id));
  ksm.addEventListener("tc-review-chunks", (e) => console.log("review", e.detail.source.id));
</script>
```

```tsx
import { useState } from "react";
import { KnowledgeSourceManager, type KnowledgeSource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Sources({ initial }: { initial: KnowledgeSource[] }) {
  const [sources, setSources] = useState(initial);
  return (
    <KnowledgeSourceManager
      sources={sources}
      onSourcesChange={setSources}
      onAdd={() => console.log("open the picker")}
      onResync={(s) => setSources((list) => list.map((x) => (x.id === s.id ? { ...x, state: "queued" } : x)))}
      onReviewChunks={(s) => console.log("review", s.id)}
    />
  );
}
```
