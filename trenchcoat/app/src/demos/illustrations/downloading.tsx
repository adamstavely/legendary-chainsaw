import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Downloading } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Downloading />
      <p style={{ margin: "4px 0 0" }}>The quarterly audit export is on its way – it'll be in your downloads in a moment.</p>
    </div>
  );
}
