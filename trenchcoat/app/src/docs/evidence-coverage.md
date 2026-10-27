---
pattern: none
status: new
related: provenance-summary, validity-badge, coverage-matrix, claim-answer
---

## Overview

What an answer could and couldn't see. Each source category the answer draws on gets a row – current, stale (with
its age, as your product words it) or not covered at all – and a summary line says plainly what was missing:
“Couldn't see Field reports. Supplier filings (14 months) is out of date.” A stale or missing category carries
Request coverage, so the reader can ask for the gap to be filled instead of quietly trusting a partial answer. It
works as a card beside an answer or as one quiet line under it that folds out into the rows. The app sends the
request; the component shows it pending, sent, or failed with Retry.

## When to use

- Under or beside an AI answer whose quality depends on which sources it could reach.
- In a report or brief, to say which inputs were out of date when it was written.
- Where people can ask for data to be collected, connected or refreshed.

## When not to use

- How much of a document came from sources versus synthesis – use `provenance-summary`.
- The freshness of one cited source – use `validity-badge`.
- Coverage of many topics against many sources, as a grid – use `coverage-matrix`.
- Marking up the claims of an answer one by one – use `claim-answer`.

## Anatomy

1. **Summary** `.ui-evc__summary` – what the answer couldn't see, in a sentence
2. **Count** `.ui-evc__pill` – how many categories are current
3. **Source row** `.ui-evc__row` – a category, its status glyph and its detail
4. **Status** `.ui-evc__state` – Current, Stale with its age, or No coverage
5. **Request coverage** `.ui-evc__act` – the request, or where it stands

## Looks

Standard puts the header and count on the gray tray above a white card holding the summary and rows. Clean is one
white card with the header as its first row and slightly thinner glyphs. The inline shape has no card in either
look: a summary line with a Sources button, and a sunken panel for the rows.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the next Request coverage or Retry button (and, inline, the Sources button) |
| Enter / Space | Presses the focused button: sends the request, retries it, or folds the rows in or out |

After a request, focus stays on the row – on its “Requested” or “Requesting…” note – rather than dropping to the page.

## Screen readers

The card is a `region` named by its heading; inline, it's named by the summary line. The rows are a list named
“Source categories”, and each status is spoken as text (“Stale · 14 months”, “No coverage”), never colour alone.
Request buttons are named for their row (“Request coverage for Field reports”), Retry likewise (“Retry the request
for Field reports”). The inline Sources button has `aria-expanded` and `aria-controls`. A polite status announces
“Requesting coverage for Field reports…”, “Coverage requested for Field reports.” and “Couldn't request coverage
for Field reports.”

## Content

- Name categories the way readers think of them – “Field reports”, “Sales and orders” – not system names.
- Give `age` as you'd say it: “14 months”, “3 days”. It's shown as given.
- Use `detail` for the fact behind the status: when it was last synced, why there's nothing.
- If your product has its own words for the statuses, set `statusLabels`; keep them to one or two words.

## Do

- Put it where the answer is read, not on a separate admin page.
- Pass a `requestCoverage` resolver so people see the request go through or fail.
- Update `sources` when new data arrives – the summary and count follow.

## Don't

- Don't show it only when coverage is perfect or only when it's poor – the point is that it's always there.
- Don't hide stale sources to make the count look better.
- Don't use “No coverage” for a source that was searched and had nothing relevant – that's coverage.

## Example

```html
<tc-evidence-coverage id="coverage" scope="For the answer on Northwind Freight"></tc-evidence-coverage>

<script type="module">
  import "trenchcoat/evidence-coverage";
  import "trenchcoat/tokens.css";

  const coverage = document.querySelector("#coverage");
  coverage.sources = [
    { id: "sales", label: "Sales and orders", status: "current" },
    { id: "filings", label: "Supplier filings", status: "stale", age: "14 months" },
    { id: "field", label: "Field reports", status: "none" },
  ];
  coverage.requestCoverage = (source, signal) => fetch(`/api/coverage/${source.id}`, { method: "POST", signal });
  coverage.addEventListener("tc-coverage-request", (e) => console.log("requested", e.detail.id));
</script>
```

```tsx
import { EvidenceCoverage, type CoverageSource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sources: CoverageSource[] = [
  { id: "sales", label: "Sales and orders", status: "current" },
  { id: "filings", label: "Supplier filings", status: "stale", age: "14 months" },
  { id: "field", label: "Field reports", status: "none" },
];

export function AnswerCoverage({ request }: { request: (id: string, signal: AbortSignal) => Promise<void> }) {
  return <EvidenceCoverage inline sources={sources} requestCoverage={(source, signal) => request(source.id, signal)} />;
}
```
