---
pattern: tree
status: new
related: file-tree, problem-list, diff-viewer, session-panel
---

## Overview

What a search across files found. A field shows the search and runs it again with Enter, with toggles for match case,
whole word and regular expression. Under a summary such as "42 results in 9 files", each file is a row you can fold, with
its matching lines under it and the matched text marked. With `replaceable`, a second field shows each match as it would
be replaced. Nothing here searches: the page answers `tc-search` and passes back `results` and a `status`.

## When to use

- Searching inside a project's files, such as after File Tree's `tc-search`.
- Find and replace across files, where the page applies the change.
- Any list of matching lines grouped by where they are, such as log files.

## When not to use

- Finding files by name – use `file-tree` with its filter.
- Searching records or documents for people to read – use `ai-search` or a results list.
- Showing a whole change to a file – use `diff-viewer`.

## Anatomy

1. **Fields** `.ui-srh__fields` – the search, its toggles `.ui-srh__toggle`, and the replace field `.ui-srh__replace`
2. **Summary** `.ui-srh__summary` – how many results in how many files, or that it's searching
3. **File** `.ui-srh__file` – a file's icon, name, folder `.ui-srh__folder` and count `.ui-srh__count`
4. **Match** `.ui-srh__match` – the line number `.ui-srh__line` and the line `.ui-srh__text`
5. **Hit** `.ui-srh__hit` – the matched text; while replacing, `.ui-srh__del` and `.ui-srh__ins`
6. **Actions** `.ui-srh__actions` – the page's buttons, then Collapse all or Expand all
7. **Empty** `.ui-srh__empty` – before a search, no results, or an error

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-srh-line-w`, the width kept for line numbers, and `--tc-srh-toggle`, the size of the three toggles.
When the card is narrower than 300 px, the folder beside a file's name is left out.

## Keyboard

The fields and toggles are normal tab stops; the results are one tab stop.

| Key | What it does |
|---|---|
| Enter in the search field | Searches |
| Esc in the search field | Clears it |
| ↓ in the search field | Moves into the results |
| ↑ / ↓ | Move between files and matches |
| → | Opens a file, then goes to its first match |
| ← | Closes a file, or goes from a match to its file |
| Home / End | Go to the first or last row |
| Enter / Space | Opens a match, or folds a file |

## Screen readers

The results are a `tree` named by the heading. Files are `treeitem`s at level 1 with `aria-expanded`, and their count is
read as "3 results". Matches are at level 2 with `aria-selected`, and their line number is read as "Line 12". The summary
is a `role="status"`, so a finished search is announced; an error is an alert. The toggles are buttons with
`aria-pressed`, named "Match case", "Whole word" and "Regular expression". The tree is `aria-busy` while searching.

## Content

- Pass `ranges` as UTF-16 `[start, end)` offsets from the search engine. Regex searches require these ranges for highlighting
  and replacement previews; without them the line is shown as plain text. The element never executes an arbitrary regex
  during rendering. Literal queries can still calculate their own highlights with match-case and whole-word options.
- `searchResultsPattern` constructs a regex for application code; execute untrusted patterns only in a search service or
  isolated worker with execution limits, not on the UI thread.
- Long lines are cut so the first match shows, with "…" where text was left out. Leading indentation is dropped.
- Set `truncated` when the page stopped early, and the summary says how many are shown.
- `selected` is a path, line and column, so it stays put when the same search runs again and tells two matches on one
  line apart. Without a column it's the first match on that line.
- Whole word matches where the query isn't next to a letter, digit or `_`, so `@media` and `fn(` work too.

## Do

- Set `status` to "searching" while the page works, and "done" when it's finished, even with no results.
- Listen for `tc-open` to show the file at the line. It fires for a match that's already selected too.
- Answer `tc-replace` by changing the files, then search again so the results match.

## Don't

- Don't send every keystroke to a server. The element only asks on Enter.
- Don't show results for a search other than `query`, or the marks won't match what's shown.

## Example

```html
<tc-search-results id="search" query="freezer"></tc-search-results>

<script type="module">
  import "@adamstavely/trenchcoat/search-results";
  import "@adamstavely/trenchcoat/tokens.css";

  const results = document.querySelector("#search");
  results.addEventListener("tc-search", async (e) => {
    results.status = "searching";
    const res = await fetch(`/api/search?q=${encodeURIComponent(e.detail.query)}`);
    results.results = await res.json();
    results.status = "done";
  });
  results.addEventListener("tc-open", (e) => console.log(e.detail.path, e.detail.line));
</script>
```

```tsx
import { useState } from "react";
import { SearchResults, type SearchResultsFile, type SearchResultsStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Search({ find, open }: { find: (q: string) => Promise<SearchResultsFile[]>; open: (path: string, line: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsFile[]>([]);
  const [status, setStatus] = useState<SearchResultsStatus>("idle");
  return (
    <SearchResults
      query={query}
      results={results}
      status={status}
      onSearch={async (q) => {
        setQuery(q);
        setStatus("searching");
        setResults(await find(q));
        setStatus("done");
      }}
      onTcOpen={(e) => open(e.detail.path, e.detail.line)}
    />
  );
}
```
