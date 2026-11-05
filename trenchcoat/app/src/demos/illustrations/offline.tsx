import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Offline } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Offline />
      <p style={{ margin: "4px 0 0" }}>The Halden Research Institute portal can't reach the server. Your draft is saved on this device and will sync when you're back.</p>
    </div>
  );
}
