---
pattern: list
status: new
related: testimonial-wall, logo-cluster, cover-flow, button
---

## Overview

The endless “Trusted by” strip for landing pages. Rows of logos loop without a gap or a jump, at a speed in pixels per
second that's the same on any screen. Hovering or keyboard-focusing the strip eases it to a stop; dragging or swiping
scrubs it with inertia. Logos sit muted and monochrome, and the one under the pointer lifts to its brand colour. A
Pause / Play button stops it for good. A second row runs the other way. It only moves while on screen, and with
reduced motion it's a static, wrapping row.

## When to use

- A landing page's row of customer or partner logos.
- Showing more logos than fit across the page without a carousel's controls.

## When not to use

- A handful of logos that fit – put them in a row, or use `logo-cluster`.
- Quotes from customers – use `testimonial-wall`.
- Browsing items people pick from – use `cover-flow`.

## Anatomy

1. **Pause / Play** `.ui-lm__pause` – a button at the right edge, first in the tab order
2. **Row** `.ui-lm__row` – a strip that loops, faded at both ends
3. **Set** `.ui-lm__set` – one copy of the row's logos; the copies after it are decoration
4. **Logo** `.ui-lm__link` – the mark `.ui-lm__mark` and, with `labels`, the name `.ui-lm__name`
5. **Static row** `.ui-lm__wrap` – the wrapping row shown with reduced motion

## Looks

One look: the strip takes the page's background. Component tokens on the element: `--tc-lm-h` (the marks' height,
28 px, 22 px when narrow), `--tc-lm-row-gap`, `--tc-lm-fade` (the edges' fade) and `--tc-lm-dim` (how far the other
logos step back while one is hovered in full colour).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Pause / Play, then through the linked logos; focusing the strip stops it |
| Enter / Space | On Pause / Play, stops or starts it |
| Enter | On a logo, follows its link |

A focused logo near an edge is nudged into view.

## Screen readers

The strip is a `region` named by `label`. Only the first set is read and reachable; the copies are `aria-hidden` and
`inert`. Each logo is read by its name, and Pause / Play by what it does.

## Content

- Give marks as SVG elements with `fill="currentColor"` so they follow the muted colour; `color` is the brand colour
  they lift to.
- Use `scale` to even out a heavy or round mark next to wordmarks.
- Only link a logo to something about that customer, such as a case study.

## Do

- Keep the default Pause / Play button – moving content needs a way to stop it (WCAG 2.2.2).
- Use about 8 to 14 logos; two rows for more.

## Don't

- Don't speed it up to show more logos.
- Don't put text other than brand names in it.

## Example

```html
<tc-logo-marquee id="logos" label="Customers" labels="beside"></tc-logo-marquee>

<script type="module">
  import "trenchcoat/logo-marquee";
  import "trenchcoat/tokens.css";

  const svg = (d) => {
    const t = document.createElement("template");
    t.innerHTML = `<svg viewBox="0 0 32 32" fill="currentColor"><path d="${d}"/></svg>`;
    return t.content.firstElementChild;
  };
  document.querySelector("#logos").logos = [
    { name: "Northwind", color: "#2f6bff", svg: svg("M4 26 16 4l12 22h-6l-6-11-6 11z") },
    { name: "Fernway", color: "#10b981", svg: svg("M16 2c8 6 10 16 0 28C6 18 8 8 16 2z") },
  ];
</script>
```

```tsx
import { LogoMarquee, type MarqueeLogo } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const logos: MarqueeLogo[] = [
  { name: "Northwind", color: "#2f6bff", svg: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M4 26 16 4l12 22h-6l-6-11-6 11z" /></svg> },
  { name: "Fernway", color: "#10b981", svg: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 2c8 6 10 16 0 28C6 18 8 8 16 2z" /></svg> },
];

export function Customers() {
  return <LogoMarquee logos={logos} label="Customers" labels="beside" />;
}
```
