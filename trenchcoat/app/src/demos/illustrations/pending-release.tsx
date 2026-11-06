import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PendingRelease } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <PendingRelease />
      <p style={{ margin: "4px 0 0" }}>This report is approved and goes out with Thursday's release.</p>
    </div>
  );
}
