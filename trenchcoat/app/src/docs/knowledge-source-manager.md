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

With `add-inline`, Add source opens an **Add sources** panel at the top of the card instead of firing `tc-add`. It has
three ways in:

- **Files:** a drop area and Choose files, limited by `accept` and `max-file-size`.
- **Links:** one or many, on lines or with spaces between them. Each is checked, and links already waiting or already
  a source are dropped. You choose how far to crawl: this page only, or the section of the site under it.
- **Paste text:** pasted text with a title.

Everything waiting shows as a row with its type and size, and can be taken off again. Add fires `tc-sources-add` with
the files, links, crawl depth and texts. Unless that's prevented, the new sources join the list as queued through
`tc-sources-change` (`type: "add"`), until the app passes the real ones.

## When to use

- The sources page of an assistant, a help-centre search or any product built on retrieval.
- Anywhere people need to see why answers are missing something: a failed import, a stale site, two copies of the
  same documents.
- As the first step of a knowledge workflow, handing off to chunk review and to `retrieval-settings`.
- Letting people add files, links and notes in place, with `add-inline`, when the app has no picker of its own.

## When not to use

- Uploading files and watching each upload's progress – use `dropzone`, then add the uploads as a source. The Add
  sources panel hands files over without uploading them.
- Tuning how sources are searched – use `retrieval-settings`.
- Seeing which chunks one answer used – use `retrieval-inspector`.

## Anatomy

1. **Header** `.tc-head` – a book icon, the title, how many sources and chunks there are, and Add source
2. **Filter** `.ui-ksm__show` – All, or Needs attention with its count
3. **Source** `.ui-ksm__row` – name and flags, counts and sync (or the failure), and the state
4. **State** `.ui-ksm__state` – an icon and a label; a ring that fills while indexing
5. **Open source** `.ui-ksm__detail` – facts, warnings, the schedule and the actions
6. **Add sources** `.ui-ksm__adder` – with `add-inline`: the drop area `.ui-ksm__drop`, links `.ui-ksm__links` with
   the crawl choice `.ui-ksm__depth`, Paste text `.ui-ksm__paste`, the waiting list `.ui-ksm__pending`, and Cancel
   and Add

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
| Enter / Space | On Add source with `add-inline`: opens or closes the Add sources panel, focusing Choose files |
| ⌘ Enter / Ctrl Enter | In the links field: adds the links to the waiting list |
| Escape | Anywhere in the Add sources panel: closes it, dropping what's waiting, and returns to Add source |

The crawl choice is a pair of native radio buttons, moved with the arrow keys. Taking an item off the waiting list moves
focus to the next one's Remove.

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

With `add-inline`, Add source says whether the panel is expanded. The panel is a section named “Add sources”. Choose
files is described by the drop area's line, which gives the allowed types and size. The links field is labelled
“Links”; when some entries aren't links it's `aria-invalid` and described by which ones. The crawl choice is a group
named “Crawl”, and Paste text says whether it's expanded. The waiting list is a list named “To add”. Each row reads its
name, type and size (“Q3-ledger.pdf, PDF · 1.2 MB”), and its Remove button is named “Remove Q3-ledger.pdf”. The status
region says what joined the list, what was turned away and why (“Scan.tiff isn't a type this takes”), what was
already there, and “Adding 3 sources” once added. Add is `aria-disabled` while nothing is waiting, and pressing it then
says what to do first.

## Content

- Name sources as people know them – “Help centre”, “Pricing PDFs” – and put the path or URL in `location`.
- Write `error` as what went wrong and what fixes it: “3 of 14 files are scanned images with no text. Upload text
  versions or turn on OCR.”
- Pass `stale` as the reason when you have one (“12 pages changed since”); `true` gets a generic line.
- Point `duplicateOf` at the other source's id, so the warning names it.
- Set `accept` to what the indexer really reads, so the drop area turns the rest away with a reason before Add.

## Do

- Send `now`, so last syncs read “2h ago” rather than a date.
- Move sources through queued → indexing → ready yourself and pass `progress`; the element only shows it.
- Wire `onReviewChunks` to your chunk editor, so a stale or duplicate source can be checked before it's removed.
- Start ingesting on `tc-sources-add`, then replace the queued placeholders with your own sources and ids.

## Don't

- Don't remove a source without the confirmation – chunks leave the index and answers change.
- Don't mark sources stale on a timer alone; say what changed.
- Don't use it as an upload queue – a source is something that syncs, not a one-off file transfer.
- Don't crawl a whole site when people chose this page only – `depth` is their decision about what's answered from.

## Example

```html
<tc-knowledge-source-manager id="ksm"></tc-knowledge-source-manager>

<script type="module">
  import "@adamstavely/trenchcoat/knowledge-source-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const ksm = document.querySelector("#ksm");
  ksm.now = Date.now();
  ksm.sources = [
    { id: "help", name: "Help centre", kind: "site", state: "ready", docs: 1204, chunks: 18310, lastSync: Date.now() - 7200000, schedule: "daily" },
    { id: "docs", name: "Product docs", kind: "connector", state: "indexing", progress: 0.4 },
  ];
  ksm.addEventListener("tc-resync", (e) => console.log("sync", e.detail.source.id));
  ksm.addEventListener("tc-review-chunks", (e) => console.log("review", e.detail.source.id));
  // Add source opens the built-in panel: files, links and pasted text
  ksm.addInline = true;
  ksm.accept = ".pdf,.docx,.md";
  ksm.addEventListener("tc-sources-add", (e) => console.log("ingest", e.detail.files, e.detail.urls, e.detail.depth, e.detail.texts));
</script>
```

```tsx
import { useState } from "react";
import { KnowledgeSourceManager, type KnowledgeSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Sources({ initial }: { initial: KnowledgeSource[] }) {
  const [sources, setSources] = useState(initial);
  return (
    <KnowledgeSourceManager
      sources={sources}
      onSourcesChange={setSources}
      accept=".pdf,.docx,.md"
      onSourcesAdd={({ files, urls, depth, texts }) => console.log("ingest", files, urls, depth, texts)}
      onResync={(s) => setSources((list) => list.map((x) => (x.id === s.id ? { ...x, state: "queued" } : x)))}
      onReviewChunks={(s) => console.log("review", s.id)}
    />
  );
}
```
