import { useState } from "react";
import type * as UI from "@motion/text-reveal";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TextReveal } = ui;
  const [run, setRun] = useState(0);
  return (
    <div style={{ maxWidth: 460, textAlign: "center" }}>
      <div key={run}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
          <TextReveal as="h2" by="char" stagger={30} text="Meet your new teammate." />
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
          <TextReveal
            delay={700}
            text="It reads the brief, drafts the plan and checks in before anything ships – so you stay in control while the busywork disappears."
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        style={{
          marginTop: 24,
          height: "var(--tc-control-h-sm, 28px)",
          padding: "0 var(--tc-control-px-md, 12px)",
          borderRadius: "var(--tc-control-radius-sm, 8px)",
          border: 0,
          background: "var(--tc-action-secondary-bg, light-dark(#ffffff, #232326))",
          color: "var(--tc-action-secondary-fg, light-dark(#171717, #ededed))",
          boxShadow: "var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)))",
          font: "inherit",
          fontSize: "var(--tc-control-font-size, 13px)",
          fontWeight: "var(--tc-control-font-weight, 500)",
          cursor: "pointer",
        }}
      >
        Replay
      </button>
    </div>
  );
}
