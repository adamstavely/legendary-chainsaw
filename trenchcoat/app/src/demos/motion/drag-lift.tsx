import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { caption } from "../../demo-kit";

const card: React.CSSProperties = { padding: "12px 14px", borderRadius: 10, background: "var(--tc-surface-raised)", boxShadow: "var(--tc-card-shadow)", fontSize: 13, color: "var(--tc-text-primary)" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { DragLift } = ui;
  const [note, setNote] = useState("Drag the card. Escape cancels, and letting go glides it home.");
  return (
    <div style={{ width: "100%", maxWidth: 320, display: "grid", gap: 8 }}>
      <DragLift onTcDragEnd={(e) => setNote(`Let go ${Math.round(e.detail.x)} px across and ${Math.round(e.detail.y)} px down.`)} onTcDragCancel={() => setNote("Cancelled.")}>
        <div style={card}><span data-drag-handle aria-hidden="true">⠿</span> Sampling plan</div>
      </DragLift>
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}
