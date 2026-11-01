---
pattern: list
status: new
related: conversation-annotation, share-panel, approval-chain, content-hidden
---

## Overview

Checking what's been redacted before a document's shared. Each span shows as a solid bar with its reason. A reviewer can reveal one at a time, approve or reject it, and share once nothing's left to review.

## When to use

- A person checking suggested redactions before a document leaves the team.

## When not to use

- Labelling a conversation – use `conversation-annotation`.
- Hiding content from people who didn't choose to see it – use `content-hidden`.
- As the redaction itself. See Don't.

## Anatomy

1. **Document** `.ui-rdq__doc` – the text, with `.ui-rdq__page` where the page changes
2. **Span** `.ui-rdq__span` – a `.ui-rdq__bar` and its `.ui-rdq__reason`, or `.ui-rdq__text` while revealed
3. **Detail** `.ui-rdq__detail` – `.ui-rdq__reveal`, `.ui-rdq__approve` and `.ui-rdq__reject` for the picked span
4. **Left** `.ui-rdq__left` – how many are left to review
5. **Share** `.ui-rdq__share` – waits until none are, beside `.ui-rdq__approve-all`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A bar to review has stripes, so it isn't told apart by colour alone.

## Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between spans |
| Home / End | Go to the first or last span |
| Tab | Moves on to the picked span's buttons, then Share |

The spans are one tab stop. After a decision, focus goes to the next span left to review.

## Screen readers

Each span is a button named "Redacted", its reason and its status, and the picked one uses `aria-pressed`. Hidden text isn't in the page's markup, so it isn't read out. `role="status"` announces each decision.

## Content

Write `reason` as what the text is: "Phone number". Only one span can be revealed at a time, and moving on hides it again. A redaction pointing at a block that isn't there blocks Share and says so.

## Do

- Produce the redacted copy on the server, from the approved list, on `tc-share`.
- Limit who can use this, because a reviewer can read what's hidden.
- Keep a record of who approved what.

## Don't

- **Don't share the original with bars drawn on it.** Bars don't remove text: anything sent to a browser can be read, so the server must produce the redacted copy.
- Don't send `blocks` to anyone who isn't allowed to see the unredacted text.

## Example

```html
<tc-redaction-review id="review"></tc-redaction-review>

<script type="module">
  import "trenchcoat/redaction-review";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.blocks = [{ id: "p1", text: "Reach them on 555-0142." }];
  review.redactions = [{ id: "r1", block: "p1", start: 14, end: 22, reason: "Phone number", status: "proposed" }];
  review.addEventListener("tc-share", (e) => console.log(e.detail.redactions));
</script>
```

```tsx
import { RedactionReview, type Redaction, type RedactionBlock } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const blocks: RedactionBlock[] = [{ id: "p1", text: "Reach them on 555-0142." }];
const redactions: Redaction[] = [{ id: "r1", block: "p1", start: 14, end: 22, reason: "Phone number", status: "proposed" }];

export function Review() {
  return <RedactionReview blocks={blocks} defaultRedactions={redactions} onTcShare={(e) => console.log(e.detail.redactions)} />;
}
```
