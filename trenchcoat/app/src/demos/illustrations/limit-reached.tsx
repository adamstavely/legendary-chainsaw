import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LimitReached } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <LimitReached />
      <p style={{ margin: "4px 0 0" }}>The Halden Research Institute's 500 analysis runs for November are used up. They reset on 1 December.</p>
    </div>
  );
}
