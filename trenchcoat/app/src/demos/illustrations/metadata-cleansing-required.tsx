import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MetadataCleansingRequired } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <MetadataCleansingRequired />
      <p style={{ margin: "4px 0 0" }}>38 records are missing a publisher or a date; fix them to release the batch.</p>
    </div>
  );
}
