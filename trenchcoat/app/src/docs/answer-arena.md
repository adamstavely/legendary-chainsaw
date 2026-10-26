---
pattern: toolbar
status: new
related: run-compare, cited-answer, model-picker
---

## Overview

Two models answer the same prompt side by side, streaming together. Once both are done, people vote – A is better,
B is better, or a tie – and then pick a reason. In blind mode the model names stay hidden as “Model A” and “Model B”
until the vote, so people judge the answers, not the brands. It collects preferences for evaluating models, prompts
or settings without leaving the product.

## When to use

- Collecting people's preferences between two models, two prompts or two settings on real tasks.
- Blind comparisons, where knowing the model would bias the vote.
- Showing two answers to the same question when the difference is the point.

## When not to use

- Comparing two whole runs – steps, cost and time, not only the final text – use `run-compare`.
- A single answer with its sources – use `cited-answer`.
- Letting people choose which model to use from now on – use `model-picker`.

## Anatomy

1. **Prompt** `.ui-arena__prompt` – the prompt both models answered
2. **Answer** `.ui-arena__pane` – one side's answer, streaming with a caret, and a meta line once done
3. **Model** `.ui-arena__head` – the side's glyph and name – “Model A” in blind mode until the vote
4. **Vote** `.ui-arena__votes` – A is better, Tie, B is better
5. **Reasons** `.ui-arena__reasons` – why, offered once there's a vote

## Looks

Standard sets the prompt, then the two answers as white cards, then the vote, all on a gray tray. Clean is one white
card split by hairlines: the prompt with a small-capitals label on top, the answers side by side, the vote as the
last row. Both stack the answers in containers narrower than 560 px.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the vote once – to the chosen button, else A is better – and on to the reasons |
| ← / → | Moves between A is better, Tie and B is better, wrapping at the ends |
| Home / End | Moves to the first or last vote button |
| Enter / Space | Votes; on a reason, picks it or takes it back |

The vote buttons stay `aria-disabled` until both answers are done.

## Screen readers

Each answer is a section named “Answer A” or “Answer B”, `aria-busy` while it streams – the words aren't read out as
they arrive. A status region says “Both answers are in.” once streaming ends, then the vote: “You voted: A is
better.” – in blind mode followed by the names (“A was Atlas, B was Nova.”) – and “Reason: More accurate.” The vote
buttons are a toolbar named by the question, each `aria-pressed`; the reasons are a group named “Why?” of
`aria-pressed` buttons. The winning side is marked “Preferred”.

## Content

- Show the prompt as people wrote it; don't summarise it.
- Keep `question` neutral – “Which answer is better?” – rather than leading.
- Offer three to five `reasons`, each a short quality: “More accurate”, “Easier to follow”. Ties get their own `tieReasons`.
- Use `meta` for facts people may weigh, e.g. “1.8s · 212 tokens” – leave it out in blind tests where it would give a model away.

## Do

- Use `blind` whenever the vote feeds an evaluation.
- Stream both answers at once, so neither side gets a head start.
- Store the reason with the vote – it says more than the winner alone.

## Don't

- Don't compare more than two answers here.
- Don't let people vote before both answers are complete – the component holds the vote until then.
- Don't format answers with HTML – they're plain text with paragraphs, `- ` lists and `**bold**`.

## Example

```html
<tc-answer-arena id="arena" prompt="Explain RAG to a product manager in under 80 words." blind></tc-answer-arena>

<script type="module">
  import "trenchcoat/answer-arena";
  import "trenchcoat/tokens.css";

  const arena = document.querySelector("#arena");
  arena.answers = [
    { model: "Atlas", answer: "**RAG** lets the model look things up before it answers.", meta: "1.8s · 212 tokens" },
    { model: "Nova", answer: "Think of it as an open-book exam.", meta: "2.1s · 188 tokens" },
  ];
  arena.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { AnswerArena, type ArenaVote } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Compare({ a, b, streaming }: { a: string; b: string; streaming: boolean }) {
  const [vote, setVote] = useState<ArenaVote | null>(null);
  return (
    <AnswerArena
      prompt="Explain RAG to a product manager in under 80 words."
      blind
      answers={[
        { model: "Atlas", answer: a, streaming },
        { model: "Nova", answer: b, streaming },
      ]}
      value={vote}
      onChange={setVote}
    />
  );
}
```
