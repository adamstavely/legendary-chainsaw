---
pattern: none
status: new
related: change-list, check-status, branch-switcher, diff-viewer
---

## Overview

One pull request at a glance, sized for a session's side panel. It shows the title and number, which branch goes into
which, who opened it and when, lines changed, the review, the checks as a small bar with words, and whether it can merge.
The button at the foot follows the state: Mark ready on a draft, Merge on an open one, nothing once it's merged or
closed. When the branch is behind its base it offers Update branch; with conflicts, Resolve. With no pull request it says
so and offers Create pull request.

Nothing here talks to a server. Every button is an event, and the page changes the data when the work is done.

## When to use

- The pull request for the branch a session or workspace is on.
- A detail panel opened from a row of `change-list`.

## When not to use

- Several pull requests as rows – use `change-list`.
- The checks in detail, one row each – use `check-status`.
- The changed lines themselves – use `diff-viewer`.

## Anatomy

1. **Summary** `.ui-prq__summary` – the state, who and when, the title, the branches and the lines changed
2. **State** `.ui-prq__state` – a mark and a word: Draft, Open, Merged or Closed
3. **Title** `.ui-prq__title` – a link when `url` is given
4. **Branches** `.ui-prq__branches` – `head → base`
5. **Review** `.ui-prq__review` – the review as a whole, with who
6. **Checks** `.ui-prq__checks` – a bar in `.ui-prq__bar` and the words; pressing it fires `tc-checks`
7. **Can it merge** `.ui-prq__mergeable` – a mark, the words, and Update branch or Resolve when they apply
8. **Foot** `.ui-prq__foot` – the auto-merge switch, the merge method and `.ui-prq__primary`
9. **Reason** `.ui-prq__reason` – why Merge can't be pressed
10. **Empty** `.ui-prq__empty` – no pull request, and Create pull request

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card, for a place that already has one. On a very narrow card the merge method and Merge stack.

## Keyboard

The controls follow normal tab order.

| Key | What it does |
|---|---|
| Tab | Moves through the title, the checks, Update branch or Resolve, the switch, the method and the main button |
| Enter / Space | Presses the focused button, or flips the switch |
| ↑ / ↓ | Change the merge method |

## Screen readers

The state, review and whether it can merge are words, not just colour. The branches read as "head into base", and the
lines changed as "412 lines added, 57 lines removed". A disabled Merge is described by the reason under it. After Merge,
Mark ready, Update branch or Resolve, `role="status"` says what's under way, unless the event was prevented.

## Content

- Use the pull request's own title; the number is added after it.
- Pass `reviewers` with each person's state, so "Approved by m.lindqvist" names someone.
- Leave `checks` unset when the repository has none, rather than passing zeros.
- `updatedAt` takes epoch ms or an ISO string; pass `now` for times that don't move, such as in a screenshot.

## Do

- Set `busy` while a merge or an update is running, and clear it when the new data arrives.
- Change `state`, `mergeable` and `checks` after the server answers; the element doesn't guess.
- Prevent `tc-open` to open the pull request inside your app instead of following the link.

## Don't

- Don't rely on the disabled Merge for safety: the server still decides what may merge.
- Don't show it for a branch with no remote: there's nothing to merge into yet.

## Example

```html
<tc-pull-request id="pr" number="128" pr-title="Add the booking calendar" state="open" head="feature/booking-calendar" base="main" mergeable="clean"></tc-pull-request>

<script type="module">
  import "@adamstavely/trenchcoat/pull-request";
  import "@adamstavely/trenchcoat/tokens.css";

  const pr = document.querySelector("#pr");
  pr.checks = { passing: 6, failing: 0, pending: 1, skipped: 0 };
  pr.addEventListener("tc-merge", (e) => console.log("Merge", e.detail.method));
</script>
```

```tsx
import { PullRequest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function BranchPullRequest({ onMerge }: { onMerge: (method: string) => void }) {
  return (
    <PullRequest
      number={128}
      prTitle="Add the booking calendar"
      state="open"
      head="feature/booking-calendar"
      base="main"
      mergeable="clean"
      checks={{ passing: 6, failing: 0, pending: 1, skipped: 0 }}
      onTcMerge={(e) => onMerge(e.detail.method)}
    />
  );
}
```
