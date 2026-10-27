import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AnswerClaim, ClaimSource } from "../../../src/elements/react";
import { caption } from "../demo-kit";

// Dates are fixed against one day, so the source badges read the same every time
const TODAY = Date.parse("2026-10-24T12:00:00Z");
const DAY = 86_400_000;
const ago = (days: number) => TODAY - days * DAY;

const SOURCES: ClaimSource[] = [
  {
    id: "freight",
    site: "Freight quote",
    title: "Carrier quote – northern hub vs coast route",
    date: "May 17, 2026",
    quote: "Per-order cost through the northern hub: $6.42, against $6.17 on the coast route.",
    validity: { observed: ago(160), contested: true },
  },
  {
    id: "routes",
    site: "Route planner",
    title: "Delivery-time model, October run",
    date: "Oct 19, 2026",
    quote: "Northern postcodes: median 2.1 days from the hub, 3.0 days from the coast warehouse.",
    validity: { observed: ago(5), profile: "fast" },
  },
  {
    id: "orders",
    site: "Orders export",
    title: "Orders by region, last 12 months",
    date: "Oct 22, 2026",
    quote: "North: 31.8% of orders (48,210 of 151,600).",
    validity: { observed: ago(2) },
  },
  {
    id: "survey",
    site: "Customer survey",
    title: "Delivery satisfaction, Q3",
    date: "Sep 6, 2026",
    quote: "Customers who waited three days or more were half as likely to order again within 60 days.",
    validity: { observed: ago(48) },
  },
];

const CLAIMS: AnswerClaim[] = [
  { id: "c1", text: "Shipping through the northern hub costs about 4% more per order than the coast route.", source: "grounded", confidence: 0.86, sources: ["freight"] },
  { id: "c2", text: " It would cut delivery by about a day for northern customers,", source: "grounded", confidence: 0.78, sources: ["routes"] },
  { id: "c3", text: " who place nearly a third of all orders.", source: "grounded", confidence: 0.93, sources: ["orders"] },
  { id: "t1", text: " " },
  { id: "c4", text: "Faster delivery usually lifts repeat purchases,", source: "model", confidence: 0.62, uncertainty: "evidence", note: "Studies disagree on how much.", sources: [] },
  { id: "c5", text: " so the move would likely pay for itself within two years.", source: "inferred", confidence: 0.45, note: "Combines the cost, delivery and repeat-purchase claims." },
  { id: "c6", text: "Fuel prices next year will decide much of the cost difference.", source: "model", confidence: 0.35, uncertainty: "unsettled", paragraph: true },
  { id: "c7", text: " Whether the northern site can staff a second shift isn't something I can judge from here.", source: "model", confidence: 0.2, uncertainty: "beyond" },
];

const COUNTER =
  "The cost gap may be wider than it looks: the freight quote is five months old and the August invoices dispute it. And the one survey behind the repeat-purchase gain measured satisfaction, not orders.";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ClaimAnswer } = ui;
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <ClaimAnswer
        claims={CLAIMS}
        sources={SOURCES}
        counter={COUNTER}
        now={TODAY}
        defaultOpen="c1"
        onVerify={(claim) => setSent((s) => [...s, claim.text.trim()])}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 16 }}>
        {sent.length ? `Verification queue: ${sent.length} ${sent.length === 1 ? "claim" : "claims"} – latest “${sent[sent.length - 1]}”` : "Open a claim and send it to verification."}
      </div>
    </div>
  );
}
