import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { Exhibit } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The exhibits in a fictional contract dispute: documents, a recorded call, a laptop image and bank records, each
   with its chain of custody. "Re-check hashes" turns up a mismatch on the laptop image. */

const H = 3_600_000;
const T = new Date(2026, 5, 2, 9).getTime();
const HASH = "sha256:9f2c7a1e4b0d83c65e7f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7";
const HASH2 = "sha256:0b4e8d21c97f53a6e8d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3";

const EXHIBITS: Exhibit[] = [
  {
    id: "e101",
    ref: "E-101",
    title: "Signed supply agreement, 2024",
    type: "document",
    source: { label: "Client", grade: "A1" },
    date: T - 30 * 24 * H,
    status: "sealed",
    holder: "Evidence room B",
    custody: [
      { at: T - 30 * 24 * H, actor: "M. Tan (paralegal)", action: "Collected", location: "Client offices, Leeds", hash: HASH },
      { at: T - 30 * 24 * H + 2 * H, actor: "M. Tan (paralegal)", action: "Sealed", location: "Evidence room B", hash: HASH },
    ],
  },
  {
    id: "e108",
    ref: "E-108",
    title: "Email thread – “revised invoice 7741”",
    type: "document",
    source: { label: "Discovery", grade: "B1" },
    date: T - 20 * 24 * H,
    status: "pending",
    holder: "Lab",
    custody: [
      { at: T - 20 * 24 * H, actor: "Opposing counsel", action: "Produced", location: "Disclosure portal" },
      { at: T - 19 * 24 * H, actor: "K. Osei (analyst)", action: "Checked out", location: "Lab", hash: HASH2 },
    ],
  },
  {
    id: "e112",
    ref: "E-112",
    title: "Recorded call with the supplier, 14 min",
    type: "audio",
    source: { label: "Client", grade: "A2" },
    date: T - 15 * 24 * H,
    status: "transcribed",
    custody: [
      { at: T - 15 * 24 * H, actor: "Client IT", action: "Exported", hash: HASH2 },
      { at: T - 14 * 24 * H, actor: "Transcription service", action: "Analysed", hash: HASH2 },
      { at: T - 13 * 24 * H, actor: "M. Tan (paralegal)", action: "Returned", location: "Evidence room B", hash: HASH2 },
    ],
  },
  {
    id: "e114",
    ref: "E-114",
    title: "Finance laptop – forensic image",
    type: "forensic",
    source: { label: "Forensics", grade: "A1" },
    date: T - 10 * 24 * H,
    status: "analysis",
    holder: "Analyst K. Osei",
    custody: [
      { at: T - 10 * 24 * H, actor: "Forensics team", action: "Collected", location: "Client offices, Leeds", hash: HASH },
      { at: T - 9 * 24 * H, actor: "K. Osei (analyst)", action: "Analysed", location: "Lab", hash: HASH },
    ],
  },
  { id: "e116", ref: "E-116", title: "Bank wire confirmations, Q2", type: "financial", source: { label: "Bank", grade: "B2" }, date: T - 40 * 24 * H, status: "released" },
  { id: "e120", ref: "E-120", title: "Warehouse delivery photos", type: "photo", source: { label: "Site visit", grade: "C3" }, date: T - 5 * 24 * H, status: "sealed", holder: "Evidence room B" },
];
const MISMATCH = EXHIBITS.map((e) =>
  e.id === "e114" ? { ...e, custody: [...e.custody!, { at: T, actor: "K. Osei (analyst)", action: "Re-checked", location: "Lab", hash: HASH2 }] } : e,
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EvidenceList } = ui;
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>("e101");
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <EvidenceList
        title="Linked evidence"
        description="Matter 24-0187 · supply contract dispute"
        exhibits={checked ? MISMATCH : EXHIBITS}
        synced={T + 8 * 24 * H}
        note="Exhibits are kept in the evidence system; these are linked references."
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {checked ? "E-114's latest hash doesn't match – open it to see where. " : "Open an exhibit for its chain of custody. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setChecked(!checked);
            if (!checked) setSelected("e114");
          }}
        >
          {checked ? "Reset" : "Re-check hashes"}
        </button>
      </div>
    </div>
  );
}
