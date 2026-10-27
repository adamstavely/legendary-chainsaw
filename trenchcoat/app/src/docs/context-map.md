---
pattern: none
status: stable
related: context-tray, context-window, budget-guard
---

## Overview

A picture of what fills an agent's context window. Every part – the system prompt, tools, memory, each file it
read, the chat, tool results – is a tile as large as its share of the tokens, and what's left is a dashed free
space. Tiles keep their place and glide as the context grows, so people can watch it fill and see at a glance what
is taking the room. After a compaction, Before and After show what was kept, folded into a summary or dropped.

## When to use

- Explaining why an agent forgot something or slowed down – which files and results crowd its window.
- Long-running agents that compact their context, where people want to see what the compaction cost.
- Comparing agents with different window sizes – `agents` turns the name in the bar into a menu.

## When not to use

- Showing and editing what's in context – pin, remove, undo – next to a composer – use `context-tray`.
- Letting people remove files and compact the conversation themselves – use `context-window`.
- Spend and token caps that stop a run – use `budget-guard`.

## Anatomy

1. **Header** `.tc-head` – a treemap icon, the title, and the status while there is one
2. **Bar** `.ui-cxm__bar` – the agent or model, and how full the window is
3. **Agent menu** `.ui-cxm__agent` – the current agent and its window size; opens a menu of the others
4. **Total** `.ui-cxm__sum` – tokens used out of the window and the share; Before and After join it after a compaction
5. **Tile** `.ui-cxm__tile` – one block of the context, sized by its tokens
6. **Free space** `.ui-cxm__tile[data-kind="free"]` – what's left of the window, dashed
7. **Compaction line** `.ui-cxm__fates` – adds up the last compaction: kept, summarized and dropped

## Looks

Standard sets the header, the bar and the map in a gray tray, the map inset as a white card. Clean drops the tray:
one white card, with the header as its first row, then the bar and the map as a hairline-bordered area. Both colour the
percentage amber from 80% and red from 95%, and behave the same.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the map – one tile takes focus – and on to the next control |
| ← / → / ↑ / ↓ | Moves to the previous or next tile, in the map's order |
| Home / End | Moves to the first or last tile |
| Enter / Space | On a tile: pins its card, or lets it go; on the agent button: opens the menu |
| Escape | Hides the card without moving focus; in the agent menu, closes it and returns to the button |
| ↓ / ↑ on the agent button | Opens the menu on the first or last agent |
| ↓ / ↑ / Home / End in the menu | Moves between agents, wrapping at the ends |

## Screen readers

The map is a list named by the title. Each tile is a button whose name gives its label, kind and size (“checkout.ts,
File – 18.4k tokens”); before a compaction its fate is part of the name (“…, summarized”). A pinned tile is
`aria-pressed`, and the focused, hovered or pinned tile is described by its card (`role="tooltip"`). The free space
is a list item named “Free – 175k tokens”. The agent button has `aria-haspopup="menu"` and `aria-expanded`; the
menu, “Agents”, holds `menuitemradio` items with the current one checked. Before and After are a “Compaction” group
of `aria-pressed` buttons. `status` is read out through a status region that's there from the start.

## Content

- Name blocks as people know them: the file name, the tool call (“run_tests”), “Your request” – not ids.
- Use `detail` for when or why it arrived (“Read at 0:42”, “3 failing: 3DS redirect”), one short line.
- List what a block holds in `items` – the tools in a tool block – rather than packing it into the label.
- Keep `status` to a word or two in the present: “Compacting”, “Reading files”.

## Do

- Keep blocks in the order they arrived; new ones join where the list puts them, so tiles don't jump.
- Give the compaction `summary` the summary block's id, so its card says what went into it.
- Pass `compaction={null}` before the first compaction to show the line that explains what's to come.

## Don't

- Don't merge every file into one block – the map is useful because people can find the file that's too big.
- Don't change `blocks` many times a second; update when something arrives and let the tiles glide.
- Don't use the map's colours alone to tell blocks apart – the label and kind are on every tile and card.

## Example

```html
<tc-context-map id="context" limit="200000" model="Sonnet 5"></tc-context-map>

<script type="module">
  import "trenchcoat/context-map";
  import "trenchcoat/tokens.css";

  const map = document.querySelector("#context");
  map.blocks = [
    { id: "sys", label: "System prompt", kind: "system", tokens: 3200 },
    { id: "tools", label: "Tools", kind: "tools", tokens: 14800, detail: "7 tool definitions" },
    { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400, detail: "Read at 0:04" },
  ];
  map.compaction = null;
  map.addEventListener("tc-select", (e) => console.log(e.detail?.label ?? "Free"));
</script>
```

```tsx
import { ContextMap, type ContextBlock } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const blocks: ContextBlock[] = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 3200 },
  { id: "tools", label: "Tools", kind: "tools", tokens: 14800, detail: "7 tool definitions" },
  { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400, detail: "Read at 0:04" },
];

export function AgentContext({ compacting }: { compacting: boolean }) {
  return (
    <ContextMap
      blocks={blocks}
      limit={200_000}
      model="Sonnet 5"
      compaction={null}
      status={compacting ? "Compacting" : undefined}
      onSelect={(block) => console.log(block?.label ?? "Free")}
    />
  );
}
```
