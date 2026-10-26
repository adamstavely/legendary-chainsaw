import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { button } from "../demo-kit";

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
    </div>
  );
}
