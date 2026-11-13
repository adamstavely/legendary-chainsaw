import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Role } from "../../../src/elements/react";
import { caption } from "../demo-kit";

const SAVED: Role[] = [
  { id: "owner", name: "Owner", members: 1, locked: true, permissions: ["agents.view", "agents.edit", "agents.deploy", "data.view", "data.export", "billing.view", "billing.manage", "admin.members", "admin.roles", "admin.audit"] },
  { id: "admin", name: "Admin", members: 3, permissions: ["agents.view", "agents.edit", "agents.deploy", "data.view", "data.export", "billing.view", "admin.members", "admin.roles", "admin.audit"] },
  { id: "builder", name: "Builder", members: 6, permissions: ["agents.view", "agents.edit", "data.view"] },
  { id: "member", name: "Member", members: 24, permissions: ["agents.view", "data.view"] },
  { id: "viewer", name: "Viewer", members: 9, permissions: ["agents.view"] },
  { id: "auditors", name: "Auditors", members: 2, custom: true, permissions: ["data.view", "data.export", "admin.audit"] },
];
/** One edit already made, so the summary has something to say */
const START: Role[] = SAVED.map((r) => (r.id === "builder" ? { ...r, permissions: [...r.permissions, "agents.deploy"] } : r));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RoleEditor } = ui;
  const [roles, setRoles] = useState(START);
  const [saved, setSaved] = useState(SAVED);
  const [note, setNote] = useState("Tick Deploy for Member – Edit comes with it. Owner is locked.");
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <RoleEditor
        title="Roles"
        description="What each role can do in the research institute's AI workspace."
        roles={roles}
        saved={saved}
        onRolesChange={(next, change) => {
          setRoles(next);
          setNote(change.type === "add" ? "New role added – type its name." : change.type === "discard" ? "Back to what was saved." : "Changed – not saved yet.");
        }}
        onRolesSave={(next, changes) => {
          setSaved(next.map((r) => ({ ...r, permissions: [...r.permissions] })));
          setNote(`Saved ${changes.length} ${changes.length === 1 ? "change" : "changes"}.`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}
