---
pattern: none
status: stable
related: cited-answer, answer-arena, message-actions, thinking-state
---

## Overview

An assistant's answer to one question, with the sources it drew on. The source cards pop in first while the
assistant “reads”, then the answer streams in word by word with citation chips in the text. Pointing at a chip
previews its source and lights up the matching card above it, and pointing at a card lights up its chips. When the
answer is finished, people can copy it with its sources, regenerate it, rate it – a thumbs down asks why – and pick a
follow-up question. The answer is plain text: blank lines make paragraphs, a paragraph whose every line starts with “- ” is a
list, `**bold**` is bold and `[1]` or `[1,3]` cite sources.

## When to use

- Answers from a knowledge base, search or company documents, where people need to see and check the sources.
- One question and its answer as a unit – a help panel, a search results page, an “Ask” box.
- Streaming answers from your model: pass the text as it grows and set `streaming` until it's complete.

## When not to use

- When people need to check each sentence against the exact passage it came from – use `cited-answer`.
- Comparing two models' answers to the same prompt – use `answer-arena`.
- Messages in a running conversation, where each reply needs only copy, regenerate and feedback – use
  `message-actions` under the message.
- Showing the steps and searches while the model is still thinking – use `thinking-state`.

## Anatomy

1. **Header** – the shared card header: a boxed icon and the question that was asked (none when there is no question)
2. **Sources** `.ui-ans__sources` – numbered cards, each with its site, logo and title
3. **Label** `.ui-ans__label` – the assistant's mark and what it's doing: reading, writing, or done
4. **Answer** `.ui-ans__answer` – the streamed text, with paragraphs, lists and bold
5. **Citation** `.ui-ans__cite` – a chip naming its source; it previews the source and lights up its card
6. **Footer** `.ui-ans__foot` – Stop while writing; then Copy, Regenerate, Good answer, Bad answer and the status

## Looks

Standard sets the question on a gray tray, the answer on a white card below it and the footer on the tray, and its assistant is
a small blue cloud whose eyes scan the sources and follow the text. Clean has no tray: one white card holds
everything, the question as its first row and the footer as its last, and the assistant is a blue sparkle; its icons are smaller and thinner. Both
stream, cite and preview the same way.

## Keyboard

Everything is a link or a button; Tab moves through the source cards, the citation chips, Stop or the actions, the
reasons and the follow-up questions.

| Key | What it does |
|---|---|
| Tab | Moves to the next card, chip or button; focusing a citation chip opens its preview |
| Enter / Space | On a citation chip: opens or closes the preview. On a button: presses it |
| Escape | Closes the source preview, wherever focus is |

## Screen readers

The question is a heading, and the sources a list named “Sources”. The label says what's happening (“Reading 3
sources”, “Writing”, “Answer”), and the answer is `aria-busy` until it's finished. Each citation chip reads its
source's name and title (“Notion – Remote work policy (2026)”); while its preview is open the chip is described by
it. Good answer and Bad answer are toggle buttons with `aria-pressed`, and Copy answer becomes “Copied”. A polite
status says how the answer ended and what happened next: “Answered in 3.2s”, “Stopped”, “Copied”, “What went wrong?”,
“Thanks for the feedback”. A failed regenerate is an alert (“Couldn't regenerate: …”).

## Content

- Put the person's question in `question`, as they asked it.
- Lead with the answer itself, then the details – the first sentence should stand on its own.
- Cite where a claim comes from, right after the claim; keep `[1]` out of the middle of a phrase.
- Leave a blank line before and after a list – a list item directly under a sentence is read as part of that
  paragraph.
- Give each source a short `name` people recognise (“Notion”, “Slack”) – it's the text on the chip – and a `snippet`
  with the passage the answer relies on.
- Offer follow-ups as full questions people would ask next, not topics.

## Do

- Set `onRegenerate` and return a promise, so a failure shows in the footer and Regenerate can be tried again.
- Use `feedbackReasons` to ask about the problems you can act on.
- Pass `animate={false}` (React) or `animated = false` for answers loaded from history.

## Don't

- Don't cite numbers that have no source – `[4]` with three sources is left out of the text.
- Don't put links in the answer text; it's plain text, and sources belong in the cards.
- Don't hide the sources to save space – the answer is only as trustworthy as what people can check.

## Example

```html
<tc-ai-answer id="answer" question="Can I work from abroad for a few weeks?"></tc-ai-answer>

<script type="module">
  import "trenchcoat/ai-answer";
  import "trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.sources = [
    {
      title: "Remote work policy (2026)",
      name: "Notion",
      href: "https://www.notion.so",
      snippet: "Up to 30 working days a year.",
    },
  ];
  answer.followUps = ["How do I request manager approval?"];
  answer.answer = "Yes – for **up to 30 working days a year**, with your manager's approval [1].";
  answer.addEventListener("tc-follow-up", (e) => console.log(e.detail.question));
</script>
```

```tsx
import { AIAnswer, type AnswerSource } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const sources: AnswerSource[] = [
  {
    title: "Remote work policy (2026)",
    name: "Notion",
    href: "https://www.notion.so",
    snippet: "Up to 30 working days a year.",
  },
];

export function Answer({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <AIAnswer
      question="Can I work from abroad for a few weeks?"
      sources={sources}
      answer={text}
      streaming={streaming}
      followUps={["How do I request manager approval?"]}
      onFeedback={(value, reason) => console.log(value, reason)}
    />
  );
}
```
