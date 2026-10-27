import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RelianceAgent, RelianceDomain, RelianceReviewLevel, RelianceSignal, RelianceWindow } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A contract-review assistant over six weeks: as the team gets used to it, they accept more of its clause summaries
   unedited while its accuracy on the new template slips. Each beat adds a week – the index drifts, signals cross the
   spot-check and then the mandatory threshold, and the card recommends a stricter review. Switch to it from the
   footer; the run stops once the last week is in. */

type Week = { reliance: number; accuracy: number; overtrust: number; undertrust: number; signals: [number, number, number] };

const WEEKS: Week[] = [
  { reliance: 0.78, accuracy: 0.84, overtrust: 1, undertrust: 3, signals: [0.41, 0.32, 0.28] },
  { reliance: 0.82, accuracy: 0.83, overtrust: 1, undertrust: 2, signals: [0.46, 0.38, 0.3] },
  { reliance: 0.85, accuracy: 0.81, overtrust: 2, undertrust: 2, signals: [0.52, 0.44, 0.33] },
  { reliance: 0.88, accuracy: 0.77, overtrust: 4, undertrust: 1, signals: [0.63, 0.51, 0.36] },
  { reliance: 0.9, accuracy: 0.73, overtrust: 6, undertrust: 1, signals: [0.71, 0.58, 0.41] },
  { reliance: 0.93, accuracy: 0.71, overtrust: 9, undertrust: 1, signals: [0.84, 0.66, 0.47] },
];
const SHOWN_AT_START = 3;

const index = (w: Week) => +(1 - Math.abs(w.reliance - w.accuracy)).toFixed(2);

const signalsOf = (w: Week): RelianceSignal[] => [
  { id: "unedited", label: "Accepted unedited", hint: "Summaries used without a change", value: w.signals[0] },
  { id: "fast", label: "Accepted within 10 s", hint: "Too quick to have read the clause", value: w.signals[1] },
  { id: "unchecked", label: "Sources not opened", hint: "Cited clauses nobody looked at", value: w.signals[2] },
];

/* Per domain, the summaries' stated confidence against how often they were right – liability caps drift into
   over-confidence as the new template's wording spreads */
const domainsOf = (week: number): RelianceDomain[] => [
  { id: "payment", label: "Payment terms", confidence: 0.86, accuracy: 0.84, count: 142 },
  { id: "liability", label: "Liability caps", confidence: 0.88, accuracy: +(0.84 - week * 0.03).toFixed(2), count: 96 },
  { id: "termination", label: "Termination", confidence: 0.71, accuracy: 0.83, count: 61 },
  { id: "data", label: "Data protection", confidence: 0.79, accuracy: 0.76, count: 113 },
];

const AGENTS: RelianceAgent[] = [
  { id: "summariser", label: "Clause summariser", rating: 0.91, detail: "412 answers" },
  { id: "extractor", label: "Obligation extractor", rating: 0.84, detail: "268 answers" },
  { id: "redliner", label: "Redline drafter", rating: 0.67, detail: "95 answers" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RelianceGauge } = ui;
  const [shown, setShown] = useState(SHOWN_AT_START);
  const [level, setLevel] = useState<RelianceReviewLevel>("routine");
  const [log, setLog] = useState("");
  const [detail, setDetail] = useState(true);

  // A week comes in every beat until the sixth – nothing ticks after that
  useEffect(() => {
    if (shown >= WEEKS.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 1800);
    return () => clearTimeout(t);
  }, [shown]);

  const weeks = WEEKS.slice(0, shown);
  const now = weeks[weeks.length - 1];
  const trend: RelianceWindow[] = weeks.map((w, i) => ({ label: `Week ${i + 1}`, index: index(w) }));
  const replay = () => {
    setShown(SHOWN_AT_START);
    setLevel("routine");
    setLog("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 10 }}>
      <RelianceGauge
        title="Reliance on clause summaries"
        scope={`Contract review · week ${shown} of 6`}
        reliance={now.reliance}
        accuracy={now.accuracy}
        trend={trend}
        signals={signalsOf(now)}
        overtrust={now.overtrust}
        undertrust={now.undertrust}
        domains={detail ? domainsOf(shown) : []}
        agents={detail ? AGENTS : []}
        reviewLevel={level}
        onReviewLevelChange={(next) => {
          setLevel(next);
          setLog(`Review level switched to ${next}.`);
        }}
        onOpenEpisodes={(kind) => setLog(`Would open the ${now[kind]} ${kind} episodes for this week.`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || (shown < WEEKS.length ? "A new week arrives every couple of seconds" : "Six weeks in – reliance has outrun accuracy")}{" "}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>{" "}
        <button type="button" style={textButton} onClick={() => setDetail((d) => !d)}>
          {detail ? "Hide domains and agents" : "Show domains and agents"}
        </button>
      </p>
    </div>
  );
}
