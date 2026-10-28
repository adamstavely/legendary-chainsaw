---
pattern: disclosure
status: new
related: provenance-summary, confidence-brief, evidence-coverage, data-table
---

## Overview

What's known about a person, an organisation or a record, and how far each fact can be trusted. Facts sit in labelled
sections, and every value carries a small tag naming its source and grade, e.g. “Registry · A1”. Grades use the
Admiralty (NATO) scale:
- **The letter** says how reliable the source is: A completely reliable through E unreliable, and F can't be judged.
- **The digit** says how credible the information is: 1 confirmed through 5 improbable, and 6 can't be judged.

Each grade falls into a confidence band: high, medium, low or unknown. The band tints the tag and fills a three-bar
mark. When two sources disagree, both readings show under a “Conflicting” pill. A fact nobody has a value for says so
plainly.

## When to use

- A customer, supplier or counterparty profile in due diligence (KYC) or onboarding, where every fact needs its source.
- Research or case notes where readers must weigh sources against each other.
- Any record assembled from several systems that don't always agree.

## When not to use

- Where an answer's claims came from – use `provenance-summary`.
- How confident an AI is in one answer – use `confidence-brief`.
- Which claims have evidence behind them – use `evidence-coverage`.
- Many records with the same fields, to sort and filter – use `data-table`.

## Anatomy

1. **How grades work** `.ui-fsh__legend-btn` – opens the scale under the header
2. **Scale** `.ui-fsh__legend` – the letters, the digits and which band each falls in
3. **Section** `.ui-fsh__section` – a titled group of facts; two columns of sections when the element is wide
4. **Label** `.ui-fsh__label` – what the fact is, with a “Conflicting” pill when sources disagree
5. **Value** `.ui-fsh__value` – the value or values, or “Not known”
6. **Source tag** `.ui-fsh__tag` – the source and grade, tinted by band with a three-bar mark
7. **Copy** `.ui-fsh__copy` – copies the value, when `copyable`

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight values. Clean is one
white card with the header as its first row and regular-weight values. The tags, bands and scale are the same in both.

## Keyboard

There's nothing to move between: Tab reaches “How grades work” and each Copy button in reading order.

| Key | What it does |
|---|---|
| Tab | Moves to “How grades work”, then each Copy button |
| Enter / Space | Opens or closes the scale; copies a value |

Copy buttons fade in on hover and show whenever they have focus, or always on touch screens.

## Screen readers

Each section is a region named by its title, holding a description list of labels and values. A source tag reads in
full, “Source: Registry, grade A1 (completely reliable source, confirmed). High confidence”, followed by its note if
it has one. The short tag and the bars are hidden. A conflicting fact's other readings start with “Another source
says”. “How grades work” is a disclosure button (`aria-expanded`) that controls the scale, a region labelled “How
grades work”. Copying is confirmed in a polite status message, “Full name copied”, or “Couldn't copy”.

## Content

- Name sources the way your team does, short: “Registry”, “Passport”, “Customer”, “Screening”.
- Grade both parts honestly: a reliable registry can still hold old information (A3).
- Put dates and links in the source's `note`: “Checked against three sanctions lists, 2 Oct 2026”.
- Leave `value` out when nobody knows, rather than writing “Unknown” – the element says it the same way everywhere.
- Set `band` on a source only when your own rules differ from the scale.

## Do

- Keep conflicting readings until someone resolves them – the disagreement is the finding.
- Group facts the way reviewers check them: identity, business, ownership.
- Turn on `copyable` for values people paste elsewhere: names, company numbers.

## Don't

- Don't use the tag colours for anything but confidence – the band is all they mean.
- Don't drop the grade to save space; a tag with no grade reads as unknown confidence.
- Don't hide “How grades work” unless the page explains the scale nearby.

## Example

```html
<tc-fact-sheet id="facts" heading="Customer profile"></tc-fact-sheet>

<script type="module">
  import "trenchcoat/fact-sheet";
  import "trenchcoat/tokens.css";

  const facts = document.querySelector("#facts");
  facts.sections = [
    {
      id: "identity",
      title: "Identity",
      facts: [
        { id: "name", label: "Full name", value: "Elena María Ruiz", source: { label: "Passport", grade: "A1" }, copyable: true },
        {
          id: "address",
          label: "Address",
          value: "Calle de la Loza 14, Valencia",
          source: { label: "Registry", grade: "A2" },
          alternatives: [{ value: "Avenida del Puerto 210, Valencia", source: { label: "Customer", grade: "C3" } }],
        },
      ],
    },
  ];
  facts.addEventListener("tc-copy", (e) => console.log(e.detail.fact, e.detail.text));
</script>
```

```tsx
import { FactSheet, type FactSection } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sections: FactSection[] = [
  {
    id: "identity",
    title: "Identity",
    facts: [
      { id: "name", label: "Full name", value: "Elena María Ruiz", source: { label: "Passport", grade: "A1" }, copyable: true },
      { id: "tax", label: "Tax residence", source: { label: "Customer", grade: "C3" } },
    ],
  },
];

export function Profile() {
  return <FactSheet title="Customer profile" sections={sections} onCopy={(fact, text) => console.log(fact, text)} />;
}
```
