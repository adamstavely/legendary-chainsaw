---
pattern: list
status: new
related: top-spenders, usage-meter, team-roster, cost-anomaly
---

## Overview

Seats paid for against seats used. A headline – “112 of 150 seats used · 38 idle” – sits over one bar split into
active seats (used in the last 30 days), idle seats (given to someone who hasn't used them) and unassigned seats, with a
legend in words and numbers and, with `seat-price`, what the idle and unassigned seats cost a month. Under it, the same
split per plan or team as a table, then the idle members with when each was last active. Tick several and use
Reclaim, or a row's own Reclaim seat; a confirmation says who loses access and what it saves, and confirming fires
`tc-reclaim` for the page to act on.

## When to use

- A billing or admin page, before a renewal, to find seats no one is using.
- Licence reviews by plan or by team.

## When not to use

- Who is spending the most – use `top-spenders`.
- One plan's usage against its limit – use `usage-meter`.
- A directory of the team – use `team-roster`.

## Anatomy

1. **Headline** `.ui-seat__headline` – seats used of seats paid, idle and unassigned
2. **Bar** `.ui-seat__bar` – active, idle (striped) and unassigned, as shares of the seats paid for
3. **Legend** `.ui-seat__legend` – each part in words and numbers
4. **Cost** `.ui-seat__cost` – what idle and unassigned seats cost per period
5. **Breakdown** `.ui-seat__table` – paid, active and idle per plan or team
6. **Idle members** `.ui-seat__idle` – checkboxes, last active and Reclaim seat
7. **Confirmation** `.ui-seat__confirm` – who loses access, with Cancel and Reclaim

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Active seats fill with `--tc-meter-fill`; idle seats are striped in the warning colours, so they
differ by pattern as well as colour; unassigned seats are the empty track. Narrow, the last-active time drops under the
name and the table's bars go.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Select all, Reclaim, each member's checkbox and Reclaim seat |
| Space | Ticks or unticks a checkbox |
| Enter / Space | On Reclaim, opens the confirmation with focus on Cancel |
| Escape | Closes the confirmation and returns focus to the button that opened it |

## Screen readers

The headline, legend and cost are text; the bars are hidden, since the words carry the same numbers. The breakdown is a
table with a caption, “Seats by team”. Each idle member is a labelled checkbox, and Reclaim seat adds “from Ines
Lindqvist” for screen readers. Reclaim stays focusable with `aria-disabled` until something is ticked. The
confirmation is a group named by its own sentence, and a reclaim is confirmed politely: “Reclaimed 3 seats”.

## Content

- Give `groups` and leave the totals to add up, or set `paid`, `assigned` and `active` yourself.
- `idle` can be everyone with an idle seat, or the longest idle first.
- Pass `now` for “Last active 47 days ago”; without it, the element shows the date.

## Do

- Remove reclaimed members from `idle` once your back end has taken their seats.
- Say the plan and renewal date in `description`.

## Don't

- Don't reclaim without the confirmation: `tc-reclaim` fires only after it.
- Don't call a seat idle on less than 30 days' data.

## Example

```html
<tc-seat-usage id="seats" seat-price="30" description="Business plan · renews 1 March"></tc-seat-usage>

<script type="module">
  import "@adamstavely/trenchcoat/seat-usage";
  import "@adamstavely/trenchcoat/tokens.css";

  const seats = document.querySelector("#seats");
  seats.groups = [
    { id: "audit", label: "Audit", paid: 60, assigned: 60, active: 49 },
    { id: "research", label: "Research", paid: 55, assigned: 52, active: 41 },
  ];
  seats.idle = [
    { id: "u1", name: "Ines Lindqvist", detail: "Analyst", group: "Audit", lastActive: Date.UTC(2026, 8, 26) },
    { id: "u2", name: "Omar Haddad", detail: "Field researcher", group: "Research" },
  ];
  seats.addEventListener("tc-reclaim", (e) => {
    seats.idle = seats.idle.filter((m) => !e.detail.ids.includes(m.id));
  });
</script>
```

```tsx
import { SeatUsage, type IdleMember, type SeatGroup } from "@adamstavely/trenchcoat/react";
import { useState } from "react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: SeatGroup[] = [{ id: "audit", label: "Audit", paid: 60, assigned: 60, active: 49 }];
const start: IdleMember[] = [{ id: "u1", name: "Ines Lindqvist", group: "Audit" }];

export function Seats() {
  const [idle, setIdle] = useState(start);
  return <SeatUsage groups={groups} idle={idle} seatPrice={30} onReclaim={(ids) => setIdle((list) => list.filter((m) => !ids.includes(m.id)))} />;
}
```
