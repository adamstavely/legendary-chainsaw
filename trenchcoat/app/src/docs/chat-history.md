---
pattern: tree
status: new
related: conversation-branches, chat-composer, prompt-library, filter-menu
---

## Overview

The list of someone's conversations, for finding one and going back to it. Chats are grouped under Pinned, then the
folders, then Today, Yesterday, Previous 7 days, Previous 30 days and one group per month. People search by title,
pin, rename in place, move a chat to a folder or delete it – with Undo below the list for a few seconds. It stays
smooth with thousands of chats: long lists render only the rows near the viewport.

An earlier session's structured summary – its findings, open questions and next steps – can be loaded into the
current chat as context. Loading is always the person's choice, from the chat's menu, never automatic; the “In
context” section under the list then shows exactly which items are active, grouped by the chat they came from, each
with Remove. The element only reports the change; the app decides what it actually sends with the next message.

## When to use

- The sidebar of a chat or assistant product, listing past conversations.
- Any list of sessions or threads that people revisit by recency and want to organise themselves.
- Carrying what an earlier session established into a new one, where people need to see and trim what the model is
  given.

## When not to use

- Switching between versions of one conversation after an edit – use `conversation-branches`.
- A library of saved prompts to reuse – use `prompt-library`.
- Filtering a table or a long list by several facets – use `filter-menu`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the heading, the number of chats and New chat
2. **Search** `.ui-chh__search` – filters by title and marks the match
3. **Group** `.ui-chh__head-row` – a date, a folder or Pinned, with its count; folds and opens
4. **Chat** `.ui-chh__item` – one conversation; the open one is highlighted, Pin and More show on hover
5. **In context** `.ui-chh__ctx` – the summary items loaded from earlier chats, each with Remove
6. **Footer** `.ui-chh__foot` – the keyboard hints, or Undo after a delete

## Looks

Standard puts the heading and the keyboard hints on the gray tray, and the search and list on a white card. Clean is
one white card with the header, list and footer inside it, thinner icons and hints written out (“to move”, “to
rename”). Both use the same rows, menu and keys, and the same In context section under the list: each chat's items on a quiet fill with an accent rule.

## Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous row; ↓ in the search field moves to the first chat |
| Home / End | Moves to the first or last row |
| → | On a folded group: opens it; on an open group: moves to its first chat |
| ← | On a chat: moves to its group; on an open group: folds it |
| Enter / Space | Opens the chat, or folds and opens the group |
| F2 | Renames the chat in place – Enter saves, Escape cancels |
| Delete / Backspace | Deletes the chat; Undo appears below the list |
| Shift+F10 / Context menu | Opens the chat's actions: Rename, Pin, Load as context (or Remove from context) for a chat with a summary, Move to a folder, Delete |
| Tab (in context) | Moves through the Remove buttons; removing one moves focus to the next, and the last back to the list |
| ↓ / ↑, Home / End (in the menu) | Moves through the actions |
| Escape / Tab (in the menu) | Closes the menu and goes back to the chat |
| A letter | Jumps to the next row whose title starts with what was typed |
| Escape (in the search field) | Clears the search |

## Screen readers

The list is a tree named by the heading (“Chats”); the search field is a searchbox labelled “Search chats”. Groups
are expandable tree items named with their count (“Today, 4 chats”, or “Today, 1 of 4 chats” while searching), and
chats are tree items named by their title with `aria-selected` on the open one. Each row carries its level,
position and set size, so the count stays right while long lists render only part of the rows. The actions menu
is labelled “Actions for “…””, with the folders as a group of radio items, “Move to folder”. A status region
announces each change: “Pinned “Q3 roadmap””, “Renamed to “…””, “Moved “…” to Work”, “Deleted “…”. Undo is below
the list”, “Restored “…””, and the result of a search (“3 chats match”, “No chats match”).

