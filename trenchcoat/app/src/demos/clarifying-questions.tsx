import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ClarifyingAnswers, ClarifyingQuestion } from "../../../src/elements/react";
import { bubble, caption, textButton } from "../demo-kit";

const QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "length",
    prompt: "How long should the deck be?",
    kind: "single",
    options: [
      { value: "short", label: "Short", description: "5 slides, a 10-minute slot" },
      { value: "standard", label: "Standard", description: "10–12 slides" },
      { value: "deep", label: "Deep dive", description: "20 slides with an appendix" },
    ],
  },
  {
    id: "areas",
    prompt: "Which areas should it cover?",
    hint: "I'll give each one its own section.",
    kind: "multiple",
    options: [
      { value: "revenue", label: "Revenue" },
      { value: "hiring", label: "Hiring" },
      { value: "product", label: "Product launches" },
      { value: "risks", label: "Risks" },
    ],
  },
  { id: "avoid", prompt: "Anything to leave out?", kind: "text", placeholder: "e.g. no customer names", optional: true },
];

/** How the agent reads the answers back */
function plan(a: ClarifyingAnswers) {
  const length = a.length?.decide ? "a deck of the length I think fits" : ({ short: "a 5-slide deck", standard: "a 10-slide deck", deep: "a 20-slide deck" } as Record<string, string>)[a.length?.values?.[0] ?? ""] ?? "a deck";
  const labels: Record<string, string> = { revenue: "revenue", hiring: "hiring", product: "product launches", risks: "risks" };
  const areas = a.areas?.decide ? "the areas that moved most this quarter" : (a.areas?.values ?? []).map((v) => labels[v]).join(", ") || "the quarter";
  const avoid = a.avoid?.text?.trim() ? `, leaving out ${a.avoid.text.trim().replace(/^no /, "")}` : "";
  return `Got it – drafting ${length} on ${areas}${avoid}.`;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ClarifyingQuestions } = ui;
  const [answers, setAnswers] = useState<ClarifyingAnswers>({});
  const [sent, setSent] = useState(false);
  const [run, setRun] = useState(0);
  const reset = () => {
    setAnswers({});
    setSent(false);
    setRun((n) => n + 1);
  };

  return (
    <div style={{ width: "100%", maxWidth: 500, display: "grid", gap: 12 }}>
      <div style={{ ...bubble, justifySelf: "end", maxWidth: "80%", padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.45 }}>
        Put together the Q3 board update from the planning docs.
      </div>
      <ClarifyingQuestions
        key={run}
        title="A few questions before I start"
        intro="I'll draft the deck from the Q3 planning docs once I know these."
        questions={QUESTIONS}
        value={answers}
        onChange={setAnswers}
        sent={sent}
        onSend={(value) => {
          setAnswers(value);
          setSent(true);
        }}
      />
      {sent ? <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>{plan(answers)}</div> : null}
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{sent ? "Sent as one reply" : "Arrow keys pick · Space ticks · Enter moves on, and sends from the last"}</span>
        <button type="button" onClick={reset} style={textButton}>
          Ask again
        </button>
      </div>
    </div>
  );
}
