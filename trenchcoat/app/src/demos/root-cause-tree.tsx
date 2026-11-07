import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RootCauseFailure, RootCauseHypothesis, RootCauseStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's nightly import of field-survey data failed. An agent works through what could have
   caused it – a schema change in the survey CSV, stale station codes, the geocoder timing out, a units mix-up,
   duplicate sample IDs – ruling them out one by one until the cause is confirmed. */

const FAILURE: RootCauseFailure = { title: "Nightly survey import failed", ref: "import.log", detail: "4 of 12 batches" };

const NOTES: Record<string, string> = {
  schema: "The November survey file has a new “observer” column before depth, and the parser reads columns by position.",
  column: "schema.yaml was updated on 3 November; the import's copy wasn't.",
  position: "parse.py takes depth from column 7; in the new file column 7 is the observer's initials.",
  stations: "All 212 station codes in the failed batches are in the current register.",
  geocode: "Every geocoding call returned within 900 ms; no timeouts in the window.",
  units: "Depths in the batches that passed are in metres, like the rest.",
  dupes: "No sample ID appears twice across the 12 batches.",
};

/** The agent's progress, one step at a time */
const STEPS: Record<string, RootCauseStatus>[] = [
  {},
  { geocode: "checking" },
  { geocode: "ruled-out", stations: "checking" },
  { geocode: "ruled-out", stations: "ruled-out", schema: "checking", column: "checking" },
  { geocode: "ruled-out", stations: "ruled-out", schema: "checking", column: "confirmed", position: "checking" },
  { geocode: "ruled-out", stations: "ruled-out", schema: "confirmed", column: "confirmed", position: "confirmed" },
];

function tree(step: number): RootCauseHypothesis[] {
  const s = STEPS[step];
  const node = (id: string, title: string, ref: string, extra: Partial<RootCauseHypothesis> = {}): RootCauseHypothesis => ({
    id,
    title,
    ref,
    status: s[id] ?? "unchecked",
    note: s[id] && s[id] !== "checking" ? NOTES[id] : undefined,
    ...extra,
  });
  return [
    node("schema", "Survey CSV schema changed", "survey-2026-11.csv", {
      gate: "and",
      children: [node("column", "A new column shifts depth", "schema.yaml"), node("position", "Parser reads columns by position", "parse.py")],
    }),
    node("stations", "Station codes are stale", "stations.json"),
    node("geocode", "Geocoding service timed out", "geocode.log"),
    node("units", "Depth logged in feet, not metres", "units.ts"),
    node("dupes", "Duplicate sample IDs", "samples.db"),
  ];
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RootCauseTree } = ui;
  const [step, setStep] = useState(3);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!running) return;
    if (step >= STEPS.length - 1) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setStep((n) => n + 1), 1300);
    return () => clearTimeout(t);
  }, [running, step]);
  return (
    <div style={{ width: "100%", maxWidth: 1000, display: "grid", gap: 8 }}>
      <RootCauseTree
        title="Why did the import fail?"
        description="The data steward agent checks each suspect against the evidence."
        failure={FAILURE}
        hypotheses={tree(step)}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {step === STEPS.length - 1 ? "Cause found – open the failure or a lit node for the evidence. " : "Open a node for its evidence, or watch the agent work it out. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setSelected(null);
            setStep(0);
            setRunning(true);
          }}
        >
          Run the investigation
        </button>
      </div>
    </div>
  );
}
