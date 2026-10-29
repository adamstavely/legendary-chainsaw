---
pattern: button
status: new
related: priority-list, investment-balance, coverage-matrix, data-table
---

## Overview

Value against effort: the 2 × 2 teams use to choose what to do next. Each item is a numbered point placed by its
effort (across, 0–10) and its value (up, 0–10). The quadrants are Quick wins (high value, low effort), Big bets (high
value, high effort), Fill-ins (low value, low effort) and Time sinks (low value, high effort). The items are listed by
quadrant beside the plot, or under it when the card is narrow, with counts. Pointing at a row lights up its point,
and pointing at a point lights up its row.

Drag a point to move it, in half steps, with a mouse, pen or touch. Or focus a point and move it with the arrow keys.
Points on the same spot gather into one with a count; click it to fan them out.

## When to use

- A steering group or team weighing candidate projects, features or fixes.
- Showing why some work is first: what's cheap and valuable stands out.

## When not to use

- A single ranked list – use [Priority List](#/priority-list).
- How spend is split across themes – use [Investment Balance](#/investment-balance).
- Many scored attributes at once – use [Data Table](#/data-table).

## Anatomy

1. **Plot** `.ui-pmx__plot` – the four quadrants, value up and effort across
2. **Quadrant** `.ui-pmx__quad` – its name and tone
3. **Point** `.ui-pmx__point` – an item's number on its spot; its name shows on hover and focus
4. **Cluster** `.ui-pmx__cluster` – items on the same spot, with a count
5. **Lists** `.ui-pmx__lists` – the items by quadrant, with their scores

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Quick wins are tinted success, Big bets info and Time sinks warning, while Fill-ins are neutral. Each point is ringed
in its quadrant's colour, and the quadrant's name is always written. A page can set `--tc-pmx-point` (the point's
size) and `--tc-pmx-plot-max` (the plot's largest width).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | From point to point, then into the lists |
| ↑ / ↓ | Value up / down half a step (Shift: two) |
| ← / → | Effort down / up half a step (Shift: two) |
| Enter on a cluster | Fans its items out |
| Escape | Gathers a fanned-out cluster back |

## Screen readers

- The plot is a group named after the chart and its axes. Its key description says how the arrow keys move a point.
- Each point is a button named by its item, and described with where it is: "Value 8.5, effort 3 – Quick wins".
- A cluster says how many items it holds and what they are.
- Moves are announced, including a change of quadrant ("now in Big bets").
- The lists carry the same information as the plot, in reading order.

## Content

- Score on a 0–10 scale with the same people in the room; half steps are enough.
- Rename the axes and quadrants for your process (`x-label`, `y-label`, `labels`): "Confidence", "Impact" and so on.
- Keep item names short – they show in a small tip on the plot and in full in the lists.

## Do

- Re-score together and let the moves be seen – the announcement and the list both follow.
- Keep the changes (`tc-items-change`) so the scores survive the meeting.

## Don't

- Read precision into it – it's a conversation aid.
- Put fifty items on one plot; split by programme.

## Example

```html
<tc-prioritisation-matrix heading="2027 portfolio"></tc-prioritisation-matrix>
<script type="module">
  const m = document.querySelector("tc-prioritisation-matrix");
  m.items = [
    { id: "portal", label: "Open data portal", value: 8.5, effort: 3 },
    { id: "reef", label: "Coral reef sensor network", value: 9, effort: 8 },
  ];
  m.addEventListener("tc-items-change", (e) => console.log(e.detail.change));
</script>
```

```tsx
import { useState } from "react";
import { PrioritisationMatrix, type PrioritisationItem } from "trenchcoat/react";

export function Portfolio() {
  const [items, setItems] = useState<PrioritisationItem[]>([{ id: "portal", label: "Open data portal", value: 8.5, effort: 3 }]);
  return <PrioritisationMatrix title="2027 portfolio" items={items} onItemsChange={setItems} />;
}
```
