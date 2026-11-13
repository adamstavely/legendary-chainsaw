---
pattern: list
status: new
related: seat-usage, cost-anomaly, budget-burn, usage-meter
---

## Overview

Who is behind most of the AI spend, ranked. Each row is a member, a team, an API key or an agent: its rank, its name
and kind with the model it used most, its share of the spend as a bar and a percentage, the amount, the change
against the previous period in words – “Up 42%”, “Down 6%”, “No change” – and a sparkline of its daily spend. Chips
filter by kind, and the header totals the spend shown. Past `limit` rows, the long tail folds into one line: “and 38
others – $1,204”. Opening a row fires `tc-spender-open`, for the page to show where that spend went.

## When to use

- A spend or usage admin page, to see who to talk to first when the bill goes up.
- Comparing the cost of agents, teams or API keys within one period.

## When not to use

- Spend against each budget – use `budget-burn`.
- One sudden spike and what caused it – use `cost-anomaly`.
- Seats paid for against seats used – use `seat-usage`.
- One plan's usage against its limit – use `usage-meter`.

## Anatomy

1. **Kind chips** `.ui-topsp__chips` – All and each kind present, as toggle buttons
2. **Rank** `.ui-topsp__rank` – the position in the current filter
3. **Who** `.ui-topsp__who` – the name, the kind and the top model
4. **Share** `.ui-topsp__share` – the share of the spend as a bar and a percentage
5. **Money** `.ui-topsp__money` – the amount and the change in words, with an arrow
6. **Sparkline** `.ui-topsp__spark` – daily spend through the period
7. **Tail** `.ui-topsp__tail` – everyone past `limit`, folded into one line

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Share bars use the meter tokens and the sparkline `--tc-chart-1`. A rise reads in
`--tc-status-warning-fg` and a fall in `--tc-status-success-fg`, always with an arrow and the words. Narrow, the
sparkline goes and the share bar moves under the name.

## Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row |
| Tab | Moves between the chips and the rows |

## Screen readers

The rows are an ordered list of buttons, named by the heading. Each button reads the whole row: “1. Audit, Team;
$4,210, 37% of the spend; Up 42% on the previous period; mostly large-1”. The drawn parts are hidden. The chips are a
group labelled “Show” of toggle buttons (`aria-pressed`), and a change is confirmed politely: “Showing agents, 3”.

## Content

- Give every spender for the period; the element ranks them and works out each share from the ones shown by the
  current filter.
- `change` is a fraction against the previous period: 0.42 for up 42%. Leave it out for a spender that's new.
- Name API keys by what they're for (“ledger-sync key”), never by the key itself.

## Do

- Set `limit` to what fits the page; the tail line keeps the total honest.
- Put the period in `description` – “October · against September”.

## Don't

- Don't mix currencies – `currency` applies to every row.
- Don't read a rise as misuse by itself; open the row and look at where it went.

## Example

```html
<tc-top-spenders id="spenders" description="October · against September" limit="5"></tc-top-spenders>

<script type="module">
  import "@adamstavely/trenchcoat/top-spenders";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#spenders");
  list.spenders = [
    { id: "audit", name: "Audit", kind: "team", spend: 4210, change: 0.42, topModel: "large-1", daily: [120, 130, 150, 170, 210] },
    { id: "research", name: "Research", kind: "team", spend: 3080, change: -0.06, topModel: "large-1" },
    { id: "policy", name: "Policy Q&A", kind: "agent", spend: 2310, change: 0.18, topModel: "small-2" },
    { id: "okafor", name: "Sam Okafor", kind: "member", spend: 640, change: 0.25 },
  ];
  list.addEventListener("tc-spender-open", (e) => console.log(e.detail.id));
</script>
```

```tsx
import { TopSpenders, type Spender } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const spenders: Spender[] = [
  { id: "audit", name: "Audit", kind: "team", spend: 4210, change: 0.42, topModel: "large-1" },
  { id: "policy", name: "Policy Q&A", kind: "agent", spend: 2310, change: 0.18, topModel: "small-2" },
];

export function Spenders() {
  return <TopSpenders description="October · against September" spenders={spenders} onSpenderOpen={(id) => console.log(id)} />;
}
```
