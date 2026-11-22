import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Success } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Success />
      <p style={{ margin: "4px 0 0" }}>All 1,240 cases imported, with nothing to fix.</p>
    </div>
  );
}
