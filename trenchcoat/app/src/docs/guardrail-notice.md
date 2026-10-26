---
pattern: disclosure
status: new
related: approval-card, permission-request, inline-diff
---

## Overview

Tells people, where it happened, that a policy blocked, redacted or rewrote something – a message they sent, a reply
the model wrote, a draft on its way out. It names the policy, says why in a sentence, and on request shows what
changed: the original next to what went out instead, with personal data already masked by the app. Request review
lets people ask for a person to look at the decision again, so a guardrail that got it wrong has a way back.

## When to use

- A model's reply or a person's message was stopped or changed by a content, privacy or security policy.
- Personal data was taken out of something before it was shown, stored or sent.
- A whole view is affected – sharing turned off for a draft, a workspace under a policy – as a `layout="banner"`.

## When not to use

- Asking before an agent does something consequential – use `approval-card`.
- An agent asking for a right it doesn't have yet – use `permission-request`.
- Showing an edit a person can accept or reject – use `inline-diff`.

## Anatomy

1. **Icon** `.ui-grn__icon` – blocked, redacted or rewritten, in the action's tone
2. **Heading and policy** `.ui-grn__titles` – “Redacted by policy” and the policy's name, a link when it has a page
3. **Reason** `.ui-grn__reason` – why the policy acted, in a sentence
4. **What changed** `.ui-grn__changes` – the original and what went out, side by side, with removed, added and masked runs marked
5. **Actions** `.ui-grn__actions` – Show what changed, and Request review (then “Review requested”)

## Looks

Standard sets the notice on a white card in the gray tray with the buttons on the tray below it; as a banner it is
one band in the action's tone. Clean is one white card with a thin rule in the action's tone down its left edge,
lighter type and thinner icons; inline, its buttons sit in its last row.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between the policy link, Dismiss, Show what changed and Request review – each a native link or button |
| Enter / Space | On Show what changed: opens or closes the original and what went out |
| Enter / Space | On Request review: asks for a review; focus stays on “Review requested” |
| Enter / Space | On Dismiss: fires `tc-dismiss` |

## Screen readers

The notice is a `group` (inline) or a `region` (banner) named by its heading, “Redacted by policy”. The policy reads
as “Policy: Personal data”. Show what changed is a disclosure button with `aria-expanded` and `aria-controls`. In the
before and after, removed text is a `del` read with “Removed: ”, added text an `ins` with “Added: ”, and masked text
is read with “Masked: ” before what the app gave (“Masked: •••• 4821”). After Request review, a status region says
“Review requested. The Personal data decision will be looked at again.” The close button is named “Dismiss”.

## Content

- Name the policy the way people in your product know it: “Personal data”, “External sharing” – not a rule ID.
- Write `reason` about the content, not the person: “The reply quoted a card number”, not “You shared a card number”.
- Mask personal data before it reaches the element; it shows exactly what it's given. Mark masked runs with
  `mark: "masked"` so they read as withheld, not as text.
- Leave `revised` out when nothing went out; the notice says “Nothing”.
- Keep the headings as they are unless your product has its own word: “Blocked by policy” says who acted.

## Do

- Put an inline notice where the content would have been, so the thread still reads in order.
- Answer `tc-review-request` by opening a review; set `reviewable` to false where no one can review.
- Link the policy with `policy-href` when it has a page people can read.

## Don't

- Don't show unmasked personal data in the original to explain the redaction – that undoes it.
- Don't stack several banners; one banner for the view, inline notices for each piece of content.
- Don't use the notice for errors that aren't policy decisions – a timeout isn't a guardrail.

## Example

```html
<tc-guardrail-notice id="notice" action="redacted" policy="Personal data" reason="The reply quoted a customer's card number."></tc-guardrail-notice>

<script type="module">
  import "trenchcoat/guardrail-notice";
  import "trenchcoat/tokens.css";

  const notice = document.querySelector("#notice");
  notice.original = [{ text: "Refunded to the card ending " }, { text: "•••• 4821", mark: "masked" }];
  notice.revised = [{ text: "Refunded to the " }, { text: "card on file", mark: "added" }];
  notice.addEventListener("tc-review-request", (e) => openReview(e.detail.policy));
</script>
```

```tsx
import { GuardrailNotice, type GuardrailSegment } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function RedactedReply({ original, revised, review }: { original: GuardrailSegment[]; revised: GuardrailSegment[]; review: (policy: string) => void }) {
  return (
    <GuardrailNotice
      action="redacted"
      policy="Personal data"
      reason="The reply quoted a customer's card number."
      original={original}
      revised={revised}
      onRequestReview={(detail) => review(detail.policy)}
    />
  );
}
```
