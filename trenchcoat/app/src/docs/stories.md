---
pattern: dialog
status: new
related: notifications, change-summary, kpi-chart, dialog
---

## Overview

A row of avatars for the people and accounts someone follows – a teammate, a customer workspace, a project – and a
short brief of what changed for each since they last looked. A gradient ring around an avatar says there's something
new; a quiet gray ring says it's all been seen. Opening one shows a modal brief: who or what it is, how many updates
are new and since when, an optional one-sentence summary, and a bento grid of tiles, each designed for what it holds –
a number that moved, a status change, a note, a list of new things, a picture, a link to act on. The app owns what's
been seen, so the rings stay right across devices and sessions.

## When to use

- Catching up on several people or accounts at once: what moved for each customer workspace, what each teammate
  shipped, how each project is doing since Monday.
- A home or overview page where "what's new, and for whom" is the first question.
- Digests where each update is a fact – a metric, a status, a member added – rather than a message to reply to.

## When not to use

- Updates people must act on or can't miss – use `notifications`.
- One list of changes to a single document or record – use `change-summary`.
- A single metric with its history – use `kpi-chart`.
- One modal with free content and a Close button – use `dialog`.

## Anatomy

1. **Row** `.ui-sty__row` – the avatars, scrolling sideways, as one toolbar
2. **Add tile** `.ui-sty__add` – an optional first tile, for posting an update
3. **Ring** `.ui-sty__ring` – the `--tc-story-ring` gradient while something is new, a thin gray ring once seen; round for a person, square for an account
4. **Name** `.ui-sty__label` – the person's or account's name, quieter once everything is seen
5. **Brief** `.ui-sty__panel` – the modal: the avatar, the name and the count line, the summary, the tiles and the foot
6. **Tile** `.ui-sty__tile` – one update with its heading; new ones first, marked New
7. **Foot** `.ui-sty__nav` – Previous and Next with the neighbours' names, and where you are

## Looks

Standard puts the header, the summary and the foot on the gray tray, and each new tile is a white card on it; a seen
tile loses its card and keeps a hairline. Clean is one white surface: tiles are framed by a hairline (fainter once
seen), a hairline sits over the foot, the type is lighter and the icons thinner. The row's ring is 3 px in Standard and
thinner in Clean, with smaller, muted names.

## Keyboard

The row is one tab stop:

| Key | What it does |
|---|---|
| Tab | Moves to the row, on the avatar used last, and on out of it |
| ← / → | Moves to the previous or next avatar, wrapping at the ends |
| Home / End | Moves to the first or last avatar |
| Enter / Space | Opens that entry's brief, or activates the add tile |

In the brief, focus starts on its content (not a tab stop), so ↑ ↓ and Page Up / Page Down scroll it:

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next entry; nothing past either end. Inside the reply field the arrows move the caret instead |
| Tab / Shift+Tab | Moves through Close, the tiles' links and actions, the reply field and Send, then Previous and Next; the page behind is inert |
| Enter / Space | Activates the focused link or button; Enter in the reply field sends |
| Escape | Closes the brief |

Tiles aren't tab stops unless they hold a link or an action. Closing returns focus to the avatar of the entry last
viewed, which may not be the one that was opened. Nothing moves on its own.

## Screen readers

The row is a toolbar named “Updates”. Each avatar is a button named with the entry and its state – “Maya Chen, 4 new”
or “Leo Park, seen” – with `aria-haspopup="dialog"`; the add tile is named by its text, “Add update”. The brief is a
modal dialog named by the entry's name, a level-2 heading, with the count line under it: “4 updates since you last
looked · Tue 09:41”. The tiles are a list; each tile has a level-3 heading, and a new one says “New” after it. A
metric's change is read with its sense – “+1.2 pts, better” or “+14.5%, worse” – and a status move as “Draft to In
review”. A generated summary is marked “AI summary”. Moving to another entry says its name and count line in a polite
status message. Previous and Next are read with the neighbour's name, “Next Northwind workspace”; at an end the button
stays, marked unavailable. Pictures take their `alt`; sparklines are hidden.

## Content

- Title each update with what changed, not with what happened to it: “Trial-to-paid conversion”, “Plan”, “New
  members”.
- Format values as your product writes them (“$1,240”, “182 ms”); give a metric's change as a number with `deltaUnit`
  and say which way is good with `lowerIsBetter` or `neutral`.
- Keep the summary to one sentence that says why the updates matter together. Set `summaryGenerated` when a model
  wrote it, so it's marked.
- Pass `since` and `at` already formatted (“Tue 09:41”, “2h”); the element shows them as given.
- Give every image an `alt` that says what it shows, and a caption only when it adds something the picture doesn't.

## Do

- Store `seen` on your server and pass it back, so the rings agree on every device; one `tc-seen-change` per opening
  carries every update it marked.
- Use size hints sparingly: `wide` for a note or a picture, `tall` for a list. The grid fills the gaps around them.
- Use a link tile for the one next step (“Open report”, “Review”) – it's the tile people can act on.
- Use `kind: "account"` for workspaces, projects and customers, so they read as square marks beside round faces.

## Don't

- Don't put anything people must act on only in a brief – it's for catching up, and it's marked seen when opened.
- Don't fill a brief with every event; five to eight updates that matter read better than twenty.
- Don't use colour alone for good or bad – set `lowerIsBetter` so the change is also read with its sense.

## Example

```html
<tc-stories id="updates" replyable></tc-stories>

<script type="module">
  import "trenchcoat/stories";
  import "trenchcoat/tokens.css";

  const updates = document.querySelector("#updates");
  updates.entries = [
    {
      id: "northwind",
      name: "Northwind workspace",
      kind: "account",
      since: "Mon 16:20",
      summary: "Northwind moved to the Business plan and added seven members.",
      updates: [
        { id: "nw-plan", kind: "status", title: "Plan", from: "Team", to: "Business", toTone: "success" },
        { id: "nw-seats", kind: "metric", title: "Seats in use", value: "42 of 50", delta: 7, neutral: true },
        { id: "nw-members", kind: "list", title: "New members", items: ["Priya Shah", "Tom Ellis"], total: 7 },
        { id: "nw-report", kind: "link", title: "Usage report", label: "Open report", href: "/reports/northwind" },
      ],
    },
  ];
  updates.seen = new Set(await (await fetch("/api/updates/seen")).json());
  updates.addEventListener("tc-seen-change", (e) => {
    fetch("/api/updates/seen", { method: "POST", body: JSON.stringify(e.detail.updates.map((u) => u.id)) });
  });
</script>
```

```tsx
import { useState } from "react";
import { Stories, type StoryEntry, type StorySeen } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function WhatChanged({ entries, markSeen }: { entries: StoryEntry[]; markSeen: (ids: string[]) => void }) {
  const [seen, setSeen] = useState<StorySeen>(new Set());
  return (
    <Stories
      entries={entries}
      seen={seen}
      onSeenChange={(next, updates) => {
        setSeen(next);
        markSeen(updates.map((u) => u.id));
      }}
      onAction={(update, entry) => console.log(`${update.label} for ${entry.name}`)}
    />
  );
}
```
