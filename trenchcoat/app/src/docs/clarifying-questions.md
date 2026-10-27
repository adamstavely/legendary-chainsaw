---
pattern: radio
status: new
related: stepper-form, segmented-control, chat-composer, prompt-starters
---

## Overview

An agent asks before it starts, when a request leaves room for a wrong guess: two or three structured questions –
one choice, several choices or a short answer – answered in place in the thread and sent back as one reply. Every
question offers “You decide”, so people can hand any of them back, and “Skip, you decide” hands back the lot. A few
seconds of answers saves a run that would have gone the wrong way; once sent, the card folds into the answers so the
thread reads as a conversation.

## When to use

- The request is ambiguous in a way that changes the result – length, audience, scope, format.
- The agent can name the likely answers, so people pick rather than type.
- Before a long or costly run, where starting over is expensive.

## When not to use

- A multi-step form people fill in on purpose, with review and validation – use `stepper-form`.
- One setting with a few options in a toolbar or panel – use `segmented-control`.
- Suggesting what to ask next, not asking for an answer – use `prompt-starters`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the agent's question, and what it will do once it knows
2. **Question** `.ui-clq__q` – numbered, with an optional hint; the number turns into a check once answered
3. **Answers** `.ui-clq__choices` – chips or, when they have descriptions, cards; “You decide” is dashed with a spark
4. **Short answer** `.ui-clq__text` – a field, with You decide beside it
5. **Send** `.ui-clq__foot` – “1 of 3 answered”, Skip, and Send answers

## Looks

Standard puts the header on the gray tray and the questions on a white card below it, with answers as white chips and the progress and Send
on the tray below. Clean is one white card with the header as its first row: answers are flat gray chips, the radio and check marks are thinner, and
Send sits in the card's last row. In both, the picked answer is tinted with the accent and ringed.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between questions (one stop per choice question), the field and the buttons |
| ← → ↑ ↓ | One choice: moves to the next or previous answer and picks it. Several choices: moves without picking |
| Home / End | First or last answer in the question |
| Space | Picks an answer; with several choices, ticks or unticks it |
| Enter | Moves to the next question; on the last one, sends |

## Screen readers

The questions are a `form` named by the heading, and each question is a `group` named by its prompt. One choice is a
`radiogroup` of `radio` buttons (`aria-required` unless optional); several choices are `checkbox` buttons in a
`group`; You decide is the last radio or checkbox, or a toggle button with `aria-pressed` beside a short-answer field.
An answer with a description reads as “Standard, 10–12 slides”. If Send finds a required question unanswered, focus
moves to it, the question is described by “Answer this, or choose You decide” (a field gets `aria-invalid`), and a
status region says “Answer question 2, or choose You decide”. After sending, it says “Answers sent” and focus moves to
the reply, a `group` named “Answers sent” listing each prompt and answer.

## Content

- Ask two or three questions; more turns the card into a form.
- Write prompts as the agent would ask them: “How long should the deck be?”, not “Length”.
- Keep answer labels to one to three words; put the detail in `description`.
- Use `hint` to say why the answer matters: “I'll give each one its own section.”
- Mark questions people can leave blank as `optional` rather than adding a “None” answer.

## Do

- Act on “You decide” – the reply carries `{ decide: true }` for each question handed back.
- Read the answers back in the agent's next message, so people see they were heard.
- Turn off `skippable` only when the agent truly can't go on without an answer.

## Don't

- Don't ask what the agent could find in the context it already has.
- Don't make every question required; an optional short answer catches what the choices miss.
- Don't reopen the questions after sending – ask again in a new turn if something changed.

## Example

```html
<tc-clarifying-questions id="ask" intro="I'll draft the deck from the Q3 planning docs once I know these."></tc-clarifying-questions>

<script type="module">
  import "trenchcoat/clarifying-questions";
  import "trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.questions = [
    { id: "length", prompt: "How long should the deck be?", kind: "single", options: [{ value: "short", label: "Short" }, { value: "standard", label: "Standard" }] },
    { id: "areas", prompt: "Which areas should it cover?", kind: "multiple", options: [{ value: "revenue", label: "Revenue" }, { value: "hiring", label: "Hiring" }] },
    { id: "avoid", prompt: "Anything to leave out?", kind: "text", optional: true },
  ];
  ask.addEventListener("tc-send", (e) => reply(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { ClarifyingQuestions, type ClarifyingAnswers, type ClarifyingQuestion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AskFirst({ questions, reply }: { questions: ClarifyingQuestion[]; reply: (answers: ClarifyingAnswers) => void }) {
  const [answers, setAnswers] = useState<ClarifyingAnswers>({});
  return (
    <ClarifyingQuestions
      intro="I'll start once I know these."
      questions={questions}
      value={answers}
      onChange={setAnswers}
      onSend={(value) => reply(value)}
    />
  );
}
```
