import { useMemo } from "react";
import type * as UI from "@components/breakdown-chart";
import type { BreakdownRecord, Dimension, Measure } from "@components/breakdown-chart";

const STATUSES = ["backlog", "todo", "progress", "review", "done", "canceled"] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  backlog: "Backlog",
  todo: "Todo",
  progress: "In progress",
  review: "In review",
  done: "Done",
  canceled: "Canceled",
};
const ASSIGNEES = ["Maya", "Jonas", "Priya", "Leo", "Aiko"];
const PRIORITIES = ["Urgent", "High", "Medium", "Low"];
const TEAMS = ["Web", "Mobile", "Platform"];

/** Deterministic pseudo-random so the chart looks the same every render */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function makeRecords(): BreakdownRecord[] {
  const rand = rng(42);
  const weights = [10, 14, 12, 7, 22, 4];
  const total = weights.reduce((a, b) => a + b, 0);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const records: BreakdownRecord[] = [];
  for (let i = 0; i < 140; i++) {
    let r = rand() * total;
    let idx = 0;
    while (r > weights[idx]) r -= weights[idx++];
    records.push({
      status: STATUS_LABELS[STATUSES[idx]],
      assignee: pick(ASSIGNEES),
      priority: pick(PRIORITIES),
      team: pick(TEAMS),
      points: [1, 2, 3, 5, 8][Math.floor(rand() * 5)],
      hours: Math.round(2 + rand() * 14),
    });
  }
  return records;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BreakdownChart, StatusIcon } = ui;
  const records = useMemo(makeRecords, []);

  // Every colour is at least 3:1 against the light and the dark surface (WCAG 1.4.11)
  const statusColors: Record<string, string> = {
    Backlog: "#8c8c8c",
    Todo: "#737373",
    "In progress": "#c2700a",
    "In review": "#8b5cf6",
    Done: "#2f6bff",
    Canceled: "#94877a",
  };

  const dimensions: Dimension[] = [
    {
      key: "status",
      label: "Status",
      values: STATUSES.map((s) => STATUS_LABELS[s]),
      colors: statusColors,
      icons: Object.fromEntries(
        STATUSES.map((s) => [STATUS_LABELS[s], <StatusIcon key={s} kind={s} color={statusColors[STATUS_LABELS[s]]} />]),
      ),
    },
    {
      key: "priority",
      label: "Priority",
      values: PRIORITIES,
      colors: { Urgent: "#dc2626", High: "#d9600b", Medium: "#2f6bff", Low: "#8c8c8c" },
    },
    { key: "assignee", label: "Assignee", values: ASSIGNEES },
    { key: "team", label: "Team", values: TEAMS },
  ];

  const measures: Measure[] = [
    { key: "count", label: "Issue count", unit: "issues" },
    { key: "points", label: "Story points", unit: "points", field: "points" },
    { key: "hours", label: "Estimated hours", unit: "hours", field: "hours" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <BreakdownChart
        title="Sprint 24 workload"
        records={records}
        dimensions={dimensions}
        measures={measures}
        defaultSlice="status"
        defaultSegment="priority"
      />
    </div>
  );
}
