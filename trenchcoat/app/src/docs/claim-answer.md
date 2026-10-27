---
pattern: disclosure
status: new
related: cited-answer, verification-queue, validity-badge, ai-answer
---

## Overview

An AI answer you can check claim by claim. Each claim says where it came from – a source the model retrieved, the
model's own knowledge, or an inference from other claims – how sure the model is, and, where it applies, why it
can't be sure: the world hasn't settled it, the evidence is thin, or it's beyond what the model can know. Under the
answer waits the strongest case against it. People can see at a glance which parts rest on evidence and which on
the model's say-so, and send the claims that matter to a verification queue before they rely on them.

Beyond the three text types, a claim can come from a medium – a machine transcript, a video, a recording, an image or
text read off a scan (OCR), shown with how well it was read (“OCR 72%”) – or from memory: an earlier session, the
team's shared knowledge or another agent's finding. The app sets a confidence ceiling for any type, so a transcript
claim never looks surer than transcripts deserve, and can tag the question the answer replies to – factual,
analytical, predictive or opinion – so people know how much uncertainty to expect before they read.

## When to use

- Answers people will act on or pass on – a recommendation, a briefing, a finding – where some claims are sourced
  and some aren't.
- Products that ask people to verify what the model says before it leaves the room (pair it with
  `verification-queue`).
- Answers to questions with a real other side, where the counter-position should travel with the answer.

## When not to use

- Every sentence comes from a retrieved source and you only need to show which – use `cited-answer`.
- Chat replies that are conversation, not claims – use `ai-answer`.
- Reviewing claims collected across a session – use `verification-queue`.
- Showing only how fresh a source is – use `validity-badge`.

## Anatomy

1. **Question type** `.ui-cla__qtype` – the kind of question the answer replies to, when the app sets it
2. **Key** `.ui-cla__keys` – the source types with their counts; pressing one picks out its claims
3. **Claim** `.ui-cla__claim` – one claim, underlined in its source type's colour and line style
4. **Uncertainty mark** `.ui-cla__unc` – a small “?” after a claim the model can't be sure of
5. **Claim detail** `.ui-cla__detail` – the source type (and how well a medium was read), the confidence – capped where a ceiling applies – the uncertainty, the passages behind it and Send to verification
6. **Counter-position** `.ui-cla__counter` – the strongest case against the answer, folded
7. **Caption** `.ui-cla__caption` – how many claims rest on a source or a medium, or what the pointer is on

## Looks

Standard sets the answer on a white card in a gray tray, with the caption on the tray and the open claim on a light
gray well. Clean is one white card: the caption is its last row under a hairline, the open claim is a raised card of
its own and the key's buttons are smaller. Both use the same underlines – solid for sourced, dashed for model
knowledge, dotted for inferred, double for the media types and wavy for the memory types – so the families read
without colour, and the label names each type.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the key's buttons, then to the claims – one stop, on the last claim used – then the open claim and the counter-position |
| → / ↓ | Moves to the next claim |
| ← / ↑ | Moves to the previous claim |
| Home / End | Moves to the first or last claim |
| Enter / Space | Opens the claim's detail, or closes it |
| Escape | Closes the open claim and returns focus to it |

## Screen readers

The host is a group named “Answer, claim by claim” unless the page names it. Each claim is a button that reads its
words, then its type, confidence and uncertainty (“Faster delivery usually lifts repeat purchases, Model knowledge,
62% confidence, Thin evidence”), with `aria-expanded` and `aria-controls` pointing at the detail, a region named
“Claim: …”. A media claim adds how well it was read (“OCR 72%”), and a capped confidence says so (“72% confidence
(capped)”). The confidence is a meter (“62%, medium”, or “80%, high, capped”), and the detail explains a cap: “Capped
at 80% – the model said 88%, but transcript claims are shown no higher.” The question tag reads “Question type:
Predictive”, then what that means. The key's buttons are toggle buttons (`aria-pressed`) in a
group named “Source types”. A polite status says “Sent to verification: …” and “Showing model knowledge claims”.
Each source's freshness badge says, for example, “Aging source, observed 5 months ago, contested”.

