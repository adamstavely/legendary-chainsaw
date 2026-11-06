import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BreakpointOverlayBreakpoint } from "../../../src/elements/react";
import { caption, surface } from "../demo-kit";

/* A resizable card standing in for a page, with the overlay following its width – drag its corner across the
   breakpoints. Floating, it follows the window from a corner badge (⌥⇧O); here it's a card in the page, and the
   hotkey is off so the gallery's own keys keep working. */

const BREAKPOINTS: BreakpointOverlayBreakpoint[] = [
  { id: "compact", label: "Compact", max: 479 },
  { id: "medium", label: "Medium", min: 480, max: 719 },
  { id: "wide", label: "Wide", min: 720 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BreakpointOverlay } = ui;
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  const [now, setNow] = useState("");
  return (
    <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
      <div
        ref={setFrame}
        style={{ ...surface, flex: "none", width: 520, minWidth: 240, maxWidth: "100%", padding: 16, display: "grid", gap: 10, resize: "horizontal", overflow: "auto" }}
      >
        <strong style={{ fontSize: 15, color: "var(--tc-text-primary)" }}>Field station reports</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {["North ridge", "Lake shore", "Valley floor"].map((s) => (
            <div key={s} style={{ padding: 10, borderRadius: 8, background: "var(--tc-fill-subtle)", fontSize: 13, color: "var(--tc-text-secondary)" }}>
              {s}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--tc-text-muted)" }}>Drag the corner to resize ↘</span>
      </div>
      <BreakpointOverlay floating={false} hotkey={false} target={frame} breakpoints={BREAKPOINTS} onBreakpointChange={(d) => setNow(d.breakpoint?.label ?? "Base")} style={{ flex: "0 1 340px" }} />
      <div style={{ ...caption, flexBasis: "100%", textAlign: "center" }}>{now ? `Now at ${now}.` : "Resize the card to cross a breakpoint."}</div>
    </div>
  );
}
