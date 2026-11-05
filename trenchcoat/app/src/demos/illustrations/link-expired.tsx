import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LinkExpired } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      <LinkExpired />
      <p style={{ margin: "4px 0 0" }}>The link to the review panel's notes stopped working on 2 November. Ask the person who shared it for a new one.</p>
    </div>
  );
}
