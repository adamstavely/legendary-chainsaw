---
pattern: list
status: new
related: approval-card, access-review, case-review, status-tracker
---

## Overview

Several people signing off in order. It says who's next and who's overdue, in words. The person it's waiting on can Approve, Decline with a note, or Delegate. After a decline, the rest show as not reached.

## When to use

- A release, payment or document that needs sign-off from several people in turn.

## When not to use

- An agent asking one person for permission – use `approval-card`.
- One person deciding one case – use `case-review`.
- Steps with no people deciding – use `status-tracker`.

## Anatomy

1. **List** `.ui-apc__list` – the people, in order
2. **Step** `.ui-apc__step` – one person, with `.ui-apc__mark`, `.ui-apc__name` and `.ui-apc__word`
3. **Overdue** `.ui-apc__overdue` – shown in words when the due date's passed
4. **Actions** `.ui-apc__actions` – Approve, Decline and Delegate, for the person it's waiting on
5. **Reason** `.ui-apc__note` – required to decline
6. **Summary** `.ui-apc__summary` – who's next, or how it ended

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-apc-mark`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the current step's actions and fields |
| Enter / Space | Presses a button |

After a decision, focus goes to that person's name.

## Screen readers

The steps are an ordered list named by the heading, and the current one has `aria-current="step"`. Status and overdue are words. A required reason uses `aria-required`, and a missing one is tied to its message. `role="status"` announces each decision and who's next.

## Content

Give `role`, so people know why someone's in the chain. Set `actor` to the person looking. Overdue needs `now`, because the element doesn't read the clock.

## Do

- Check on the server that the person deciding may decide.
- Record who decided, and when, on `tc-steps-change`.
- Update `now` as time passes, so overdue stays true.

## Don't

- Don't treat `actor` as security. It only chooses what's shown.

## Example

```html
<tc-approval-chain id="chain" actor="Noor Haddad"></tc-approval-chain>

<script type="module">
  import "trenchcoat/approval-chain";
  import "trenchcoat/tokens.css";

  const chain = document.querySelector("#chain");
  chain.steps = [{ id: "a", name: "Noor Haddad", status: "current" }];
  chain.addEventListener("tc-steps-change", (e) => console.log(e.detail.change));
</script>
```

```tsx
import { ApprovalChain, type ApprovalStep } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const steps: ApprovalStep[] = [{ id: "a", name: "Noor Haddad", status: "current" }];

export function Release() {
  return <ApprovalChain defaultSteps={steps} actor="Noor Haddad" onStepsChange={(next) => console.log(next)} />;
}
```
