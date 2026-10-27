---
pattern: meter
status: new
related: usage-meter, kpi-chart, budget-guard, review-center
---

## Overview

Whether people's trust in an AI matches how well it actually performs. A dial shows the reliance–accuracy index –
1 when people rely on the AI exactly as often as it is right – with its trend over recent windows, and says which
way trust leans: overtrust (relying on output that turns out wrong) or undertrust (overriding output that was
right). Behaviour signals, such as output accepted without an edit, sit as thin meters against two thresholds, one
for spot-checks and one for mandatory review. The card counts overtrust and undertrust episodes and recommends a
review level in one sentence; where a level is in force, the footer offers to switch to the recommended one. The
app supplies every number – the card reads no clock and computes no statistics beyond the index.

Two optional sections go further. A calibration table shows, domain by domain, the confidence the AI stated against
how often it was right, banded well calibrated, over-confident or under-confident – so a team can see that the
assistant is reliable on payment terms but too sure of itself on liability caps. A ranking orders agents by the
rating the app gives each one.

## When to use

- On a team or workflow dashboard where people act on AI output and someone owns how closely it is checked.
- When you track reliance and accuracy over time and want drift caught before it becomes a habit.
- To turn behaviour signals into a review decision that a person confirms.

## When not to use

- Spend or token limits for a run – use `budget-guard`.
- Plan or account usage over a billing period – use `usage-meter`.
- A metric over time with no thresholds or recommendation – use `kpi-chart`.
- Working through the items that need review – use `review-center`.

## Anatomy

1. **Header** `.tc-head` – the icon, the title, what the numbers cover, and the band's pill (Calibrated, Drifting, Miscalibrated)
2. **Dial** `.ui-rlg__dial` – the index from 0 to 1, with cuts where the bands start; beside it, which way trust leans
3. **Trend** `.ui-rlg__plot` – the index over recent windows, with the two band lines behind it
4. **Signals** `.ui-rlg__signals` – one thin meter per signal, ticked at the spot-check and mandatory thresholds, under the overtrust and undertrust counts
5. **Calibration by domain** `.ui-rlg__domains` – per domain, the confidence stated against the accuracy, banded well calibrated, over- or under-confident
6. **Agent ranking** `.ui-rlg__agents` – agents in order of the rating the app gives them
7. **Recommendation** `.ui-rlg__advice` – the recommended review level and the sentence that explains it

## Looks

Standard sets a white card in the gray tray, with the level in force and the switch on the tray below. Clean is one
white card with a shadow: the footer becomes its last row under a hairline, the arc and trend line are thinner, and
the trend's and sections' labels are small captions. Both show the same dial, signals, table, ranking and
recommendation. Below 400px the table puts each domain on two lines – the name and its band, then the confidence and
the accuracy – and each agent's bar drops under its name.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the trend, the episode counts (when `browsable`) and the switch button |
| ← / ↓ | On the trend: reads the previous window – the first press reads the latest |
| → / ↑ | On the trend: reads the next window |
| Home / End | On the trend: reads the first or the latest window |
| Escape | On the trend: goes back to the change over all windows |
| Enter / Space | Opens the episodes, or switches the review level |

## Screen readers

The card is a `region`, named by its heading. The dial is a `meter` named “Reliance–accuracy index” with a value
such as “0.83 of 1, drifting, leaning to overtrust”; each signal is a `meter` named by its label, its value saying
when it is over a threshold (“72%, past the spot-check threshold (60%)”). The trend is a group whose name gives the
range (“Index over the last 4 windows, from 0.94 to 0.83”); the arrow keys read each window in a polite live region
(“Week 3: 0.89, drifting”). The recommendation is a group named by its title. The live region also says when the
recommendation changes (“Recommended review is now spot-check.”) and when a switch applies (“Review level set to
spot-check.”). The calibration table is a real table named by its caption (“Calibration by domain”), with a row
header per domain and column headers Domain, Confidence, Accuracy and Calibration; each band is written out
(“Over-confident”). The ranking is an ordered list named “Agents by rating”, each item read as the agent and its
rating (“Clause summariser 412 answers, rated 0.91”).

