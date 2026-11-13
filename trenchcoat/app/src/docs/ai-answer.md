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

Two states cover what goes wrong. **Interrupted** (`interrupted`) is an answer that stopped part way – the reader
stopped it, the connection dropped, or it reached its length limit. The text written so far stays, a quiet notice says
why in words, and Continue and Retry are offered. **Unavailable** (`unavailable`) is a model that can't answer right
now – busy or down. The notice says so and when it will try again, as a countdown that keeps itself fresh, with Try
now and, when you name one, “Use <fallback>” to answer with another model.

## When to use

- Answers from a knowledge base, search or company documents, where people need to see and check the sources.
- One question and its answer as a unit – a help panel, a search results page, an “Ask” box.
- Streaming answers from your model: pass the text as it grows and set `streaming` until it's complete.
- Answers that can be cut off – a dropped connection, a token limit, a Stop – where people should keep what they
  have and carry on (`interrupted`).
- A model that's overloaded, rate-limited or down, where people should see when it will try again and what else they
  can do (`unavailable`).

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
6. **Footer** `.ui-ans__foot` – Stop while writing; then Copy, Regenerate, Good answer, Bad answer and the status.
   `hide-actions` leaves the finished row out, for an app that puts `message-actions` there instead
7. **Notice** `.ui-ans__notice` – an interrupted answer (why, Continue and Retry) or an unavailable model (busy or
   down, the countdown `.ui-ans__notice-when`, Try now and Use <fallback>)

## Looks

Standard sets the question on a gray tray, the answer on a white card below it and the footer on the tray, and its assistant is
a small blue cloud whose eyes scan the sources and follow the text. Clean has no tray: one white card holds
everything, the question as its first row and the footer as its last, and the assistant is a blue sparkle; its icons are smaller and thinner. Both
stream, cite and preview the same way. The notice is a soft gray panel under the text in both looks, its first button
the primary one.

## Keyboard

Everything is a link or a button; Tab moves through the source cards, the citation chips, Stop or the actions, the
reasons and the follow-up questions.

| Key | What it does |
|---|---|
| Tab | Moves to the next card, chip or button; focusing a citation chip opens its preview |
| Enter / Space | On a citation chip: opens or closes the preview. On a button: presses it |
| Escape | Closes the source preview, wherever focus is |

The notice's buttons – Continue and Retry, or Try now and Use <fallback> – are ordinary buttons in the Tab order.

## Screen readers

The question is a heading, and the sources a list named “Sources”. The label says what's happening (“Reading 3
sources”, “Writing”, “Answer”), and the answer is `aria-busy` until it's finished. Each citation chip reads its
source's name and title (“Notion – Remote work policy (2026)”); while its preview is open the chip is described by
it. Good answer and Bad answer are toggle buttons with `aria-pressed`, and Copy answer becomes “Copied”. A polite
status says how the answer ended and what happened next: “Answered in 3.2s”, “Stopped”, “Copied”, “What went wrong?”,
“Thanks for the feedback”. A failed regenerate is an alert (“Couldn't regenerate: …”).

The notice is a group named by its sentence. When an answer is interrupted the status says why, once (“The
connection dropped before the answer finished.”), and the footer's status reads “Connection lost”, “Stopped before
it finished” or “Reached the length limit”. While the model is unavailable the label says “Waiting for Atlas” and the
status says “Atlas is busy right now.” once; the countdown in the notice updates silently, so it's read only when
people move to it.

## Content

- Put the person's question in `question`, as they asked it.
- Lead with the answer itself, then the details – the first sentence should stand on its own.
- Cite where a claim comes from, right after the claim; keep `[1]` out of the middle of a phrase.
- Leave a blank line before and after a list – a list item directly under a sentence is read as part of that
  paragraph.
- Give each source a short `name` people recognise (“Notion”, “Slack”) – it's the text on the chip – and a `snippet`
  with the passage the answer relies on.
- Offer follow-ups as full questions people would ask next, not topics.
- Leave the notice's sentence to the element unless you know more: a `message` such as “Your plan allows 4,000
  words per answer.” beats a generic one.
- Give `unavailable.retryAt` only when you'll really try again then, and name a `fallback` people would accept.

## Do

- Set `onRegenerate` and return a promise, so a failure shows in the footer and Regenerate can be tried again.
- Use `feedbackReasons` to ask about the problems you can act on.
- Pass `animate={false}` (React) or `animated = false` for answers loaded from history.
- In a conversation that puts `message-actions` under every reply, set `hide-actions` (React: `hideActions`) so the
  answer doesn't show a second row of the same actions.
- After `tc-stop`, set `interrupted = { reason: "stopped" }` if people may want to carry on.
- In React, own `interrupted` and `unavailable`: Continue and Retry call `onContinue` and `onRetry`, and the page
  clears the state when it asks again.
- On Continue, keep the text and stream the rest on after it: an `answer` that starts with the old one is written on,
  not started over.

## Don't

- Don't cite numbers that have no source – `[4]` with three sources is left out of the text.
- Don't put links in the answer text; it's plain text, and sources belong in the cards.
- Don't hide the sources to save space – the answer is only as trustworthy as what people can check.
- Don't throw away a cut-off answer and start over without asking – `interrupted` keeps it.
- Don't leave `unavailable` set once the model answers again – clear it, and the answer starts over.

## Example

```html
<tc-ai-answer id="answer" question="Can I work from abroad for a few weeks?"></tc-ai-answer>

<script type="module">
  import "@adamstavely/trenchcoat/ai-answer";
  import "@adamstavely/trenchcoat/tokens.css";

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

  // The connection dropped: keep the text, say why, offer Continue and Retry
  answer.interrupted = { reason: "network" };
  answer.addEventListener("tc-continue", () => {
    // The element clears `interrupted`; stream the rest on after the text so far
    answer.streaming = true;
  });

  // Or: the model is busy – try again in 40 seconds, or answer with another model now
  // answer.unavailable = { model: "Atlas", reason: "busy", retryAt: Date.now() + 40_000, fallback: "Nova" };
  answer.addEventListener("tc-retry", (e) => console.log("Ask again with", e.detail.model ?? "the same model"));
</script>
```

```tsx
import { AIAnswer, type AnswerSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: AnswerSource[] = [
  {
    title: "Remote work policy (2026)",
    name: "Notion",
    href: "https://www.notion.so",
    snippet: "Up to 30 working days a year.",
  },
];

export function Answer({
  text,
  streaming,
  cutOff,
  busyUntil,
  onAskAgain,
}: {
  text: string;
  streaming: boolean;
  cutOff: boolean;
  busyUntil?: number;
  onAskAgain: (model?: string, keepText?: boolean) => void;
}) {
  return (
    <AIAnswer
      question="Can I work from abroad for a few weeks?"
      sources={sources}
      answer={text}
      streaming={streaming}
      followUps={["How do I request manager approval?"]}
      onFeedback={(value, reason) => console.log(value, reason)}
      interrupted={cutOff ? { reason: "network" } : null}
      unavailable={busyUntil ? { model: "Atlas", reason: "busy", retryAt: busyUntil, fallback: "Nova" } : null}
      onContinue={() => onAskAgain(undefined, true)}
      onRetry={(retry) => onAskAgain(retry.model)}
    />
  );
}
```
