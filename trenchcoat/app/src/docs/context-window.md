---
pattern: disclosure
status: stable
related: context-tray, compact-breakdown, usage-meter, context-map
---

## Overview

What fills an AI model's context right now, and what someone can do about it. The window is a field of small cells,
each a slice of the token limit, coloured by what sits in it – the system prompt, tools, files, the conversation,
memory – with the empty cells as the room that's left. People can open a part to remove single files or tools, and
compact the conversation: its cells shimmer while it works, then most of them clear. The percentage turns amber as
the window nears its limit, and the caption says how much is left.

## When to use

- A chat or agent screen where long sessions run out of context and people need to see why.
- Letting people free room themselves – dropping a large file, a tool they don't need, or compacting the history.
- A settings or debug panel that explains what a model is being sent.

## When not to use

- Showing each attachment as a chip in the composer, with its weight – use `context-tray`.
- Explaining what a compaction kept and dropped – use `compact-breakdown`.
- Usage against a plan or a billing limit – use `usage-meter`.
- A map of which sources an answer drew on – use `context-map`.

## Anatomy

1. **Header** `.tc-head` – a gauge icon, the title and the model tag
2. **Figure** `.ui-cw__figure` – tokens used, “of 200K tokens” and the percentage
3. **Field** `.ui-cw__field` – the cells, coloured by part, empty for the room left
4. **Parts** `.ui-cw__parts` – one row per part, with its swatch, Compact and size
5. **Caption** `.ui-cw__caption` – what's left, what was saved, or the hovered part's share
6. **Action** `.ui-cw__action` – an optional button such as “New chat”

## Looks

Standard is a white card on a gray tray: the header sits on the tray above the card, the caption and the action below it, the percentage
is a pill, and the icons are 12px. Clean is one white card with hairline shadows: the header is its first row, the
caption and the action its last row, the percentage is a tag, the icons are 16px with finer strokes, and “Compacting…” shimmers. In a narrow
container both lay the field out with two thirds as many columns.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the part buttons, Compact, each open part's × buttons and the action |
| Enter / Space | Opens or closes a part's items; presses Compact, × or the action |

Focusing a part's button or Compact lights that part's cells, as hovering does. When an item is removed, focus moves
to the next item's ×, else the previous one, else the part's button; when Compact folds away, focus moves on to the
next control in the card.

## Screen readers

The host is a group named by the heading. The figure is read as one sentence – “84.4K of 200.0K tokens used, 42
percent”; the field, the rolling numbers and the hover caption are hidden. Parts with items are buttons with
`aria-expanded` and `aria-controls`; closed item lists are inert. Compact is named “Compact Conversation”, then
“Conversation is compacted”, and is `aria-disabled` while another compaction runs. A status region announces results
and warnings: “Compacting Conversation…”, “Saved 18K tokens”, “Couldn't compact Conversation – try again”, “Removed
billing-spec.md”, “Context window is almost full” and “Context window is full”.

## Content

- Name parts by what people recognise: “System prompt”, “Tools”, “Files”, “Conversation”, “Memory”.
- Label items by the file or tool name people attached – “billing-spec.md”, “GitHub”.
- Keep `model` to the model's short name, e.g. “Opus 5.5”.
- Make the action a next step in two words or fewer: “New chat”.

## Do

- Mark the system prompt `locked`, so it can't be removed or compacted.
- Give `compact` only to parts that can be summarised, usually the conversation; set the number to the share that
  stays if you know it.
- Return a promise from `onCompact` and reject it on failure – the cells shimmer until it settles and the caption says
  when it failed.
- Update `parts` when an item is removed or a compaction finishes; the card keeps its own change only until you do.

## Don't

- Don't use `color` to make two parts look the same – people match rows to cells by colour.
- Don't set `warnAt` so high the warning comes too late to act on; 0.8 leaves room.
- Don't use it as a live meter that moves every keystroke – the numbers roll and the cells redraw.

## Example

```html
<tc-context-window id="ctx" limit="200000" model="Opus 5.5" action-label="New chat"></tc-context-window>

<script type="module">
  import "trenchcoat/context-window";
  import "trenchcoat/tokens.css";

  const ctx = document.querySelector("#ctx");
  ctx.parts = [
    { id: "system", label: "System prompt", tokens: 4200, locked: true },
    { id: "files", label: "Files", items: [{ id: "spec", label: "billing-spec.md", tokens: 18600 }] },
    { id: "chat", label: "Conversation", tokens: 24000, compact: 0.25 },
  ];
  ctx.onCompact = async (partId, { signal }) => {
    await fetch(`/api/compact/${partId}`, { method: "POST", signal });
  };
  ctx.addEventListener("tc-remove-item", (e) => console.log(e.detail.partId, e.detail.itemId));
</script>
```

```tsx
import { useState } from "react";
import { ContextWindow, type ContextPart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Context() {
  const [parts, setParts] = useState<ContextPart[]>([
    { id: "system", label: "System prompt", tokens: 4200, locked: true },
    { id: "files", label: "Files", items: [{ id: "spec", label: "billing-spec.md", tokens: 18600 }] },
    { id: "chat", label: "Conversation", tokens: 24000, compact: 0.25 },
  ]);
  return (
    <ContextWindow
      model="Opus 5.5"
      limit={200_000}
      parts={parts}
      onRemoveItem={(partId, itemId) =>
        setParts((ps) => ps.map((p) => (p.id === partId && p.items ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p)))
      }
      action={{ label: "New chat", onClick: () => console.log("New chat") }}
    />
  );
}
```
