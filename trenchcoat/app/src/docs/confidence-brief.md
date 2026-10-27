---
pattern: none
status: new
related: provenance-summary, claim-answer, reliance-gauge, synthesis-notes
---

## Overview

An answer explained for someone who wasn't in the session – a manager, a client, the next person on the case. It reads
like a short printed brief: the conclusion and how confident it is, the kind of uncertainty behind it (data, model,
disagreement or time), what would change it, the assumptions it depends on, the signs to watch, and the track record
on similar questions, drawn as one dot per question. A reference at the foot opens the provenance record, and “Copy as
text” puts the whole brief on the clipboard, ready to paste into an email or a decision log.

## When to use

- Handing a conclusion to someone who will act on it without reading the conversation behind it.
- Attaching a summary to a decision, a ticket or a report.
- Ending an analysis session with something that can be shared, printed or archived.

## When not to use

- What a document is made of, section by section – use `provenance-summary`.
- Marking each claim in an answer with its source and confidence – use `claim-answer`.
- Whether trust in the AI matches how well it performs – use `reliance-gauge`.
- Working notes gathered while the analysis is still going on – use `synthesis-notes`.

## Anatomy

1. **Conclusion** `.ui-cfb__lead` – what was asked, what we conclude and how confident it is
2. **Kind of uncertainty** `[data-sec="kind"]` – data, model, disagreement or time, as labels, with a sentence on why
3. **Lists** `.ui-cfb__grid` – what would change it, key assumptions and signs to watch
4. **Track record** `[data-sec="record"]` – right so many of so many on similar questions, one dot each
5. **Provenance record** `.ui-cfb__ref` – the record's reference, which opens it
6. **Copy as text** `.ui-cfb__copy` – the whole brief as plain text

## Looks

Standard sets a white page in the gray tray: the header and Copy as text above it, the provenance reference on the
tray below. Clean is one white card with the header as its first row and the reference as its last, a quieter
conclusion and thinner icons. Both print without the tray, the shadows or the copy button. The lists sit in two
columns on a wide card and stack below 460 px.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between Copy as text and the provenance reference – both native buttons |
| Enter / Space | On Copy as text: copies the brief, or fires `tc-copy` for the app to handle |
| Enter / Space | On the provenance reference: fires `tc-provenance-open` |

## Screen readers

The brief is an `article` named by its heading. Each part is a `section` named by its label (“Kind of uncertainty”,
“Signs to watch”), so it can be reached by landmark or heading. The uncertainty labels are read with their meaning:
“Data – the evidence is thin or incomplete”. The track record is read as “17 of 20 Right 17 of 20 on similar
questions”; the dots are hidden. The provenance reference is a button named “Provenance record PR-2026-0441”. After a
copy, a status region says “Brief copied as text”, or “Couldn't copy the brief”.

## Content

- Write the conclusion as an answer to the question, in a sentence or two, with its range: “Probably, by 2–4 points”.
- Use `basis` for the kinds of source and how recent they are – not their names.
- Make “What would change it” and “Signs to watch” observable: events someone could notice, not states of mind.
- Say what counts as similar in the track record's `note`, and use a real count; leave `record` out when there is none.
- Keep `heading` short – a topic – and put the full question in `question`.

## Do

- Give the provenance reference the id people quote when they ask for the record.
- Let the brief copy itself, or prevent `tc-copy` and export the `detail.text` your own way.
- Show a low confidence plainly – the brief is for people deciding what weight to give the answer.

## Don't

- Don't paste the conversation in; the brief is for people who weren't there.
- Don't list every assumption – the two or three the conclusion depends on.
- Don't show a track record built from a handful of unrelated questions.

## Example

```html
<tc-confidence-brief id="brief" heading="Annual pricing and churn" meta="27 Oct · for the leadership meeting"></tc-confidence-brief>

<script type="module">
  import "trenchcoat/confidence-brief";
  import "trenchcoat/tokens.css";

  const brief = document.querySelector("#brief");
  brief.question = "Will annual-only pricing reduce churn?";
  brief.conclusion = "Probably, by 2–4 points over a year.";
  brief.confidence = "moderate";
  brief.uncertainty = ["data", "model"];
  brief.changers = ["Small teams cancelling at the annual renewal instead"];
  brief.record = { right: 17, total: 20, note: "Pricing questions since 2024" };
  brief.provenanceId = "PR-2026-0441";
  brief.addEventListener("tc-provenance-open", (e) => console.log("open record", e.detail.id));
</script>
```

```tsx
import { ConfidenceBrief } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function PricingBrief({ openRecord }: { openRecord: (id: string) => void }) {
  return (
    <ConfidenceBrief
      title="Annual pricing and churn"
      question="Will annual-only pricing reduce churn?"
      conclusion="Probably, by 2–4 points over a year."
      confidence="moderate"
      uncertainty={["data", "model"]}
      assumptions={["Sign-ups don't fall by more than 10%"]}
      signals={["Trial-to-paid conversion in the first two weeks"]}
      record={{ right: 17, total: 20 }}
      provenanceId="PR-2026-0441"
      onOpenProvenance={openRecord}
    />
  );
}
```
