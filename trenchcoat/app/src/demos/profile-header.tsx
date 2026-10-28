import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProfileAction, ProfileTab } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A customer under enhanced due-diligence review at a bank: status and priority beside the name, the names the
   customer has used, the case facts on one line, the reviewer's actions and the profile's sections as tabs. */

const ACTIONS: ProfileAction[] = [
  { id: "flag", label: "Flag for review", icon: "flag", variant: "primary" },
  { id: "report", label: "Report", icon: "report" },
];
const TABS: ProfileTab[] = [
  { id: "overview", label: "Overview" },
  { id: "identity", label: "Identity" },
  { id: "accounts", label: "Accounts", count: 4 },
  { id: "transactions", label: "Transactions", count: 128 },
  { id: "documents", label: "Documents", count: 9 },
  { id: "people", label: "Linked people", count: 6 },
  { id: "notes", label: "Notes" },
  { id: "history", label: "History" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProfileHeader } = ui;
  const [tab, setTab] = useState("overview");
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <ProfileHeader
        name="Dana Whitfield"
        status={{ label: "Enhanced review", tone: "warning" }}
        tags={[{ label: "High priority", tone: "danger" }]}
        aliases={["Dana Whitfield-Ross", "D. Ross"]}
        meta={["Retail customer", "Leeds, UK", "Customer since 2017", { label: "Case KYC-2291", tone: "warning" }]}
        actions={ACTIONS}
        more
        tabs={TABS}
        selected={tab}
        onSelectedChange={setTab}
        onAction={setLast}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {last ? `“${last}” was chosen – the page handles it.` : `Showing the ${TABS.find((t) => t.id === tab)?.label} section. Try the arrow keys in the tabs, then Enter.`}
      </div>
    </div>
  );
}
