import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FlowNode, FlowRef, FlowTransfer } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* How money moved through a fictional freight company under an anti-money-laundering review: the director pays in,
   the operating company passes most of it to a holding company abroad, which sends it on to a property vehicle and an
   unknown account; a courier is paid along the way. "Add the cash deposit" adds a transfer and a new entity. */

const NODES: FlowNode[] = [
  { id: "dir", label: "J. Halden", kind: "person", detail: "Director" },
  { id: "op", label: "Halden Freight SARL", kind: "company", detail: "France" },
  { id: "hold", label: "Kestrel Holdings", kind: "shell", detail: "Cyprus" },
  { id: "courier", label: "R. Okoro", kind: "person", detail: "Courier" },
  { id: "prop", label: "Alder Estates SL", kind: "company", detail: "Spain" },
  { id: "bank", label: "Gulf Meridian Bank", kind: "bank", detail: "UAE" },
];
const TRANSFERS: FlowTransfer[] = [
  { id: "t1", from: "dir", to: "op", amount: 58000, date: Date.UTC(2026, 4, 2, 12) },
  { id: "t2", from: "op", to: "hold", amount: 240000, date: Date.UTC(2026, 4, 15, 12), flag: "Layering" },
  { id: "t3", from: "op", to: "courier", amount: 9500, date: Date.UTC(2026, 3, 11, 12), flag: "Courier fee" },
  { id: "t4", from: "hold", to: "prop", amount: 180000, date: Date.UTC(2026, 4, 20, 12) },
  { id: "t5", from: "hold", to: "bank", amount: 55000, date: Date.UTC(2026, 4, 22, 12), flag: "Offshore" },
];
const EXTRA_NODE: FlowNode = { id: "cash", label: "Unknown depositor", kind: "unknown", detail: "Switzerland" };
const EXTRA: FlowTransfer = { id: "t6", from: "cash", to: "bank", amount: 120000, currency: "USD", date: Date.UTC(2026, 3, 28, 12), flag: "Cash-in" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MoneyFlow } = ui;
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<FlowRef | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <MoneyFlow
        title="Money flow"
        description="Halden Freight SARL · last 90 days"
        nodes={more ? [...NODES, EXTRA_NODE] : NODES}
        transfers={more ? [...TRANSFERS, EXTRA] : TRANSFERS}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <span>{selected ? `Selected ${selected.kind === "node" ? "an entity" : "a transfer"}.` : "Point at an entity or a transfer, or move with the arrow keys and press Enter."}</span>
        <button type="button" style={buttonSm} onClick={() => setMore(!more)}>
          {more ? "Reset" : "Add the cash deposit"}
        </button>
      </div>
    </div>
  );
}
