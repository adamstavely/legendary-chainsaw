import { useState } from "react";
import type * as UI from "@components/filter-menu";
import type { FilterGroup, FilterValue } from "@components/filter-menu";

const GROUPS: FilterGroup[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { id: "new", label: "New" },
      { id: "contacted", label: "Contacted" },
      { id: "qualified", label: "Qualified" },
      { id: "won", label: "Won" },
      { id: "lost", label: "Lost" },
    ],
  },
  {
    id: "score",
    label: "Lead score",
    chipPrefix: "Score: ",
    options: [
      { id: "90", label: "90–100" },
      { id: "80", label: "80–89" },
      { id: "60", label: "60–79" },
      { id: "0", label: "Below 60" },
    ],
  },
  {
    id: "region",
    label: "Region",
    options: [
      { id: "na", label: "North America" },
      { id: "eu", label: "Europe" },
      { id: "apac", label: "Asia Pacific" },
      { id: "latam", label: "Latin America" },
    ],
  },
  {
    id: "source",
    label: "Source",
    chipPrefix: "From ",
    options: [
      { id: "web", label: "Website" },
      { id: "event", label: "Events" },
      { id: "referral", label: "Referral" },
      { id: "outbound", label: "Outbound" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FilterMenu } = ui;
  const [value, setValue] = useState<FilterValue>({ status: ["qualified", "won"], score: ["90"] });
  const count = Object.values(value).reduce((n, ids) => n + ids.length, 0);

  return (
    <div style={{ width: "100%", maxWidth: 340, display: "grid", gap: 10 }}>
      <FilterMenu groups={GROUPS} value={value} onChange={setValue} defaultOpen={["status", "score"]} title="Filter leads" />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }}>
        {count === 0 ? "No filters – showing all 1,284 leads" : `${count} filter${count === 1 ? "" : "s"} active`}
      </div>
    </div>
  );
}
