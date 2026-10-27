import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ConfidenceLevel, ConfidenceRecord, ConfidenceUncertaintyKind } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Two briefs written for people who weren't in the session: a pricing decision for the leadership meeting (moderate
   confidence, a good record) and a shipping forecast for the operations lead (low confidence – the data is thin and
   the situation is still moving). Copy one as text to paste into an email; the reference opens the provenance record. */

type Brief = {
  key: string;
  tab: string;
  title: string;
  question: string;
  meta: string;
  conclusion: string;
  confidence: ConfidenceLevel;
  uncertainty: ConfidenceUncertaintyKind[];
  uncertaintyNote: string;
  basis: string;
  changers: string[];
  assumptions: string[];
  signals: string[];
  record: ConfidenceRecord;
  ref: string;
};

const BRIEFS: Brief[] = [
  {
    key: "pricing",
    tab: "Pricing",
    title: "Annual pricing and churn",
    question: "Will annual-only pricing reduce churn?",
    meta: "27 Oct · for the leadership meeting",
    conclusion: "Probably, by 2–4 points over a year – mostly from small teams who now leave after their first month.",
    confidence: "moderate",
    uncertainty: ["data", "model"],
    uncertaintyNote: "Only one comparable change exists in our own history, and the churn model hasn't been tested on a pricing change this large.",
    basis: "Eighteen months of billing and cancellation data, three customer interviews from this month and two published pricing studies.",
    changers: ["Small teams cancelling at the annual renewal instead of month one", "A competitor launching a cheaper monthly plan"],
    assumptions: ["Sign-ups don't fall by more than 10%", "Refund requests stay at today's rate"],
    signals: ["Trial-to-paid conversion in the first two weeks", "Support tickets that mention the price"],
    record: { right: 17, total: 20, note: "Pricing and packaging questions since 2024" },
    ref: "PR-2026-0441",
  },
  {
    key: "shipping",
    tab: "Shipping",
    title: "November restock timing",
    question: "Will the November restock arrive before the sale?",
    meta: "27 Oct · for the operations lead",
    conclusion: "Unlikely. The restock will probably land 3–6 days after the sale starts.",
    confidence: "low",
    uncertainty: ["data", "disagreement", "time"],
    uncertaintyNote: "The carrier's estimate and the port's queue data disagree, and the port backlog changes daily.",
    basis: "The carrier's estimate from yesterday, port queue data from this morning and our last four restocks.",
    changers: ["The carrier confirming a berth slot this week", "Air freight for the two best sellers"],
    assumptions: ["Customs clears in the usual two days"],
    signals: ["The port's daily queue length", "A berth confirmation email from the carrier"],
    record: { right: 6, total: 11, note: "Delivery forecasts this year" },
    ref: "PR-2026-0458",
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ConfidenceBrief } = ui;
  const [at, setAt] = useState(0);
  const [note, setNote] = useState("");
  const b = BRIEFS[at];

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <ConfidenceBrief
        title={b.title}
        meta={b.meta}
        question={b.question}
        conclusion={b.conclusion}
        confidence={b.confidence}
        uncertainty={b.uncertainty}
        uncertaintyNote={b.uncertaintyNote}
        basis={b.basis}
        changers={b.changers}
        assumptions={b.assumptions}
        signals={b.signals}
        record={b.record}
        provenanceId={b.ref}
        onCopy={(text) => setNote(`Copied ${text.split("\n").length} lines of plain text – ready to paste into an email`)}
        onOpenProvenance={(id) => setNote(`Would open provenance record ${id}`)}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note || "Copy as text, or open the provenance record"}</span>
        <span style={{ display: "inline-flex", gap: 10 }}>
          {BRIEFS.map((x, i) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={i === at}
              onClick={() => {
                setAt(i);
                setNote("");
              }}
              style={{ ...textButton, textDecoration: i === at ? "none" : "underline", fontWeight: i === at ? 600 : undefined }}
            >
              {x.tab}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
