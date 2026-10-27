import type * as UI from "@blocks/oversight-home";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SERVICES: UI.OversightService[] = [
  { id: "policy", name: "Policy engine", state: "normal", availability: "99.98%", lastEvent: "Health check passed · 4m ago" },
  { id: "review", name: "Review queue", state: "normal", availability: "99.95%", lastEvent: "Queue drained · 12m ago" },
  { id: "verify", name: "Claim verification", state: "limited", availability: "97.40%", lastEvent: "Slow responses from one source · 18m ago" },
  { id: "batch", name: "Batch jobs", state: "limited", availability: "98.10%", lastEvent: "Backlog of 42 jobs · 25m ago" },
  { id: "lineage", name: "Lineage graph", state: "normal", availability: "99.99%", lastEvent: "Graph updated · 1h ago" },
  { id: "adversarial", name: "Adversarial testing", state: "down", availability: "–", lastEvent: "Not deployed in this region" },
  { id: "feedback", name: "Outcome feedback", state: "unknown", lastEvent: "No events this week" },
];

const ROLES: UI.OversightRole[] = [
  {
    id: "reviewer",
    label: "Reviewer",
    eyebrow: "Tuesday · 27 October · Review",
    headline: "5 decisions are waiting for you.",
    summary: "Your review load, the claims you verify, and how the services you rely on are doing.",
    focus: { label: "5 decisions awaiting review", detail: "2 are past their due time · oldest 3h", action: "Start reviewing" },
    kpis: [
      { id: "pending", label: "Awaiting review", value: "5", delta: -28, lowerIsBetter: true, labels: DAYS, values: [9, 8, 11, 7, 6, 4, 5], previous: [7, 9, 9, 10, 8, 7, 7], footer: "2 overdue" },
      { id: "verify", label: "Claims to verify", value: "12", delta: 9, lowerIsBetter: true, labels: DAYS, values: [8, 10, 9, 13, 11, 12, 12], previous: [9, 9, 10, 10, 11, 10, 11] },
      { id: "time", label: "Median review time", value: "14m", delta: -12, lowerIsBetter: true, labels: DAYS, values: [18, 17, 16, 15, 15, 14, 14], previous: [19, 18, 18, 17, 17, 16, 16], footer: "Target 15m" },
    ],
    services: SERVICES.filter((s) => ["review", "verify", "policy"].includes(s.id)),
    servicesNote: "Availability for your team's workspaces – provider details aren't shown at this level.",
  },
  {
    id: "lead",
    label: "Team lead",
    eyebrow: "Tuesday · 27 October · Team",
    headline: "2 runs are paused for approval.",
    summary: "Your team's active runs, its review load and the service posture behind them.",
    focus: { label: "2 runs paused for approval", detail: "Both wait on an outside write", action: "Open runs" },
    kpis: [
      { id: "runs", label: "Active runs", value: "38", delta: 6, labels: DAYS, values: [31, 34, 36, 33, 37, 35, 38], previous: [30, 31, 33, 34, 32, 34, 35] },
      { id: "paused", label: "Paused runs", value: "2", delta: -50, lowerIsBetter: true, labels: DAYS, values: [5, 4, 4, 3, 3, 2, 2], previous: [3, 4, 5, 4, 4, 4, 4] },
      { id: "approvals", label: "Approvals pending", value: "5", delta: 25, lowerIsBetter: true, labels: DAYS, values: [3, 4, 4, 6, 5, 4, 5], previous: [4, 3, 4, 4, 4, 5, 4] },
      { id: "corrections", label: "Corrections pending", value: "19", delta: 12, lowerIsBetter: true, labels: DAYS, values: [14, 15, 15, 17, 18, 18, 19], previous: [13, 14, 15, 15, 16, 16, 17] },
    ],
    services: SERVICES.filter((s) => s.id !== "adversarial"),
  },
  {
    id: "platform",
    label: "Platform",
    eyebrow: "Tuesday · 27 October · Platform",
    headline: "1 service is down, 2 are limited.",
    summary: "Every governance service's state, availability and last event.",
    focus: { label: "Adversarial testing is down", detail: "Not deployed in this region · planned for v3", action: "View service" },
    kpis: [
      { id: "avail", label: "Availability", value: "99.2%", delta: -0.4, labels: DAYS, values: [99.6, 99.7, 99.5, 99.4, 99.3, 99.2, 99.2], previous: [99.5, 99.6, 99.6, 99.7, 99.6, 99.6, 99.6] },
      { id: "incidents", label: "Open incidents", value: "3", delta: 50, lowerIsBetter: true, labels: DAYS, values: [1, 1, 2, 2, 2, 3, 3], previous: [2, 2, 1, 1, 2, 2, 2] },
      { id: "latency", label: "p95 latency", value: "820ms", delta: 14, lowerIsBetter: true, labels: DAYS, values: [690, 700, 720, 760, 780, 800, 820], previous: [680, 690, 700, 700, 710, 720, 720] },
    ],
    services: SERVICES,
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { OversightHome } = ui;
  return <OversightHome roles={ROLES} defaultRole="lead" onOpenFocus={() => {}} />;
}
