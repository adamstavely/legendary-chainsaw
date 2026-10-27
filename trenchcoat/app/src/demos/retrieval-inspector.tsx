import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RetrievalChunk, RetrievalMiss } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* One support question against a help-centre index. The top 1,200 chunks come back in rank order; then the answer
   is written and the chunks it cites turn "Used". Freshness is counted to a fixed day, so the bands don't drift.
   One timeout at a time, none once the answer is in. */

const NOW = Date.parse("2026-10-24T12:00:00Z");
const QUERY = "How long do customers have to return a damaged item, and do they need to send it back?";
const COUNT = 1200;
const TICK = 200;

const TOP: RetrievalChunk[] = [
  {
    id: "c1",
    source: "Returns and refunds policy",
    location: "§2.1 Damaged on arrival",
    position: { index: 3, count: 24 },
    score: 0.91,
    observed: "2026-08-14",
    citation: 1,
    url: "https://help.example.com/returns#damaged",
    text: "Items that arrive damaged can be reported within 30 days of delivery. We refund the full price, including delivery, to the original payment method. For items under $100 the customer does not need to return the item.",
  },
  {
    id: "c2",
    source: "Damaged deliveries – help article",
    location: "Step 2",
    position: { index: 1, count: 6 },
    score: 0.86,
    observed: "2026-05-02",
    citation: 2,
    url: "https://help.example.com/damaged",
    text: "Ask the customer for a photo of the damage and the order number. Refunds for damaged items are issued within 3–5 business days once the photo is on file.",
  },
  {
    id: "c3",
    source: "Holiday returns 2024",
    location: "Extended window",
    position: { index: 0, count: 3 },
    score: 0.81,
    observed: "2024-11-20",
    superseded: true,
    url: "https://help.example.com/holiday-2024",
    text: "Purchases made between November 15 and December 31 can be returned until January 31. Damaged items must be returned to a store for inspection.",
  },
  {
    id: "c4",
    source: "Returns and refunds policy",
    location: "§1 Standard returns",
    position: { index: 1, count: 24 },
    score: 0.77,
    observed: "2026-08-14",
    text: "Unused items can be returned within 60 days of delivery for a refund to the original payment method. The customer pays return shipping unless the item is faulty.",
  },
  {
    id: "c5",
    source: "Warranty terms",
    location: "§4 Exclusions",
    position: { index: 9, count: 14 },
    score: 0.64,
    observed: "2025-02-10",
    contested: true,
    text: "Damage caused in transit is covered by the carrier's liability, not by this warranty. Claims must be made with the carrier within 7 days.",
  },
  {
    id: "c6",
    source: "Shipping FAQ",
    location: "Lost and late parcels",
    position: { index: 5, count: 11 },
    score: 0.58,
    observed: "2026-09-30",
    text: "If tracking hasn't changed for five days, open a trace with the carrier. Replacement orders ship once the trace is closed.",
  },
  {
    id: "c7",
    source: "Store locator",
    location: "Returning in store",
    position: { index: 0, count: 2 },
    score: 0.52,
    observed: "2026-01-12",
    text: "Any Brightline store accepts returns with the order number or the card used to pay. Stores can't refund orders paid with gift cards.",
  },
];

const SOURCES = ["Product care guides", "Order status help", "Gift cards", "Accounts and sign-in", "Delivery options", "Price match", "Assembly service"];
const filler = (i: number): RetrievalChunk => {
  const source = SOURCES[i % SOURCES.length];
  const count = 8 + (i % 13);
  return {
    id: `f${i}`,
    source,
    location: `Section ${(i % 9) + 1}`,
    position: { index: i % count, count },
    // Scores fall away slowly below the top few
    score: Math.max(0.05, 0.5 - i * 0.00037),
    observed: NOW - ((i * 37) % 900) * 86_400_000,
    text: `${source}: general guidance that shares a few words with the question but doesn't answer it (passage ${i + 1}).`,
  };
};
const ALL: RetrievalChunk[] = [...TOP, ...Array.from({ length: COUNT - TOP.length }, (_, i) => filler(i))];
const USED = new Set(["c1", "c2"]);

const MISSES: RetrievalMiss[] = [
  {
    id: "m1",
    source: "Damaged deliveries – help article",
    location: "Step 3",
    score: 0.47,
    reason: "Marked relevant in the eval set; scored just under the cutoff",
    text: "No return is needed for damaged items under $100 – close the case once the refund is issued.",
  },
];

/** Retrieval lands in three batches; then the answer cites its chunks */
const STEPS = 4;
function at(step: number): RetrievalChunk[] {
  const shown = step >= 3 ? ALL : ALL.slice(0, [TOP.length, 400, 800][step]);
  return step >= STEPS ? shown.map((c) => (USED.has(c.id) ? { ...c, used: true } : c)) : shown;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RetrievalInspector } = ui;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>("c3");
  const done = step >= STEPS;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setStep((n) => n + 1), TICK);
    return () => clearTimeout(id);
  }, [step, done]);

  const chunks = useMemo(() => at(step), [step]);

  return (
    <div style={{ width: "100%", maxWidth: 920, display: "grid", gap: 10 }}>
      <RetrievalInspector
        query={QUERY}
        chunks={chunks}
        misses={done ? MISSES : []}
        cutoff={0.5}
        now={NOW}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {done ? "The answer cites [1] and [2]; the superseded holiday policy was retrieved but not used. " : "Retrieving… "}
        {done && (
          <button type="button" style={textButton} onClick={() => setStep(0)}>
            Ask again
          </button>
        )}
      </div>
    </div>
  );
}
