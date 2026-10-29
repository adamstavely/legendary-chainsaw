---
pattern: list
status: new
related: ai-search, facet-sidebar, search-history, saved-search-alerts
---

## Overview

What a search found, laid out to read and open. Each result shows an icon and a pill for its kind (a document, a
person, an email – any word), its title, a snippet with every word of the query picked out, and one quiet line with
its source, date and whatever else the page adds. Results are grouped under their kind with a count
("Documents 12"), or listed as they come. Relevance / Date reorders them. "Did you mean" offers a corrected query,
Show more adds the next lot, and placeholder rows stand in while a search runs.

## When to use

- The results page under a search box – [AI Search](#/ai-search), a query from [Query Builder](#/query-builder) or a
  saved search.
- Mixed results – files, people, messages – that read better grouped by kind.

## When not to use

- Rows people sort by column, select and edit – use [Data Table](#/data-table).
- Suggestions while typing – [AI Search](#/ai-search) has its own.
- A list of documents with owners and status – use [Document List](#/document-list).

## Anatomy

1. **Sort** `.ui-rsl__sort` – Relevance and Date, in the header
2. **Did you mean** `.ui-rsl__suggest` – a corrected query to search for instead
3. **Group** `.ui-rsl__group` – results of one kind under their heading and count
4. **Result** `.ui-rsl__item` – the kind's icon, the title, the snippet and the quiet line
5. **Mark** `.ui-rsl__mark` – a word of the query in a title or snippet
6. **Show more** `.ui-rsl__more` – the next `page-size` results

## Looks

Standard puts the header and sort on a gray tray above a white card; Clean is one white card with the header as its
first row. The query's words are marked with a soft amber wash. Snippets clamp to three lines, and to two in a narrow
column, where the kind icons also step aside.

A page can set `--tc-rsl-snippet-lines`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | To the results (one stop), and on to Show more |
| ↑ / ↓ | Previous / next result |
| Home / End | First / last result |
| Enter | Opens the result |

## Screen readers

- Each group is a section named by its heading; each title is a link (or a button) named by its words.
- Sort is a group of pressed buttons. The order, and how many Show more added, are announced in a polite status line.
- While loading, the card is `aria-busy` and the placeholder rows are hidden.

## Content

- Write snippets as the passage that matched, not the document's first line.
- Use a handful of kinds people recognise – "Document", "Person", "Email" – so the groups stay few.
- Put the total in words when you have it from the server ("About 1,240 results").

## Do

- Offer "Did you mean" only when the corrected query finds more.
- Keep sources short – a folder or a site, not a path.

## Don't

- Mark every word: one-letter words are ignored for a reason.
- Show more than a couple of meta items; the line should stay one line.

## Example

```html
<tc-results-list query="coral bleaching"></tc-results-list>
<script type="module">
  const list = document.querySelector("tc-results-list");
  list.results = [{ id: "r1", kind: "Document", title: "Coral bleaching survey", snippet: "Bleaching affected 38% of colonies…", source: "Grant reports" }];
  list.addEventListener("tc-open", (e) => console.log("open", e.detail.id));
</script>
```

```tsx
import { ResultsList, type SearchResult } from "trenchcoat/react";

export function Results({ query, results }: { query: string; results: SearchResult[] }) {
  return <ResultsList query={query} results={results} total={`About ${results.length} results`} onOpenResult={(r) => console.log(r.id)} />;
}
```
