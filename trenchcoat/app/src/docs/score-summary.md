---
pattern: toolbar
status: new
related: score-survey, grade-distribution, kpi-chart, breakdown-chart
---

## Overview

The results of an NPS or CSAT survey on one card. The score is in big type with its name – “NPS +32”, “CSAT 84%” –
with how many answered, how it changed since last time and a sparkline of the trend, and a meter with the target
marked. Under it, a stacked bar splits the answers into bands – detractors, passives and promoters for NPS, the five
answers for CSAT – each named with its share and count, and a bar per score shows the whole distribution. Picking a
score's bar fires an event, so the page can filter the comments to it.

NPS is the share of promoters (9–10) minus the share of detractors (0–6), from −100 to +100. CSAT is the share of 4s
and 5s. Both are worked out from the counts and rounded once, half away from zero – one detractor, one passive and
one promoter is an NPS of 0. The band percentages are rounded on their own so they add up to 100, so the score can
be 1 away from the difference of the rounded bands.

## When to use

- A survey dashboard: the headline number and what's behind it.
- Comparing a score with last quarter and a target.
- Letting people drill into the comments for one score.

## When not to use

- Asking the question – use `score-survey`.
- Counts per grade or category without a score – use `grade-distribution`.
- A metric over time as the main thing – use `kpi-chart`.
- Splitting a total into parts that aren't survey answers – use `breakdown-chart`.

## Anatomy

1. **Score** `.ui-ssm__hero` – the name and the number
2. **Change** `.ui-ssm__change` – up, down or no change from the last period, in words with an arrow
3. **Sparkline** `.ui-ssm__spark` – earlier periods and now
4. **Meter** `.ui-ssm__meter` – where the score sits on its range, with the target marked
5. **Bands** `.ui-ssm__bands` – the stacked bar and a key with each band's share and count
6. **Distribution** `.ui-ssm__dist` – a bar per score, each one a button
7. **Picked** `.ui-ssm__picked` – the picked score's count, share and band

## Looks

Standard puts the heading and the response count on a gray tray and the results on a white card. Clean is one white
card with the heading as its first row. Narrow (under 480 px), the meter goes under the score and the counts over the
bars hide. The band colours are component tokens: `--tc-ssm-detractor`, `--tc-ssm-passive`, `--tc-ssm-promoter` and
`--tc-ssm-csat-1` to `--tc-ssm-csat-5`; `--tc-ssm-dist-h` sets the bars' height.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the distribution (one stop) |
| ← / → | Moves between the scores' bars |
| Home / End | Goes to the first or last score |
| Enter / Space | Picks the focused score, or clears it when it's already picked |
| Escape | Clears the picked score |

## Screen readers

The card is a `group` named by the heading. The score reads as its name and number (“NPS +38”). The sparkline is
hidden and replaced by text (“Trend: Q1 +18, Q2 +24, now +38”). The bands are a list whose items say the band, its
share and its count. The distribution is a `toolbar` named “Answers by score”; each bar is a toggle button with
`aria-pressed`, named by its score, count and share (“9: 74 responses, 24%”).

## Content

- Put the survey and the period in `description` – “Riverside Library app · Q3”.
- Give trend points short period labels; the change says “from Q2”, so the label has to read well there.
- Set `comparedTo` when the comparison isn't the last trend point – “last year”.
- Pass every score in `responses`, zeros included, lowest score first.

## Do

- Show the response count – a score from 12 answers means little.
- Use the same target across periods.
- Filter the comments when a score is picked; that's what makes the distribution useful.

## Don't

- Don't average NPS answers – the score is promoters minus detractors.
- Don't recolour the bands so promoters and detractors look alike.
- Don't compare an NPS with a CSAT.

## Example

```html
<tc-score-summary id="nps" kind="nps" description="Riverside Library app · Q3" target="40"></tc-score-summary>

<script type="module">
  import "trenchcoat/score-summary";
  import "trenchcoat/tokens.css";

  const nps = document.querySelector("#nps");
  nps.responses = [6, 3, 4, 5, 7, 11, 16, 38, 52, 74, 96];
  nps.trend = [{ label: "Q1", value: 18 }, { label: "Q2", value: 24 }];
  nps.addEventListener("tc-score-select", (e) => console.log("filter comments to", e.detail.score));
</script>
```

```tsx
import { ScoreSummary } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SatisfactionCard({ counts, onFilter }: { counts: number[]; onFilter: (score: number | null) => void }) {
  return <ScoreSummary kind="csat" description="Study-room booking · Q3" responses={counts} previous={78} comparedTo="Q2" onScoreSelect={onFilter} />;
}
```
