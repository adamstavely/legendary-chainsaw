import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ReasoningFlag } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An assistant's answer about moving a nightly report to a new job queue. A moment after it appears, the app's
   reasoning check comes back with four flags. Hover a dotted span or focus a flag marker to read why; "Ask the model
   to reconsider" sends one back, and a moment later the revised sentence replaces it and its flag goes away. */

/** A sentence of the answer; `flag.phrase` is the part of it that's flagged */
type Sentence = { id: string; text: string; flag?: { phrase: string; kind: string; explanation: string }; revised?: string; gap?: string };

const SENTENCES: Sentence[] = [
  {
    id: "s1",
    text: "Moving the nightly report to the new queue should make it more reliable, because jobs on the new queue are more dependable.",
    flag: { phrase: "because jobs on the new queue are more dependable", kind: "circular", explanation: "“More reliable” and “more dependable” mean the same thing, so the reason given doesn't add any support." },
    revised: "Moving the nightly report to the new queue should make it more reliable: its jobs retry automatically, and last month 0.2% failed compared with 3% on the old one.",
  },
  {
    id: "s2",
    text: "It's hard to say how much time it saves without a trial run, but it will certainly finish before 6 a.m. every day.",
    flag: { phrase: "but it will certainly finish before 6 a.m. every day", kind: "hedge-then-certain", explanation: "It admits the saving is unknown without a trial, then promises a finish time anyway." },
    revised: "It's hard to say how much time it saves without a trial run; a week on the new queue would show whether it reliably finishes before 6 a.m.",
  },
  {
    id: "s3",
    text: "The queue has handled every job we've given it so far, so it will handle the report's peak load too.",
    flag: { phrase: "so it will handle the report's peak load too", kind: "overconfidence", explanation: "“Every job so far” is a handful of small jobs; none was near the report's size, so the evidence doesn't reach this conclusion." },
    revised: "The queue has handled every job we've given it so far, but none was as large as the report, so a load test at peak size is worth doing first.",
    gap: "\n\n",
  },
  {
    id: "s4",
    text: "There's nothing to change in the report itself.",
    flag: { phrase: "There's nothing to change in the report itself", kind: "self-contradiction", explanation: "The next sentence says the report's retry settings need updating." },
    revised: "The report itself needs one change:",
  },
  { id: "s5", text: "You'll need to update its retry settings so they don't double up with the queue's own retries." },
];

/** The answer's text and its flags' offsets, from the sentences as they stand */
function build(sentences: Sentence[], detected: boolean) {
  let text = "";
  const flags: ReasoningFlag[] = [];
  for (const s of sentences) {
    const start = text.length;
    text += s.text;
    if (detected && s.flag) {
      const { phrase, ...flag } = s.flag;
      const at = start + Math.max(0, s.text.indexOf(phrase));
      flags.push({ id: s.id, start: at, end: at + phrase.length, ...flag });
    }
    text += s.gap ?? " ";
  }
  return { text: text.trimEnd(), flags };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ReasoningFlags } = ui;
  const [run, setRun] = useState(0);
  const [sentences, setSentences] = useState(SENTENCES);
  const [detected, setDetected] = useState(false);
  const [log, setLog] = useState("Checking the answer's reasoning…");

  // Once per run: the reasoning check comes back a moment after the answer
  useEffect(() => {
    const t = setTimeout(() => {
      setDetected(true);
      setLog("4 flags found. Hover or focus one to see why");
    }, 1200);
    return () => clearTimeout(t);
  }, [run]);

  const { text, flags } = useMemo(() => build(sentences, detected), [sentences, detected]);

  // A request to reconsider: the model's revised sentence arrives a moment later
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      setSentences((list) => list.map((s) => (s.id === pending && s.revised ? { ...s, text: s.revised, flag: undefined } : s)));
      setLog("The model revised the sentence; its flag is cleared");
      setPending(null);
    }, 1400);
    return () => clearTimeout(t);
  }, [pending]);

  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 10 }}>
      <ReasoningFlags
        key={run}
        text={text}
        flags={flags}
        onReconsider={(flag) => {
          setPending(flag.id ?? null);
          setLog("Asked the model to reconsider…");
        }}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setSentences(SENTENCES);
            setDetected(false);
            setPending(null);
            setLog("Checking the answer's reasoning…");
            setRun((n) => n + 1);
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
