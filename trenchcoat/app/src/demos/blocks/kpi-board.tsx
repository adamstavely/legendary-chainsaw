import type * as UI from "@blocks/kpi-board";

const END = new Date(2026, 9, 24); // Oct 24, 2026

function dayLabels(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(END.getFullYear(), END.getMonth(), END.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  });
}

/** A deterministic, gently rising series with weekly dips */
function series(n: number, base: number, amp: number, growth: number, phase: number) {
  return Array.from({ length: n }, (_, i) => {
    const weekend = [5, 6].includes(i % 7) ? 0.82 : 1;
    return Math.max(0, Math.round((base + i * growth + Math.sin(i * 0.8 + phase) * amp + Math.cos(i * 0.31 + phase * 2) * amp * 0.5) * weekend));
  });
}

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

function build(n: number, scale: number): UI.KpiBoardData {
  const labels = dayLabels(n);
  const revenue = series(n, 4200 * scale, 600 * scale, 40 * scale, 0.3);
  const orders = series(n, 120, 22, 1.2, 1.1);
  const refunds = series(n, 180 * scale, 60 * scale, -1, 2.2);
  const current = series(n, 4200 * scale, 600 * scale, 40 * scale, 0.3);
  const previous = series(n, 3800 * scale, 520 * scale, 25 * scale, 1.7);
  const pro = { current: current.map((v) => Math.round(v * 0.58)), previous: previous.map((v) => Math.round(v * 0.55)) };
  const team = { current: current.map((v) => Math.round(v * 0.42)), previous: previous.map((v) => Math.round(v * 0.45)) };
  const sales = series(n, 38, 9, 0.4, 0.9);
  return {
    stats: [
      { id: "revenue", label: "Revenue", kind: "money", labels, values: revenue, previous: Math.round(sum(revenue) * 0.91) },
      { id: "orders", label: "Orders", kind: "count", labels, values: orders, previous: Math.round(sum(orders) * 0.96) },
      { id: "refunds", label: "Refunds", kind: "money", labels, values: refunds, previous: Math.round(sum(refunds) * 1.12), lowerIsBetter: true },
    ],
    overview: { title: "Gross volume", labels, current, previous, segments: { all: { current, previous }, pro, team } },
    focus: {
      title: "Pro plan",
      note: "Best seller this period",
      metric: "Product sales rate",
      unit: "items",
      labels,
      values: sales,
      previous: Math.round(sum(sales) * 0.88),
    },
  };
}

const DATA: Record<string, UI.KpiBoardData> = {
  "7d": build(7, 1),
  "30d": build(30, 1),
  "90d": build(90, 1.1),
};

const money = (v: number) =>
  v >= 100000 ? `$${(v / 1000).toFixed(0)}k` : v >= 10000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v).toLocaleString("en-US")}`;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { KpiBoard } = ui;
  return (
    <KpiBoard
      title="Overview"
      data={DATA}
      ranges={[
        { id: "7d", label: "Last 7 days" },
        { id: "30d", label: "Last 30 days" },
        { id: "90d", label: "Last 90 days" },
      ]}
      defaultRange="30d"
      segments={[
        { id: "all", label: "All plans" },
        { id: "pro", label: "Pro" },
        { id: "team", label: "Team" },
      ]}
      defaultSegment="all"
      compareLabel="vs. last period"
      currentLabel="This period"
      previousLabel="Last period"
      formatMoney={money}
      setup={{ label: "Set up", onClick: () => {} }}
      action={{ label: "View product report", onClick: () => {} }}
    />
  );
}
