import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FileImportResult } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's vendor list, exported from its old purchasing sheet – one row is short a cell */
const CSV = [
  "Vendor name,Contact email,Country,Contract start,Annual spend,Notes",
  "Kestrel Lab Supplies,orders@kestrel-lab.example,United Kingdom,2024-03-01,48200,",
  "Harbour Analytics,accounts@harbour-analytics.example,Netherlands,2023-11-15,126500,",
  "Northfield Survey Co.,hello@northfield.example,Canada,2025-01-06,19750,",
  '"Marlow & Finch Archives",billing@marlowfinch.example,Ireland,2022-07-19,8400,',
  "Quarry Hill Instruments,sales@quarryhill.example,Germany,2024-09-30,73100,",
  "Tidewater Field Kits,team@tidewater.example,Australia,2025-04-12",
  "Elmstead Data Services,finance@elmstead.example,United States,2023-02-01,211900,",
  "Copperleaf Translation,invoices@copperleaf.example,Spain,2024-06-17,12600,",
  "Brightwater Printing,print@brightwater.example,United Kingdom,2021-10-04,5300,",
  "Lowmoor Cold Storage,ops@lowmoor.example,Norway,2025-02-20,38800,",
  "Saltmarsh Courier,dispatch@saltmarsh.example,France,2024-12-09,9900,",
  "Rookery Software,licensing@rookery.example,Finland,2023-05-23,64000,",
].join("\r\n");

const vendors = () => new File([CSV], "vendors-2026.csv", { type: "text/csv" });

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FileImport } = ui;
  const [file, setFile] = useState<File | null>(vendors);
  const [note, setNote] = useState("Untick “First row is headers” to see the header read as data");
  const report = (r: FileImportResult) => setNote(`${r.rows.length} rows, ${r.columns.length} columns${r.problems.length ? ` · ${r.problems.length} problems to look at` : ""}`);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 10 }}>
      <FileImport title="Import vendors" description="Rows become vendor records in the purchasing ledger" file={file} onFileChange={setFile} onParsed={report} onContinue={(r) => setNote(`Continuing with ${r.rows.length} rows`)} />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note}</span>
        <button type="button" onClick={() => setFile(file ? null : vendors())} style={textButton}>
          {file ? "Start over" : "Use the sample file"}
        </button>
      </div>
    </div>
  );
}
