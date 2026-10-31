import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TeamFlag } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* An audit team's files, each with its own flag. The last file's flag has since been removed from the team's list. */

const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "A second auditor should read this before it's relied on.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change or delete. Counsel has asked us to keep it as it is.", color: "#DC2626" },
  { id: "final", label: "Final", meaning: "Signed off, and the version to cite.", color: "#16A34A" },
];
const FILES: [string, string | null][] = [
  ["Q3 ledger reconciliation.xlsx", "review"],
  ["Vendor contract 2041.pdf", "hold"],
  ["Audit summary.docx", "final"],
  ["Field notes.txt", null],
  ["Old sampling plan.pdf", "draft"],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TeamFlagPicker } = ui;
  const [managed, setManaged] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {FILES.map(([name, flag]) => (
          <li key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, font: "inherit", fontSize: 13, color: "var(--tc-text-primary)" }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            <TeamFlagPicker flags={FLAGS} defaultValue={flag} fileName={name} manageable onTcManage={() => setManaged(true)} />
          </li>
        ))}
      </ul>
      <div style={{ ...caption, textAlign: "center" }}>{managed ? "Your page would open the team's flags here." : "Open a flag to see what each one means."}</div>
    </div>
  );
}
