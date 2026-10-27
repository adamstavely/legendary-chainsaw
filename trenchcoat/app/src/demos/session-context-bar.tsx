import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { SessionTerm } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* A research session's declared terms, kept under the page header while the work scrolls beneath. A moment after
   the page opens the budget ticks up; a little later the deadline is brought forward and the posture tightens –
   each change flashes once and is announced. Knowledge and Posture are editable: the app opens its editor there
   (this demo steps through the choices). Narrow, the rest go behind "+N more". */

const KNOWLEDGE = ["Sources + model", "Sources only", "Model only"];
const POSTURE: { value: string; tone: SessionTerm["tone"] }[] = [
  { value: "Normal", tone: "success" },
  { value: "Elevated", tone: "warning" },
  { value: "Restricted", tone: "danger" },
];
const START: SessionTerm[] = [
  { id: "intent", value: "Pick a supplier", description: "The decision this session supports: which supplier gets the Q3 order" },
  { id: "budget", value: "62%", meter: 0.62, description: "$310 of the session's $500 spent" },
  { id: "posture", value: "Normal", tone: "success", editable: true },
  { id: "knowledge", value: KNOWLEDGE[0], editable: true, description: "Answers may use the attached sources and the model's own knowledge" },
  { id: "deadline", value: "Fri 17:00" },
  { id: "scope", value: "Q3 bids" },
  { id: "review", value: "Before sharing" },
  { id: "release", value: "Internal only" },
];

const LINES = [
  "Supplier A quotes 6% lower per unit, with a 12-week lead time.",
  "Supplier B ships in 5 weeks and holds stock locally.",
  "Both meet the packaging standard; B's audit is more recent.",
  "A's contract has a volume floor that the forecast may miss.",
  "Late deliveries cost more than the price gap in two of the last four quarters.",
  "Open question: can A shorten its lead time for the first order?",
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SessionContextBar } = ui;
  const [terms, setTerms] = useState(START);
  const [note, setNote] = useState("Watch the budget and the posture – changes flash once and are announced.");
  const timers = useRef<number[]>([]);
  const patch = (id: string, change: Partial<SessionTerm>) => setTerms((list) => list.map((t) => (t.id === id ? { ...t, ...change } : t)));

  const play = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    setTerms(START);
    setNote("Watch the budget and the posture – changes flash once and are announced.");
    timers.current = [
      window.setTimeout(() => {
        patch("budget", { value: "71%", meter: 0.71, description: "$355 of the session's $500 spent" });
        setNote("A long answer used 9% of the budget.");
      }, 2200),
      window.setTimeout(() => {
        setTerms((list) => list.map((t) => (t.id === "deadline" ? { ...t, value: "Today 15:00" } : t.id === "posture" ? { ...t, value: "Elevated", tone: "warning" } : t.id === "budget" ? { ...t, value: "78%", meter: 0.78, description: "$390 of the session's $500 spent" } : t)));
        setNote("The deadline moved to today, so the posture tightened.");
      }, 4800),
    ];
  };
  useEffect(() => {
    play();
    return () => timers.current.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <div style={{ ...surface, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))" }}>
          <strong style={{ fontSize: 15, fontWeight: 600 }}>Supplier review</strong>
          <span style={{ ...caption }}>Session 14</span>
        </div>
        <div style={{ height: 220, overflow: "auto" }}>
          <SessionContextBar
            terms={terms}
            onEdit={(term) => {
              if (term.id === "knowledge") {
                const next = KNOWLEDGE[(KNOWLEDGE.indexOf(term.value) + 1) % KNOWLEDGE.length];
                patch("knowledge", { value: next });
                setNote(`Your app opens its editor at the chip; this demo steps through the choices: ${next}.`);
              }
              if (term.id === "posture") {
                const at = POSTURE.findIndex((p) => p.value === term.value);
                const next = POSTURE[(at + 1) % POSTURE.length];
                patch("posture", next);
                setNote(`Posture set to ${next.value}.`);
              }
            }}
          />
          <ol style={{ margin: 0, padding: "12px 16px 16px 36px", display: "grid", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
            {LINES.concat(LINES).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        </div>
      </div>
      <span style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button type="button" style={textButton} onClick={play}>
          Play again
        </button>
      </span>
    </div>
  );
}
