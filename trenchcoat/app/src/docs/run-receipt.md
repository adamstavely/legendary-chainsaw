---
pattern: none
status: new
related: trace-waterfall, run-manifest, budget-burn, run-log
---

## Overview

What one agent run cost and where the money went, set out like a receipt. The header names the agent and the run –
its id with a copy button – when it ran, how long it took and how it ended, in words. Line items follow: each model
with its calls and input, output and cached tokens, each tool with its calls, then web lookups and retries. Below
them come the subtotal, the cache savings taken off it and the total, then the costliest step with its share of the
total. Open trace and Download CSV close the receipt; the CSV is built in the browser from the same lines.

## When to use

- The cost panel beside a finished run, in an agent's run history or a run's detail page.
- Answering "why did this run cost so much?" before opening the full trace.
- A record to download and attach to an expense or a budget review.

## When not to use

- Where the time went, step by step – use `trace-waterfall`.
- Spend across many runs or over a period – use `budget-burn`.
- What it takes to reproduce a run – use `run-manifest`.
- Every run on one line – use `run-log`.

## Anatomy

1. **Facts** `.ui-rrc__meta` – the run id `.ui-rrc__id` with Copy `.ui-rrc__copy`, when, duration and status `.ui-rrc__status`
2. **Line items** `.ui-rrc__lines` – tables of models `.ui-rrc__models`, tools and other lines, each row `.ui-rrc__line`
3. **Totals** `.ui-rrc__totals` – subtotal, cache savings `.ui-rrc__sum--savings` and total `.ui-rrc__sum--total`
4. **Costliest step** `.ui-rrc__costliest` – its name, cost and share of the total
5. **Actions** `.ui-rrc__actions` – Open trace `.ui-rrc__trace` and Download CSV `.ui-rrc__download`
6. **Empty** `.ui-rrc__empty` – "Nothing was charged for this run" when there are no lines

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Dashed rules divide the facts, the lines and the totals, like a printed receipt. The status has a mark and a word
as well as its colour: a check for Succeeded, a cross for Failed, a slash for Cancelled and a dot for Still running.
Cache savings are green and written as a negative amount. The header's right side repeats the total. A page can set
`--tc-rrc-rule`, the dashed rule, and `--tc-rrc-icon`, the size of the small icons. When the card is narrower than
420 px the cached-tokens column is left out and the two actions share the row.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Copy, Open trace and Download CSV |
| Enter / Space | Presses the focused button |

## Screen readers

The line items are real tables with captions (Models, Tools, Other), column headers and row headers, so each amount is
read with its item and column. The facts and the totals are description lists. The status mark is hidden; the word is
read. Copy's name is "Copy run ID", and a `role="status"` says "Run ID copied." or that copying failed.

## Content

- Give a model's `cost` before cache savings, and what caching saved in `cacheSavings`; the receipt takes the savings
  off the subtotal.
- Pass `steps` with each step's cost to call out the costliest one; leave it empty to leave the callout out.
- Amounts below a cent keep four decimals so they don't read as zero.
- Set `currency` to the currency your amounts are in; the receipt doesn't convert.

## Do

- Keep model names as the provider writes them, so they match the trace and the invoice.
- Use `lookups` and `retries` only when they cost something; null leaves the line out.

## Don't

- Don't put secrets or personal data in the run id or the agent name – both are shown and copied.
- Don't use it as a live meter while a run is going; show `status: "running"` only to say the receipt isn't final.

## Example

```html
<tc-run-receipt id="receipt" agent="Invoice matcher"></tc-run-receipt>

<script type="module">
  import "@adamstavely/trenchcoat/run-receipt";
  import "@adamstavely/trenchcoat/tokens.css";

  const receipt = document.querySelector("#receipt");
  receipt.runId = "run_8f2c41d0";
  receipt.at = Date.UTC(2026, 10, 3, 9, 14);
  receipt.duration = 48600;
  receipt.models = [
    { model: "large-1", calls: 6, inputTokens: 48200, outputTokens: 3140, cachedTokens: 31600, cost: 0.3124, cacheSavings: 0.0853 },
    { model: "small-2", calls: 14, inputTokens: 22900, outputTokens: 1820, cost: 0.0211 },
  ];
  receipt.tools = [{ tool: "ledger.lookup", calls: 9, cost: 0.0045 }];
  receipt.steps = [{ name: "Match purchase order lines", cost: 0.2268 }];
  receipt.addEventListener("tc-trace-open", (e) => console.log("open trace", e.detail.runId));
</script>
```

```tsx
import { RunReceipt, type RunReceiptModel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunCost({ runId, models }: { runId: string; models: RunReceiptModel[] }) {
  return <RunReceipt agent="Invoice matcher" runId={runId} models={models} onTraceOpen={(id) => console.log("open trace", id)} />;
}
```
