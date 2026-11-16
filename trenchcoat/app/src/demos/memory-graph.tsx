import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as UI from "../../../src/elements/react";
import type { MemoryGraphMemory, MemoryGraphTool } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional museum's exhibitions team and their personal assistant: what it remembers about the winter exhibition –
   from a budget sheet, the standup notes and a chat – and the tools it can reach. It's using the spreadsheet right now
   and recalling the budget; "Learn from the standup" adds a memory that comes in through the wiki. */

/** Small stroke icons the page brings: Lucide (ISC, lucide.dev) */
const icon = (...paths: string[]): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
const ICONS = {
  wiki: icon("M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"),
  sheet: icon("M3 3h18v18H3z", "M3 9h18", "M3 15h18", "M9 3v18"),
  calendar: icon("M8 2v4", "M16 2v4", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2", "M3 10h18"),
};

const MEMORIES: MemoryGraphMemory[] = [
  { id: "m1", text: "Prefers short answers", source: "You asked for it twice", tag: "Preference", artifact: { name: "Feedback", kind: "chat" } },
  { id: "m2", text: "Winter exhibition budget €48k", source: "From the budget sheet", tag: "Fact", artifact: { name: "budget-winter.xlsx", href: "#budget" }, via: "sheet" },
  { id: "m3", text: "Opening moved to 11 December", source: "Agreed in Monday's standup", tag: "Date", artifact: { name: "Standup notes" }, via: "wiki" },
  { id: "m4", text: "Loans need two weeks' notice", source: "From the registrar's email", tag: "Rule", artifact: { name: "Re: loan forms", kind: "email" } },
];

const LEARNED: MemoryGraphMemory = { id: "m5", text: "Catalogue goes to print on 2 December", source: "From today's standup", tag: "Date", artifact: { name: "Standup notes" }, via: "wiki" };

const TOOLS: MemoryGraphTool[] = [
  { id: "wiki", name: "Wiki", icon: ICONS.wiki, access: "Read", scope: "Exhibitions space", note: "Reads the standup notes and the exhibition plans." },
  { id: "sheet", name: "Spreadsheet", icon: ICONS.sheet, access: "Read & write", scope: "Budget sheets", note: "Keeps the budget sheet up to date." },
  { id: "calendar", name: "Calendar", icon: ICONS.calendar, access: "Read", scope: "Exhibitions team", off: true, note: "Would see the team's meetings." },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MemoryGraph } = ui;
  const [memories, setMemories] = useState(MEMORIES);
  const [tools, setTools] = useState(TOOLS);
  const [learning, setLearning] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const learn = () => {
    setMemories((ms) => [...ms, LEARNED]);
    setLearning(LEARNED.id);
    timers.current.push(window.setTimeout(() => setLearning(null), 2600));
  };
  return (
    <div style={{ width: "100%", maxWidth: 920, display: "grid", gap: 8 }}>
      <MemoryGraph
        title="What the assistant knows"
        description="Memories on the left, the tools it can reach on the right."
        agent={{ name: "Assistant", subtitle: "Exhibitions team" }}
        memories={memories}
        onMemoriesChange={setMemories}
        tools={tools}
        onToolsChange={setTools}
        using={learning ? null : "sheet"}
        learning={learning}
        recalling={learning ? [] : ["m2"]}
        onAction={(id) => setNote(id === "add-file" ? "The page would open a file picker here." : "The page would list tools to connect here.")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Open a card to switch it off or forget it; the assistant offers Add a file and Connect a tool. "}
        {!memories.some((m) => m.id === LEARNED.id) ? (
          <button type="button" style={textButton} onClick={learn}>
            Learn from the standup
          </button>
        ) : null}
      </div>
    </div>
  );
}
