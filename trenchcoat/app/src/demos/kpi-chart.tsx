import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";

const DAYS = 14;
const start = new Date(2026, 2, 2); // Mon, Mar 2
const dates = Array.from({ length: DAYS }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
const labels = dates.map((d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
const tooltipLabels = dates.map((d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));

const percent = (n: number) => `${n.toFixed(1)}%`;
const money = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`);

function wave(base: number, amp: number, phase: number, growth: number) {
  return Array.from({ length: DAYS }, (_, i) => {
    const weekend = [5, 6].includes(i % 7) ? 0.78 : 1;
    return Math.round((base + i * growth + Math.sin(i * 0.9 + phase) * amp) * weekend);
  });
}

const BASE = {
  subscriptions: wave(4200, 520, 0.2, 90),
  services: wave(2300, 380, 1.4, 35),
  oneOff: wave(900, 260, 2.6, 12),
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { KpiChart } = ui;
  // A slow "live" drift: the last day keeps ticking up during the day
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % 20), 1500);
    return () => clearInterval(t);
  }, []);

  const series = useMemo(() => {
    const bump = (arr: number[], per: number) => arr.map((v, i) => (i === DAYS - 1 ? Math.round(v * 0.55 + tick * per) : v));
    return [
      // No colours given: the lines take the look's --tc-chart-1…3 tokens, in both themes
      { label: "Subscriptions", values: bump(BASE.subscriptions, 130) },
      { label: "Services", values: bump(BASE.services, 70) },
      { label: "One-off", values: bump(BASE.oneOff, 25) },
    ];
  }, [tick]);

  const total = series.reduce((s, x) => s + x.values.reduce((a, b) => a + b, 0), 0);

  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <KpiChart
        title="Revenue"
        value={money(total)}
        delta={8.6}
        labels={labels}
        tooltipLabels={tooltipLabels}
        series={series}
        format={money}
        deltaFormat={percent}
        footer="Last 14 days · updated live"
        defaultIndex={DAYS - 1}
      />
    </div>
  );
}
