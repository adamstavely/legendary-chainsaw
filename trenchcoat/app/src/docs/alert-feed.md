---
pattern: list
status: new
related: watchlist, notifications, notification-stack, agent-inbox
---

## Overview

A live feed of alerts, newest first, for a team watching accounts, payments or systems as things happen. Each alert
has a category tag named by the page, a severity – critical, high, medium or info – shown as an edge, a mark and a
word, a title, a subject line naming who or what it's about, a source tag, and a relative time that stays fresh. Each
alert's actions – Escalate and Acknowledge by default, or the page's own – fire `tc-action`; acknowledging quiets the
alert. The header has a live dot with the number of events today, the number of critical alerts still open, and
Pause feed. While paused, new alerts wait behind a “Show 3 new alerts” button, so the list doesn't move under
someone reading it. New alerts slide in and are announced politely, several at once as a count.

## When to use

- A security, fraud or operations team watching events that need a person to look at them.
- A dashboard panel where the newest, most severe events must stand out and be dealt with in place.
- Any stream where people acknowledge or escalate one item at a time.

## When not to use

- Messages for the person using the app – use `notifications`.
- A short toast that something happened – use `notification-stack`.
- People or accounts to keep an eye on, rather than events – use `watchlist`.
- Work assigned to agents – use `agent-inbox`.

## Anatomy

1. **Live** `.ui-afd__live` – a live dot and the number of events today; “Paused” while paused
2. **Critical** `.ui-afd__critical` – how many critical alerts are still open
3. **Pause** `.ui-afd__pause` – Pause feed or Resume feed
4. **Waiting** `.ui-afd__waiting` – while paused, the alerts that arrived, behind a button
5. **Alert** `.ui-afd__alert` – one alert, with its severity edge
6. **Mark** `.ui-afd__mark` – the severity's shape: an octagon, a triangle, a circle or an i
7. **Category** `.ui-afd__category` – the kind of alert, in small caps, with the severity in words beside it
8. **Time** `.ui-afd__time` – how long ago, kept fresh
9. **Actions** `.ui-afd__actions` – the alert's buttons; “Acknowledged” once it's dealt with

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The alerts, marks and actions are the same in both.

## Keyboard

The alerts are one tab stop; inside it the arrows move between alerts.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next alert |
| Home / End | Moves to the first or last alert |
| Tab | Moves on to the focused alert's actions, then leaves the feed |
| Enter / Space on an action | Uses it: fires `tc-action` |

Acknowledging moves the focus back to the alert, since its Acknowledge button goes away.

## Screen readers

The feed is a list named by the heading. Each alert is an article named by its title and described by its severity,
category, subject and state, “Critical · Payment · Dana Okafor · CUS-0098-S · Geneva”; its actions are described by
the title, so “Escalate” is heard with what it escalates. New alerts are announced in a polite status message, “New
critical alert: Card used in two countries within an hour”, or “3 new alerts, 1 critical”; while paused, “2 new alerts
waiting”. Acknowledging is confirmed with “Acknowledged: …”. Pause feed is a toggle button, pressed while paused.

## Content

- Write titles as what happened, in a few words: “Card used in two countries within an hour”.
- Put who or what, the id and where in `subject`, separated by middle dots.
- Keep categories to one word each, and few of them: “Payment”, “Sign-in”, “Device”.
- Name the rule, team or case the alert came from in `source`.

## Do

- Keep critical for alerts someone must act on now; most alerts should be medium or info.
- Give `now` when the page already has a clock, so every time on the page agrees.
- Pass `todayCount` when the feed shows only some of today's events.

## Don't

- Don't rely on the colours – the words and marks carry the severity.
- Don't remove acknowledged alerts straight away; let them go quiet, then age out.
- Don't add more than two or three actions to an alert; open the record for the rest.

## Example

```html
<tc-alert-feed id="feed" heading="Live alerts"></tc-alert-feed>

<script type="module">
  import "trenchcoat/alert-feed";
  import "trenchcoat/tokens.css";

  const feed = document.querySelector("#feed");
  feed.items = [
    { id: "a1", category: "Payment", severity: "critical", title: "Card used in two countries within an hour", subject: "Dana Okafor · CUS-0098-S · Geneva", time: Date.parse("2026-10-27T09:41:00") },
    { id: "a2", category: "Sign-in", severity: "info", title: "Password reset from a known device", time: Date.parse("2026-10-27T09:02:00") },
  ];
  feed.addEventListener("tc-action", (e) => console.log(e.detail.action, e.detail.id));
</script>
```

```tsx
import { AlertFeed, type AlertItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: AlertItem[] = [
  { id: "a1", category: "Payment", severity: "critical", title: "Card used in two countries within an hour", subject: "Dana Okafor · CUS-0098-S · Geneva", time: Date.parse("2026-10-27T09:41:00") },
];

export function Alerts() {
  return <AlertFeed title="Live alerts" items={items} onAction={(id, action) => console.log(id, action)} />;
}
```
