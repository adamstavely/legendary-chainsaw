import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Subprocessor } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The subprocessors of a fictional AI workspace vendor, as published to its customers: hosting, email, model and
   support vendors across the EU and US, one new vendor taking effect next month and one removed. */

const SUBPROCESSORS: Subprocessor[] = [
  { id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting and storage", categories: ["Account data", "Customer content"], location: "Ireland", transfer: "Within the EEA", added: Date.UTC(2023, 2, 1), status: "active" },
  { id: "qm", name: "Quanta Models", purpose: "Model inference", categories: ["Customer content"], location: "United States", transfer: "Standard Contractual Clauses", added: Date.UTC(2024, 5, 12), status: "active" },
  { id: "am", name: "Atlas Mail", purpose: "Transactional email", categories: ["Account data"], location: "Germany", transfer: "Within the EEA", added: Date.UTC(2023, 7, 20), status: "active" },
  { id: "hd", name: "Harbour Desk", purpose: "Customer support tickets", categories: ["Account data", "Support content"], location: "United Kingdom", transfer: "UK adequacy decision", added: Date.UTC(2024, 1, 5), status: "active" },
  { id: "ls", name: "Lumen Search", purpose: "Retrieval index", categories: ["Customer content"], location: "Ireland", transfer: "Within the EEA", added: Date.UTC(2026, 10, 1), status: "new", effective: Date.UTC(2026, 11, 1) },
  { id: "pb", name: "Pinecrest Billing", purpose: "Invoicing", categories: ["Billing data"], location: "United States", transfer: "Standard Contractual Clauses", added: Date.UTC(2022, 9, 3), status: "removed", effective: Date.UTC(2026, 6, 31) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SubprocessorList } = ui;
  const [category, setCategory] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 8 }}>
      <SubprocessorList
        title="Subprocessors"
        description="Quanta Workspace · last changed 1 Nov 2026"
        subprocessors={SUBPROCESSORS}
        category={category}
        onCategoryChange={setCategory}
        onExport={() => false}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Filter by data or location, search, or subscribe to changes.{" "}
        {category ? null : (
          <button type="button" style={textButton} onClick={() => setCategory("Customer content")}>
            Show who handles customer content
          </button>
        )}
      </div>
    </div>
  );
}
