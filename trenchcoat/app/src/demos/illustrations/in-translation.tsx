import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InTranslation } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <InTranslation />
      <p style={{ margin: "4px 0 0" }}>The French and German versions of the annual report are with the translators and go live together.</p>
    </div>
  );
}
