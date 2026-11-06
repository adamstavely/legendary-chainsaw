---
pattern: none
status: new
related: bar-chart, pareto-chart, breakdown-chart, budget-burn
---

## Overview

How a starting figure becomes an ending one. Each row is a step up or down from where the last left off; totals stand
on the baseline. The first row is the starting total unless `delta-start` is set, a row with `type: "total"` is a
subtotal (at its value, or the running level when it has none), and `end-total` adds the final level as a last bar.

Increases take the success ink and decreases the danger ink, named in the legend; totals stay quiet. `highlight` gives
steps the accent – an index, a name, or "max" for the largest increase. Dashed connectors carry each level to the
next step, and each change is written above its bar, or below it for a fall. The steps drop in one after another when the chart scrolls
into view and glide when the data changes. Ported from ztd-charts (MIT).

## When to use

- Explaining a change between two totals: a budget's award and what's left, a quarter's opening and closing balance.
- Showing which contributions pushed a figure up and which pulled it down.

## When not to use

- Comparing unrelated categories – use [Bar Chart](#/bar-chart).
- Finding the few causes behind most of a total – use [Pareto Chart](#/pareto-chart).
- A budget's spend against plan over time – use [Budget Burn](#/budget-burn).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Step** `.ui-wfl__bar` – one per row; a total, a rise or a fall
3. **Connector** `.ui-wfl__link` – the dashed line from one step's level to the next step
4. **Value** `.tc-chart__value` – the change (or a total's level) beside the bar
5. **Axis** `.tc-chart__grid` – the grid lines and their values; the step names under the bars, totals in bold
6. **Tooltip** `.tc-chart__tip` – the step's change and the running level after it

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Rises and falls use the status inks through component
tokens on the element – `--tc-wfl-up`, `--tc-wfl-down` and `--tc-wfl-total` – and the emphasised step
`--tc-plot-accent`. Values are written in the text inks beside the bars, never on them. `still` (or the system's
reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous step; the tooltip shows it and it's read with its change |
| Home / End | The first or last step |
| Enter / Space | Picks the step (fires `tc-mark-click`) |
| Escape | Lets go of the step; pressed again, it's the page's |

## Screen readers

- The plot is a group named by the heading, with every step described in words ("Awarded 480, Staff −190, …").
- A table of every step is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the step with its change and position ("Staff: −190k, 2 of 7").
- Rises and falls are written with their sign, so nothing is said by colour alone.

## Content

- Name steps by what moved the figure ("Staff", "Supplement"), not by their sign.
- Give `unit` ("k", " h") rather than baking it into the values; changes are written with + and −.
- Rename the words through `waterfallLabels` when "Increase" and "Decrease" aren't the right ones ("Returned", "Used").

## Do

- Start from a total and end on one, so the chart reads as a bridge between them.
- Keep the steps in the order they happened or matter.

## Don't

- Use it for more than a dozen or so steps; the names under the bars thin out.
- Colour a step by hand to mean something else – the inks already mean up and down.

## Example

```html
<tc-waterfall-chart heading="Grant budget" description="Year one, in thousands" unit="k" end-total="Remaining"></tc-waterfall-chart>

<script type="module">
  import "trenchcoat/waterfall-chart";
  import "trenchcoat/tokens.css";
  document.querySelector("tc-waterfall-chart").data = [
    { label: "Awarded", value: 480 },
    { label: "Staff", value: -190 },
    { label: "Supplement", value: 60 },
  ];
</script>
```

```tsx
import { WaterfallChart } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const data = [
  { label: "Awarded", value: 480 },
  { label: "Staff", value: -190 },
  { label: "Supplement", value: 60 },
];

export function Budget() {
  return <WaterfallChart title="Grant budget" description="Year one, in thousands" data={data} unit="k" endTotal="Remaining" onMarkClick={(e) => console.log(e.label)} />;
}
```
