import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ImportReviewColumn, ImportReviewRow } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's vendor import: a bad email, a date that isn't one, a missing country and a duplicate */
const COLUMNS: ImportReviewColumn[] = [
  { id: "name", label: "Vendor name", required: true },
  { id: "email", label: "Contact email", type: "email", required: true },
  { id: "country", label: "Country", required: true },
  { id: "start", label: "Contract start", type: "date" },
  { id: "spend", label: "Annual spend", type: "number" },
];
const row = (id: string, name: string, email: string, country: string, start: string, spend: string): ImportReviewRow => ({ id, cells: { name, email, country, start, spend } });
const ROWS: ImportReviewRow[] = [
  row("r1", "Kestrel Lab Supplies", "orders@kestrel-lab.example", "United Kingdom", "2024-03-01", "48,200"),
  row("r2", "Harbour Analytics", "accounts@harbour-analytics.example", "Netherlands", "2023-11-15", "126,500"),
  row("r3", "Northfield Survey Co.", "hello@northfield", "Canada", "2025-01-06", "19,750"),
  row("r4", "Marlow & Finch Archives", "billing@marlowfinch.example", "Ireland", "Spring 2022", "8,400"),
  row("r5", "Quarry Hill Instruments", "sales@quarryhill.example", "", "2024-09-30", "73,100"),
  row("r6", "Harbour Analytics BV", "accounts@harbour-analytics.example", "Netherlands", "", "126,500"),
  row("r7", "Elmstead Data Services", "finance@elmstead.example", "United States", "2023-02-01", "211,900"),
  row("r8", "Copperleaf Translation", "invoices@copperleaf.example", "Spain", "2024-06-17", "12,600"),
  row("r9", "Brightwater Printing", "print@brightwater.example", "United Kingdom", "2021-10-04", "5,300"),
  row("r10", "Lowmoor Cold Storage", "ops@lowmoor.example", "Norway", "2025-02-20", "38,800"),
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ImportReview } = ui;
  const [rows, setRows] = useState(ROWS);
  const [note, setNote] = useState("Double-click a cell, or press Enter on it, to fix it");
  return (
    <div style={{ width: "100%", maxWidth: 940, display: "grid", gap: 10 }}>
      <ImportReview
        title="Review vendors"
        description="vendors-2026.csv · 10 rows"
        columns={COLUMNS}
        duplicateKey="email"
        rows={rows}
        onRowsChange={(next, change, id) => {
          setRows(next);
          setNote(`${change[0].toUpperCase()}${change.slice(1)} on row ${ROWS.findIndex((r) => r.id === id) + 1}`);
        }}
        onImport={(ok, left) => setNote(`Imported ${ok.length} vendors, left out ${left.length}`)}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note}</span>
        <button type="button" onClick={() => setRows(ROWS)} style={textButton}>
          Reset
        </button>
      </div>
    </div>
  );
}
