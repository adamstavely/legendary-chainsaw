import { useEffect, useState } from "react";
import type * as UI from "@components/usage-meter";
import type { UsageDay, UsageItem, UsageLimit, UsagePeriod } from "@components/usage-meter";

const TOTAL = 10000;
const DAYS_IN_PERIOD = 30;
const PERIODS: UsagePeriod[] = [
  { id: "current", label: "This month" },
  { id: "last", label: "Last month" },
];

const SHARES = { Chat: 0.52, Search: 0.23, Image: 0.16, Voice: 0.09 };

function split(total: number): UsageItem[] {
  return Object.entries(SHARES).map(([label, share]) => ({ label, value: Math.round(total * share) }));
}

function dayLabel(offset: number, monthOffset = 0) {
  const d = new Date(2026, 9 + monthOffset, 1 + offset);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** A plausible per-day usage curve */
const perDay = (i: number) => Math.round(260 + Math.sin(i * 0.8) * 90 + (i % 7 >= 5 ? -120 : 40));

const LAST_DAILY: UsageDay[] = Array.from({ length: DAYS_IN_PERIOD }, (_, i) => ({ label: dayLabel(i, -1), value: perDay(i + 3) }));
const LAST_TOTAL = LAST_DAILY.reduce((s, d) => s + (d.value ?? 0), 0);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { UsageMeter } = ui;
  const [period, setPeriod] = useState("current");
  // Days elapsed in the current period – ticks forward so usage climbs through warn → limit, then loops
  const [day, setDay] = useState(14);
  const [toppedUp, setToppedUp] = useState(0);
  // The reset date counts from when the demo started, so it moves only when a day passes
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (period !== "current") return;
    const t = setInterval(() => setDay((d) => (d >= 40 ? 14 : d + 1)), 1100);
    return () => clearInterval(t);
  }, [period]);

  // A fresh cycle starts without the earlier top-ups
  useEffect(() => {
    if (day === 14) setToppedUp(0);
  }, [day]);

  const shownDays = Math.min(day, DAYS_IN_PERIOD);
  // Push usage up harder after day 20 so it reaches the limit
  const currentDaily: UsageDay[] = Array.from({ length: DAYS_IN_PERIOD }, (_, i) => ({
    label: dayLabel(i),
    value: i < shownDays ? perDay(i) + (i >= 18 ? 260 : 0) : null,
  }));
  const currentUsed = Math.min(TOTAL, currentDaily.reduce((s, d) => s + (d.value ?? 0), 0));

  const isCurrent = period === "current";
  const used = isCurrent ? split(Math.max(0, currentUsed - toppedUp)) : split(LAST_TOTAL);
  const limits: UsageLimit[] = isCurrent
    ? [
        { label: "Seats", used: 8, total: 10 },
        { label: "Storage", used: 3.2 + shownDays * 0.05, total: 5, unit: "GB" },
        { label: "Projects", used: 14, total: null },
      ]
    : [
        { label: "Seats", used: 7, total: 10 },
        { label: "Storage", used: 2.9, total: 5, unit: "GB" },
        { label: "Projects", used: 11, total: null },
      ];

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <UsageMeter
        title="Usage"
        plan="Pro plan"
        unit="credits"
        total={TOTAL}
        used={used}
        limits={limits}
        periods={PERIODS}
        period={period}
        onPeriodChange={setPeriod}
        daily={isCurrent ? currentDaily : LAST_DAILY}
        resetAt={startedAt + (DAYS_IN_PERIOD - shownDays + 1) * 864e5}
        onUpgrade={(state) => {
          // Topping up near/at the limit frees some credits; otherwise just restart the cycle
          if (state === "ok") setDay(14);
          else setToppedUp((t) => t + 2500);
        }}
      />
    </div>
  );
}
