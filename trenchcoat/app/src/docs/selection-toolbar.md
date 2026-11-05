---
pattern: toolbar
status: new
related: response-selection, selection-translate, text-annotator, icon-rail
---

## Overview

The formatting bar that floats over selected text in an editor. It holds quick actions (ask, comment, react), toggles
such as bold and italic that show whether they're on, menus for text style, colour and list type, and a link button.
It doesn't edit anything: every press fires `tc-command`, the page's editor applies it, and the page tells the bar
what's on at the selection (`pressed`) and which option each menu shows (`values`).

## When to use

- Formatting in a rich-text editor, where the controls belong next to the text being changed.
- A few quick actions on a selection beside the formatting, such as commenting.

## When not to use

- Acting on a model's answer – reply quoting it, ask why, request an edit: use `response-selection`.
- Translating a selection: use `selection-translate`.
- Highlighting text and commenting in a margin: use `text-annotator`.
- A panel's views or tools: use `icon-rail`.

## Anatomy

1. **Bar** `.ui-stb__bar` – the toolbar; it floats while it has an `anchor`
2. **Slot** `.ui-stb__slot` – a control and its tooltip
3. **Control** `.ui-stb__tool` – a button, a toggle, or a menu's button with `.ui-stb__chevron`
4. **Separator** `.ui-stb__sep` – a divider between groups
5. **Tooltip** `.ui-stb__tip` – the label, and a shortcut when given, on hover and focus
6. **Menu** `.ui-stb__menu` – a menu's options, `.ui-stb__option`, with `.ui-stb__swatch` for a colour and `.ui-stb__check` on the chosen one

## Looks

Both looks use the shared menu surface. Standard adds a hairline round the bar and shows a pressed toggle in gray with an
edge; Clean has a rounder bar and shows a pressed toggle in the accent. A page can set `--tc-stb-size`, a control's size,
`--tc-stb-glyph`, its icon's, `--tc-stb-swatch`, a colour swatch's, and `--tc-stb-menu`, a menu's least width.

## Keyboard

One tab stop for the whole bar. The editor moves focus to it: call `focusToolbar()` from its own key, usually Alt + F10.

| Key | What it does |
|---|---|
| Left / Right | Moves along the bar |
| Home / End | Moves to the first or last control |
| Enter / Space | Uses the control; opens a menu |
| Down / Up on a menu's button | Opens the menu at its chosen (or first) option, or its last |
| Up / Down / Home / End in a menu | Moves through its options |
| Enter / Space in a menu | Chooses the option and closes the menu |
| Escape in a menu | Closes it, back on its button |
| Escape on the bar | Closes the bar and puts focus back in `editor` |

A mouse-down on the bar doesn't take focus from the editor, so the selection stays painted while people click.

## Screen readers

It's a `toolbar` named "Format" (`labels.toolbar`), and floats as one. Each control is named by its label; toggles say
whether they're pressed, and `keys` becomes `aria-keyshortcuts`. A menu's button says it opens a `menu`, whether it's open,
and the option it shows ("List: Bulleted list"); its options are `menuitemradio`s that say which is chosen. Dividers are
`separator`s. Tooltips repeat the names, so they're hidden from them.

## Content

`items` defaults to `defaultSelectionToolbarItems`; pass your own list in order, with `{ type: "separator" }` between
groups. Every control needs a short `label` – the icon alone may not be clear – and `icon`, SVG path data for a 24×24
stroked icon. Give menu options an `icon` (shown on the menu's button when chosen) or a `color` (a swatch). Set
`pressed` and `values` from the editor's state each time the selection moves, so the bar tells the truth about the text.

Anchor it with `selectionRect()` after a selection is finished (on pointer-up or a Shift key), not on every
`selectionchange` while dragging; set `open` false when the selection collapses. When it closes itself it fires
`tc-close` and sets `open` false – a React page that passes `open` should follow `onTcClose`.

## Do

- Apply every `tc-command` in the editor, then update `pressed` and `values` from what the text now is.
- Keep the groups the editor really has; drop menus it can't apply.
- Give the editor a key to reach the bar (`focusToolbar()`), and say so near the editor.

## Don't

- Don't open it on a collapsed selection or while the pointer is still dragging.
- Don't rely on colour alone in a colour menu: every option has a name.
- Don't put an action that can't be undone on the bar without a confirmation.

## Example

```html
<div id="memo" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Memo">Select some of this text.</div>
<tc-selection-toolbar id="bar"></tc-selection-toolbar>

<script type="module">
  import { selectionRect } from "trenchcoat/selection-toolbar";
  import "trenchcoat/tokens.css";

  const memo = document.querySelector("#memo");
  const bar = document.querySelector("#bar");
  bar.editor = memo;
  const follow = () => {
    const rect = selectionRect();
    bar.anchor = rect;
    bar.open = !!rect;
    bar.pressed = ["bold", "italic"].filter((id) => document.queryCommandState(id));
  };
  memo.addEventListener("pointerup", follow);
  memo.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "F10") {
      e.preventDefault();
      bar.focusToolbar();
    }
  });
  bar.addEventListener("tc-command", (e) => {
    if (e.detail.id === "bold" || e.detail.id === "italic") document.execCommand(e.detail.id);
    follow();
  });
</script>
```

```tsx
import { useRef, useState } from "react";
import { SelectionToolbar, selectionRect } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Memo() {
  const editor = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<ReturnType<typeof selectionRect>>(null);
  const [pressed, setPressed] = useState<string[]>([]);
  const follow = () => {
    const rect = selectionRect();
    setAnchor(rect);
    setPressed(["bold", "italic"].filter((id) => document.queryCommandState(id)));
  };
  return (
    <>
      <div ref={editor} contentEditable role="textbox" aria-multiline="true" aria-label="Memo" onPointerUp={follow} suppressContentEditableWarning>
        Select some of this text.
      </div>
      <SelectionToolbar
        anchor={anchor}
        open={anchor !== null}
        editor={editor.current}
        pressed={pressed}
        onTcCommand={(e) => {
          if (e.detail.id === "bold" || e.detail.id === "italic") document.execCommand(e.detail.id);
          follow();
        }}
        onTcClose={() => setAnchor(null)}
      />
    </>
  );
}
```
