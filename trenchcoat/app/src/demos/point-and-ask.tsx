import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PointMark } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Page 4 of a research institute's annual report, drawn here as SVG so nothing loads. A pin sits on the tallest bar
 * and a box around the findings table, each with a question; Ask streams made-up answers back, word by word */

function page() {
  const bars = [62, 88, 74, 112]
    .map((h, i) => `<rect x="${70 + i * 58}" y="${330 - h * 1.6}" width="36" height="${h * 1.6}" rx="4" fill="${i === 3 ? "#2f7d6d" : "#8cc5b6"}"/><text x="${88 + i * 58}" y="352" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#4b5563">Q${i + 1}</text>`)
    .join("");
  const rows = [
    ["Vendor checks", "14"],
    ["Access reviews", "9"],
    ["Data retention", "6"],
    ["Expense claims", "11"],
  ]
    .map(([a, b], i) => `<text x="356" y="${196 + i * 36}" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">${a}</text><text x="586" y="${196 + i * 36}" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">${b}</text><path d="M356 ${208 + i * 36}H588" stroke="#e5e7eb"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#fbfaf7"/>
<text x="48" y="62" font-family="Georgia, serif" font-size="26" fill="#111827">Audit activity, 2026</text>
<text x="48" y="90" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">Northfield Research Institute · Annual report, page 4</text>
<rect x="48" y="120" width="264" height="250" rx="10" fill="#ffffff" stroke="#e5e7eb"/>${bars}
<rect x="340" y="120" width="264" height="250" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
<text x="356" y="152" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#374151">Findings by area</text>${rows}
<path d="M48 412H592M48 436H480" stroke="#d1d5db" stroke-width="8" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const SRC = page();

const START: PointMark[] = [
  { id: "q4", kind: "pin", x: 0.3, y: 0.42, question: "Why is Q4 the highest?" },
  { id: "table", kind: "box", x: 0.53, y: 0.27, w: 0.42, h: 0.5, question: "Which area grew most?" },
];
const ANSWERS: Record<string, string> = {
  q4: "Q4 holds the year-end vendor checks, which the report says were brought forward from Q1.",
  table: "Vendor checks, at 14 findings – up from 8 the year before, according to the note under the table.",
  "*": "The chart counts audits and the table counts findings, so the two don't add up to the same total.",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PointAndAsk } = ui;
  const [marks, setMarks] = useState<PointMark[]>(START);
  const [answers, setAnswers] = useState<Record<string, string>>({ q4: ANSWERS.q4 });
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const stream = (ids: string[], overall: boolean) => {
    window.clearInterval(timer.current);
    let n = 0;
    setBusy(true);
    timer.current = window.setInterval(() => {
      n += 3;
      const next: Record<string, string> = {};
      for (const id of ids) next[id] = (ANSWERS[id] ?? "The page doesn't say.").split(" ").slice(0, n).join(" ");
      setAnswers(next);
      if (overall) setAnswer(ANSWERS["*"].split(" ").slice(0, n).join(" "));
      if (n > 24) {
        window.clearInterval(timer.current);
        setBusy(false);
      }
    }, 120);
  };

  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 12 }}>
      <PointAndAsk
        title="Ask about page 4"
        description="Annual report · Northfield Research Institute"
        src={SRC}
        alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings by area"
        marks={marks}
        onMarksChange={setMarks}
        defaultQuestion="Do the chart and the table agree?"
        answers={answers}
        answer={answer}
        busy={busy}
        onAsk={(ask, e) => {
          e.preventDefault();
          stream(
            ask.marks.map((m) => m.id),
            !!ask.question,
          );
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Click the page to drop a pin, drag to draw a box, then Ask.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setMarks(START);
            setAnswers({ q4: ANSWERS.q4 });
            setAnswer("");
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
