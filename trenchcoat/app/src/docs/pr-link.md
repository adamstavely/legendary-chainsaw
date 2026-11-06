---
pattern: none
status: new
related: pull-request, person-hovercard, isbn-details, check-status
---

## Overview

A pull request named in running text: its state's mark – open, draft, merged or closed, each in its colour – then
`owner/repo#number · title` as a link that flows with the sentence. Point at it after a short pause, or Tab to it, and
a small card opens below it with the state as a pill, the repository, number and how long ago, the full title, who wrote
it, the lines added and removed, and how many files changed.

It's for a pull request mentioned in passing – a status update, a chat reply, a changelog. For one pull request you'll
act on, with its review, checks and merge button, use [Pull Request](#/pull-request).

## When to use

- A pull request named in a sentence, a message or a summary, where people want its state without leaving the text.
- Short lists of pull requests, with `compact` for just the mark and number.

## When not to use

- Reviewing or merging a pull request – use [Pull Request](#/pull-request).
- A person's name – use [Person Hovercard](#/person-hovercard).

## Anatomy

1. **Link** `.ui-prk__link` – the state's mark `.ui-prk__mark`, then the repository, number and title
2. **Card** `.ui-prk__card` – the state pill `.ui-prk__pill`, repository, number and time, then the title
3. **Foot** `.ui-prk__foot` – the author, lines added and removed, and files changed

## Looks

One look. The link takes the size of the text around it; a long title is cut with an ellipsis at `--tc-prk-title-max`
(32ch) and shown whole in the card. The card uses the shared popover surface, `--tc-prk-card-w` wide. The mark and
pill are green for open, gray for a draft, violet for merged and red for closed.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the link; the card opens while it has focus |
| Enter | Follows the link |
| Escape | Closes the card; focus stays on the link |

## Screen readers

- The link's name is its text and its state: "halden/atlas#74 · Add five workflow stage illustrations, merged".
- The card is a tooltip the link is described by, so the state, time, author, lines changed and files are read after
  the name. Lines are read as words ("4,080 lines added, 42 removed"), not as + and −.
- The marks are hidden; the state is always in words.

## Content

- Give the title as the pull request has it; let the link cut it and the card show it.
- Set `updated-at` (`updatedAt`) to when it last changed state – opened, merged or closed – so "1 h ago" means something.
- Leave out what you don't know: the card drops the author, lines or files that aren't given.

## Do

- Use `compact` once the sentence has named the repository.
- Pass `now` when the page has a clock of its own, so every time on the page agrees.

## Don't

- Put a button or a link in the card; it's a description, and focus never goes into it.
- Use it as a pull request's only status in a list people work through – use [Pull Request](#/pull-request).

## Example

```html
<p>
  The illustrations landed in
  <tc-pr-link repo="halden/atlas" number="74" pr-title="Add five workflow stage illustrations" state="merged"
    href="https://code.example/halden/atlas/pull/74" author="noor" additions="4080" deletions="42" files="60"></tc-pr-link>.
</p>

<script type="module">
  import "trenchcoat/pr-link";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { PrLink } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Update() {
  return (
    <p>
      The illustrations landed in{" "}
      <PrLink repo="halden/atlas" number={74} prTitle="Add five workflow stage illustrations" state="merged" href="https://code.example/halden/atlas/pull/74" author="noor" additions={4080} deletions={42} files={60} />.
    </p>
  );
}
```
