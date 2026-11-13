---
pattern: disclosure
status: new
related: quality-trend, change-impact, version-history, eval-scorecard
---

## Overview

One drop in a judge score on live chats, and the way out of it. The card says what fell – the criterion, from what to
what, since when and over how many chats – with a small chart round the drop. Then the likely cause: the change that
went live nearest the drop, how sure that link is in words, and a few failing chats as short quotes that show it. The
topics the failures cluster in sit beside it. Three actions close it: roll back to the version before (after saying
what that reverts), investigate, or dismiss the drop as expected.

## When to use

- An alert on a production agent's quality, opened from a notification or a quality page.
- The moment someone has to decide whether to roll a change back.
- A post-incident record of a drop and what was done about it.

## When not to use

- Watching scores over time, with every change on the axis – use `quality-trend`.
- Comparing two versions on every criterion – use `change-impact`.
- Choosing among an agent's past versions in general – use `version-history`.
- A test set failing before release – use `eval-scorecard`.

## Anatomy

1. **What fell** `.ui-qdr__headline` – the criterion, from → to; the date and chats under it
2. **Chart** `.ui-qdr__chart` – the daily mean round the drop, where it fell and where the change went live
3. **Cause** `.ui-qdr__cause` – the change, how sure in words, why, and the failing chats as quotes
4. **Where it fails** `.ui-qdr__segments` – the topics with their share of the failing chats
5. **Actions** `.ui-qdr__actions` – Roll back, Investigate, Dismiss as expected
6. **Confirmation** `.ui-qdr__confirm` – what rolling back reverts, before it happens

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card. The line and the share bars use
`--tc-quality-drop-line` (the danger colour); the chart's height is `--tc-quality-drop-chart-h`. Rolled back or
dismissed, the card folds to the headline and one line, with the state as a pill in the header.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the failing chats' quotes, then the actions |
| Enter / Space | Opens a quote's chat (tc-chat-open), or presses an action |
| Escape | In the rollback confirmation, cancels it and returns to Roll back |

Roll back moves focus to the confirmation's Roll back button; Cancel returns it to Roll back. After a rollback or a
dismissal, focus moves to Undo.

## Screen readers

The cause and the topics are regions named by their captions ("Likely cause", "Where it fails"). The confidence is a
word ("High confidence"), not only a colour. Each quote is a button read with its note and "open chat". The topics read
as "Travel & expenses 46% of failing chats". The confirmation is a group named by its question ("Roll back to v13?").
Rolling back, dismissing and reopening are said in a status region.

## Content

- Quote the part of the answer that shows the problem, a sentence at most, and say in the note what's wrong.
- Write `reason` as the evidence, not a guess: "Went live the day scores fell; failing answers skip the citation".
- List in `reverts` what changes and what doesn't – people roll back more calmly when they know what stays.

## Do

- Say how many chats the drop rests on – a fall over 40 chats isn't one over 4,000.
- Set the confidence from the evidence: high when the timing and the failures both point at the change.

## Don't

- Don't roll back without the confirmation – keep `reverts` filled in.
- Don't show a cause when nothing lines up; leave `cause` null and the card says so.
- Don't put several drops in one card – one drop, one decision.

## Example

```html
<tc-quality-drop id="drop" criterion="Correctness" rollback-to="v13"></tc-quality-drop>

<script type="module">
  import "@adamstavely/trenchcoat/quality-drop";
  import "@adamstavely/trenchcoat/tokens.css";

  const at = Date.UTC(2026, 10, 3);
  const drop = document.querySelector("#drop");
  Object.assign(drop, {
    from: 4.4,
    to: 3.8,
    at,
    chats: 1284,
    cause: { change: { label: "Prompt v13 → v14", at }, confidence: "high", reason: "Went live the day scores fell." },
    evidence: [{ id: "chat-4821", quote: "You can claim up to £60 a night for hotels.", note: "The limit is £120 in London" }],
    segments: [{ id: "travel", label: "Travel & expenses", share: 0.46 }],
    reverts: ["The instructions go back to v13"],
  });
  drop.addEventListener("tc-rollback", (e) => console.log("Roll back to", e.detail.version));
</script>
```

```tsx
import { QualityDrop, type QualityDropCause } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function DropAlert({ cause, rollback }: { cause: QualityDropCause; rollback: (version: string) => void }) {
  return (
    <QualityDrop
      criterion="Correctness"
      from={4.4}
      to={3.8}
      at={cause.change.at}
      chats={1284}
      cause={cause}
      rollbackTo="v13"
      reverts={["The instructions go back to v13"]}
      onRollback={(version) => rollback(version)}
    />
  );
}
```
