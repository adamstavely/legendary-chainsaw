import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Failed } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Failed />
      <p style={{ margin: "4px 0 0" }}>The import stopped at row 412: the date column couldn't be read.</p>
    </div>
  );
}
