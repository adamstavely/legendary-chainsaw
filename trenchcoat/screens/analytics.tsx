"use client";

/*
 * Analytics – a revenue dashboard, in a single file.
 * Four key figures with mini bars, revenue by channel next to a breakdown with sparklines,
 * then top products and two week-over-week charts filling the rest of the panel.
 * The period is `period` / `defaultPeriod` / `onPeriodChange`; className, other DOM props and `ref` go to the App
 * Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; KPI Chart and Button from Trenchcoat components; icons
 * from lucide-react 1.55.0.
 */

import { useCallback, useMemo, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import {
  CalendarIcon,
  ChartColumnBigIcon,
  DownloadIcon,
  HouseIcon,
  ReceiptTextIcon,
  RepeatIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiChart, type KpiSeries } from "@/components/ui/kpi-chart";
import { AppShell, Icon, MenuButton, useToast, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Revenue", icon: ChartColumnBigIcon },
  { label: "Invoices", icon: ReceiptTextIcon, count: 12 },
  { label: "Payouts", icon: WalletIcon },
  { label: "Customers", icon: UsersIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Channels",
    items: [
      { label: "Online store", icon: StoreIcon },
      { label: "Marketplace", icon: ShoppingBagIcon },
      { label: "Wholesale", icon: WalletIcon },
      { label: "Subscriptions", icon: RepeatIcon },
    ],
  },
];

const labels = ["Mar 3", "Mar 4", "Mar 5", "Mar 6", "Mar 7", "Mar 8", "Mar 9"];
const tooltipLabels = ["Mon, Mar 3", "Tue, Mar 4", "Wed, Mar 5", "Thu, Mar 6", "Fri, Mar 7", "Sat, Mar 8", "Sun, Mar 9"];
const series: KpiSeries[] = [
  { label: "Organic", color: "#2f6bff", values: [4200, 4700, 3900, 4600, 5400, 5100, 5900] },
  { label: "Paid ads", color: "#ec4899", values: [3600, 3300, 4400, 4800, 4000, 4500, 4200] },
  { label: "Referral", color: "#8b5cf6", values: [1800, 2300, 2000, 1500, 2400, 2200, 2700] },
  { label: "Email", color: "#14b8a6", values: [1200, 1100, 1700, 2100, 1600, 1300, 1500] },
];
const money = (n: number) => (n >= 1000 ? `$${+(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`);

/** This week against last week – for the two small charts */
const compare = (a: number[], b: number[]): KpiSeries[] => [
  { label: "This week", color: "#2f6bff", values: a },
  { label: "Last week", color: "#a5c0ff", values: b },
];
const sessions = compare([1820, 2140, 1960, 2480, 2710, 2390, 2950], [1650, 1720, 1880, 1790, 2010, 1940, 2100]);
const orderValue = compare([118, 124, 121, 132, 129, 137, 141], [112, 115, 119, 117, 121, 120, 124]);

const stats: { label: string; value: string; delta: string; bars: number[] }[] = [
  { label: "Gross revenue", value: "$96,412", delta: "+12.5%", bars: [5, 7, 6, 8, 7, 9, 10] },
  { label: "Active customers", value: "2,847", delta: "+8.2%", bars: [6, 6, 7, 7, 8, 8, 9] },
  { label: "Conversion", value: "3.24%", delta: "+0.4%", bars: [7, 5, 6, 8, 6, 7, 8] },
  { label: "Refund rate", value: "1.8%", delta: "-0.3%", bars: [9, 8, 8, 6, 7, 5, 4] },
];

const breakdown: { label: string; value: string; spark: number[]; tone?: "up" | "down" | "flat" }[] = [
  { label: "Gross sales", value: "$104,210", spark: [3, 5, 4, 6, 5, 7, 8] },
  { label: "Discounts", value: "−$4,180", spark: [4, 3, 5, 4, 3, 4, 3], tone: "down" },
  { label: "Refunds", value: "−$1,734", spark: [5, 4, 4, 3, 3, 2, 2], tone: "down" },
  { label: "Shipping", value: "$2,940", spark: [2, 3, 3, 4, 3, 4, 5] },
  { label: "Taxes", value: "$8,316", spark: [4, 4, 4, 4, 4, 4, 4], tone: "flat" },
  { label: "Net revenue", value: "$96,412", spark: [3, 4, 4, 5, 6, 6, 8] },
];

const products = [
  { label: "Annual plan", value: "$38,400", share: 100 },
  { label: "Team seats", value: "$24,150", share: 63 },
  { label: "Monthly plan", value: "$18,920", share: 49 },
  { label: "Add-ons", value: "$9,640", share: 25 },
];

/** Key figures for the period: money and counts grow with it, rates stay rates ("" for a figure it doesn't know) */
function statValue(label: string, f: number) {
  if (label === "Gross revenue") return usd(96412 * f);
  if (label === "Active customers") return Math.round(2847 * Math.sqrt(f)).toLocaleString("en-US");
  if (label === "Conversion") return `${(3.24 + (f - 1) * 0.012).toFixed(2)}%`;
  if (label === "Refund rate") return `${(1.8 + (f - 1) * 0.008).toFixed(1)}%`;
  return "";
}

/** Small trend line for the breakdown list – values are spread over its height */
function Spark({ values, tone = "up" }: { values: number[]; tone?: "up" | "down" | "flat" }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 40},${tone === "flat" ? 7 : 13 - ((v - min) / (max - min || 1)) * 12}`)
    .join(" ");
  return (
    <svg className="ui-as-rev__spark" data-tone={tone} viewBox="0 0 40 14" aria-hidden="true">
      <polyline points={pts} />
    </svg>
  );
}

export type Period = "7d" | "30d" | "90d";
const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];
/** Axis labels and how much bigger the totals are for each period – sample data */
const span: Record<Period, { labels: string[]; factor: number }> = {
  "7d": { labels, factor: 1 },
  "30d": { labels: ["Feb 9", "Feb 14", "Feb 19", "Feb 24", "Mar 1", "Mar 5", "Mar 9"], factor: 4.3 },
  "90d": { labels: ["Dec 10", "Dec 25", "Jan 9", "Jan 24", "Feb 8", "Feb 23", "Mar 9"], factor: 12.9 },
};
/** Scales a series to the period, with a little wobble so longer periods don't look like copies */
const scaleSeries = (list: KpiSeries[], period: Period): KpiSeries[] =>
  list.map((s, k) => ({
    ...s,
    values: s.values.map((v, i) => Math.round(v * span[period].factor * (period === "7d" ? 1 : 1 + 0.09 * Math.sin(i * 1.7 + k)))),
  }));
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/**
 * State that a parent may control: `value` defined → controlled (shown as given, changes only reported through
 * `onChange`); undefined → kept here, starting at `defaultValue`, and still reported. Copied from Trenchcoat's
 * src/internal, so this file stays self-contained
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

type AnalyticsScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref"> & {
  /** The period the figures and charts show. Controlled when defined – pair it with `onPeriodChange` */
  period?: Period;
  /** Period shown first when `period` isn't controlled */
  defaultPeriod?: Period;
  onPeriodChange?: (period: Period) => void;
};
export type AnalyticsScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AnalyticsScreenOwnProps> & AnalyticsScreenOwnProps;

export function AnalyticsScreen({ period: periodProp, defaultPeriod = "7d", onPeriodChange, ...props }: AnalyticsScreenProps) {
  const [period, setPeriod] = useControllable(periodProp, defaultPeriod, onPeriodChange, "period");
  const [toast, showToast] = useToast();
  const f = span[period].factor;
  const axis = span[period].labels;
  const tips = period === "7d" ? tooltipLabels : axis;
  // The charts get the same series objects until the period changes
  const channelSeries = useMemo(() => scaleSeries(series, period), [period]);
  const sessionSeries = useMemo(() => scaleSeries(sessions, period), [period]);
  const k = (n: number) => usd(n * f);

  return (
    <AppShell active="Revenue" nav={nav} groups={groups} {...props}>
      <style href="ui-screen-analytics" precedence="default">
        {css}
      </style>
      <div className="ui-as-rev">
        <header className="ui-as-rev__head">
          <h1>
            <Icon icon={ChartColumnBigIcon} size={17} />
            Revenue
          </h1>
          <div className="ui-as-rev__actions">
            <MenuButton value={period} options={periods} onChange={setPeriod} icon={CalendarIcon} className="ui-as-rev__period" />
            <Button variant="secondary" size="sm" icon={<Icon icon={DownloadIcon} size={14} />}>
              Export
            </Button>
            <Button size="sm" onClick={() => showToast("Saved to Reports")}>
              Save as report
            </Button>
          </div>
        </header>

        <div className="ui-as-rev__content" key={period}>
          <div className="ui-as-rev__stats">
            {stats.map((s, i) => (
              <div key={s.label} className="ui-as-rev__card ui-as-rev__stat ui-as-rise" style={{ "--i": i } as CSSProperties}>
                <span className="ui-as-rev__cap">{s.label}</span>
                <div className="ui-as-rev__stat-row">
                  <strong>
                    {statValue(s.label, f) || s.value}
                    <em>{s.delta}</em>
                  </strong>
                  <span className="ui-as-rev__minibars" aria-hidden="true">
                    {s.bars.map((b, i) => (
                      <i key={i} style={{ height: `${b * 10}%` }} />
                    ))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="ui-as-rev__row ui-as-rev__row--main">
            <KpiChart
              className="ui-as-rev__chart ui-as-rev__chart--tall"
              fill
              title="Revenue by channel"
              value={money(96400 * f)}
              delta={Math.round(7900 * f)}
              format={money}
              labels={axis}
              tooltipLabels={tips}
              series={channelSeries}
              footer="Top 4 channels"
            />
            <div className="ui-as-rev__card ui-as-rev__breakdown">
              <span className="ui-as-rev__cap">Revenue breakdown</span>
              <ul>
                {breakdown.map((r) => (
                  <li key={r.label}>
                    <span>{r.label}</span>
                    <b>{(r.value.startsWith("−") ? "−" : "") + k(+r.value.replace(/[^\d]/g, ""))}</b>
                    <Spark values={r.spark} tone={r.tone} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ui-as-rev__row ui-as-rev__row--3">
            <div className="ui-as-rev__card ui-as-rev__products">
              <span className="ui-as-rev__cap">Top products</span>
              {products.map((p) => (
                <div key={p.label} className="ui-as-rev__product">
                  <span>
                    {p.label}
                    <b>{k(+p.value.replace(/[^\d]/g, ""))}</b>
                  </span>
                  <i style={{ width: `${p.share}%` }} />
                </div>
              ))}
            </div>
            <KpiChart
              className="ui-as-rev__chart"
              fill
              title="Sessions over time"
              value={`${+(16.4 * f).toFixed(1)}k`}
              delta={Math.round(2340 * f)}
              labels={axis}
              tooltipLabels={tips}
              series={sessionSeries}
              footer={period === "7d" ? "This week vs. last week" : "This period vs. the one before"}
            />
            <KpiChart
              className="ui-as-rev__chart"
              fill
              title="Average order value"
              value="$141"
              delta={17}
              format={(n) => `$${Math.round(n)}`}
              labels={axis}
              tooltipLabels={tips}
              series={orderValue}
              footer={period === "7d" ? "This week vs. last week" : "This period vs. the one before"}
            />
          </div>
        </div>
      </div>
      {toast}
    </AppShell>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Revenue dashboard: a header, then rows of white cards on the panel */
.ui-as-rev { display: flex; flex-direction: column; min-height: 100%; }
.ui-as-rev__head { display: flex; flex: none; align-items: center; justify-content: space-between; height: 60px; padding: 0 16px 0 24px; }
.ui-as-rev__head h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-rev__actions { display: flex; align-items: center; gap: 6px; }

.ui-as-rev__content { display: flex; flex: 1; flex-direction: column; gap: 12px; padding: 0 16px 16px; }
.ui-as-rev__card {
  padding: 14px 16px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
/* Card titles with a dotted underline – a hint that there is an explanation */
.ui-as-rev__cap {
  align-self: flex-start;
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  text-decoration: underline dotted var(--tc-icon-muted, light-dark(#858585, #7c7c82));
  text-underline-offset: 3px;
}

.ui-as-rev__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ui-as-rev__stat { display: flex; flex-direction: column; gap: 14px; }
.ui-as-rev__stat-row { display: flex; align-items: flex-end; justify-content: space-between; }
.ui-as-rev__stat strong {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 22px;
  font-weight: var(--tc-font-weight-medium, 500);
  letter-spacing: -0.02em;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-variant-numeric: tabular-nums;
}
.ui-as-rev__stat em { font-size: var(--tc-font-size-sm, 12px); font-style: normal; font-weight: var(--tc-font-weight-medium, 500); letter-spacing: 0; color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-as-rev__minibars { display: flex; align-items: flex-end; gap: 3px; height: 26px; }
.ui-as-rev__minibars i { width: 5px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-as-rev__minibars i:last-child { background: var(--tc-chart-neutral, light-dark(#a3a3a3, #5c5c63)); }

.ui-as-rev__row { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 12px; align-items: stretch; }
/* The revenue chart takes the spare height; the three cards below keep their own */
.ui-as-rev__row--main { flex: 1; }
.ui-as-rev__row--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.ui-as-rev__breakdown { display: flex; flex-direction: column; }
.ui-as-rev__breakdown ul { display: flex; flex-direction: column; margin: 12px -6px 0; padding: 0; list-style: none; }
.ui-as-rev__breakdown li {
  display: grid;
  grid-template-columns: 1fr auto 40px;
  align-items: center;
  gap: 12px;
  height: 38px;
  padding: 0 8px;
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-md-plus, 13.5px);
}
.ui-as-rev__breakdown li:nth-child(even) { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-as-rev__breakdown li span { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-rev__breakdown li b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }
.ui-as-rev__spark { width: 40px; height: 14px; overflow: visible; }
.ui-as-rev__spark polyline { fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-as-rev__spark[data-tone="up"] polyline { stroke: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)); }
.ui-as-rev__spark[data-tone="down"] polyline { stroke: var(--tc-status-danger-solid, light-dark(#e5484d, #ff6369)); }
.ui-as-rev__spark[data-tone="flat"] polyline { stroke: var(--tc-chart-neutral, light-dark(#a3a3a3, #5c5c63)); }

.ui-as-rev__products { display: flex; flex-direction: column; gap: 14px; }
.ui-as-rev__product { display: flex; flex-direction: column; gap: 7px; }
.ui-as-rev__product span { display: flex; justify-content: space-between; font-size: var(--tc-font-size-md-plus, 13.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-rev__product b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }
.ui-as-rev__product i { display: block; height: 6px; border-radius: var(--tc-meter-radius, 999px); background: var(--tc-chart-1, light-dark(#2f68ff, #6b95ff)); }

/* Room for the sidebar icon while the sidebar is collapsed */
.ui-as-rev__head { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-as-rev__head { padding-left: 52px; }

/* Narrow panels: stat cards 4 → 2, the rows stack */
@container ui-as-main (max-width: 900px) {
  .ui-as-rev__row { grid-template-columns: minmax(0, 1fr); }
  .ui-as-rev__row--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-as-rev__row--3 > .ui-as-rev__products { grid-column: 1 / -1; }
}
@container ui-as-main (max-width: 820px) {
  .ui-as-rev__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container ui-as-main (max-width: 560px) {
  .ui-as-rev__row--3 { grid-template-columns: minmax(0, 1fr); }
  .ui-as-rev__stats { gap: 8px; }
  .ui-as-rev__stat { gap: 10px; padding: 12px; }
  .ui-as-rev__stat strong { flex-wrap: wrap; gap: 0 6px; font-size: 19px; }
  .ui-as-rev__minibars { display: none; }
}
@container ui-as (max-width: 900px) {
  .ui-as-rev__head { padding-left: 52px; }
}
@container ui-as (max-width: 600px) {
  /* Title next to the sidebar icon, the actions on a row below */
  .ui-as-rev__head { flex-wrap: wrap; row-gap: 10px; height: auto; padding: 14px 8px 12px 52px; }
  .ui-as-rev__actions { flex-wrap: wrap; gap: 6px 4px; width: calc(100% + 44px); margin-left: -44px; }
  .ui-as-rev__actions > :last-child { margin-left: auto; }
  .ui-as-rev__actions button { white-space: nowrap; }
  .ui-as-rev__content { gap: 8px; padding: 0 8px 8px; }
}
`;
