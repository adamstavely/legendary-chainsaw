---
pattern: tabs
status: new
related: notification-stack, toaster, background-tasks, profile-menu
---

## Overview

The notification center at the top right of an app. A bell shows how many notifications are unread; it opens a
panel that lists them newest first, grouped by day – Today, Yesterday, the weekday, then dates – with tabs for All,
Unread and the app's own categories. Each notification says who did what, where and when, and can be opened, marked
read or unread, acted on in place (Approve, View) or dismissed. The app owns the data: every change is a cancelable
event, and the panel shows loading, error, empty and load-more states while the app fetches. `inline` renders the
same panel on its own for a full notifications page or a side drawer.

## When to use

- A persistent record of things that happened while the person was elsewhere: mentions, assignments, requests,
  finished jobs, security alerts.
- Anywhere people need to come back to a notification later, act on it, or see what they've already dealt with.
- A full notifications page or a drawer, with `inline`, sharing its data with the header's bell.

## When not to use

- A brief confirmation that disappears on its own – use `toaster`.
- A few announcements to read one at a time, such as release notes – use `notification-stack`.
- Progress of the person's own long-running jobs – use `background-tasks`.

## Anatomy

1. **Bell** `.ui-ntc__trigger` – the header button that opens the panel
2. **Badge** `.ui-ntc__badge` – the unread count, capped at “9+”, or a dot
3. **Tabs** `.ui-ntc__tabs` – All, Unread with its count, and the app's categories
4. **Day** `.ui-ntc__day` – the group label: Today, Yesterday, a weekday or a date
5. **Notification** `.ui-ntc__row` – the avatar or icon, who did what, the body and when; the whole row opens it
6. **Actions** `.ui-ntc__acts` – inline buttons such as Approve and Decline
7. **Read toggle** `.ui-ntc__dot` – the unread dot; it marks the notification read or unread

## Looks

Both looks open the panel on the menu surface with a plain title row. Inline, Standard sets the header on the gray
tray above a white card and underlines the selected tab in ink; Clean is one white card with the header as its first
row, an accent underline, small-capital day labels, lighter actor names and thinner icons.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the bell: opens or closes the panel; focus goes to the first notification |
| ← / → | In the tabs: the previous or next tab, selected as it's reached (wraps around) |
| Home / End | In the tabs: the first or last tab. In the list: the first or last notification |
| ↓ / ↑ | In the list: the next or previous notification, across day groups |
| Enter | On a notification: opens it (follows its link) and marks it read |
| Tab | From the tabs into the list (one tab stop), then through the focused notification's actions, read toggle and dismiss, then Load more |
| Escape | Closes the panel and returns focus to the bell |

## Screen readers

The bell is a button with `aria-haspopup="dialog"` and `aria-expanded`, named with the exact count even when the
badge is capped or a dot: “Notifications, 12 unread”. The panel is a non-modal `dialog` named by its title; inline,
the host is a `region` named by it. The tabs are a `tablist` named “Filter notifications”, and the list is the
`tabpanel`, busy while it loads. Each day is a `group` named by its label. A notification is a link (or a button
when it has no link) named by what it shows, with “Unread,” before it while it's unread – “Unread, Maya Chen
mentioned you in Q3 roadmap” – and described by its body, where it happened and the full time (“Tuesday 27 October
2026 at 11:54”); the short time (“6m”) is hidden from screen readers. Its actions keep their visible names and are
described by the notification's title; the read toggle is “Mark as read” or “Mark as unread”, and dismiss is
“Dismiss”. A polite status region says “New notification: Alex Romero commented on Pricing page copy”, or “3 new
notifications” for a batch – once per update, never one message per item – and “All notifications marked as read”
and “Notification dismissed” after those actions.

## Content

- Lead with the actor, then what they did and to what: actor “Maya Chen”, title “mentioned you in Q3 roadmap”.
  Without a person, write the whole event as the title: “Production deploy finished”.
- Keep the body to the detail someone needs to decide whether to open it; it's clamped at two lines.
- Use `context` for where it happened (“Billing · BIL-482”), not for when – the time is added for you.
- Name inline actions with a verb (“Approve”, “Decline”, “View”); give at most one `primary`.
- Keep category labels to one word if you can (Mentions, Assigned, System) – the tabs scroll sideways at 320 px but
  read best when they fit.
- Pass `error` as what went wrong in a sentence (“The notifications service didn’t respond.”); the panel adds its
  own heading and Try again.

## Do

- Keep the notifications in your own state, prevent the events, and pass the new list back – or listen and let the
  component apply the change.
- Set `loading` for the first page and `loadingMore` for later ones, so arrivals aren't announced while a page loads.
- Give `unreadCount` when the server knows more unread notifications than you've loaded.
- Share one list between the header's bell and an `inline` page so both agree on what's read.

## Don't

- Don't use it for messages that need an answer before the person can carry on – use a dialog.
- Don't mark notifications read just because the panel was opened; the person decides by opening or acting on one.
- Don't send a toast as well for every notification that arrives – the badge and the announcement already say so.

## Example

```html
<tc-notifications id="bell" settings-href="/settings/notifications" has-more></tc-notifications>

<script type="module">
  import "trenchcoat/notifications";
  import "trenchcoat/tokens.css";

  const bell = document.querySelector("#bell");
  bell.categories = [{ id: "mentions", label: "Mentions" }];
  bell.items = [
    { id: "n1", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", time: "2026-10-27T09:14:00Z", category: "mentions", href: "/q3" },
    { id: "n2", title: "Production deploy finished", time: "2026-10-27T08:30:00Z", read: true },
  ];
  bell.addEventListener("tc-load-more", async (e) => {
    const older = await fetch(`/api/notifications?after=${e.detail.after}`).then((r) => r.json());
    bell.items = [...bell.items, ...older.items];
    bell.hasMore = older.hasMore;
  });
</script>
```

```tsx
import { useState } from "react";
import { Notifications, type NotificationItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function HeaderBell() {
  const [items, setItems] = useState<NotificationItem[]>([
    { id: "n1", actor: "Jordan Park", title: "requested access to Revenue dashboard", time: Date.parse("2026-10-27T07:02:00Z"), actions: [{ id: "approve", label: "Approve", primary: true }] },
  ]);
  return (
    <Notifications
      items={items}
      onItemsChange={(next) => setItems(next)}
      onAction={(item, action) => console.log(action, item.id)}
      settingsHref="/settings/notifications"
    />
  );
}
```
