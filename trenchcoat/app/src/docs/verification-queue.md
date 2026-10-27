---
pattern: listbox
status: new
related: claim-answer, review-center, decision-inbox, validity-badge
---

## Overview

Every claim worth checking from a session, in one queue, before anything leaves it. Claims arrive from an answer
(`claim-answer`'s “Send to verification”); a person checks each one outside the model and marks it verified
externally, can't verify, incorrect or dismissed, with the source passage it rests on beside it. The export stays
blocked until the claims are reviewed, so nothing the model said goes out unchecked. Single keys mark a claim and
move to the next, and long sessions stay fast – the list renders only the rows on screen.

Checking a claim means something different for each kind of source, so a source type can have verdicts in its own
words: a transcript claim might be “Matches the recording”, “Transcript misheard” or “Dismiss”; an OCR claim “OCR
misread” or “Misrepresents source”. Each verdict counts under one of the four statuses, so the progress, the filters
and the export gate work as before; the claim keeps which verdict it was given. Types without verdicts of their own
keep the four marks.

## When to use

- Before a report, a brief or a decision built with AI help is exported, sent or filed.
- Sessions where people send claims to check as they read, and come back to them together.
- Products that must show that a person reviewed what the model said, claim by claim.

## When not to use

- Approving or rejecting what an agent wants to do – use `review-center`.
- A few quick yes / no decisions – use `decision-inbox`.
- Checking claims inside the answer, where they were made – use `claim-answer`.

## Anatomy

1. **Progress** `.ui-vq__progress` – under the heading: how many claims are reviewed, coloured by verdict
2. **Filters** `.ui-vq__filters` – To review, Reviewed or All, with counts
3. **List** `.ui-vq__rows` – the claims, each with its status, origin and source type
4. **Claim** `.ui-vq__row` – one claim; the one you're on is marked
5. **Detail** `.ui-vq__detail` – the claim in full, where it came from and its source passages
6. **Marks** `.ui-vq__marks` – Verified, Can't verify, Incorrect and Dismiss with their keys – or the claim's own source type's verdicts
7. **Export gate** `.ui-vq__foot` – why the export is blocked, or that it's ready, and Export

## Looks

Standard puts the heading and progress on the gray tray, the list and the claim you're on in a white card – the
claim on a light gray well – and the export gate on the tray below. Clean is one white card divided by hairlines,
with the heading in the strong text colour and thinner icons. Both mark statuses with the same shapes: a dashed
ring to review, a check, a question mark, a cross and a dash.

## Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous claim |
| Home / End | Moves to the first or last claim |
| PageDown / PageUp | Moves a list-height down or up |
| V | Marks the claim verified externally and moves on |
| C | Marks it can't verify and moves on |
| X | Marks it incorrect and moves on |
| D | Marks it dismissed and moves on |
| Verdict keys | With verdicts for the claim's type: a verdict's own `key`, or – for the first verdict of each status – that status's key (V, C, X or D); a key the type has no verdict for does nothing |
| U | Puts it back to review |
| ← / → (marks) | Moves between the four mark buttons; Home and End jump |
| Enter / Space (marks) | Marks the claim, or – on the pressed mark – puts it back to review |

## Screen readers

The host is a region named by the heading (“Verification queue”). The progress is a progressbar (“2 of 5
reviewed”). The list is a listbox named after the filter (“Claims – to review”); each claim is an option with
`aria-selected`, `aria-posinset` and `aria-setsize` (so the count is right while the list is windowed), read as the
claim, its origin, its status and its source type. The filters are toggle buttons (`aria-pressed`) in a group named
“Show”, and the marks a toolbar named “Mark this claim” whose buttons are pressed for the claim's status and carry
`aria-keyshortcuts`; a verdict's button is pressed only for the verdict given, and the claim is read with the
verdict's words (“Misrepresents source”). A polite status says each mark (“Verified externally: … – 3 of 5
reviewed”, or “OCR misread: … – 3 of 5 reviewed”) and why the export
is blocked (“Review 3 more claims before exporting.”). Export stays focusable while blocked (`aria-disabled`) and
is described by the gate's message.

## Content

- Keep claims as they were made, one fact or judgement each; edit them in the answer, not in the queue.
- Use `origin` for where in the session a claim came from (“Turn 4”, “Hub answer”), so reviewers can go back to it.
- Rename the statuses for your process with `statusLabels`, keeping their meaning: verified means checked against
  a source outside the model.
- Write `exportLabel` as what happens: “Export brief”, “Send to legal”.
- Name verdicts by what the reviewer did or found – “Matches the recording”, “OCR misread” – and keep them short;
  three or four per type. Map each to the status it really is: a misread scan is `incorrect`, not `dismissed`.

## Do

- Attach the source passages (`sources`, with `validity`) so reviewers see what the claim rests on and how fresh it
  is.
- Keep the gate at every claim (`allowUnreviewed` 0) unless your process says otherwise – and say so near the
  button.
- Save each mark as it happens (`tc-review`) so a long session survives a reload – with `verdict`, when there is
  one, so you can route a misread scan differently from a misrepresented source.

## Don't

- Don't enable the export some other way while the gate is closed – the gate is the point.
- Don't count dismissed claims as verified in your export; the detail keeps them apart.
- Don't remove incorrect claims from the queue – the record of what was wrong matters.

## Example

```html
<tc-verification-queue id="queue" export-label="Export brief"></tc-verification-queue>

<script type="module">
  import "trenchcoat/verification-queue";
  import "trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.sources = [{ id: "quote", site: "Freight quote", title: "Carrier quote", quote: "Per-order cost: $6.42 against $6.17." }];
  queue.claims = [
    { id: "c1", text: "The northern hub costs about 4% more per order.", source: "grounded", sources: ["quote"], origin: "Turn 2" },
    { id: "c2", text: "Fuel prices will decide much of the gap.", source: "model", origin: "Turn 3" },
    { id: "c3", text: "The lease starts in February.", source: "ocr", recognition: 0.72, origin: "Turn 4" },
  ];
  queue.verdicts = {
    ocr: [
      { id: "matches", label: "Matches the original", status: "verified" },
      { id: "misread", label: "OCR misread", status: "incorrect" },
      { id: "misrepresents", label: "Misrepresents source", status: "incorrect", key: "m" },
    ],
  };
  queue.addEventListener("tc-review", (e) => save(e.detail.claim.id, e.detail.status, e.detail.verdict?.id));
  queue.addEventListener("tc-export", (e) => exportBrief(e.detail.claims));
</script>
```

```tsx
import { useState } from "react";
import { VerificationQueue, type VerificationClaim, type VerificationVerdict } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const verdicts: { transcript: VerificationVerdict[] } = {
  transcript: [
    { id: "matches", label: "Matches the recording", status: "verified" },
    { id: "misheard", label: "Transcript misheard", status: "incorrect" },
    { id: "dismiss", label: "Dismiss", status: "dismissed" },
  ],
};

export function Review({ initial }: { initial: VerificationClaim[] }) {
  const [claims, setClaims] = useState(initial);
  return (
    <VerificationQueue
      title="Claims to check"
      claims={claims}
      onClaimsChange={setClaims}
      verdicts={verdicts}
      onReview={(claim, status, _previous, verdict) => console.log(claim.id, status, verdict?.id)}
      exportLabel="Export brief"
      onExport={({ claims, counts }) => console.log(claims.length, counts.verified)}
    />
  );
}
```
