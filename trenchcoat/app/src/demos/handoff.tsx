import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { HandoffItem, HandoffReturn, HandoffStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l1.7 4.8 4.8 1.7-4.8 1.7L8 14.5l-1.7-4.8L1.5 8l4.8-1.7z" fill="#d97757" />
  </svg>
);

const DONE: HandoffItem[] = [
  { id: "fares", label: "Compared fares for Nov 12–15", meta: "14 fares" },
  { id: "hold", label: "Held 6 seats on TP 1351", meta: "€1,284" },
  { id: "pax", label: "Filled in passenger details", meta: "6 of 6" },
  { id: "code", label: "Applied the company travel code" },
  { id: "bags", label: "Checked the baggage allowance", meta: "23 kg" },
];

const NEEDS: HandoffItem[] = [
  { id: "signin", label: "Sign in with the code sent to •• 42" },
  { id: "seats", label: "Check the seat hold is still there" },
  { id: "page", label: "Leave the checkout page open" },
];

/** The steps arrive one by one, as the run gets there – then the agent stops and hands over */
const STEP_MS = 450;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Handoff } = ui;
  const [shown, setShown] = useState(1);
  const [status, setStatus] = useState<HandoffStatus>("waiting");
  const [result, setResult] = useState<HandoffReturn | null>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (shown >= DONE.length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [shown]);

  const reset = () => {
    setShown(1);
    setStatus("waiting");
    setResult(null);
    setRun((n) => n + 1);
  };

  return (
    <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 8 }}>
      <Handoff
        key={run}
        agent={{ name: "Scout", model: "Claude Sonnet", avatar: <Star /> }}
        task="Book the Lisbon offsite flights"
        step="Step 4 of 7"
        ask="sign in to TAP Air"
        blocker="Sign-in required"
        reason="The airline texts a one-time code to the travel account's phone. I can't read it, and I shouldn't try."
        done={DONE.slice(0, shown)}
        needs={NEEDS}
        status={status}
        onStatusChange={setStatus}
        onReturn={setResult}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {status === "waiting" && "Scout stopped and is waiting for you."}
        {status === "active" && "Tick off what you did, then hand it back."}
        {status === "returned" && result && (
          <>
            Scout resumed at step 5 with {result.checked.length} of {NEEDS.length} done{result.note ? " and your note" : ""}.{" "}
            <button type="button" style={textButton} onClick={reset}>
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}
