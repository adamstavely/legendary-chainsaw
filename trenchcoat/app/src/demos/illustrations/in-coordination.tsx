import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InCoordination } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <InCoordination />
      <p style={{ margin: "4px 0 0" }}>The three partner labs are agreeing a shared timeline before the study starts.</p>
    </div>
  );
}
