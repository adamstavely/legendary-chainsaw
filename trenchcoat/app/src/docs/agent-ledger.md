---
pattern: none
status: stable
related: run-checkpoints, approval-card, change-summary
---

## Overview

Everything an agent changed in your systems, newest first, each change with an Undo. Every row says what was done
and to what, in which system, and shows the value before and after (“$29 → $34”). Pointing at Undo lights up
everything that builds on that change – “Also undone” where it can be reversed, “Can't undo” where it can't, like a
sent email or a payout – so people see the full reach of an undo before they press it. Undone rows are struck
through, their dependents a beat after each other, and Redo brings them back.

## When to use

- After or during an agent run that writes to other systems – prices, records, pages, messages.
- Wherever people need to trust an agent with real changes because they can take them back.
- When changes depend on each other and undoing one should take its dependents along.

## When not to use

- Restoring a whole run to an earlier step and trying again – use `run-checkpoints`.
- Asking before the agent acts, rather than undoing after – use `approval-card`.
- Showing how metrics moved since last time – use `change-summary`.

## Anatomy

1. **Header** – the shared card header: a boxed icon, the heading with the agent under it, and the count of changes
   and undone ones at the right
2. **Row** `.ui-alg__row` – one change; new ones slide in at the top as the agent works
3. **Logo** `.ui-alg__icon` – the system's logo, or its first letter
4. **Change** `.ui-alg__change` – before → after, or one line of detail
5. **Undo** `.ui-alg__act` – appears in place of the time on hover or focus; Redo on an undone row

## Looks

Standard sets a soft gray tray with the agent and the count above a white card of rows, and Undo / Redo as raised
pills. Clean drops the tray for one quiet white card with the header as its first row: smaller logo tiles, medium weights, 0.5 px
dividers, and Undo / Redo as flat text buttons. Both preview the same chain and use the same keys.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the Undo and Redo buttons; focusing an Undo lights up what builds on it, as pointing does |
| Enter / Space | Undoes the change and its reversible dependents, or redoes it |

If a focused button goes away because its change was removed, focus moves to the next row's button instead of the
page.

## Screen readers

The rows are an ordered list named by the heading. Each button says what it acts on and how far it reaches (“Undo:
Changed price Pro plan – and 2 that build on it”, “Redo: Changed price Pro plan”); the arrow between before and after
is read as “to”. A status region says what happened: “Undone: Changed price Pro plan, and 2 changes with it. 1 can't
be undone” or “Redone: …”. A row waiting for your `onUndo` / `onRedo` promise is `aria-busy`, and a rejection is an
alert: “Couldn't undo – try again”.

## Content

- Write `action` as a past-tense verb phrase – “Changed price”, “Sent email” – and `target` as the thing it touched.
- Keep `change` values short enough to compare at a glance: “$29” → “$34”, “Draft” → “Published”.
- Mark anything that can't be taken back with `reversible: false`, so it never offers an Undo it can't keep.
- Name the agent the way people know it: “Launch agent”, not an internal id.

## Do

- List what each change builds on in `dependsOn`, so an Undo takes its dependents along.
- Return a promise from `onUndo` / `onRedo` and reject it when the system refuses – the rows go back and say so.
- Use `pointAt` to light up a chain in a walkthrough or help article.

## Don't

- Don't hide irreversible changes from the ledger – show them, without an Undo.
- Don't show changes that weren't made yet; the ledger is a record, not a plan.
- Don't undo in the background without the ledger – people should see what went with it.

## Example

```html
<tc-agent-ledger id="ledger" agent="Launch agent"></tc-agent-ledger>

<script type="module">
  import "trenchcoat/agent-ledger";
  import "trenchcoat/tokens.css";

  const ledger = document.querySelector("#ledger");
  const now = Date.now();
  ledger.entries = [
    { id: "price", action: "Changed price", target: "Pro plan", system: "Stripe", at: now - 120000, change: ["$29", "$34"] },
    { id: "page", action: "Updated pricing page", system: "Webflow", at: now - 60000, change: ["$29", "$34"], dependsOn: ["price"] },
    { id: "mail", action: "Sent email", target: "Price update", system: "Mailchimp", at: now - 30000, reversible: false, dependsOn: ["price"] },
  ];
  ledger.onUndo = (ids) => fetch("/api/undo", { method: "POST", body: JSON.stringify(ids) });
  ledger.addEventListener("tc-undo", (e) => console.log("Undone", e.detail.ids));
</script>
```

```tsx
import { AgentLedger, type LedgerEntry } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function LaunchLedger({ entries }: { entries: LedgerEntry[] }) {
  return (
    <AgentLedger
      title="Ledger"
      agent="Launch agent"
      entries={entries}
      onUndo={(ids) => fetch("/api/undo", { method: "POST", body: JSON.stringify(ids) })}
      onRedo={(ids) => fetch("/api/redo", { method: "POST", body: JSON.stringify(ids) })}
    />
  );
}
```
