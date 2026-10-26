---
pattern: switch
status: new
related: playbook-canvas, permission-request, policy-simulator, segmented-control
---

## Overview

Sets up a review gate: the point in an agent's workflow where the run stops and a person decides. People switch on
the conditions that pause the run, pick who reviews, choose what the reviewer is shown – the output, the output with
its evidence, or the full trace – tick the actions the reviewer may take, and write down why the gate is there. The
whole gate is read back as one plain sentence, so the team can check it pauses when they meant it to. It is a form
control: with `name` it submits the config as JSON.

## When to use

- Configuring human review in an agent workflow – before money moves, a message goes out or a record changes.
- Settings pages where a team decides how much oversight an automation gets.
- Inside a playbook's review step – `playbook-canvas` embeds one with `flat`.

## When not to use

- Asking a person to allow one specific action right now – use `permission-request`.
- Testing an action against the policy set without running it – use `policy-simulator`.
- Choosing one option from two to five – use `segmented-control`.

## Anatomy

1. **Header** `.ui-gc__head` – the gate's name, an optional line under it, and how many conditions pause it
2. **Conditions** `.ui-gc__conds` – one switch per condition that can pause the run
3. **Reviewer** `.ui-gc__select` – who reviews, a native select
4. **What they see** `.ui-gc__view` – a segmented control, with a line describing the picked view
5. **Actions** `.ui-gc__checks` – a checkbox per action the reviewer may take
6. **Sentence** `.ui-gc__summary` – the gate in plain words

## Looks

Standard is a white card on a gray tray, with a square mark tile and filled checkboxes in ink. Clean is one white
card with hairline shadows, a rounded mark, smaller blue checkboxes, separate chips for the views and an accent-tinted
sentence. With `flat` either look drops the tray and the card, for a gate inside another card. In a narrow container
the labels sit above their controls and the pause count is hidden.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switches, the reviewer, the views, the action checkboxes and the note, in that order |
| Space / Enter | On a switch: turns the condition on or off; on an action: allows or disallows it |
| ← / → / ↑ / ↓ | In They see: picks the previous or next view |
| Home / End | In They see: picks the first or last view |

The reviewer is a native select and the note a native textarea, with their usual keys. Clicking a condition's text
flips its switch too.

## Screen readers

The host is a group named by the heading. Each condition is a `switch` named by its label and described by the line
under it, with `aria-checked`. The views are a radiogroup named “They see” and described by the picked view's line.
The actions are a group named “They may” of `checkbox` buttons with `aria-checked`; when none is allowed, the group
is described by “Allow at least one action – a reviewer has to be able to answer”. After each change a status region
reads the new sentence – “Pauses when the refund is over $250 or money leaves the account, for a team lead to review
the output with its evidence. They may approve, edit and approve, send back or reject.” – but not on first render. In
a form, a gate without any action is invalid (“Allow at least one action.”).

## Content

- Write conditions as things that are true of the run: “Confidence is low”, “The refund is over $250”. They are
  lower-cased into the sentence after “Pauses when”.
- Name reviewers as a role or a person, with an article: “A team lead”, “The on-call reviewer”.
- Give each view a `phrase` for the sentence (“the output with its evidence”) and a `description` of what the
  reviewer actually gets.
- The note is for the reviewer: say what could go wrong if nobody looked – “Refunds can't be pulled back once they
  reach the card.”

## Do

- Pass your product's own conditions, reviewers, views and actions – the defaults are generic.
- Keep at least one way to finish: approve or edit and approve, and reject. The gate hints when nothing can be
  approved.
- Store the value as it is – `triggers`, `reviewer`, `view`, `actions` and `reason` – and evaluate the triggers on the
  server; `describeGate` is exported for the same sentence elsewhere.

## Don't

- Don't turn on every condition by default: a gate that always pauses teaches reviewers to approve without reading.
- Don't drop the note – a reviewer who knows why the gate exists checks the right thing.
- Don't use more than four views; the segmented control needs the room.

## Example

```html
<form>
  <tc-gate-config id="gate" name="gate"></tc-gate-config>
</form>

<script type="module">
  import "trenchcoat/gate-config";
  import "trenchcoat/tokens.css";

  const gate = document.querySelector("#gate");
  gate.heading = "Before a refund goes out";
  gate.value = {
    triggers: ["low-confidence", "irreversible"],
    reviewer: "lead",
    view: "evidence",
    actions: ["approve", "send-back", "reject"],
    reason: "Refunds can't be pulled back once they reach the card.",
  };
  gate.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { GateConfig, type GateConfigValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function RefundGate() {
  const [value, setValue] = useState<GateConfigValue>({
    triggers: ["low-confidence", "irreversible"],
    reviewer: "lead",
    view: "evidence",
    actions: ["approve", "send-back", "reject"],
    reason: "",
  });
  return <GateConfig title="Before a refund goes out" value={value} onChange={setValue} name="gate" />;
}
```
