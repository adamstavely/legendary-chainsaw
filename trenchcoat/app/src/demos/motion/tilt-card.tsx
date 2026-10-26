import type * as UI from "@motion/tilt-card";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TiltCard } = ui;
  return (
    <TiltCard>
      <div
        style={{
          width: 300,
          padding: 24,
          color: "#fff",
          background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #db2777 100%)",
          display: "grid",
          gap: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, letterSpacing: "0.04em" }}>AFFECT PRO</span>
          <span style={{ fontSize: 12, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>Annual</span>
        </div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>$24<span style={{ fontSize: 14, opacity: 0.7 }}>/mo</span></div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Unlimited agents, priority runs, SSO.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
          <span>Member since 2024</span>
          <span>•••• 4821</span>
        </div>
      </div>
    </TiltCard>
  );
}
