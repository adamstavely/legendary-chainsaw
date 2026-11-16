---
pattern: switch
status: stable
related: context-window, prompt-library, chat-history
---

## Overview

What an AI assistant remembers about someone, and a calm place to change it. Memories are short facts grouped by
category, each with where it came from and when. People can filter by category or search, edit a memory in place,
pause it so it isn't used in answers, or forget it – with Undo on the tray for a few seconds. A master switch turns
memory off without deleting anything, and “New memory” adds one by hand.

What the assistant picks up on its own can wait for the person's OK. Give a memory `pending: true` and it isn't kept
yet: it sits at the top under “Waiting for your OK”, outside its category and the counts, with Keep and Don't keep.
Either fires a cancelable `tc-consent` ({ memory, keep }); unless prevented, Keep moves it into its category and Don't
keep drops it – through `tc-memories-change` like every other change, and `onConsent` when it's given.

## When to use

- A settings page or side panel where people review and correct what the assistant has learned about them.
- Giving people control over personal data the product keeps – pause, forget and an off switch in one place.
- Up to a few dozen short facts; the list scrolls past `maxHeight`.
- Asking before the assistant keeps something it noticed on its own, with `pending` memories.

## When not to use

- Saved prompts or instructions people reuse – use `prompt-library`.
- What sits in the model's context for this conversation – use `context-window`.
- A list of past conversations – use `chat-history`.

## Anatomy

1. **Header** `.tc-head` – a brain icon and the title, with the count and the “Use memory” switch at the right
2. **Filters** `.ui-mp__chips` – All and one chip per category, with counts; search sits beside them
3. **Memory** `.ui-mp__item` – the fact, where it came from and when, and Paused
4. **Actions** `.ui-mp__acts` – Edit, Pause or Resume, and Forget
5. **Waiting for your OK** `.ui-mp__waiting` – memories the assistant picked up itself, each with Keep and Don't keep
6. **New memory** `.ui-mp__add` – unfolds into an editor with a category picker
7. **Tray** `.ui-mp__foot` – the counts (and how many wait) or what you point at, then Undo after a forget

## Looks

Standard is a white card on a gray tray: the counts, Undo and the action sit on the tray below the card, chips are
outlined when picked, and the icons are 14px outlines. Clean is one white card with hairline shadows: the tray is
the card's last row, the picked chip is a soft gray fill, and the icons are 16px with thin strokes or solid shapes.
Both fold rows and groups away instead of letting them jump, and in a narrow panel the chips drop their counts and
the switch keeps only its track.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switch, the chosen category chip, Search, each memory's actions, New memory and the tray |
| ← / → / ↑ / ↓ | In the category chips or the new memory's categories: picks the previous or next one, wrapping round |
| Home / End | In the category chips: picks All or the last category |
| Enter | In an editor: saves the memory (Shift+Enter is a new line) |
| Escape | In an editor: cancels and returns focus to Edit or New memory; in search: clears and closes it |
| Space / Enter | On a button: flips the switch, edits, pauses, forgets, undoes |

Forgetting moves focus to the next memory's Forget (else the previous one, else New memory) before the row folds; Undo
brings focus back to the restored memory.

## Screen readers

The host is a group named by the heading. “Use memory” is a switch with `aria-checked`, and controls the note that
unfolds when it's off. The category chips are a radiogroup named “Category”; the search field and its button are
named “Search memories”, and the button has `aria-expanded`. Each category is a section named by it. The actions are
named with the memory's text – “Edit “Writes in British English””, “Pause …”, “Resume …”, “Forget …” – and a row whose
callback is still running is `aria-busy`. A status region says “Forgot “…”. Undo is on the tray.” after a forget, and
a failure such as “Couldn't pause it. Try again.” The rolling counts are not read out.

“Waiting for your OK” is a section named by its heading and count. Keep and Don't keep are named with the memory –
“Keep “Likes tables””. After either, the status region says “Kept: “…”” or “Not kept: “…”” and focus moves to the next
waiting memory's Keep, or to New memory.

## Content

- Write each memory as one short sentence about the person, without “User” or “You”: “Writes in British English”.
- Make `source` and `date` ready to show: “From chat”, “From settings”, “Oct 12”.
- Use a handful of plain categories – “Work”, “Preferences”, “Projects”, “Personal” – and pass them in `categories`
  in the order people expect.
- Set `addedSource` to how a hand-added memory should read, e.g. “Added by you”.
- For a waiting memory, say where it was picked up in `source` – “Picked up from a chat” – so people can judge it.

## Do

- Return a promise from `onAdd`, `onEdit`, `onPause`, `onForget` and `onRestore` when the change is saved on a server –
  the row waits, and a rejection rolls it back and says so.
- Keep Undo long enough to read: raise `undoFor`, or set it to `Infinity`, for people who need more time.
- Treat the switch as a real setting: when it's off, stop using and saving memories, as its note promises.
- Don't use a waiting memory in answers until it's kept; return a promise from `onConsent` to save the answer.

## Don't

- Don't delete memories when the switch is turned off – the note says nothing is deleted.
- Don't put long notes or documents in a memory; they wrap and are hard to scan.
- Don't hide the source: people need to know where a memory came from to trust or correct it.

## Example

```html
<tc-memory-panel id="memory" max-height="320" undo-for="8000"></tc-memory-panel>

<script type="module">
  import "@adamstavely/trenchcoat/memory-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#memory");
  panel.categories = ["Work", "Preferences"];
  panel.memories = [
    { id: "w1", category: "Work", text: "Product designer at a fintech startup in Berlin", source: "From chat", date: "Sep 28" },
    { id: "p1", category: "Preferences", text: "Writes in British English", source: "From chat", date: "Sep 2" },
  ];
  panel.memories = [...panel.memories, { id: "n1", category: "Work", text: "Presents to the board monthly", source: "Picked up from a chat", pending: true }];
  panel.onForget = (id) => fetch(`/api/memories/${id}`, { method: "DELETE" });
  panel.addEventListener("tc-consent", (e) => console.log(e.detail.keep ? "kept" : "not kept", e.detail.memory.text));
  panel.addEventListener("tc-memories-change", (e) => console.log(e.detail.memories));
</script>
```

```tsx
import { useState } from "react";
import { MemoryPanel, type Memory } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Memories({ initial }: { initial: Memory[] }) {
  const [memories, setMemories] = useState(initial);
  const [enabled, setEnabled] = useState(true);
  return (
    <MemoryPanel
      memories={memories}
      onChange={setMemories}
      enabled={enabled}
      onEnabledChange={setEnabled}
      categories={["Work", "Preferences", "Projects"]}
      addedSource="Added by you"
    />
  );
}
```
