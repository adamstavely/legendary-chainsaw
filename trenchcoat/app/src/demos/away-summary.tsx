import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AwayItem } from "../../../src/elements/react";
import { bubble, caption, textButton } from "../demo-kit";

/** A fixed clock, so the times and the thumbnail stay the same */
const NOW = Date.UTC(2026, 10, 10, 9, 30);
const MIN = 60_000;
const SINCE = NOW - (3 * 60 + 12) * MIN;

const ITEMS: AwayItem[] = [
  { id: "n1", status: "needs-you", title: "Two vendor files for Northwind Paper", detail: "Pick which one to keep", agent: "Records agent", at: NOW - 40 * MIN, action: "Decide" },
  { id: "n2", status: "needs-you", title: "Publish the draft audit summary?", agent: "Report agent", at: NOW - 95 * MIN },
  { id: "f1", status: "failed", title: "Tax ID check for 3 suppliers", detail: "The registry timed out", agent: "Records agent", at: NOW - 70 * MIN },
  { id: "d1", status: "done", title: "Classified 412 scanned contracts", agent: "Classification agent", at: NOW - 30 * MIN, href: "#contracts" },
  { id: "d2", status: "done", title: "Matched 1,180 invoices to vendors", agent: "Records agent", at: NOW - 120 * MIN },
  { id: "d3", status: "done", title: "Drafted the findings appendix", agent: "Report agent", at: NOW - 150 * MIN, href: "#appendix" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AwaySummary } = ui;
  const [items, setItems] = useState(ITEMS);
  const [seen, setSeen] = useState(false);
  const [last, setLast] = useState("");

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 12 }}>
      <AwaySummary
        since={SINCE}
        now={NOW}
        items={items}
        seen={seen}
        onSeen={() => setSeen(true)}
        onItemAction={(action, item, event) => {
          event.preventDefault();
          setLast(`${action}: ${item.title}`);
          if (action === "retry") setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: "done", detail: "Checked on retry", at: NOW } : i)));
        }}
      />
      <div style={{ ...bubble, justifySelf: "end", maxWidth: "80%", padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.45 }}>
        Clean up the vendor register before Friday's audit.
      </div>
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{last || "Retry moves the check to Done · Mark all seen folds the card"}</span>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setItems(ITEMS);
            setSeen(false);
            setLast("");
          }}
        >
          Show it again
        </button>
      </div>
    </div>
  );
}
