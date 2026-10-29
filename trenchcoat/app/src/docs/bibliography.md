---
pattern: list
status: new
related: citation-badge, citation-sections, publication-impact, document-list
---

## Overview

A reading list, formatted. Each reference is set in the chosen citation style – APA 7, MLA 9, Chicago, Harvard or
IEEE – with a hanging indent (numbered for IEEE). Its DOI or link is live, its tags show as chips, and it has its
own Copy button. The toolbar picks the style and the order (author, newest first, title) and searches authors,
titles, journals, years and tags. It also copies the selected references, and exports them – or everything shown,
when none are ticked – as BibTeX, RIS or plain text.

The formatting covers what reading lists mostly hold: journal articles, books, chapters, reports, web pages and
theses. It follows each style's rules for listing authors ("&", "and", et al.), but not editions, editors or
translators. The formatters are exported too, for a page or a server: `formatReference`,
`formatReferenceTemplate`, `toBibTeX` and `toRIS`.

## When to use

- A project's or team's sources, kept together and copied into documents in the house style.
- Handing references to a reference manager (BibTeX or RIS).

## When not to use

- Where one work is cited, by section – use [Citation Sections](#/citation-sections).
- A badge for one source in running text – use [Citation Badge](#/citation-badge).
- Files people open, not cite – use [Document List](#/document-list).

## Anatomy

1. **Toolbar** `.ui-bib__toolbar` – select all, search, the style, the order, Copy and Export
2. **Export menu** `.ui-bib__menu` – BibTeX, RIS or plain text
3. **Entry** `.ui-bib__entry` – its checkbox, the formatted reference, its tags and Copy
4. **Reference** `.ui-bib__ref` – the reference with a hanging indent; IEEE's number in its own column
5. **Tags** `.ui-bib__tags` – the reference's tags

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Titles and journals are in italics where the style sets them so. Selected entries have a soft fill. A page can widen
the hanging indent with `--tc-bib-indent`.

## Keyboard

| Key | Does |
| --- | --- |
| Space on a checkbox | Ticks or unticks a reference |
| ↓ / ↑ on Export | Opens the menu at its first / last format |
| ↓ / ↑, Home / End in the menu | Moves between formats |
| Enter or Space in the menu | Exports in that format |
| Escape in the menu | Closes it, back to Export |

## Screen readers

- The list is an ordered list named by the heading. Each checkbox is named by its reference's title, and each Copy
  button says which reference it copies.
- The style and order are native selects; Export is a menu button with a `menu`.
- Copying and exporting are announced in a polite status line.

## Content

- Give authors as family and given names; organisations as a family name only.
- Keep titles in the case you want them shown – the styles don't recase them.
- Prefer a DOI to a URL; give `accessed` for web pages.

## Do

- Let people pick their style – fields differ.
- Keep the list's tags short so they scan.

## Don't

- Rely on it for editions, editors or translations – check those by hand.
- Use the plain-text copy where italics matter: export BibTeX or RIS into a reference manager instead.

## Example

```html
<tc-bibliography citation-style="harvard" heading="Reading list"></tc-bibliography>
<script type="module">
  document.querySelector("tc-bibliography").references = [
    { id: "a", type: "book", authors: [{ family: "Haddad", given: "Rami" }], title: "Gardening the sea", publisher: "Harbour Lane Press", year: 2019 },
  ];
</script>
```

```tsx
import { Bibliography, type Reference } from "trenchcoat/react";

export function ReadingList({ references }: { references: Reference[] }) {
  return <Bibliography title="Reading list" references={references} defaultCitationStyle="apa" onExport={(d) => console.log(d.format, d.ids)} />;
}
```
