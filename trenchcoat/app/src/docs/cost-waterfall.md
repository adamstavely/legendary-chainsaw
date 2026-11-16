---
pattern: list
status: new
related: trace-waterfall, run-receipt, waterfall-chart, spend-breakdown
---

## Overview

Where the money and the tokens of one agent run went. Every LLM call, tool call and sub-agent is a step of a
waterfall: its bar starts where the steps before it left off, so the bars step across to the total and the long ones
are where the money went. Each row says the step's name, kind, model, tokens or cost, and time; the costliest step is
in the accent and marked "Costliest", and the total sits under them all. Cost / Tokens switches what the bars measure,
and By cost / In order puts the most expensive step on top or keeps the run's order. In a live run new steps appear,
the bars glide to their new places and the total rolls up to its new figure. A row unfolds its details below it.

## When to use

- Showing what an agent run cost and which steps spent it – next to a chat, in a run log or on a billing page.
- Finding the expensive step: the long bars are where the money went.
- Live runs, where new steps appear and the totals climb while the agent works.

## When not to use

- When each step ran and how long it took – use `trace-waterfall`.
- A printable cost record with tables per model and tool – use `run-receipt`.
- A general bridge from one figure to another – use `waterfall-chart`.
- Spend across many runs, by model, feature or team – use `spend-breakdown`.

## Anatomy

1. **Switches** `.ui-cwf__bar` – Cost / Tokens and By cost / In order, each a radio group `.ui-cwf__seg`
2. **Steps** `.ui-cwf__rows` – a row per step `.ui-cwf__row`: its kind mark `.ui-cwf__mark`, name `.ui-cwf__title` and kind `.ui-cwf__kind`, model `.ui-cwf__model`, bar `.ui-cwf__step`, value `.ui-cwf__value` and time `.ui-cwf__time`
3. **Details** `.ui-cwf__detail` – model, cost, tokens in and out, time, share of the total, input and output
4. **Total** `.ui-cwf__row--total` – the total bar and figure `.ui-cwf__total-value`
5. **Empty** `.ui-cwf__empty` – "No steps yet"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Each bar starts where the one above it ended, with a dashed riser joining them; the costliest step's bar is in
the accent, the rest are quiet gray, and the total's bar is the strong ink. The kinds have a coloured mark of their own
shape – a circle for LLM calls, a square for tools, a diamond for sub-agents – and their name in words. The header's
right side repeats the total. A page can set `--tc-cwf-bar-h` (a bar's height) and the kind inks `--tc-cwf-llm`,
`--tc-cwf-tool` and `--tc-cwf-subagent`. Narrower than 520 px, the model and time columns are left out; the details
still have them.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the two switches and the steps – one stop each |
| ← / → | Picks the other option of a switch |
| ↑ / ↓ | Moves between steps |
| Home / End | Goes to the first or last step |
| Enter / Space | Opens or closes a step's details |

## Screen readers

The switches are radio groups named "Measure" and "Order". The steps are a list of buttons, each read with its name,
kind, model, value and time, and saying whether its details are expanded; the details are a region named after the
step. The bars are drawn and hidden – the value in words says the same.

## Content

- Give each step a short name that says what it did ("Write two pages"), and the model as the provider writes it.
- `cost` is in the element's `currency`; amounts under a cent keep more decimals so they don't read as zero.
- Pass `tokensIn` and `tokensOut` for model calls so Tokens has something to show; tools usually have none.
- Mark a step that's still going with `running`.

## Do

- Keep the default By cost order when the question is "where did the money go".
- Use In order when the page also shows the run's trace, so the rows line up with it.

## Don't

- Don't mix currencies in one run – the element doesn't convert.
- Don't use it for spend over days and weeks – it shows one run.

## Example

```html
<tc-cost-waterfall id="costs" subtitle="Q3 water-quality report"></tc-cost-waterfall>

<script type="module">
  import "@adamstavely/trenchcoat/cost-waterfall";
  import "@adamstavely/trenchcoat/tokens.css";

  const costs = document.querySelector("#costs");
  costs.steps = [
    { id: "plan", name: "Plan the report", kind: "llm", model: "large-1", tokensIn: 1840, tokensOut: 412, cost: 0.0584, duration: 2300 },
    { id: "research", name: "Researcher", kind: "subagent", model: "small-2", tokensIn: 14200, tokensOut: 1130, cost: 0.0412, duration: 13600 },
    { id: "pdf", name: "PDF reader", kind: "tool", cost: 0.024, duration: 6100 },
    { id: "write", name: "Write two pages", kind: "llm", model: "large-1", tokensIn: 12400, tokensOut: 2210, cost: 0.3312, duration: 16300 },
  ];
  costs.addEventListener("tc-measure-change", (e) => console.log(e.detail.measure));
</script>
```

```tsx
import { useState } from "react";
import { CostWaterfall, type CostStep, type CostWaterfallMeasure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunCosts({ steps }: { steps: CostStep[] }) {
  const [measure, setMeasure] = useState<CostWaterfallMeasure>("cost");
  return <CostWaterfall subtitle="Q3 water-quality report" steps={steps} measure={measure} onMeasureChange={setMeasure} />;
}
```
