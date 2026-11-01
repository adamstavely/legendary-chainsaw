---
pattern: list
status: new
related: team-flag-editor, audit-trail, access-review, file-details
---

## Overview

Which items are on legal hold, who placed each hold, why and until when. Holds past their review date are marked. Releasing
one needs a written reason, and says how many items it frees.

## When to use

- Legal, compliance or records teams managing what must be preserved.
- Showing people why a file can't be changed, with `readonly`.

## When not to use

- A quick marker on a file – use `team-flag-picker`.
- Who may see something – use `access-review`.
- The history of what happened – use `audit-trail`.

## Anatomy

1. **List** `.ui-lhm__list` – active holds first, overdue ones at the top
2. **Row** `.ui-lhm__row-button` – `.ui-lhm__name`, `.ui-lhm__status` and `.ui-lhm__overdue`
3. **Detail** `.ui-lhm__detail` – `.ui-lhm__facts` and `.ui-lhm__items`
4. **Add** `.ui-lhm__add` – adds an item
5. **Release** `.ui-lhm__release` – opens `.ui-lhm__confirm`, with a required `.ui-lhm__note`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ Home End | Move between holds |
| Enter / Space | Opens or closes a hold |
| Tab | Moves through the open hold's controls |
| Enter in Add an item | Adds it |

## Screen readers

The holds are a list named by the heading, with one tab stop. Rows use `aria-expanded` and `aria-controls`. Status and
overdue are words. A required reason uses `aria-required` and `aria-invalid`, and `role="status"` announces adding and
releasing.

## Content

Write `reason` so someone can tell in a year why it exists. Pass `now`: without it, nothing can be marked overdue.

## Do

- Enforce holds on the server, so held items really can't be changed or deleted.
- Record `reason` from `tc-holds-change` in your audit trail.
- Call `preventDefault()` if the save is refused.

## Don't

- Don't treat this as enforcement, or as legal advice. It records decisions; your systems must act on them.

## Example

```html
<tc-legal-hold-manager id="holds"></tc-legal-hold-manager>

<script type="module">
  import "trenchcoat/legal-hold-manager";
  import "trenchcoat/tokens.css";

  const manager = document.querySelector("#holds");
  manager.now = Date.now();
  manager.holds = [{ id: "a", name: "Supply dispute", placedBy: "Noor Haddad", placedAt: Date.UTC(2026, 2, 9), reason: "Counsel asked us to keep it.", status: "active", items: [] }];
  manager.addEventListener("tc-holds-change", (e) => console.log(e.detail.change, e.detail.hold));
</script>
```

```tsx
import { LegalHoldManager, type LegalHold } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const holds: LegalHold[] = [{ id: "a", name: "Supply dispute", placedBy: "Noor Haddad", placedAt: Date.UTC(2026, 2, 9), reason: "Counsel asked us to keep it.", status: "active", items: [] }];

export function Holds() {
  return <LegalHoldManager defaultHolds={holds} onHoldsChange={(next) => console.log(next)} />;
}
```
