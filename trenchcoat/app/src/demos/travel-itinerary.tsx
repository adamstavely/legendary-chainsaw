import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TravelLeg } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional corporate travel audit: one employee's trips this quarter, checked against bookings and expense claims.
   One leg has no booking on record, one ticket was paid in cash, and one boarding pass carries a different name. */

const at = (m: number, d: number) => new Date(2026, m - 1, d, 9).getTime();

const LEGS: TravelLeg[] = [
  { id: "l1", date: at(5, 28), from: { code: "LYS", name: "Lyon Saint-Exupéry" }, to: { code: "IST", name: "Istanbul" }, mode: "air", carrier: "TK1814", document: "Passport ••471K", confidence: 0.99, source: { label: "Booking tool", grade: "A1" } },
  { id: "l2", date: at(5, 31), from: { code: "IST", name: "Istanbul" }, to: { code: "DXB", name: "Dubai" }, mode: "air", carrier: "EK122", document: "Passport ••471K", confidence: 0.97, source: { label: "Expense claim", grade: "B1" } },
  { id: "l3", date: at(6, 4), from: { code: "DXB", name: "Dubai" }, to: { code: "GVA", name: "Geneva" }, mode: "air", carrier: "LX243", document: "Passport ••471K", confidence: 0.95, source: { label: "Expense claim", grade: "B2" }, flags: ["cash"] },
  { id: "l4", date: at(6, 9), from: { code: "GVA", name: "Geneva" }, to: { code: "LYS", name: "Lyon" }, mode: "road", carrier: "A40", document: "National ID", confidence: 0.82, source: { label: "Mileage claim", grade: "C2" }, flags: ["no-record"] },
  { id: "l5", date: at(4, 12), from: { code: "LHR", name: "London Heathrow" }, to: { code: "LYS", name: "Lyon" }, mode: "air", carrier: "BA362", document: "Passport ••471K", confidence: 0.98, source: { label: "Booking tool", grade: "A1" } },
  { id: "l6", date: at(4, 10), from: { code: "LYS", name: "Lyon Part-Dieu" }, to: { code: "LHR", name: "London" }, mode: "rail", carrier: "Eurostar 9031", document: "Booking ref. QK7Y2", confidence: 0.61, source: { label: "Card statement", grade: "C3" }, flags: ["mismatch"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TravelItinerary } = ui;
  const [grouped, setGrouped] = useState(true);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <TravelItinerary title="Travel this quarter" description="Travel audit TA-0617 · checked against bookings and expenses" legs={LEGS} grouped={grouped} onOpen={(id) => setOpened(id)} />
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? `Opened leg ${opened}. ` : "Open a leg with Enter or a click. "}
        <button type="button" style={textButton} onClick={() => setGrouped(!grouped)}>
          {grouped ? "Show as one list" : "Group into journeys"}
        </button>
      </div>
    </div>
  );
}
