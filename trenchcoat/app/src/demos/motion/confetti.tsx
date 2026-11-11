import { useRef, useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { TcConfetti } from "../../../../src/elements/confetti";
import { button, caption, textButton } from "../../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Confetti } = ui;
  const rain = useRef<TcConfetti>(null);
  const [closed, setClosed] = useState(false);
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center", fontSize: 13 }}>
      <div style={{ display: "grid", gap: 8, justifyItems: "center", padding: "16px 20px", borderRadius: 12, background: "var(--tc-surface-raised)", border: "1px solid var(--tc-border-subtle)", color: "var(--tc-text-primary)" }}>
        <strong>All 1,180 records reconciled</strong>
        <span style={{ color: "var(--tc-text-secondary)" }}>Q3 vendor audit · Northfield Research Institute</span>
        <Confetti trigger="click" announce="Review closed" onConfettiDone={() => setClosed(true)}>
          <button type="button" style={button} onClick={() => setClosed(false)}>
            Close review
          </button>
        </Confetti>
      </div>
      <Confetti ref={rain} origin="viewport-top" count={140} announce="Audit complete" />
      <button type="button" style={textButton} onClick={() => rain.current?.fire()}>
        Celebrate from the top
      </button>
      <span style={caption}>{closed ? "Done – the canvas is gone until the next burst." : "With reduced motion there's no paper: the button holds a brief success tint, and the words are still said."}</span>
    </div>
  );
}
