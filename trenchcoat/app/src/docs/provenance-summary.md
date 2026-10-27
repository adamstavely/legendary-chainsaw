---
pattern: grid
status: new
related: compact-breakdown, breakdown-chart, lineage-graph, claim-answer
---

## Overview

What a document is made of: how much of it came from sources, how much the AI synthesised, and how much its authors
wrote themselves – for the whole document and section by section. Each row is a stacked bar, and every segment is a
button that asks the app to open the lineage behind it, so a reader can go from “this section is mostly AI
synthesis” to the passages and sources it came from. Pointing at or focusing a segment lights that kind in every row
and in the legend, and the footer names the section that leans least on sources – where a reviewer looks first. The
app supplies the amounts; the kinds' names are properties.

## When to use

- At the top of a report, brief or memo drafted with AI, so readers know how much of it rests on sources.
- In a review step, to find the sections that need checking before a document goes out.
- Beside an export, as a summary of how the document was produced.

## When not to use

- One total split into parts, with no sections – use `compact-breakdown`.
- Comparing amounts across many categories and series – use `breakdown-chart`.
- Following one output back through every step to its sources – use `lineage-graph`.
- Marking up the claims of one answer – use `claim-answer`.

## Anatomy

1. **Legend** `.ui-pvs__legend` – each kind's share of the whole document
2. **Whole document** `.ui-pvs__row[data-total]` – the total as a taller stacked bar
3. **Section** `.ui-pvs__row:not([data-total])` – one row per section: its name, its size and its bar
4. **Segment** `.ui-pvs__cell` – one kind's share of a row; pressing it opens the lineage
5. **Footer** `.ui-pvs__foot` – the section with the smallest share from sources

## Looks

Standard sets a white card in the gray tray, with the footer on the tray below. Clean is one white card with a
shadow, the footer as its last row under a hairline, and slightly smaller legend figures. Both use the source-type
colours: green for sources, violet for AI synthesis, gray for original writing.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the bars once, onto the segment last used |
| ← / → | Moves to the previous or next segment in the row |
| ↑ / ↓ | Moves to the row above or below – the same kind, or the nearest one that row has |
| Home / End | Moves to the first or last segment in the row |
| Ctrl + Home / Ctrl + End | Moves to the first segment of the whole document, or the last of the last section |
| Enter / Space | Opens the lineage of the focused segment |
| Escape | Clears the highlight |

Segments with nothing in them are skipped.

## Screen readers

The card is a `region`, named by its heading. The bars are a `grid` named “Provenance by section – arrow keys move
between segments, Enter opens the lineage”: each row's header gives the section's name and size (“Market size and
growth 880 words”), and each segment is a button in a `gridcell` named with its kind, share and amount (“AI synthesis:
44%, 240 words – open lineage”). Empty segments are disabled buttons (“Original writing: 0%, 0 words”). The legend is
a list named “In total”.

## Content

- Use section titles as they appear in the document, so readers can find them.
- Pick a unit people understand – words for prose, sentences or paragraphs for short documents – and set `unit`.
- Rename the kinds with `kindLabels` to match your product, and keep them to two words.
- Count each part of the text once: a quoted passage the AI rephrased is either sourced or synthesis, not both.

## Do

- Open the lineage on `tc-lineage-open` – the detail carries the section, the kind, the amount and the share.
- Keep the amounts in step with the document while it's being written; the bars glide to their new widths.
- Put it where the document's readers see it, not only its authors.

## Don't

- Don't present it as a quality score – a sourced section can still be wrong, and original writing can be right.
- Don't round small amounts away; a section with 2% from sources should still say so.
- Don't use it for fewer than two sections – `total-only` or `compact-breakdown` says the same with less.

## Example

```html
<tc-provenance-summary id="made-of" scope="EV charging market brief · 3,100 words"></tc-provenance-summary>

<script type="module">
  import "trenchcoat/provenance-summary";
  import "trenchcoat/tokens.css";

  const summary = document.querySelector("#made-of");
  summary.sections = [
    { id: "summary", title: "Executive summary", sourced: 40, synthesis: 240, original: 260 },
    { id: "market", title: "Market size and growth", sourced: 540, synthesis: 200, original: 140 },
  ];
  summary.addEventListener("tc-lineage-open", (e) => console.log("open lineage", e.detail.section, e.detail.kind));
</script>
```

```tsx
import { ProvenanceSummary, type ProvenanceSection } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sections: ProvenanceSection[] = [
  { id: "summary", title: "Executive summary", sourced: 40, synthesis: 240, original: 260 },
  { id: "market", title: "Market size and growth", sourced: 540, synthesis: 200, original: 140 },
];

export function BriefProvenance({ openLineage }: { openLineage: (section: string | null, kind: string) => void }) {
  return (
    <ProvenanceSummary
      title="What this brief is made of"
      scope="EV charging market brief · 3,100 words"
      sections={sections}
      onOpenLineage={(section, kind) => openLineage(section, kind)}
    />
  );
}
```
