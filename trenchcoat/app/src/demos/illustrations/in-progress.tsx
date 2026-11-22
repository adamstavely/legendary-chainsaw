import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InProgress } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <InProgress />
      <p style={{ margin: "4px 0 0" }}>Priya is reviewing the case; she picked it up 20 minutes ago.</p>
    </div>
  );
}
