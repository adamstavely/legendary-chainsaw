---
pattern: form
status: new
related: alert-feed, trigger-builder, failure-clusters, judge-sampling
---

## Overview

Alert rules for a production agent's quality, each written as a sentence with the choices in it: "Alert
[#ops-quality] when [Correctness] [drops below] [3.5] over [24 hours] on at least [50] chats". Every slot is a native
select or number field with its own label, so a rule reads like what it does and still works with a keyboard and a
screen reader. Each rule has an On switch, when it last fired, and how often it would have fired in the last 30 days –
the page works that out and passes it as `preview`, so people can tune a rule before it wakes anyone. Add rule and
Remove change the list. A value that can't work – a threshold outside the metric's scale, fewer than one chat – is
said in words under the sentence, and isn't kept.

## When to use

- Setting up who hears about an agent's quality dropping, and when.
- Tuning how noisy alerts are, with the 30-day preview.
- Any rule simple enough to say in one sentence: a metric, a comparison, a level, a window and a minimum.

## When not to use

- Showing the alerts that fired – use `alert-feed`.
- Starting an agent on an event or a schedule – use `trigger-builder`.
- Deciding how much traffic the judge scores – use `judge-sampling`.
- Rules with several conditions joined by and/or – use a query builder.

## Anatomy

1. **Rule** `.ui-qal__rule` – one rule, a fieldset
2. **Sentence** `.ui-qal__sentence` – the rule's words with its slots in place
3. **Select** `.ui-qal__select` – a slot with choices: channel, metric, comparison, window
4. **Number** `.ui-qal__number` – a slot for a number: the threshold and the minimum chats
5. **Problem** `.ui-qal__problem` – what can't work, in words
6. **Facts** `.ui-qal__facts` – when it last fired and the 30-day preview
7. **Switch** `.ui-qal__switch` – turns the rule on or off
8. **Remove** `.ui-qal__remove` – removes the rule
9. **Add** `.ui-qal__add` – adds a rule with sensible defaults

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The number fields' width is `--tc-qal-number-w`.

## Keyboard

Every slot is a native field, in reading order.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the slots, the switch and Remove, rule by rule |
| ↑ / ↓ in a select | Changes the choice |
| ↑ / ↓ in a number | Steps the number |
| Enter / Space on the switch | Turns the rule on or off |

Adding a rule moves the focus to its first slot; removing one moves it to the next rule, or to Add rule.

## Screen readers

Each rule is a fieldset, "Rule 1", described by the whole sentence and its facts, so "Alert #ops-quality when
Correctness drops below 3.5 over 24 hours on at least 50 chats" is heard on entering it. Each slot has its own label –
Channel, Metric, Comparison, Threshold, Window, Minimum chats. A slot that can't be kept is marked invalid and
described by the problem in words. The switch is a `switch` named On and described by the sentence; Remove says which
rule. Adding, removing and switching rules are confirmed in a polite status message.

## Content

- Name channels the way people know them: "#ops-quality", an email address.
- Give each metric its scale (`min`, `max`), so thresholds are checked.
- Name windows in plain words: "24 hours", "7 days".
- Send a fresh `preview` whenever a rule changes; it's cleared on every edit until then.

## Do

- Set a minimum number of chats, so a quiet hour doesn't fire an alert.
- Use "falls by more than" for metrics that drift, "drops below" for hard floors.
- Pass `now` when the page has a clock, for "Last fired 3h ago".

## Don't

- Don't make every rule go to the same channel; route by who can act.
- Don't hide the preview – it's what makes a rule worth trusting.
- Don't use this for alerts that aren't about quality; the words are tuned for it.

## Example

```html
<tc-quality-alerts id="alerts" heading="Quality alerts"></tc-quality-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/quality-alerts";
  import "@adamstavely/trenchcoat/tokens.css";

  const alerts = document.querySelector("#alerts");
  alerts.channels = [{ id: "ops", label: "#ops-quality" }, { id: "policy", label: "#policy-team" }];
  alerts.metrics = [{ id: "correctness", label: "Correctness", min: 1, max: 5 }];
  alerts.windows = [{ id: "24h", label: "24 hours" }, { id: "7d", label: "7 days" }];
  alerts.rules = [{ id: "r1", channel: "ops", metric: "correctness", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true, preview: 4 }];
  alerts.addEventListener("tc-rules-change", (e) => console.log(e.detail.change, e.detail.rules));
</script>
```

```tsx
import { useState } from "react";
import { QualityAlerts, type QualityAlertRule } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const channels = [{ id: "ops", label: "#ops-quality" }];
const metrics = [{ id: "correctness", label: "Correctness", min: 1, max: 5 }];
const windows = [{ id: "24h", label: "24 hours" }];

export function Alerts() {
  const [rules, setRules] = useState<QualityAlertRule[]>([
    { id: "r1", channel: "ops", metric: "correctness", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true },
  ]);
  return <QualityAlerts title="Quality alerts" channels={channels} metrics={metrics} windows={windows} rules={rules} onRulesChange={(next) => setRules(next)} />;
}
```
