import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* Who read the Larkfield Institute's sensor-calibration paper in its first year. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AudienceMix } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <AudienceMix
        title="Who is reading"
        description="Larkfield Institute · sensor-calibration paper, first 12 months."
        sectors={[
          { label: "Academic", value: 5420 },
          { label: "Industry", value: 2310 },
          { label: "Government", value: 1400 },
          { label: "Nonprofit", value: 870 },
        ]}
        split={{ internal: 6, external: 94 }}
        places={[
          { label: "United States", value: 38 },
          { label: "China", value: 14 },
          { label: "Germany", value: 9 },
          { label: "United Kingdom", value: 7 },
          { label: "Japan", value: 6 },
          { label: "Other", value: 26 },
        ]}
      />
      <div style={{ ...caption, textAlign: "center" }}>Point at a row, or move with the arrow keys.</div>
    </div>
  );
}
