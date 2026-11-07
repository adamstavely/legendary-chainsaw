---
pattern: combobox
status: stable
related: combobox, mention-picker, integration-picker, prompt-library
---

## Overview

One field that finds and runs anything in the product: type to filter every command, move with the arrow keys and
press Enter. Commands sit in titled groups – actions that use another tool carry its logo, everyday commands a
small icon and their shortcut keys. The first group, Suggestions, runs with ⌘1–⌘5, and as soon as something is typed
the top row offers to ask the assistant about it, so a search never ends in a dead end. ⌘K (Ctrl K off Apple
devices) focuses the field from anywhere on the page.

## When to use

- A global “do anything” entry point – opened with ⌘K or always visible on a home or launcher screen.
- Products with more commands and places than fit in the navigation, where people know the name of what they want.
- Mixing actions in other tools (write an email, create a task) with navigation and settings in one list.

## When not to use

- Picking a value for a form field – use `combobox`.
- Inserting a person, file or command into text someone is writing – use `mention-picker`.
- Choosing which service to connect – use `integration-picker`.
- Browsing and filling saved prompts – use `prompt-library`.

## Anatomy

1. **Search** `.ui-cm__search` – the field people type into, with its magnifier
2. **Group label** `.ui-cm__label` – the title above each group
3. **Command** `.ui-cm__item` – one row: the tool's logo or an icon, the label, a hint and its keys
4. **Hint** `.ui-cm__hint` – lighter text after the label: the tool, a person or a channel
5. **State** `.ui-cm__state` – “Searching…” while `loading`, or the empty text when nothing matches
6. **Popover** `.ui-cm__pop` – with `layout="popover"`, the results under the field

## Looks

Standard sets the card on a gray tray and puts the key hints – "↑ ↓ to move, ↵ to run" and the shortcut that opens
the menu – in the tray below it. Clean is one white panel with hairline shadows: group titles in capitals, an
↵ key in the field, the hints as the panel's last row, and a highlight that fades when the pointer leaves the list.
Both filter, run and announce the same way; below 480 px wide the keys and hints are hidden.

### In an app header, over results from a server

For a top bar's ⌘K search, set `layout="popover"`: a compact field, 32 px tall (28 px in Clean) and 280–420 px wide
as its container allows, with the placeholder and a ⌘K (Ctrl K) hint. Focus or typing opens the results in a popover
under it – in the top layer, so the header's `overflow` never clips it. Esc or a click outside closes it and keeps
the text; Enter runs the active row and closes it.

When the results come from your API, set `filter="none"`: the menu shows `groups` exactly as you give them, matches
still highlighted. Fetch on `tc-query-change` (debounced on your side), set `loading` while the request is out – a
quiet “Searching…” row – and `groups` when it's back. `empty-text` is what shows when nothing matches; `{query}` is
replaced with what was typed. `assistant="false"` leaves out the “Ask assistant about …” row, for apps without one.

On a header bar that's dark in both themes, add `inverse`: the field takes the dark theme's colours while the popover
keeps the page's theme, as `tc-header-nav`'s `inverse` does.

```html
<tc-command-menu id="search" layout="popover" filter="none" assistant="false" inverse
  placeholder="Search topics, gaps, papers, people…" empty-text="Nothing matches “{query}”"></tc-command-menu>

<script type="module">
  import "@adamstavely/trenchcoat/command-menu";

  const search = document.querySelector("#search");
  let timer;
  search.addEventListener("tc-query-change", (e) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      search.loading = true;
      const res = await fetch(`/search?q=${encodeURIComponent(e.detail.query)}`);
      search.groups = await res.json();
      search.loading = false;
    }, 200);
  });
  search.onRun = (id) => location.assign(`/go/${id}`);
</script>
```

## Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous command, wrapping at either end |
| Enter | Runs the active command |
| ⌘1–⌘5 (Ctrl 1–5) | Runs the first to fifth suggestion |
| Escape | Clears the search; with the search empty, fires `tc-close`. In popover layout, closes the results first and keeps the text |
| ⌘K (Ctrl K) | From anywhere on the page: focuses the field and selects its text (change it or turn it off with `hotkey`) |
| Tab | Left to the browser – moves focus on |

## Screen readers

The field is a combobox named “Command” that is always expanded: `aria-controls` points at the listbox “Commands”
and `aria-activedescendant` at the active row, so focus stays in the field. Each group is a `group` named by its
title, each command an `option`, `aria-selected` on the active one; key chips are hidden. A polite status region
says what ran – “Ran “Write an email”” or “Asked the assistant about “…”” – and says it again when the same command
runs twice. While a promise from `onRun` is pending the menu is `aria-busy`; if it rejects, an alert says “Couldn't
run “Write an email”” (or “Couldn't ask the assistant”).

In popover layout the field is a combobox (`aria-autocomplete="list"`) that's expanded only while the popover is open,
and `aria-activedescendant` points at a row only then. `loading` makes the field `aria-busy` and says “Searching…”;
when results arrive the status region says how many (“5 results”), or the empty text.

## Content

- Start labels with a verb for actions (“Write an email”, “Create a task”) and use the plain name for places
  (“Inbox”, “Settings”).
- Put the tool, person or channel in `hint` (“Gmail”, “#team-updates”) – it's searchable but lighter.
- Add words people might type to `keywords` (“mail send compose”) rather than lengthening the label.
- Keep group titles to one or two words: “Suggestions”, “Share”, “Go to”.
- Write `placeholder` as an invitation: “Search or run a command…”.

## Do

- Put the five commands people use most in a group with the id `suggestions` – they get ⌘1–⌘5.
- Return a promise from `onRun` for work that takes time, so the menu shows it running and reports a failure.
- Show each command's own shortcut in `keys` so people learn them.

## Don't

- Don't put more than a few hundred commands in – above `maxRows` (200) the menu shows the first ones and asks
  people to keep typing.
- Don't run destructive commands straight from the list – open a confirmation from `onRun` instead.
- Don't take ⌘K with another listener on the same page; set `hotkey` to something else or `false`.

## Example

```html
<tc-command-menu id="menu" placeholder="Search or run a command…"></tc-command-menu>

<script type="module">
  import "@adamstavely/trenchcoat/command-menu";
  import "@adamstavely/trenchcoat/tokens.css";

  const menu = document.querySelector("#menu");
  menu.groups = [
    { id: "suggestions", label: "Suggestions", commands: [{ id: "email", label: "Write an email", hint: "Gmail" }] },
    { id: "go", label: "Go to", commands: [{ id: "inbox", label: "Inbox", keys: ["G", "I"] }] },
  ];
  menu.onRun = (id, query) => console.log(id, query);
  menu.addEventListener("tc-close", () => menu.remove());
</script>
```

```tsx
import { CommandMenu, type CommandGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: CommandGroup[] = [
  { id: "suggestions", label: "Suggestions", commands: [{ id: "email", label: "Write an email", hint: "Gmail" }] },
  { id: "go", label: "Go to", commands: [{ id: "inbox", label: "Inbox", keys: ["G", "I"] }] },
];

export function Launcher({ onClose }: { onClose: () => void }) {
  return (
    <CommandMenu
      groups={groups}
      placeholder="Search or run a command…"
      onRun={(id, query) => console.log(id, query)}
      onClose={onClose}
    />
  );
}
```
