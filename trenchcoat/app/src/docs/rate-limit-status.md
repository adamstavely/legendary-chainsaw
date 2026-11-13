---
pattern: list
status: new
related: usage-meter, budget-guard, model-routing, fallback-chain
---

## Overview

How close each model is to its provider's rate limits, this minute. Each row is one provider and model: requests,
input tokens and output tokens a minute, each a meter against its limit with the numbers beside it. The headroom says
it in words – Plenty, Near limit, or Limited with a countdown to when the window resets – taken from the fullest of
the three meters. Under the meters sit how many requests were turned away with a 429 in the last hour, and a
sparkline of the last hour's peak use against a dashed line at the limit. The tightest rows come first.

## When to use

- An operations or settings page for teams calling model providers directly, where hitting a limit means failed or
  slow requests.
- Deciding whether to ask a provider for a higher tier, or to spread traffic onto another model.
- A health panel beside a fallback setup, to see why traffic moved.

## When not to use

- Plan usage and credits for a whole account – use `usage-meter`.
- Spend against a budget for one run – use `budget-guard`.
- Which model a request is routed to, and when it falls back – use `model-routing` or `fallback-chain`.

## Anatomy

1. **Sort** `.ui-rlst__sort` – Tightest first or By name, a native select
2. **Row** `.ui-rlst__row` – one provider and model
3. **Model** `.ui-rlst__model` – the model's name, with the provider after it
4. **Tier** `.ui-rlst__tier` – the account's tier with that provider
5. **Headroom** `.ui-rlst__headroom` – a mark and a word: Plenty, Near limit, or Limited with the reset countdown
6. **Meter** `.ui-rlst__meter` – one limit: requests, input tokens or output tokens a minute
7. **429s** `.ui-rlst__throttled` – requests turned away in the last hour
8. **Sparkline** `.ui-rlst__spark` – the last hour's peak use, with the limit as a dashed line and the peak in words

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Meters below 70% use the meter colour; near and over the limit they take the warning and danger
tones, and the headroom badge says so in words with its own mark. Below 520 px the three meters stack.

## Keyboard

The rows aren't interactive; the sort select is the one tab stop.

| Key | What it does |
|---|---|
| Tab | Moves to the sort select |
| ↑ / ↓ | In the select, changes the order |

## Screen readers

The rows are a list named by the heading. Each meter is a `meter` named by its label – “Input tokens / min” – with a
value text that reads the numbers in full: “812,000 of 800,000 input tokens a minute, 101%”. The headroom is text, so
“Limited – resets in 18 s” is read as it is; the countdown doesn't announce itself every second. The sparkline is
hidden and its peak is said in words: “Peak in the last hour: 102% of the limit”. Status is never colour alone – each
headroom has a mark (a tick, a warning sign or a no-entry sign) and a word.

## Content

- Name the model as the provider does (“large-1”), and the provider plainly.
- Give `resetAt` for limited rows, so the countdown can say when it clears.
- Keep the history to the last hour, one point a minute; values are shares of the tightest limit, so 1 is the line.

## Do

- Pass `now` when the page already keeps a clock, so the countdown matches the rest of the page.
- Leave the default sort on, so the rows that need attention come first.
- Show the tier, so people know what raising it would mean.

## Don't

- Don't show limits you don't enforce – leave that metric out of the row.
- Don't use the meters for spend; they're about requests and tokens a minute.
- Don't rely on the tones – the headroom words are the message.

## Example

```html
<tc-rate-limit-status id="limits" heading="Rate limits"></tc-rate-limit-status>

<script type="module">
  import "@adamstavely/trenchcoat/rate-limit-status";
  import "@adamstavely/trenchcoat/tokens.css";

  const limits = document.querySelector("#limits");
  limits.rows = [
    {
      id: "large-1",
      provider: "Model provider",
      model: "large-1",
      tier: "Tier 3",
      requests: { used: 4620, limit: 5000 },
      inputTokens: { used: 812000, limit: 800000 },
      outputTokens: { used: 96000, limit: 160000 },
      resetAt: Date.now() + 18000,
      throttled: 37,
      history: [0.7, 0.75, 0.82, 0.9, 0.96, 1.02],
    },
    {
      id: "small-2",
      provider: "Model provider",
      model: "small-2",
      tier: "Tier 3",
      requests: { used: 3900, limit: 10000 },
      inputTokens: { used: 1150000, limit: 2000000 },
    },
  ];
  limits.addEventListener("tc-sort-change", (e) => console.log(e.detail.sort));
</script>
```

```tsx
import { useState } from "react";
import { RateLimitStatus, type RateLimitRow, type RateLimitSort } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Limits({ rows, now }: { rows: RateLimitRow[]; now: number }) {
  const [sort, setSort] = useState<RateLimitSort>("tightest");
  return <RateLimitStatus title="Rate limits" rows={rows} now={now} sort={sort} onSortChange={setSort} />;
}
```
