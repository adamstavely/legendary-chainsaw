import type * as UI from "../../../src/elements/react";
import type { PrioritisationItem } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional research institute weighing its 2027 projects. Two land on the same spot and gather into one point –
   click it to fan them out. Drag a point, or focus it and use the arrow keys. */

const ITEMS: PrioritisationItem[] = [
  { id: "portal", label: "Open data portal", value: 8.5, effort: 3, group: "Data" },
  { id: "reef", label: "Coral reef sensor network", value: 9, effort: 8, group: "Marine" },
  { id: "booking", label: "Lab booking app", value: 6, effort: 2.5, group: "Facilities" },
  { id: "archive", label: "Digitise the specimen archive", value: 7, effort: 9, group: "Collections" },
  { id: "intranet", label: "Intranet redesign", value: 3, effort: 6.5, group: "Comms" },
  { id: "signage", label: "Wayfinding signage", value: 2.5, effort: 1.5, group: "Facilities" },
  { id: "newsletter", label: "Monthly newsletter", value: 2.5, effort: 1.5, group: "Comms", note: "Same spot as signage" },
  { id: "grants", label: "Grant tracking dashboard", value: 7.5, effort: 5.5, group: "Finance" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PrioritisationMatrix } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 10 }}>
      <PrioritisationMatrix title="2027 portfolio" description="Value against effort, scored by the steering group" defaultItems={ITEMS} />
      <div style={{ ...caption, textAlign: "center" }}>Drag a point or use the arrow keys (Shift for bigger steps); click the 2 to fan out the pair.</div>
    </div>
  );
}
