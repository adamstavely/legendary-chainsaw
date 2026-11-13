---
pattern: form
status: new
related: budget-guard, usage-meter, data-table, trace-waterfall
---

## Overview

What a bulk run will cost before it starts. A run fills so many rows times so many AI columns – that many cells –
and each cell sends tokens to a model, gets tokens back and, for columns that search the web, makes lookups. The card
does the sums and says them in words and numbers: the cost as a range (replies vary in length, so it's low to high),
the cells, tokens, lookups and how long the run should take at its concurrency. A table shows where the money goes,
the budget left is a meter with a warning when the run could go over it, and two choices make a big run safer: run
on a sample of rows first, and stop when spend reaches a cap. Start hands what was chosen to the app.

The sums are `estimateRun()`, exported for the page to use in its own checks.

## When to use

- Before a bulk AI run over a table – enrichment, classification, extraction – where the cost depends on how many
  rows and columns there are.
- When people should see the cost before they commit, and be able to try a sample or set a cap first.

## When not to use

- Watching spend while a run is going – use `budget-guard`.
- Usage over a billing period – use `usage-meter`.
- Where a finished run's time and money went, step by step – use `trace-waterfall`.

## Anatomy

1. **Header** – the shared card header: a calculator icon, the title, the line under it and the model's pill `.ui-rest__pill`
2. **Range** `.ui-rest__figure` – the cost from low to high, big
3. **Sentence** `.ui-rest__sentence` – the run in words: cells, tokens, lookups and time
4. **Figures** `.ui-rest__stats` – cells, tokens, web lookups and time side by side
5. **Breakdown** `.ui-rest__table` – input tokens, output tokens and web lookups, each with its amount, rate and cost
6. **Budget** `.ui-rest__budget` – what's left, how much of it the run uses, and a meter with the run's range on it
7. **Warning** `.ui-rest__notice` – when the run could go over, or is over, the budget
8. **Choices** `.ui-rest__options` – run on a sample first, and the spend cap
9. **Footer** `.ui-rest__foot` – the expected cost (or the sample's) and Start

## Looks

Standard sets the header on the gray tray above a white card, with Start on the tray below. Clean is one white card
with a shadow, the header its first row and the footer its last. Both show the same figures, table, budget and choices.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the sample checkbox, the cap field and Start |
| Space | Switches the sample run on or off |
| Enter / Tab out | Sets the cap typed into the field |
| Enter / Space on Start | Starts the run |

## Screen readers

The card is a `region` named by its heading. The breakdown is a real table with a caption. The budget is a `meter`
whose value reads as the range against what's left (“$1.36 – $2.26 of $10.00 left”). The cap field is a labelled
number field, described by its note; a cap that can't be used marks it invalid and says why. Start is `aria-disabled`
when there's nothing to run, with the reason as its description. Going over the budget or back under it, setting the
cap and starting are said once in a polite live region.

## Content

- Give each column its own averages when they differ – a column that reads web pages sends far more tokens in.
- Use averages from a real sample of the table, not guesses: the range is only as good as they are.
- Name the model the way the rest of the product does; it's the pill in the header.
- Set `spread` to how much reply length varies – 0.25 (±25%) suits short answers, more for free text.

## Do

- Start on a sample for runs over a few hundred rows, and let people check the answers before the rest.
- Pass the budget left, so the card can warn before the run goes over it.
- Halt the run when it reaches the cap the person set.

## Don't

- Don't show a single number as the cost – a range is honest about replies varying.
- Don't start a run that's over the budget without someone pressing Start.
- Don't use it for a live run – once it starts, switch to `budget-guard`.

## Example

```html
<tc-run-estimate id="estimate" rows="2000" lookup-price="0.005" budget="60" description="Vendor list · 3 AI columns"></tc-run-estimate>

<script type="module">
  import "@adamstavely/trenchcoat/run-estimate";
  import "@adamstavely/trenchcoat/tokens.css";

  const estimate = document.querySelector("#estimate");
  estimate.model = { name: "Analyst model", inputPrice: 3, outputPrice: 15 };
  estimate.columns = [
    { id: "category", name: "Category", tokensIn: 420, tokensOut: 40 },
    { id: "tier", name: "Risk tier", tokensIn: 900, tokensOut: 220 },
    { id: "site", name: "Website and HQ", tokensIn: 2400, tokensOut: 160, lookups: 2 },
  ];
  estimate.addEventListener("tc-start", (e) => console.log("start", e.detail.sample, e.detail.cap, e.detail.estimate.cost));
</script>
```

```tsx
import { RunEstimate, type RunEstimateColumn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const columns: RunEstimateColumn[] = [
  { id: "category", name: "Category", tokensIn: 420, tokensOut: 40 },
  { id: "tier", name: "Risk tier", tokensIn: 900, tokensOut: 220 },
  { id: "site", name: "Website and HQ", tokensIn: 2_400, tokensOut: 160, lookups: 2 },
];

export function VendorRunEstimate({ start }: { start: (sample: boolean, cap: number | null) => void }) {
  return (
    <RunEstimate
      title="Run estimate"
      rows={2000}
      columns={columns}
      model={{ name: "Analyst model", inputPrice: 3, outputPrice: 15 }}
      lookupPrice={0.005}
      budget={60}
      defaultSample
      onStart={(s) => start(s.sample, s.cap)}
    />
  );
}
```
