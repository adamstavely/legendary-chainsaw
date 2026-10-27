import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AnswerClaim, ClaimSource, ClaimSourceType } from "../../../src/elements/react";
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

/* The second answer rests on a recording, a scan, photos and memory – each type with a confidence ceiling the app sets */
const MEDIA_SOURCES: ClaimSource[] = [
  {
    id: "call",
    site: "Site call, Tuesday",
    title: "Weekly call with the fit-out contractor – machine transcript",
    date: "Oct 20, 2026",
    quote: "“…the loading bays, we're looking at end of January for those, all being well.”",
    validity: { observed: ago(4), profile: "fast" },
  },
  {
    id: "lease",
    site: "Lease, signed scan",
    title: "Northern site lease – scanned copy",
    date: "Sep 30, 2026",
    quote: "Access for fit-out and occupation from 1 February 2027.",
    validity: { observed: ago(24), changed: true },
  },
  { id: "photos", site: "Site photos", title: "Hall B, racking delivery", date: "Oct 16, 2026", validity: { observed: ago(8), profile: "fast" } },
];

const MEDIA_CLAIMS: AnswerClaim[] = [
  { id: "m1", text: "On Tuesday's site call the contractor said the loading bays would be finished by the end of January,", source: "transcript", confidence: 0.88, recognition: 0.91, sources: ["call"] },
  { id: "m2", text: " and the signed lease lets us move in from 1 February.", source: "ocr", confidence: 0.9, recognition: 0.72, sources: ["lease"] },
  { id: "m3", text: " Last week's site photos show the racking still in its crates.", source: "image", confidence: 0.64, sources: ["photos"] },
  { id: "m4", text: "When we opened the coast warehouse, fit-out ran six weeks late,", source: "session", confidence: 0.7, paragraph: true },
  { id: "m5", text: " and the team's rule is to add a month to any contractor's estimate.", source: "team", confidence: 0.75 },
  { id: "m6", text: " The scheduling agent puts the likeliest opening in mid-March.", source: "agent", confidence: 0.58, uncertainty: "unsettled", note: "It assumes the racking crew starts in January." },
];

const CEILINGS: Partial<Record<ClaimSourceType, number>> = { transcript: 0.8, video: 0.75, audio: 0.75, image: 0.7, ocr: 0.85, session: 0.7, team: 0.8, agent: 0.75 };

const MEDIA_COUNTER =
  "The contractor has met every milestone on this site so far, and the lease date is fixed – a February opening is tight, but it isn't out of reach.";

const ANSWERS = [
  { value: "text", label: "Text sources" },
  { value: "media", label: "Media and memory" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ClaimAnswer, SegmentedControl } = ui;
  const [sent, setSent] = useState<string[]>([]);
  const [answer, setAnswer] = useState("text");
  const media = answer === "media";
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <SegmentedControl aria-label="Answer" size="sm" value={answer} onChange={setAnswer} options={ANSWERS} />
      </div>
      <ClaimAnswer
        key={answer}
        claims={media ? MEDIA_CLAIMS : CLAIMS}
        sources={media ? MEDIA_SOURCES : SOURCES}
        counter={media ? MEDIA_COUNTER : COUNTER}
        questionType={media ? "predictive" : "analytical"}
        confidenceCeilings={CEILINGS}
        now={TODAY}
        defaultOpen={media ? "m2" : "c1"}
        onVerify={(claim) => setSent((s) => [...s, claim.text.trim()])}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 16 }}>
        {sent.length ? `Verification queue: ${sent.length} ${sent.length === 1 ? "claim" : "claims"} – latest “${sent[sent.length - 1]}”` : "Open a claim and send it to verification."}
      </div>
    </div>
  );
}
