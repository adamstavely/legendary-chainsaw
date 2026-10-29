import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Facet, FacetValues } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The filters beside a fictional research archive's results: what kind of thing, which programme, the year range and
   a date. Two filters start on. The caption shows the value a page would put in its URL. */

const FACETS: Facet[] = [
  { id: "kind", label: "Kind", type: "checkbox", options: [{ value: "doc", label: "Documents", count: 128 }, { value: "note", label: "Lab notes", count: 64 }, { value: "person", label: "People", count: 12 }, { value: "email", label: "Emails", count: 41 }, { value: "data", label: "Datasets", count: 9 }, { value: "image", label: "Images", count: 0 }] },
  {
    id: "programme",
    label: "Programme",
    type: "checkbox",
    options: ["Coral resilience", "Kelp forests", "Seagrass carbon", "Plankton survey", "Mangrove recovery", "Deep-sea sensors", "Microplastics", "Tidal energy", "Fisheries data"].map((label, i) => ({ value: label.toLowerCase().replace(/\W+/g, "-"), label, count: [52, 31, 18, 22, 9, 6, 14, 0, 11][i] })),
  },
  { id: "access", label: "Access", type: "radio", options: [{ value: "open", label: "Open", count: 190 }, { value: "staff", label: "Staff only", count: 64 }] },
  { id: "pages", label: "Length", type: "range", min: 1, max: 200, unit: "pages" },
  { id: "updated", label: "Updated", type: "date" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FacetSidebar } = ui;
  const [value, setValue] = useState<FacetValues>({ kind: ["doc", "note"], pages: [5, 80] });
  return (
    <div style={{ width: "100%", maxWidth: 300, display: "grid", gap: 10 }}>
      <FacetSidebar facets={FACETS} value={value} onValueChange={setValue} />
      <div style={{ ...caption, textAlign: "center", wordBreak: "break-all" }}>{JSON.stringify(value)}</div>
    </div>
  );
}
