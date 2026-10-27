---
pattern: none
status: new
related: disagreement-banner, reliance-gauge, reflection-gate, claim-answer
---

## Overview

Shows how often the AI went along with the person's framing this session and how often it pushed back. Each answer is
a mark in a running record – agreed, pushed back or neutral, as the app classifies it – beside the agreement rate and
the current run. When the AI agrees several times in a row (two by default) the tracker turns amber, underlines the run
and offers “Show the other side”, so a run of easy agreement becomes a prompt to hear the strongest case against. It
works as a small card beside a conversation or as one compact strip inside it.

## When to use

- In a chat or analysis session where people lead with their own view and the model tends to agree.
- Beside work that ends in a decision, where agreeing too readily has a cost.
- Under the latest answer as `layout="inline"`, when there's no room for a card.

## When not to use

- Today's answer contradicts an earlier one – use `disagreement-banner`.
- Whether people's trust matches how well the AI performs over weeks – use `reliance-gauge`.
- Asking someone to stop and think before acting on a high-stakes answer – use `reflection-gate`.
- Marking up the claims inside one answer – use `claim-answer`.

## Anatomy

1. **Rate** `.ui-agr__big` – the share of answers that took a side and agreed
2. **Current run** `.ui-agr__stat[data-kind="run"]` – how many answers in a row agreed or pushed back
3. **Record** `.ui-agr__record` – one mark per answer, oldest first; the run of agreements underlined in amber
4. **Key** `.ui-agr__key` – what the three marks mean
5. **Warning** `.ui-agr__warn` – at the threshold: why it turned amber, and Show the other side

## Looks

Standard puts the header and the warning on the gray tray around a white card; when the tracker is warned the tray
itself turns amber. Clean is one white card with lighter figures and thinner icons: the warning is its last row on an
amber tint, with a thin amber rule down the left edge. Inline, Standard is a tinted strip and Clean a white one.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Reaches Show the other side, the only control – it appears once the tracker is warned |
| Enter / Space | On Show the other side: fires `tc-counter-request` |

The record and the figures are read, not operated.

## Screen readers

As a card the tracker is a `region` named by its heading (“Agreement”); inline it is a `group` with the heading as its
`aria-label`. The record is a list named “Turns, oldest first”, and each mark is read as “Turn 4: Agreed – Long forms”;
turns beyond the window are read as “+6 earlier turns”. When the run of agreements reaches the threshold, a polite
status region says “2 agreements in a row. Show the other side is available.” once – not again on every agreement
after – and clears when a push-back ends the run.

## Content

- Classify each answer against the person's framing, not against the facts: an answer that confirms a wrong premise
  is still “agreed”.
- Give each turn a `label` of a few words – what was asked – so the record means something on hover and to a screen
  reader.
- Rename the stances with `stanceLabels` to match your product (“Aligned”, “Challenged”) and keep them short.
- Keep `warningText` about the pattern, not the person: “The last 3 answers agreed with you”, not “You're leading the
  AI”.

## Do

- Answer `tc-counter-request` with the strongest case against the run's conclusion, and add it as a turn.
- Keep the threshold low – two or three – so the prompt comes while it can still change a decision.
- Put the inline strip under the latest answer, where the person is reading.

## Don't

- Don't treat a high rate as an error; a person who is right should hear agreement.
- Don't count neutral answers as agreement – they neither extend nor break a run.
- Don't hide the button behind a menu; the point is that the other side is one press away.

## Example

```html
<tc-agreement-tracker id="agreement" scope="Sign-up drop-off · this session"></tc-agreement-tracker>

<script type="module">
  import "trenchcoat/agreement-tracker";
  import "trenchcoat/tokens.css";

  const tracker = document.querySelector("#agreement");
  tracker.threshold = 2;
  tracker.turns = [
    { id: "t1", stance: "pushed-back", label: "Cutting the form" },
    { id: "t2", stance: "agreed", label: "Long forms" },
    { id: "t3", stance: "agreed", label: "Removing the phone field" },
  ];
  tracker.addEventListener("tc-counter-request", (e) => console.log("show the other side of", e.detail.run, "answers"));
</script>
```

```tsx
import { AgreementTracker, type AgreementTurn } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SessionAgreement({ turns, showCounter }: { turns: AgreementTurn[]; showCounter: (turnId?: string) => void }) {
  return (
    <AgreementTracker
      layout="inline"
      turns={turns}
      threshold={2}
      onRequestCounter={(detail) => showCounter(detail.turnId)}
    />
  );
}
```
