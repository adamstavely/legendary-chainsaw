---
pattern: list
status: new
related: trigger-builder, schedule-card, routine-form, secrets-manager
---

## Overview

Every way an agent starts, one row each: a schedule, a webhook, an event in another system, an email or a person pressing Run. Each row says what starts it in words, when it last fired and how often this week, and any error in words, with a switch to turn it on or off and Edit. Add trigger opens a menu of kinds; the page builds the new trigger.

## When to use

- An agent's settings, listing what starts it.
- Turning a noisy or failing trigger off without deleting it.

## When not to use

- Building or editing one trigger – use `trigger-builder`.
- One recurring task with its last runs – use `schedule-card`.
- Setting up a routine's name, time and instructions – use `routine-form`.

## Anatomy

1. **Row** `.ui-trl__row` – one trigger
2. **Kind** `.ui-trl__kind` – an icon and a word: Schedule, Webhook, Event, Email or Manual
3. **Summary** `.ui-trl__summary` – what starts it, in words
4. **Facts** `.ui-trl__facts` – when it last fired and how often this week
5. **Error** `.ui-trl__error` – what's going wrong, in words, with a square mark
6. **Switch** `.ui-trl__switch` – on or off, with `.ui-trl__state` saying which
7. **Edit** `.ui-trl__edit`
8. **Add trigger** `.ui-trl__add` – opens `.ui-trl__menu` of `.ui-trl__item` kinds

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A trigger that's off has its summary in secondary text. In a narrow container the kind sits above the summary. `--tc-trl-switch-w`, `--tc-trl-switch-h`, `--tc-trl-knob` and `--tc-trl-kind-w` size the switch and the kind column.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each trigger's switch and Edit, then Add trigger |
| Space | On a switch: turns the trigger on or off |
| Enter / Space | On Edit or Add trigger: presses it |
| ↓ / ↑ | On Add trigger: opens the menu on the first or last kind; in the menu, moves |
| Home / End | In the menu: the first or last kind |
| Escape | Closes the menu, returning focus to Add trigger |

## Screen readers

The triggers are a list named by the heading. Each switch is a native checkbox with `role="switch"`, named "Run on Every weekday at 09:00" and described by its error when there is one. Edit's name includes the summary. Add trigger is a menu button; the kinds are menu items. `role="status"` announces "Turned off: Every weekday at 09:00".

## Content

- Write `summary` as what starts the agent, in plain words: "Every weekday at 09:00", "When an invoice is uploaded to Accounts payable".
- Write `error` as what's wrong and how often: "The last 3 requests had no X-Signature header".
- Pass `now` so last-fired times read "20 minutes ago"; without it they're dates.

## Do

- Turn the trigger on or off on the server in `tc-enabled-change`, and prevent it if that fails.
- Open `trigger-builder` for Edit and for a kind from Add trigger.

## Don't

- Don't hide a failing trigger – keep it listed with its error so people can fix it or turn it off.
- Don't use the switch to delete a trigger; off keeps its settings.

## Example

```html
<tc-trigger-list id="triggers"></tc-trigger-list>

<script type="module">
  import "@adamstavely/trenchcoat/trigger-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#triggers");
  list.triggers = [
    { id: "daily", kind: "schedule", summary: "Every weekday at 09:00", enabled: true, fires7d: 5 },
    { id: "upload", kind: "event", summary: "When an invoice is uploaded", enabled: false },
  ];
  list.addEventListener("tc-enabled-change", (e) => console.log(e.detail.id, e.detail.enabled));
</script>
```

```tsx
import { TriggerList, type AgentTrigger } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const triggers: AgentTrigger[] = [
  { id: "daily", kind: "schedule", summary: "Every weekday at 09:00", enabled: true, fires7d: 5 },
  { id: "upload", kind: "event", summary: "When an invoice is uploaded", enabled: false },
];

export function AgentTriggers({ now }: { now: number }) {
  return <TriggerList defaultTriggers={triggers} now={now} onAdd={(kind) => console.log("add", kind)} />;
}
```
