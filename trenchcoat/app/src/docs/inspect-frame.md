---
pattern: none
status: new
related: tilt-card, loupe, agent-monitor, chat-composer
---

## Overview

A real component seen like a selection in a design tool. The component you put inside is tilted back, and a cursor
walks through its rows: on each one a selection frame with corner handles draws round it, its padding shows as
numbers on guide lines, and a chip under it gives its width and sizing ("W Fill 300px"). Every number is measured from
the live component, so it's true to the pixel. It walks the rows twice and rests on the first one.

It wraps any Trenchcoat component, so the same illustration shows an agent card, a composer or anything else.

## When to use

- The hero or a feature section of a design system, UI kit or developer product – it says the interface is built
  with care, down to the pixel.
- Either side of a headline: give the left one `mirror` and a different `delay`, so they take turns.
- Launch posts and social images: `flat` with `playing={false}` makes a clear still.

## When not to use

- As the real interface – it's a picture of one, and nothing in it can be clicked or focused.
- In tight spaces: it needs about 400 × 330 px, and its fades want room round them.
- To inspect a page while building it – use `loupe`, which works on the live page.

## Anatomy

1. **Content** – the first element child (the React wrapper puts its children in one div, `.ui-isp-content`)
2. **Overlay** `.ui-isp-layer` – in the same grid cell with the same transform, so it lines up however it's tilted
3. **Selection** `.ui-isp-sel` with four handles `.ui-isp-handle`
4. **Guides** `.ui-isp-guide` – one per non-zero padding, each with its number `.ui-isp-num`
5. **Width chip** `.ui-isp-chip` – width and sizing: Fill when the row spans its parent's content box, Hug otherwise
6. **Cursor** `.ui-isp-cursor`

The rows are the elements matching `targets` inside the content, or by default the visible block children of the
content's root – the first element down that has more than one. At most eight. Call `measure()` after changing the
content in a way that keeps its size; size changes are picked up on their own.

## Looks

One look. The selection and chip use `--tc-inspect-frame-select` (blue by default), the guides
`--tc-inspect-frame-guide` (red); both follow the page theme. The content keeps its own look – put a
`<tc-look-provider>` round it to show it in Clean.

## Keyboard

Nothing to operate. The host is `inert`, so nothing inside it takes focus, even when the content is interactive.

## Screen readers

Decorative by default: hidden from screen readers. Give it a `label` and the host is `role="img"` with that name –
say what the picture shows, e.g. "An agent card with its header selected and its spacing shown".

## Motion

The cursor travels to a row, then the frame, guides and chip draw; each row holds for `hold` ms, the first after
`delay` ms. After `rounds` walks (2 by default) it rests on the first row and sets `data-done`. It waits while it's off
screen or the tab is hidden. With reduced motion nothing moves: the selection stands on the first row.

## Do

- Use a real component with real-looking data, at its natural width (`content-width`).
- Point `targets` at the parts worth showing when the default rows are too fine or too coarse.

## Don't

- Don't put it where people expect to use the component.
- Don't run several on screen at once with the same `delay`.

## Example

```html
<tc-inspect-frame mirror delay="900">
  <tc-agent-monitor name="Survey writer" status="done"></tc-agent-monitor>
</tc-inspect-frame>

<script type="module">
  import "@adamstavely/trenchcoat/inspect-frame";
  import "@adamstavely/trenchcoat/agent-monitor";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { AgentMonitor, InspectFrame } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <InspectFrame mirror delay={900}>
      <AgentMonitor name="Survey writer" status="done" />
    </InspectFrame>
  );
}
```
