import { useState } from "react";
import type * as UI from "../../../../src/elements/react";

const STAGES = [
  { value: "overview", label: "Overview" },
  { value: "atoms", label: "Atoms" },
  { value: "molecule", label: "Molecule" },
  { value: "organism", label: "Organism" },
  { value: "template", label: "Template" },
  { value: "page", label: "Page" },
] as const;
type Stage = (typeof STAGES)[number]["value"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AtomicDesign, SegmentedControl } = ui;
  const [stage, setStage] = useState<Stage>("overview");
  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 12, justifyItems: "center" }}>
      <SegmentedControl aria-label="Stage" size="sm" value={stage} onChange={setStage} options={[...STAGES]} />
      <AtomicDesign stage={stage} />
    </div>
  );
}
