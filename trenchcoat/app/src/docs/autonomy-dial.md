---
pattern: radio
status: stable
related: tool-permissions, permission-request, approval-card, segmented-control
---

## Overview

Sets how much an agent may do on its own, and shows what that means in its real actions. Three levels – Always ask,
If risky, Full auto – sit above two groups, “Runs on its own” and “Asks you first”; pick a level and the actions
glide from one group to the other while the counts roll. Risky and destructive actions carry a small tag, and the
lock on any action keeps it in “Asks you first” whatever the dial says. People see the consequence of a setting
before they live with it.

## When to use

- The autonomy setting of one agent, in its settings page or set-up flow.
- Where the actions differ in risk – reading versus sending versus deleting – and people need to see which ones
  will run unattended.
- Letting people make one action an exception (“always ask before refunds”) without dropping the whole level.

## When not to use

- Allow, ask or deny per tool and scope for several agents at once – use `tool-permissions`.
- Asking for one permission at the moment the agent needs it – use `permission-request`.
- Approving one action an agent is about to take – use `approval-card`.
- A plain choice between a few options with no actions to show – use `segmented-control`.

## Anatomy

1. **Header** – the shared card header: a boxed gauge icon, the agent's name and a line on what the setting covers
2. **Levels** `.ui-ad__segmented` – Always ask, If risky, Full auto
3. **Group** `.ui-ad__group` – “Runs on its own” or “Asks you first”, with a rolling count
4. **Action** `.ui-ad__row` – an icon, the label, a risk tag and what it touches
5. **Lock** `.ui-ad__pin` – keeps the action in “Asks you first”, whatever the level

## Looks

Standard puts the header on a gray tray above a white card with the levels, with a pill that glides under the chosen
level, and lays the two groups on the tray below. Clean is one white card, the header its first row and the groups inside it; the levels are
three equal buttons and the chosen one is raised with a border. Actions glide between the groups the same way in
both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the chosen level, then to each action's lock |
| → / ↓ | Picks the next level (stops at Full auto) |
| ← / ↑ | Picks the previous level (stops at Always ask) |
| Enter / Space | On a level, picks it; on a lock, locks or unlocks the action |

## Screen readers

The levels are a `radiogroup` named “Autonomy”, each level a `radio` with `aria-checked`; the group is described by
the chosen level's hint (“Safe actions run, risky ones wait for you”). Each group is a section named by its
heading. Each lock is a toggle button named “Always ask before: Send replies” with `aria-pressed`. A polite live
region sums up every change: “If risky: 3 on its own, 4 ask first”. When an action moves to the other group, focus
stays on its lock.

## Content

- `heading` is the agent's name (“Support agent”); `subtitle` says where the setting applies.
- Label actions as verbs on objects: “Send replies”, “Issue refund” – not system names.
- Use `detail` for what the action touches and its limits: “Stripe · up to $200”.
- Mark risk honestly: `risky` for what reaches people or money, `destructive` for what can't be undone.

## Do

- List every action the agent can take, so the groups show the whole picture.
- Lock destructive actions by default (`pinned`) and let people unlock them.
- Save the level and pins from `tc-level-change` and `tc-pinned-change`; call `preventDefault()` to keep control.

## Don't

- Don't hide destructive actions to make Full auto look safer.
- Don't add a fourth level – the three stops and the locks cover the exceptions.
- Don't write `detail` as a sentence; it is cut to one line.

## Example

```html
<tc-autonomy-dial id="dial" heading="Support agent" level="1"></tc-autonomy-dial>

<script type="module">
  import "trenchcoat/autonomy-dial";
  import "trenchcoat/tokens.css";

  const dial = document.querySelector("#dial");
  dial.actions = [
    { id: "read", label: "Read tickets", detail: "Zendesk · all queues", risk: "safe" },
    { id: "send", label: "Send replies", detail: "Gmail · to customers", risk: "risky" },
    { id: "delete", label: "Delete spam tickets", detail: "Zendesk · permanently", risk: "destructive" },
  ];
  dial.pinned = ["delete"];
  dial.addEventListener("tc-level-change", (e) => console.log(e.detail.level));
</script>
```

```tsx
import { useState } from "react";
import { AutonomyDial, type AgentAction, type AutonomyLevel } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const actions: AgentAction[] = [
  { id: "read", label: "Read tickets", detail: "Zendesk · all queues", risk: "safe" },
  { id: "send", label: "Send replies", detail: "Gmail · to customers", risk: "risky" },
  { id: "delete", label: "Delete spam tickets", detail: "Zendesk · permanently", risk: "destructive" },
];

export function SupportAgentSettings() {
  const [level, setLevel] = useState<AutonomyLevel>(1);
  return <AutonomyDial title="Support agent" actions={actions} level={level} onLevelChange={setLevel} defaultPinned={["delete"]} />;
}
```
