---
pattern: tabs
status: new
related: permission-request, tool-permissions, data-controls, memory-panel
---

## Overview

The standing access an assistant or agent has been given, in one list to review and revoke. Each grant says where the
access reaches (a source, with the app's own icon), what it may do there in words ("Read cases in Team North"), how
far it goes (Can read, Can edit or Can act), who granted it and when, when it was last used and when it runs out.

A summary line counts what needs a look, such as "6 grants · 1 changed since you agreed · 2 expire this week". Tabs
narrow the list to grants that changed since someone agreed to them, or that expire soon or already have.

- A grant that changed since it was agreed says what changed ("Now also reads attachments"). Review lets people accept
  the change or revoke the grant.
- Revoke asks inline first.
- A grant that's running out reads "Expires in 3 days" and offers Renew.

## When to use

- A settings page that lists what an assistant, agent or integration can reach, with its expiry and a way to revoke.
- Catching access that grew after people agreed to it, before it's used.
- A periodic access review, where people renew what they still need and revoke the rest.

## When not to use

- Asking for one specific right at the moment it's needed – use `permission-request`.
- Setting which tools each agent may use (allow, ask, deny) – use `tool-permissions`.
- A person's own training, history and memory settings – use `data-controls`.
- What the assistant remembers – use `memory-panel`.

## Anatomy

1. **Summary** `.ui-acg__summary` – the count of grants, and of those changed, expiring and expired
2. **Tabs** `.ui-acg__tabs` – All, Changed and Expiring (`.ui-acg__tab`), each with its count
3. **Source** `.ui-acg__source` – one group per source, with its icon (`.ui-acg__logo`) and how many grants it holds
4. **Grant** `.ui-acg__row` – one grant
5. **Level** `.ui-acg__level` – Can read, Can edit or Can act, as a word and an icon
6. **Scope** `.ui-acg__scope` – what it may do, in words
7. **Details** `.ui-acg__meta` – who granted it, last use, and the expiry (`.ui-acg__expiry`)
8. **Changed notice** `.ui-acg__drift` – what changed since someone agreed to it, and when
9. **Buttons** `.ui-acg__actions` – Review, Renew and Revoke, as they apply
10. **Panel** `.ui-acg__panel` – under a grant: confirm a revoke, or review a change

## Looks

Standard puts the header on a gray tray above a white card. Clean is one white card with the header as its first row.
Two component tokens can be overridden:
- `--tc-acg-logo` sets the size of the source's icon;
- `--tc-acg-indicator` sets the thickness of the selected tab's underline.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves from the tabs to the grants' buttons (one stop) and into an open panel |
| ← / → on the tabs | Moves to the previous or next tab and shows it; Home and End go to the first and last |
| ↑ / ↓ on a button | Moves to the same button in the previous or next grant |
| ← / → on a button | Moves between a grant's buttons |
| Home / End on a button | Moves to the first or last grant |
| Enter / Space | Presses the button |
| Escape in a panel | Closes it and puts focus back on its button |

## Screen readers

The tabs are a `tablist` named by the heading, and they control the list (a `tabpanel`). Each source is a heading with
a list of its grants. Each button is described by the grant's scope, so "Revoke" reads with what it revokes. Review and
Revoke report whether their panel is expanded. The panel is a group named by its question. Revoking or accepting a
change is confirmed in a polite status message. The level and the expiry are said in words, not shown by colour alone.

## Content

- Write the scope as an action and a place: "Read cases in Team North", not "cases:read:north".
- Say a change from the person's side: "Now also reads attachments", not "Scope widened".
- Name the source the way people know it, and pass its icon, so a grant is easy to recognise.
- Leave `expiresAt` out for access that lasts until it's revoked. The list says so.

## Do

- Ask again, with `changed`, when what a grant covers grows, instead of widening it without telling anyone.
- Give access an end date where you can, so it doesn't outlive the need.
- Update `grants` when a revoke or renewal is done, so the list matches what's really allowed.

## Don't

- Don't revoke silently on the server and leave the grant in the list.
- Don't use the level's colour on its own; keep the words.
- Don't list internal permission names; describe what the access lets the agent do.

## Example

```html
<tc-access-grants id="grants" heading="What the assistant can reach" description="Fraud review · Team North"></tc-access-grants>

<script type="module">
  import "@adamstavely/trenchcoat/access-grants";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#grants");
  list.grants = [
    { id: "cases", source: "Case files", scope: "Read cases in Team North", level: "read", grantedBy: "Priya Shah",
      grantedAt: Date.parse("2026-09-11"), changed: { since: Date.parse("2026-11-09"), what: "Now also reads attachments." } },
    { id: "ledger", source: "Payments ledger", scope: "Read transactions from the last 24 months", level: "read",
      grantedBy: "Marcus Lee", grantedAt: Date.parse("2026-08-19"), expiresAt: Date.parse("2026-11-15") },
  ];
  list.addEventListener("tc-revoke", (e) => console.log("revoke", e.detail.grant.id));
  list.addEventListener("tc-renew", (e) => console.log("renew", e.detail.grant.id));
  list.addEventListener("tc-drift-review", (e) => console.log(e.detail.grant.id, e.detail.accepted));
</script>
```

```tsx
import { useState } from "react";
import { AccessGrants, type AccessGrant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AssistantAccess({ initial }: { initial: AccessGrant[] }) {
  const [grants, setGrants] = useState(initial);
  return (
    <AccessGrants
      title="What the assistant can reach"
      grants={grants}
      onRevoke={(grant) => setGrants((list) => list.filter((g) => g.id !== grant.id))}
      onRenew={(grant) => console.log("renew", grant.id)}
      onDriftReview={(grant, accepted) => console.log(grant.id, accepted)}
    />
  );
}
```
