---
pattern: none
status: new
related: breakdown-chart, confidence-brief, reasoning-flags, claim-answer
---

## Overview

Where an answer's uncertainty comes from. Not all uncertainty is the same: some would shrink with more information,
some can't be known yet, and some is past what the model knows – and each asks for something different. A reading card
shows the whole answer's mix as one bar, each kind with its share and what it means, and a short reading of what to
do, led by the kind that weighs most and the part of the answer that carries the most. Beside it, the library's
Breakdown Chart shows the same mix per part of the answer, with its linked table. Hiding a kind in the chart's legend
hides it from the reading too.

## When to use

- Explaining why an AI answer is uncertain, not just how much.
- Pointing a reviewer at the part of an answer to check first.
- Comparing the kinds of uncertainty across the sections or claims of a report.

## When not to use

- One confidence figure for an answer – use `confidence-brief`.
- Flags on specific steps of the reasoning – use `reasoning-flags`.
- A general breakdown of work or cost – use `breakdown-chart` on its own.

## Anatomy

1. **Card** `.ui-umix__card` – the reading card, with the shared header
2. **Bar** `.ui-umix__bar` – the whole answer's mix, one segment per kind
3. **Kinds** `.ui-umix__kinds` – each kind's share, name and meaning
4. **Reading** `.ui-umix__reading` – what to do, led by the largest kind and the heaviest part
5. **Chart** `.ui-umix__chart` – the same mix per part of the answer, with its table and legend

## Looks

Standard puts the card's header on a gray tray above a white card, beside the chart's own tray. Clean is one white card
with the header as its first row, and lighter weights for the shares. The kinds' colours are tokens by default:
violet for missing information, blue for inherent uncertainty and amber for model limits.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the chart's pickers, legend and table |
| Enter / Space | On a legend chip, hides or shows that kind – the reading follows |

The reading card itself has nothing to operate.

## Screen readers

The card is a region named by its heading. The bar is an image named by the mix – “Missing information 45%, Inherent
uncertainty 30%, Model limits 25%” – and the kinds repeat it as a list. The reading is a polite live region, so hiding
a kind announces the new reading. The chart reads as it does on its own.

## Content

- Name each kind for what it is, not how bad it is: “Missing information”, not “High risk”.
- Keep `meaning` to a few words and `advice` to one sentence that says what to do.
- Use the parts a reader would recognise – the answer's sections, or its claims – and set `part-label` to match.
- Amounts are relative: any unit works, as long as it's the same throughout.

## Do

- Order the kinds the same way in every answer, so the colours keep their meaning.
- Keep custom colours at 3:1 against the card in both themes.
- Listen for `tc-hidden-change` if the page keeps what the person hid.

## Don't

- Don't use it for a single number – a bar of one kind says nothing.
- Don't mix units between sources.
- Don't add more than four or five kinds; the reading stops being readable.

## Example

```html
<tc-uncertainty-mix id="mix" subtitle="Will the new checkout lift conversion next quarter?"></tc-uncertainty-mix>

<script type="module">
  import "trenchcoat/uncertainty-mix";
  import "trenchcoat/tokens.css";

  const mix = document.querySelector("#mix");
  mix.sources = [
    { part: "Baseline", kind: "gap", amount: 6 },
    { part: "Forecast", kind: "chance", amount: 11 },
    { part: "Forecast", kind: "model", amount: 20, claim: "Seasonality beyond two years of data" },
  ];
  mix.addEventListener("tc-hidden-change", (e) => console.log(e.detail.hiddenKinds));
</script>
```

```tsx
import { useState } from "react";
import { UncertaintyMix, type UncertaintySource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sources: UncertaintySource[] = [
  { part: "Baseline", kind: "gap", amount: 6 },
  { part: "Forecast", kind: "chance", amount: 11 },
  { part: "Forecast", kind: "model", amount: 20, claim: "Seasonality beyond two years of data" },
];

export function AnswerUncertainty() {
  const [hidden, setHidden] = useState<string[]>([]);
  return <UncertaintyMix sources={sources} subtitle="Will the new checkout lift conversion next quarter?" hidden={hidden} onHiddenChange={setHidden} />;
}
```
