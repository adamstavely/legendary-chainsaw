import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BreakdownItem, BreakdownPeriod } from "../../../src/elements/react";

const PERIODS: BreakdownPeriod[] = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
];

const DATA: Record<string, { items: BreakdownItem[]; delta: number }> = {
  "7d": {
    delta: 12.4,
    items: [
      { id: "organic", label: "Organic search", value: 18420 },
      { id: "paid", label: "Paid ads", value: 9310 },
      { id: "referral", label: "Referrals", value: 6120 },
      { id: "social", label: "Social", value: 4870 },
      { id: "email", label: "Email", value: 2140 },
    ],
  },
  "30d": {
    delta: -3.1,
    items: [
      { id: "organic", label: "Organic search", value: 64200 },
      { id: "paid", label: "Paid ads", value: 48900 },
      { id: "referral", label: "Referrals", value: 21800 },
      { id: "social", label: "Social", value: 25300 },
      { id: "email", label: "Email", value: 9800 },
    ],
  },
  "90d": {
    delta: 21.7,
    items: [
      { id: "organic", label: "Organic search", value: 182500 },
      { id: "paid", label: "Paid ads", value: 121400 },
      { id: "referral", label: "Referrals", value: 88200 },
      { id: "social", label: "Social", value: 61900 },
      { id: "email", label: "Email", value: 30400 },
    ],
  },
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CompactBreakdown } = ui;
  const [period, setPeriod] = useState("7d");
  const [auto, setAuto] = useState(true);

  // Cycle periods until the user picks one themselves
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setPeriod((p) => PERIODS[(PERIODS.findIndex((x) => x.id === p) + 1) % PERIODS.length].id);
    }, 3500);
    return () => clearInterval(t);
  }, [auto]);

  const d = DATA[period];
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <CompactBreakdown
        title="Revenue by channel"
        items={d.items}
        delta={d.delta}
        periods={PERIODS}
        period={period}
        onPeriodChange={(id) => {
          setAuto(false);
          setPeriod(id);
        }}
        format={money}
        totalLabel="Total revenue"
      />
    </div>
  );
}
