import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's files, each with its own classification. */

const FILES: [string, string | null][] = [
  ["Trial 12 results.pdf", "restricted"],
  ["Lab safety guide.pdf", "internal"],
  ["Annual report 2025.pdf", "public"],
  ["Field notes.txt", null],
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SensitivityLabelPicker } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 8 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {FILES.map(([name, value]) => (
          <li key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 13, color: "var(--tc-text-primary)" }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            <SensitivityLabelPicker fileName={name} defaultValue={value} onValueChange={(_, d) => setNote(d.reason ? `Lowered to ${d.label.label}: ${d.reason}` : `Set to ${d.label.label}.`)} />
          </li>
        ))}
      </ul>
      <div style={{ ...caption, textAlign: "center" }}>{note || "Lower a label to see it ask why first."}</div>
    </div>
  );
}
