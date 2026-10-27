---
pattern: radio
status: new
related: gate-config, session-context-bar, reflection-gate, policy-simulator
---

## Overview

Switch how much friction the product's safeguards add, and see what that means before it happens. A mode switch –
Standard, Elevated and Deadline by default, or the app's own modes – picks a profile; the safeguards below show what
each one does under it: on, shortened, deferred, tightened or off, with what changes in plain words. Picking a mode
only previews it: rows that differ from the mode in force are marked from → to, with a count of what eases and what
tightens, and nothing changes until Apply. Deadline mode asks why and until when, so a quicker way in is always
explained and ends.

## When to use

- Products whose checks should adapt to the stakes or to time pressure: easier to start, stricter to finish.
- Letting a person, rather than an automatic rule, decide when safeguards change, with the reason recorded.
- Showing in advance exactly which checks a mode relaxes and which it hardens.

## When not to use

- Configuring a single gate's rules – use `gate-config`.
- Showing the session's declared terms while people work – use `session-context-bar`.
- Testing a policy against past cases – use `policy-simulator`.

## Anatomy

1. **Header** `.tc-head` – the icon, the title, what it applies to, and the mode in force
2. **Mode switch** `.ui-frp__modes` – the modes as a radio group, with a line on what the shown one is for
3. **Diff** `.ui-frp__diff` – while previewing, how many safeguards ease, tighten or stay the same
4. **Safeguard** `.ui-frp__item` – its state under the shown mode, from → to when it changes, and what changes
5. **Reason and end time** `.ui-frp__fields` – what a mode such as Deadline asks before it's applied
6. **Footer** `.ui-frp__foot` – the mode in force with its end time and reason, or Keep and Apply while previewing

## Looks

Standard sets the header on the gray tray above a white card, with the status and actions on the tray below; the
switch is a gray track with a raised white pill. Clean is one white card with a shadow: the switch becomes separate
chips, and the status and actions become the card's last row under a hairline.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the switch's chosen mode, then the reason and end time (when asked), Keep and Apply |
| ← / ↑ | On the switch: previews the previous mode |
| → / ↓ | On the switch: previews the next mode |
| Home / End | On the switch: previews the first or the last mode |
| Escape | Anywhere in the card while previewing: drops the preview and returns to the mode in force |
| Enter / Space | Presses Keep or Apply |

## Screen readers

The card is a `region`, named by its heading. The switch is a `radiogroup` named “Mode”, described by the shown
mode's line. The safeguards are a list named for the shown mode (“Safeguards under Deadline”); a changed row adds
“, On now, Shortened in Deadline” after its label. A polite live region says what picking a mode does (“Previewing
Deadline: 4 safeguards change.”), what Escape or Keep does (“Kept Standard.”) and what Apply did (“Deadline applied.
4 safeguards changed.”). When Apply finds the reason or end time missing, the fields are marked invalid with a
message each (“Say why deadline mode is needed.”) and focus moves to the first.

## Content

- Name modes for the situation, not the amount of friction: “Deadline”, not “Low friction”.
- Write each `change` as what the person will notice: “One question instead of two”, “A second person signs off”.
- Give a safeguard a `description` for what it does when nothing changes.
- Leave a mode out of a safeguard's `modes` when it stays on – the card shows it as On.

## Do

- Pair eased entry with stricter exit in a time-pressure mode, so speed doesn't cost checks on what leaves.
- Log the reason and end time from `tc-mode-change` with the session.
- Return to the usual mode when the end time passes – the card reads no clock, so the app does it.

## Don't

- Don't switch modes for the person – the preview is for them to confirm.
- Don't turn off every safeguard in any mode; say what still holds.
- Don't use tightened for a change that only adds a step nobody acts on.

## Example

```html
<tc-friction-profile id="profile" scope="This session" mode="standard"></tc-friction-profile>

<script type="module">
  import "trenchcoat/friction-profile";
  import "trenchcoat/tokens.css";

  const profile = document.querySelector("#profile");
  profile.safeguards = [
    { id: "intent", label: "Intent check", description: "Two questions before the first answer", modes: { deadline: { state: "shortened", change: "One question instead of two" } } },
    { id: "export", label: "Export review", modes: { elevated: { state: "tightened", change: "A second person signs off" }, deadline: { state: "tightened", change: "Unverified claims block export" } } },
  ];
  profile.addEventListener("tc-mode-change", (e) => console.log(e.detail.mode, e.detail.reason, e.detail.until));
</script>
```

```tsx
import { useState } from "react";
import { FrictionProfile } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function SessionSafeguards() {
  const [mode, setMode] = useState("standard");
  const [until, setUntil] = useState("");
  return (
    <FrictionProfile
      scope="This session"
      mode={mode}
      until={until}
      safeguards={[
        { id: "intent", label: "Intent check", modes: { deadline: { state: "shortened", change: "One question instead of two" } } },
        { id: "export", label: "Export review", modes: { deadline: { state: "tightened", change: "Unverified claims block export" } } },
      ]}
      onModeChange={(change) => {
        setMode(change.mode);
        setUntil(change.until);
      }}
    />
  );
}
```
