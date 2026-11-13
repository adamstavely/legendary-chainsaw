import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LineItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's expense claim for a conference trip, read off the scanned receipts. The model wasn't
   sure of the hotel's nights or the taxi's amount, and the claim form states a total the rows don't reach yet –
   fixing the taxi fare to 58.00 makes it match. "Read again" streams the rows back in. */

const ROWS: LineItem[] = [
  { id: "reg", description: "Conference registration", category: "Fees", quantity: 1, unitPrice: 640 },
  { id: "hotel", description: "Hotel, 3 nights", category: "Lodging", quantity: 3, unitPrice: 148.5, uncertain: ["quantity"] },
  { id: "train", description: "Rail fare, return", category: "Travel", quantity: 1, unitPrice: 96.4 },
  { id: "taxi", description: "Taxi to the venue", category: "Travel", quantity: 1, unitPrice: 0, amount: 24, confidence: 0.54, uncertain: ["amount"], flag: "Receipt is hard to read" },
  { id: "meals", description: "Meals, per diem", category: "Subsistence", quantity: 3, unitPrice: 42 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LineItems } = ui;
  const [items, setItems] = useState<LineItem[]>(ROWS);
  const [streaming, setStreaming] = useState(false);
  const [said, setSaid] = useState("Fix the taxi fare to 58.00 and the total matches the claim form.");

  // Streams the rows back in, one every 300 ms
  useEffect(() => {
    if (!streaming) return;
    if (items.length >= ROWS.length) {
      setStreaming(false);
      return;
    }
    const t = setTimeout(() => setItems(ROWS.slice(0, items.length + 1)), 300);
    return () => clearTimeout(t);
  }, [streaming, items.length]);

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <LineItems
        title="Expense claim"
        source="Conference trip · receipts.pdf"
        currency="EUR"
        locale="en-GB"
        statedTotal={1365.9}
        items={items}
        streaming={streaming}
        onItemsChange={setItems}
        onConfirm={({ total, items }) => setSaid(`Confirmed ${items.length} rows, ${total.toFixed(2)} EUR.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setItems([]);
            setStreaming(true);
          }}
        >
          Read again
        </button>
      </div>
    </div>
  );
}
