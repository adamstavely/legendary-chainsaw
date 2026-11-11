import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { buttonSm, caption, textButton } from "../../demo-kit";

// Lucide inbox (ISC)
const inbox = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BadgePop } = ui;
  const [count, setCount] = useState(4);
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center", fontSize: 13, color: "var(--tc-text-primary)" }}>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        <BadgePop count={count} label="findings to review">
          <button type="button" style={buttonSm} aria-label="Review queue">{inbox}</button>
        </BadgePop>
        <BadgePop count={count} dot label="findings to review">
          <button type="button" style={buttonSm}>Queue</button>
        </BadgePop>
      </div>
      <div style={{ ...caption, display: "flex", gap: 12 }}>
        <button type="button" style={textButton} onClick={() => setCount(count + 1)}>New finding</button>
        <button type="button" style={textButton} onClick={() => setCount(count + 97)}>Bulk import</button>
        <button type="button" style={textButton} onClick={() => setCount(Math.max(0, count - 1))}>Review one</button>
        <button type="button" style={textButton} onClick={() => setCount(0)}>Clear all</button>
      </div>
    </div>
  );
}
