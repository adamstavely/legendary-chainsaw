import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SessionTab } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's audit analysts with several chats open. Close and "+" change the list, because the page owns
   the tabs; drag a tab (or Alt+Shift+arrows) to move it. */

const START: SessionTab[] = [
  { id: "q3", title: "Q3 reconciliation" },
  { id: "vendor", title: "Vendor risk summary", status: "running" },
  { id: "ledger", title: "Ledger variance by cost centre", status: "waiting", unread: true },
  { id: "travel", title: "Travel expense sampling", status: "failed" },
  { id: "controls", title: "Controls walkthrough notes" },
  { id: "board", title: "Board pack draft" },
];
const NEXT = ["Fixed asset roll-forward", "Payroll cut-off test", "Grant spending check"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SessionTabs } = ui;
  const [tabs, setTabs] = useState(START);
  const [active, setActive] = useState<string | null>("ledger");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <SessionTabs
        tabs={tabs}
        active={active}
        onActiveChange={(id) => {
          setActive(id);
          setTabs((list) => list.map((t) => (t.id === id ? { ...t, unread: false } : t)));
        }}
        onTcClose={(e) => setTabs((list) => list.filter((t) => t.id !== e.detail.id))}
        onTcNew={() => {
          const title = NEXT[tabs.length % NEXT.length];
          const id = `new-${tabs.length}-${title}`;
          setTabs((list) => [...list, { id, title }]);
          setActive(id);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Drag a tab to move it, or use Alt+Shift+arrows ·{" "}
        <button type="button" style={textButton} onClick={() => (setTabs(START), setActive("ledger"))}>
          Start again
        </button>
      </div>
    </div>
  );
}
