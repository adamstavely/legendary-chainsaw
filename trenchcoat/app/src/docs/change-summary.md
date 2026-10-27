---
pattern: landmark
status: stable
related: kpi-chart, breakdown-chart, usage-meter
---

## Overview

A short list of what moved since the last time someone looked: one metric per row, what happened to it in words,
and a mark that says whether that's good, bad or neither. It answers “what should I notice?” before anyone opens a
chart. The direction of the arrow and the tone are separate, so a rise can be bad (churn up) and a fall good
(response time down).

## When to use

- The top of a dashboard, a weekly email-style digest or a report, where three to six metrics changed.
- Summing up a period (“This week”, “Since Monday”) next to the detail it summarises.
- Changes that need a judgement as well as a number – the tone carries it.

## When not to use

- Showing how a metric moved over time – use `kpi-chart`.
- Showing what a total is made of – use `breakdown-chart`.
- Showing use against a limit or a plan – use `usage-meter`.

## Anatomy

1. **Header** – the shared card header: a boxed icon and the title, which also names the region
2. **Period** `.ui-cs__period` – the time the changes cover
3. **Row** `.ui-cs__row` – one metric and its change
4. **Label** `.ui-cs__label` – the metric's name
5. **Trend** `.ui-cs__trend` – green arrow, red outlined arrow or gray dash
6. **Change** `.ui-cs__text` – what happened, in words

## Looks

Standard puts the header on a gray tray and the rows on a white card inside it, with larger
text and a little more height per row. Clean is one white card with hairline shadows: the header is its first
row, the strokes are thinner and the trend marks are smaller tinted squares. In both, the rows fade
in one after another, and below 400px wide each metric stacks above its change so the text wraps instead of being
cut off.

## Keyboard

There is nothing to operate: the summary takes no focus and handles no keys.

## Screen readers

The host is a region named by the heading (“What's changed”); an `aria-label` or `aria-labelledby` the page sets on
it stays. The rows are a description list – the metric is the term, the change its description. A good or bad
change is said in words before the text (“Good change: Up 6.1% to 18.2K”, “Bad change: Up 12 to 41”); a neutral one
is read as written. The arrows and the dash are hidden. Labels and changes that may be cut off keep their full text
in a `title`.

## Content

- Name the metric as a noun people already use on the dashboard: “Active users”, not “Users (active, 7d)”.
- Write the change as a sentence fragment with the direction, the amount and where it landed: “Up 6.1% to 18.2K”,
  “Down 80 ms to 212 ms”.
- Say “Unchanged at 57” or “Holding at 46” for a neutral row rather than “0%”.
- Keep the period short: “This week”, “Since 1 May”.

## Do

- Set `tone` by what the change means for the business, and `direction` by which way the number went.
- Keep it to the three to six changes that matter; link to the full report for the rest.
- Order rows by importance, not alphabetically.

## Don't

- Don't rely on the colour: always write the direction in `change`.
- Don't mark a change `bad` because the number fell – a fall in errors is `good` with `direction: "down"`.
- Don't put whole sentences of explanation in a row; they wrap or get cut off.

## Example

```html
<tc-change-summary id="changes" period="This week"></tc-change-summary>

<script type="module">
  import "trenchcoat/change-summary";
  import "trenchcoat/tokens.css";

  const summary = document.querySelector("#changes");
  summary.changes = [
    { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" },
    { label: "Churned accounts", change: "Up 12 to 41", tone: "bad", direction: "up" },
    { label: "Avg. response time", change: "Down 80 ms to 212 ms", tone: "good", direction: "down" },
    { label: "Open tickets", change: "Unchanged at 57", tone: "neutral" },
  ];
  // It fires no events: it only displays
</script>
```

```tsx
import { ChangeSummary, type MetricChange } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const changes: MetricChange[] = [
  { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" },
  { label: "Churned accounts", change: "Up 12 to 41", tone: "bad", direction: "up" },
  { label: "Open tickets", change: "Unchanged at 57", tone: "neutral" },
];

export function WeeklyChanges() {
  return <ChangeSummary title="What's changed" period="This week" changes={changes} />;
}
```
