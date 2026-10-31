import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { caption, textButton } from "../../demo-kit";

/* A review queue: the rows glide when they're shuffled, and leave or arrive softly. */

const row: React.CSSProperties = { padding: "10px 12px", marginBottom: 6, borderRadius: 10, background: "var(--tc-surface-raised)", boxShadow: "var(--tc-card-shadow)", fontSize: 13, color: "var(--tc-text-primary)" };
const START = ["Vendor contract 2041", "Q3 reconciliation", "Audit summary", "Field notes"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ListMotion } = ui;
  const [rows, setRows] = useState(START);
  const [next, setNext] = useState(1);
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <ListMotion>{rows.map((r) => <div key={r} style={row}>{r}</div>)}</ListMotion>
      <div style={{ ...caption, display: "flex", gap: 12, justifyContent: "center" }}>
        <button type="button" style={textButton} onClick={() => setRows([...rows.slice(1), rows[0]!])}>Move first to last</button>
        <button type="button" style={textButton} onClick={() => { setRows([`New item ${next}`, ...rows]); setNext(next + 1); }}>Add</button>
        <button type="button" style={textButton} onClick={() => setRows(rows.slice(1))}>Remove first</button>
      </div>
    </div>
  );
}
