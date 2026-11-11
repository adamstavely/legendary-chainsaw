import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { buttonSm, caption, surface } from "../../demo-kit";

const ACTIONS = ["Assign reviewer", "Request evidence", "Mark as duplicate", "Export finding"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MenuMorph } = ui;
  const [last, setLast] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 380 }}>
      <div style={{ ...surface, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, fontSize: 13 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500 }}>Finding F-214</div>
          <div style={caption}>Duplicate vendor payments, Q3 audit</div>
        </div>
        <MenuMorph>
          <button type="button" data-menu-trigger style={buttonSm}>
            Actions
          </button>
          <div data-menu aria-label="Finding F-214 actions">
            {ACTIONS.map((a) => (
              <button key={a} type="button" role="menuitem" onClick={() => setLast(a)}>
                {a}
              </button>
            ))}
          </div>
        </MenuMorph>
      </div>
      <p style={{ ...caption, margin: 0 }} aria-live="polite">
        {last ? `Chose “${last}”.` : "Open Actions with a click, or focus it and press ↓."}
      </p>
    </div>
  );
}
