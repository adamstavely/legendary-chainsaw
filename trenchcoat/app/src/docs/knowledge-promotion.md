---
pattern: none
status: new
related: verification-queue, review-conflict, memory-panel, approval-card
---

## Overview

Promote a verified fact from one piece of work into the knowledge a whole team relies on, against a checklist. The
fact leads, quoted, with who proposed it, where it came from and its confidence. Below it, the conditions: required
ones – a reviewer's sign-off, no open dispute, confidence at or above the threshold – and recommended ones, such as a
second reviewer, each met or not, with who met it and when. Promote stays unavailable until every required condition
is met; a recommended one that isn't met shows a warning but doesn't block. When the fact is disputed, every version
stays visible side by side, so a disagreement is seen rather than settled silently.

## When to use

- Moving a finding from a session or a case into shared team knowledge that other work, or an AI, will cite.
- Anywhere a fact needs a sign-off trail before it becomes an accepted reference.
- Showing a disputed fact during review, with both versions in view.

## When not to use

- Approving a single action an agent wants to take – use `approval-card`.
- Two reviewers who gave opposing verdicts on an item – use `review-conflict`.
- Browsing or editing what an assistant remembers – use `memory-panel`.
- Checking individual claims against their sources – use `verification-queue`.

## Anatomy

1. **Header** `.tc-head` – the icon, the title, what the knowledge covers, and the state's pill
2. **Fact** `.ui-kpro__fact` – the fact quoted, who proposed it, when and where, and its confidence
3. **Versions** `.ui-kpro__versions` – when disputed, this version and each disputed one side by side
4. **Checklist** `.ui-kpro__checks` – each condition met or not, required or recommended, with who and when
5. **Warning** `.ui-kpro__warning` – the recommended conditions not met, once the required ones are
6. **Actions** `.ui-kpro__foot` – what Promote waits on, Dispute and Promote

## Looks

Standard sets the header on the gray tray, the fact and checklist on a white card, and the status and actions on
the tray below. Clean is one white card with a shadow: the actions become its last row under a hairline, the
version labels are small captions, and the check marks are thinner.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Dispute, Promote and, in the dispute form, its two fields and buttons |
| Enter / Space | Presses the focused button; Promote does nothing while it is unavailable |
| Escape | In the dispute form: cancels it and returns focus to Dispute |
| Ctrl / ⌘ + Enter | In the dispute form: raises the dispute |

## Screen readers

The card is a `region`, named by its heading. The checklist is a list named “Before it's promoted”; each condition
says whether it is met (“Reviewer sign-off: Not met”, “Second reviewer: Not met – recommended”). Disputed versions
are a list named by the line above them (“Disputed – both versions stay visible until it's resolved”). Promote stays
focusable while unavailable, with `aria-disabled="true"`, and is described by the status (“Waiting on: reviewer
sign-off”) and, when ready, by the warning. Dispute reports `aria-expanded`; the form is named “Dispute this fact”,
and a missing reason marks the field invalid with “Say what's wrong with it, so the reviewer can check.”. A polite
live region says “Promoted to team knowledge.” and “Dispute raised.”; an `error` is an alert.

## Content

- Write the fact as it should read in the team's knowledge – one or two plain sentences, no hedging.
- Label conditions as states that are true when met: “No open dispute”, not “Check disputes”.
- Use `detail` for what an unmet condition waits on (“Requested from Priya Shah”) or what was checked.
- Give `at` as the app formats dates elsewhere; the card shows it as given.
- Keep `error` short and say what happened: “The knowledge base didn't respond.”

## Do

- Mark only what must block as required, and leave good practice as recommended.
- Add a dispute to `versions` and open the “No open dispute” condition again when one is raised.
- Set `threshold` from your own policy, and `threshold-optional` where confidence is advice, not a gate.

## Don't

- Don't remove a disputed version from view until a person has resolved it.
- Don't promote automatically when the conditions are met – a person presses Promote.
- Don't hide Dispute after promotion; a promoted fact can still be wrong.

## Example

```html
<tc-knowledge-promotion id="promote" scope="Acme lease review" threshold="0.8"></tc-knowledge-promotion>

<script type="module">
  import "trenchcoat/knowledge-promotion";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#promote");
  card.fact = { text: "The notice period is 90 days.", by: "Ana Ruiz", at: "12 Oct", confidence: 0.88 };
  card.conditions = [
    { id: "signoff", label: "Reviewer sign-off", met: true, by: "Priya Shah", at: "13 Oct" },
    { id: "dispute", label: "No open dispute", met: true },
    { id: "second", label: "Second reviewer", required: false, met: false },
  ];
  card.addEventListener("tc-promote", async (e) => {
    e.preventDefault();
    card.status = "promoting";
    await saveFact(e.detail.fact); // your own API
    card.status = "promoted";
  });
</script>
```

```tsx
import { useState } from "react";
import { KnowledgePromotion, type KnowledgeStatus } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PromoteFact() {
  const [status, setStatus] = useState<KnowledgeStatus>("candidate");
  return (
    <KnowledgePromotion
      scope="Acme lease review"
      fact={{ text: "The notice period is 90 days.", by: "Ana Ruiz", at: "12 Oct", confidence: 0.88 }}
      conditions={[
        { id: "signoff", label: "Reviewer sign-off", met: true, by: "Priya Shah", at: "13 Oct" },
        { id: "dispute", label: "No open dispute", met: true },
        { id: "second", label: "Second reviewer", required: false, met: false },
      ]}
      status={status}
      onPromote={() => setStatus("promoted")}
      onDispute={(reason, version) => console.log("disputed", reason, version)}
    />
  );
}
```
