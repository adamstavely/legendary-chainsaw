import { useState } from "react";
import type * as UI from "@components/memory-panel";
import type { Memory } from "@components/memory-panel";

const initial: Memory[] = [
  { id: "w1", category: "Work", text: "Product designer at a fintech startup in Berlin", source: "From chat", date: "Sep 28" },
  { id: "w2", category: "Work", text: "Ships a release every second Thursday", source: "From chat", date: "Oct 3" },
  { id: "p1", category: "Preferences", text: "Prefers short answers with code first, explanation after", source: "From settings", date: "Aug 14" },
  { id: "p2", category: "Preferences", text: "Writes in British English", source: "From chat", date: "Sep 2" },
  { id: "p3", category: "Preferences", text: "Uses metric units", source: "From chat", date: "Jul 19", paused: true },
  { id: "j1", category: "Projects", text: "Redesigning the onboarding flow for the mobile app", source: "From chat", date: "Oct 12" },
  { id: "j2", category: "Projects", text: "Building a design system in React and TypeScript", source: "From a file", date: "Oct 18" },
  { id: "l1", category: "Personal", text: "Training for a half marathon in spring", source: "From chat", date: "Oct 20" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MemoryPanel } = ui;
  const [memories, setMemories] = useState(initial);
  const [enabled, setEnabled] = useState(true);
  return (
    <div style={{ width: "100%", maxWidth: 380, display: "grid", justifyItems: "center" }}>
      <MemoryPanel
        title="Memory"
        memories={memories}
        onChange={setMemories}
        enabled={enabled}
        onEnabledChange={setEnabled}
        categories={["Work", "Preferences", "Projects", "Personal"]}
        maxHeight={320}
        addedSource="Added by you"
        action={{ label: "Manage", onClick: () => setMemories(initial) }}
      />
    </div>
  );
}
