import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's data store: terabytes held in each storage tier by month, stacked (“Show shares” stacks
   them to 100%). */

const ROWS = [
  { month: "2026-01", hot: 120, warm: 340, archive: 610 },
  { month: "2026-02", hot: 134, warm: 352, archive: 630 },
  { month: "2026-03", hot: 151, warm: 349, archive: 668 },
  { month: "2026-04", hot: 148, warm: 371, archive: 702 },
  { month: "2026-05", hot: 166, warm: 390, archive: 731 },
  { month: "2026-06", hot: 182, warm: 402, archive: 760 },
  { month: "2026-07", hot: 175, warm: 425, archive: 812 },
  { month: "2026-08", hot: 190, warm: 431, archive: 845 },
  { month: "2026-09", hot: 204, warm: 448, archive: 880 },
  { month: "2026-10", hot: 215, warm: 466, archive: 921 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AreaChart } = ui;
  const [percent, setPercent] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <AreaChart title="Storage by tier" description="Terabytes held at month end" unit=" TB" data={ROWS} x="month" y={["hot", "warm", "archive"]} stack={percent ? "percent" : "stacked"} />
      <div style={{ ...caption, textAlign: "center" }}>
        <button type="button" style={textButton} onClick={() => setPercent(!percent)}>
          {percent ? "Show terabytes" : "Show shares"}
        </button>
      </div>
    </div>
  );
}
