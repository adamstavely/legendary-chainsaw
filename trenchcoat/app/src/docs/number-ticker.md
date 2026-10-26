---
pattern: none
status: stable
related: text-reveal, kpi-chart, usage-meter
---

## Overview

A number that changes like an odometer. Every digit rolls to its new value – up when the number grows, down when it
shrinks – so people see a figure move rather than jump, and can tell at a glance whether it went up or down. The
first time it scrolls into view it counts in from zero. Formatting comes from `Intl.NumberFormat`, so currency
signs, separators and percent signs stay where they are and only the digits move.

## When to use

- Headline figures on a dashboard or landing page: revenue, users, a conversion rate.
- A live number that updates every few seconds, where the change itself is worth noticing.
- Counters people have just affected – a total after they add an item.

## When not to use

- A number inside a chart with its own axis and trend – use `kpi-chart`.
- Usage against a limit, where the bar matters more than the digits – use `usage-meter`.
- Text that should arrive with motion, not a number – use `text-reveal`.
- Numbers in tables and forms that people read and compare row by row – plain text is faster to read.

## Anatomy

1. **Digit column** `.ui-nt__col` – one digit, rolling through 0–9
2. **Separator** `.ui-nt__static` – a currency sign, comma, point or percent sign that stays still

## Screen readers

The rolling columns are hidden; screen readers read one visually hidden copy of the formatted number (“$128,450”).
The element is a polite live region, so each new value is announced once, after it changes – not digit by digit.
For numbers that change on their own every few seconds, set `aria-live="off"` on the element so they don't
interrupt, and give people a way to pause the updates.

## Content

- Set `locale` explicitly when the format matters – without it the browser's own locale decides separators.
- Put the label (“Revenue”) next to the number, outside the element; it shows the number only.
- Round with `format` (`maximumFractionDigits`) rather than passing pre-rounded strings – `value` is a number.

## Do

- Use `delay` to stagger several tickers that come into view together.
- Keep `duration` around the default 900 ms; much longer and people wait for the number to settle.
- Give tabular figures room: the element turns on `tabular-nums`, so columns don't shift as digits change.

## Don't

- Don't animate every number on a page – motion loses meaning when everything moves.
- Don't use it for numbers that change many times a second; the rolls never settle.

## Example

```html
<p>Revenue <tc-number-ticker id="revenue" value="128450" locale="en-US"></tc-number-ticker></p>

<script type="module">
  import "trenchcoat/number-ticker";
  import "trenchcoat/tokens.css";

  const ticker = document.querySelector("#revenue");
  ticker.format = { style: "currency", currency: "USD", maximumFractionDigits: 0 };
  setTimeout(() => (ticker.value = 131200), 3000);
</script>
```

```tsx
import { NumberTicker } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Revenue({ amount }: { amount: number }) {
  return (
    <p>
      Revenue{" "}
      <NumberTicker value={amount} locale="en-US" format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
    </p>
  );
}
```
