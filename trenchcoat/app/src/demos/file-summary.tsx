import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FileSummaryEntity, FileSummaryLength, FileSummaryPoint, FileSummaryStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional company's quarterly report. Summarise streams the summary in word by word, then the key points and who
   and what it mentions arrive; Detailed summarises again at more length. "Fail next time" makes the next run error. */

const FILE = { name: "Northwind Q3 2026 report.pdf", kind: "pdf" as const, size: 2_516_582, pages: 48 };

const TEXT: Record<FileSummaryLength, string> = {
  short:
    "Northwind grew revenue 18% year on year to $42.6M in Q3, led by the enterprise plan. Gross margin held at 71%, but operating costs rose faster than planned after the Lisbon office opened, so the full-year profit target was lowered.",
  detailed:
    "Northwind grew revenue 18% year on year to $42.6M in Q3, led by the enterprise plan, which now makes up 61% of new bookings. Net revenue retention reached 116%, and churn among small teams fell for the third quarter running.\n\nGross margin held at 71%. Operating costs rose 24%, faster than planned, mostly from opening the Lisbon office and hiring 38 people ahead of the Q4 launch. The board lowered the full-year operating profit target from $9.5M to $8.1M and approved a $3M share buyback.",
};
const POINTS: FileSummaryPoint[] = [
  { id: "rev", text: "Revenue up 18% year on year to $42.6M, led by the enterprise plan.", refs: [{ page: 4 }, { page: 12 }] },
  { id: "margin", text: "Gross margin steady at 71%; operating costs up 24% after the Lisbon office opened.", refs: [{ page: 18 }] },
  { id: "target", text: "Full-year operating profit target lowered from $9.5M to $8.1M.", refs: [{ page: 31 }] },
  { id: "buyback", text: "The board approved a $3M share buyback.", refs: [{ page: 44 }] },
];
const ENTITIES: FileSummaryEntity[] = [
  { id: "nw", label: "Northwind Ltd", kind: "organization", count: 63 },
  { id: "ad", label: "Amara Diallo, CFO", kind: "person", count: 9 },
  { id: "jo", label: "Jonas Ortiz, CEO", kind: "person", count: 7 },
  { id: "lis", label: "Lisbon office", kind: "organization", count: 5 },
  { id: "q3", label: "Q3 2026", kind: "date", count: 22 },
  { id: "rev", label: "$42.6M", kind: "amount", count: 6 },
  { id: "tgt", label: "$8.1M", kind: "amount", count: 3 },
  { id: "bb", label: "$3M", kind: "amount", count: 2 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FileSummary } = ui;
  const [status, setStatus] = useState<FileSummaryStatus>("idle");
  const [length, setLength] = useState<FileSummaryLength>("short");
  const [summary, setSummary] = useState("");
  const [shown, setShown] = useState(0);
  const [fail, setFail] = useState(false);
  const [at, setAt] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");
  const timer = useRef(0);
  const wait = useRef(0);
  const stop = () => {
    window.clearTimeout(wait.current);
    window.clearInterval(timer.current);
  };

  useEffect(() => stop, []);

  const run = (len: FileSummaryLength) => {
    stop();
    setStatus("summarising");
    setSummary("");
    setShown(0);
    const words = TEXT[len].split(" ");
    let i = 0;
    // A short wait before the first words, as a real model would take
    wait.current = window.setTimeout(() => {
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
              setAt(Date.now());
              setStatus("done");
            }
          }, 180);
        }
      }, 60);
    }, 700);
  };

  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <FileSummary
        file={FILE}
        status={status}
        summary={summary}
        points={POINTS.slice(0, shown)}
        entities={status === "done" ? ENTITIES : []}
        coverage={status === "done" ? "Covers 46 of 48 pages · 2 pages of scanned charts unreadable" : undefined}
        summarisedAt={at}
        model="Claude Sonnet"
        error="The model timed out after 60 seconds. Large scanned files can take longer – try again."
        openable
        length={length}
        onLengthChange={(l) => {
          setLength(l);
          run(l);
        }}
        onSummarise={() => run(length)}
        onRetry={() => run(length)}
        onCiteOpen={(c) => setNote(`Would open page ${c.page}.`)}
        onEntitySelect={(e) => setNote(`Would highlight every mention of “${e.label}”.`)}
        onOpen={() => setNote("Would open the PDF.")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || (status === "idle" ? "Press Summarise to stream a summary in. " : "Pick a page chip or a name to jump to it. ")}
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
            setSummary("");
            setShown(0);
            setNote("");
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
