import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { caption, surface } from "../../demo-kit";

// Lucide bookmark (ISC)
const bookmark = (
  <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LikeBurst } = ui;
  const [saved, setSaved] = useState(true);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center", fontSize: 13, color: "var(--tc-text-primary)" }}>
      <div style={{ ...surface, display: "grid", gap: 8, width: 300, padding: 14, borderRadius: 12 }}>
        <strong>Duplicate vendor IDs in the Q3 register</strong>
        <span style={caption}>Three suppliers share one tax ID across two regions.</span>
        <div style={{ display: "flex", gap: 4, marginLeft: -8 }}>
          <LikeBurst label="Helpful" count={7} />
          <LikeBurst label="Save finding" showLabel pressed={saved} count={saved ? 3 : 2} onPressedChange={setSaved}>
            {bookmark}
          </LikeBurst>
        </div>
      </div>
      <p style={{ ...caption, margin: 0 }}>Press the heart or Save – it bursts when it turns on.</p>
    </div>
  );
}
