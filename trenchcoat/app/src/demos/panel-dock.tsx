import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PanelDockItem } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* An audit analyst's chat with three things open beside it: the report draft an agent wrote, a source spreadsheet and
   a preview. Drag the panel's left edge to resize it, collapse it to a rail, or close the tabs. */

const START: PanelDockItem[] = [
  { id: "draft", title: "Q3 report draft", kind: "Artifact", icon: ["M12 20h9", "M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"] },
  { id: "ledger", title: "ledger-q3.csv", kind: "File" },
  { id: "policy", title: "Expense policy §4.2", kind: "Source", icon: ["M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"] },
];
const p = { margin: "0 0 8px" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PanelDock } = ui;
  const [items, setItems] = useState(START);
  const [open, setOpen] = useState(true);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, height: 320, justifyContent: "flex-end" }}>
        <div style={{ ...surface, flex: "1 1 0", minWidth: 0, padding: 16, fontSize: 13 }}>
          <strong>Q3 reconciliation</strong>
          <p style={p}>Three variances over the threshold are in the draft, with the ledger lines behind them.</p>
        </div>
        <PanelDock items={items} defaultActive="draft" defaultWidth={380} minWidth={260} maxWidth={520} open={open} onOpenChange={setOpen} onTcClose={(e) => setItems((list) => list.filter((i) => i.id !== e.detail.id))}>
          <article slot="draft">
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Q3 reconciliation – draft</h3>
            <p style={p}>Cost centre 410 is 3.2% over budget, driven by two late supplier invoices booked in September.</p>
            <p style={p}>Travel spend matches the sample; one receipt is still missing.</p>
          </article>
          <div slot="ledger">
            <p style={p}>1,284 rows · 14 columns · last changed 2 hours ago</p>
          </div>
          <div slot="policy">
            <p style={p}>§4.2 Expenses over the per-diem need a manager's approval within 30 days.</p>
          </div>
        </PanelDock>
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        {open ? "Escape inside the panel closes it · " : "The panel is closed · "}
        <button type="button" style={textButton} onClick={() => (setItems(START), setOpen(true))}>
          Start again
        </button>
      </div>
    </div>
  );
}
