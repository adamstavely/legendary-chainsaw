---
pattern: tabs
status: new
related: ai-search, query-builder, routine-form, chat-history, prompt-library
---

## Overview

The searches someone ran and the ones they kept. Two tabs, Recent and Saved, show their counts; a filter box narrows
either one by query or scope. Searches are grouped by day – Today, Yesterday, then the date – and each shows its query,
its scope as chips (“Files”, “AI mode”), how many results it found and when it ran. Each search can be run again,
starred to keep it, or removed – which leaves “Removed · Undo” at the top until the next removal. With `schedulable`,
saved searches also offer Schedule, for a page that runs them as routines.

## When to use

- Beside a search box, so people can get back to what they looked for.
- A saved-searches page for queries people run every week.
- Case or research work where retracing earlier searches matters.

## When not to use

- Typing a new search – use `ai-search`.
- Building a query from conditions – use `query-builder`.
- Past conversations with an assistant – use `chat-history`.
- Reusable prompts – use `prompt-library`.

## Anatomy

1. **Tabs** `.ui-shis__tabs` – Recent and Saved, each with its count
2. **Filter** `.ui-shis__filter` – narrows the open tab by query or scope
3. **Removed** `.ui-shis__removed` – the last removal, with Undo
4. **Day** `.ui-shis__day-name` – Today, Yesterday, then the date
5. **Search** `.ui-shis__run` – the query, its scopes, results and time; runs it again
6. **Schedule** `.ui-shis__schedule` – on saved searches, with `schedulable`: asks the page to run it as a routine
7. **Star** `.ui-shis__star` – saves or unsaves the search
8. **Remove** `.ui-shis__remove` – takes the search out of the history

## Looks

Standard is a white card on a gray tray, with the header and tabs on the tray above it. Clean is one white card with
the header as its first row. The rows, chips and actions are the same in both. The filter is a quiet field – a soft
fill, with the field's ring only when it has focus.

## Keyboard

The tabs are one tab stop and the searches' buttons another.

| Key | What it does |
|---|---|
| ← / → on the tabs | Switches between Recent and Saved |
| ↑ / ↓ | Moves to the same action on the previous or next search (from Schedule to a search without one: its Star) |
| ← / → in the list | Moves between a search's Run, Schedule, Star and Remove |
| Home / End | Moves to the first or last search |
| Enter / Space | Runs, stars or removes, as focused |
| Tab | Leaves the list |

Removing a search moves focus to Undo; Undo returns it to the search.

## Screen readers

The tabs are a `tablist` labelled “Searches”, and the list a `tabpanel`. Days are sections named by the day. A search's
button reads its query, scopes, results and time, then “run again”. The star is a toggle button, “Save “invoice 7741””,
pressed when saved; Schedule and Remove say which search they act on. Saving, removing, scheduling and Undo are
confirmed in a polite status message.

## Content

- Keep queries as typed; for builder queries pass the read-back in words.
- Name scopes in a word or two: “Files”, “AI mode”, “Contents”.
- Pass `results` when you have it – zero results is useful to see.

## Do

- Keep `searches` in your store and pass the next list from the events, so stars and removals persist.
- Use the page's clock for `now` when times must match other parts of the page.
- With `schedulable`, open a `routine-form` from tc-schedule, its name and instructions filled in from the search.

## Don't

- Don't remove searches without Undo – the element's own Undo only works if the removal is kept until the next one.
- Don't list hundreds of searches – trim the history to recent weeks.

## Example

```html
<tc-search-history id="history"></tc-search-history>

<script type="module">
  import "trenchcoat/search-history";
  import "trenchcoat/tokens.css";

  const history = document.querySelector("#history");
  history.searches = [
    { id: "s1", query: "invoice 7741", scopes: ["Files"], results: 12, at: Date.now() - 5 * 60_000 },
    { id: "s2", query: "Who approved the Q3 budget?", scopes: ["AI mode"], results: 1, at: Date.now() - 3_600_000, saved: true },
  ];
  history.addEventListener("tc-select", (e) => console.log("run again", e.detail.search.query));
</script>
```

```tsx
import { useState } from "react";
import { SearchHistory, type SearchHistoryEntry } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function History({ initial }: { initial: SearchHistoryEntry[] }) {
  const [searches, setSearches] = useState(initial);
  return (
    <SearchHistory
      searches={searches}
      onSearchesChange={setSearches}
      onRunAgain={(s) => console.log(s.query)}
      schedulable
      onSchedule={(s) => console.log("schedule", s.query)}
    />
  );
}
```
