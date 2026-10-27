---
pattern: dialog
status: new
related: notification-stack, image-grid, dialog, tips-panel
---

## Overview

A row of story avatars, like Instagram's, for short updates people post and others catch up on. A gradient ring
around an avatar says that person has something new; a quiet gray ring says everything has been seen. Opening one
shows a full-screen viewer that plays the person's items – images, videos and text cards – one after another, with
progress bars across the top, and moves on to the next person when they end. The app owns what's been seen, so the
rings stay right across devices and sessions.

## When to use

- Short-lived updates from people or teams that others browse in passing: what shipped today, who's on call, a photo
  from the offsite.
- A product with a social layer where "what's new from whom" matters more than a complete history.
- Release notes or tips told as a few full-screen cards, where each card is one idea.

## When not to use

- Updates people must not miss or have to act on – use `notification-stack`.
- A gallery of images to browse at the person's own pace – use `image-grid`.
- One modal with content and a Close button – use `dialog`.
- Tips or onboarding steps that stay available beside the work – use `tips-panel`.

## Anatomy

1. **Row** `.ui-sty__row` – the avatars, scrolling sideways, as one toolbar
2. **Add tile** `.ui-sty__add` – an optional first tile to post a story
3. **Ring** `.ui-sty__ring` – the `--tc-story-ring` gradient while something is new, a thin gray ring once seen
4. **Name** `.ui-sty__label` – the person's name, quieter once their stories are seen
5. **Viewer** `.ui-sty__stage` – the 9:16 stage in a modal, full screen on a phone
6. **Progress bars** `.ui-sty__bars` – one segment per item: done, playing, still to come

## Looks

Standard draws a 3 px ring and names in secondary ink at 12 px. Clean draws a thinner ring and smaller (11 px),
muted names, with thinner icons. The viewer is the same dark stage in both; its corners follow the look's card
radius.

## Keyboard

The row is one tab stop:

| Key | What it does |
|---|---|
| Tab | Moves to the row, on the avatar used last, and on out of it |
| ← / → | Moves to the previous or next avatar, wrapping at the ends |
| Home / End | Moves to the first or last avatar |
| Enter / Space | Opens that person's stories, or activates the add tile |

In the viewer, focus starts on Pause (on Close when there's nothing to pause):

| Key | What it does |
|---|---|
| ← / → | Steps to the previous or next item, across people; → on the very last item closes. Inside the reply field the arrows move the caret instead |
| Tab / Shift+Tab | Moves between Pause, Mute, Close, Previous, Next, the reply field and Send, wrapping inside the viewer |
| Enter / Space | Activates the focused button; Enter in the reply field sends |
| Escape | Closes the viewer |

Closing returns focus to the avatar of the person last viewed, which may not be the one that was opened. With a
pointer, a tap or click on the left or right third of the stage steps back or forward, pressing and holding pauses,
and on a touch screen a swipe down closes.

## Screen readers

The row is a toolbar named “Stories”. Each avatar is a button named with the person and their state – “Maya Chen, 3
new” or “Ana Ruiz, seen” – with `aria-haspopup="dialog"`; the add tile is named by its text, “Add story”. The viewer is
a modal dialog named by the person's name, a level-2 heading. A polite status message says where you are as items
change: “Maya Chen, 1 of 3” when a person's stories start, then “2 of 3”. Images take their `text` as alt text, videos
as their label, and a text card is read as text; the progress bars are hidden from assistive technology. The buttons
are “Pause” / “Play”, “Mute” / “Unmute”, “Close”, “Previous” and “Next”, and the reply field is named “Reply to Maya
Chen”.

## Content

- Give every image and video a `text` that says what it shows – it's the only way someone who can't see it knows.
- Keep text cards to one idea in a sentence or two; they sit on a gradient at 20 px and longer text crowds the stage.
- Pass `at` already formatted the way your product writes time (“2h”, “Yesterday”); the element shows it as given.
- Name the add tile for what it does in your product (“Add story”, “Post update”).

## Do

- Store `seen` on your server and pass it back, so the rings agree on every device.
- Set `duration` on items people need longer to read; reduced motion turns auto-advance off, so progress then moves
  only when the person steps.
- Use `--tc-story-ring` to put your brand's gradient on the rings, and `--tc-story-card-<tone>` for text cards.

## Don't

- Don't put anything people must act on in a story – it plays on and disappears.
- Don't autoplay sound: videos start muted, and the person unmutes.
- Don't load a whole person's videos up front; the viewer loads only the item it's showing.

## Example

```html
<tc-stories id="stories" addable></tc-stories>

<script type="module">
  import "trenchcoat/stories";
  import "trenchcoat/tokens.css";

  const stories = document.querySelector("#stories");
  stories.people = [
    {
      id: "maya",
      name: "Maya Chen",
      avatar: "/avatars/maya.jpg",
      items: [
        { id: "m1", kind: "image", src: "/stories/sunrise.jpg", text: "A sunrise over the hills", at: "2h" },
        { id: "m2", kind: "text", text: "Onboarding is live for 10% of sign-ups.", tone: "teal", at: "1h" },
      ],
    },
  ];
  stories.seen = new Set(await (await fetch("/api/stories/seen")).json());
  stories.addEventListener("tc-seen-change", (e) => {
    fetch(`/api/stories/seen/${e.detail.item.id}`, { method: "PUT" });
  });
</script>
```

```tsx
import { useState } from "react";
import { Stories, type StoryPerson, type StorySeen } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function TeamStories({ people, markSeen }: { people: StoryPerson[]; markSeen: (id: string) => void }) {
  const [seen, setSeen] = useState<StorySeen>(new Set());
  return (
    <Stories
      people={people}
      seen={seen}
      onSeenChange={(next, item) => {
        setSeen(next);
        markSeen(item.id);
      }}
      onReply={(text, item, person) => console.log(`Reply to ${person.name} on ${item.id}: ${text}`)}
    />
  );
}
```
