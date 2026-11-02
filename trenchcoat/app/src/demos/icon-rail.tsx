import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The views of a research institute's sample-tracking panel. Icons are Lucide's (ISC licence). */

const ITEMS = [
  { id: "details", label: "Details", icon: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"] },
  { id: "log", label: "Log", icon: ["m4 17 6-6-6-6", "M12 19h8"] },
  { id: "add", label: "Add sample", icon: ["M12 5v14", "M5 12h14"] },
  { id: "map", label: "Freezer map", icon: ["M3 3h18v18H3z", "M3 12h18", "M12 3v18"] },
  { id: "archive", label: "Archive", icon: ["M3 7h18v13H3z", "M3 7l2-4h14l2 4"], disabled: true },
];
const MORE = [
  { id: "export", label: "Export list" },
  { id: "settings", label: "Panel settings" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { IconRail } = ui;
  const [selected, setSelected] = useState<string | null>("details");
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8, paddingBottom: 96 }}>
      <IconRail label="Panel views" items={ITEMS} moreItems={MORE} selected={selected} onSelectedChange={setSelected} onTcAction={(e) => setNote(`Chose: ${e.detail.id}`)} />
      <div style={{ ...caption, textAlign: "center" }} role="status">
        {note || `Showing: ${selected ?? "nothing"}. Use the arrows, or open More.`}
      </div>
    </div>
  );
}
