---
pattern: form
status: new
related: budget-guard, model-settings, quality-alerts, eval-scorecard
---

## Overview

How much of an agent's live traffic an LLM judge reads, and what that costs. Each traffic segment – a website widget,
team chat, email – has a sampling rate on a stepped slider from 0.1% to 100%, with how many chats a day that judges.
Rules that always include a chat whatever the rate – a thumbs-down, an escalation, a new prompt version – are
switches. The judge model is a select showing its price per chat. Under them sit live estimates: chats judged a day,
the monthly cost, and what the sample can see, in words – "Enough to see a 0.2 drop within a day". A monthly budget
cap turns the cost amber and warns in words when the estimate goes over it.

The estimates come from `judgeEstimate()`, exported for the page: always-included chats are counted only where the
sample didn't already catch them, and the drop a sample can see is about 2.8 × the scores' spread ÷ √chats judged
(80% power at 5% significance, against a well-known baseline).

## When to use

- Setting how much production traffic an LLM judge scores.
- Trading cost against how quickly a quality drop shows up.
- Reviewing judge spend against a budget.

## When not to use

- A hard spend limit on one agent run – use `budget-guard`.
- The judge model's own parameters – use `model-settings`.
- What to do when scores drop – use `quality-alerts`.
- Scores across test cases and versions – use `eval-scorecard`.

## Anatomy

1. **Segment** `.ui-jsm__seg` – a traffic segment: its name, rate and chats judged a day
2. **Range** `.ui-jsm__range` – the stepped rate slider, 0.1% to 100%
3. **Rule** `.ui-jsm__rule` – an always-include rule with its switch
4. **Select** `.ui-jsm__select` – the judge model, with its price per chat
5. **Number** `.ui-jsm__number` – the monthly budget cap
6. **Estimates** `.ui-jsm__estimates` – judged a day, a month's cost, and what it can see
7. **Warning** `.ui-jsm__warning` – over the budget, by how much, and what to change

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. A page can resize the slider with `--tc-jsm-thumb` and `--tc-jsm-track-h`.

## Keyboard

Every control is native, in reading order.

| Key | What it does |
|---|---|
| ← / → on a slider | Moves to the previous or next rate |
| Home / End on a slider | 0.1% or 100% |
| Space on a switch | Turns the rule on or off |
| ↑ / ↓ in the model select | Changes the judge |

## Screen readers

Each slider is labelled by its segment and says its value in words, "5%, about 420 chats a day", and is described by
the segment's traffic. Each rule is a switch labelled by its name and described by what it catches. The estimates are
a description list. Going over the budget, or back under it, is announced once in a polite status message, and the
warning is text, not only colour.

## Content

- Name segments the way the team knows them: "Intranet widget", "Team chat".
- Describe each rule by what it catches: "Every chat someone rated badly".
- Set `scoreSd` and `detect` to the judge's own scale – a 0.2 drop matters on 1–5, not on 0–100.
- Give models' prices in the page's `currency`.

## Do

- Always include the chats people complained about; they're the cheapest signal there is.
- Raise the rate for a while after a prompt change, then lower it.
- Set a budget, so the cost of a high rate is visible before it's spent.

## Don't

- Don't sample every chat by default; most of the signal comes from a few percent.
- Don't treat the estimates as exact – traffic varies by day.
- Don't hide the confidence line; a cheap sample that can't see a drop isn't saving anything.

## Example

```html
<tc-judge-sampling id="sampling" heading="Judge sampling" currency="USD"></tc-judge-sampling>

<script type="module">
  import "@adamstavely/trenchcoat/judge-sampling";
  import "@adamstavely/trenchcoat/tokens.css";

  const sampling = document.querySelector("#sampling");
  sampling.segments = [{ id: "intranet", label: "Intranet widget", chatsPerDay: 8400 }];
  sampling.includeRules = [{ id: "thumbs", label: "Thumbs-down", description: "Every chat someone rated badly", chatsPerDay: 120 }];
  sampling.models = [{ id: "small", label: "Small judge", costPerChat: 0.0015 }];
  sampling.value = { rates: { intranet: 0.05 }, include: { thumbs: true }, model: "small", budget: 100 };
  sampling.addEventListener("tc-value-change", (e) => console.log(e.detail.field, e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { JudgeSampling, type JudgeSamplingValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const segments = [{ id: "intranet", label: "Intranet widget", chatsPerDay: 8400 }];
const models = [{ id: "small", label: "Small judge", costPerChat: 0.0015 }];

export function Sampling() {
  const [value, setValue] = useState<JudgeSamplingValue>({ rates: { intranet: 0.05 }, include: {}, model: "small", budget: 100 });
  return <JudgeSampling title="Judge sampling" segments={segments} models={models} value={value} onValueChange={(next) => setValue(next)} />;
}
```
