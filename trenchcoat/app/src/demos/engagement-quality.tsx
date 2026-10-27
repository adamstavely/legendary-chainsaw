import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EngagementSignal, EngagementWindow } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A reviewer checking an assistant's research summaries, session by session. Early on they clear flagged citations
   in batches and give verdicts seconds after opening a source; after a calibration chat they slow down. Each beat adds
   a session – the index climbs from low through mixed to strong and the sentence follows the weakest signal. Open an
   example to see what a signal looked like; the run stops at the sixth session. */

type Session = { words: number; time: number; batch: number; commit: number; readings: [string, string, string, string] };

const SESSIONS: Session[] = [
  { words: 0.44, time: 0.28, batch: 0.35, commit: 0.52, readings: ["5 of 9 notes reused earlier wording", "Median 6 s with the source open", "3 batches of 8 or more", "Same follow-up as the last 3 sessions"] },
  { words: 0.5, time: 0.33, batch: 0.42, commit: 0.55, readings: ["4 of 10 notes reused earlier wording", "Median 8 s with the source open", "2 batches of 8 or more", "Same follow-up as the last 2 sessions"] },
  { words: 0.61, time: 0.41, batch: 0.6, commit: 0.7, readings: ["3 of 11 notes reused earlier wording", "Median 14 s with the source open", "1 batch of 9", "Follow-up partly new"] },
  { words: 0.72, time: 0.58, batch: 0.78, commit: 0.81, readings: ["2 of 12 notes reused earlier wording", "Median 31 s with the source open", "No batches – one at a time", "Follow-up specific to this matter"] },
  { words: 0.81, time: 0.7, batch: 0.86, commit: 0.84, readings: ["1 of 12 notes reused earlier wording", "Median 48 s with the source open", "No batches – one at a time", "Follow-up specific to this matter"] },
  { words: 0.86, time: 0.72, batch: 0.9, commit: 0.88, readings: ["1 of 14 notes reused earlier wording", "Median 1 m 05 s with the source open", "No batches – one at a time", "Follow-up specific to this matter"] },
];
const SHOWN_AT_START = 2;

const signalsOf = (s: Session): EngagementSignal[] => [
  { id: "words", kind: "boilerplate", value: s.words, reading: s.readings[0], example: "“Checked against source, no issues.” – the same note on 4 summaries in a row, including one with a wrong date." },
  { id: "time", kind: "source-time", value: s.time, reading: s.readings[1], example: "Marked a 14-page lease summary “accurate” 5 seconds after opening the lease." },
  { id: "batch", kind: "batch-dismissal", value: s.batch, reading: s.readings[2], example: "Dismissed 9 flagged citations in one action, 2 seconds after the list appeared." },
  { id: "commit", kind: "repeated-commitment", value: s.commit, reading: s.readings[3], example: "“Will double-check dates next time” – committed word for word in three sessions." },
];
const indexOf = (s: Session) => +((s.words + s.time + s.batch + s.commit) / 4).toFixed(2);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EngagementQuality } = ui;
  const [shown, setShown] = useState(SHOWN_AT_START);
  const [shared, setShared] = useState(true);
  const [log, setLog] = useState("");

  // A session comes in every beat until the sixth – nothing ticks after that
  useEffect(() => {
    if (shown >= SESSIONS.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 1900);
    return () => clearTimeout(t);
  }, [shown]);

  const sessions = SESSIONS.slice(0, shown);
  const now = sessions[sessions.length - 1];
  const trend: EngagementWindow[] = sessions.map((s, i) => ({ label: `Session ${i + 1}`, index: indexOf(s) }));
  const replay = () => {
    setShown(SHOWN_AT_START);
    setLog("");
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 10 }}>
      <EngagementQuality
        title="Engagement quality"
        scope={`Summary reviews · session ${shown} of 6`}
        signals={signalsOf(now)}
        trend={trend}
        sharedWith={shared ? "your team lead" : undefined}
        onOpenSignal={(id) => setLog(`Would list this session's reviews behind “${signalsOf(now).find((s) => s.id === id)?.kind?.replace("-", " ")}”.`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || (shown < SESSIONS.length ? "A new session arrives every couple of seconds" : "Six sessions in – reviews have slowed down to the source")}{" "}
        <button type="button" style={textButton} onClick={() => setShared((v) => !v)}>
          {shared ? "Hide the shared note" : "Show the shared note"}
        </button>{" "}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>
      </p>
    </div>
  );
}
