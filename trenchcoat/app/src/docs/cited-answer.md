---
pattern: disclosure
status: stable
related: ai-answer, answer-arena, tool-call-card
---

## Overview

An AI answer wired to the sources it relies on. Each cited sentence ends in small numbered markers, and the sources
wait below as chips. Point at a marker and its source lights up with the sentence; point at a chip and every
sentence that cites it lights up while the rest fades back. Click either to unfold the quoted passage in place, with
the words that back the answer marked, Open source and Copy quote – so people can check a claim without leaving the
answer. When the page has the full text of a source, View in document opens it in a side sheet, scrolled to the
cited passage, with Previous and Next through every passage the answer cites from that document.

## When to use

- Answers built from search or retrieval, where people need to check what a sentence rests on.
- Research and support tools where a claim without a source shouldn't be trusted.
- Showing how much of an answer is backed – the line under it counts the cited sentences.
- Checking a quote in context: give `documents` (or `loadDocument`) and people read the passage where it sits.

## When not to use

- A streamed chat answer with source cards, copy, regenerate, feedback and follow-ups – use `ai-answer`.
- Comparing two models' answers to the same prompt – use `answer-arena`.
- Showing the raw call to a search or retrieval tool and what it returned – use `tool-call-card`.

## Anatomy

1. **Head** `.ui-ca__head` – the first sources' marks, how many sources and how many pages were read
2. **Answer** `.ui-ca__text` – the text, in paragraphs
3. **Marker** `.ui-ca__marker` – the number of a source, at the end of a sentence that cites it
4. **Source chip** `.ui-ca__chip` – a source's mark, short name and number
5. **Preview** `.ui-ca__fold` – the quoted passage with Open source and Copy quote, unfolded in place
6. **Caption** `.ui-ca__caption` – what you're pointing at, or how many sentences are backed
7. **Action** `.ui-ca__action` – an optional button, e.g. “Follow up”
8. **View in document** `.ui-ca__view` – in the preview, when the source's document is available
9. **Source viewer** `.ui-ca__viewer` – the side sheet: the source's title and site, Previous / Next passage
   (`.ui-ca__vw-step`), Open source, and the document (`.ui-ca__vw-doc`) with the passages marked (`.ui-ca__passage`)

## Looks

Standard sets the answer in a white card on a gray tray, with the chips, the caption and the action on the tray
below it. Clean is one white card: the chips sit inside it as outlined pills that fold into a “+N” button when they
don't fit on one line, and the caption and action form the card's last row under a hairline.

The source viewer follows the look: Standard puts the document in a white card on a gray sheet, Clean is one sheet
with hairlines. It's 560px wide, or the whole screen when that's narrower – set `--tc-cited-answer-viewer-w` on the
element to change it. The current passage has the highlight and an accent underline; the answer's other passages from
the same document get a quiet fill.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the markers, then the chips, then the open preview's buttons and the action |
| Enter / Space | On a marker or chip: opens its preview, or closes it if it's open |
| ← / → | On a chip: moves to the previous or next chip (and “+N”) |
| Home / End | On a chip: moves to the first or last chip |
| Escape | Closes the preview and returns focus to the marker or chip that opened it |
| Enter / Space on View in document | Opens the source viewer; focus goes to the document text |
| Tab / Shift+Tab in the viewer | Moves through Close, Previous, Next, Open source and the text – focus stays in the viewer |
| ↑ / ↓ / Page Up / Page Down on the text | Scrolls the document |
| Escape in the viewer | Closes it and returns focus to View in document (the preview stays open) |

Focusing a marker or chip lights it up the same way pointing does.

## Screen readers

The component is a group named “Answer with sources” unless the page names it. Each marker is a button named by its
number and source (“1, source: Example Eng – Why edge caching cut our p95 latency in half”); the chips are a list,
“Sources”, of buttons named the same way. Markers and chips have `aria-expanded` and `aria-controls` pointing at the
preview, a region named “Source 1: Example Eng” that's inert while closed. Its buttons are “Close source”, “Open
source” and “Copy quote” (then “Copied”); a status region says “Quote copied” or “Couldn't copy the quote”. Clean's
overflow button is “+2 more sources”.

The source viewer is a modal dialog named by the source's title; the rest of the page is inert while it's open. The
document text is a focusable region (“… text”, busy while it loads), and the current passage starts with hidden
“Cited passage:” text. A status line says “Passage 2 of 3 in …” on opening and on each step, “Loading the document”
and “Couldn't load the document”. Previous and Next are named “Previous passage” and “Next passage”.

## Content

- Cite at the sentence: end each claim with the sources that back it, not a list at the end of the paragraph.
- Give each source a short `site` for its chip (“Latency Notes”) and the page's real `title`.
- Quote the passage the answer relies on, a sentence or two, and `highlight` the phrase that backs it.
- Format `date` the way the rest of the product does – the component shows it as given.
- For the viewer, `quote` must appear in the document text as written (case and line breaks don't matter). Sources
  quoting the same document share a `document` id, so the viewer can step between their passages.

## Do

- Pass `pagesRead` when the model read more than it cited, so people see the search was wider.
- Give sources their favicon as `icon`; without one they get a letter on a soft colour.
- Handle Open source yourself (`onOpenSource`) when sources open in a side panel or need checking first.
- Use `loadDocument` for documents that are large or fetched on demand; it gets an AbortSignal for when the viewer
  closes first.

## Don't

- Don't cite a source the answer doesn't use – a chip nobody cites says “read, not cited”.
- Don't put the whole page in `quote` – the preview is for the passage, not the article.
- Don't number sources in the text yourself; the markers follow the order of `sources`.
- Don't pass HTML as a document's text – it's shown as plain text, with blank lines starting paragraphs.

## Example

```html
<tc-cited-answer id="answer" pages-read="14" action-label="Follow up"></tc-cited-answer>

<script type="module">
  import "@adamstavely/trenchcoat/cited-answer";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.sources = [
    {
      id: "edge",
      title: "Why edge caching cut our p95 latency in half",
      url: "https://engineering.example.com/edge-caching",
      site: "Example Eng",
      quote: "After moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms.",
      highlight: ["p95 latency dropped from 410 ms to 190 ms"],
    },
  ];
  answer.segments = [{ text: "The edge cache roughly halved p95 latency.", cite: ["edge"] }];
  // View in document: the full text, by document id (a source's `document`, else its id)
  answer.loadDocument = (sourceId, signal) => fetch(`/documents/${sourceId}.txt`, { signal }).then((r) => r.text());
  answer.addEventListener("tc-preview-change", (e) => console.log(e.detail.preview));
  answer.addEventListener("tc-source-open", (e) => console.log("viewing", e.detail.sourceId));
</script>
```

```tsx
import { CitedAnswer, type CitedSegment, type CitedSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: CitedSource[] = [
  {
    id: "edge",
    title: "Why edge caching cut our p95 latency in half",
    url: "https://engineering.example.com/edge-caching",
    site: "Example Eng",
    quote: "After moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms.",
    highlight: ["p95 latency dropped from 410 ms to 190 ms"],
  },
];
const segments: CitedSegment[] = [{ text: "The edge cache roughly halved p95 latency.", cite: ["edge"] }];

const documents = {
  edge: "Why edge caching cut our p95 latency in half\n\nAfter moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms.",
};

export function Answer({ open }: { open: (url?: string) => void }) {
  return <CitedAnswer segments={segments} sources={sources} pagesRead={14} documents={documents} onOpenSource={(s) => open(s.url)} />;
}
```
