---
pattern: grid
status: new
related: tool-permissions, access-request, team-roster, share-panel
---

## Overview

What each role in a workspace can do. Permissions are the rows, grouped as Agents, Data, Billing and Admin; roles are the
columns – Owner, Admin, Builder, Member, Viewer and any custom roles – and each cell is a tick. Some permissions need
others: turning on Deploy agents turns on Edit agents and View agents too, turning off View agents turns off what needs
it, and a note says what else changed. Owner is locked. Custom roles can be added, renamed and deleted, each column says
how many members have the role, and a summary lists what changed since the last save, with Discard and Save.

## When to use

- A workspace's settings, where admins decide what each role may do.
- Adding a role for a group that needs a mix of rights, such as auditors who read data and the audit log.
- Reviewing a batch of role changes together before saving them.

## When not to use

- Which tools each agent may use – use `tool-permissions`.
- One person asking for a right they don't have – use `access-request`.
- Who is in the team and what role each person has – use `team-roster`.
- Sharing one item with people – use `share-panel`.

## Anatomy

1. **New role** `.ui-rle__add` – adds a custom role and starts renaming it
2. **Role** `.ui-rle__role` – a column: name, a lock for Owner, member count, Rename and Delete for custom roles
3. **Group** `.ui-rle__group` – a row heading: Agents, Data, Billing, Admin
4. **Permission** `.ui-rle__perm` – a row: what the role may do, with a quiet description
5. **Cell** `.ui-rle__cell` – a tick box; a dot marks a change since the last save
6. **Note** `.ui-rle__note` – what a change also turned on or off
7. **Confirm** `.ui-rle__confirm` – Delete role, with how many members lose it
8. **Changes** `.ui-rle__summary` – every difference from what was saved
9. **Save** `.ui-rle__answer` – Discard and Save, with the number of changes

## Looks

Standard is a white card on a gray tray, with Discard and Save sitting on the tray below it. Clean is one white card with
the buttons in its last row. The grid works the same in both; the permission column stays put while roles scroll sideways.

## Keyboard

The grid is one tab stop; inside it the arrows move between cells. Rename and Delete are buttons in the column headers.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the next cell in that direction |
| Home / End | Moves to the first or last cell in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell of the grid |
| Space / Enter | Turns the permission on or off for that role |
| Enter (renaming) | Keeps the new name |
| Escape (renaming, deleting) | Keeps the old name; cancels the delete |
| Tab | Leaves the grid |

## Screen readers

The grid is a `grid` named by the heading, with roles as column headers and each permission as a row header that includes
its group ("Agents · Deploy agents"). A cell reads "Allowed" or "Not allowed", and ", changed" when it differs from what
was saved; a locked role's cells are read-only. Each cell is described by "Space turns it on or off". Every change is
confirmed in a polite status message, with what else changed: "Member: Deploy agents on. Deploy agents needs Edit agents
and View agents, so they were turned on too." Rename and Delete are named "Rename Auditors" and "Delete Auditors". The
summary is a section headed "Unsaved changes"; Discard and Save are `aria-disabled` while nothing has changed.

## Content

- Name permissions as actions: "Deploy agents", "Export data", "Manage billing".
- Use `description` for what a permission covers when the name alone is vague: "Instructions, tools and triggers".
- Set `requires` for every permission that makes no sense alone – editing without viewing, exporting without viewing.
- Keep role names short; they're column headings.

## Do

- Keep `saved` in step with what your server stored, so the summary shows only real changes.
- Handle `tc-roles-save` and store the roles; call `preventDefault()` if the save fails, so the changes stay listed.
- Lock the role that must keep every permission, so nobody locks themselves out.

## Don't

- Don't put more than about eight roles side by side – the grid scrolls sideways and the far columns are easy to miss.
- Don't use it for one person's exceptions; give them a role, or a custom one.
- Don't delete roles without saying who has them – the confirmation does it for you.

## Example

```html
<tc-role-editor id="roles" description="What each role can do."></tc-role-editor>

<script type="module">
  import "@adamstavely/trenchcoat/role-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const roles = document.querySelector("#roles");
  roles.roles = [
    { id: "owner", name: "Owner", members: 1, locked: true, permissions: ["agents.view", "agents.edit", "agents.deploy", "data.view", "data.export", "billing.view", "billing.manage", "admin.members", "admin.roles", "admin.audit"] },
    { id: "builder", name: "Builder", members: 6, permissions: ["agents.view", "agents.edit", "data.view"] },
    { id: "viewer", name: "Viewer", members: 9, permissions: ["agents.view"] },
  ];
  roles.addEventListener("tc-roles-save", (e) => console.log(e.detail.changes));
</script>
```

```tsx
import { useState } from "react";
import { RoleEditor, type Role } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: Role[] = [
  { id: "owner", name: "Owner", members: 1, locked: true, permissions: ["agents.view", "agents.edit", "agents.deploy"] },
  { id: "member", name: "Member", members: 24, permissions: ["agents.view"] },
];

export function Roles() {
  const [roles, setRoles] = useState(start);
  const [saved, setSaved] = useState(start);
  return <RoleEditor title="Roles" roles={roles} onRolesChange={setRoles} saved={saved} onRolesSave={setSaved} />;
}
```
