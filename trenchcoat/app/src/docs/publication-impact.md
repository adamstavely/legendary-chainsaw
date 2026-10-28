---
pattern: radio
status: new
related: audience-mix, citation-badge, citation-sections, kpi-chart
---

## Overview

One paper's impact on one card. The header has the venue and date, the topic it belongs to, the title, an assessment
grade and the authors, with what the paper achieved as a tag (“resolves gap”). Below come the reach figures –
downloads, views, citations and an attention score – beside a sparkline of cumulative reads; then mentions in the
news, in policy, on social media and in patents; then who is reading, with `audience-mix`; then feedback. Feedback is
quotes from peer reviewers, readers and sponsors, each with who, where, when and a sentiment in words, filtered All /
Peer / Reader / Sponsor and summed up as “2 positive · 1 mixed”.

## When to use

- A paper's page in a research portfolio, a lab's site or a funder's report.
- Reviewing outputs, where reach and what people said matter together.

## When not to use

- Just the citation counts – use `citation-badge`, or `citation-sections` for where it's cited.
- Just who is reading – use `audience-mix`.
- One number and its trend – use `kpi-chart`.

## Anatomy

1. **Header** `.ui-pubi__head` – venue, date, topic, title, grade, authors and outcome
2. **Grade** `.ui-pubi__grade` – the assessment, its caption and the grade in words
3. **Reach** `.ui-pubi__reach` – downloads, views, citations, attention score and the reads sparkline
4. **Mentions** `.ui-pubi__mentions` – news, policy, social and patent counts
5. **Filter** `.ui-pubi__filter` – All / Peer / Reader / Sponsor
6. **Quote** `.ui-pubi__quote` – kind, who and where, sentiment, the quote and its date

## Looks

Standard is a white card on a gray tray. Clean is one white card. Sections are divided by hairlines in both. The
sparkline uses `--tc-pubi-ink` (by default `--tc-chart-1`).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the topic link, the filter and the audience rows |
| ← / → (or ↑ / ↓) | In the filter, picks the previous or next kind |
| Home / End | In the filter, picks All or the last kind |

## Screen readers

The card is an article named by the title. The grade reads its caption and value, “Assessment Outstanding”. The reach
figures are a description list – “Downloads 18K” – and the sparkline is an image named “Cumulative reads, rising to
18,000”. The filter is a radio group named “Show feedback from”; picking a kind fires tc-filter-change. Each quote
reads its kind, who and where, its sentiment in words, the quote and its date.

## Content

- Write the outcome as what the paper did, in two or three words: “resolves gap”, “informs policy”.
- Quote feedback as said, short: one or two sentences.
- Give dates as epoch ms; the element formats them in the viewer's language.

## Do

- Show the grade only when it comes from a real assessment.
- Keep mentions to the kinds your sources count reliably.

## Don't

- Don't use the sentiment tints for anything else.
- Don't show feedback without who said it and where.

## Example

```html
<tc-publication-impact id="paper" heading="Self-Calibrating Coastal Sensors" venue="Journal of Applied Sensing"></tc-publication-impact>

<script type="module">
  import "trenchcoat/publication-impact";
  import "trenchcoat/tokens.css";

  const paper = document.querySelector("#paper");
  paper.grade = { label: "Outstanding", tone: "success" };
  paper.metrics = { downloads: 18000, views: 46000, citations: 73, attention: 284 };
  paper.reads = [400, 2600, 5800, 9100, 12400, 18000];
  paper.feedback = [{ id: "f1", kind: "reader", who: "Dr. Ines Marlow", quote: "We reproduced it.", sentiment: "positive" }];
  paper.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
</script>
```

```tsx
import { useState } from "react";
import { PublicationImpact, type PublicationFeedbackFilter } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Paper() {
  const [filter, setFilter] = useState<PublicationFeedbackFilter>("all");
  return (
    <PublicationImpact
      title="Self-Calibrating Coastal Sensors"
      venue="Journal of Applied Sensing"
      grade={{ label: "Outstanding", tone: "success" }}
      metrics={{ downloads: 18000, views: 46000, citations: 73, attention: 284 }}
      reads={[400, 2600, 5800, 9100, 12400, 18000]}
      feedback={[{ id: "f1", kind: "reader", who: "Dr. Ines Marlow", quote: "We reproduced it.", sentiment: "positive" }]}
      filter={filter}
      onFilterChange={setFilter}
    />
  );
}
```
