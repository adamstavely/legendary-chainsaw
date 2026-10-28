import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AiSummaryLength, AiSummaryPoint, AiSummarySource, AiSummaryStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional product team's launch thread, summarised. It opens summarised twelve minutes ago; "3 new messages"
   adds replies after that, so the summary says it's behind and offers Update. Update, Regenerate or Detailed stream a
   new summary in. "Fail next time" makes the next run error; "Start over" goes back to Summarise. */

const NOW = Date.UTC(2026, 9, 28, 15, 0);
const MIN = 60_000;

const SOURCES: AiSummarySource[] = [
  { id: "m1", label: "Priya in #launch-q3: launch date options", kind: "message", at: NOW - 190 * MIN },
  { id: "m2", label: "Marco in #launch-q3: billing migration risk", kind: "message", at: NOW - 160 * MIN },
  { id: "d1", label: "Launch checklist v4", kind: "document", href: "#checklist", at: NOW - 300 * MIN },
  { id: "mt", label: "Go / no-go meeting notes", kind: "meeting", at: NOW - 75 * MIN },
  { id: "m3", label: "Lena in #launch-q3: support staffing", kind: "message", at: NOW - 60 * MIN },
  { id: "t1", label: "BILL-482 – proration rounding bug", kind: "ticket", href: "#bill-482", at: NOW - 45 * MIN },
  { id: "d2", label: "Pricing page copy (draft)", kind: "document", href: "#pricing", at: NOW - 40 * MIN },
];
const LATER: AiSummarySource[] = [
  { id: "m4", label: "Marco in #launch-q3: BILL-482 fixed on staging", kind: "message", at: NOW - 6 * MIN },
  { id: "m5", label: "Priya in #launch-q3: moving the date to the 14th", kind: "message", at: NOW - 4 * MIN },
  { id: "m6", label: "Jonas in #launch-q3: press embargo confirmed", kind: "message", at: NOW - 2 * MIN },
];

const TLDR = "Launch is set for 12 November if the billing bug is fixed by Friday; support staffing is the other open risk.";
const TEXT: Record<AiSummaryLength, string> = {
  short:
    "The team agreed at the go / no-go meeting to launch on 12 November. The one blocker is a proration rounding bug in billing, which Marco expects to fix by Friday. Support is short two people for launch week.",
  detailed:
    "The team agreed at the go / no-go meeting to launch on 12 November, with the pricing page and checklist on track. The one blocker is BILL-482, a proration rounding bug that over-charges customers who switch plans mid-month; Marco expects a fix by Friday and wants a day of staging soak before release.\n\nSupport is short two people for launch week. Lena asked for either a week's delay on the help-centre migration or two contractors, and no one has decided yet. The press embargo lifts at 9:00 on launch day.",
};
const POINTS: AiSummaryPoint[] = [
  { id: "date", text: "Launch set for 12 November at the go / no-go meeting.", sources: ["mt", "m1"] },
  { id: "bug", text: "BILL-482 over-charges plan switches mid-month; a fix is expected by Friday.", sources: ["t1", "m2"] },
  { id: "support", text: "Support is two people short for launch week.", sources: ["m3"] },
  { id: "ready", text: "Checklist and pricing copy are on track.", sources: ["d1", "d2"] },
];
const QUESTIONS = ["Delay the help-centre migration, or bring in two contractors?", "Who signs off the billing fix after the staging soak?"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AiSummary } = ui;
  const [status, setStatus] = useState<AiSummaryStatus>("done");
  const [length, setLength] = useState<AiSummaryLength>("short");
  const [sources, setSources] = useState(SOURCES);
  const [summary, setSummary] = useState(TEXT.short);
  const [tldr, setTldr] = useState(TLDR);
  const [shown, setShown] = useState(POINTS.length);
  const [at, setAt] = useState(NOW - 12 * MIN);
  const [fail, setFail] = useState(false);
  const [note, setNote] = useState("");
  const timer = useRef(0);
  const wait = useRef(0);
  const stop = () => {
    window.clearTimeout(wait.current);
    window.clearInterval(timer.current);
  };

  useEffect(() => stop, []);

  const run = (len: AiSummaryLength) => {
    stop();
    setNote("");
    setStatus("summarising");
    setTldr("");
    setSummary("");
    setShown(0);
    const words = TEXT[len].split(" ");
    let i = 0;
    // A short wait before the first words, as a real model would take
    wait.current = window.setTimeout(() => {
      setTldr(TLDR);
      timer.current = window.setInterval(() => {
        if (fail && i > words.length / 3) {
          window.clearInterval(timer.current);
          setStatus("error");
          setFail(false);
          return;
        }
        i = Math.min(words.length, i + 3);
        setSummary(words.slice(0, i).join(" "));
        if (i === words.length) {
          window.clearInterval(timer.current);
          let p = 0;
          timer.current = window.setInterval(() => {
            p++;
            setShown(p);
            if (p >= POINTS.length) {
              window.clearInterval(timer.current);
              setAt(NOW);
              setStatus("done");
            }
          }, 180);
        }
      }, 60);
    }, 600);
  };

  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <AiSummary
        title="Thread summary"
        subject="#launch-q3"
        sources={sources}
        status={status}
        tldr={tldr}
        summary={summary}
        points={POINTS.slice(0, shown)}
        questions={status === "done" ? QUESTIONS : []}
        model="Claude Sonnet"
        generatedAt={at}
        now={NOW}
        error="The model timed out after 60 seconds. Try again, or summarise fewer messages."
        length={length}
        onLengthChange={(l) => {
          setLength(l);
          run(l);
        }}
        onSummarise={() => run(length)}
        onRetry={() => run(length)}
        onCiteOpen={(c) => {
          setNote(`Would open “${sources.find((s) => s.id === c.sourceId)?.label}”.`);
          return false;
        }}
        onFeedbackChange={(v) => setNote(v === "up" ? "Thanks – noted as helpful." : v === "down" ? "Noted as not helpful." : "")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || (status === "idle" ? "Press Summarise to stream a summary in. " : "Point at a numbered chip to see its source. ")}
        <button type="button" style={textButton} onClick={() => setSources(sources.length > SOURCES.length ? SOURCES : [...SOURCES, ...LATER])} disabled={status !== "done"}>
          {sources.length > SOURCES.length ? "Remove the new messages" : "3 new messages"}
        </button>
        {" · "}
        <button type="button" style={textButton} onClick={() => setFail(true)} disabled={fail}>
          {fail ? "The next run will fail" : "Fail next time"}
        </button>
        {" · "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            stop();
            setStatus("idle");
            setTldr("");
            setSummary("");
            setShown(0);
            setNote("");
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
