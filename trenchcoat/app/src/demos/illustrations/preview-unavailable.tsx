import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PreviewUnavailable } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <PreviewUnavailable />
      <p style={{ margin: "4px 0 0" }}>sample-plate-14.cdx can't be shown here. Download it to open it in ChemDraw.</p>
    </div>
  );
}
