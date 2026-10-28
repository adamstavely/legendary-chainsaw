import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RoutineDraft } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research group's weekly literature check, set up as a routine. The demo's clock is fixed – a Wednesday
   afternoon in Los Angeles – so the next run reads the same on every visit. */

const NOW = Date.UTC(2026, 9, 28, 19, 0); // Wed 28 Oct 2026, 12:00 in Los Angeles

const START: RoutineDraft = {
  name: "Coral bleaching study updates",
  frequency: "weekly",
  weekday: 4,
  dayOfMonth: 1,
  time: "13:45",
  firstRun: "scheduled",
  notify: "updates",
  instructions:
    "Since the last run, look for newly published peer-reviewed studies and notable preprints on coral bleaching recovery, including heat-tolerant strains, reef restoration and water-quality interventions. Report only materially new evidence; separate lab findings from field results and note limitations. Cite the original studies with publication dates, avoid repeating earlier updates, and post a message only. If nothing consequential is new, say so briefly.",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RoutineForm } = ui;
  const [value, setValue] = useState<RoutineDraft>(START);
  const [said, setSaid] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <RoutineForm
        value={value}
        onValueChange={setValue}
        timeZone="America/Los_Angeles"
        now={NOW}
        onCreate={(v, next) => setSaid(`Created “${v.name}” – next run ${next ? new Date(next).toUTCString().slice(0, 22) : "–"} UTC.`)}
        onDismiss={() => setSaid("Dismissed.")}
        onOpenRoutines={() => {
          setSaid("Would open the Routines page.");
          return false;
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said ?? "Change the frequency or time and watch the next run, or clear the name and press Create."}{" "}
        <button type="button" style={textButton} onClick={() => setValue({ ...START, frequency: "monthly", dayOfMonth: 31, time: "08:00" })}>
          Monthly on the 31st
        </button>
      </div>
    </div>
  );
}
