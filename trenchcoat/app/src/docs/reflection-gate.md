---
pattern: radio
status: new
related: claim-answer, verification-queue, synthesis-notes, stepper-form
---

## Overview

A short pause that makes a person think before relying on an AI answer. It asks one of four things, set by `mode`:
**intent** – the task, the decision it supports and what it costs if the answer is wrong, said before asking;
**prior** – what the person expects and what would change their mind, noted while the answer is still hidden;
**reformulate** – the answer restated in their own words, then compared with it, the answer's key terms missing from
theirs marked; **checkpoint** – one claim they'll verify, and how. What they write is submitted through a cancelable
event, so the product can keep it, check it, or hold the gate open. Skip appears only where the product allows it.

## When to use

- Before an answer feeds a decision that is costly to get wrong – a contract, a diagnosis, a payment.
- Where people tend to accept answers without reading them closely, and you want a record that they did.
- Collecting someone's expectation before showing the answer, so you can see later whether it changed their mind.
- Asking for one concrete check before an answer is exported or shared.

## When not to use

- Asking the person for details before the agent starts – use `clarifying-questions`.
- Reviewing every claim of an answer one by one – use `verification-queue`.
- The person's own running notes on what they've concluded – use `synthesis-notes`.
- A long multi-step form – use `stepper-form`.

## Anatomy

1. **Header** `.ui-rg__bar` – the heading and what the pause is for
2. **Card** `.ui-rg__card` – the prompt: the fields, or what was noted once submitted
3. **Field** `.ui-rg__field` – a label, the text field and the message after a Submit that didn't pass
4. **Choices** `.ui-rg__choices` – a radio group: cards with a hint, a segmented row, or the claims to pick from
5. **Buttons** `.ui-rg__foot` – Skip (when allowed) or “Edit mine”, and Continue or Compare

## Looks

Standard puts the heading on a gray tray and the prompt on a white card inside it, with Skip as a quiet text
button. Clean is one white card: the buttons sit under a hairline, Skip is a secondary button, and the choice cards
use hairline shadows instead of borders. Both stack the choice cards and the comparison when the gate is narrow.

## Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the fields, each radio group (one stop, on the picked option) and the buttons |
| → / ↓ | In a radio group, picks the next option, wrapping round |
| ← / ↑ | In a radio group, picks the previous option, wrapping round |
| Home / End | In a radio group, picks the first or last option |
| Space | On a radio group with nothing picked, picks the first option; on an option, picks it |
| Enter | In a one-line field, submits; on a button, presses it |
| ⌘ Enter / Ctrl Enter | In a text area, submits (Enter alone starts a new line) |

## Screen readers

The prompt is a `form` named by the heading and described by the line under it. Every text field has its label;
required ones are `aria-required`, and after a Submit that didn't pass they are `aria-invalid` and described by their
message (“Fill this in to continue”, “Pick one to continue”, “Write at least 5 words”). Choices are `radiogroup`s
named by their label, with `aria-checked` options. A polite `status` region says the first problem, the comparison
(“4 terms from the answer aren't in yours”), “Noted” (“Noted. The answer is shown.” in prior mode) or “Skipped –
nothing noted”. In prior mode the answer isn't in the page at all until the prior is in, so nothing reads it out
early. After Submit or Skip, focus moves to the result line; after Edit, to the first field. Terms the restatement
missed are `<mark>` elements.

## Content

- Keep the defaults' voice: questions the person can answer in a line (“What decision will it support?”), not
  instructions about thinking.
- Pass claims for checkpoint mode in the answer's own words, short enough to read at a glance.
- Change any text through `labels` – for another language, or your product's words for “decision” or “claim”.
- Say what happens with the answers somewhere near the gate (“Kept with this session”) – people write more
  honestly when they know who sees it.

## Do

- Match the mode to the moment: intent before asking, prior before showing, reformulate or checkpoint after.
- Keep what's submitted with the session, so the reflection is part of the record.
- Use `allow-skip` (or `onSkip`) for low-stakes uses, and leave it off where the check is policy.

## Don't

- Don't show the gate on every answer – people learn to click through a pause they always see.
- Don't grade the restatement automatically; the marked terms are a prompt to reread, not a score.
- Don't put the answer next to a prior-mode gate yourself – it defeats the point of noting the prior first.

## Example

```html
<tc-reflection-gate id="gate" mode="prior" allow-skip></tc-reflection-gate>

<script type="module">
  import "trenchcoat/reflection-gate";
  import "trenchcoat/tokens.css";

  const gate = document.querySelector("#gate");
  gate.answer = "Either side can end the agreement with 30 days' written notice.";
  gate.addEventListener("tc-submit", (e) => saveReflection(e.detail.mode, e.detail.value));
</script>
```

```tsx
import { ReflectionGate, type ReflectionGateSubmission } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const claims = [
  { id: "notice", text: "Either side can end the agreement with 30 days' notice" },
  { id: "refund", text: "Prepaid months are refunded" },
];

export function VerifyFirst({ answer, onNoted }: { answer: string; onNoted: (s: ReflectionGateSubmission) => void }) {
  return <ReflectionGate mode="checkpoint" answer={answer} claims={claims} onSubmit={onNoted} />;
}
```
