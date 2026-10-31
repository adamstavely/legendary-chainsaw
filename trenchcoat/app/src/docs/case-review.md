---
pattern: form
status: new
related: file-details, fact-sheet, entity-timeline, agent-face
---

## Overview

One case, ready for a person to decide: the evidence, what happened in order, the assistant's read, and the decision. The
assistant only suggests. Its suggestion is labelled, nothing is chosen for you, and deciding needs a written reason.

## When to use

- Fraud, risk and compliance cases that a person must decide and answer for.
- Any review where an AI's view should inform a decision without making it.

## When not to use

- Many small decisions in a row – use `review-center`.
- An agent asking for permission – use `approval-card`.
- Evidence with no decision to make – use `fact-sheet` or `entity-timeline`.

## Anatomy

1. **Head** `.ui-csr__head` – `.ui-csr__name`, `.ui-csr__subject` and `.ui-csr__severity`, in words
2. **Evidence** `.ui-csr__main` – the facts and the timeline
3. **Read** `.ui-csr__read` – the assistant's summary and `.ui-csr__suggests`, with `.ui-csr__advisory` saying the decision is yours
4. **Options** `.ui-csr__options` – the outcomes, with `.ui-csr__tag` on the suggested one
5. **Reason** `.ui-csr__note` – required
6. **Record** `.ui-csr__record` – records the decision, or says what's missing

## Looks

The composed components follow Standard or Clean. On a narrow page, the read and decision come before the evidence.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the evidence, the outcomes, the reason, then Record decision |
| ↑ ↓ | Move through the outcomes |

If something's missing, focus goes to it. After recording, focus goes to Change.

## Screen readers

The outcomes are a `radiogroup` named by the panel's heading, the reason is `aria-required`, and a missing one is tied to
its message. Severity and the suggestion are words. `role="status"` announces the recorded decision.

## Content

Write `summary` as what the assistant found, not what to do, and give `confidence` in words. Keep `points` to what a
reviewer can check in the evidence.

## Do

- Store `followedSuggestion` from `tc-decision-change`, so you can see how often people agree with the assistant.
- Show the evidence behind each point, so the suggestion can be checked.
- Record decisions on the server, with who made them.

## Don't

- Don't preselect the suggested outcome, or act on it without a person.

## Example

```html
<tc-case-review id="case" heading="Case 4812" severity="high"></tc-case-review>

<script type="module">
  import "trenchcoat/case-review";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#case");
  review.read = { summary: "Two payments of the same amount.", suggestion: "escalate" };
  review.addEventListener("tc-decision-change", (e) => console.log(e.detail.decision));
</script>
```

```tsx
import { CaseReview, type CaseRead } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const read: CaseRead = { summary: "Two payments of the same amount.", suggestion: "escalate" };

export function Case() {
  return <CaseReview title="Case 4812" severity="high" read={read} onDecisionChange={(d) => console.log(d)} />;
}
```
