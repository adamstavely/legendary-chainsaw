import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's uploads, at each stage of a scan. */

const ROWS = [
  ["Field notes.txt", "queued", undefined],
  ["Sampling plan.pdf", "scanning", 0.4],
  ["Annual report.pdf", "clean", undefined],
  ["Macro sheet.xlsm", "suspicious", undefined],
  ["Old backup.tar", "failed", undefined],
] as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScanStatus } = ui;
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 12 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {ROWS.map(([name, state, progress]) => (
          <li key={name} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13, color: "var(--tc-text-primary)" }}>
            <span>{name}</span>
            <ScanStatus fileName={name} state={state} progress={progress} onTcAction={(e) => setNote(`${e.detail.action} on ${name}`)} />
          </li>
        ))}
      </ul>
      <ScanStatus layout="card" fileName="invoice-88213.zip" state={done ? "clean" : "quarantined"} engine="Institute scanner" scannedAt={Date.UTC(2026, 9, 31, 9, 30)} locale="en-GB" detail={done ? "A second review found nothing." : "It contains a program that hides itself."} onTcAction={(e) => setNote(`${e.detail.action} on the invoice`)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Press Rescan or Request review."}{" "}
        <button type="button" style={textButton} onClick={() => setDone(!done)}>
          {done ? "Quarantine it again" : "Mark the invoice clean"}
        </button>
      </div>
    </div>
  );
}
