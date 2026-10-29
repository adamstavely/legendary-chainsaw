---
pattern: listbox
status: new
related: tooltip, command-menu, isbn-details, dialog
---

## Overview

A design-system inspector laid over the live page, for the people who build it. Turn it on with ⌘⇧L / Ctrl Shift L
(or `active`). Every component on the page gets an outline: the elements marked `data-ds-component` and the
library's own elements. Point at one for a card with its name, where its code lives, its size and look, and links to
its docs, source and design file. A ruler across the top of the window marks each breakpoint and the window's width,
and the panel says which breakpoint applies. With Layouts on, flex and grid containers are outlined and listed with
their direction, gap and alignment.

The page keeps working underneath. The outlines don't take the pointer, the page still scrolls, and everything
follows scrolling, resizing and changes to the page. The panel lists the components and layouts, so a keyboard can
reach every one. Escape turns it off.

## When to use

- In development and review builds, to find out which component is which on a real screen, and where its code and
  docs are.
- Checking a page at each breakpoint, or finding the flex or grid container behind a spacing problem.

## When not to use

- In the product for its users – it's a builder's tool. Leave it out of production builds, or behind a flag.
- To explain a feature to users – use [Tooltip](#/tooltip) or a tour.
- For a list of commands – use [Command Menu](#/command-menu).

## Anatomy

1. **Panel** `.ui-lpe__panel` – the heading with the window's size and breakpoint, and Close
2. **Switches** `.ui-lpe__switches` – Components, Breakpoints and Layouts, each with its count
3. **Breakpoints** `.ui-lpe__bps` – each breakpoint and its range, the current one marked
4. **Components list** `.ui-lpe__list` – every component found; pick one to scroll to it and keep its card up
5. **Outline** `.ui-lpe__outline` – round each component, named when it's the one in focus
6. **Card** `.ui-lpe__card` – the component's name, path, size, look and links
7. **Ruler** `.ui-lpe__ruler` – breakpoints across the top of the window, with the window's width
8. **Layout outline** `.ui-lpe__layout` – round a flex or grid container, with its direction and gap

## Looks

Standard puts the panel's header on a gray tray above a white card; Clean is one white card with the header as its
first row. Floating (the default) the panel sits at the window's bottom right with an overlay shadow, and shows only
while it's on, unless you add `launcher`. With `floating` off, it's a card in the page with an Inspect button.

A page can set `--tc-lpe-outline` (the component outline colour), `--tc-lpe-layout` (layouts), `--tc-lpe-w` (the
panel's width) and `--tc-lpe-ruler-h`. Breakpoints are coloured from the theme's tones, in order.

## Keyboard

| Key | Does |
| --- | --- |
| ⌘ ⇧ L / Ctrl Shift L | Turns it on and off, from anywhere (`hotkey`; false turns it off) |
| Escape | Turns it off – unless a dialog or menu on the page has it first, or a picked component's card is up |
| ↑ / ↓ in a list | Previous / next component or layout, scrolled into view |
| Home / End in a list | First / last |
| Enter or Space in the components list | Picks it: its card stays up |

## Screen readers

- The panel is a region named by its heading. On and off, picks and layout counts are announced in a polite status
  line.
- The switches are `switch`es with their state; the lists are `listbox`es whose active option follows the arrow keys.
- The outlines and the ruler are drawn for sighted builders and hidden from assistive tech; the lists carry the same
  information.
- The card is a `note` named after its component, and its links say where they go.

## Content

- Give components the name your docs use: `data-ds-component="StatCard"`, with `data-ds-path` for where the code
  lives.
- Put the links in `components` by that name (`docs`, `source`, `design`, or `links` for anything else), or
  describe elements yourself with `describe`.
- Match `breakpoints` to the ones your CSS uses, with labels people say ("Medium", not "md").

## Do

- Ship it in development and preview builds only.
- Scope it with `root` when it should look at part of the page.
- Keep the hotkey unless the app already uses it.

## Don't

- Mark every element as a component – only the system's own pieces, or the outlines stop meaning anything.
- Leave it on while measuring performance: it reads layout as you scroll.
- Rely on it to tell users anything.

## Example

```html
<tc-loupe launcher></tc-loupe>
<script type="module">
  document.querySelector("tc-loupe").components = {
    StatCard: { docs: "/docs/stat-card", source: "https://github.com/acme/app/blob/main/src/StatCard.tsx" },
  };
</script>
```

```tsx
import { Loupe } from "trenchcoat/react";

export function DevTools() {
  if (process.env.NODE_ENV === "production") return null;
  return <Loupe launcher components={{ StatCard: { docs: "/docs/stat-card" } }} />;
}
```
