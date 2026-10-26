import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProjectMember, ProjectTask } from "../../../src/elements/react";

const MEMBERS: ProjectMember[] = [{ name: "Maya Chen" }, { name: "Jonas Weber" }, { name: "Priya Nair" }];

const INITIAL_TASKS: ProjectTask[] = [
  { id: "t1", label: "Audit current onboarding funnel", done: true, assignee: "Maya Chen" },
  { id: "t2", label: "Draft new welcome checklist", done: true, assignee: "Priya Nair" },
  { id: "t3", label: "Design empty states", done: true, assignee: "Maya Chen" },
  { id: "t4", label: "Build progress tracker", done: false, assignee: "Jonas Weber" },
  { id: "t5", label: "Write in-app tips copy", done: false, assignee: "Priya Nair" },
  { id: "t6", label: "Set up activation analytics", done: false, assignee: "Jonas Weber" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ProjectCard } = ui;
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [status, setStatus] = useState("progress");
  const [opened, setOpened] = useState(0);

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 10 }}>
      <ProjectCard
        title="Onboarding revamp"
        tasks={tasks}
        onTasksChange={(next) => {
          setTasks(next);
          if (next.every((t) => t.done)) setStatus("done");
          else if (status === "done") setStatus("progress");
        }}
        status={status}
        onStatusChange={setStatus}
        due="Nov 14"
        members={MEMBERS}
        action={{ label: "Open project", onClick: () => setOpened((n) => n + 1) }}
        defaultOpen
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center" }}>
        {opened > 0
          ? `"Open project" clicked ${opened}×`
          : `${tasks.filter((t) => t.done).length} of ${tasks.length} subtasks done · tick rows or ring segments`}
      </div>
    </div>
  );
}