## Content

- Phrase signals so that higher means more reason to review: “Accepted unedited”, “Sources not opened”.
- Use `hint` to say what a signal measures in a few words – “Too quick to have read the source”.
- Name what the numbers cover in `scope`: the period and how many outputs.
- Rename the levels with `levelLabels` to match your process, and keep them short – they are read in sentences
  (“Switch to spot-check”).
- Write `reason` only when a rule, not the signals, sets the level; otherwise let the card explain itself.
- Name domains the way the people reviewing them do (“Liability caps”, not a taxonomy code), and give `count` so a
  band resting on a dozen outputs reads as the thin evidence it is.
- Say what an agent's rating is in `agentsLabel` when it isn't obvious – “Agents by accuracy”.

## Do

- Pass `reliance` and `accuracy` together, so the card can say which way trust leans.
- Set `spotCheckAt`, `mandatoryAt` and per-signal thresholds from your own review policy.
- Keep `reviewLevel` in step with what is actually in force, and log who switched it.
- Set `calibrationTolerance` to the gap your evaluation treats as noise; set a row's `band` outright when your own
  calibration model has already decided it.

## Don't

- Don't switch the review level automatically – the recommendation is for a person to confirm.
- Don't mix signals where higher means better with ones where higher means worse.
- Don't show it for a handful of outputs; the index and signals need enough volume to mean anything.
- Don't rank agents on a rating that mixes different tasks – rank like with like.

## Example

```html
<tc-reliance-gauge id="trust" scope="Last 30 days · 412 outputs" reliance="0.9" accuracy="0.74" review-level="routine" browsable></tc-reliance-gauge>

<script type="module">
  import "trenchcoat/reliance-gauge";
  import "trenchcoat/tokens.css";

  const gauge = document.querySelector("#trust");
  gauge.trend = [
    { label: "Week 1", index: 0.95 },
    { label: "Week 2", index: 0.9 },
    { label: "Week 3", index: 0.84 },
  ];
  gauge.signals = [
    { id: "unedited", label: "Accepted unedited", value: 0.71, hint: "Used without a change" },
    { id: "unopened", label: "Sources not opened", value: 0.42 },
  ];
  gauge.overtrust = 6;
  gauge.undertrust = 1;
  gauge.domains = [
    { id: "payment", label: "Payment terms", confidence: 0.86, accuracy: 0.84, count: 142 },
    { id: "liability", label: "Liability caps", confidence: 0.88, accuracy: 0.66, count: 96 },
  ];
  gauge.agents = [
    { id: "summariser", label: "Clause summariser", rating: 0.91 },
    { id: "redliner", label: "Redline drafter", rating: 0.67 },
  ];
  gauge.addEventListener("tc-review-level-change", (e) => console.log("now", e.detail.level));
</script>
```

```tsx
import { useState } from "react";
import { RelianceGauge, type RelianceReviewLevel } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function TrustPanel() {
  const [level, setLevel] = useState<RelianceReviewLevel>("routine");
  return (
    <RelianceGauge
      title="Reliance"
      scope="Last 30 days · 412 outputs"
      reliance={0.9}
      accuracy={0.74}
      trend={[
        { label: "Week 1", index: 0.95 },
        { label: "Week 2", index: 0.9 },
        { label: "Week 3", index: 0.84 },
      ]}
      signals={[{ id: "unedited", label: "Accepted unedited", value: 0.71 }]}
      overtrust={6}
      undertrust={1}
      domains={[{ id: "liability", label: "Liability caps", confidence: 0.88, accuracy: 0.66, count: 96 }]}
      agents={[{ id: "summariser", label: "Clause summariser", rating: 0.91, detail: "412 answers" }]}
      reviewLevel={level}
      onReviewLevelChange={setLevel}
      onOpenEpisodes={(kind) => console.log("show", kind)}
    />
  );
}
```
