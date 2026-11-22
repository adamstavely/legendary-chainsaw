import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AddedToReadbook } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <AddedToReadbook />
      <p style={{ margin: "4px 0 0" }}>“Card testing at small merchants” is in your Readbook.</p>
    </div>
  );
}
