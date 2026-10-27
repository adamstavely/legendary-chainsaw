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
answer.

## When to use

- Answers built from search or retrieval, where people need to check what a sentence rests on.
- Research and support tools where a claim without a source shouldn't be trusted.
- Showing how much of an answer is backed – the line under it counts the cited sentences.

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

## Looks

Standard sets the answer in a white card on a gray tray, with the chips, the caption and the action on the tray
below it. Clean is one white card: the chips sit inside it as outlined pills that fold into a “+N” button when they
don't fit on one line, and the caption and action form the card's last row under a hairline.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the markers, then the chips, then the open preview's buttons and the action |
| Enter / Space | On a marker or chip: opens its preview, or closes it if it's open |
| ← / → | On a chip: moves to the previous or next chip (and “+N”) |
| Home / End | On a chip: moves to the first or last chip |
| Escape | Closes the preview and returns focus to the marker or chip that opened it |

Focusing a marker or chip lights it up the same way pointing does.

## Screen readers

The component is a group named “Answer with sources” unless the page names it. Each marker is a button named by its
number and source (“1, source: Example Eng – Why edge caching cut our p95 latency in half”); the chips are a list,
“Sources”, of buttons named the same way. Markers and chips have `aria-expanded` and `aria-controls` pointing at the
preview, a region named “Source 1: Example Eng” that's inert while closed. Its buttons are “Close source”, “Open
source” and “Copy quote” (then “Copied”); a status region says “Quote copied” or “Couldn't copy the quote”. Clean's
overflow button is “+2 more sources”.

## Content

- Cite at the sentence: end each claim with the sources that back it, not a list at the end of the paragraph.
- Give each source a short `site` for its chip (“Latency Notes”) and the page's real `title`.
- Quote the passage the answer relies on, a sentence or two, and `highlight` the phrase that backs it.
- Format `date` the way the rest of the product does – the component shows it as given.

## Do

- Pass `pagesRead` when the model read more than it cited, so people see the search was wider.
- Give sources their favicon as `icon`; without one they get a letter on a soft colour.
- Handle Open source yourself (`onOpenSource`) when sources open in a side panel or need checking first.

## Don't

- Don't cite a source the answer doesn't use – a chip nobody cites says “read, not cited”.
- Don't put the whole page in `quote` – the preview is for the passage, not the article.
- Don't number sources in the text yourself; the markers follow the order of `sources`.

## Example

```html
<tc-cited-answer id="answer" pages-read="14" action-label="Follow up"></tc-cited-answer>

<script type="module">
  import "trenchcoat/cited-answer";
  import "trenchcoat/tokens.css";

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
  answer.addEventListener("tc-preview-change", (e) => console.log(e.detail.preview));
</script>
```

```tsx
import { CitedAnswer, type CitedSegment, type CitedSource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

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

export function Answer({ open }: { open: (url?: string) => void }) {
  return <CitedAnswer segments={segments} sources={sources} pagesRead={14} onOpenSource={(s) => open(s.url)} />;
}
```
