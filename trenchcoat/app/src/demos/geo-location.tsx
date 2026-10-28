import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { GeoPoint } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's field sites: a weather mast, a lake buoy and the field station itself. The
   coordinates are made up. The map waits behind Show map, so the gallery loads nothing from another site. */

const SITES: GeoPoint[] = [
  { id: "mast", label: "North weather mast", latitude: 57.04121, longitude: -3.61274, zoom: 13 },
  { id: "buoy", label: "Lochside sensor buoy", latitude: 57.11853, longitude: -3.82406, zoom: 14 },
  { id: "station", label: "Glen Ardach field station", latitude: 56.98712, longitude: -3.70218, zoom: 15 },
];
const BAD: GeoPoint[] = [...SITES.slice(0, 2), { id: "typo", label: "Imported record 118", latitude: 157.04, longitude: -3.61 }];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GeoLocation } = ui;
  const [broken, setBroken] = useState(false);
  const [selected, setSelected] = useState<string | null>("mast");
  const points = broken ? BAD : SITES;
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 8 }}>
      <GeoLocation title="Field sites" description="Ardach Institute · upland monitoring" points={points} selected={selected} onSelectedChange={setSelected} />
      <div style={{ ...caption, textAlign: "center" }}>
        Switch between sites, flip to DMS, or open one in a mapping tool.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setBroken(!broken);
            setSelected(broken ? "mast" : "typo");
          }}
        >
          {broken ? "Fix the bad record" : "Show a bad record"}
        </button>
      </div>
    </div>
  );
}
