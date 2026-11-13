---
pattern: none
status: new
related: spend-limits, spend-breakdown, budget-guard, quality-alerts
---

## Overview

Spend alerts set by dragging markers along the month's budget. The bar shows what's spent so far and, hatched beyond
it, the forecast to the month's end, with a line at the budget. Each alert is a marker on the bar at a share of the
budget – drag it, or focus it and use the arrow keys, and it reads “Alert at $4,000, 80% of budget”. Clicking the bar
adds an alert there; Add alert adds one at the next round share. Under the bar each alert lists where it goes – email or
chat, and to whom – and when the forecast crosses it: “Forecast crosses 80% around 24 Nov”, or “Already passed”.

## When to use

- A billing or admin page where people set when they hear about the month's AI spend.
- Showing whether this month's forecast will set off an alert, and when.

## When not to use

- Caps that stop spend per member, team or key – use `spend-limits`.
- A live run's cap – use `budget-guard`.
- Alerts on quality rather than money – use `quality-alerts`.

## Anatomy

1. **Bar** `.ui-bal__bar` – the month's scale; click it to add an alert
2. **Spent** `.ui-bal__spent` – what's spent so far
3. **Forecast** `.ui-bal__forecast` – the hatched stretch to the month-end forecast
4. **Budget line** `.ui-bal__budget`
5. **Marker** `.ui-bal__marker` – an alert, with its share above it
6. **Alert row** `.ui-bal__alert` – amount, share, when the forecast crosses it, channel, recipients and Remove
7. **Add alert** `.ui-bal__add`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Markers use `--tc-accent-solid`, and one already passed turns the warning colour. `--tc-bal-bar-h` and
`--tc-bal-marker-w` size the bar and the markers.

## Keyboard

Each marker is a slider and a tab stop.

| Key | What it does |
|---|---|
| ← / → (↓ / ↑) | Moves the alert by 1% of the budget |
| Shift + arrow, Page Up / Page Down | Moves it by 10% |
| Home / End | Moves it to 1% or 150% |
| Delete / Backspace | Removes the alert |
| Tab | Moves between the markers, each alert's fields, and Add alert |

## Screen readers

Each marker is a `slider` named “Alert at 80%”, with value text “Alert at $4,000, 80% of budget” and a description of
its keys. The bar's drawing is otherwise decorative; the header says spent of the budget and the forecast in words.
Each alert row's select and recipients field have labels naming the alert. Moving with the keys, adding and removing
are confirmed in a polite status message.

## Content

- Pass `now` and `end` (epoch ms) for the dates the forecast crosses each alert; the element never reads the clock.
- Use the forecast your billing already makes; the element draws a straight line from today's spend to it.

## Do

- Keep a few alerts – at half, most and all of the budget.
- Send the last alert to someone who can act on it.

## Don't

- Don't set alerts past 150% – set a cap in `spend-limits` instead.

## Example

```html
<tc-budget-alerts id="alerts" budget="5000" spent="2140" forecast="5460" currency="USD"></tc-budget-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/budget-alerts";
  import "@adamstavely/trenchcoat/tokens.css";

  const alerts = document.querySelector("#alerts");
  alerts.alerts = [
    { id: "a50", at: 0.5, channel: "email", recipients: ["finance@example.org"] },
    { id: "a80", at: 0.8, channel: "chat", recipients: ["#finance-ops"] },
  ];
  alerts.addEventListener("tc-alerts-change", (e) => console.log(e.detail.change, e.detail.alerts));
</script>
```

```tsx
import { useState } from "react";
import { BudgetAlerts, type BudgetAlert } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Alerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([{ id: "a80", at: 0.8, channel: "email", recipients: ["finance@example.org"] }]);
  return <BudgetAlerts budget={5000} spent={2140} forecast={5460} alerts={alerts} onAlertsChange={(next) => setAlerts(next)} />;
}
```
