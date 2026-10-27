import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgreementTurn } from "../../../src/elements/react";
import { bubble, caption, surface, textButton } from "../demo-kit";

/* A product manager works out why sign-ups dropped. Early on the assistant pushed back once; then the questions start
   leading ("it's the form, isn't it?") and the answers start agreeing. At two agreements in a row the tracker turns
   amber; "Show the other side" brings in the counter-argument, which breaks the run. The script stops once it's
   amber – nothing ticks after that. */

type Exchange = AgreementTurn & { ask: string; answer: string };

const HISTORY: Exchange[] = [
  { id: "t1", stance: "agreed", label: "Where people drop off", ask: "Which onboarding step loses the most people?", answer: "Step 2, the company details form – 38% leave there." },
  { id: "t2", stance: "pushed-back", label: "Cutting the form", ask: "So we should cut the form to two fields?", answer: "Not yet – the drop at step 2 started the week paid ads launched, and the form didn't change that week." },
  { id: "t3", stance: "neutral", label: "Mobile funnel", ask: "What does the funnel look like on mobile?", answer: "Mobile and desktop lose people at about the same rate." },
];
const SCRIPT: Exchange[] = [
  { id: "t4", stance: "agreed", label: "Long forms", ask: "It's the form length though, isn't it? Long forms always hurt.", answer: "Yes – long forms are one of the most common causes of drop-off." },
  { id: "t5", stance: "agreed", label: "Removing the phone field", ask: "And removing the phone field should fix most of it?", answer: "Removing it should help noticeably." },
  { id: "t6", stance: "agreed", label: "Shipping this sprint", ask: "Great – so we ship that this sprint and expect a recovery?", answer: "Yes, that's a reasonable plan." },
];
const COUNTER: Exchange = {
  id: "t7",
  stance: "pushed-back",
  label: "The other side",
  ask: "Show me the other side.",
  answer: "The drop began the week paid ads launched, and visitors from ads leave at step 2 three times as often as others. A shorter form may help a little; the traffic mix explains more of it.",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgreementTracker } = ui;
  const [n, setN] = useState(0);
  const [countered, setCountered] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (n >= SCRIPT.length || countered) return;
    const t = setTimeout(() => setN((x) => x + 1), 1600);
    return () => clearTimeout(t);
  }, [n, countered]);

  const turns: Exchange[] = [...HISTORY, ...SCRIPT.slice(0, n), ...(countered ? [COUNTER] : [])];
  const last = turns[turns.length - 1];
  const counter = () => {
    setCountered(true);
    setNote("The counter-argument broke the run");
  };

  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 14 }}>
      <div style={{ ...surface, borderRadius: 14, padding: 12, display: "grid", gap: 10 }}>
        <div style={{ ...bubble, justifySelf: "end", maxWidth: "85%", padding: "7px 11px", borderRadius: 14, fontSize: 13, lineHeight: 1.45 }}>{last.ask}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: "92%" }}>{last.answer}</div>
        <AgreementTracker layout="inline" turns={turns} onRequestCounter={counter} />
      </div>
      <AgreementTracker scope="Sign-up drop-off · this session" turns={turns} onRequestCounter={counter} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {note || (n < SCRIPT.length ? "The questions start leading…" : "Two agreements in a row – the tracker turns amber")}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setN(0);
            setCountered(false);
            setNote("");
          }}
        >
          Replay
        </button>
      </p>
    </div>
  );
}
