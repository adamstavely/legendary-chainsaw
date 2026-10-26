---
pattern: none
status: stable
related: decision-inbox, approval-card, permission-request
---

## Overview

When an agent is stuck on a decision, it lays out its options as a tree: the question on the left, each option as
a branch, and what each branch leads to beside it. The agent's own pick is marked, consequences it isn't sure about
are highlighted with its note and source, and a branch can lead to one follow-up question. People pick a path with
a click or a number key, or write their own instruction under “Other…”; the picked path draws on to its outcome and
the next decision takes its place.

## When to use

- An agent needs a person to choose between two to four courses of action with different consequences.
- The consequences matter more than the labels – refunds, downtime, what can't be undone.
- Several agents queue decisions for one person to work through, one at a time.

## When not to use

- A yes-or-no approval of one action the agent is about to take – use `approval-card`.
- Many small decisions with two quick answers each – use `decision-inbox`.
- Granting a tool or a scope access to something – use `permission-request`.

## Anatomy

1. **Bar** `.ui-dct__head` – the heading, how many decisions wait and where you are
2. **Question** `.ui-dct__root` – who asks, on which model, how risky the call is, and the question
3. **Branch** `.ui-dct__opt` – one option with its number key; the agent's pick is marked
4. **Consequences** `.ui-dct__leaf` – what the branch leads to, one line each
5. **Flagged part** `.ui-dct__flag` – a consequence the agent isn't sure about; its note shows on hover or F
6. **Other…** `.ui-dct__other` – opens a field for your own instruction
7. **Pager** `.ui-dct__pager` – dots, “1 of 3” and Previous / Next

## Looks

Standard sets a white card on a soft gray tray with the bar above it, the risk tag under the agent's name and each
branch's consequences in an outlined card. Clean drops the tray – the bar and the tree sit on the page – puts the
risk tag above the question and sets consequences on a gray fill. Both draw the tree top to bottom in containers
narrower than 640 px.

## Keyboard

The keys work while focus is anywhere in the tree, except in the instruction field.

| Key | What it does |
|---|---|
| 1 – 4 | Picks that branch; the number after the last option opens “Other…”. After a branch with a follow-up, picks the follow-up's option |
| → / J | Shows the next decision |
| ← / K | Shows the previous decision |
| F | Shows the note of the next flagged part; after the last, hides it |
| Escape | Hides the note; with none open, closes “Other…” |
| Enter | In the instruction field: sends it |
| Shift+Enter | In the instruction field: a new line |
| Escape in the field | Closes it and returns focus to “Other…” |

Paging is locked while a pick is on its way.

## Screen readers

The question is a heading; the branches are a group named “How should the agent go on?”, each a button with its
number in `aria-keyshortcuts` and described by its consequences (or its follow-up question). A flagged part carries
its note in the text: “(the agent is unsure: … Source: …)”. A follow-up's options are a group named by its question.
The pager reads “Decision 1 of 3”, with Previous decision and Next decision buttons. A polite live region says what
happened: “Cancel the newer ones – picked. Billing agent goes ahead.”, “Wait for 02:00 UTC – picked. Next: …”,
“Sent to the billing agent: …” and then the agent's answer, and on failure “Couldn't pass “…” to the billing agent
– pick again.” The instruction field is named “Your own instruction for the billing agent – Enter sends, Shift+Enter
for a new line”, and is marked invalid with “Couldn't send – press Enter to try again.” when sending failed.

## Content

- Ask the question as the agent would, in one sentence that ends in a question mark.
- Label options with a verb and an object, a few words: “Cancel the newer ones”, “Run it now”.
- Write consequences as outcomes with numbers: “Refunds $147 across 3 accounts”, “Writes paused about 40 seconds”.
- Flag only what the agent can't confirm, and say why in the note – with a source people can check.
- Name the agent by its job: “Billing agent”, not a model or an id. It appears in sentences, lower-cased.

## Do

- Mark one option as the agent's `pick`, so people see what happens if they agree.
- Set `risk` to `high` or `medium` when the call is hard to undo; low risk shows no tag.
- Return the agent's short reply from `onChoose` for an instruction – or a promise of it – so people see it was understood.

## Don't

- Don't offer more than four options or more than one follow-up level – the tree stops being readable.
- Don't repeat the label in the consequences; say what changes.
- Don't hide the consequences of the agent's pick – it needs them most.

## Example

```html
<tc-decision-tree id="decisions" heading="Waiting on you"></tc-decision-tree>

<script type="module">
  import "trenchcoat/decision-tree";
  import "trenchcoat/tokens.css";

  const tree = document.querySelector("#decisions");
  tree.decisions = [
    {
      id: "migration",
      question: "The users table migration will lock writes for ~40s. Run it now?",
      agent: "Deploy agent",
      risk: "medium",
      options: [
        { label: "Run it now", effects: ["Writes paused about 40 seconds"], pick: true },
        { label: "Wait for 02:00 UTC", effects: ["Release ships ~9 hours later"] },
      ],
    },
  ];
  tree.onChoose = (decision, choice) => ("other" in choice ? "Got it – I'll do that." : undefined);
  tree.addEventListener("tc-decision-change", (e) => console.log(e.detail.decision));
</script>
```

```tsx
import { DecisionTree, type Decision } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const decisions: Decision[] = [
  {
    id: "migration",
    question: "The users table migration will lock writes for ~40s. Run it now?",
    agent: "Deploy agent",
    risk: "medium",
    options: [
      { label: "Run it now", effects: ["Writes paused about 40 seconds"], pick: true },
      { label: "Wait for 02:00 UTC", effects: ["Release ships ~9 hours later"] },
    ],
  },
];

export function Waiting({ answer }: { answer: (id: string, text: string) => Promise<string> }) {
  return (
    <DecisionTree
      title="Waiting on you"
      decisions={decisions}
      onChoose={(decision, choice) => ("other" in choice ? answer(decision.id, choice.other) : undefined)}
    />
  );
}
```
