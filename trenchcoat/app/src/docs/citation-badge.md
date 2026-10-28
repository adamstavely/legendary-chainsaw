---
pattern: button
status: new
related: citation-sections, publication-impact, cited-answer
---

## Overview

A small badge of how a work is cited, to embed beside a paper, a profile or a search result. It shows a count per
kind of citation – by default Publications, Supporting, Mentioning and Contrasting – each with its own mark. On hover
or focus a tooltip lists each kind in words with its count and what it means. The page may put its own source name or
logo on top; there is no brand line otherwise. The whole badge is one control: a link with `href`, a button with
`openable`, else simply focusable so the tooltip can be reached.

## When to use

- Beside a paper, a dataset or a researcher, where a glance at how it's cited helps.
- In lists of results, using the compact layout.
- With your own citation index, its name in `source`.

## When not to use

- Where in citing papers a work is cited – use `citation-sections`.
- A paper's whole impact – use `publication-impact`.
- The sources behind an AI answer – use `cited-answer`.

## Anatomy

1. **Badge** `.ui-ctb__badge` – the control: the source line and the counts
2. **Source** `.ui-ctb__source` – the page's index name or logo, when given
3. **Mark** `.ui-ctb__mark` – each kind's icon, tinted by its tone
4. **Count** `.ui-ctb__count` – each kind's count, in tabular numbers
5. **Tooltip** `.ui-ctb__tip` – each kind in words, its count and what it means

## Looks

Standard is a white badge with a soft shadow. Clean is a hairline badge with thinner marks. `layout="labelled"` shows
each kind's name, mark and count; `layout="compact"` only the mark and the count, the numbers right-aligned.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Focuses the badge and shows its tooltip |
| Enter | Follows the link (`href`) or fires tc-open (`openable`) |
| Space | Fires tc-open when the badge is a button |
| Escape | Hides the tooltip |

## Screen readers

The badge's name sums the counts up: “Citations: 522 publications, 29 supporting, 348 mentioning and 7 contrasting”,
starting with `source` when it's set. It's described by the tooltip, which says what each kind means. Without a link
or `openable` it's an image, focusable so the description can be read. The marks are hidden; the words read.

## Content

- Keep the kinds' names to one word, and say what each means in `meaning`: “cites this work as evidence for its claim”.
- Use your own index's name in `source`, never another provider's brand.

## Do

- Use the compact layout in dense lists, and the labelled one on a paper's page.
- Link the badge to where the citing statements can be read.

## Don't

- Don't use the tones for anything but the kind of citation.
- Don't put more than about five kinds in one badge.

## Example

```html
<tc-citation-badge id="badge" source="Larkfield Index" href="/papers/42/citations"></tc-citation-badge>

<script type="module">
  import "trenchcoat/citation-badge";
  import "trenchcoat/tokens.css";

  document.querySelector("#badge").counts = { publications: 522, supporting: 29, mentioning: 348, contrasting: 7 };
</script>
```

```tsx
import { CitationBadge } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Badge() {
  return <CitationBadge source="Larkfield Index" href="/papers/42/citations" counts={{ publications: 522, supporting: 29, mentioning: 348, contrasting: 7 }} />;
}
```
