import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AllDone } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <AllDone />
      <p style={{ margin: "4px 0 0" }}>No proposals are waiting for your review. New ones will show up here.</p>
    </div>
  );
}
