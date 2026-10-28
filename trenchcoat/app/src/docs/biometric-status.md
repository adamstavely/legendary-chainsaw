---
pattern: listbox
status: new
related: fingerprint-card, setup-guide, usage-meter, progress-tracker
---

## Overview

Where someone's biometric enrolment stands, one row per modality: face, fingerprints, iris, palm, voice, gait,
signature, DNA – whichever the page lists. Each row has the modality's icon and name, a line of detail such as “Both
eyes · captured Feb 2024”, a status and, when known, a quality or confidence meter with its percentage written out.
The six statuses – enrolled, on file, partial, in progress, missing and expired – each have their own mark and words.
The header counts what's enrolled, and an optional match score sits above the list, such as “Photo ID match 97.2%”.
Rows can be selected, so the page can show more about one.

## When to use

- An enrolment screen: what's been captured, what's still in progress and what needs doing again.
- A person's or account's profile, summing up the biometrics on file and how good they are.
- Reviewing an identity check, with the match score at the top.

## When not to use

- Each finger of a ten-print card – use `fingerprint-card`.
- Steps someone works through to set something up – use `setup-guide`.
- Usage against a limit – use `usage-meter`.
- Progress through a long-running job – use `progress-tracker`.

## Anatomy

1. **Count** `.ui-bios__count` – how many modalities are enrolled, counting `enrolledStatuses`
2. **Match** `.ui-bios__match` – the optional score, its label and detail, and a hero meter
3. **Row** `.ui-bios__row` – one modality; selectable
4. **Icon** `.ui-bios__icon` – the modality's icon, from `kind`
5. **Name** `.ui-bios__name` – the modality, with its detail below
6. **Status** `.ui-bios__pill` – the status's mark and name
7. **Quality** `.ui-bios__quality` – a meter and its percentage

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The rows, pills and meters are the same in both. Below 460 px the
meter moves under the name.

## Keyboard

The list is one tab stop; inside it the arrows move between rows.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Selects the row, or clears it if it's selected |
| Escape | Clears the selected row |
| Tab | Leaves the list |

## Screen readers

The rows are a `listbox` named by the heading; each row is an `option` that reads its name, detail, status and
quality, “Iris, Both eyes · captured today, Enrolled, Quality 92%”, and is `aria-selected` when selected. Selecting
is confirmed in a polite status message, “Selected Iris”, and clearing with “Selection cleared”. The icons, marks and
meters are hidden; the words read.

## Content

- Write `detail` as what was captured and when: “Front and profile · captured today 09:41”.
- Set `qualityLabel` on a row when its meter measures something else: “Confidence”, “Progress”.
- Use `on-file` for a biometric carried over from an earlier enrolment, and `expired` when it's too old to use.
- Rename statuses with `statusLabels` to match your process, such as “Modelling” for in progress.

## Do

- List the modalities in the order people capture them.
- Leave `quality` out when there's nothing to measure, rather than showing 0%.
- Set `enrolledStatuses` if partial captures count towards enrolment in your process.

## Don't

- Don't use the match score for anything but a comparison result – it's the first number people read.
- Don't list modalities the enrolment never asks for unless their absence matters; mark them missing if it does.
- Don't rely on the pill colours – keep the status names distinct.

## Example

```html
<tc-biometric-status id="bio" heading="Enrolment"></tc-biometric-status>

<script type="module">
  import "trenchcoat/biometric-status";
  import "trenchcoat/tokens.css";

  const bio = document.querySelector("#bio");
  bio.modalities = [
    { id: "face", label: "Face", kind: "face", detail: "Front and profile", status: "enrolled", quality: 0.96 },
    { id: "iris", label: "Iris", kind: "iris", detail: "Left eye done", status: "in-progress", quality: 0.5, qualityLabel: "Progress" },
    { id: "voice", label: "Voice", kind: "voice", status: "missing" },
  ];
  bio.match = { label: "Photo ID match", value: 0.972 };
  bio.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { BiometricStatus, type BiometricModality } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const modalities: BiometricModality[] = [
  { id: "face", label: "Face", kind: "face", detail: "Front and profile", status: "enrolled", quality: 0.96 },
  { id: "iris", label: "Iris", kind: "iris", detail: "Left eye done", status: "in-progress", quality: 0.5, qualityLabel: "Progress" },
  { id: "voice", label: "Voice", kind: "voice", status: "missing" },
];

export function Enrolment() {
  const [selected, setSelected] = useState<string | null>(null);
  return <BiometricStatus title="Enrolment" modalities={modalities} match={{ label: "Photo ID match", value: 0.972 }} selected={selected} onSelectedChange={setSelected} />;
}
```
