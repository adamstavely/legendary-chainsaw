import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EnvironmentItem } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* Where a fictional session on a research institute's sample tracker is running. */

const ITEMS: EnvironmentItem[] = [
  { id: "computer", kind: "computer", label: "Lab workstation", action: { id: "save", label: "Save" } },
  { id: "project", kind: "folder", label: "sample-tracker", detail: "~/projects/institute/long-term-storage/sample-tracker" },
  { id: "docs", kind: "folder", label: "protocols" },
  { id: "repo", kind: "repo", label: "institute/sample-tracker" },
  { id: "branch", kind: "branch", label: "freezer-locations" },
  { id: "remote", kind: "custom", icon: "M4 12a8 8 0 0 1 16 0M8 12a4 4 0 0 1 8 0M12 12v8", label: "Remote access", toggle: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EnvironmentList } = ui;
  const [said, setSaid] = useState("Press Save, or flip the switch.");
  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <EnvironmentList
        title="Environment"
        items={ITEMS}
        defaultToggles={{ remote: true }}
        onTcAction={(e) => setSaid(`${e.detail.id}: ${e.detail.item.label}`)}
        onTogglesChange={(t) => setSaid(`Remote access is ${t.remote ? "on" : "off"}`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{said}</div>
    </div>
  );
}
