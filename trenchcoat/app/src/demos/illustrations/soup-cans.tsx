import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SoupCans } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <SoupCans caption="Nothing sorted yet" />
      <p style={{ margin: "4px 0 0" }}>The food drive's donations are in. Add a category to each item so the volunteers can shelve them.</p>
    </div>
  );
}
