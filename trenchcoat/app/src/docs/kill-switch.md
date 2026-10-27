---
pattern: dialog
status: new
related: approval-card, autonomy-dial, policy-simulator, budget-guard
---

## Overview

The emergency stop for a system that runs agents, schedules and queues on its own. It says how things stand – normal,
elevated or stopped – lists what's running, and offers Stop on each item and Stop everything. Stopping always asks
first, in a dialog that names exactly what will halt and takes a reason; confirming adds an active stop that stays on
screen, with who stopped it, when and why, until someone presses Resume. The element halts nothing itself: it tells
the app, which does.

## When to use

- An operations or admin page for agents that act without a person in the loop.
- Incident response, where someone must halt work quickly and others must see that it's halted, and why.
- Pausing one agent or schedule while its policy or prompt is fixed, without touching the rest.

## When not to use

- Approving or denying one action an agent is about to take – use `approval-card`.
- Setting how much an agent may do on its own – use `autonomy-dial`.
- Stopping work when it runs over a spending limit – use `budget-guard`.
- Checking what the policy would do with an action – use `policy-simulator`.

## Anatomy

1. **Header** `.tc-head` – a power icon, the title and how things stand, in a sentence
2. **Posture badge** `.ui-ks__posture` – Normal, Elevated or Stopped, at the header's right
3. **Active stop** `.ui-ks__stop-row` – what's halted, by whom, when and why, with Resume
4. **Running item** `.ui-ks__item` – an agent, schedule or queue with its kind and a quiet detail
5. **Stop** `.ui-ks__stop` – halts one item, after confirming
6. **Stop everything** `.ui-ks__stop-all` – halts everything still running, after confirming

## Looks

Standard puts the header on a gray tray above a white card, with the note and Stop everything on the tray below it.
Clean is one white card with the header as its first row and Stop everything in its last row, quieter text and thinner icons. The confirmation dialog is the same in
both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Resume, each Stop and Stop everything |
| Enter / Space | On Stop or Stop everything, opens the confirmation; on Resume, lifts the stop |

In the confirmation, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the reason field, Cancel and Stop, wrapping inside the dialog |
| Enter / Space | On Stop, confirms; on Cancel, closes |
| Escape | Closes without stopping |

Cancelling returns focus to the button that opened the dialog. After a confirmed stop, that button is gone or
disabled, so focus goes to the new stop's Resume; after Resume, to the next stop's Resume or the item's Stop.

## Screen readers

The posture badge reads “Posture: Elevated”. Running items and active stops are lists in sections headed “Running”
and “Active stops”, each with a count. Stop and Resume buttons are named with their item – “Stop Support agent”,
“Resume Billing agent” – and Stop buttons have `aria-haspopup="dialog"`. Stop everything is `aria-disabled` while
everything is stopped. The confirmation is a modal `alertdialog` named by its question (“Stop everything?”) and
described by what it halts and `stopNote`. A polite status message confirms “Stopped: Support agent” and “Resumed:
Billing agent”.

## Content

- Name running items as people know them (“Billing agent”, “Nightly CRM sync”), with what's in flight in `detail`:
  “2 refunds in progress”.
- Say what a stop does in `stopNote`, honestly: whether work halts now or at its next step, and whether anything is
  undone.
- Use `postureNote` for the one fact that explains an elevated posture: “Unusual tool use flagged at 09:40”.
- Give stops a reason people can act on – it's how others know when resuming is safe. Set `require-reason` where
  your incident process needs one.

## Do

- Halt the real work in your `tc-stop` handler and call `preventDefault()` if that fails, so the stop isn't shown as
  active.
- Keep `stops` in step with your server, so everyone sees the same stops, with `by` and `at` filled in.
- Show the kill switch where the people on call already look, not three menus deep.

## Don't

- Don't hide a stop's reason or who made it – people need both to decide whether to resume.
- Don't resume automatically after a time; a stop stays until a person lifts it.
- Don't use it for routine pauses people make many times a day – that's a setting, not an emergency stop.

## Example

```html
<tc-kill-switch id="ks"></tc-kill-switch>

<script type="module">
  import "trenchcoat/kill-switch";
  import "trenchcoat/tokens.css";

  const ks = document.querySelector("#ks");
  ks.running = [
    { id: "support", label: "Support agent", kind: "Agent", detail: "14 conversations open" },
    { id: "sync", label: "Nightly CRM sync", kind: "Schedule" },
  ];
  ks.addEventListener("tc-stop", (e) => {
    fetch("/api/stops", { method: "POST", body: JSON.stringify({ target: e.detail.stop.target, reason: e.detail.stop.reason }) });
  });
  ks.addEventListener("tc-resume", (e) => fetch(`/api/stops/${e.detail.stop.id}`, { method: "DELETE" }));
</script>
```

```tsx
import { useState } from "react";
import { KillSwitch, type KillRunning, type KillStop } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Operations({ running, halt }: { running: KillRunning[]; halt: (stop: KillStop) => void }) {
  const [stops, setStops] = useState<KillStop[]>([]);
  return <KillSwitch running={running} stops={stops} onStopsChange={setStops} onStop={(stop) => halt(stop)} requireReason />;
}
```
