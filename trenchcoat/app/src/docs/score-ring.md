---
pattern: button
status: new
related: coverage-ring, radial-bar-chart, gauge, score-summary
---

## Overview

One overall score and the parts it's made of. The ring is split into a segment per sub-score: each segment is as long
as that part's weight and filled as far as its own score, so a heavy part that scores badly shows as a long, half-empty
stretch. The overall score sits large in the middle with its band – Good, Fair or Needs attention – and a caption.
Beside the ring a row per sub-score gives its share of the score and its value. Pointing at a segment or a row, or
focusing the row, isolates it: the other segments go quiet and the middle shows that part. Below, metric rows give
the plain facts behind the score, each with its change. The segments sweep round in turn when the ring first comes on
screen.

## When to use

- A composite score people need to trust: data quality, a health check, readiness, a review score.
- When the question after "what's the score?" is "which part is pulling it down?".
- Pairing the score with the few raw numbers it's built from.

## When not to use

- One share with no parts – use `coverage-ring`.
- Several separate ratios, each towards its own target – use `radial-bar-chart`.
- One value against a range with bands and a target line – use `gauge`.
- NPS or CSAT results with their bands and comments – use `score-summary`.

## Anatomy

1. **Ring** `.ui-scrg__ring` – the segments round the overall score, named by a text summary
2. **Segment** `.ui-scrg__seg` – a sub-score: its length is its weight, its fill its score
3. **Score** `.ui-scrg__num` – the overall score, or the isolated sub-score
4. **Band** `.ui-scrg__band` – the band's word with a dot in its tone
5. **Row** `.ui-scrg__row` – a sub-score's swatch, name, share of the score and value
6. **Metrics** `.ui-scrg__metrics` – the facts behind the score, each with its unit and change

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The ring, rows and metrics are the same in both. Segments take the chart palette in turn unless a
sub-score gives its own `color`. `--tc-scrg-track` sets the empty part of each segment and `--tc-scrg-size` the ring's
size (152 px); set either on the element. When the card is narrower than 420 px the rows sit under the ring.

## Keyboard

The sub-score rows are one tab stop, on the selected row or else the first.

| Key | What it does |
|---|---|
| ↑ / ↓ or ← / → | Moves to the previous or next sub-score, isolating it |
| Home / End | Moves to the first or last sub-score |
| Enter / Space | Selects the sub-score, or clears it if it's selected |
| Escape | Clears the selected sub-score |
| Tab | Leaves the rows |

## Screen readers

The ring is an image named by a summary: “Data quality: 80 out of 100, Good. Completeness 91, Accuracy 84, Freshness
62, Consistency 71”. The rows are a group of toggle buttons named “Data quality sub-scores” and described by the keys;
each button reads its name, share and value, “Completeness 36% of the score 91”, and is `aria-pressed` when selected.
Selecting is confirmed in a polite status message, “Selected Freshness: 62”, and clearing with “Selection cleared”.
The metrics are a description list.

## Content

- Name sub-scores with short nouns: “Completeness”, not “How complete the records are”.
- Give `weight` as relative numbers; the rows show each as a share of the score.
- Write bands that say what to do or how it's going, and keep to three or four.
- Write metric changes with their sign and unit, “+3 days”, and set `trend` to whether it's good news.

## Do

- Order sub-scores by weight or by how people think about them, and keep the order stable.
- Pass `score` when the overall score isn't a weighted average, so the middle matches your system of record.
- Pair a selected sub-score with what's behind it: the failing checks, the stale records.

## Don't

- Don't use more than about six sub-scores – the segments get too short to read.
- Don't use colour alone for a band – the word is what people read.
- Don't fill the metrics with numbers that don't feed the score.

## Example

```html
<tc-score-ring id="quality" heading="Data quality" caption="out of 100"></tc-score-ring>

<script type="module">
  import "@adamstavely/trenchcoat/score-ring";
  import "@adamstavely/trenchcoat/tokens.css";

  const ring = document.querySelector("#quality");
  ring.subscores = [
    { id: "complete", label: "Completeness", score: 91, weight: 4 },
    { id: "accurate", label: "Accuracy", score: 84, weight: 3 },
    { id: "fresh", label: "Freshness", score: 62, weight: 2 },
  ];
  ring.metrics = [{ label: "Records checked", value: 48210 }, { label: "Median age", value: 19, unit: "days", change: "+3 days", trend: "bad" }];
  ring.addEventListener("tc-subscore-change", (e) => console.log(e.detail.subscore, e.detail.item));
</script>
```

```tsx
import { useState } from "react";
import { ScoreRing, type ScoreRingSubscore } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const subscores: ScoreRingSubscore[] = [
  { id: "complete", label: "Completeness", score: 91, weight: 4 },
  { id: "accurate", label: "Accuracy", score: 84, weight: 3 },
  { id: "fresh", label: "Freshness", score: 62, weight: 2 },
];

export function DataQuality() {
  const [subscore, setSubscore] = useState<string | null>(null);
  return <ScoreRing title="Data quality" subscores={subscores} subscore={subscore} onSubscoreChange={setSubscore} />;
}
```
