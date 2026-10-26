---
pattern: disclosure
status: stable
related: project-card, kpi-chart, change-summary, compact-breakdown
---

## Overview

An A/B test in two lines – its name, status, who is ahead and by how much, next to a tiny column per variant – that
unfolds when people point at it or open it. Open, it lists the variants with their value and lift against the
control, and a switch moves between metrics: the numbers roll, the bars glide and the leader follows. Pointing at a
variant lights up its column and says how many visitors it had and how confident the result is. Pressing a variant
picks it as the winner, and an action – “Ship One-page checkout” – appears for it.

## When to use

- A list or dashboard of experiments, where each stays small until someone looks closer.
- Tests with two to four variants and one to three metrics.
- Calling a winner and acting on it (ship, roll out, stop) from where the result is shown.

## When not to use

- A project with subtasks and people – use `project-card`.
- One metric over time – use `kpi-chart`.
- Several metrics that moved since last time, without variants – use `change-summary`.
- A total split into its parts – use `compact-breakdown`.

## Anatomy

1. **Chart** `.ui-xc__chart` – one column per variant, linked to its row
2. **Status** `.ui-xc__tag` – where the test stands, with `note` beside it
3. **Leader** `.ui-xc__lead` – the variant ahead and its lift, or “No lift yet”
4. **Metric switch** `.ui-xc__switch` – picks the metric every number shows
5. **Variant** `.ui-xc__row` – key, name, value, lift against the control and a bar; press to pick it
6. **Tray** `.ui-xc__foot` – what's under the pointer or picked, and the action

## Looks

Standard sets the white card on a gray tray, the metric switch as a segmented control with a sliding thumb and the
line and action on the tray below. Clean is one white card with hairline shadows: the metrics become separate
outlined options, the tray its last row, and icons a size up with thinner lines. Both roll the numbers and link
columns to rows the same way.

## Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the head: opens or closes the card. On a variant: picks it as the winner, or clears the pick |
| ← → ↑ ↓ | In the metric switch: picks the previous or next metric, wrapping |
| Home / End | In the metric switch: picks the first or last metric |
| Escape | Closes the card and moves focus to the head |
| Tab | Moves through the head, and with the card open, the metric switch, the variants and the action |

## Screen readers

The head is a button with `aria-expanded` that reads the test, its status and the leader: “Checkout redesign,
Running, One-page checkout is ahead by 18.9 percent”. The metric switch is a radio group named “Metric”. Variants are
toggle buttons with `aria-pressed` in a group named “Winner”, each named with what the row shows and what the
pointer would reveal: “B One-page checkout 3.71% +18.9%, up 18.9 percent, better, 12,391 visitors, 97% confidence”.
The chart is hidden. A polite status region says “One-page checkout picked”, or “Couldn’t finish One-page checkout –
try again” when the action's promise rejects; while it runs the action button is `aria-busy`.

## Content

- Name the test after what changes: “Checkout redesign”.
- Give variants a one-letter `key` and a name that says what's different: “One-page checkout”, “Express pay first”.
- Format each metric the way people read it (`format`: “3.12%”, “$4.86”) and set `lowerIsBetter` for bounce rate
  or cost, so a drop reads as better.
- Keep `note` to where the test is in time: “Day 9 of 14”.
- Make the action's `label` a function of the picked variant, so the button names it: “Ship One-page checkout”.

## Do

- Pass `confidence` per metric so people can see whether a lift is worth acting on.
- Return a promise from the action's `onClick` for work that takes time – the card waits and offers a retry.
- Update `status` and `note` once the action has run (“Concluded”, “Shipped today”).

## Don't

- Don't add more than four variants – the columns and rows stop fitting.
- Don't show values without a control: the first variant is the baseline unless one is marked `control`.
- Don't use the leader chip as the decision – it shows the biggest lift, not whether it's significant.

## Example

```html
<tc-experiment-card id="test" heading="Checkout redesign" note="Day 9 of 14"></tc-experiment-card>

<script type="module">
  import "trenchcoat/experiment-card";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#test");
  card.status = { label: "Running", tone: "green" };
  card.metrics = [{ id: "conversion", label: "Conversion", format: (n) => `${n.toFixed(2)}%` }];
  card.variants = [
    { id: "a", key: "A", name: "Current checkout", control: true, visitors: 12480, values: { conversion: 3.12 } },
    { id: "b", key: "B", name: "One-page checkout", visitors: 12391, values: { conversion: 3.71 }, confidence: { conversion: 97.4 } },
  ];
  card.action = { label: (v) => `Ship ${v.name}`, onClick: (v) => console.log("ship", v.id) };
  card.addEventListener("tc-winner-change", (e) => console.log(e.detail.winner));
</script>
```

```tsx
import { useState } from "react";
import { ExperimentCard, type ExperimentMetric, type ExperimentVariant } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const metrics: ExperimentMetric[] = [{ id: "conversion", label: "Conversion", format: (n) => `${n.toFixed(2)}%` }];
const variants: ExperimentVariant[] = [
  { id: "a", key: "A", name: "Current checkout", control: true, visitors: 12480, values: { conversion: 3.12 } },
  { id: "b", key: "B", name: "One-page checkout", visitors: 12391, values: { conversion: 3.71 }, confidence: { conversion: 97.4 } },
];

export function Checkout() {
  const [winner, setWinner] = useState<string | null>(null);
  return (
    <ExperimentCard
      title="Checkout redesign"
      status={{ label: "Running", tone: "green" }}
      note="Day 9 of 14"
      variants={variants}
      metrics={metrics}
      winner={winner}
      onWinnerChange={setWinner}
      action={{ label: (v) => `Ship ${v.name}`, onClick: (v) => console.log("ship", v.id) }}
    />
  );
}
```
