---
pattern: listbox
status: new
related: funnel-chart, compact-breakdown, bar-chart, capacity-bars, week-bars
---

## Overview

A funnel written as a list: how many cases, people or items reached each stage of a process, one row per stage. Each
row has the stage's name, a rounded pill on a track as long as its share of the first stage, the count, and that
share. The headline is the first stage's count with its change against the period before; pointing at a stage (or
moving to it with the keys) brings its pill forward, quiets the others and rolls the headline to that stage's count.
Stat tiles under the list repeat each stage's count for a quick read.

With `ranges`, a period switch in the header swaps in each period's stages and change, and the pills grow in again.
The pills grow in when the card first comes on screen.

## When to use

- A process with ordered stages where the counts and the share still left at each stage matter more than the shape.
- A dashboard card that needs the funnel and its numbers in one compact, readable block.
- Comparing the same pipeline over a few periods (7 days, 30 days).

## When not to use

- Where the drop from step to step is the story – use [Funnel Chart](#/funnel-chart), which shows each step's rate.
- Parts of one total – use [Compact Breakdown](#/compact-breakdown).
- Categories with no order between them – use [Bar Chart](#/bar-chart).

## Anatomy

1. **Header** `.tc-head` – the icon, heading and description, the period switch and the Table button
2. **Period switch** `.ui-stgb__range` – one radio per range
3. **Headline** `.ui-stgb__big` – the shown stage's count, with the change chip `.ui-stgb__delta` beside the first stage's
4. **Row** `.ui-stgb__row` – a stage: its name `.ui-stgb__name`, its track `.ui-stgb__track` and pill `.ui-stgb__pill`, its count `.ui-stgb__value` and share `.ui-stgb__share`
5. **Icon** `.ui-stgb__icon` – the stage's own icon at the pill's left end, when given
6. **Tiles** `.ui-stgb__tiles` – a tile per stage with its name and count
7. **Table** `.ui-stgb__table` – the table view: stage, count and share of first

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Pills take the chart colours in order (`--tc-chart-1` to `--tc-chart-6`) unless a stage gives its own `color`;
`mono` draws them all in one ink, `--tc-stgb-mono`. The track is `--tc-stgb-track` and the pill height
`--tc-stgb-pill-h`. When a stage is in front, the others' pills fade towards the track by colour, not by opacity, so
their names and counts keep their contrast. `still` (or the system's reduced-motion setting) draws everything at once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the list – one tab stop; the period switch and the Table button are tab stops of their own |
| Arrow keys | Move to the next or previous stage, bringing it forward and rolling the headline to it |
| Home / End | The first or last stage |
| Enter / Space | Picks the stage (fires `tc-stage-change`), or lets it go when it's already picked |
| Escape | Lets go of the picked stage |
| Arrow keys in the switch | Choose the previous or next period |

## Screen readers

- The rows are a listbox named by the heading; each option reads as its name, count and share ("Triaged, 790, 67% of
  first stage") and says whether it's selected.
- The headline says whose count it shows; the change chip reads "up 2.4%" or "down 3.1%".
- Picking a stage is announced politely ("Selected Investigated").
- The pills and the tiles repeat the text, so they're hidden; the Table button shows the same numbers as a table.

## Content

- Name stages with short states or past-tense verbs: "Flagged", "Triaged", "Closed".
- Keep to three to eight stages – the tiles wrap three to a row.
- Give icons only when every stage has one; they're drawn small, as a mark of the stage, not a picture.
- Range labels are short spans: "7 days", "30 days", "Quarter".

## Do

- Put the stages top of the funnel first – shares are measured against the first.
- Pass a `delta` (or each range's own) so the headline says which way the first stage moved.

## Don't

- Use it for stages that can grow from one to the next – the pills read as narrowing.
- Rely on the pill colours to tell stages apart – the names do that; colour only groups a row with its tile.

## Example

```html
<tc-stage-bars heading="Case pipeline" description="Cases at each review step" delta="2.4"></tc-stage-bars>

<script type="module">
  import "@adamstavely/trenchcoat/stage-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  const bars = document.querySelector("tc-stage-bars");
  bars.stages = [
    { label: "Flagged", value: 1180 },
    { label: "Triaged", value: 790 },
    { label: "Investigated", value: 460 },
    { label: "Closed", value: 40 },
  ];
  bars.addEventListener("tc-stage-change", (e) => console.log(e.detail.stage, e.detail.item?.label));
</script>
```

```tsx
import { StageBars } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
import { useState } from "react";

const stages = (values: number[]) => ["Flagged", "Triaged", "Investigated", "Closed"].map((label, i) => ({ label, value: values[i] }));
const ranges = [
  { id: "7d", label: "7 days", delta: 2.4, stages: stages([1180, 790, 460, 40]) },
  { id: "30d", label: "30 days", delta: -3.1, stages: stages([4920, 3410, 2120, 210]) },
];

export function CasePipeline() {
  const [range, setRange] = useState("7d");
  return <StageBars title="Case pipeline" ranges={ranges} range={range} onRangeChange={setRange} onStageChange={(stage, item) => console.log(stage, item?.label)} />;
}
```
