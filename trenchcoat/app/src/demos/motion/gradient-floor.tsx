import type * as UI from "@motion/gradient-floor";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GradientFloor } = ui;
  return (
    <div style={{ width: 520, maxWidth: "100%", borderRadius: 16, overflow: "hidden", border: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))" }}>
      <GradientFloor>
        <div style={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 64, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textTransform: "uppercase" }}>Now in beta</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8, color: "var(--tc-text-strong, light-dark(#171717, #f5f5f5))" }}>Agents that ship.</div>
          <div style={{ fontSize: 14, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))", marginTop: 8, maxWidth: 320 }}>Plan, run and review work in one calm place.</div>
        </div>
      </GradientFloor>
    </div>
  );
}
