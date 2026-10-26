---
pattern: none
status: stable
related: glass-folder, ghosted-chat, side-folder
---

## Overview

Three calendar cards stacked and fanned out, each with an “Empty” badge, faint placeholder lines and a greyed-out
“Join meeting” button. It tells people at a glance that there's nothing on their schedule – no meetings, no events –
in a way that reads warmer than a blank panel. Hover the front card and it lifts; hover a back card and it slides
further out. The placeholder lines shimmer and the glow under the front card breathes for a few cycles, then rest.

## When to use

- An empty calendar, agenda or meetings view, above the text that says nothing is booked.
- The empty state of a scheduling or booking integration before the first event is synced.
- Onboarding or landing sections about meetings and calendars.

## When not to use

- An empty folder, file list or upload area – use `glass-folder`.
- An empty conversation or chat history – use `ghosted-chat`.
- As a date picker or a way to book time – the cards are a picture, not a control; use `date-range-picker`.

## Anatomy

1. **Front card** `.ui-ec-front` – the card that lifts and tilts on hover, with the glow beneath it
2. **Back card** `.ui-ec-back-left` – one of the two cards fanned out behind it; slides further out on hover
3. **Placeholder lines** `.ui-ec-front .ui-ec-bar` – the empty rows that shimmer a few times and rest
4. **Button** `.ui-ec-front .ui-ec-btn` – the disabled-looking “Join meeting” button, drawn, not a real control

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the cards turn charcoal with faint edges and
the badge a translucent peach. It works with a `.dark` class, `data-theme`, `data-tc-theme` or the system setting.

## Keyboard

Nothing to operate – the illustration takes no focus, and the “Join meeting” button is part of the drawing. Hover
only moves the cards.

## Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes `role="img"`
named by the label (“Nothing scheduled”); clearing `label` makes it decorative again. The drawing itself is always
hidden, so the “Calendar”, “EMPTY” and “Join meeting” text in it is never read.

## Content

- Pair it with a short heading (“No meetings this week”) and one line on what to do next.
- Give it a `label` only when the picture says something the text beside it doesn't.

## Do

- Size its container, not the illustration: it fills the width at a 3 : 2 frame.
- Put a real call to action next to it – “Connect your calendar”, “Book a time” – as a button in the page.

## Don't

- Don't rely on the drawn “Join meeting” button – it can't be clicked or focused.
- Don't place it in a small toolbar or list row – it is meant to be seen at card size.

## Example

```html
<div style="width: 320px">
  <tc-empty-calendar id="empty"></tc-empty-calendar>
  <p>No meetings this week.</p>
</div>

<script type="module">
  import "trenchcoat/empty-calendar";
  import "trenchcoat/tokens.css";

  const art = document.querySelector("#empty");
  // Only when the picture carries meaning the text doesn't
  art.label = "Empty calendar";
</script>
```

```tsx
import { EmptyCalendar } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function NoMeetings() {
  return (
    <div style={{ width: 320 }}>
      <EmptyCalendar />
      <p>No meetings this week.</p>
    </div>
  );
}
```
