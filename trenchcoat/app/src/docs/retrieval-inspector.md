---
pattern: listbox
status: new
related: cited-answer, trace-waterfall, validity-badge, eval-scorecard
---

## Overview

What the model was given to answer with, for one query. Every chunk retrieval returned is listed in rank order with
its score (a bar, with the cutoff marked), its source document and place in it, how fresh the source is, and whether
the answer used it – with the citation marker the answer gave it. Pick a chunk to read it in full, the query's words
marked, with Open source. Below the list sit the misses the app reports: passages that should have come back and
didn't. It is for the people debugging retrieval – why an answer missed a fact, leaned on an outdated page, or ignored
the best match – and it stays fast with 10,000 chunks.

## When to use

- Debugging an answer: what was retrieved, what was used, and what was missing.
- Tuning retrieval – the cutoff, the chunk size, the index – against real queries.
- Reviewing evals where relevant passages are labelled, so misses can be shown.

## When not to use

- Showing people the sources behind an answer as they read it – use `cited-answer`.
- Where a whole agent run spent its time and money – use `trace-waterfall`.
- One source's freshness on its own – use `validity-badge`.
- Pass and fail across many test cases – use `eval-scorecard`.

## Anatomy

1. **Numbers** `.ui-rti__stats` – how many were retrieved, used, below the cutoff and missed
2. **Filter** `.ui-rti__filters` – All, Used or Not used, and the cutoff's key
3. **Chunks** `.ui-rti__list` – rank, source and place, score bar, freshness and use, one row each
4. **Open chunk** `.ui-rti__detail` – the score against the cutoff, its use, its place and freshness, the text, Open source
5. **Misses** `.ui-rti__misses` – what the app says should have been retrieved, and why

## Looks

Standard puts the heading and the query on a gray tray and the inspector on a white card inside it. Clean is one
white card with hairline dividers and uppercase captions on the numbers and the open chunk's facts. Wide (from
860 px), the open chunk sits beside the list; narrow (520 px and under), it opens below, the numbers wrap in two
columns and the place in the source gives way in the rows.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the filter, the list, then the open chunk's Close and Open source |
| ← / → / ↑ / ↓ | In the filter, picks the previous or next option, wrapping round |
| ↓ / ↑ | In the list, moves to the next or previous chunk and opens it |
| Home / End | In the list, moves to the first or last chunk and opens it |
| Page Up / Page Down | In the list, moves eight chunks and opens the one it lands on |
| Enter | In the list, opens the active chunk's source, when it has one (or `open-handled` is set) |
| Escape | Closes the open chunk; from inside it, focus goes back to the list |

## Screen readers

The list is a `listbox` named by the heading; focus stays on it and `aria-activedescendant` points at the active
chunk. Each chunk is an `option` with `aria-selected`, `aria-posinset` and `aria-setsize` (so “5 of 1,200” is right
while only the nearby rows are rendered), read as “Rank 1: Returns policy, §2.1, score 0.91. Items that arrive
damaged… Used as 1”, with “below the cutoff” when it is. Freshness comes from `tc-validity-badge`: “High source,
observed 10 days ago”. The filter is a `radiogroup` named “Show”, each option with its count (“Used, 2 chunks”); after
it changes, a status region says what is left (“Used: 2 chunks”). The open chunk is a region named by its rank and
source; the query's words in its text are `<mark>` elements. The misses are a region named “Missed, 1”.

## Content

- Pass the query exactly as retrieval saw it – after any rewriting – so the marked words make sense.
- Write `location` the way a person would find the place: “§2.1 Damaged on arrival”, “p. 12”.
- Give misses a `reason` that says how you know: “Marked relevant in the eval set”.
- Set `profile` for how fast your sources go stale; a price list and a policy manual age differently.

## Do

- Set `cutoff` when the app drops chunks below a score – the bars and the numbers show what fell under it.
- Pass the answer's citation markers as `citation`, so a row can be matched to the answer.
- Set `now` to look at freshness as of the day the answer was given.

## Don't

- Don't re-sort the chunks before passing them – the rank is what retrieval returned.
- Don't mark a chunk `used` because it was in the prompt; mark it when the answer relied on it.
- Don't put the whole document in a chunk's `text` – show what the model was given.

## Example

```html
<tc-retrieval-inspector id="retrieval" cutoff="0.5" open-handled></tc-retrieval-inspector>

<script type="module">
  import "trenchcoat/retrieval-inspector";
  import "trenchcoat/tokens.css";

  const inspector = document.querySelector("#retrieval");
  inspector.query = "How long do customers have to return a damaged item?";
  inspector.chunks = [
    { id: "c1", source: "Returns policy", location: "§2.1", score: 0.91, observed: "2026-08-14", used: true, citation: 1, text: "Items that arrive damaged can be reported within 30 days." },
    { id: "c2", source: "Holiday returns 2024", score: 0.81, observed: "2024-11-20", superseded: true, text: "Purchases made in December can be returned until January 31." },
  ];
  inspector.addEventListener("tc-open-source", (e) => console.log(e.detail.chunk.id));
</script>
```

```tsx
import { RetrievalInspector, type RetrievalChunk, type RetrievalMiss } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function RetrievalDebug({ query, chunks, misses }: { query: string; chunks: RetrievalChunk[]; misses: RetrievalMiss[] }) {
  return <RetrievalInspector query={query} chunks={chunks} misses={misses} cutoff={0.5} defaultShow="used" onOpenSource={(chunk) => console.log(chunk.id)} />;
}
```
