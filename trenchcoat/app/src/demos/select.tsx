import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SelectOption } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const periods: SelectOption[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-quarter", label: "This quarter" },
  { value: "last-quarter", label: "Last quarter" },
  { value: "this-year", label: "This year", description: "January 1 to today" },
  { value: "custom", label: "Custom range…", description: "Available on the Research plan", disabled: true },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Select, Button } = ui;
  const [period, setPeriod] = useState("this-quarter");
  const [team, setTeam] = useState("");
  const name = periods.find((p) => p.value === period)?.label ?? period;

  return (
    <div style={{ width: "100%", maxWidth: 480, minHeight: 360, display: "grid", alignContent: "start", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 120, fontSize: 15, fontWeight: 600, color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>Audit findings</div>
        <Select label="Reporting period" options={periods} value={period} onChange={setPeriod} align="end" defaultOpen />
        <Button variant="secondary">Export</Button>
      </div>
      <Select
        label="Review team"
        labelVisible
        placeholder="Any team"
        options={[
          { value: "fraud", label: "Fraud review" },
          { value: "controls", label: "Internal controls" },
          { value: "research", label: "Research institute" },
        ]}
        value={team}
        onChange={setTeam}
      />
      <div style={caption}>
        Showing {name}
        {team ? ` · ${team}` : ""}.{" "}
        <button type="button" style={textButton} onClick={() => (setPeriod("this-month"), setTeam(""))}>
          Reset
        </button>
      </div>
    </div>
  );
}
