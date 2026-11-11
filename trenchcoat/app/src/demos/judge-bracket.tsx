import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { JudgeAttempt, JudgeMatch } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Eight attempts at summarising a records audit, judged two at a time. The first round is in; the judge works
   through the semi-finals and the final every couple of seconds, and the champion's card fills. Open any match for
   both summaries and the judge's reason. */

const ATTEMPTS: JudgeAttempt[] = [
  { id: "a", label: "Attempt A", model: "Claude Sonnet", summary: "Three findings: 41 vendor records lack a tax ID, 12 contracts renewed without review, and the access log has a two-week gap in March.", score: 88 },
  { id: "b", label: "Attempt B", model: "Claude Haiku", summary: "The audit found missing tax IDs and some contracts that renewed automatically. Access logging looks mostly complete.", score: 64 },
  { id: "c", label: "Attempt C", model: "Claude Opus", summary: "Most urgent: the March access-log gap, which hides who opened 2,300 records. Then 41 vendors without tax IDs and 12 unreviewed renewals.", score: 93 },
  { id: "d", label: "Attempt D", model: "Open model", summary: "Vendor data quality issues and contract renewals were identified. Recommend a follow-up review in Q3.", score: 52 },
  { id: "e", label: "Attempt E", model: "Claude Sonnet", summary: "41 vendors lack a tax ID (8 of them paid this year), 12 renewals skipped review, and logging stopped for 15 days in March.", score: 90 },
  { id: "f", label: "Attempt F", model: "Claude Haiku", summary: "Findings cover vendor records, contracts and logs. See the appendix for the full list of 61 items.", score: 58 },
  { id: "g", label: "Attempt G", model: "Open model", summary: "Twelve contracts renewed without a review; the rest of the audit raised minor documentation issues.", score: 61 },
  { id: "h", label: "Attempt H", model: "Claude Opus", summary: "The audit's three findings, ranked by risk: the access-log gap, 41 vendors without tax IDs, and 12 unreviewed renewals.", score: 91 },
];

const FIRST: JudgeMatch[] = [
  { round: 1, a: "a", b: "b", winner: "a", confidence: 0.86, reason: "A gives the three findings with their numbers; B is vaguer and calls logging complete when it isn't." },
  { round: 1, a: "c", b: "d", winner: "c", confidence: 0.94, reason: "C leads with the highest-risk finding and quantifies it; D only names categories." },
  { round: 1, a: "e", b: "f", winner: "e", confidence: 0.91, reason: "E is specific and self-contained; F sends the reader to an appendix." },
  { round: 1, a: "g", b: "h", winner: "h", confidence: 0.88, reason: "H covers all three findings ranked by risk; G misses the access-log gap." },
];
const LATER: JudgeMatch[] = [
  { round: 2, a: "a", b: "c", winner: "c", confidence: 0.72, reason: "Both are accurate; C orders the findings by risk and says what the log gap hides." },
  { round: 2, a: "e", b: "h", winner: "e", confidence: 0.58, reason: "Close. E adds that 8 of the vendors were paid this year, which changes the priority; H is tidier." },
  { round: 3, a: "c", b: "e", winner: "c", confidence: 0.64, reason: "C is the better summary for a reader with one minute: the risk comes first, with its scale." },
];

const STEP = 2200;

/** The verdicts after `n` steps: each later match is judging for a step, then decided */
function verdictsAt(n: number): JudgeMatch[] {
  const out = [...FIRST];
  LATER.forEach((m, i) => {
    if (n > i * 2 + 1) out.push(m);
    else if (n === i * 2 + 1) out.push({ round: m.round, a: m.a, b: m.b });
  });
  return out;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { JudgeBracket } = ui;
  const [n, setN] = useState(1);
  const [used, setUsed] = useState<string | null>(null);
  const last = LATER.length * 2;

  useEffect(() => {
    if (n >= last) return;
    const id = window.setTimeout(() => setN((x) => x + 1), STEP);
    return () => window.clearTimeout(id);
  }, [n, last]);

  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8 }}>
      <JudgeBracket
        task="Summarise the audit's key findings"
        attempts={ATTEMPTS}
        verdicts={verdictsAt(n)}
        defaultMatch="1-2"
        onAccept={(id) => setUsed(ATTEMPTS.find((a) => a.id === id)?.label ?? id)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {used ? `Using ${used}'s summary.` : n < last ? "The judge is working through the semi-finals and the final." : "Open any match for the judge's reason."}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setN(1);
            setUsed(null);
          }}
        >
          Replay
        </button>
      </p>
    </div>
  );
}
