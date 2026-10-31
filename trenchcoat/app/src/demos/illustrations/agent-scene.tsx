import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentScene } = ui;
  const scenes = [
    ["all-clear", "All clear"],
    ["working", "Working"],
    ["offline", "Offline"],
  ] as const;
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      {scenes.map(([scene, word]) => (
        <figure key={scene} style={{ margin: 0 }}>
          <AgentScene scene={scene} size={72} />
          <figcaption>{word}</figcaption>
        </figure>
      ))}
    </div>
  );
}
