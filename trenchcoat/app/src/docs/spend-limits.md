---
pattern: list
status: new
related: spend-breakdown, budget-alerts, budget-guard, usage-meter
---

## Overview

Spend caps per member, team or API key. The workspace's default cap – what every member gets unless a row says
otherwise – sits at the top. Under it each limit is a row: who or what it's for, spent of the cap in words and as a bar
(“$1,640 of $2,000 a month, 82%”), the period, and what happens at the cap – Block, Warn or Notify. Rows over their cap
come first, say “Over limit” and by how much. The cap is edited in place, the action is a select, Remove takes a limit
away, and Add limit picks a kind and a member, team or key from the page's list.

## When to use

- An admin page that sets how much each person, team or integration may spend on AI.
- Showing who's close to or over their cap, and what will happen when they get there.

## When not to use

- A live run's cap while it runs – use `budget-guard`.
- One plan's usage against its limit – use `usage-meter`.
- Where the spend went – use `spend-breakdown`.
- Alerts on the whole month's budget – use `budget-alerts`.

## Anatomy

1. **Workspace default** `.ui-spl__default` – the cap every member gets, editable
2. **Limit row** `.ui-spl__row` – kind, name and an Over or Near limit flag
3. **Meter** `.ui-spl__track` – spent of the cap, with the words under it
4. **Cap** `.ui-spl__cap` – the cap, a button that edits it in place
5. **Action** `.ui-spl__action` – Block, Warn or Notify at the cap
6. **Remove** `.ui-spl__remove`
7. **Add limit** `.ui-spl__add` – kind, who, amount, period and action

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Meters use the meter tokens; near the cap (80%) they turn the warning colour and over it the danger colour,
and the row says so in words.

## Keyboard

Every control is native and in reading order.

| Key | What it does |
|---|---|
| Tab | Moves through each row's cap, action and Remove, then Add limit |
| Enter | On a cap, edits it; in the field, saves |
| Escape | Cancels the edit, or closes Add limit |

## Screen readers

The rows are a list named by the heading. Each row's bar is a meter named after its member, team or key, with value
text such as “$3,720 of $3,500 a month, 106%, over by $220”. A cap's button reads its amount and “edit Audit's limit”;
the edit field has a label, and a problem is announced. Saving, adding, removing and changing an action are confirmed
in a polite status message.

## Content

- Name keys by what they're for, with the environment: “invoice-ingest (prod)”.
- Use `period: "day"` for keys that run automatically, so a runaway loop stops the same day.

## Do

- Block at the cap for keys; warn or notify for people, so work isn't cut off mid-task.
- Pass `targets` with every member, team and key, so Add limit can offer them.

## Don't

- Don't use a limit as a budget forecast – show where the money's going with `spend-breakdown`.

## Example

```html
<tc-spend-limits id="limits" currency="USD"></tc-spend-limits>

<script type="module">
  import "@adamstavely/trenchcoat/spend-limits";
  import "@adamstavely/trenchcoat/tokens.css";

  const limits = document.querySelector("#limits");
  limits.defaultLimit = { limit: 150, period: "month", action: "warn" };
  limits.limits = [
    { id: "t-audit", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" },
    { id: "k-ingest", kind: "key", name: "invoice-ingest (prod)", limit: 40, spent: 31.5, period: "day", action: "block" },
  ];
  limits.addEventListener("tc-limits-change", (e) => console.log(e.detail.change, e.detail.id));
</script>
```

```tsx
import { useState } from "react";
import { SpendLimits, type SpendLimit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Limits() {
  const [limits, setLimits] = useState<SpendLimit[]>([
    { id: "t-audit", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" },
  ]);
  return <SpendLimits limits={limits} onLimitsChange={(next) => setLimits(next)} />;
}
```
