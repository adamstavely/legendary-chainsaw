---
pattern: none
status: new
related: claim-answer, retrieval-inspector, verification-queue, change-summary
---

## Overview

How fresh a piece of evidence is, as one of four bands – high, good, aging, stale – worked out from when it was
observed and how fast that kind of evidence decays. An exchange rate is stale within a month; a handbook stays
good for years. Evidence can also be contested (something else disputes it) or superseded (something newer
replaces it), whatever its age. As a badge it sits next to a source; as a strip it runs down the margin of a
document, one bar per paragraph, so people can see which parts rest on old evidence before they rely on them.

## When to use

- Next to a source, a retrieved passage or a dataset whose age changes how far it can be trusted.
- Down the margin of a report or brief built from evidence of different ages (`mode="strip"`).
- Wherever newer evidence can replace or dispute older evidence and people need to see that it has.

## When not to use

- The time something happened, with no judgement about freshness – write the date, or use `chat-history`'s date
  groups.
- Whether a claim is backed by a source at all – use `claim-answer`.
- A metric's movement over a period – use `change-summary`.

## Anatomy

1. **Mark** `.ui-vb__mark` – four signal bars in a tinted square, as many filled as the band is fresh
2. **Band** `.ui-vb__band` – the band in words
3. **Age** `.ui-vb__age` – how long ago the evidence was observed
4. **Flag** `.ui-vb__flag` – Contested or Superseded, when it applies
5. **Strip** `.ui-vb__strip` – the margin strip, one bar per paragraph
6. **Bar** `.ui-vb__seg` – one paragraph's band; dashed when aging, dotted when stale

## Looks

Standard draws the mark as a 20px square with small rounded corners and the band in the primary text colour, like
`change-summary`'s trend marks. Clean makes the mark a little smaller and rounder, draws thinner bars and sets the
band in the secondary text colour, so a row of badges stays quiet. In the strip, Standard's bars are 4px wide and
Clean's 3px; both widen on hover and focus.

## Keyboard

The badge takes no focus and handles no keys. The strip is one tab stop:

| Key | What it does |
|---|---|
| ↓ / → | Moves to the next bar and shows its tooltip |
| ↑ / ← | Moves to the previous bar and shows its tooltip |
| Home / End | Moves to the first or last bar |
| Enter / Space | Fires `tc-locate` for the bar's paragraph |
| Escape | Hides the tooltip |

## Screen readers

The badge's visible words are hidden and said as one sentence instead – “Aging evidence, observed 5 months ago,
contested” – which is also the host's `title`. `subject-label` changes “evidence” to your own word (“source”). In
`compact` mode only the mark shows, with the same sentence. The strip is a list named “Evidence freshness”
(`strip-label`); each bar is a button named after its paragraph and its band: “Supplier prices: Aging evidence,
observed 5 months ago, contested”. The tooltip repeats this for sighted people and is hidden from screen readers.

## Content

- Pick the profile by how fast the kind of evidence goes out of date, not by how important it is: “fast” for
  prices, status and news; “standard” for surveys and reports; “slow” for reference works; “lasting” for evidence
  that doesn't age.
- Give each strip item a short `label` that names the paragraph (“Supplier prices”) – it beats “Paragraph 3”.
- Use `bandLabels` for your organisation's own words, and keep them to one word each.
- Contested and superseded say why in your product, not in the badge: put “Contested by the August invoice” next
  to it.

## Do

- Set `now` when people look at evidence as of another day – a past review, a look ahead.
- Use the same profile for the same kind of evidence across the product, so bands mean the same thing.
- Line the strip up with the document (`for` and `selector`) and handle `tc-locate` to scroll to and mark the
  paragraph.

## Don't

- Don't read the band as truth: a fresh source can be wrong. Pair the badge with where a claim came from.
- Don't use only the colour to tell people a source is stale – keep the band word unless space really is short, and
  then use `compact`, which keeps the words in a tooltip.
- Don't put a strip next to a document whose paragraphs don't match its items one to one.

## Example

```html
<tc-validity-badge id="price" profile="fast" contested></tc-validity-badge>

<div style="display: flex; gap: 8px">
  <tc-validity-badge id="margin" mode="strip" for="report" selector="p"></tc-validity-badge>
  <article id="report">
    <p>Shipping costs rose 4% this quarter.</p>
    <p>Two suppliers still quote last year's prices.</p>
  </article>
</div>

<script type="module">
  import "trenchcoat/validity-badge";
  import "trenchcoat/tokens.css";

  document.querySelector("#price").observed = "2026-09-30";
  const margin = document.querySelector("#margin");
  margin.items = [
    { observed: "2026-10-19", label: "Shipping costs" },
    { observed: "2026-05-17", contested: true, label: "Supplier prices" },
  ];
  margin.addEventListener("tc-locate", (e) => e.detail.target?.scrollIntoView({ block: "center" }));
</script>
```

```tsx
import { ValidityBadge, type ValidityInfo } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const paragraphs: ValidityInfo[] = [
  { observed: "2026-10-19", label: "Shipping costs" },
  { observed: "2026-05-17", contested: true, label: "Supplier prices" },
];

export function SourceRow({ observed }: { observed: string }) {
  return <ValidityBadge observed={observed} profile="standard" />;
}

export function Margin() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <ValidityBadge mode="strip" htmlFor="report" selector="p" items={paragraphs} onLocate={(d) => d.target?.scrollIntoView()} />
      <article id="report">
        <p>Shipping costs rose 4% this quarter.</p>
        <p>Two suppliers still quote last year's prices.</p>
      </article>
    </div>
  );
}
```
