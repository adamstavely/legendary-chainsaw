---
pattern: combobox
status: new
related: access-request, team-flag-editor, permission-request, tool-permissions
---

## Overview

Shares something with people and groups, at a level of access for each, after checking that each one is entitled to see
it. Anyone who isn't is marked on their row, the person sharing is told at the top of the panel, and they're left out of
the share.

## When to use

- Sharing data that some people may not be allowed to see, such as restricted or regulated records.
- Showing who already has access, and changing or removing it.

## When not to use

- Someone asking for access themselves – use `access-request`.
- Allowing an agent to use a tool – use `permission-request` or `tool-permissions`.
- Data anyone may see, with no check to run – a plain share link is enough.

## Anatomy

1. **Search** `.ui-shr__search` – finds people and groups, listed in `.ui-shr__results`
2. **Notice** `.ui-shr__notice` – tells the person sharing who's affected and what will happen
3. **Row** `.ui-shr__row` – a recipient, with `.ui-shr__avatar` and `.ui-shr__name`
4. **Check result** `.ui-shr__status` – checking, not authorized and why, or how many of a group can see it
5. **Level** `.ui-shr__level` – the access this recipient gets
6. **Remove** `.ui-shr__remove` – removes them, with Undo for someone who already has access
7. **Share** `.ui-shr__share` – sends what passed, once every check has finished

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-shr-avatar`.

## Keyboard

| Key | What it does |
|---|---|
| ↓ ↑ in search | Move through the results |
| Enter in search | Adds the highlighted result |
| Escape in search | Closes the results |
| Tab | Moves through each row's level and Remove, then Share |

## Screen readers

Search is a `combobox` with a `listbox` of results. Each level is named with the recipient and described by that row's
check result. `role="status"` announces who isn't authorized, and how the share went. Results are worded as well as
coloured, with an icon.

## Content

How each answer from `checkEntitlement` is handled:

| Answer | What happens |
|---|---|
| `{ status: "allowed" }` | Included in the share |
| `{ status: "denied", reason }` | Left out; the row and notice say so. A person with existing access stays, and is flagged as no longer authorized |
| `{ status: "partial", allowed, total, reason }` | A group is included, and the row says how many members can see it. `allowed: 0` counts as denied |
| Throws, or anything else | Counts as not authorized until Try again succeeds |

Without `checkEntitlement`, nobody can be added. The check runs again whenever the level changes, because someone may be
entitled to view but not to edit.

A `reason` is shown to the person sharing. Say what's missing, such as "Needs the Restricted data agreement", without
revealing anything the sharer shouldn't learn about that person.

## Do

- Enforce entitlements on the server when the share arrives, and when the data is read. This panel only tells the person
  sharing what to expect.
- Use `excluded` and `partial` from `tc-share` for your audit trail.
- Honour the `signal` passed to `checkEntitlement`, so abandoned checks stop.
- Set `sending` while the request is on its way, and call `preventDefault()` on `tc-share` to keep `access` until it's
  accepted.

## Don't

- Don't treat a passing check as permission. Entitlements change, and anything in the browser can be altered.
- Don't return `allowed` when your service can't answer. Throw, so the panel fails closed.

## Example

```html
<tc-share-panel id="share" resource-name="Trial 12 results"></tc-share-panel>

<script type="module">
  import "trenchcoat/share-panel";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#share");
  panel.directory = [{ id: "noor", kind: "person", name: "Noor Haddad" }];
  panel.checkEntitlement = async (recipient, level, signal) => {
    const url = `/api/entitlements/${encodeURIComponent(recipient.id)}?level=${encodeURIComponent(level)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error("The check failed");
    return res.json();
  };
  panel.addEventListener("tc-share", (e) => console.log(e.detail.add, e.detail.excluded));
</script>
```

```tsx
import { SharePanel, type ShareEntitlementCheck, type ShareRecipient } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const directory: ShareRecipient[] = [{ id: "noor", kind: "person", name: "Noor Haddad" }];
const check: ShareEntitlementCheck = async (recipient, level, signal) => {
  const url = `/api/entitlements/${encodeURIComponent(recipient.id)}?level=${encodeURIComponent(level)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("The check failed");
  return res.json();
};

export function ShareResults() {
  return <SharePanel resourceName="Trial 12 results" directory={directory} checkEntitlement={check} onShare={(d) => console.log(d.add, d.excluded)} />;
}
```
