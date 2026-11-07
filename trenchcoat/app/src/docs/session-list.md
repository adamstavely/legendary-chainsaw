---
pattern: list
status: new
related: icon-rail, session-state, agent-inbox, panel-card
---

## Overview

The sessions in a sidebar. Pinned ones come first, then the rest grouped by project, by status, or not at all; within a
group the newest is first. Each row has its status as a mark and a word, the title, an unread dot, the branch and how
long ago it last changed. Waiting means it needs you, so it's the one in the accent colour; running spins. Each row has
Pin and Archive, and the header has New session.

## When to use

- A sidebar of an assistant's or an agent's sessions, to move between them.
- A list where what needs attention should stand out from what's only running.

## When not to use

- One session's status and controls – use `session-state`.
- Agents' tasks waiting for approval, with their steps – use `agent-inbox`.
- Navigation between a panel's tools – use `icon-rail`.

## Anatomy

1. **Filter** `.ui-sesl__filter` – matches the title, project, branch and detail
2. **Group** `.ui-sesl__group` – Pinned, a project or a status, with `.ui-sesl__group-head`
3. **Row** `.ui-sesl__row` – one session
4. **Mark** `.ui-sesl__mark` – the status's shape
5. **Title** `.ui-sesl__title` – cut off with an ellipsis; the whole title is in its tooltip
6. **Unread** `.ui-sesl__unread` – something new since it was opened
7. **Meta** `.ui-sesl__meta` – `.ui-sesl__branch`, the detail and the time
8. **Tools** `.ui-sesl__tools` – Pin and Archive, shown on hover, focus and the open row
9. **Empty** `.ui-sesl__empty` – no sessions, or none that match

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card, for a sidebar that already has a surface. `max-height` makes the list scroll.

## Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between sessions, across groups |
| ← / → | Move between a row, its Pin and its Archive |
| Home / End | Go to the first or last session |
| Enter / Space | Open the session, pin it, or archive it |

## Screen readers

Each group is a list named by its heading. A row's button reads the title, then the status in words ("Needs you") and
"unread"; the open session has `aria-current`. Pin is a toggle button, and Pin and Archive name the session they act on.
Pinning and archiving are announced through `role="status"`. The spinner is decoration; the word says it's running.

## Content

- Titles say what the session is for, in a few words: "Fix CSV export of sample batches".
- Keep `detail` to a short phrase about what it's doing now.
- `updated` takes epoch ms or an ISO string; pass `now` for times that don't move.

## Do

- Update `sessions` after `tc-pin` and `tc-archive`; the list follows the data.
- Clear `unread` when a session is opened.

## Don't

- Don't use `waiting` for anything that doesn't need the person; it's the status that draws the eye.
- Don't put more than a few sessions in Pinned, or it stops meaning anything.

## Example

```html
<tc-session-list id="sessions" group-by="project"></tc-session-list>

<script type="module">
  import "@adamstavely/trenchcoat/session-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#sessions");
  el.sessions = [
    { id: "s1", title: "Booking calendar", status: "waiting", project: "sample-tracker", branch: "feature/booking-calendar" },
    { id: "s2", title: "Fix CSV export", status: "running", project: "sample-tracker", branch: "fix/sample-export" },
  ];
  el.addEventListener("tc-selected-change", (e) => console.log("Open", e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { SessionList, type SessionItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sessions: SessionItem[] = [
  { id: "s1", title: "Booking calendar", status: "waiting", project: "sample-tracker" },
  { id: "s2", title: "Fix CSV export", status: "running", project: "sample-tracker" },
];

export function Sessions() {
  const [selected, setSelected] = useState<string | null>("s1");
  return <SessionList sessions={sessions} selected={selected} onSelectedChange={setSelected} />;
}
```
