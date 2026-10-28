---
pattern: list
status: new
related: citation-badge, publication-impact, breakdown-chart
---

## Overview

Where in citing papers a work is cited. A donut shows the counts by section – by default Intro, Methods, Results,
Discussion and Other – beside a legend of each section's letter chip, name and count. The sections are shaded from
one ink, darkest first, so the order reads without a palette. Pointing at a segment or a legend row highlights both,
and the readout under the donut names it with its count and share: “Methods · 13 · 4%”. The page may put its own
source name or logo on top, and a "See more details" link under the caption.

## When to use

- Beside a paper, to show whether it's cited for its methods, its results or as background.
- Next to `citation-badge`, which counts citations by kind.

## When not to use

- Counts by kind of citation – use `citation-badge`.
- A paper's whole impact – use `publication-impact`.
- A share of a whole that people slice and filter – use `breakdown-chart`.

## Anatomy

1. **Source** `.ui-cts__source` – the page's index name or logo, when given
2. **Donut** `.ui-cts__donut` – a segment per section with any citations
3. **Caption** `.ui-cts__caption` – “Sections”, and the legend's name
4. **Readout** `.ui-cts__readout` – the section under the pointer or focus, or the total
5. **Legend** `.ui-cts__legend` – each section's chip, name and count
6. **Details** `.ui-cts__more` – the optional link or button

## Looks

Standard is a white card with a soft shadow. Clean is a hairline card. The shades mix `--tc-cts-ink` (by default
`--tc-chart-1`) into `--tc-cts-track`; set either on the element to change them.

## Keyboard

The legend rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ (or ← / →) | Moves to the previous or next section and highlights it |
| Home / End | Moves to the first or last section |
| Tab | Leaves the legend; with a details link, it's the next stop |

## Screen readers

The legend is a list named by the caption, “Sections”. Each row reads the section, its count and share: “Methods, 13
citations, 4%”. The donut, the letter chips and the readout repeat what the rows say, so they're hidden from screen
readers. The details link reads its text, “See more details”.

## Content

- Name sections as they appear in papers: “Methods”, not “Materials & methods (2)”.
- Give each section one letter that's easy to tell apart, in `letter`.
- Use your own index's name in `source`, never another provider's brand.

## Do

- Keep to about five sections; fold the rest into "Other".
- Order sections the way papers are read, so the shades follow the paper.

## Don't

- Don't rely on the shades alone – the legend's names and counts are what people read.
- Don't use it for fewer than about twenty citations; the shares won't mean much.

## Example

```html
<tc-citation-sections id="sections" href="/papers/42/citations"></tc-citation-sections>

<script type="module">
  import "trenchcoat/citation-sections";
  import "trenchcoat/tokens.css";

  document.querySelector("#sections").counts = { intro: 107, methods: 13, results: 11, discussion: 114, other: 120 };
</script>
```

```tsx
import { CitationSections } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Sections() {
  return <CitationSections href="/papers/42/citations" counts={{ intro: 107, methods: 13, results: 11, discussion: 114, other: 120 }} />;
}
```
