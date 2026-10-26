---
pattern: meter
status: new
related: context-window, agent-steering, approval-card, trace-waterfall
---

## Overview

Spend and token limits for an agent run while it runs. The first limit is the big meter – usually the spend – and
any others sit as thin meters below it, each with a notch where the warning starts. Past `warnAt` the card warns: an
amber note says how much is left and how fast the run is using it (“about 3 min to the cap”), with buttons that raise
the cap right there. At the cap it is a hard stop: the card says the run stopped, tells the app to halt it, and offers
the same raise so the run can pick up where it left off. The card reads no clock – the app passes in the numbers and
the run's status.

## When to use

- Beside a live agent run that costs money or tokens, where someone needs to see the spend and be able to stop it.
- When runs should stop at a hard limit, but a person can decide to let one go further.
- Several limits on one run – spend, tokens, tool calls – with one of them clearly the one that matters most.

## When not to use

- Plan or account usage over a billing period – this is for one live run. Use `breakdown-chart` to show where usage
  went.
- How full a model's context window is – use `context-window`.
- Where the time and cost of each step went after the fact – use `trace-waterfall`.
- Asking a person to approve one action before the agent takes it – use `approval-card`.

## Anatomy

1. **Heading** `.ui-bgd__head` – the title, the task line and the run's pill (Live, Near cap, Stopped, Paused, Done)
2. **Amount** `.ui-bgd__figure` – the first limit's used amount against its cap, and the percentage
3. **Meter** `.ui-bgd__bar` – the first limit's bar, with the notch where the warning starts
4. **Other limits** `.ui-bgd__limits` – thin meters for the rest
5. **Note** `.ui-bgd__fold` – the warning or the stop, with the buttons that raise the cap
6. **Footer** `.ui-bgd__foot` – what's left, and Stop run or End run

## Looks

Standard sets a white card in the gray tray, with the footer on the tray below it. Clean is one white card with a
shadow and a little more room in the heading and the amount. Both show the same meters, warning and stop.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the raise buttons and Stop run / End run |
| Enter / Space | Raises the cap to the focused amount, or stops the run |

After a raise closes the note, focus moves to the status line in the footer rather than back to the page.

## Screen readers

The card is a `region`, named by its heading. Each limit is a `meter` named by its label, with a value such as
“$4.10 of $5.00, close to the cap”. Crossing into the warning is said once in a polite live region (“Spend at 80% of
the $5.00 cap.”); reaching a cap is an alert (“Run stopped: spend reached the $5.00 cap.”). Each raise button names
its result (“Raise the spend cap to $7.50”), and a raise is confirmed (“Spend cap raised to $7.50 – the run can go
on.”).

## Content

- Put the most expensive limit first – it gets the big meter and the percentage pill.
- Keep labels to one word or two: “Spend”, “Tokens”, “Tool calls”. They are also read lower-case in sentences (“the
  spend cap”).
- Name the run in `task`, so people with several runs open know which one this is.
- Pass `rate` (per minute) on the limits that move, so the warning can say how long is left.

## Do

- Halt the run when `tc-cap-reach` fires, and keep `status` in step with it (“paused” while halted).
- Offer raises that make sense for the run with `raiseBy`; the defaults are half, all and twice the cap, rounded.
- Set `currency` and `locale` for money that isn't US dollars.

## Don't

- Don't use it as a decoration on a finished run – once `status` is “done”, show the total somewhere calmer.
- Don't set `warnAt` so high that the warning and the stop arrive together; 0.8 leaves time to act.
- Don't raise the cap without a person pressing a button – the stop is the point.

## Example

```html
<tc-budget-guard id="budget" task="Research agent · competitor pricing"></tc-budget-guard>

<script type="module">
  import "trenchcoat/budget-guard";
  import "trenchcoat/tokens.css";

  const guard = document.querySelector("#budget");
  guard.limits = [
    { id: "spend", label: "Spend", kind: "currency", used: 3.62, cap: 5, rate: 0.42 },
    { id: "tokens", label: "Tokens", kind: "tokens", used: 181400, cap: 300000 },
  ];
  guard.addEventListener("tc-cap-reach", (e) => console.log("halt the run:", e.detail.id));
  guard.addEventListener("tc-stop", () => (guard.status = "done"));
</script>
```

```tsx
import { useState } from "react";
import { BudgetGuard, type BudgetLimit } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const start: BudgetLimit[] = [
  { id: "spend", label: "Spend", kind: "currency", used: 3.62, cap: 5, rate: 0.42 },
  { id: "tokens", label: "Tokens", kind: "tokens", used: 181_400, cap: 300_000 },
];

export function RunBudget() {
  const [limits, setLimits] = useState(start);
  const [halted, setHalted] = useState(false);
  return (
    <BudgetGuard
      title="Run budget"
      task="Research agent · competitor pricing"
      status={halted ? "paused" : "running"}
      limits={limits}
      onLimitsChange={setLimits}
      onRaise={() => setHalted(false)}
      onCapReach={() => setHalted(true)}
    />
  );
}
```
