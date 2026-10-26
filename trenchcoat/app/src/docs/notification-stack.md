---
pattern: none
status: stable
related: toaster, tips-panel, setup-guide
---

## Overview

Notices stacked behind each other, like a small pile of cards. Only the front one can be read; the edges of the
next two peek out below it, so people see there's more without being shown everything at once. Dismissing the front
card slides it away and the next one moves up. Each notice can carry a badge, a short text, one action and quiet
line art in its corner.

## When to use

- A few announcements that should be read one at a time – maintenance, a new feature, a billing change.
- A corner of a dashboard or a sidebar where notices wait until people get to them.
- Notices that stay until they're dismissed, rather than timing out.

## When not to use

- Brief confirmations of something the person just did (“Saved”) – use `toaster`.
- Advice and how-tos people can browse – use `tips-panel`.
- Onboarding steps with progress – use `setup-guide`.

## Anatomy

1. **Front card** `.ui-ns__card[data-depth="0"]` – the notice people can read and act on
2. **Badge** `.ui-ns__card[data-depth="0"] .ui-ns__badge` – a small label, e.g. “Notice”
3. **Dismiss** `.ui-ns__card[data-depth="0"] .ui-ns__close` – slides the card away and brings up the next
4. **Title** `.ui-ns__card[data-depth="0"] .ui-ns__title` – the notice in a few words
5. **Action** `.ui-ns__card[data-depth="0"] .ui-ns__btn` – one link or button
6. **Card behind** `.ui-ns__card[data-depth="1"]` – the next notice, peeking out below

## Looks

Standard gives each card a soft border, an outlined badge and a slightly larger title. Clean draws one white card per
notice with hairline shadows, a filled gray badge, thinner icons and an accent dot in the line art. Both stack up to
three cards and slide the front one away the same way.

## Keyboard

There are no keys of its own: Tab reaches the front card's Dismiss button and its action, and Enter or Space
activates them. The cards behind are inert until they come to the front. After a dismissal, focus moves to the next
card's Dismiss button, so people can work through the stack from the keyboard.

## Screen readers

The stack is a region named “Notifications” unless the page names it. The front card is an article named by its
title and its place – “Scheduled maintenance on Sunday, 1 of 4” – with the title as a heading; the cards behind are
hidden from screen readers until they come to the front. The dismiss button is named “Dismiss Scheduled maintenance
on Sunday”. A status line says what happened: “Dismissed Scheduled maintenance on Sunday. 3 more notices.”, and
“No more notices.” after the last.

## Content

- Write the title as the news, in a few words: “Scheduled maintenance on Sunday”.
- Keep the text to one or two sentences that say what changes for the reader and when.
- Name the action by where it goes: “View status page”, “Manage seats” – not “Learn more”.
- Use the badge for the kind of notice (“Billing”, “Security”), one word.

## Do

- Put the most important notice first – `notices` is front first.
- Set `external: true` on actions that open another site; they open in a new tab with an arrow.
- Remove a notice from `notices` once it no longer applies; one that comes back shows again.

## Don't

- Don't stack urgent errors here – they'd wait behind other notices.
- Don't put more than one action on a notice.
- Don't use it for a feed people scroll – only the front card can be read.

## Example

```html
<tc-notification-stack id="notices"></tc-notification-stack>

<script type="module">
  import "trenchcoat/notification-stack";
  import "trenchcoat/tokens.css";

  const stack = document.querySelector("#notices");
  stack.notices = [
    {
      id: "maintenance",
      badge: "Notice",
      title: "Scheduled maintenance on Sunday",
      text: "The dashboard will be read-only from 02:00 to 03:30 UTC.",
      action: { label: "View status page", href: "https://status.example.com", external: true },
      pattern: "orbit",
    },
    { id: "seats", badge: "Billing", title: "Your seats renew on 1 November", text: "12 seats at the annual rate.", pattern: "rays" },
  ];
  stack.addEventListener("tc-dismiss", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { NotificationStack, type Notice } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const notices: Notice[] = [
  {
    id: "maintenance",
    badge: "Notice",
    title: "Scheduled maintenance on Sunday",
    text: "The dashboard will be read-only from 02:00 to 03:30 UTC.",
    action: { label: "View status page", href: "https://status.example.com", external: true },
  },
  { id: "seats", badge: "Billing", title: "Your seats renew on 1 November", text: "12 seats at the annual rate.", pattern: "rays" },
];

export function Announcements({ markRead }: { markRead: (id: string) => void }) {
  return <NotificationStack notices={notices} onDismiss={(n) => markRead(n.id)} />;
}
```
