import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An auditor writing up a finding; the "model" is a few canned continuations picked by the last words typed */

const START = "Access reviews for the payments vendor were";
const FIRST = " last completed in March, two quarters past the policy's 90-day cycle.";

const CONTINUATIONS: [RegExp, string][] = [
  [/cycle\.\s*$/, " Three accounts belonging to departed staff were still active at the time of testing."],
  [/testing\.\s*$/, " We recommend the vendor close these accounts and move reviews onto a calendar the risk team can see."],
  [/see\.\s*$/, " Management agreed and set a completion date of 30 June."],
  [/were\s*$/, FIRST],
  [/\bthe\s*$/, " review period"],
];

function suggest(text: string, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    const hit = CONTINUATIONS.find(([re]) => re.test(text));
    const timer = setTimeout(() => resolve(hit ? hit[1] : ""), 450);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GhostCompletion } = ui;
  const [value, setValue] = useState(START);
  const [taken, setTaken] = useState(0);
  const [key, setKey] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <GhostCompletion
        key={key}
        title="Finding 4 – Access reviews"
        label="Finding"
        value={value}
        onValueChange={setValue}
        suggestion={FIRST}
        suggest={suggest}
        onAccept={() => setTaken((n) => n + 1)}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <span>Press Tab to take the suggestion, Ctrl/⌘ + → for one word. {taken ? `Taken ${taken} so far.` : ""}</span>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setValue(START);
            setTaken(0);
            setKey((k) => k + 1);
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
