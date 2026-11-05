import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { UploadFailed } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <UploadFailed />
      <p style={{ margin: "4px 0 0" }}>field-survey-2026.csv is 214 MB, over the portal's 100 MB limit. Split it and try again.</p>
    </div>
  );
}
