---
pattern: radio
status: new
related: disagreement-banner, verification-queue, review-center, answer-arena
---

## Overview

Two reviewers looked at the same item and reached opposite verdicts. The card leads with the conflict: both verdicts
side by side, each with who gave it, when and why, and the difference in one sentence beneath them. A third person
resolves it – they uphold one verdict or override both with their own, give a required reason, and confirm – and
the card then shows the outcome with that reason. Blind mode is the reviewers' own view: they learn that a conflict
exists, but not who disagreed or how, so the other verdict can't anchor their thinking.

## When to use

- Any review step with two independent reviewers: fact checks, labelling, content moderation, code or design review.
- When a disagreement must be settled by someone else, with a record of why.
- Showing reviewers that their work is in conflict without revealing the other review.

## When not to use

- An AI and a person, or two models, disagreeing in a conversation – use `disagreement-banner`.
- Working through a queue of claims to verify – use `verification-queue`.
- A dashboard of reviews across many items – use `review-center`.
- Comparing two model answers to pick the better one – use `answer-arena`.

## Anatomy

1. **Item** `.ui-rcf__item` – what was reviewed, quoted
2. **Verdict** `.ui-rcf__verdict` – one reviewer's verdict, who, when and their reason
3. **Difference** `.ui-rcf__diff` – the disagreement in one sentence
4. **Override** `.ui-rcf__override` – the resolver's own verdict instead of either
5. **Confirm** `.ui-rcf__foot` – what's still missing, and Confirm resolution

## Looks

Standard puts the header on the gray tray, the verdicts and controls on a white card, and the confirm row back on
the tray. Clean is one white card with the confirm row as its last row under a hairline. In both, the verdicts sit
side by side with ≠ between them, and stack when the card is narrower than 400 px.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the verdicts once, then to the verdict field (when overriding), the reason and Confirm |
| ↑ / ↓ / ← / → | Moves between the two verdicts and Override, picking each (the browser's radio group) |
| Ctrl + Enter / ⌘ + Enter | In the reason, confirms the resolution when everything is filled in |
| Enter / Space | On Confirm resolution, confirms |

Once resolved, focus moves to the outcome.

## Screen readers

The card is a `group` named by its heading. The verdicts and Override are radios in a fieldset named “Uphold a
verdict”; each verdict's radio is named “Uphold Ana Ruiz: Supported”. The reason field is required and described by
the hint beside Confirm, which says what's missing (“Pick a verdict to uphold, or override.”, “Give your verdict.”,
“Give a reason – it's kept with the resolution.”). Resolving announces “Conflict resolved: Not supported.” In blind
mode, the note “A conflict exists. …” is a `note`, and the other reviewer's card says only “Another reviewer” and
“Verdict hidden”.

## Content

- Keep verdicts to a word or two – “Supported”, “Not supported”, “Needs more evidence” – and set `tone`.
- Reasons are the reviewers' own words; don't rewrite them.
- Write `difference` as what each person did differently, not who is right.
- Give `at` as people read times in your product: “Today 09:14”.

## Do

- Use `blind` with `viewer` for the reviewers, and the full view only for the resolver.
- Store `reason` with the resolution; it's the most useful part of the record.
- Prevent `tc-resolve` and set `resolution` yourself when saving can fail.

## Don't

- Don't show reviewers each other's verdicts before the conflict is resolved.
- Don't let the resolver be one of the two reviewers.
- Don't use it for more than two reviews – it shows the first two.

## Example

```html
<tc-review-conflict id="conflict" item="Northwind's revenue grew 18% in 2025." resolver="Dana Lee"></tc-review-conflict>

<script type="module">
  import "trenchcoat/review-conflict";
  import "trenchcoat/tokens.css";

  const conflict = document.querySelector("#conflict");
  conflict.reviews = [
    { id: "ana", reviewer: { name: "Ana Ruiz" }, verdict: "Supported", tone: "positive", reason: "Matches the annual report." },
    { id: "ben", reviewer: { name: "Ben Okafor" }, verdict: "Not supported", tone: "negative", reason: "The report was restated." },
  ];
  conflict.addEventListener("tc-resolve", (e) => console.log("resolved", e.detail.choice, e.detail.reason));
</script>
```

```tsx
import { useState } from "react";
import { ReviewConflict, type ReviewResolution, type ReviewVerdict } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ClaimConflict({ reviews, blindFor }: { reviews: ReviewVerdict[]; blindFor?: string }) {
  const [resolution, setResolution] = useState<ReviewResolution | null>(null);
  return (
    <ReviewConflict
      item="Northwind's revenue grew 18% in 2025."
      reviews={reviews}
      blind={!!blindFor}
      viewer={blindFor}
      resolver="Dana Lee"
      resolution={resolution}
      onResolve={setResolution}
    />
  );
}
```
