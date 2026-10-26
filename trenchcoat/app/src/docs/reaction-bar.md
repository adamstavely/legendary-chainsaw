---
pattern: button
status: stable
related: message-actions, comment-thread, project-card
---

## Overview

Like, comment, repost and share for a post, in one pill. Each action is a toggle: tapping it marks it as taken,
pops its icon and moves its count by one, and the new number rolls in digit by digit. Counts are shortened the way
social apps do it (“1.3K”, “12K”, “1.2M”), so the bar stays compact on busy posts. The bar shows what you pass in
`reactions` and keeps a tap locally until your data for that action changes.

## When to use

- Social and community feeds: posts, updates, shared work that people react to.
- Showing how much engagement something has and letting people add to it in the same place.
- Any subset of the four actions – `actions` hides the ones a surface doesn't support.

## When not to use

- Actions on an AI answer (copy, regenerate, thumbs up and down) – use `message-actions`.
- Replies and discussion on a piece of work – use `comment-thread`.
- A single on/off choice in a form or toolbar – use `segmented-control` or a `button`.

## Anatomy

1. **Action** `.ui-rb__btn[data-kind="share"]` – one toggle button: like, comment, repost or share
2. **Icon** `.ui-rb__btn[data-kind="comment"] .ui-rb__icon` – fills and pops when the action is taken
3. **Count** `.ui-rb__btn[data-kind="repost"] .ui-rb__count` – the shortened count, gliding to its new width
4. **Digit** `.ui-rb__btn[data-kind="like"] .ui-rb__digit` – each character of the count, rolling in on change

## Looks

Standard is a raised pill on the overlay surface with 22 px icons; a taken action takes its own colour – pink for
like, blue for comment, violet for repost – and its icon fills and gets a heavier line. Clean is a row of quiet
chips with a hairline edge and 16 px icons; a taken action gets a light blue tint and a blue hairline. On touch
screens Clean's chips grow to 36 px high.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the next action |
| Enter / Space | Toggles the focused action |

## Screen readers

The bar is a group named “Reactions” (keep your own `aria-label` or `aria-labelledby` if you set one). Each action
is a button with `aria-pressed` for whether it's taken, and its name carries the count as shown: “Like, 1.3K likes”,
“Comment, 1 comment”, or “Share” when the count is zero. The rolling digits are hidden from assistive technology;
counts of 1,000 or more also get a tooltip with the full number (“1,299 likes”).

## Content

- Pass exact counts – the bar shortens them; don't pre-format them as strings.
- Leave a count at 0 rather than inventing one: a zero count shows the icon alone.
- Keep the actions in the default order (like, comment, repost, share) so people find them where they expect.

## Do

- Mark the person's own reactions with `active: true` so the bar opens in the right state.
- Save each change from `tc-reaction-change` and pass the new counts back – the property then wins over the local tap.
- Show only the actions the surface supports, with `actions`.

## Don't

- Don't use it for more than these four actions – it has no slot for custom ones.
- Don't show it where reactions can't be saved – the tap sticks locally and the count will be wrong on reload.
- Don't override the group's name with something vague – “Reactions” or “Reactions to Jonas's post” both work.

## Example

```html
<tc-reaction-bar id="reactions"></tc-reaction-bar>

<script type="module">
  import "trenchcoat/reaction-bar";
  import "trenchcoat/tokens.css";

  const bar = document.querySelector("#reactions");
  bar.reactions = { like: { count: 1299 }, comment: { count: 86 }, share: { count: 41, active: true } };
  bar.actions = ["like", "comment", "share"];
  bar.addEventListener("tc-reaction-change", (e) => console.log(e.detail.key, e.detail.state));
</script>
```

```tsx
import { useState } from "react";
import { ReactionBar, type ReactionKey, type ReactionState } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PostReactions() {
  const [reactions, setReactions] = useState<Partial<Record<ReactionKey, ReactionState>>>({
    like: { count: 1299 },
    comment: { count: 86 },
  });
  return (
    <ReactionBar
      actions={["like", "comment"]}
      reactions={reactions}
      onReact={(key, state) => setReactions((r) => ({ ...r, [key]: state }))}
    />
  );
}
```
