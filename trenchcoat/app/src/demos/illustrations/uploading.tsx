import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Uploading } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Uploading />
      <p style={{ margin: "4px 0 0" }}>Your scanned receipts are uploading – keep this page open until it's done.</p>
    </div>
  );
}
