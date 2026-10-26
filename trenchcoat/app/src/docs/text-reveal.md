---
pattern: none
status: stable
related: number-ticker, gradient-text, blur-crossfade
---

## Overview

Text that arrives piece by piece when it scrolls into view – word by word or letter by letter, each piece rising a
little out of a soft blur. It gives a headline or an intro sentence a moment of attention without moving the layout:
the text takes its full space from the start. Font, size and colour come from the surrounding page; `as` makes it a
paragraph, a heading (h1–h3) or inline text.

## When to use

- A hero headline or the one sentence that introduces a feature, onboarding step or empty state.
- Section headings on a marketing or announcement page, revealed as people scroll.
- Short lines – a heading or a sentence or two.

## When not to use

- Swapping one piece of content for another in place – use `blur-crossfade`.
- Drawing attention to a word with colour instead of motion – use `gradient-text`.
- A number that changes – use `number-ticker`.
- Body text, labels, buttons and anything people need to read straight away – show it without motion.

## Anatomy

1. **Piece** `[as="p"] .ui-trv__p` – one word (or one letter) that fades and rises in
2. **Word** `.ui-trv__w` – letter by letter, the letters of one word, kept together so it doesn't break across lines

## Screen readers

The moving pieces are hidden; screen readers read one visually hidden copy of the whole text at once, so it isn't
spelled out letter by letter. With `as="h1"`, `"h2"` or `"h3"` the element is a heading of that level
(`role="heading"`, `aria-level`), and it appears in the page's heading outline. With reduced motion the text is
shown at once, without the blur or the rise.

## Content

- Keep it to a headline or a sentence or two – a long paragraph takes too long to arrive.
- Use `by="char"` for short headlines and the default `by="word"` for sentences.
- Write the text as plain text in `text`; markup inside it isn't rendered.

## Do

- Stagger a heading and its subline with `delay`, so the subline starts as the heading finishes.
- Use `as` to give a heading its level, rather than wrapping the element in an `h2`.
- Set `once="false"` only where replaying on every scroll adds something, such as a looping showcase.

## Don't

- Don't reveal several blocks on one screen at once – the motion competes with itself.
- Don't slow it down past what people will wait for: with the default 40 ms stagger, 30 words take over a second.

## Example

```html
<tc-text-reveal id="headline" as="h2" by="char"></tc-text-reveal>

<script type="module">
  import "trenchcoat/text-reveal";
  import "trenchcoat/tokens.css";

  const headline = document.querySelector("#headline");
  headline.text = "Meet your new teammate.";
  headline.stagger = 30;
</script>
```

```tsx
import { TextReveal } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Hero() {
  return (
    <header>
      <TextReveal as="h1" by="char" stagger={30} text="Meet your new teammate." />
      <TextReveal delay={700} text="It reads the brief, drafts the plan and checks in before anything ships." />
    </header>
  );
}
```
