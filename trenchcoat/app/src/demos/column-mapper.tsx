import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ColumnMapperColumn, ColumnMapperField, ColumnMapperSuggestion, ColumnMapping } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's vendor file, matched to its purchasing ledger's fields */
const COLUMNS: ColumnMapperColumn[] = [
  { id: "supplier", name: "Supplier", samples: ["Kestrel Lab Supplies", "Harbour Analytics", "Northfield Survey Co."] },
  { id: "contact", name: "Contact", samples: ["Priya Raman", "Tomas Berg", "Ana Duarte"] },
  { id: "mail", name: "E-mail address", samples: ["orders@kestrel-lab.example", "accounts@harbour-analytics.example"] },
  { id: "ctry", name: "Ctry", samples: ["UK", "NL", "CA"] },
  { id: "start", name: "Start", samples: ["2024-03-01", "2023-11-15", "2025-01-06"] },
  { id: "spend", name: "Spend FY26", samples: ["48,200", "126,500", "19,750"] },
  { id: "notes", name: "Notes", samples: ["Preferred for field kits", ""] },
];
const FIELDS: ColumnMapperField[] = [
  { id: "name", label: "Vendor name", type: "text", required: true },
  { id: "contactName", label: "Contact name", type: "text" },
  { id: "email", label: "Contact email", type: "email", required: true },
  { id: "country", label: "Country", type: "text", required: true },
  { id: "contractStart", label: "Contract start", type: "date" },
  { id: "annualSpend", label: "Annual spend", type: "number" },
];
const SUGGESTIONS: ColumnMapperSuggestion[] = [
  { column: "supplier", field: "name", confidence: 0.97 },
  { column: "contact", field: "contactName", confidence: 0.91 },
  { column: "mail", field: "email", confidence: 0.99 },
  { column: "ctry", field: "country", confidence: 0.68 },
  { column: "start", field: "contractStart", confidence: 0.82 },
  { column: "spend", field: "annualSpend", confidence: 0.55 },
  { column: "notes", field: null, confidence: 0.9 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ColumnMapper } = ui;
  const [mapping, setMapping] = useState<ColumnMapping>({ spend: null });
  const [note, setNote] = useState("Spend FY26 was changed to Don't import – Use suggestion puts it back");
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 10 }}>
      <ColumnMapper
        title="Match columns"
        description="vendors-2026.csv → Purchasing ledger"
        columns={COLUMNS}
        fields={FIELDS}
        suggestions={SUGGESTIONS}
        mapping={mapping}
        onMappingChange={(next, column, field) => {
          setMapping(next);
          setNote(column ? `${COLUMNS.find((c) => c.id === column)?.name} → ${FIELDS.find((f) => f.id === field)?.label ?? "Don't import"}` : "Every suggestion accepted");
        }}
        onContinue={() => setNote("Mapping saved – on to reviewing the rows")}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note}</span>
        <button type="button" onClick={() => setMapping({ mail: "name" })} style={textButton}>
          Map two columns to one field
        </button>
      </div>
    </div>
  );
}
