---
pattern: none
status: new
related: bar-chart, waffle-chart, marimekko-chart, breakdown-chart
---

## Overview

How many are left at each step of a process – proposals drafted, submitted, shortlisted, funded – as centred bars
narrowing down the page, joined by curved necks so the losses read as a flow. Each step's name and count sit at the
left and its conversion rate at the right, measured against the step before (or the first, `rate-base="first"`). The
step with the lowest rate – where most are lost – takes the accent and the rest stay quiet; `highlight` picks another.

The bars widen out step after step when the chart scrolls into view and glide to new counts when the data changes.
Ported from ztd-charts (MIT).

## When to use

- A process people pass through in order, where the question is where they drop out.
- Comparing one round of a process with another (this year against last).

## When not to use

- Categories with no order between them – use [Bar Chart](#/bar-chart).
- Shares of a whole – use [Waffle Chart](#/waffle-chart).
- A total split by two measures – use [Breakdown Chart](#/breakdown-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Bar** `.ui-fnl__bar` – one per step, as wide as its count; the emphasised one in the accent
3. **Neck** `.ui-fnl__neck` – the curve joining a step to the next
4. **Name and count** `.tc-chart__value` – at the left of each bar; the rate at the right
5. **Rate heading** `.tc-chart__tick` – what the rates are measured against
6. **Tooltip** `.tc-chart__tip` – the step's count, rate and drop-off from the step before

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised step, `--tc-plot-rest` for the others and the
necks. Names, counts and rates are written beside the bars, never on them. `still` (or the system's reduced-motion
setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous step; the tooltip shows it and it's read with its count and rate |
| Home / End | The first or last step |
| Enter / Space | Picks the step (fires `tc-mark-click`) |
| Escape | Lets go of the step; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, described in words ("6 steps: Ideas logged 212, Drafted 148 (70%), …").
- A table of every step's count and rate is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the step with its count, rate and position ("Drafted: 148 · 70% of previous step,
  2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

## Content

- Name steps with short verbs or states: "Submitted", "Shortlisted".
- Keep to the steps that matter – three to seven read best.
- Rename the rate heading with `rate-label` when "vs. previous" isn't the team's word.

## Do

- Let the biggest drop carry the accent – it's the step to work on.
- Use `rate-base="first"` when people ask "how many of those who started got through".

## Don't

- Use a funnel for counts that can grow from step to step – it reads as a narrowing.
- Hide the rates when the counts differ by orders of magnitude; the widths alone won't show the small steps.

## Example

```html
<tc-funnel-chart heading="Grant proposals" description="This year's round"></tc-funnel-chart>

<script type="module">
  import "trenchcoat/funnel-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-funnel-chart").data = [
    { label: "Drafted", value: 148 },
    { label: "Submitted", value: 104 },
    { label: "Shortlisted", value: 39 },
    { label: "Funded", value: 27 },
  ];
</script>
```

```tsx
import { FunnelChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { label: "Drafted", value: 148 },
  { label: "Submitted", value: 104 },
  { label: "Shortlisted", value: 39 },
  { label: "Funded", value: 27 },
];

export function Proposals() {
  return <FunnelChart title="Grant proposals" description="This year's round" rateBase="first" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```
