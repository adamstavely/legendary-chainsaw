---
pattern: listbox
status: new
related: budget-burn, capacity-bars, breakdown-chart, usage-meter
---

## Overview

Are dollars and people flowing to the work that matters most? Each priority tier – Top priority, High, Medium,
Watching, or your own – gets a row with three shares side by side: its share of the items (topics, projects), of the
budget and of the people, each a number and a bar. When a tier's budget or people share sits more than `threshold`
away from its share of items, the measure is flagged Over or Under, with an arrow, so a mismatch reads without colour.
The finding at the top says the biggest mismatch in one line – “Top priority is 9% of topics but draws 30% of the
budget.” – and the page can write its own.

## When to use

- Checking whether a portfolio's money and people follow its priorities: research topics, product bets, programs.
- A planning review, comparing the plan as allocated with a rebalanced one.
- Any split across ranked tiers where the share of resources should track the share of work.

## When not to use

- Spend against each item's own budget – use `budget-burn`.
- How loaded each person is – use `capacity-bars`.
- A share of a whole across categories with no ranking – use `breakdown-chart`.
- Use against a single limit – use `usage-meter`.

## Anatomy

1. **Finding** `.ui-invb__finding` – the biggest mismatch in one line, or the page's own
2. **Tier** `.ui-invb__tier` – the tier's badge and name
3. **Measure** `.ui-invb__measure` – a share: the value, its percentage and a bar
4. **Flag** `.ui-invb__flag` – Over or Under, with an arrow, when a share is off balance
5. **Total** `.ui-invb__total` – the items, budget and people across every tier

## Looks

Standard is a white card on a gray tray, with the header on the tray and medium-weight column names. Clean is one
white card with the header as its first row. The bars use `--tc-fill-strong` for items, `--tc-chart-1` for budget and
`--tc-chart-2` for people in both.

## Keyboard

The tiers are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next tier |
| Home / End | Moves to the first or last tier |
| Enter / Space | Selects the tier, or clears it if it's selected |
| Escape | Clears the selected tier |
| Tab | Leaves the list |

## Screen readers

The tiers are a `listbox` named by the heading. Each tier is an option that reads every value in one go: “Top
priority: 18 topics, 9%; budget $14.2M, 30%, over-invested; people 38 FTE, 27%, over-invested”. The selected tier is
`aria-selected`, and selecting is confirmed in a polite status message, “Selected Top priority”, or “Selection
cleared”. The column names and bars repeat what the options say, so they're hidden.

## Content

- Order the tiers from most to least important – the finding names them as given.
- Set `item-label` to what the items are, plural: “topics”, “projects”, “bets”.
- Set `threshold` to the gap your team acts on; 0.1 (ten points) is the default.
- Write your own `finding` when the computed one misses the point, or set it to an empty string to hide it.

## Do

- Pair a selected tier with the list of its items, or with `budget-burn` filtered to it.
- Use the same tiers across pages, so a tier means one thing.

## Don't

- Don't mix currencies in one view – `currency` applies to every tier.
- Don't use it for fewer than two tiers – there's nothing to balance.
- Don't treat Over as bad by itself: top priorities may well deserve more than their share. The flag says where to
  look, not what to do.

## Example

```html
<tc-investment-balance id="balance" item-label="topics"></tc-investment-balance>

<script type="module">
  import "trenchcoat/investment-balance";
  import "trenchcoat/tokens.css";

  const balance = document.querySelector("#balance");
  balance.tiers = [
    { id: "p1", badge: "1", label: "Top priority", items: 18, budget: 14200000, people: 38 },
    { id: "p2", badge: "2", label: "High", items: 46, budget: 16800000, people: 49 },
    { id: "p3", badge: "3", label: "Medium", items: 64, budget: 9700000, people: 32 },
  ];
  balance.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

```tsx
import { useState } from "react";
import { InvestmentBalance, type InvestmentTier } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const tiers: InvestmentTier[] = [
  { id: "p1", badge: "1", label: "Top priority", items: 18, budget: 14200000, people: 38 },
  { id: "p2", badge: "2", label: "High", items: 46, budget: 16800000, people: 49 },
  { id: "p3", badge: "3", label: "Medium", items: 64, budget: 9700000, people: 32 },
];

export function Balance() {
  const [selected, setSelected] = useState<string | null>(null);
  return <InvestmentBalance tiers={tiers} selected={selected} onSelectedChange={setSelected} />;
}
```
