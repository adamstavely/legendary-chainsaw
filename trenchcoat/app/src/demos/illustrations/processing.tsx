import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Processing } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <Processing />
      <p style={{ margin: "4px 0 0" }}>We're preparing your export of 2,400 survey responses. It takes a few minutes, and we'll email you when it's ready.</p>
    </div>
  );
}
