---
pattern: disclosure
status: new
related: loupe, look-provider
---

## Overview

Which breakpoint the page is at, for the people who build it. A small badge sits in a corner of the window with the
breakpoint in force and the width, in that breakpoint's colour. Open it – click it, press ⌥⇧O / Alt Shift O, or set
`open` – for a panel with the window's size, a scale of every breakpoint with the width marked on it, and each
breakpoint's name, media query and range, with the current one marked. A ruler runs across the top of the window while
it's open. Escape closes it.

It follows the window by default. Give it a `target` and it follows that element's width instead: a preview frame, a
resizable container, a component tested at container sizes.

It's Loupe's breakpoint ruler on its own, small enough to leave on while you work. Use
[Loupe](#/loupe) when you also want the page's components and its flex and grid layouts.

## When to use

- In development and review builds, to see which breakpoint a layout is at while resizing the window.
- Beside a preview frame or resizable container, to see which of its breakpoints applies.

## When not to use

- To find components, or the flex or grid container behind a spacing problem – use [Loupe](#/loupe).
- In the product for its users – it's a builder's tool. Leave it out of production builds, or behind a flag.

## Anatomy

1. **Badge** `.ui-bpo__badge` – the current breakpoint's colour, name and the width; opens the panel
2. **Panel** `.ui-bpo__panel` – the heading with the size and breakpoint, and Close
3. **Scale** `.ui-bpo__scale` – each breakpoint's stretch of widths, with the width marked
4. **Breakpoints** `.ui-bpo__bps` – each breakpoint's name, media query and range, the current one marked
5. **Ruler** `.ui-bpo__ruler` – breakpoints across the top of the window, with the width, while it's open

## Looks

Standard puts the panel's header on a gray tray above a white card; Clean is one white card with the header as its
first row. Floating (the default) the badge and panel sit in the window's `corner` (bottom left by default, so it
doesn't sit on Loupe's) with an overlay shadow. With `floating` off it's a card in the page, always open, with no badge.

A breakpoint is min-width only, max-width only, or a range. The one in force is the one that applies with the largest
min, so a list of min-widths reads as it does in CSS. Breakpoints are coloured from the theme's tones, in order. A page
can set `--tc-bpo-w` (the panel's width) and `--tc-bpo-ruler-h`.

## Keyboard

| Key | Does |
| --- | --- |
| ⌥ ⇧ O / Alt Shift O | Opens and closes the panel, from anywhere (`hotkey`; false turns it off) |
| Enter or Space on the badge | Opens and closes the panel |
| Escape | Closes the panel – unless a dialog or menu on the page has it first – and focus goes back to the badge |

## Screen readers

- The badge is a button that says the breakpoint and width, and whether the panel is open (`aria-expanded`).
- The panel is a region named by its heading; the breakpoints are a list, each saying whether it's current, applies
  or doesn't.
- A change of breakpoint is announced in a polite status line while the panel is open.
- The scale and the ruler are drawn for sighted builders and hidden from assistive tech; the list carries the same
  information.

## Content

- Match `breakpoints` to the ones your CSS uses, with labels people say ("Medium", not "md"); the id shows beside it.
- Use ranges (`min` and `max`) when your breakpoints don't stack up, like a tablet-only layout.

## Do

- Ship it in development and preview builds only.
- Pick a `corner` that doesn't cover the part of the page you're checking.
- Listen to `tc-breakpoint-change` to log or test which breakpoint each width lands in.

## Don't

- Use it to make a layout decision in the product; use CSS media or container queries.
- Rely on it to tell users anything.

## Example

```html
<tc-breakpoint-overlay corner="bottom-right"></tc-breakpoint-overlay>
<script type="module">
  import "@adamstavely/trenchcoat/breakpoint-overlay";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-breakpoint-overlay").breakpoints = [
    { id: "mobile", label: "Mobile", max: 767 },
    { id: "tablet", label: "Tablet", min: 768, max: 1023 },
    { id: "desktop", label: "Desktop", min: 1024 },
  ];
</script>
```

```tsx
import { BreakpointOverlay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function DevTools() {
  if (process.env.NODE_ENV === "production") return null;
  return <BreakpointOverlay corner="bottom-right" />;
}
```
