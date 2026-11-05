import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AwaitingReview } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <AwaitingReview />
      <p style={{ margin: "4px 0 0" }}>Your grant summary goes live once a panel editor has approved it, usually within a day.</p>
    </div>
  );
}
