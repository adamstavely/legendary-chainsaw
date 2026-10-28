---
pattern: grid
status: new
related: biometric-status, coverage-matrix, setup-guide, image-grid
---

## Overview

A ten-print card: every finger's print and where it stands. Each hand is a row of five tiles, thumb to little finger,
numbered in the ANSI/NIST finger positions – 1 to 5 the right hand, 6 to 10 the left. A tile shows the print, either
the page's image or a stylised whorl, loop or arch the element draws, and its status: captured with its NFIQ quality,
poor quality, not captured, unable to print, or bandaged. Each status has its own mark and words, so none relies on
colour. The header counts the prints on file, a legend counts the fingers that need attention, and a finger's detail –
quality, pattern, when and on what it was captured, and a note – opens below the card.

## When to use

- Reviewing a fingerprint enrolment before it's submitted: an access badge, a background check, a visa application.
- Showing an operator which fingers still need capturing or recapturing, and why.
- A person's profile, where the prints on file are one part of their record.

## When not to use

- Every biometric at once – face, iris, voice and the rest – use `biometric-status`.
- Which checks cover which parts – use `coverage-matrix`.
- Guiding someone through capture step by step – use `setup-guide`.
- A gallery of images to browse – use `image-grid`.

## Anatomy

1. **Count** `.ui-fpc__count` – how many of the ten prints are on file, captured or at poor quality
2. **Hand** `.ui-fpc__hand` – the row's caption, “Right hand” or “Left hand”
3. **Finger** `.ui-fpc__tile` – a finger: its position number, the print, its name and status
4. **Print** `.ui-fpc__glyph` – the page's image, or the drawn pattern; dashed when not captured, struck through when it can't be printed, banded when bandaged
5. **Status** `.ui-fpc__status` – the status's mark and name, or for a captured print its NFIQ value and five quality bars
6. **Legend** `.ui-fpc__legend` – each status other than captured that's in use, with how many fingers have it
7. **Detail** `.ui-fpc__detail` – the open finger: its status, quality, pattern, capture date, device and note

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight finger names. Clean is
one white card with the header as its first row. The tiles, prints and detail are the same in both.

## Keyboard

The card is one tab stop; inside it the arrows move between fingers.

| Key | What it does |
|---|---|
| ← / → | Moves to the next finger in the row |
| ↑ / ↓ | Moves to the same finger on the other hand |
| Home / End | Moves to the row's thumb or little finger |
| Enter / Space | Opens the finger's detail, or closes it if it's open |
| Escape | Closes the open detail |
| Tab | Leaves the grid; with a detail open, the next stop is its Close button |

Close returns focus to the finger.

## Screen readers

The fingers are a `grid` named by the heading and described by “Arrow keys move between fingers; Enter opens a
finger's detail”. Each hand is a row headed “Right hand” or “Left hand”. A finger reads its name, position and status,
“Left index, position 7: Poor quality, NFIQ 5”, is `aria-selected` while its detail is open, and then controls it
(`aria-controls`). Opening is confirmed in a polite status message, “Left index: Poor quality, NFIQ 5”, and closing
with “Detail closed”. The detail is a section headed with the finger's name; its Close button is labelled “Close
detail”. The drawn prints, marks and quality bars are hidden; the words read.

## Content

- Give `quality` as the NFIQ value, 1 (excellent) to 5 (poor); the detail names it “Very good”, “Fair” and so on.
- Use `poor` for a print that's on file but should be recaptured, and say why in `note`.
- Use `unable` for a finger that can't be printed at all, and `bandaged` for one that can't be printed for now.
- Name the capture device as operators know it: “Live-scan kiosk · Lobby 2”.

## Do

- Leave fingers out of `prints` until they're captured – they show as not captured.
- Pass `image` when you have the print, so reviewers see the real ridges.
- Set `order` to `left-first` when your capture form starts with the left hand.

## Don't

- Don't use the drawn patterns as evidence – they're illustrations; show the image for anything that's checked.
- Don't rename statuses so two read alike – the marks differ, but the words are what people scan.
- Don't open a detail on load unless the page was opened to look at that finger.

## Example

```html
<tc-fingerprint-card id="prints" description="Badge enrolment, rolled prints."></tc-fingerprint-card>

<script type="module">
  import "trenchcoat/fingerprint-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#prints");
  card.prints = [
    { position: 1, status: "captured", quality: 1, pattern: "whorl" },
    { position: 2, status: "captured", quality: 2, pattern: "loop" },
    { position: 7, status: "poor", quality: 5, note: "Smudged – recapture." },
    { position: 4, status: "bandaged" },
  ];
  card.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.print));
</script>
```

```tsx
import { useState } from "react";
import { FingerprintCard, type FingerPosition, type FingerPrint } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const prints: FingerPrint[] = [
  { position: 1, status: "captured", quality: 1, pattern: "whorl" },
  { position: 2, status: "captured", quality: 2, pattern: "loop" },
  { position: 7, status: "poor", quality: 5, note: "Smudged – recapture." },
  { position: 4, status: "bandaged" },
];

export function Prints() {
  const [selected, setSelected] = useState<FingerPosition | null>(null);
  return <FingerprintCard description="Badge enrolment, rolled prints." prints={prints} selected={selected} onSelectedChange={setSelected} />;
}
```
