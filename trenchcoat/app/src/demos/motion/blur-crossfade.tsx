import { useEffect, useState } from "react";
import type * as UI from "../../../../src/elements/react";

const muted = "var(--tc-text-muted, light-dark(#646464, #9a9aa1))";

const card: React.CSSProperties = {
  borderRadius: "var(--tc-card-radius, 16px)",
  padding: 16,
  background: "var(--tc-surface-raised, light-dark(#ffffff, #19191b))",
  boxShadow: "var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)))",
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--tc-text-primary, light-dark(#171717, #ededed))",
};

const btn: React.CSSProperties = {
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
};

const STATES = [
  <div key="a" style={{ ...card, width: 220 }}>
    <strong>Saved</strong>
    <div style={{ color: muted }}>All changes synced.</div>
  </div>,
  <div key="b" style={{ ...card, width: 320 }}>
    <strong>Uploading 3 files</strong>
    <div style={{ color: muted }}>brand-guide.pdf, hero.png and notes.md are on their way.</div>
    <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "var(--tc-meter-track, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))" }}>
      <div style={{ width: "62%", height: "100%", borderRadius: 3, background: "var(--tc-meter-fill, #2f68ff)" }} />
    </div>
  </div>,
  <div key="c" style={{ ...card, width: 280 }}>
    <strong>Sync paused</strong>
    <div style={{ color: muted }}>You went offline. We'll pick up where we left off as soon as you're back.</div>
    <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: muted }}>
      <li>2 edits queued</li>
      <li>1 comment waiting</li>
      <li>Last sync 4 min ago</li>
    </ul>
  </div>,
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BlurCrossfade } = ui;
  const [i, setI] = useState(0);
  // The cards change on their own, so there is a way to stop them (WCAG 2.2.2)
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((n) => (n + 1) % STATES.length), 2500);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
      <BlurCrossfade id={i} morph="both">
        {STATES[i]}
      </BlurCrossfade>
      <button type="button" style={btn} onClick={() => setPlaying((p) => !p)}>
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}
