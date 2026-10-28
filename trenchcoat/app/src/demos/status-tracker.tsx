import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { StatusTrackerStep } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional AI programme's authorization pipeline: nine gates, four cleared, the fifth pending with a finding open,
   the sixth blocked. "Clear gate 5" signs it off, so the line fills and the halo moves on to the blocked gate. */

const at = (m: number, d: number, y = 2026) => new Date(y, m - 1, d, 12).getTime();

const START: StatusTrackerStep[] = [
  {
    id: "scope",
    label: "Pre-registration & scope",
    status: "cleared",
    date: at(10, 12, 2025),
    detail: { summary: "Intended use, users and exclusions registered before any evaluation ran.", owner: "Programme office", items: [{ label: "Registration", value: "PR-2025-118", href: "#scope" }, { label: "Signed by", value: "R. Adeyemi" }] },
  },
  {
    id: "capability",
    label: "Capability assessment",
    status: "cleared",
    date: at(11, 8, 2025),
    detail: { summary: "Benchmarked against the six tasks in scope; two tasks narrowed.", owner: "Evaluation team", items: [{ label: "Report", value: "CA-0412", href: "#capability" }] },
  },
  { id: "calibration", label: "Calibration baseline", status: "cleared", date: at(12, 23, 2025), detail: { summary: "Confidence matches accuracy within 3 points across all tasks.", owner: "Evaluation team" } },
  { id: "red-team", label: "Red-team clearance", status: "cleared", date: at(2, 7), detail: { summary: "212 attack cases; 4 findings fixed and re-tested.", owner: "Security", items: [{ label: "Findings", value: "4 closed", href: "#red-team" }] } },
  {
    id: "adversarial",
    label: "Adversarial resilience",
    status: "pending",
    attention: "One high finding awaiting re-test",
    detail: { summary: "Prompt-injection suite passed; multi-turn jailbreak finding RT-212 waits on a re-test.", owner: "Security", items: [{ label: "Open finding", value: "RT-212", href: "#rt-212" }, { label: "Due", value: "Mar 14" }] },
  },
  {
    id: "ground-truth",
    label: "Ground-truth corpus validation",
    status: "blocked",
    note: "Waiting on data licence",
    detail: { summary: "The labelled corpus can't be used until the data-sharing licence is signed.", owner: "Data governance" },
  },
  { id: "pilot", label: "Operational pilot authorization", status: "not-reached" },
  { id: "deployment", label: "Full deployment authorization", status: "not-reached" },
  { id: "oversight", label: "Continuous oversight certification", status: "not-reached" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { StatusTracker } = ui;
  const [steps, setSteps] = useState(START);
  const [selected, setSelected] = useState<string | null>(null);
  const cleared = steps.find((s) => s.id === "adversarial")?.status === "cleared";
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <StatusTracker
        title="Programme authorization pipeline"
        noun="Gate"
        hint="pick a gate for its evidence record"
        steps={steps}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {cleared ? "Gate 5 cleared – the blocked gate is next. " : "Move with the arrow keys and press Enter, or click a gate. "}
        <button
          type="button"
          style={textButton}
          onClick={() =>
            setSteps(cleared ? START : steps.map((s) => (s.id === "adversarial" ? { ...s, status: "cleared", attention: undefined, date: at(3, 12), detail: { ...s.detail, summary: "RT-212 re-tested and closed; the suite passes." } } : s)))
          }
        >
          {cleared ? "Reset" : "Clear gate 5"}
        </button>
      </div>
    </div>
  );
}
