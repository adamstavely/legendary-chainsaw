---
pattern: menu
status: stable
related: comment-thread, review-center, inline-diff, message-actions
---

## Overview

A side panel of comments on a document or a design, where some comments are instructions an assistant can carry out.
A comment that starts with `/edit` gets a Run edit button; once it has run it says “Edit applied” and can be undone.
People filter the feed to questions or edits, sort it, resolve comments as they're dealt with, and add new ones from
the composer at the bottom. Times read “4min ago” and stay current while the panel is on screen.

## When to use

- Review on a page or a draft, where reviewers leave notes and some of them ask for changes.
- Letting people turn a comment into an edit the assistant makes, and take it back.
- A feed of a few to a few dozen comments that one panel can hold.

## When not to use

- A conversation of replies under one comment anchored to a spot – use `comment-thread`.
- Reviewing a set of proposed changes, accepting and rejecting them – use `review-center`.
- Showing exactly what an edit changes in the text – use `inline-diff`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the title and an optional close button
2. **Filters** `.ui-cp__tabs` – All, Questions and Edits, with the number of edits to run
3. **Sort** `.ui-cp__sort` – a menu with Newest first and Oldest first
4. **Comment** `.ui-cp__item` – avatar, name, time, Resolve and the text
5. **Run edit** `.ui-cp__actions` – Run edit, or “Edit applied” with Undo
6. **Composer** `.ui-cp__composer` – your avatar, the field and Send

## Looks

Standard puts the heading and the composer on a gray tray with the feed on a white card between them; the filters are
a segmented track with a raised thumb and Run edit looks like a secondary button. Clean is one white card with
hairline shadows: the filters are separate buttons, the composer is the card's last row under a hairline, Run edit is
the white button with a hairline shadow and a play glyph, and “Running…” shimmers. In both, Resolve shows on hover
(always on touch screens) and a resolved comment is struck through.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through close, the filters, Sort, each comment's Resolve and Run edit or Undo, and the composer |
| Enter / Space | Presses the focused button: picks a filter, resolves or reopens, runs or undoes an edit |
| ↓ / ↑ | On Sort: opens the menu on the first or last option; in the menu, moves between options, wrapping round |
| Home / End | In the sort menu: moves to the first or last option |
| Escape | In the sort menu: closes it and returns focus to Sort |
| Tab | In the sort menu: closes it and moves on |
| Enter | In the composer: sends the comment (not while an IME composition is open) |

Run edit keeps focus while it runs and hands it to Undo; Undo hands it back to Run edit. Without Undo, focus moves to
the comment's Resolve. After sending, focus returns to the field.

## Screen readers

The host is a region named by the heading. The filters are a group named “Filter comments” of toggle buttons with
`aria-pressed`; Edits reads its badge as “Edits, 2 to run”. Sort is a menu button (“Sort comments”, `aria-haspopup`,
`aria-expanded`) whose options are `menuitemradio` with `aria-checked`. Resolve is a toggle named “Resolve comment”
or “Reopen comment”. Times are `<time>` elements with the full date. A comment still being saved is `aria-busy`. The
feed itself isn't live; a status region says “Comment added.”, “Edit applied.” and “Edit undone.”, and failures are
alerts: “The edit couldn't be applied.”, “The edit couldn't be undone.”, “The comment couldn't be added.”

## Content

- Keep the heading to what's being commented on, or “Comments”.
- Start an instruction with `/edit` and say the change plainly: “/edit Shorten the intro paragraph to two sentences”.
- End questions with a question mark – that is how the Questions filter finds them.
- Use real names for authors; without an avatar the panel shows their initials.

## Do

- Pass `onRunEdit` and `onUndoEdit` together; without `onUndoEdit` an applied edit offers no Undo, because the panel
  can't take it back on its own.
- Reject the promise from `onRunEdit`, `onUndoEdit` or `onAdd` when the work fails – the panel says so and lets people
  try again.
- Add the comment to `comments` when `tc-comments-change` reports it; the panel matches it by id and doesn't double it.

## Don't

- Don't ship without `onRunEdit`: the panel then only simulates edits, and warns once in the console unless `demo` is
  set.
- Don't delete resolved comments from the feed – resolving keeps them, struck through, so the history stays.
- Don't use `/edit` comments for things the assistant can't do; Run edit promises an action.

## Example

```html
<tc-comments-panel id="comments" closable></tc-comments-panel>

<script type="module">
  import "trenchcoat/comments-panel";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#comments");
  panel.currentUser = { name: "Jordan Lee" };
  panel.comments = [
    { id: "c1", author: { name: "Maya Chen" }, createdAt: Date.now() - 3_600_000, text: "Should the headline mention the free trial?" },
    { id: "c2", author: { name: "Sam Ortiz" }, createdAt: Date.now() - 600_000, text: "/edit Shorten the intro to two sentences" },
  ];
  panel.onRunEdit = (comment) => fetch(`/api/edits/${comment.id}`, { method: "POST" }).then(() => undefined);
  panel.onUndoEdit = (comment) => fetch(`/api/edits/${comment.id}`, { method: "DELETE" }).then(() => undefined);
  panel.addEventListener("tc-resolved-change", (e) => console.log(e.detail.resolved));
</script>
```

```tsx
import { useState } from "react";
import { CommentsPanel, type PanelComment } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Review({ initial }: { initial: PanelComment[] }) {
  const [comments, setComments] = useState(initial);
  return (
    <CommentsPanel
      title="Comments"
      comments={comments}
      currentUser={{ name: "Jordan Lee" }}
      onCommentsChange={setComments}
      onRunEdit={async (comment) => {
        await fetch(`/api/edits/${comment.id}`, { method: "POST" });
      }}
      onUndoEdit={async (comment) => {
        await fetch(`/api/edits/${comment.id}`, { method: "DELETE" });
      }}
    />
  );
}
```
