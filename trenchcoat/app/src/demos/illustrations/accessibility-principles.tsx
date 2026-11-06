import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AccessibilityPrinciples } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 440, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <AccessibilityPrinciples />
      <p style={{ margin: "4px 0 0" }}>Every tool at the institute is checked against the four principles before it ships.</p>
    </div>
  );
}
