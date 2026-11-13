import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ReviewQueueItem, ReviewQueueResult } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A reviewer grading the institute's Policy Q&A agent on live questions about travel and expenses: three of eight
   done, one skipped, and the fourth up with Correct already marked. Grades stay in the demo. */

const ITEMS: ReviewQueueItem[] = [
  { id: "r1", source: "Live chat · 11 Nov", input: "Is economy plus allowed on a 7-hour flight?", output: "Yes – flights over 6 hours may be booked in premium economy (policy 3.1).", reference: "Premium economy is allowed for flights over 6 hours (3.1)." },
  { id: "r2", source: "Live chat · 11 Nov", input: "Can I expense a gym day pass at a conference hotel?", output: "No, personal wellbeing costs aren't claimable.", reference: "Not claimable – personal costs (5.4)." },
  { id: "r3", source: "Live chat · 11 Nov", input: "What's the hotel cap in Geneva?", output: "The cap is CHF 180 a night.", reference: "CHF 240 a night in Geneva (table B)." },
  {
    id: "r4",
    source: "Live chat · 12 Nov",
    input: "Do I need an itemised receipt for a €30 dinner?",
    output: "Yes. Anything over €25 needs an itemised receipt – a card slip on its own isn't enough. Add the attendees if it was a work dinner.",
    reference: "Itemised receipts are required above €25 (6.2).",
  },
  { id: "r5", source: "Live chat · 12 Nov", input: "Can a partner's train ticket go on my claim?", output: "Only if they travel as an invited speaker.", reference: "No – companions' travel isn't covered (2.7)." },
  { id: "r6", source: "Live chat · 12 Nov", input: "How soon must I submit a claim?", output: "Within 60 days of the trip ending.", reference: "60 days (1.3)." },
  { id: "r7", source: "Live chat · 12 Nov", input: "Is a rental car OK for a site visit?", output: "Yes, when it's cheaper than rail for the group, with approval.", reference: "Allowed with prior approval when cheaper (4.5)." },
  { id: "r8", source: "Live chat · 12 Nov", input: "Who approves trips over €3,000?", output: "Your head of department.", reference: "The finance director (1.1)." },
];

const START: Record<string, ReviewQueueResult> = {
  r1: { status: "graded", grades: { correct: "pass", grounded: "pass", helpful: 5 }, verdict: "pass", note: "" },
  r2: { status: "graded", grades: { correct: "pass", grounded: "pass", helpful: 4 }, verdict: "pass", note: "" },
  r3: { status: "graded", grades: { correct: "fail", grounded: "fail", helpful: 2 }, verdict: "fail", note: "Wrong city table." },
  r5: { status: "skipped" },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ReviewQueue } = ui;
  const [results, setResults] = useState(START);
  const [index, setIndex] = useState(3);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 10 }}>
      <ReviewQueue items={ITEMS} results={results} onResultsChange={setResults} index={index} onIndexChange={setIndex} />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        Press P or F and 1–5 to grade, Enter to submit, ? for every key.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setResults(START);
            setIndex(3);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
