import { useEffect, useState } from "react";
import type * as UI from "../../../../src/elements/react";

const label: React.CSSProperties = {
  fontSize: 12,
  color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const btn: React.CSSProperties = {
  justifySelf: "center",
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

export default function Demo({ ui }: { ui: typeof UI }) {
  const { NumberTicker } = ui;
  const [revenue, setRevenue] = useState(128450);
  const [users, setUsers] = useState(8421);
  const [rate, setRate] = useState(0.0372);
  // The numbers change on their own, so there is a way to stop them (WCAG 2.2.2)
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setRevenue((v) => Math.max(90000, Math.round(v + (Math.random() - 0.35) * 9000)));
      setUsers((v) => Math.max(5000, Math.round(v + (Math.random() - 0.4) * 400)));
      setRate((v) => Math.min(0.09, Math.max(0.01, v + (Math.random() - 0.5) * 0.006)));
    }, 2000);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <div style={{ display: "grid", gap: 24, textAlign: "center" }}>
      <div>
        <div style={label}>Revenue</div>
        <div style={{ fontSize: 48, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          <NumberTicker value={revenue} locale="en-US" format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 40, justifyContent: "center", fontSize: 24, fontWeight: 600 }}>
        <div>
          <div style={label}>Active users</div>
          <NumberTicker value={users} locale="en-US" delay={200} />
        </div>
        <div>
          <div style={label}>Conversion</div>
          <NumberTicker value={rate} locale="en-US" delay={400} format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
        </div>
      </div>
      <button type="button" style={btn} onClick={() => setPlaying((p) => !p)}>
        {playing ? "Pause updates" : "Resume updates"}
      </button>
    </div>
  );
}
