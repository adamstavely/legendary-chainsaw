---
pattern: disclosure
status: new
related: reliance-gauge, agreement-tracker, review-center, verification-queue
---

## Overview

Whether people's reviews of AI output are genuine engagement or going through the motions. An index from 0 to 1 –
1 is fully genuine – leads the card with its band (Low, Mixed, Strong), its trend over recent sessions, and one
sentence naming the signals that hold it back. Below, the signals it is built from: reused wording, time on the
source before a verdict, batch dismissals and repeated commitments, or the app's own. Each shows its value, what was
observed, a plain explanation and, folded away, an example. It is presented as quality, not as a violation: neutral
words, a low score in amber rather than red, and an optional note saying who else sees it and that it isn't a
performance rating.

## When to use

- Beside a review or verification workflow, to show a reviewer how far their own review record can be relied on.
- In a team lead's view, as a starting point for a conversation about calibration.
- When review outcomes feed a model or a metric, to flag sessions whose reviews should count for less.

## When not to use

- Whether people trust the AI as much as it deserves – use `reliance-gauge`.
- How often the AI agreed with the person in this session – use `agreement-tracker`.
- Working through the items waiting for review – use `review-center` or `verification-queue`.

## Anatomy

1. **Header** `.tc-head` – the icon, the title, what the numbers cover, and the band's pill
2. **Index** `.ui-egq__score` – the index, out of 1
3. **Summary** `.ui-egq__read` – the band in words and the signals holding it back
4. **Band scale** `.ui-egq__scale` – the index on a track cut where the Mixed and Strong bands start
5. **Trend** `.ui-egq__trend` – one column per recent window and the change across them
6. **Signal** `.ui-egq__signal` – its value and meter, what was observed, the explanation and the Example disclosure
7. **Shared note** `.ui-egq__note` – who else sees the score

## Looks

Standard sets the header on the gray tray above a white card, with the shared note on the tray below. Clean is one
white card with a shadow: the note becomes its last row under a hairline, the index is a step smaller, the section
label is a small caption, and strokes are thinner.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each signal's Example button and, with `browsable`, the “Show these reviews” button inside an open example |
| Enter / Space | Opens or closes an example, or fires `tc-signal-open` |

## Screen readers

The card is a `region`, named by its heading. The band scale is a `meter` named “Engagement quality index”, with a
value such as “0.70 of 1, mixed”; with no data it is hidden and the summary says “No reviews to measure yet.”. The
signals are a list named “What it's built from”; each signal's bar is a `meter` named by its label, its value text
adding the band and the reading (“0.41 of 1, low – Median 9 s with the source open”). Each Example button reports
`aria-expanded` and names its signal (“Example – Time on the source”). The trend's columns are hidden; a sentence
reads the range instead (“From 0.58 in Session 1 to 0.70 in Session 3.”).

## Content

- Keep higher meaning more genuine, for the index and every signal, so the card never mixes directions.
- Use `reading` for what was observed, in numbers a person recognises: “Median 9 s with the source open”, “2 batches
  of 6 or more”.
- Make `example` one real instance from the person's own reviews, quoted or described in a sentence.
- Name a role in `sharedWith` (“your team lead”) rather than a name, and keep the developmental framing if you write
  your own `sharedNote`.
- The built-in kinds supply the label and explanation; override them only to match your product's words.

## Do

- Show it to the reviewer first, and to a supervisor only with the shared note on.
- Compute signals over enough reviews to mean something – a session or a week, not a single item.
- Set `strongAt` and `mixedAt` from your own data once you know what normal looks like.

## Don't

- Don't use it as a performance score or rank people by it.
- Don't add red or alarming wording for a low score – it describes how reliable the record is.
- Don't show signals the person can't act on; each one should point at a habit they can change.

## Example

```html
<tc-engagement-quality id="quality" scope="Last 5 sessions · 38 reviews" shared-with="your team lead" browsable></tc-engagement-quality>

<script type="module">
  import "trenchcoat/engagement-quality";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#quality");
  card.trend = [
    { label: "Session 1", index: 0.58 },
    { label: "Session 2", index: 0.63 },
    { label: "Session 3", index: 0.7 },
  ];
  card.signals = [
    { id: "words", kind: "boilerplate", value: 0.82, reading: "1 of 12 notes reused earlier wording" },
    { id: "time", kind: "source-time", value: 0.41, reading: "Median 9 s with the source open", example: "Verdict 4 s after opening a 12-page source" },
    { id: "batch", kind: "batch-dismissal", value: 0.66, reading: "2 batches of 6 or more" },
    { id: "commit", kind: "repeated-commitment", value: 0.9 },
  ];
  card.addEventListener("tc-signal-open", (e) => console.log("show reviews behind", e.detail.id));
</script>
```

```tsx
import { EngagementQuality } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ReviewQuality() {
  return (
    <EngagementQuality
      scope="Last 5 sessions · 38 reviews"
      sharedWith="your team lead"
      trend={[
        { label: "Session 1", index: 0.58 },
        { label: "Session 2", index: 0.7 },
      ]}
      signals={[
        { id: "words", kind: "boilerplate", value: 0.82, reading: "1 of 12 notes reused earlier wording" },
        { id: "time", kind: "source-time", value: 0.41, reading: "Median 9 s with the source open", example: "Verdict 4 s after opening a 12-page source" },
      ]}
      onOpenSignal={(id) => console.log("show reviews behind", id)}
    />
  );
}
```