## Content

- Split the answer at claims a person could check on their own – one fact, figure or judgement each. Leave the
  words between them (“so”, “and”) as plain text.
- Mark a claim `grounded` only when a retrieved passage states it; a conclusion drawn from two sources is
  `inferred`.
- Use `note` for one short sentence on why a claim is uncertain or how it was inferred: “Studies disagree on how
  much.”
- Write the counter-position as the best argument against the answer, not a disclaimer: name what could be wrong
  and why.
- Rename the source types for your field with `sourceLabels`; keep the kinds. Mark a claim read from a recording, an
  image or a scan with its media type, not `grounded`, so people check the original.
- Use a memory type for what the model remembers rather than retrieves now; its note says it may be out of date.
- Set `questionType` from your own classifier; leave it unset when you don't classify questions.

## Do

- Give every claim a confidence the model actually produced, and set `confidenceBands` to where your evaluation
  shows the levels change.
- Attach a source's `validity` so an old or disputed passage shows it next to the claim it supports – and set
  `changed` on it when the source has changed since the answer used it.
- Set `confidenceCeilings` from your evaluation of each type, and pass `recognition` for media claims, so a shaky
  transcript or a poor scan can't look certain.
- Handle `tc-verify` and add the claim to your verification queue.

## Don't

- Don't mark connecting text as a claim – it dilutes the ones that matter.
- Don't hide the counter-position for answers people will act on.
- Don't use colour alone to tell types apart in your own additions – keep the underline styles.
- Don't use a ceiling to hide a confidence you don't trust – the detail says what the model said.

## Example

```html
<tc-claim-answer id="answer"></tc-claim-answer>

<script type="module">
  import "trenchcoat/claim-answer";
  import "trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.sources = [
    { id: "quote", site: "Freight quote", title: "Carrier quote", quote: "Per-order cost: $6.42 against $6.17.", validity: { observed: "2026-05-17", contested: true } },
  ];
  answer.claims = [
    { id: "c1", text: "The northern hub costs about 4% more per order.", source: "grounded", confidence: 0.86, sources: ["quote"] },
    { id: "c2", text: " Fuel prices will decide much of the gap.", source: "model", confidence: 0.35, uncertainty: "unsettled" },
    { id: "c3", text: " The lease starts in February.", source: "ocr", confidence: 0.9, recognition: 0.72 },
  ];
  answer.confidenceCeilings = { transcript: 0.8, ocr: 0.85, session: 0.7 };
  answer.questionType = "analytical";
  answer.counter = "The quote is five months old and disputed.";
  answer.addEventListener("tc-verify", (e) => console.log(e.detail.claim, e.detail.sources));
</script>
```

```tsx
import { useState } from "react";
import { ClaimAnswer, type AnswerClaim, type ClaimSource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sources: ClaimSource[] = [{ id: "quote", site: "Freight quote", title: "Carrier quote", validity: { observed: "2026-05-17" } }];
const claims: AnswerClaim[] = [
  { id: "c1", text: "The northern hub costs about 4% more per order.", source: "grounded", confidence: 0.86, sources: ["quote"] },
  { id: "c2", text: " Fuel prices will decide much of the gap.", source: "model", confidence: 0.35, uncertainty: "unsettled" },
  { id: "c3", text: " Last time, fit-out ran six weeks late.", source: "session", confidence: 0.8 },
];

export function Answer() {
  const [queued, setQueued] = useState<string[]>([]);
  return (
    <ClaimAnswer
      claims={claims}
      sources={sources}
      counter="The quote is five months old and disputed."
      questionType="predictive"
      confidenceCeilings={{ transcript: 0.8, session: 0.7 }}
      queued={queued}
      onQueuedChange={setQueued}
      onVerify={(claim) => console.log("verify", claim.id)}
    />
  );
}
```
