---
pattern: none
status: new
related: image-grid, data-table, evidence-list, segmented-control
---

## Overview

The images behind a set of claims, with whether each is attested and how many claims lean on it. A filter at the top
picks All, Attested, Unverified or Failed, each with its count, and a line beside it sums up what's shown. Below, the
library's Image Grid shows the images – each tile carries its attestation as a badge and its linked claims as a note,
with alt text, Compare and Download – and the library's Data Table lists the same items, read only and sortable, so
"most-cited" or "failed first" is a click. The two sit side by side when there's room and stack when there isn't; the
grid drops to one column when the gallery is narrow.

## When to use

- Reviewing the pictures, scans and charts an investigation or report rests on.
- Showing which evidence is attested before a claim is accepted.
- Editing alt text for evidence images in place.

## When not to use

- Evidence that isn't images, with chain of custody – use `evidence-list`.
- Generated variations to choose between – use `image-grid` on its own.
- A plain table of records – use `data-table`.

## Anatomy

1. **Bar** `.ui-evg__bar` – the attestation filter and the summary
2. **Summary** `.ui-evg__summary` – items shown, how many are attested, and their linked claims
3. **Panes** `.ui-evg__panes` – the image grid and the attestation table, side by side or stacked

## Looks

The gallery itself has no card; its pieces carry the look. Standard puts the grid and the table on gray trays with
white cards; Clean draws them as single white cards. The filter follows the same look.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the filter, the grid and the table |
| ← / → | In the filter, picks the previous or next state |
| Grid and table keys | As in `image-grid` and `data-table` – open, compare, download, edit alt text, sort |

## Screen readers

The filter is a radio group named “Show”; each option reads its state and count. The summary is a polite live region,
so a new filter is announced with what it shows: “4 items · 4 attested · 8 linked claims”. The grid and the table
announce themselves as they do on their own; each tile's badge says its attestation in words.

## Content

- Give every item real alt text: what the image shows, not its file name. An empty alt is flagged “No alt text”.
- Keep titles short and specific – “Loading bay, camera 2” – and put the kind in `kind`: “Photo”, “Scan”, “Map”.
- Say where it came from in `source`, the way a reviewer would check it: “Site camera 2”, “Customer email”.
- Rename the states with `attestationLabels` when your process uses other words, such as “Verified”.

## Do

- Count claims the same way everywhere the evidence appears.
- Listen for `tc-alt-change` and save the new alt text.
- Keep a failed item in the gallery so people can see why it's out.

## Don't

- Don't use colour alone for attestation – the badge and the table say it in words.
- Don't hide unverified evidence by default; let the filter do it.
- Don't put more than a few dozen images in one gallery; split it by claim.

## Example

```html
<tc-evidence-gallery id="evidence" heading="Evidence" subtitle="Claim 2291 · damaged delivery"></tc-evidence-gallery>

<script type="module">
  import "trenchcoat/evidence-gallery";
  import "trenchcoat/tokens.css";

  const gallery = document.querySelector("#evidence");
  gallery.items = [
    { id: "dock", title: "Loading bay, camera 2", kind: "Photo", src: "/evidence/dock.jpg", alt: "Loading bay at dawn, both doors open", attestation: "attested", claims: 3, source: "Site camera 2" },
    { id: "box", title: "Pallet damage", kind: "Photo", src: "/evidence/box.jpg", alt: "Box split down one side", attestation: "unverified", claims: 1, source: "Customer email" },
  ];
  gallery.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
  gallery.addEventListener("tc-alt-change", (e) => console.log(e.detail.item.id, e.detail.alt));
</script>
```

```tsx
import { useState } from "react";
import { EvidenceGallery, type EvidenceFilter, type EvidenceItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: EvidenceItem[] = [
  { id: "dock", title: "Loading bay, camera 2", kind: "Photo", src: "/evidence/dock.jpg", alt: "Loading bay at dawn, both doors open", attestation: "attested", claims: 3, source: "Site camera 2" },
  { id: "box", title: "Pallet damage", kind: "Photo", src: "/evidence/box.jpg", alt: "Box split down one side", attestation: "unverified", claims: 1, source: "Customer email" },
];

export function ClaimEvidence() {
  const [filter, setFilter] = useState<EvidenceFilter>("all");
  return <EvidenceGallery title="Evidence" subtitle="Claim 2291" items={items} filter={filter} onFilterChange={setFilter} onAltChange={(item, alt) => console.log(item.id, alt)} />;
}
```