The In context section is named by its heading (“In context” and the count). Each chat's items are a list named
“From “…””, and every Remove button says what it removes: “Remove “Send the SSO timeline” from context”, or the whole
chat. A chat that's loaded reads “…, loaded as context” in the tree. Loading and removing are announced: “Loaded 3
items from “Summarize the Acme call” as context”, “Removed “…” from context”.

## Content

- Use the chat's own title – short and specific, as people would search for it. Generate one from the first
  message rather than showing “New chat” for every row.
- Name folders with nouns people already use: “Work”, “Recipes”, a project name.
- Keep `title` short – it names the tree for screen readers too. “Chats” is the default.
- Keep summary items short and discrete – one finding, question or step each – and give each a `kind` people
  recognise (“Finding”, “Open question”, “Next step”). A free-form paragraph can't be trimmed item by item.
- The empty states are written for you: “No chats yet” and “No chats match “…””.

## Do

- Pass `now` when the server and the browser may disagree about the date, so the groups match what people expect.
- Keep `hints` on where people are new to the list – the footer teaches F2 and Shift+F10.
- Use the granular events (`tc-rename`, `tc-delete`, `tc-restore` …) to call your API per action.
- Send exactly what's in `context` with the next message, and nothing the person has removed. Prevent
  `tc-context-change` when your app has to check a load first (access, size), then pass `context` back.

## Don't

- Don't delete for good on `tc-delete` alone – wait until Undo has gone, or restore on `tc-restore`.
- Don't set `undo-for` shorter than the default 6 seconds; use `Infinity` where people need more time.
- Don't put conversations from different products or accounts in one list.
- Don't load summaries into context on your own – the point is that people choose, and see, what's active.

## Example

```html
<tc-chat-history id="chats" value="c2"></tc-chat-history>

<script type="module">
  import "trenchcoat/chat-history";
  import "trenchcoat/tokens.css";

  const list = document.querySelector("#chats");
  list.folders = [{ id: "work", label: "Work" }];
  list.conversations = [
    { id: "c1", title: "Q3 roadmap", updatedAt: Date.now(), pinned: true },
    { id: "c2", title: "Pricing page copy", updatedAt: Date.now() - 86_400_000, folder: "work" },
    { id: "c3", title: "Trip to Lisbon", updatedAt: "2026-09-02T10:00:00Z" },
  ];
  list.addEventListener("tc-value-change", (e) => console.log("open", e.detail.value));

  // A chat with a structured summary can be loaded as context; the app sends what's in e.detail.context
  list.conversations[0].summary = [
    { id: "s1", kind: "Finding", text: "Launch moves to 12 November" },
    { id: "s2", kind: "Next step", text: "Tell support before the 5th" },
  ];
  list.conversations = [...list.conversations];
  let pendingContext = [];
  list.addEventListener("tc-context-change", (e) => (pendingContext = e.detail.context));
</script>
```

```tsx
import { useState } from "react";
import { ChatHistory, type ChatContextItem, type ChatConversation } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const start: ChatConversation[] = [
  {
    id: "c1",
    title: "Q3 roadmap",
    updatedAt: "2026-10-26T09:00:00Z",
    pinned: true,
    summary: [{ id: "s1", kind: "Finding", text: "Launch moves to 12 November" }],
  },
  { id: "c2", title: "Pricing page copy", updatedAt: "2026-10-25T16:30:00Z", folder: "work" },
];

export function Sidebar() {
  const [chats, setChats] = useState(start);
  const [open, setOpen] = useState<string | null>("c2");
  // What the next message carries – the app sends this, nothing else
  const [context, setContext] = useState<ChatContextItem[]>([]);
  return (
    <ChatHistory
      conversations={chats}
      onConversationsChange={setChats}
      folders={[{ id: "work", label: "Work" }]}
      value={open}
      onChange={setOpen}
      onNewChat={() => setOpen(null)}
      context={context}
      onContextChange={setContext}
    />
  );
}
```
