---
pattern: list
status: new
related: alert-feed, data-table, notifications, agent-inbox
---

## Overview

The people, accounts or entities a team is keeping an eye on, most at risk first. Each row has an avatar – a picture,
or the name's initials – the name, a reference line such as an account number, a group tag for the case or team it
belongs to, and a risk badge: Critical, Elevated, Guarded or Low, renamable, always in words as well as colour. The
header counts what's shown and can carry a “View all” action. Filter buttons, when turned on, narrow the list by risk,
each with its count. Opening a row tells the page which one.

## When to use

- A short list of accounts, customers or merchants under review, on a dashboard or beside a case.
- Showing who needs attention first, sorted by how much risk each carries.
- A side panel that leads into a full record when a row is opened.

## When not to use

- Live events as they happen – use `alert-feed`.
- Many columns to sort, filter and edit – use `data-table`.
- Messages for the person using the app – use `notifications`.
- Work handed to agents – use `agent-inbox`.

## Anatomy

1. **Count** `.ui-wls__count` – how many rows the current filter holds, beside the heading
2. **View all** `.ui-wls__all` – the header's action, for the full list
3. **Filters** `.ui-wls__filters` – All and each risk with rows, with counts
4. **Row** `.ui-wls__row` – one person, account or entity; opens on Enter or a click
5. **Avatar** `.ui-wls__avatar` – a picture or initials: round for a person, square for an account
6. **Reference** `.ui-wls__ref` – an id or number in mono
7. **Group** `.ui-wls__group` – the case, team or list it belongs to
8. **Risk** `.ui-wls__risk` – the risk in words, in its status colours

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The rows, badges and filters are the same in both.

## Keyboard

The rows are one tab stop; inside it the arrows move between rows.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row: fires `tc-open` |
| Tab | Leaves the list; the filters and View all come before it |

## Screen readers

The list is named by the heading and its count, “Watchlist, 7”. Each row is a button that reads its name, reference,
group and risk, “Northwind Traders MER-4471-K Case 22-1187 Risk: Critical”; the avatar is hidden. The filters are a
group labelled “Filter by risk”, each a toggle button that's pressed while its risk is shown, reading its name and
count, “Critical 2”.

## Content

- Use the name people know: the account's trading name, the customer's full name.
- Put the reference people search by in `ref`: “MER-4471-K”, “CUS-0098-S”.
- Keep `group` to a few words: the case number, the team, the queue.
- Rename the risks with `riskLabels` to match your own scale, and keep them in that order: most to least at risk.

## Do

- Use `limit` on a dashboard, with View all leading to the full list.
- Turn on `filters` when the list is long enough that people look for one risk at a time.
- Use `shape: "square"` for accounts and organisations, so they don't read as people.

## Don't

- Don't show the risk by colour alone elsewhere on the page – match the badge's words.
- Don't put actions in the rows; open the record and act there.
- Don't keep someone on the list without a reason the team can see in their record.

## Example

```html
<tc-watchlist id="watch" heading="Watchlist" filters></tc-watchlist>

<script type="module">
  import "trenchcoat/watchlist";
  import "trenchcoat/tokens.css";

  const watch = document.querySelector("#watch");
  watch.items = [
    { id: "m-4471", name: "Northwind Traders", ref: "MER-4471-K", group: "Case 22-1187", risk: "critical", shape: "square" },
    { id: "c-2210", name: "Ravi Menon", ref: "CUS-2210-V", group: "Chargebacks", risk: "elevated" },
  ];
  watch.addEventListener("tc-open", (e) => console.log(e.detail.id));
  watch.addEventListener("tc-action", () => console.log("view all"));
</script>
```

```tsx
import { useState } from "react";
import { Watchlist, type WatchFilter, type WatchItem } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const items: WatchItem[] = [
  { id: "m-4471", name: "Northwind Traders", ref: "MER-4471-K", group: "Case 22-1187", risk: "critical", shape: "square" },
  { id: "c-2210", name: "Ravi Menon", ref: "CUS-2210-V", group: "Chargebacks", risk: "elevated" },
];

export function Watched() {
  const [filter, setFilter] = useState<WatchFilter>("all");
  return <Watchlist title="Watchlist" items={items} filters filter={filter} onFilterChange={setFilter} onOpen={(id) => console.log(id)} />;
}
```
