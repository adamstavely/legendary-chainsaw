import { useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ClaimSource, VerificationClaim } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

// Dates are fixed against one day, so the source badges read the same every time
const TODAY = Date.parse("2026-10-24T12:00:00Z");
const DAY = 86_400_000;
const ago = (days: number) => TODAY - days * DAY;

const SOURCES: ClaimSource[] = [
  { id: "freight", site: "Freight quote", title: "Carrier quote – northern hub vs coast route", date: "May 17, 2026", quote: "Per-order cost through the northern hub: $6.42, against $6.17 on the coast route.", validity: { observed: ago(160), contested: true } },
  { id: "routes", site: "Route planner", title: "Delivery-time model, October run", date: "Oct 19, 2026", quote: "Northern postcodes: median 2.1 days from the hub, 3.0 days from the coast warehouse.", validity: { observed: ago(5), profile: "fast" } },
  { id: "orders", site: "Orders export", title: "Orders by region, last 12 months", date: "Oct 22, 2026", quote: "North: 31.8% of orders (48,210 of 151,600).", validity: { observed: ago(2) } },
  { id: "survey", site: "Customer survey", title: "Delivery satisfaction, Q3", date: "Sep 6, 2026", quote: "Customers who waited three days or more were half as likely to order again within 60 days.", validity: { observed: ago(48) } },
  { id: "lease", site: "Lease terms", title: "Northern site – draft lease", date: "Jul 2, 2026", quote: "Break clause at 36 months with six months' notice.", validity: { observed: ago(114), superseded: true } },
];

const SESSION: VerificationClaim[] = [
  { id: "q1", text: "Shipping through the northern hub costs about 4% more per order than the coast route.", source: "grounded", confidence: 0.86, sources: ["freight"], origin: "Hub answer" },
  { id: "q2", text: "It would cut delivery by about a day for northern customers.", source: "grounded", confidence: 0.78, sources: ["routes"], origin: "Hub answer", status: "verified" },
  { id: "q3", text: "Northern customers place nearly a third of all orders.", source: "grounded", confidence: 0.93, sources: ["orders"], origin: "Hub answer", status: "verified" },
  { id: "q4", text: "Faster delivery usually lifts repeat purchases.", source: "model", confidence: 0.62, uncertainty: "evidence", sources: ["survey"], origin: "Hub answer" },
  { id: "q5", text: "The move would likely pay for itself within two years.", source: "inferred", confidence: 0.45, note: "Combines the cost, delivery and repeat-purchase claims.", origin: "Hub answer" },
  { id: "q6", text: "The lease can be broken after three years.", source: "grounded", confidence: 0.8, sources: ["lease"], origin: "Turn 4", status: "incorrect" },
  { id: "q7", text: "Fuel prices next year will decide much of the cost difference.", source: "model", confidence: 0.35, uncertainty: "unsettled", origin: "Turn 5", status: "unverifiable" },
  { id: "q8", text: "Most competitors already ship from a northern site.", source: "model", confidence: 0.4, origin: "Turn 6" },
  { id: "q9", text: "Staffing a second shift would need eight more people.", source: "inferred", confidence: 0.5, origin: "Turn 6", status: "dismissed" },
];

const VERBS = ["costs", "cuts", "lifts", "needs", "covers", "reaches", "doubles", "halves"];
const NOUNS = ["the northern route", "the coast warehouse", "the Q3 survey", "the returns desk", "the carrier contract", "peak season", "the night shift", "the pallet count"];
/** A long session: 10,000 claims, a quarter of them already reviewed */
function bigSession(): VerificationClaim[] {
  const types = ["grounded", "model", "inferred"] as const;
  const marks = ["verified", "unverifiable", "incorrect", "dismissed"] as const;
  return Array.from({ length: 10_000 }, (_, i) => ({
    id: `big-${i}`,
    text: `Claim ${i + 1}: ${NOUNS[i % NOUNS.length]} ${VERBS[(i * 7) % VERBS.length]} ${(i % 37) + 2}% of ${NOUNS[(i * 3 + 1) % NOUNS.length]}.`,
    source: types[i % 3],
    confidence: ((i * 37) % 90) / 100 + 0.1,
    sources: i % 3 === 0 ? [SOURCES[i % SOURCES.length].id] : [],
    origin: `Turn ${Math.floor(i / 12) + 1}`,
    status: i % 4 === 0 ? marks[(i / 4) % 4] : undefined,
  }));
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { VerificationQueue } = ui;
  const [big, setBig] = useState(false);
  const [note, setNote] = useState("");
  const start = useMemo(() => (big ? bigSession() : SESSION), [big]);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <VerificationQueue
        key={big ? "big" : "session"}
        defaultClaims={start}
        sources={SOURCES}
        now={TODAY}
        maxHeight={big ? 320 : 240}
        onExport={({ counts }) => setNote(`Exported – ${counts.verified} verified, ${counts.incorrect} incorrect, ${counts.unverifiable} can't verify, ${counts.dismissed} dismissed.`)}
        onReview={(claim, status) => setNote(`Marked “${claim.text.slice(0, 48)}${claim.text.length > 48 ? "…" : ""}” as ${status}.`)}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ ...caption, minHeight: 16, flex: "1 1 200px" }}>{note || "Use V, C, X or D on a claim – or the buttons under it."}</span>
        <button type="button" style={buttonSm} onClick={() => (setBig((b) => !b), setNote(""))}>
          {big ? "Back to the session" : "Load 10,000 claims"}
        </button>
      </div>
    </div>
  );
}
