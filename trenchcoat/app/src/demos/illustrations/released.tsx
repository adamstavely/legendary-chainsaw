import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Released } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Released />
      <p style={{ margin: "4px 0 0" }}>The annual report is live on the institute's site, in all three languages.</p>
    </div>
  );
}
