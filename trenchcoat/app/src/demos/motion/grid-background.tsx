import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GridBackground } = ui;
  return (
    <div style={{ width: 520, maxWidth: "100%", borderRadius: 16, overflow: "hidden", border: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))", background: "var(--tc-surface-raised, light-dark(#ffffff, #19191b))" }}>
      <GridBackground size={40}>
        <div style={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--tc-text-strong, light-dark(#171717, #f5f5f5))" }}>Build on a solid grid</div>
          <div style={{ fontSize: 14, color: "var(--tc-text-secondary, light-dark(#404040, #c8c8cc))", maxWidth: 300 }}>A quiet, drifting backdrop for hero sections and empty states.</div>
          <button type="button" style={{
              marginTop: 8,
              height: "var(--tc-control-h-md, 32px)",
              padding: "0 var(--tc-control-px-md, 12px)",
              borderRadius: "var(--tc-control-radius-md, 10px)",
              border: 0,
              background: "var(--tc-action-primary-bg, light-dark(#171717, #ededed))",
              color: "var(--tc-action-primary-fg, light-dark(#ffffff, #111113))",
              boxShadow: "var(--tc-action-primary-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)))",
              font: "inherit",
              fontSize: "var(--tc-control-font-size, 13px)",
              fontWeight: "var(--tc-control-font-weight, 500)",
              cursor: "pointer",
            }}>
            Get started
          </button>
        </div>
      </GridBackground>
    </div>
  );
}
