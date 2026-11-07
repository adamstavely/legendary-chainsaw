import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { button } from "../demo-kit";

/* Below the menu, the same element as an app header's search over "server" results: layout="popover", filter="none",
   no assistant. The fake API answers after a moment, by prefix, from a research institute's made-up portfolio */
const INDEX = [
  { group: "Topics", id: "topic:neuro", label: "Neuromorphic Computing", hint: "P1 · at risk" },
  { group: "Topics", id: "topic:edge", label: "Edge AI for Sensing", hint: "P4 · watch" },
  { group: "Topics", id: "topic:carbon", label: "Carbon-Negative Materials", hint: "P1 · on track" },
  { group: "Gaps", id: "gap:neuro-data", label: "Neuromorphic benchmark data", hint: "Neuromorphic Computing" },
  { group: "Papers", id: "paper:spiking", label: "Spiking networks at the edge", hint: "2026 · Okonkwo et al." },
  { group: "People", id: "person:okonkwo", label: "Marcus Okonkwo", hint: "Cognitive Systems" },
  { group: "People", id: "person:almeida", label: "Sofia Almeida", hint: "Energy & Materials" },
];
function search(q: string): UI.CommandGroup[] {
  const needle = q.trim().toLowerCase();
  const hits = INDEX.filter((r) => r.label.toLowerCase().split(/\s+/).some((w) => w.startsWith(needle)));
  return ["Topics", "Gaps", "Papers", "People"]
    .map((g) => ({ id: g.toLowerCase(), label: g, commands: hits.filter((h) => h.group === g).map(({ id, label, hint }) => ({ id, label, hint })) }))
    .filter((g) => g.commands.length);
}

function HeaderSearch({ ui, onRun }: { ui: typeof UI; onRun: (label: string) => void }) {
  const { CommandMenu } = ui;
  const [groups, setGroups] = useState<UI.CommandGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, background: "#081d35" }}>
      <strong style={{ color: "#ffffff", fontSize: 14, flex: "none" }}>Halden</strong>
      <CommandMenu
        layout="popover"
        filter="none"
        assistant={false}
        inverse
        hotkey={false}
        label="Search"
        placeholder="Search topics, gaps, papers, people…"
        groups={groups}
        loading={loading}
        onQueryChange={(q) => {
          window.clearTimeout(timer.current);
          if (!q.trim()) {
            setGroups([]);
            setLoading(false);
            return;
          }
          setLoading(true);
          timer.current = window.setTimeout(() => {
            setGroups(search(q));
            setLoading(false);
          }, 350);
        }}
        onRun={(id) => onRun(INDEX.find((r) => r.id === id)?.label ?? id)}
      />
    </div>
  );
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CommandMenu, defaultGroups } = ui;
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState<string | null>(null);

  const labelOf = (id: string) => defaultGroups.flatMap((g) => g.commands).find((c) => c.id === id)?.label ?? id;

  // Let the "ran" note fade after a moment
  useEffect(() => {
    if (!last) return;
    const t = setTimeout(() => setLast(null), 2600);
    return () => clearTimeout(t);
  }, [last]);

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10, justifyItems: "center" }}>
      {open ? (
        <div style={{ width: "100%" }}>
          <CommandMenu
            groups={defaultGroups}
            placeholder="Search or run a command…"
            onRun={(id, query) => setLast(id === "ask" && query ? `Asked the assistant: “${query}”` : `Ran “${labelOf(id)}”`)}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={button}
        >
          Reopen command menu
        </button>
      )}
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", minHeight: 16, textAlign: "center" }}>
        {last ?? "↑ ↓ to move · ↵ runs · ⌘1–⌘5 run suggestions · Esc clears, then closes"}
      </div>
      <HeaderSearch ui={ui} onRun={(label) => setLast(`Opened “${label}”`)} />
    </div>
  );
}
