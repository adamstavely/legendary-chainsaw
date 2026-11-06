import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InQualityControl } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <InQualityControl />
      <p style={{ margin: "4px 0 0" }}>A second analyst is checking the figures in this dataset before it's shared with the panel.</p>
    </div>
  );
}
