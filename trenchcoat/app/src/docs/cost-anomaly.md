---
pattern: none
status: new
related: top-spenders, seat-usage, budget-guard, trace-waterfall
---

## Overview

One spend spike and what caused it. A headline says how far over expected it went – “$1,240 over expected on 14 Nov”
– and a second line puts it in numbers: “Spent $1,640 against an expected $400 – 310% above”. Under it, a small chart
of daily spend: bars, the normal range as a band and the expected spend as a dashed line, with the spike's bar marked,
summed up in a sentence and switchable to a table. Then what drove the extra cost, the likeliest first, each with its
share; the evidence the page supplies, such as the costliest runs during the spike; and Set a limit, Investigate and
Mark as expected, with Undo.

## When to use

- An alert or admin page, when spend jumps well outside its usual range.
- A spike someone has to look at and either act on or explain.

## When not to use

- Who spends the most over a period – use `top-spenders`.
- Capping a live run's spend – use `budget-guard`.
- Where one run's time and money went – use `trace-waterfall`.

## Anatomy

1. **Status** `.ui-coa__status` – Open or Expected, as a mark and a word
2. **Headline** `.ui-coa__headline` – how far over expected, and when
3. **Chart** `.ui-coa__chart` – daily spend, the normal band and expected line, the spike's bar marked
4. **Caption** `.ui-coa__caption` – the chart in a sentence, and Show as table
5. **Causes** `.ui-coa__causes` – what drove it, each with its share of the extra cost
6. **Evidence** `.ui-coa__evidence` – runs or requests during the spike, as buttons
7. **Actions** `.ui-coa__actions` – Set a limit, Investigate and Mark as expected, or Undo

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The spike's bar and the cause bars use `--tc-status-danger-solid`; the other days are
`--tc-chart-neutral` and the normal range `--tc-fill-subtle`. Once marked as expected, the status pill goes quiet.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Show as table, the evidence rows and the actions |
| Enter / Space | Presses the focused button |

After Mark as expected, focus moves to Undo; after Undo, back to Mark as expected.

## Screen readers

The chart is hidden; its caption says what it shows: “Daily spend from 1 Nov to 14 Nov. Usually $340–$470 a day; on 14
Nov it was $1,640.” Show as table is a toggle button (`aria-pressed`) that puts a real table with a caption in the
chart's place. Causes and evidence are lists under their own headings. Set a limit adds the cause's name for screen
readers – “Set a limit on Invoice matcher”. A status change is confirmed politely: “Marked as expected”.

## Content

- Give two weeks or so of `days` around the spike, each with `low` and `high` for the band, or `expected` alone.
- Put the likeliest cause first; shares are of the extra cost, not the whole day's.
- Keep evidence to the few runs or requests that explain it, costliest first.

## Do

- Say why in a cause's `note` – “Retried every invoice up to 6 times after Thursday's parser change”.
- Let Mark as expected record who decided and why, on your side.

## Don't

- Don't show a spike without the normal range – the band is what makes it read as a spike.
- Don't use it for slow drift; it's for one day or a few.

## Example

```html
<tc-cost-anomaly id="spike" locale="en-US"></tc-cost-anomaly>

<script type="module">
  import "@adamstavely/trenchcoat/cost-anomaly";
  import "@adamstavely/trenchcoat/tokens.css";

  const spike = document.querySelector("#spike");
  const day = 86400000;
  const start = Date.UTC(2026, 10, 8);
  spike.days = [410, 395, 420, 388, 402, 1640].map((spend, i) => ({ date: start + i * day, spend, expected: 400, low: 340, high: 460 }));
  spike.causes = [
    { id: "invoice", kind: "agent", name: "Invoice matcher", share: 0.78, note: "Retried every invoice after a parser change" },
    { id: "large-1", kind: "model", name: "large-1", share: 0.22 },
  ];
  spike.evidence = [{ id: "r1", label: "Run 8f2c · Invoice matcher", detail: "412k tokens · 6 retries", cost: 38 }];
  spike.addEventListener("tc-set-limit", (e) => console.log("limit", e.detail.target?.name));
</script>
```

```tsx
import { CostAnomaly, type AnomalyCause, type CostDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start = Date.UTC(2026, 10, 8);
const days: CostDay[] = [410, 395, 420, 388, 402, 1640].map((spend, i) => ({ date: start + i * 86400000, spend, expected: 400, low: 340, high: 460 }));
const causes: AnomalyCause[] = [{ id: "invoice", kind: "agent", name: "Invoice matcher", share: 0.78 }];

export function Spike() {
  return <CostAnomaly days={days} causes={causes} onSetLimit={(target) => console.log(target?.name)} />;
}
```
