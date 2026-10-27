---
pattern: none
status: new
related: lineage-graph, agent-ledger, approval-card, verification-queue
---

## Overview

How far a correction reaches. When a claim is corrected, the documents built on it don't change by themselves: this
lists every artifact and released package that cites the corrected claim and puts each one in front of a person – to
review it, mark it superseded, or dismiss it when it doesn't rely on the claim after all. Nothing is rewritten
automatically; the component records the decision and tells the app, which does the work. A meter shows how much of
the correction's reach has been handled.

## When to use

- After a reviewer corrects a claim that other documents may have quoted or built on.
- When work has been released to others and can only be superseded, not quietly edited.
- Tracking a correction to done – every citing item reviewed, superseded or dismissed.

## When not to use

- Undoing changes an agent made in your systems – use `agent-ledger`.
- Asking a person to approve one action before it happens – use `approval-card`.
- Tracing where a single output came from – use `lineage-graph`.
- Verifying claims in a session before an export – use `verification-queue`.

## Anatomy

1. **Header** `.tc-head` – the heading, how many items cite the claim and how many are released
2. **Correction** `.ui-cpr__fix` – the old wording struck through, the new one, why and who
3. **Progress** `.ui-cpr__progress` – how many are handled, as a meter split by state
4. **Group** `.ui-cpr__group` – released packages, then artifacts
5. **Item** `.ui-cpr__row` – what cites the claim, where, the citing passage, and its actions or state
6. **Note** `.ui-cpr__note` – what the component won't do

## Looks

Standard sets the card on a gray tray with the header above it, and the actions are raised secondary buttons. Clean is
one white card with the header as its first row: captions in small capitals, thinner icons and hairline-outlined actions. Both strike
the old wording through in red and mark released packages with a violet tag.

## Keyboard

Every control is a native button, in reading order.

| Key | What it does |
|---|---|
| Tab / Shift + Tab | Moves through each item's Review, Mark superseded and Dismiss buttons (or Undo, once handled) |
| Enter / Space | Presses the focused button; focus then lands on the same item's next control – Undo after an action, Review after Undo |

## Screen readers

The component is a region named by its heading. The correction reads “Was: …” then “Now: …”. The progress is a
progressbar named “Handled”, with a value text like “2 of 6 handled”. The groups are sections headed “Released
packages · 2” and “Artifacts · 4”. Review and Mark superseded are described by the item's title; Dismiss is named
“Dismiss: Risk memo §2 – it doesn't rely on the claim”, and Undo “Undo: superseded – Risk memo §2”. A polite status
says what happened: “Marked superseded: Q3 vendor risk report. 3 still pending.”, “Back to pending: Risk memo §2.”

## Content

- Write `claim` and `correction` as full sentences, so the difference reads at a glance.
- Use `detail` for where the item cites the claim and who owns it: “Sent to the board · cites it in §4”.
- Put the citing passage in `quote` – people decide faster when they see the sentence in context.
- Keep `note` to what the component won't do; the default is “Nothing is changed automatically – each item waits for a person.”

## Do

- Mark anything already released as `kind: "package"` with its `version` – it can only be superseded.
- Open the item for review in `tc-review` (`onReview`), and issue a superseding notice in `tc-supersede`.
- Keep `states` with the correction, so the next person sees what's already handled.

## Don't

- Don't rewrite citing documents in the background and use this as a log – the point is that a person decides.
- Don't list items that only mention the topic; list those that cite the corrected claim.
- Don't hide dismissed items – they show why nothing was done.

## Example

```html
<tc-correction-propagation
  id="reach"
  claim="Service credits are capped at 15% of monthly fees."
  correction="Service credits are capped at 10% of monthly fees."
  reason="Master agreement §7.2 says ten percent"
></tc-correction-propagation>

<script type="module">
  import "trenchcoat/correction-propagation";
  import "trenchcoat/tokens.css";

  const reach = document.querySelector("#reach");
  reach.candidates = [
    { id: "p1", kind: "package", title: "Q3 vendor risk report", version: "v2.1", detail: "Sent to the board" },
    { id: "a1", title: "Risk memo §2", detail: "Draft", quote: "Credits are capped at 15%…" },
  ];
  reach.addEventListener("tc-review", (e) => console.log("Review", e.detail.candidate.title));
</script>
```

```tsx
import { useState } from "react";
import { CorrectionPropagation, type CorrectionCandidate, type CorrectionState } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const candidates: CorrectionCandidate[] = [
  { id: "p1", kind: "package", title: "Q3 vendor risk report", version: "v2.1", detail: "Sent to the board" },
  { id: "a1", title: "Risk memo §2", detail: "Draft" },
];

export function Reach({ open }: { open: (id: string) => void }) {
  const [states, setStates] = useState<Record<string, CorrectionState>>({});
  return (
    <CorrectionPropagation
      claim="Service credits are capped at 15% of monthly fees."
      correction="Service credits are capped at 10% of monthly fees."
      candidates={candidates}
      states={states}
      onStatesChange={setStates}
      onReview={(id) => open(id)}
    />
  );
}
```
