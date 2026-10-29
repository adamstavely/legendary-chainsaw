---
pattern: combobox
status: new
related: search-history, query-builder, command-menu, chat-composer
---

## Overview

One search box with two modes. In search mode it's a single-line field with suggestions – recent searches first, then
suggested ones – filtered as the person types, with what they typed picked out and an optional hint after each (“12
results”, “Yesterday”). Switch on AI mode and the field becomes a prompt a few lines tall, with
example prompts to start from. Under the field sit the AI mode switch and “Search within file contents”. Scopes the page
sets show as removable chips inside the field, a Clear button empties it, and ⌘K / Ctrl K focuses it from anywhere.
Every submit says what to search for, in which mode, whether to look inside files, and within which scopes.

## When to use

- The main search of an app that can answer questions as well as find things.
- Search inside a workspace, case or project, with the scope shown as chips.
- Anywhere people switch between keyword search and asking in plain language.

## When not to use

- Commands and navigation – use `command-menu`.
- A conversation with an assistant – use `chat-composer`.
- Building a structured query – use `query-builder`.
- Showing earlier searches – use `search-history`.

## Anatomy

1. **Card** `.ui-aisr__box` – the search card; its ring shows where focus is
2. **Field** `.ui-aisr__field` – the search icon (a sparkle in AI mode), scopes, the input or prompt, then keys, Clear and
   Send (in search mode, once something is typed)
3. **Scopes** `.ui-aisr__scopes` – where the search looks, each chip removable
4. **Suggestions** `.ui-aisr__pop` – recent and suggested searches below the card, in search mode, with the keys to move,
   search and close beneath them
5. **Examples** `.ui-aisr__examples` – prompts to start from, inside the card in AI mode
6. **Switches** `.ui-aisr__opts` – AI mode and Search within file contents, with the keys that send on the right

## Looks

Standard is a white search card on a gray tray, with the switches on the tray below it; its suggestions are a menu card
on a tray too. Clean is one white card with the switches as its last row, below a divider, and one menu for the
suggestions. Focus rings the whole card rather than the input. The keys hint on the right of the switches and the ⌘K
chips go when the search is narrower than about 460 px.

## Keyboard

| Key | What it does |
|---|---|
| ⌘K / Ctrl K | Focuses the field from anywhere – change it or turn it off with `hotkey` |
| ↓ / ↑ | Opens the suggestions and moves through them, wrapping at the ends (search mode) |
| Enter | Searches for the picked suggestion or what's typed; in AI mode, asks |
| Shift+Enter | Starts a new line (AI mode) |
| Escape | Closes the suggestions, then clears the field |
| Tab | Moves on to Clear, Send, the switch and the checkbox |

## Screen readers

In search mode the field is a `combobox` named by `label` (“Search”), with `aria-expanded`, `aria-controls` and
`aria-activedescendant` pointing into the suggestions `listbox`. In AI mode it's a text area named “Search, AI mode”.
The AI mode switch is a `switch`; the contents control a checkbox with its label. Scope chips' buttons say “Remove
Files”. Searching, asking, switching mode and removing a scope are confirmed in a polite status message.

## Content

- Write suggestions as people would type them; keep each to one line.
- Write example prompts as whole questions or requests, under about ten words.
- Name scopes by what they are: “Case 22-1187”, “Files”.

## Do

- Fill `suggestions` from the person's own history first.
- Keep the AI mode choice per person, so the box opens the way they last used it.

## Don't

- Don't submit on every keystroke – suggestions are for picking; tc-submit is for searching.
- Don't turn the hotkey off just because another element uses ⌘K – pick one owner for it per page.

## Example

```html
<tc-ai-search id="search"></tc-ai-search>

<script type="module">
  import "trenchcoat/ai-search";
  import "trenchcoat/tokens.css";

  const search = document.querySelector("#search");
  search.suggestions = [{ label: "invoice 7741", kind: "recent" }, { label: "Board minutes 2026", kind: "suggested" }];
  search.examples = ["Who signed off the Q3 budget?"];
  search.addEventListener("tc-submit", (e) => console.log(e.detail.mode, e.detail.query));
</script>
```

```tsx
import { AiSearch } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Search() {
  return (
    <AiSearch
      suggestions={[{ label: "invoice 7741", kind: "recent" }, { label: "Board minutes 2026", kind: "suggested" }]}
      examples={["Who signed off the Q3 budget?"]}
      defaultScopes={[{ id: "case", label: "Case 22-1187" }]}
      onSearch={({ query, mode }) => console.log(mode, query)}
    />
  );
}
```
