---
pattern: disclosure
status: new
related: fact-sheet, document-list, co-occurrence, version-history
---

## Overview

The exhibits linked to a matter, and the trail behind each one. Every exhibit has its reference ("E-101"), title,
type with an icon, where it came from with an Admiralty grade tag (tinted and barred by confidence, as in
`fact-sheet`), its date, who holds it and a status in words with a mark – Sealed, In analysis, Decryption pending,
Transcribed, Released, or the page's own. The header counts them and says when they were last synced, and a note can
say where the originals live. Open an exhibit to see its chain of custody: every hand it passed through, in order,
with the hash recorded at each step – copyable – and a line saying whether the hashes agree.

## When to use

- Legal, compliance and audit matters where the exhibits and their handling must be shown.
- Internal investigations that link to an evidence or records system.
- Any list of items whose provenance and integrity matter as much as their content.

## When not to use

- Identity or record documents with their numbers and expiry – use `document-list`.
- Facts with their sources and grades – use `fact-sheet`.
- Versions of one document over time – use `version-history`.
- Who appears together across events – use `co-occurrence`.

## Anatomy

1. **Count** `.ui-evl__count` – how many exhibits are linked, and when they were last synced
2. **Note** `.ui-evl__note` – where the originals are kept
3. **Exhibit** `.ui-evl__row` – type icon, reference, title, type, source tag, date, holder and status
4. **Source tag** `.ui-evl__tag` – the source and its grade, tinted and barred by confidence
5. **Status** `.ui-evl__status` – a mark and a word
6. **Chain of custody** `.ui-evl__custody` – every step with when, who, what, where and the hash
7. **Integrity** `.ui-evl__integrity` – whether the hashes agree

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The rows, tags and custody trail are the same in both.

## Keyboard

The exhibits are one tab stop; inside an open custody trail, Tab reaches each Copy button.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next exhibit |
| Home / End | Moves to the first or last exhibit |
| Enter / Space | Opens the exhibit's chain of custody, or closes it |
| Escape | Closes the open trail and returns focus to its exhibit |

## Screen readers

The exhibits are a list named by the heading; each is a button with `aria-expanded`, reading its reference, title,
type, source with its grade and confidence, date, status and holder – “E-101, Signed supply agreement, Document, source
Client, grade A1, high confidence, 3 May 2026, Sealed, Evidence room B”. An open trail is a region named “Chain of
custody for E-101”, its steps an ordered list. Each Copy button is named for its step – “Copy the hash from step 2”.
Opening, closing and copying are confirmed in a polite status message.

## Content

- Use the reference people say out loud as `ref` – “E-101” – and a plain title.
- Write each custody `action` as a past-tense verb: “Collected”, “Sealed”, “Transferred”, “Returned”.
- Name the `actor` with their role: “M. Tan (paralegal)”.
- Grade sources with the Admiralty scale, so the tags read the same as in `fact-sheet`.

## Do

- Record a hash at every step that touches the exhibit, so integrity can be checked end to end.
- Set `synced` and `note` when the list mirrors another system.

## Don't

- Don't use the status tints for anything but the exhibit's state.
- Don't drop custody steps to keep the trail short – the gaps are what people look for.

## Example

```html
<tc-evidence-list id="evl" note="Exhibits are kept in the evidence system; these are linked references."></tc-evidence-list>

<script type="module">
  import "trenchcoat/evidence-list";
  import "trenchcoat/tokens.css";

  const evl = document.querySelector("#evl");
  evl.exhibits = [
    {
      id: "e101",
      ref: "E-101",
      title: "Signed supply agreement",
      type: "document",
      source: { label: "Client", grade: "A1" },
      status: "sealed",
      custody: [{ at: Date.parse("2026-05-03T09:00"), actor: "M. Tan (paralegal)", action: "Collected", hash: "sha256:9f2c…" }],
    },
  ];
  evl.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { EvidenceList, type Exhibit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const exhibits: Exhibit[] = [
  { id: "e101", ref: "E-101", title: "Signed supply agreement", type: "document", source: { label: "Client", grade: "A1" }, status: "sealed" },
  { id: "e112", ref: "E-112", title: "Recorded call, 14 min", type: "audio", status: "transcribed" },
];

export function Exhibits() {
  const [selected, setSelected] = useState<string | null>(null);
  return <EvidenceList title="Linked evidence" exhibits={exhibits} selected={selected} onSelectedChange={setSelected} />;
}
```
