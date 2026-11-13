---
pattern: listbox
status: new
related: extraction-review, before-after, image-grid, retrieval-inspector
---

## Overview

What a vision model read, drawn on the image it read. Every region it found – a line of text, a table, a figure, a
face it blurred, an object – is a numbered outline on the image, and the same regions are a list beside it with the
label, the kind, the confidence in a word and a percentage, and the text the model read. The two are linked: pointing
at a box lights up its row, and moving through the list lights up its box. Chips filter by kind, a slider hides regions
under a confidence, and Show boxes takes the outlines off so the image can be seen plainly. Selecting a region opens
its full read text in the list.

## When to use

- Showing people what an OCR or vision step found on a scan, a photo or a screenshot before they rely on it.
- Debugging a document pipeline: which regions were found, of what kind, and how sure the model was.
- Explaining why an answer cites part of an image – select the region it came from.

## When not to use

- Checking and correcting extracted field values one by one – use `extraction-review`.
- Comparing an image with an edited version of it – use `before-after`.
- Browsing generated images – use `image-grid`.
- Showing the text passages behind an answer – use `retrieval-inspector`.

## Anatomy

1. **Tools** `.ui-rgo__tools` – the kind chips with counts, the Minimum confidence slider and the Show boxes switch
2. **Image** `.ui-rgo__frame` – the image with a box over every region shown
3. **Box** `.ui-rgo__box` – the region's outline and its number; dashed when confidence is Low, with the label above it when lit
4. **List** `.ui-rgo__list` – the regions in order, linked to the boxes
5. **Region** `.ui-rgo__option` – the number, label, confidence in a word and a percentage, the kind and a line of read text
6. **Read text** `.ui-rgo__text` – the selected region's full text, or “No text read”

## Looks

Standard puts the header on the gray tray above a white card with the tools, the image in a gray well and the list.
Clean is one white card with hairline dividers, a lighter label weight and the selected region tinted with the accent.
`--tc-region-overlay-side` sets the list's width and `--tc-region-overlay-image-max` the widest the image grows.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the kind chips, the slider, Show boxes and the list (one tab stop) |
| ↑ / ↓ | Moves through the regions; the box on the image lights up |
| Home / End | First or last region |
| Enter or Space | Selects the region and shows its read text; again clears it |
| Escape | Clears the selection |
| ← / → on the slider | Changes the minimum confidence by 5% |

## Screen readers

The list is a `listbox` named “Regions”, with one `option` per region shown and a single tab stop; it's described by
“Arrows move between regions, Enter selects, Escape clears”. Each option reads its label, the confidence in a word
and a percentage (“Medium 67% confidence”), the kind and the read text; the selected one carries `aria-selected`. The
boxes on the image are hidden from assistive technology – the list carries the same information – and the image has
its own alt text. The kind chips are toggle buttons with `aria-pressed` in a group named “Kinds”; the slider is
labelled “Minimum confidence” and reads its value as a percentage; Show boxes is a `switch`. The header says how many
regions are shown (“6 of 9 regions”).

## Content

- Label regions by what they are on the page – “Case number”, “Claims table” – not by the model's class names.
- Pass `text` exactly as the model read it, mistakes included: the point is to see what it got wrong.
- Use the built-in kinds where they fit; any other kind shows as given, or rename it with `labels.kindNames`.
- Blur faces and mask personal data in the image before it reaches the element – it shows the image it's given.

## Do

- Write the image's `alt` as what the document is, so people who can't see it know what was read.
- Start with a region selected when there's one people should check first.
- Rename the confidence words with `labels.confidence` if your model's scale means something else by High.

## Don't

- Don't use colour alone to say which regions are uncertain – the word, the percentage and the dashed outline say it too.
- Don't hide Low regions by default; set a threshold only when people ask for it.
- Don't draw hundreds of regions on one image – group words into lines or blocks first.

## Example

```html
<tc-region-overlay id="scan" heading="What the model read" alt="Scanned audit form"></tc-region-overlay>

<script type="module">
  import "@adamstavely/trenchcoat/region-overlay";
  import "@adamstavely/trenchcoat/tokens.css";

  const overlay = document.querySelector("#scan");
  overlay.src =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fff"/><text x="24" y="48" font-size="20">AUD-2026-0412</text><rect x="24" y="90" width="352" height="120" fill="#f2f2f5"/></svg>');
  overlay.regions = [
    { id: "case", label: "Case number", kind: "text", box: { x: 0.05, y: 0.1, width: 0.45, height: 0.1 }, confidence: 0.96, text: "AUD-2026-0412" },
    { id: "table", label: "Claims table", kind: "table", box: { x: 0.06, y: 0.3, width: 0.88, height: 0.4 }, confidence: 0.58 },
  ];
  overlay.addEventListener("tc-selected-change", (e) => console.log("Selected", e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { RegionOverlay, type OverlayRegion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ScanCheck({ src, regions }: { src: string; regions: OverlayRegion[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0);
  return (
    <RegionOverlay
      title="What the model read"
      src={src}
      alt="Scanned expense form"
      regions={regions}
      selected={selected}
      onSelectedChange={setSelected}
      threshold={threshold}
      onThresholdChange={setThreshold}
    />
  );
}
```
