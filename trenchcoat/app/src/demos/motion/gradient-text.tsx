import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GradientText } = ui;
  return (
    <div style={{ textAlign: "center", fontFamily: "inherit" }}>
      <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
        <GradientText as="h1">Ship faster</GradientText>
      </div>
      <p style={{ marginTop: 14, fontSize: 18, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        Build with{" "}
        <strong>
          <GradientText colors={[
              "light-dark(#7c3aed, #a78bfa)",
              "light-dark(#db2777, #f472b6)",
              "light-dark(#b45309, #fbbf24)",
              "light-dark(#0e7490, #67e8f9)",
            ]} speed={6}>
            liquid color
          </GradientText>
        </strong>{" "}
        that flows, then settles.
      </p>
    </div>
  );
}
