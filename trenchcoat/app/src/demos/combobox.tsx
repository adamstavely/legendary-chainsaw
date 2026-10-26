import { useState } from "react";
import type * as UI from "@components/combobox";
import type { ComboboxOption } from "@components/combobox";

const PEOPLE: ComboboxOption[] = [
  { value: "maya", label: "Maya Chen", hint: "Design lead", avatar: true, group: "Design", keywords: "ui ux" },
  { value: "aiko", label: "Aiko Tanaka", hint: "Product designer", avatar: true, group: "Design" },
  { value: "jonas", label: "Jonas Weber", hint: "Frontend", avatar: true, group: "Engineering", keywords: "react" },
  { value: "priya", label: "Priya Nair", hint: "Backend", avatar: true, group: "Engineering", keywords: "api" },
  { value: "leo", label: "Leo Martins", hint: "Platform", avatar: true, group: "Engineering", keywords: "infra devops" },
  { value: "sara", label: "Sara Okafor", hint: "PM", avatar: true, group: "Product" },
  { value: "tom", label: "Tom Fischer", hint: "Data analyst", avatar: true, group: "Product", keywords: "analytics" },
];

const LABELS: ComboboxOption[] = [
  { value: "bug", label: "Bug", color: "#ef4444" },
  { value: "feature", label: "Feature", color: "#2f6bff" },
  { value: "improvement", label: "Improvement", color: "#8b5cf6" },
  { value: "docs", label: "Documentation", color: "#10b981", keywords: "readme" },
  { value: "perf", label: "Performance", color: "#f59e0b", keywords: "speed slow" },
  { value: "design", label: "Design", color: "#ec4899" },
];

const NEW_COLORS = ["#06b6d4", "#84cc16", "#a855f7", "#f97316"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Combobox } = ui;
  const [people, setPeople] = useState<string[]>(["maya", "jonas"]);
  const [labels, setLabels] = useState<string[]>(["bug", "perf"]);
  const [created, setCreated] = useState(0);

  return (
    <div style={{ width: "100%", maxWidth: 400, display: "grid", gap: 20 }}>
      <Combobox
        label="Assignees"
        options={PEOPLE}
        value={people}
        onChange={(v) => setPeople(v)}
        placeholder="Add people…"
        maxVisibleTags={3}
      />
      <Combobox
        label="Labels"
        options={LABELS}
        value={labels}
        onChange={(v) => setLabels(v)}
        placeholder="Add or create a label…"
        creatable
        onCreate={(text) => {
          const color = NEW_COLORS[created % NEW_COLORS.length];
          setCreated((n) => n + 1);
          return { value: text.toLowerCase().replace(/\s+/g, "-"), label: text, color };
        }}
        createLabel={(text) => `Create label “${text}”`}
        emptyText="No labels match"
      />
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
        {people.length} assignee{people.length === 1 ? "" : "s"} · {labels.length} label{labels.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
