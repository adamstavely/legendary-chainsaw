---
pattern: disclosure
status: new
related: tool-permissions, approval-card, trace-waterfall, permission-request
---

## Overview

A place to try an action against the policy before it's real. People describe what an agent would do, pick its rule
class and add any context the rules read – an amount, a recipient, an environment – and Simulate shows what the
policy would decide: allow, needs approval, deny or hard stop. The answer names the rule that decided it and why, and
a trace lists every rule in the order it was checked, so people can see why a rule didn't apply as well as why one
did. Nothing executes: the element hands the inputs to the app's `evaluate()` and only shows what comes back.

## When to use

- Policy authors checking a new or changed rule before it's switched on.
- Admins answering “would the agent be allowed to do this?” without running the agent.
- Explaining a past decision: fill in the action that was blocked and show the rule and the trace.

## When not to use

- Setting which agent may use which tool – use `tool-permissions`.
- Asking a person to approve a real action that's about to happen – use `approval-card`.
- Showing the timing and cost of a run that has happened – use `trace-waterfall`.
- An agent asking for access in the middle of a run – use `permission-request`.

## Anatomy

1. **Examples** `.ui-psim__examples` – ready-made actions that fill the form in one click
2. **Form** `.ui-psim__form` – the action, its rule class and optional context
3. **Dry-run note** `.ui-psim__dry` – a reminder that nothing is executed, beside Simulate
4. **Decision** `.ui-psim__verdict` – allow, needs approval, deny or hard stop, with the reason
5. **Rule** `.ui-psim__rule` – the rule that decided it: name, id and where it lives
6. **Trace** `.ui-psim__trace` – every rule in the order it was checked; the deciding one marked

## Looks

Standard is a white card on a gray tray holding the form, with the result in a second white card below it. Clean is
one white card, with the result under a hairline. Clean's labels and examples are quieter; the decision colours and
the trace are the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the examples, the fields, Simulate and the trace toggle |
| ← / → | In the examples, moves to the previous or next one (one tab stop for all of them) |
| Home / End | In the examples, moves to the first or last one |
| Enter / Space | On an example, fills the form with it; on the trace toggle, shows or hides the trace |
| Enter | In the action field, runs the simulation |
| ⌘ Enter / Ctrl Enter | In the context field, runs the simulation |

## Screen readers

The form is named by the heading, and each field by its visible label; the rule class is described by the class's
own line (“Moves money or commits to a cost”). Simulate with no action marks the action field `aria-invalid` and
describes it with “Describe the action to simulate.”. A polite status message says “Simulating…” while a promise
runs, then the outcome – “Needs approval – Payments over $1,000. $2,400 is over the $1,000 limit…”. The result is a
section headed “Decision: Needs approval”, and `aria-busy` while a new run is on its way. The trace toggle is a
button with `aria-expanded` that controls the list; each step starts with its outcome for screen readers –
“Matched”, “No match”, “Not checked” or “Not reached”. The examples are a `toolbar` labelled “Try”. A failed run
shows an alert with `errorLabel`.

## Content

- Write the action as the agent would do it, with the object: “Refund invoice INV-2291 in full”, not “refund”.
- Name rule classes by what the action does – Read, Write, Communicate, Spend, Delete – and give each a one-line
  `description`.
- Give the reason in one sentence that says the fact and the consequence: “$2,400 is over the $1,000 limit, so a
  person approves it first.”
- Keep a step's `detail` to a few words: “Only for delete”, “Every recipient is internal”.
- Use `decisionLabels` to match the words your policy already uses, rather than renaming them in the reason.

## Do

- Return every rule in `trace`, in the order the policy checked them, including those after the deciding one – the
  element marks them as not reached.
- Set `rule.source` to the policy and version, so people know which policy answered.
- Offer three to five `examples` covering each decision, so people can see the policy's edges quickly.

## Don't

- Don't run the action, or anything with side effects, inside `evaluate()` – the element tells people nothing runs.
- Don't leave `rule` unset when a rule decided it; an unset rule reads as “the default applied”.
- Don't hide the trace by default – it's how people find out why the rule they expected didn't fire.

## Example

```html
<tc-policy-simulator id="sim" description="Check what the policy would do before it happens."></tc-policy-simulator>

<script type="module">
  import "trenchcoat/policy-simulator";
  import "trenchcoat/tokens.css";

  const sim = document.querySelector("#sim");
  sim.examples = [{ label: "Refund $2,400", action: "Refund invoice INV-2291", ruleClass: "spend", context: "amount: $2,400" }];
  sim.evaluate = (input) => fetch("/api/policy/dry-run", { method: "POST", body: JSON.stringify(input) }).then((r) => r.json());
  sim.addEventListener("tc-result", (e) => console.log(e.detail.result.decision));
</script>
```

```tsx
import { PolicySimulator, type PolicySimInput, type PolicySimResult } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function DryRun({ dryRun }: { dryRun: (input: PolicySimInput) => Promise<PolicySimResult> }) {
  return (
    <PolicySimulator
      description="Check what the policy would do before it happens."
      defaultValue={{ action: "Refund invoice INV-2291", ruleClass: "spend", context: "amount: $2,400" }}
      evaluate={dryRun}
      onResult={(result) => console.log(result.decision, result.rule?.id)}
    />
  );
}
```
