---
pattern: list
status: new
related: progress-tracker, checkbox, setup-guide, search-history
---

## Overview

A to-do list people keep themselves. Type a to-do in the box at the top and press Enter (or Add). Tick it off when
it's done, click its words to change them, and move it with Alt + ↑ / ↓. Remove it with ×, which leaves "Removed ·
Undo" until the next removal. Tabs show All, To do and Done with their counts. The foot says how many are done, with
a bar, and Clear done takes the finished ones away.

Every change fires one cancelable event, `tc-items-change`, with the list as it will be and what changed. Keep the
list in your own store by handling it, or let the element keep it.

## When to use

- Someone's own list of things to do: prep for an event, follow-ups after a meeting, a personal checklist beside a
  record.
- A short shared list where anyone may add and tick items off.

## When not to use

- A fixed series of setup steps the product sets – use [Progress Tracker](#/progress-tracker) or
  [Setup Guide](#/setup-guide).
- Work moving through stages with owners and dates – use a task board.
- One yes/no choice – use [Checkbox](#/checkbox).

## Anatomy

1. **Tabs** `.ui-todo__tabs` – All, To do and Done, each with its count
2. **Add** `.ui-todo__add` – the box for a new to-do and Add
3. **Undo** `.ui-todo__removed` – after a removal, until the next one
4. **To-do** `.ui-todo__item` – its round check box, its words (click to edit) and Remove
5. **Foot** `.ui-todo__foot` – how many are done, with a bar, and Clear done

## Looks

Standard sets the header and tabs on a gray tray above a white card; Clean is one white card with the header as its
first row. Done to-dos are struck through in a muted colour, with a green tick that draws itself. With a mouse,
Remove appears when a to-do is hovered or focused; on touch screens it always shows.

## Keyboard

| Key | Does |
| --- | --- |
| Enter in the new to-do box | Adds it |
| Space on a to-do's box | Ticks it off, or back |
| Alt + ↑ / ↓ on a to-do's box | Moves it up or down |
| Enter on a to-do's words | Edits them in place |
| Enter / Escape while editing | Keeps / puts back the words; emptied, the to-do is removed |
| ← / → on the tabs | All, To do, Done |

## Screen readers

- The list is a list named by the heading. Each box is a checkbox named by its to-do. The words are a button,
  "Order name badges, edit", and Remove says which to-do it removes.
- The tabs are a `tablist`, and the list is their `tabpanel`.
- Adding, ticking, editing, moving, removing and Undo are announced in a polite status line. After a removal, focus
  goes to Undo.
- The bar is a `progressbar`: "3 of 6 done".

## Content

- Start each to-do with a verb: "Send the poster files", "Book the hall".
- Keep them to one line; `max-length` (200) stops pasted essays.
- Rename the words for your product's voice with `labels` ("Task" instead of "To-do", say).

## Do

- Save the list where the person will find it again (`tc-items-change` gives you the whole list each time).
- Put new to-dos where people look: the end of the list by default, `add-to="start"` for a stack.

## Don't

- Ask for confirmation before removing – Undo is quicker and safer.
- Use it for steps the product checks off by itself.

## Example

```html
<tc-todo-list heading="Open day prep"></tc-todo-list>
<script type="module">
  const list = document.querySelector("tc-todo-list");
  list.items = JSON.parse(localStorage.getItem("todos") ?? "[]");
  list.addEventListener("tc-items-change", (e) => localStorage.setItem("todos", JSON.stringify(e.detail.items)));
</script>
```

```tsx
import { useState } from "react";
import { TodoList, type TodoItem } from "trenchcoat/react";

export function Prep() {
  const [items, setItems] = useState<TodoItem[]>([{ id: "a", text: "Book the hall" }]);
  return <TodoList title="Open day prep" items={items} onItemsChange={setItems} />;
}
```
