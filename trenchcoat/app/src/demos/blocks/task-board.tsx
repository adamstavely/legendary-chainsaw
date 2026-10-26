import type * as UI from "@blocks/task-board";

/** Small 14px status glyphs in the style of a sprint tracker */
const ring = (color: string, fill: number) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={fill === 0 ? "2 2" : undefined} />
    {fill > 0 && fill < 1 && <path d={`M7 7 V3 A4 4 0 ${fill > 0.5 ? 1 : 0} 1 ${7 + 4 * Math.sin(fill * 2 * Math.PI)} ${7 - 4 * Math.cos(fill * 2 * Math.PI)} Z`} fill={color} />}
    {fill === 1 && (
      <>
        <circle cx="7" cy="7" r="5.5" fill={color} />
        <path d="m4.5 7 1.8 1.8L9.6 5.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </svg>
);

const STATUSES: UI.TaskStatus[] = [
  { id: "backlog", label: "Backlog", icon: ring("#9ca3af", 0) },
  { id: "todo", label: "Todo", icon: ring("#6b7280", 0.001) },
  { id: "progress", label: "In progress", icon: ring("#f59e0b", 0.5) },
  { id: "review", label: "In review", icon: ring("#2f6bff", 0.75) },
  { id: "done", label: "Done", icon: ring("#10b981", 1) },
];

const LABELS: UI.TaskLabel[] = [
  { id: "bug", label: "Bug", color: "#ef4444" },
  { id: "feature", label: "Feature", color: "#8b5cf6" },
  { id: "design", label: "Design", color: "#ec4899" },
  { id: "infra", label: "Infra", color: "#0ea5e9" },
  { id: "docs", label: "Docs", color: "#10b981" },
];

const PEOPLE: UI.TaskPerson[] = [
  { id: "maya", name: "Maya Kim" },
  { id: "jonas", name: "Jonas Ortiz" },
  { id: "priya", name: "Priya Shah" },
  { id: "leo", name: "Leo Brandt" },
];

const TASKS: UI.Task[] = [
  { id: "t1", key: "NW-201", title: "Audit onboarding emails for tone", status: "backlog", priority: 1, estimate: "S", labels: ["docs"], created: "Oct 2" },
  { id: "t2", key: "NW-207", title: "Explore dark mode for charts", status: "backlog", priority: 0, estimate: "M", labels: ["design"], assignee: "priya", created: "Oct 4" },
  { id: "t3", key: "NW-212", title: "Rate-limit the public search API", status: "todo", priority: 3, estimate: "M", labels: ["infra"], assignee: "leo", dueIn: 3, created: "Oct 9" },
  { id: "t4", key: "NW-214", title: "Invite flow drops role on resend", status: "todo", priority: 4, estimate: "S", labels: ["bug"], assignee: "jonas", dueIn: -1, created: "Oct 12" },
  { id: "t5", key: "NW-216", title: "Bulk edit for task labels", status: "todo", priority: 2, estimate: "L", labels: ["feature"], assignee: "maya", dueIn: 8, subtasks: [0, 4], created: "Oct 13" },
  { id: "t6", key: "NW-209", title: "Redesign billing settings page", status: "progress", priority: 2, estimate: "L", labels: ["design", "feature"], assignee: "priya", dueIn: 5, subtasks: [3, 6], created: "Oct 6" },
  { id: "t7", key: "NW-218", title: "Move workers to the new queue", status: "progress", priority: 3, estimate: "XL", labels: ["infra"], assignee: "leo", dueIn: 2, subtasks: [2, 5], created: "Oct 14" },
  { id: "t8", key: "NW-205", title: "CSV export misses custom fields", status: "review", priority: 3, estimate: "S", labels: ["bug"], assignee: "jonas", pullRequest: 1482, created: "Oct 3" },
  { id: "t9", key: "NW-211", title: "Keyboard shortcuts cheat sheet", status: "review", priority: 1, estimate: "XS", labels: ["docs", "feature"], assignee: "maya", pullRequest: 1490, created: "Oct 8" },
  { id: "t10", key: "NW-198", title: "Weekly digest email", status: "done", priority: 2, estimate: "M", labels: ["feature"], assignee: "maya", subtasks: [5, 5], pullRequest: 1455, created: "Sep 28" },
  { id: "t11", key: "NW-202", title: "Fix flaky checkout test", status: "done", priority: 2, estimate: "S", labels: ["bug", "infra"], assignee: "leo", pullRequest: 1461, created: "Oct 1" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TaskBoard } = ui;
  return <TaskBoard defaultTasks={TASKS} statuses={STATUSES} labels={LABELS} people={PEOPLE} path={["Northwind", "Web app", "Sprint 24"]} />;
}
