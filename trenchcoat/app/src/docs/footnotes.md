---
pattern: none
status: new
related: guardrail-notice, metrics-dashboard, bar-chart, citation-sections
---

## Overview

A quiet card of caveats and notes that sits under a page's charts: where the numbers come from, what they count and
what they leave out, how fresh they are. The notes are a numbered list in small, muted text, or a bulleted one with
`numbered="false"`. A note can end in a link – its `linkLabel`, or “More” – that an app's router can take over.

With no notes the element renders nothing at all: no card with only a heading, and no region. A page can always
render it and let the notes decide.

## When to use

- Under a dashboard's or report's charts, for the method, the source and the caveats people need to read them right.
- Wherever a few short notes belong together but shouldn't compete with the content above them.

## When not to use

- A warning someone must act on – use `guardrail-notice`.
- The sources behind an AI answer – use `citation-sections`.
- One caveat on one chart – put it in that chart's own description.

## Anatomy

1. **Header** `.tc-head` – the heading (“Notes”) and an optional description, with a muted info icon
2. **Card** `.ui-fnt__card` – the white card holding the list
3. **List** `.ui-fnt__list` – an ordered list, or an unordered one with `numbered="false"`
4. **Note** `.ui-fnt__note` – one note's text `.ui-fnt__text`
5. **Link** `.ui-fnt__link` – the note's link, at its end

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. In both the icon is muted and the notes are small secondary text, so the card reads below the charts it
explains.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the notes' links |
| Enter | Follows the focused link (or fires `tc-navigate` for the app to route) |

## Screen readers

The host is a region named by its heading. The notes are a real list – ordered when numbered – so screen readers say
how many there are and which one is being read. Each link is named by its own words, after its note's text. With no
notes there's no region to land on.

## Content

- Keep each note to a sentence or two, in plain words: “Papers are counted once, by the first author's centre.”
- Put the source and its refresh time last.
- Give links words that say where they go – “Method”, “Register” – rather than relying on “More”.

## Do

- Handle `tc-navigate` and call `preventDefault()` to route a link inside the app.
- Pass an empty list rather than hiding the element: it renders nothing until there are notes.

## Don't

- Don't put warnings here that people must act on.
- Don't pass `javascript:` or other unsafe links; they're dropped and the note shows without one.

## Example

```html
<tc-footnotes id="notes" description="About the charts above"></tc-footnotes>

<script type="module">
  import "@adamstavely/trenchcoat/footnotes";
  import "@adamstavely/trenchcoat/tokens.css";

  const notes = document.querySelector("#notes");
  notes.notes = [
    { id: "count", text: "Papers are counted once, by the first author's centre.", href: "/method", linkLabel: "Method" },
    { id: "lag", text: "The last month is provisional." },
  ];
  notes.addEventListener("tc-navigate", (e) => {
    e.preventDefault();
    history.pushState(null, "", e.detail.href);
  });
</script>
```

```tsx
import { Footnotes, type FootnoteNote } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const notes: FootnoteNote[] = [
  { id: "count", text: "Papers are counted once, by the first author's centre.", href: "/method", linkLabel: "Method" },
  { id: "lag", text: "The last month is provisional." },
];

export function ChartNotes() {
  return (
    <Footnotes
      description="About the charts above"
      notes={notes}
      onNavigate={(href, _id, event) => {
        event.preventDefault();
        history.pushState(null, "", href);
      }}
    />
  );
}
```
