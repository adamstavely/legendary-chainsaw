import { useState } from "react";
import type * as UI from "@components/data-table";
import type { DataColumn, DataRow, TagTone } from "@components/data-table";

const Logo = ({ letter, bg }: { letter: string; bg: string }) => (
  <span
    style={{
      display: "inline-grid",
      placeItems: "center",
      width: 18,
      height: 18,
      borderRadius: 5,
      background: bg,
      color: "#fff",
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    {letter}
  </span>
);

const TableIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <rect x="2.5" y="3" width="11" height="10" rx="2" />
    <path d="M2.5 6.5h11M6.5 6.5V13" />
  </svg>
);

const ROWS: DataRow[] = [
  { id: "r1", logo: <Logo letter="L" bg="#5e6ad2" />, name: "Linear", stage: "Customer", website: "linear.app", employees: 120, arr: 48000, owner: "Maya" },
  { id: "r2", logo: <Logo letter="F" bg="#0acf83" />, name: "Figma", stage: "Negotiation", website: "figma.com", employees: 1600, arr: 125000, owner: "Jonas" },
  { id: "r3", logo: <Logo letter="N" bg="#111111" />, name: "Notion", stage: "Customer", website: "notion.so", employees: 800, arr: 92000, owner: "Priya" },
  { id: "r4", logo: <Logo letter="V" bg="#000000" />, name: "Vercel", stage: "Qualified", website: "vercel.com", employees: 650, arr: 38000, owner: "Leo" },
  { id: "r5", logo: <Logo letter="S" bg="#3ecf8e" />, name: "Supabase", stage: "Lead", website: "supabase.com", employees: 140, arr: 0, owner: "Aiko" },
  { id: "r6", logo: <Logo letter="R" bg="#2563eb" />, name: "Raycast", stage: "Qualified", website: "raycast.com", employees: 60, arr: 12500, owner: "Maya" },
  { id: "r7", logo: <Logo letter="A" bg="#f97316" />, name: "Arc", stage: "Churned", website: "arc.net", employees: 75, arr: 0, owner: "Jonas" },
  { id: "r8", logo: <Logo letter="P" bg="#e11d48" />, name: "PostHog", stage: "Negotiation", website: "posthog.com", employees: 90, arr: 56000, owner: "Priya" },
];

const TONES: Record<string, TagTone> = {
  Lead: "gray",
  Qualified: "violet",
  Negotiation: "amber",
  Customer: "green",
  Churned: "pink",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DataTable, TextColumnIcon, TagColumnIcon, LinkColumnIcon, NumberColumnIcon } = ui;
  const [rows, setRows] = useState(ROWS);
  const [selected, setSelected] = useState<string[]>([]);

  const columns: DataColumn[] = [
    { key: "name", label: "Company", type: "title", icon: <TextColumnIcon />, width: "170px" },
    { key: "stage", label: "Stage", type: "tag", icon: <TagColumnIcon />, width: "130px", options: Object.keys(TONES) },
    { key: "website", label: "Website", type: "link", icon: <LinkColumnIcon />, width: "150px" },
    { key: "employees", label: "Employees", type: "number", icon: <NumberColumnIcon />, width: "110px" },
    { key: "arr", label: "ARR ($)", type: "number", icon: <NumberColumnIcon />, width: "110px" },
    { key: "owner", label: "Owner", type: "text", icon: <TextColumnIcon />, width: "100px", editable: false },
  ];

  const pipeline = rows.reduce((s, r) => s + (typeof r.arr === "number" ? r.arr : 0), 0);

  return (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
      <DataTable
        title="Accounts"
        icon={<TableIcon />}
        columns={columns}
        rows={rows}
        tagTones={TONES}
        onRowsChange={setRows}
        onSelectionChange={setSelected}
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }}>
        {rows.length} rows · total ARR ${pipeline.toLocaleString("en-US")}
        {selected.length > 0 && ` · ${selected.length} checked`} — double-click to edit, ⌘C/⌘V, ⌘Z
      </div>
    </div>
  );
}
