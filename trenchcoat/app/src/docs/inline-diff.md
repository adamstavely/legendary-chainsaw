---
pattern: none
status: react-twin
related: comment-thread, email-draft, writing-assistant, code-block
---

## Overview

An AI's edits to a piece of prose, shown in place as one paragraph: removed words struck through on red, new words
underlined on green. People accept or reject each change from a small popover or with a key, or take them all at
once, and undo as they go; a toolbar counts what's left and steps to the previous or next change. When nothing is
pending the toolbar says “All changes reviewed” and the final text is reported. It diffs the original and the
suggestion word by word itself – including a suggestion that is still streaming in – or shows changes you computed.

## When to use

- Reviewing a rewrite of prose – shorter, friendlier, corrected – before it replaces the original.
- Letting people keep some of an AI's edits and not others.
- Edits of a paragraph or a few, where reading the changes in context matters.

## When not to use

- Reviewing an assistant's edits to cells or a document's structure, described in words – use `comment-thread`.
- An email the agent wrote from scratch, with nothing to compare – use `email-draft`.
- Changes to code – use `code-block`.
- Asking for a rewrite in the first place – use `writing-assistant`.

## Anatomy

1. **Label** `.ui-df__label` – where the suggestion came from, e.g. “Suggested by AI · Make it shorter”
2. **Toolbar** `.ui-df__bar` – the count, Undo, previous and next, Reject all and Accept all
3. **Change** `.ui-df__chg` – removed and added words together; focus or point at it to review it
4. **Added words** `.ui-df__ins` – what the suggestion puts in, underlined on green
5. **Popover** `.ui-df__pop` – Accept and Reject for the change under the pointer or in focus

## Looks

Standard puts the label on a gray tray above the card and the toolbar at the top of the card. Clean is one white
card with hairline shadows: the label opens the card, the toolbar is its last row, and the popover's buttons sit
without a divider. Both mark changes the same way and use the same keys.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves from change to pending change, then on to the toolbar |
| Y / Enter / Space | On a change: accepts it and moves focus to the next pending change (to Undo after the last) |
| N / Backspace / Delete | On a change: rejects it and moves focus on the same way |
| Escape | Hides the popover; focus stays on the change. A popover opened by pointing closes from anywhere |
| ‹ / › buttons | Highlight the previous or next pending change and show its popover, without taking focus (focus follows if it was on a change) |

## Screen readers

Each pending change is a button named by its words and described separately: “Suggestion 2 of 7: replace “brand
new” with “new”. Y, Enter or Space accepts, N rejects.” Decided changes leave the tab order, and the words they
dropped are hidden. A polite status region confirms each decision with what's left – “Accepted: Add “keeps”. 5
suggestions left.”, “Rejected: 3 suggestions. All changes reviewed.”, “Undone. 4 suggestions left.” The toolbar's
icon buttons are named “Undo last decision”, “Previous suggestion” and “Next suggestion”; the popover is a group named
“Review suggestion” whose buttons are for the pointer – the keys do the same from the change.

## Content

- Use `label` to say who suggested the change and why: “Suggested by AI · Make it shorter”.
- Pass the whole paragraph as `original`, not a fragment – people judge edits by the sentence around them.
- Keep suggestions to edits; when the meaning changes completely, show the new text on its own.

## Do

- Use `tc-done` (`onDone`) to save the final text once nothing is pending, and `tc-text-change` for a live preview.
- Set `suggested` as the model streams – the diff stays cheap until the text settles, then runs once in full.
- Call `acceptAll()`, `rejectAll()`, `undo()` and `reset()` on the element from your own controls when you need them.

## Don't

- Don't diff long documents in one element – split them into paragraphs, each with its own diff.
- Don't apply the suggestion before people have reviewed it; wait for `tc-done`.
- Don't keep old `decisions` when the text changes – new text starts the review over.

## Example

```html
<tc-inline-diff
  id="diff"
  label="Suggested by AI · Make it shorter"
  original="Our team is very excited to announce a brand new dashboard."
  suggested="We're excited to launch a new dashboard."
></tc-inline-diff>

<script type="module">
  import "trenchcoat/inline-diff";
  import "trenchcoat/tokens.css";

  const diff = document.querySelector("#diff");
  diff.addEventListener("tc-done", (e) => console.log("final:", e.detail.text));
</script>
```

```tsx
import { useRef } from "react";
import { InlineDiff, type InlineDiffHandle } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Rewrite({ original, suggested, onSave }: { original: string; suggested: string; onSave: (text: string) => void }) {
  const diff = useRef<InlineDiffHandle>(null);
  return (
    <>
      <InlineDiff ref={diff} label="Suggested by AI · Make it shorter" original={original} suggested={suggested} onDone={onSave} />
      <button type="button" onClick={() => diff.current?.reset()}>Start over</button>
    </>
  );
}
```
