---
pattern: meter
status: react-twin
related: budget-guard, context-window, breakdown-chart, segmented-control
---

## Overview

The “Usage” card of a SaaS or AI product: how many of the plan's credits are spent, on what, and what's left before
they reset. One large meter splits the credits into categories (Chat, Search, Image …) with a legend, an optional
sparkline shows usage per day, and thin meters below cover plan limits such as seats and storage. From `warnAt` the
card warns with an amber dot and “Running low”; at 100% it says “Limit reached” and the button changes from
“Upgrade” to “Add credits”. Switching the period rolls every number to its new value while the bars glide.

## When to use

- A billing, plan or account page that shows what's been used this period and when it resets.
- AI products that sell credits and spend them across several features.
- Next to the upgrade or top-up flow, so people see why they need it.

## When not to use

- Spend and token limits of a single live agent run – use `budget-guard`.
- How full a model's context window is – use `context-window`.
- An analysis of usage over many dimensions or periods – use `breakdown-chart`.

## Anatomy

1. **Period switch** `.ui-um__switch` – picks the period shown; only there with two or more `periods`
2. **Amount** `.ui-um__amount` – credits used, of the total, with the share beside it
3. **Credits bar** `.ui-um__bar` – the meter, split into one segment per category
4. **Legend** `.ui-um__legend` – each category with its value and share
5. **Per day** `.ui-um__spark` – the daily sparkline; only there with `daily`
6. **Limits** `.ui-um__limits` – thin meters for seats, storage, projects
7. **Button** `.ui-um__action` – “Upgrade”, or “Add credits” near and at the limit

## Looks

Standard sets a white card on the gray tray, with what's left and the button on the tray below it; the categories
are shades of blue, then grays. Clean is one white card with hairline shadows: what's left and the button sit in its
last row, and the categories are tints of the accent blue. Both have the same parts and keys; `layout="wide"` uses the
full width and two columns from 640 px.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the period switch, the credits bar, the per-day sparkline and the button |
| ← / → or ↑ / ↓ | Period switch: picks the previous or next period. Credits bar: moves to the previous or next category and reads it. Sparkline: moves a day back or on |
| Home / End | Credits bar: first or last category. Sparkline: first or last day |
| Escape | Clears the highlighted category or day; also closes a tooltip opened by hover, wherever focus is |
| Enter / Space | On the button: fires `tc-upgrade` |

## Screen readers

The host is a `region` named by the heading. The credits bar is a group (“4,200 of 10,000 credits used – arrow keys
read each category”) holding a `meter` (“Credits used”, value text “4,200 of 10,000 credits”); each arrow press says
the category in a status region (“Chat: 4,200 credits, 52%”). When the state changes the same region says so
(“Usage: running low, 82% of credits used”, “Usage: limit reached, 10,000 of 10,000 credits used”). The period
switch is a `radiogroup` named “Period”. The sparkline is a `slider` (“Usage per day”) whose value text is the day
(“Oct 3: 260 credits”) or the average. Each limit is a `meter` with value text such as “3.2 of 5 GB”, plus “close to
the limit” or “at the limit”; an unlimited one is an image named like “Projects: 14, unlimited”.

## Content

- Name categories after the features people use – “Chat”, “Image” – not internal meter names.
- Write `unit` in the plural, lower case: “credits”, “tokens”; it follows every number.
- Keep `plan` to the plan's name (“Pro plan”); the reset line next to it is written for you (“Resets in 9 days”).
- Make `upgradeLabel` and `topUpLabel` say what happens: “Upgrade”, “Add credits”, “Buy more”.

## Do

- Pass `resetAt` so people know when the credits come back.
- Prevent `tc-period-change` (or pass `period` in React) and swap in the matching `used`, `limits` and `daily`.
- Set `warnAt` to where running out starts to hurt – 0.8 by default.

## Don't

- Don't use more than five categories – the colours repeat after five; group the rest as “Other”.
- Don't hide the button at the limit – that's when people need it most.
- Don't show limits that can't be reached; leave `total` out for an unlimited one instead of a huge number.

## Example

```html
<tc-usage-meter id="usage" plan="Pro plan" total="10000"></tc-usage-meter>

<script type="module">
  import "trenchcoat/usage-meter";
  import "trenchcoat/tokens.css";

  const meter = document.querySelector("#usage");
  meter.used = [
    { label: "Chat", value: 4200 },
    { label: "Search", value: 1800 },
    { label: "Image", value: 1300 },
  ];
  meter.limits = [{ label: "Seats", used: 8, total: 10 }, { label: "Storage", used: 3.2, total: 5, unit: "GB" }];
  meter.resetAt = "2026-11-01";
  meter.addEventListener("tc-upgrade", (e) => console.log("Upgrade from", e.detail.state));
</script>
```

```tsx
import { useState } from "react";
import { UsageMeter, type UsageItem, type UsagePeriod } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const periods: UsagePeriod[] = [
  { id: "current", label: "This month" },
  { id: "last", label: "Last month" },
];
const usage: Record<string, UsageItem[]> = {
  current: [{ label: "Chat", value: 4200 }, { label: "Search", value: 1800 }],
  last: [{ label: "Chat", value: 5100 }, { label: "Search", value: 2600 }],
};

export function Usage({ onUpgrade }: { onUpgrade: () => void }) {
  const [period, setPeriod] = useState("current");
  return (
    <UsageMeter
      plan="Pro plan"
      total={10000}
      used={usage[period]}
      periods={periods}
      period={period}
      onPeriodChange={setPeriod}
      onUpgrade={onUpgrade}
    />
  );
}
```
