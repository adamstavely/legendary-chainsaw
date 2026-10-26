import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { MetricChange } from "../../../src/elements/react";

const PERIODS: { period: string; changes: MetricChange[] }[] = [
  {
    period: "This week",
    changes: [
      { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" },
      { label: "Conversion rate", change: "Up 0.4 pts to 3.8%", tone: "good" },
      { label: "Churned accounts", change: "Up 12 to 41", tone: "bad", direction: "up" },
      { label: "Avg. response time", change: "Down 80 ms to 212 ms", tone: "good", direction: "down" },
      { label: "Open tickets", change: "Unchanged at 57", tone: "neutral" },
    ],
  },
  {
    period: "This month",
    changes: [
      { label: "Active users", change: "Up 14.3% to 71.9K", tone: "good" },
      { label: "Revenue", change: "Down 2.2% to $412K", tone: "bad" },
      { label: "Trial signups", change: "Up 9.8% to 3,104", tone: "good" },
      { label: "Error rate", change: "Up 0.3 pts to 1.1%", tone: "bad", direction: "up" },
      { label: "NPS", change: "Holding at 46", tone: "neutral" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChangeSummary } = ui;
  const [idx, setIdx] = useState(0);

  // Rotate between periods so the rows re-animate
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PERIODS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const p = PERIODS[idx];
  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <ChangeSummary key={idx} period={p.period} changes={p.changes} />
    </div>
  );
}
