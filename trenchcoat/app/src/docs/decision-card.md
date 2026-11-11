---
pattern: radio
status: new
related: clarifying-questions, approval-card, decision-inbox, chat-composer
---

## Overview

One question an agent can't answer alone, asked in the middle of a run: a card docked just above the chat composer,
naming the agent and how long it has been waiting. The question and a line of context come first, then numbered
options – one of them may be Recommended, which takes the first focus but is never picked for you – or, for a yes / no
step, Approve and Decline. Once sent it folds into a one-line receipt, "You chose: Keep the 2024 file", with Undo for a
few seconds, and the agent carries on.

It sits between its neighbours. Clarifying Questions asks two or three things before a run starts and sends them as
one reply; Approval Card reviews one proposed action with its details and policy; Decision Inbox lists many decisions
to work through. Decision Card is the single question that blocks a run right now, where the person is already
typing.

## When to use

- An agent is stopped mid-run on a choice it shouldn't make alone – which record to keep, which source to trust.
- The likely answers can be named, and the agent has a view on which is best.
- Several agents are waiting at once: pass `queue` and `position` to step through them one at a time.

## When not to use

- Questions before the work starts, answered together – use `clarifying-questions`.
- An action that needs its details, diff or policy reviewed before it runs – use `approval-card`.
- A list of everything waiting across agents, worked through in one place – use `decision-inbox`.

## Anatomy

1. **Header** – the shared card header: the agent's picture or initials, its name, "Needs your decision" and how long it has waited; "1 of 3" with previous / next when several wait
2. **Question** `.ui-dcd__question` – what the agent needs to know, with the context `.ui-dcd__context` under it
3. **Options** `.ui-dcd__choices` – numbered rows `.ui-dcd__choice`, the recommended one with a chip `.ui-dcd__chip`, each with an optional detail line
4. **Something else** `.ui-dcd__input` – a short field that opens when its option is picked (`allow-other`)
5. **Buttons** `.ui-dcd__foot` – Later and Send, or Later, Decline and Approve; Decline swaps in a reason field and Back
6. **Receipt** `.ui-dcd__receipt` – after sending: a check, what was decided, the agent, and Undo for `undo-ms`

## Looks

Standard puts the header on the gray tray and the question and options on a white card below it, with the buttons on
the tray. Options are outlined rows. Clean is one white card with the header as its first row: options are flat gray
rows and the buttons sit in the card's last row. In both, the picked option is tinted with the accent and ringed, and
its number fills.

The page can set `--tc-dcd-num`, the size of the option numbers.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between the options (one stop – the picked one, else the recommended one), the field and the buttons |
| ↑ ↓ ← → | Moves to the next or previous option and picks it |
| Home / End | The first or last option |
| 1 – 9 | Picks that option from anywhere in the card, outside a text field |
| ⌘ / Ctrl + Enter | Sends – or approves; while a decline reason is open, declines |
| Escape | Decides later (`tc-defer`); while a decline reason is open, steps back |

## Screen readers

The card is a `section` named by the agent and the question. The options are a `radiogroup` of `radio` buttons named
by the question and described by the keys; an option reads as "Keep the 2024 file, Recommended, It has the signed
bank letter". Sending with nothing picked says "Pick an option first" in a status region and moves focus to the
options. After sending, the status region reads the receipt ("You chose: Keep the 2024 file"), and focus moves to the
receipt, a `group` named by it. Previous and next in the queue are named "Previous decision" and "Next decision", and
"1 of 3" is announced politely as it changes.

## Content

- Ask one question, in the agent's words: "Which copy should I keep?", not "Duplicate resolution".
- Put what the agent found in `context` – the fact that makes the choice hard – in a sentence or two.
- Write options as actions: "Keep V-3184, archive V-2210". Put the cost or consequence in `detail`.
- Recommend at most one option, and only when the agent has a reason – say the reason in its `detail`.
- Keep to two to five options; offer `allow-other` when none may fit.

## Do

- Act on the receipt's Undo: hold off on irreversible work for `undo-ms`.
- Show the next waiting decision once one is sent, when `queue` is above 1.
- Read the decision back in the agent's next message, so people see it was heard.

## Don't

- Don't pre-pick the recommended option – people should choose it on purpose.
- Don't ask what the agent could look up itself.
- Don't use Decision Card for questions before a run – ask them together with `clarifying-questions`.

## Example

```html
<tc-decision-card id="ask" agent="Records agent" question="Which vendor file should I keep?" allow-other></tc-decision-card>

<script type="module">
  import "@adamstavely/trenchcoat/decision-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.context = "Both files share a tax ID but list different bank details.";
  ask.since = Date.now() - 4 * 60_000;
  ask.options = [
    { id: "newer", label: "Keep V-3184, archive V-2210", detail: "The 2024 file has the signed bank letter", recommended: true },
    { id: "older", label: "Keep V-2210, archive V-3184" },
  ];
  ask.addEventListener("tc-decision", (e) => agent.answer(e.detail));
</script>
```

```tsx
import { DecisionCard, type DecisionCardMade, type DecisionCardOption } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AgentQuestion({ options, answer }: { options: DecisionCardOption[]; answer: (decision: DecisionCardMade) => void }) {
  return (
    <DecisionCard
      agent="Records agent"
      question="Which vendor file should I keep?"
      context="Both files share a tax ID but list different bank details."
      options={options}
      allowOther
      onDecision={(decision) => answer(decision)}
    />
  );
}
```
