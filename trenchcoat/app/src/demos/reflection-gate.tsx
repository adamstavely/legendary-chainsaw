import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ReflectionGateSubmission, ReflectionMode } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* One question – can a hosting contract be ended early? – and the four ways to pause before relying on the answer.
   Pick a mode above; what each one submits shows under it. Skip is on, as an app that lets people opt out would set it. */

const ANSWER =
  "Yes. Under clause 14 either side can end the agreement with 30 days' written notice. Northwind must confirm the cancellation in writing within 5 business days, and any prepaid months after the end date are refunded.";

const CLAIMS = [
  { id: "notice", text: "Either side can end the agreement with 30 days' written notice" },
  { id: "confirm", text: "Northwind must confirm within 5 business days" },
  { id: "refund", text: "Prepaid months after the end date are refunded" },
];

const MODES: { value: ReflectionMode; label: string }[] = [
  { value: "intent", label: "Intent" },
  { value: "prior", label: "Prior" },
  { value: "reformulate", label: "Reformulate" },
  { value: "checkpoint", label: "Checkpoint" },
];

const said = (s: ReflectionGateSubmission) => Object.values(s.value).filter(Boolean).join(" · ");

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ReflectionGate, SegmentedControl } = ui;
  const [mode, setMode] = useState<ReflectionMode>("intent");
  const [run, setRun] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  // Deadline mode: the short, single-field version of each pause
  const [brief, setBrief] = useState(false);

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12, justifyItems: "stretch" }}>
      <div style={{ justifySelf: "start", maxWidth: "100%", overflowX: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
        <SegmentedControl
          aria-label="Reflection mode"
          size="sm"
          options={MODES}
          value={mode}
          onChange={(v) => {
            setMode(v as ReflectionMode);
            setLast(null);
          }}
        />
        <SegmentedControl
          aria-label="Time pressure"
          size="sm"
          options={[
            { value: "full", label: "Full" },
            { value: "brief", label: "Deadline" },
          ]}
          value={brief ? "brief" : "full"}
          onChange={(v) => {
            setBrief(v === "brief");
            setLast(null);
          }}
        />
      </div>
      <ReflectionGate
        key={`${mode}-${brief}-${run}`}
        mode={mode}
        brief={brief}
        answer={ANSWER}
        claims={CLAIMS}
        onSubmit={(s) => setLast(`Submitted ${s.mode}${s.brief ? " (short version)" : ""}: ${said(s)}`)}
        onSkip={(m) => setLast(`Skipped ${m}`)}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {last ?? "Can we end the Northwind hosting contract early? – think first, then rely on the answer."}{" "}
        {last && (
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setRun((n) => n + 1);
              setLast(null);
            }}
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
