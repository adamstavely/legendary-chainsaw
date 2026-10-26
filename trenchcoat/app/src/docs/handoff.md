---
pattern: none
status: new
related: approval-card, permission-request, agent-steering, live-view
---

## Overview

The moment an agent stops mid-run and hands the task to a person – to sign in, solve something it can't, or make a
call it shouldn't – and takes it back when they're done. The card says who stopped and why, what the agent did so
far and what it needs; “Take over” gives the person control, the needs become a checklist with a note for the
agent, and “Hand back” returns the task with what was done and what's still open. Afterwards it folds into one line,
“Back with Scout · 3 of 3 done”, with “Take over again”.

## When to use

- An agent hits something only a person can do – a one-time code, a CAPTCHA, a payment – and should wait, not fail.
- Handing a person the context they need to finish a step: what's done, what's left, where the agent stopped.
- Returning the person's work and notes to the agent, so it carries on from the right place.

## When not to use

- A yes or no on something the agent wants to do – use `approval-card`.
- Allowing a tool or a scope before it runs – use `permission-request`.
- Redirecting a running agent without stopping it – use `agent-steering`.
- Watching and taking over the agent's screen – use `live-view`.

## Anatomy

1. **Header** `.ui-hand__head` – the agent's avatar, “Scout needs you to sign in to TAP Air” and the step and task
2. **Blocker** `.ui-hand__pill` – why it stopped (“Sign-in required”); “Yours” once you have control
3. **Reason** `.ui-hand__why` – the agent's own words on why it stopped
4. **What I did** `.ui-hand__section[data-kind="done"]` – the steps so far, the first few then “2 more”
5. **What I need** `.ui-hand__section[data-kind="needs"]` – numbered while waiting, a checklist once you take over
6. **Main button** `.ui-hand__btn--primary` – “Take over”, then “Hand back to Scout”, with the ⌘↵ hint

## Looks

Standard is a white card on a gray tray, with the main button on the tray below it. Clean is one quiet white card
with the buttons in its last row under a hairline. Both fold to the same one-line result when the task is handed
back, and grow back when someone takes over again.

## Keyboard

| Key | What it does |
|---|---|
| ⌘ Enter / Ctrl Enter | Anywhere in the card: takes over while waiting, hands back while you have control |
| Space | On a need: ticks it off or unticks it |
| Tab | Moves through “2 more”, the checklist, the note and the main button |

Taking over moves focus to the first need that's still open; handing back moves it to “Take over again”.

## Screen readers

The component is a group named by its heading – “Scout needs you to sign in to TAP Air”, “You have control · sign in
to TAP Air”, or “Back with Scout · sign in to TAP Air” once returned – and described by the reason. Each list is a
section labelled by its title. A status region announces each change: “You have control. Scout is paused.”,
“Handed back to Scout.” and, when it goes back to waiting, “Scout needs you to sign in to TAP Air.” While you have
control, Hand back is described by “2 still open – Scout will see which” (or “All done”). The main button carries
`aria-keyshortcuts`; “2 more” has `aria-expanded`.

## Content

- Write `ask` lower case, as the end of “Scout needs you to …”: “sign in to TAP Air”, “approve the refund”.
- Keep `blocker` to two or three words: “Sign-in required”, “Needs a decision”.
- Let `reason` be the agent's own words, in the first person, with what it can't or shouldn't do.
- Write `needs` as actions the person can tick off: “Sign in with the code sent to •• 42”.
- Use `meta` for one quiet fact per line – “14 fares”, “€1,284”.

## Do

- Listen to `tc-return` (`onReturn`) – it carries what was done, what's still open and the note, for the agent to
  pick up.
- Pass the steps in `done` as they happen, so the card already shows the run's progress when it stops.
- Show `step` and `task`, so people who come back later know which run this is.

## Don't

- Don't use it for anything the agent could do itself – each hand-off costs a person's attention.
- Don't list more than three or four needs; a long list means the agent should have stopped sooner.
- Don't hide the shortcut hints in an app that has no other shortcuts – people won't guess ⌘↵.

## Example

```html
<tc-handoff id="handoff" ask="sign in to TAP Air" blocker="Sign-in required" step="Step 4 of 7"></tc-handoff>

<script type="module">
  import "trenchcoat/handoff";
  import "trenchcoat/tokens.css";

  const card = document.querySelector("#handoff");
  card.agent = { name: "Scout", model: "Claude Sonnet" };
  card.reason = "The airline texts a one-time code to the travel account's phone. I can't read it.";
  card.done = [{ id: "hold", label: "Held 6 seats on TP 1351", meta: "€1,284" }];
  card.needs = [{ id: "signin", label: "Sign in with the code sent to •• 42" }];
  card.addEventListener("tc-return", (e) => console.log(e.detail.checked, e.detail.open, e.detail.note));
</script>
```

```tsx
import { Handoff, type HandoffItem, type HandoffReturn } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const needs: HandoffItem[] = [{ id: "signin", label: "Sign in with the code sent to •• 42" }];

export function SignInHandoff({ resume }: { resume: (result: HandoffReturn) => void }) {
  return (
    <Handoff
      agent={{ name: "Scout", model: "Claude Sonnet" }}
      ask="sign in to TAP Air"
      blocker="Sign-in required"
      reason="The airline texts a one-time code to the travel account's phone. I can't read it."
      needs={needs}
      onReturn={resume}
    />
  );
}
```
