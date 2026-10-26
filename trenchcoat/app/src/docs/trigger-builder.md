---
pattern: radio
status: new
related: date-range-picker, filter-menu, combobox, segmented-control
---

## Overview

Sets when an automation or an agent runs: when something happens (“a deal changes stage”) or on a schedule (“every
Monday at 9”). People pick an event from a searchable list, or a frequency, days and a time, optionally only between
two dates; then add conditions such as “only if Amount is more than 10,000”, all or any of them. The whole trigger is
read back as one plain sentence, and a schedule lists its next five runs, so people can check it does what they meant
before they save. It is a form control: with `name` it submits the definition as JSON.

## When to use

- Setting up a scheduled report, a recurring agent run or a workflow that reacts to events in another system.
- Anywhere people would otherwise write a cron expression or a rule by hand.
- Forms where the trigger is saved with other settings – it validates and resets with the form.

## When not to use

- Picking a date range to look at data – use `date-range-picker`.
- Filtering a list or a table by conditions – use `filter-menu`.
- Picking one event or item from a long list, with nothing else to set – use `combobox`.

## Anatomy

1. **When** `.ui-tgb__kind` – an event happens, or on a schedule
2. **Rows** `.ui-tgb__rows` – the event, or Repeats, On, At and Active, each with its label
3. **Conditions** `.ui-tgb__conds` – All or Any, one row per condition, and Add condition
4. **Sentence** `.ui-tgb__summary` – the trigger as one plain sentence
5. **Next runs** `.ui-tgb__runs` – the upcoming run times, the first one marked
6. **Foot** `.ui-tgb__foot` – the time zone, or “Runs each time the event happens”

## Looks

Standard is a white card on a gray tray, with the time zone on the tray under the card. Clean is one white card with
hairline shadows and the time zone in its last row under a hairline. Both use the same segmented controls, combobox
and date-range picker in the matching look; in a narrow container the labels sit above their controls.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the controls row by row, then the conditions and Add condition |
| ← / → / ↑ / ↓ | In When, Repeats, Active and All / Any: picks the previous or next option |
| Home / End | In those same controls: picks the first or last option |
| Space / Enter | On a day: turns it on or off; on Add condition or ×: adds or removes a condition |
| ↓ / ↑, Enter, Escape | In the event field: the combobox's keys – open, move, pick, close |

The time, number and value fields and the condition lists are native inputs and selects with their usual keys; the
dates open the date-range picker. Adding a condition moves focus to its field list. Removing a condition keeps focus
in the list – on the row that takes its place, or for the last row on the × above it, else on Add condition.

## Screen readers

The host is a group named by the heading. When, Repeats, Active and All / Any are radiogroups named by their labels;
the weekdays are a group of toggle buttons with `aria-pressed` and full day names (“Monday”). Every condition control
is named by its place: “Condition 1 field”, “Condition 1 test”, “Condition 1 value”, “Remove condition 1”. The next
runs are a list named “Next runs”. After each change a status region reads the new sentence – “Runs every Monday at
9:00 AM, only if Open deals is more than 0.” – but not on first render. In a form, an event trigger without an event
is invalid (“Pick an event.”), and so is a weekly one without a day (“Pick at least one day.”).

## Content

- Write each event's `label` for the list (“Deal changes stage”) and its `phrase` for the sentence after “when”
  (“a deal changes stage”).
- Use `hint` for where the event comes from (“CRM”, “Stripe”) and `group` to gather related events.
- Name condition fields as people know them – “Amount”, “Stage”, “Priority” – and give `select` fields their options.
- Set `heading` to what the trigger starts: “Run this automation”, “Send the weekly report”.

## Do

- Give `scheduleFields` only when a scheduled run can check something first; without them a schedule has no conditions.
- Pass `now` when the page knows the time it should count from (server time, a test); otherwise it's when the
  element connected.
- Store the value as it is – `kind`, `event` or `schedule`, `active`, `conditions` and `match` – and run it on the
  server with the same rules; `nextTriggerRuns` and `describeTrigger` are exported to help.

## Don't

- Don't expect `timeZone` to move the run times: it only changes the text under the card. Times are counted in the
  browser's time zone.
- Don't offer events without `fields` if people will want to narrow them – conditions come from the event's fields.
- Don't keep conditions when the kind changes: the builder drops them, because they test the other kind's fields.

## Example

```html
<form>
  <tc-trigger-builder id="trigger" name="trigger"></tc-trigger-builder>
</form>

<script type="module">
  import "trenchcoat/trigger-builder";
  import "trenchcoat/tokens.css";

  const trigger = document.querySelector("#trigger");
  trigger.heading = "Run this automation";
  trigger.events = [
    {
      id: "deal.stage",
      label: "Deal changes stage",
      phrase: "a deal changes stage",
      group: "Deals",
      fields: [{ id: "amount", label: "Amount", type: "number" }],
    },
  ];
  trigger.value = { kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, conditions: [], match: "all" };
  trigger.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

```tsx
import { useState } from "react";
import { TriggerBuilder, type TriggerEvent, type TriggerValue } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const events: TriggerEvent[] = [
  { id: "deal.stage", label: "Deal changes stage", phrase: "a deal changes stage", group: "Deals", fields: [{ id: "amount", label: "Amount", type: "number" }] },
];

export function AutomationTrigger() {
  const [value, setValue] = useState<TriggerValue>({
    kind: "schedule",
    schedule: { frequency: "weekly", days: [1], time: "09:00" },
    conditions: [],
    match: "all",
  });
  return <TriggerBuilder title="Run this automation" events={events} value={value} onChange={setValue} name="trigger" />;
}
```
