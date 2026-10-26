---
pattern: none
status: stable
related: empty-calendar, tab-overload, team-invite
---

## Overview

A small chat scene about being left on read: three outgoing messages – “Hi team!”, a question about recruiting
and a final “Hello?” – arrive one after another under “No new messages”, and the last is marked “Read”. A red shine
sweeps through “Hello?” three times and rests. Hover it and the status texts fade, the messages lift, and a 👎
reply pops in. It gives empty inboxes, unanswered-message states and outreach pages a wry picture instead of a bare
icon.

## When to use

- An empty or quiet inbox, or a list of messages nobody has replied to yet.
- Onboarding or landing sections about follow-ups, outreach or response rates.
- Error or empty states in messaging features, where a light touch fits the tone.

## When not to use

- Showing a real conversation – use `comment-thread` for messages people can read and answer.
- A list of past conversations – use `chat-history`.
- An empty calendar or schedule – use `empty-calendar`.
- Product tone that's serious (support for a failed payment, an outage) – the joke reads as flippant; use plain
  text.

## Anatomy

1. **Status** `.ui-gc-status` – “No new messages” above the bubbles
2. **Messages** `.ui-gc-bubbles` – the three outgoing bubbles and the “Read” mark
3. **Last message** `.ui-gc-bubble-last` – “Hello?”, with the red shine and the glow under it
4. **Reply** `.ui-gc-reply` – the 👎 bubble that pops in on hover

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the bubbles turn charcoal and the glow
under the last one is a little fainter. It works with a `.dark` class, `data-theme`, `data-tc-theme` or the system
setting.

## Keyboard

Nothing to operate – the scene takes no focus. The hover reply is decoration only.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped, and the scene's text (“Hi team!”, “Read”)
is never read out. With `label`, the host becomes `role="img"` named by the label (“Messages left on read”);
clearing `label` makes it decorative again.

## Content

- Pair it with a heading and one line of text that says what's happening and what to do next (“No replies yet –
  try a follow-up in a few days”).
- Give it a `label` only when the picture carries meaning the text doesn't.

## Do

- Let it scale: it fills its container's width at a 3 : 2 frame, laid out on a 360 × 240 artboard.
- Place it where it scrolls into view on its own – the messages arrive once a third of it is on screen.

## Don't

- Don't use it to show someone's real messages – the text in the bubbles is fixed.
- Don't put it in a dense panel next to other moving pieces – the shine and the arrival need room.

## Example

```html
<div style="width: 320px">
  <tc-ghosted-chat id="ghosted"></tc-ghosted-chat>
</div>
<p>No replies yet – try a follow-up in a few days.</p>

<script type="module">
  import "trenchcoat/ghosted-chat";
  import "trenchcoat/tokens.css";

  // Only when the picture means something the text beside it doesn't say
  document.querySelector("#ghosted").label = "Messages left on read";
</script>
```

```tsx
import { GhostedChat } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function NoReplies() {
  return (
    <div style={{ width: 320 }}>
      <GhostedChat />
      <p>No replies yet – try a follow-up in a few days.</p>
    </div>
  );
}
```
