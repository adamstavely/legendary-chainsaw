---
pattern: list
status: new
related: logo-marquee, cover-flow, comment-thread, button
---

## Overview

The landing-page wall of quotes. Quotes are dealt into columns – up to three on wide containers, two below 740 px and
one below 480 px, measured on the wall itself – that scroll endlessly, alternating up and down at slightly different
speeds. Hovering or keyboard-focusing a column eases it to a stop; dragging it with the mouse scrubs it; pressing and
holding on touch pauses it to read. A Pause / Play button stops the whole wall for good. It only moves while on screen,
and with reduced motion it's a static grid of every quote.

## When to use

- A landing page's wall of customer quotes, where the volume itself says something.
- Ten or more short quotes of mixed length.

## When not to use

- A row of customer logos – use `logo-marquee`.
- A conversation people take part in – use `comment-thread`.
- A few quotes people should read in turn – use `cover-flow`.

## Anatomy

1. **Pause / Play** `.ui-twl__pause` – a button at the top right, first in the tab order
2. **Column** `.ui-twl__col` – a loop of cards, faded at the top and bottom
3. **Card** `.ui-twl__card` – one quote
4. **Rating** `.ui-twl__stars` – one to five calm gray stars
5. **Quote** `.ui-twl__quote`
6. **Person** `.ui-twl__who` – the avatar `.ui-twl__avatar` (photo or initials), the name `.ui-twl__name` with a
   verified mark `.ui-twl__verified`, and the role and company `.ui-twl__meta`

## Looks

One look: white cards on the page's background. Set the wall's height with `--tc-testimonial-wall-height` (600 px).
Component tokens on the element: `--tc-twl-gap`, `--tc-twl-fade` (the edges' fade), `--tc-twl-dim` (how far the other
cards step back while one is hovered) and the stars' `--tc-twl-star` / `--tc-twl-star-off`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Pause / Play, then through the cards; a focused card stops its column and is nudged into view |
| Enter / Space | On Pause / Play, stops or starts the wall |

## Screen readers

The wall is a `region` named by `label`. Each card is a `figure` with the quote in a `blockquote` and the person in its
caption. Only the real set of each column is read and reachable; the copies are `aria-hidden` and `inert`. A rating
reads “Rated 4 out of 5”, the verified mark “Verified customer”.

## Content

- Mix short and long quotes – the masonry looks more natural.
- Give a role and company where you can; they make a quote credible.
- Only mark people verified when you've checked who they are.

## Do

- Keep the default Pause / Play button (WCAG 2.2.2).
- Set the height so at least two cards show in each column.

## Don't

- Don't edit quotes beyond trimming them.
- Don't use it for fewer than about six quotes – a static grid reads better.

## Example

```html
<tc-testimonial-wall id="wall" label="Customer testimonials"></tc-testimonial-wall>

<script type="module">
  import "trenchcoat/testimonial-wall";
  import "trenchcoat/tokens.css";

  document.querySelector("#wall").items = [
    { quote: "Fast.", name: "Leo Brandt", role: "Staff Engineer", company: "Northwind", rating: 5 },
    { quote: "Onboarding took ten minutes.", name: "Jonas Ortiz", role: "Founder", company: "Kestrel", rating: 4, verified: true },
  ];
</script>
```

```tsx
import { TestimonialWall, type Testimonial } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: Testimonial[] = [
  { quote: "Fast.", name: "Leo Brandt", role: "Staff Engineer", company: "Northwind", rating: 5 },
  { quote: "Onboarding took ten minutes.", name: "Jonas Ortiz", role: "Founder", company: "Kestrel", rating: 4, verified: true },
];

export function Wall() {
  return <TestimonialWall items={items} label="Customer testimonials" />;
}
```
