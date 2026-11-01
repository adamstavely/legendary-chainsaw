import type * as UI from "../../../../src/elements/react";
import { textButton } from "../../demo-kit";

const card: React.CSSProperties = { display: "block", width: "100%", padding: "12px 14px", border: 0, borderRadius: 10, background: "var(--tc-surface-raised)", boxShadow: "var(--tc-card-shadow)", font: "inherit", fontSize: 13, textAlign: "left", color: "var(--tc-text-primary)" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SharedElement } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <SharedElement>
        <button type="button" data-shared="summary" data-shared-toggle style={{ ...card, cursor: "pointer", maxWidth: 220 }}>Trial 12 results</button>
        <div data-shared="detail" style={card}>
          <p style={{ margin: "0 0 8px", fontWeight: 500 }}>Trial 12 results</p>
          <p style={{ margin: "0 0 8px" }}>The 12-week follow-up supports the primary endpoint, with enrolment short at two sites.</p>
          <button type="button" data-shared-toggle style={textButton}>Close</button>
        </div>
      </SharedElement>
    </div>
  );
}
