---
pattern: list
status: new
related: share-panel, audit-trail, access-request, oversight-home
---

## Overview

A periodic check of who can see what. Each row is one person or group's access to one thing, with anyone no longer
authorized or who couldn't be checked first. The reviewer keeps or removes each one, and keeping someone flagged needs a
written reason.

## When to use

- A quarterly or annual access review, or one a regulator or policy requires.
- Reviewing who can reach one sensitive dataset.

## When not to use

- Changing who can see one file now – use `share-panel`.
- Asking for access – use `access-request`.
- Looking at what already happened – use `audit-trail`.

## Anatomy

1. **Filters** `.ui-acr__filters` – All, Flagged and Not decided, with how many
2. **Keep all** `.ui-acr__keep-all` – settles the routine rows at once
3. **Row** `.ui-acr__row` – who, what they can reach, when they last used it, and `.ui-acr__status`
4. **Choices** `.ui-acr__choices` – Keep and Remove
5. **Reason** `.ui-acr__note` – required when keeping someone flagged
6. **Submit** `.ui-acr__submit` – waits until everything's decided

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-acr-avatar`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the filters, each row's choices and reason, then Submit |
| Enter / Space | Presses a filter or choice |

## Screen readers

The rows are a list named by the heading. Each pair of choices is a group named for the person and what they can reach,
and uses `aria-pressed`. A required reason is marked with `aria-required` and `aria-invalid`. Status is in words.
Keep all authorized never settles a flagged row, and `role="status"` announces when the review is submitted.

## Content

Give `reason` in terms the reviewer can act on: "The Restricted data agreement ended in August". Give `lastUsed`, because
access nobody uses is usually safe to remove. Reasons are visible to the reviewer, so leave out anything they shouldn't
learn.

## Do

- Save decisions as they change with `tc-decisions-change`, so a long review isn't lost.
- Apply removals and keep the record on the server when `tc-review-submit` arrives.

## Don't

- Don't treat this as enforcement. Access only changes when your server acts on the decisions.

## Example

```html
<tc-access-review id="review" heading="Q4 access review"></tc-access-review>

<script type="module">
  import "trenchcoat/access-review";
  import "trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.items = [{ id: "a", name: "Noor Haddad", resource: "Trial 12", level: "Can edit", status: "authorized" }];
  review.addEventListener("tc-review-submit", (e) => console.log(e.detail.keep, e.detail.remove));
</script>
```

```tsx
import { AccessReview, type AccessReviewItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: AccessReviewItem[] = [{ id: "a", name: "Noor Haddad", resource: "Trial 12", level: "Can edit", status: "authorized" }];

export function Review() {
  return <AccessReview title="Q4 access review" items={items} onTcReviewSubmit={(e) => console.log(e.detail.remove)} />;
}
```
