import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { WebVital, WebVitalDevice } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Field data for the grants list of a research institute's staging site, on phones and on desktops. The numbers are
   made up. */

const DATA: Record<WebVitalDevice, WebVital[]> = {
  mobile: [
    { id: "lcp", value: 3120, history: [2650, 2810, 2900, 3240, 3050, 3120] },
    { id: "inp", value: 184, history: [240, 220, 210, 190, 176, 184] },
    { id: "cls", value: 0.28, history: [0.05, 0.06, 0.12, 0.22, 0.3, 0.28] },
    { id: "fcp", value: 1640, history: [1820, 1750, 1700, 1690, 1610, 1640] },
    { id: "ttfb", value: 690, history: [720, 700, 680, 710, 670, 690] },
  ],
  desktop: [
    { id: "lcp", value: 1480, history: [1600, 1550, 1520, 1500, 1460, 1480] },
    { id: "inp", value: 72, history: [90, 84, 80, 76, 70, 72] },
    { id: "cls", value: 0.04, history: [0.03, 0.04, 0.05, 0.04, 0.04, 0.04] },
    { id: "fcp", value: 820, history: [900, 870, 850, 840, 810, 820] },
    { id: "ttfb", value: 410, history: [430, 420, 400, 415, 405, 410] },
  ],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { WebVitals } = ui;
  const [device, setDevice] = useState<WebVitalDevice>("mobile");
  const [fixed, setFixed] = useState(false);
  const metrics = fixed && device === "mobile" ? DATA.mobile.map((m) => (m.id === "cls" ? { ...m, value: 0.06, history: [...(m.history ?? []), 0.06] } : m)) : DATA[device];
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <WebVitals description="/grants · last 28 days" metrics={metrics} device={device} onDeviceChange={setDevice} />
      <div style={{ ...caption, textAlign: "center" }}>
        Switch between mobile and desktop.{" "}
        <button type="button" style={textButton} onClick={() => setFixed((f) => !f)}>
          {fixed ? "Undo the layout fix" : "Reserve space for the banner"}
        </button>
      </div>
    </div>
  );
}
