import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

/* The covered picture is only a gradient: real content wouldn't load until someone chooses to see it. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ContentHidden } = ui;
  const [shown, setShown] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 420, aspectRatio: "4 / 3", overflow: "hidden", borderRadius: 12, background: "linear-gradient(135deg, #5b7bb0, #a06a9c)" }}>
      {!shown && (
        <div style={{ position: "absolute", inset: 0, display: "grid", alignContent: "center", justifyItems: "center", gap: 8, padding: 16, background: "var(--tc-surface-raised)" }}>
          <div style={{ width: "100%", maxWidth: 260 }}>
            <ContentHidden />
          </div>
          <button type="button" style={textButton} onClick={() => setShown(true)}>Show content</button>
        </div>
      )}
    </div>
  );
}
