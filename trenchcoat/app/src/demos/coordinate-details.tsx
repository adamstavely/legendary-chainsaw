import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CoordinatePlace } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Field notes from a coastal survey with coordinates in three notations, plus a firmware version and a reading taken
   before the GPS locked – both look like coordinates but stay plain text. Hover, focus or right-click a position for
   its card; a moment after the page opens, the first card opens on its own. The "gazetteer" is a fake resolver in
   this file – no network: the first two places come back after a short wait, and the tide gauge fails once, so its
   card offers Retry. The map only loads when Show map is pressed. */

const TEXT = `Coastal survey – week 3 field notes

Kelp transect A starts at the north breakwater, 50°49′12″N 1°05′24″W, and runs 400 m east. Water samples were taken at 50.7980, -1.0912 on the falling tide. The tide gauge is at N 50.8021 W 1.1105 if anyone needs to recalibrate.

Logger firmware v2.10, 3.40 is installed; ignore the test reading 95.1234, 10.5678 – the GPS hadn't locked yet.`;

/** A small picture of a shore: sea, sand and a marker */
const shore = (sea: string, land: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="${sea}"/><path d="M0 34 C14 28 22 40 34 33 S50 26 56 30 V56 H0Z" fill="${land}"/><path d="M6 16 h14 M28 11 h18 M10 23 h10" stroke="rgba(255,255,255,.45)" stroke-width="1.5" stroke-linecap="round"/><circle cx="30" cy="30" r="4" fill="#fff"/><circle cx="30" cy="30" r="2" fill="#d9480f"/></svg>`,
  )}`;

const key = (lat: number, lng: number) => `${lat.toFixed(4)},${lng.toFixed(4)}`;
const GAZETTEER: Record<string, CoordinatePlace> = {
  [key(50.82, -1.09)]: {
    name: "North breakwater",
    kind: "Survey transect A",
    address: "Eastney shore",
    description: "Start of the 400 m kelp and seagrass transect, marked by a yellow post.",
    elevation: 3,
    timezone: "Europe/London",
    image: shore("#4f86b8", "#d9c79a"),
  },
  [key(50.798, -1.0912)]: {
    name: "Sampling point W3",
    kind: "Water sampling site",
    description: "Surface and 2 m samples, taken two hours after high water.",
    timezone: "Europe/London",
    image: shore("#3d7aa0", "#b9b08a"),
  },
  [key(50.8021, -1.1105)]: {
    name: "Harbour tide gauge",
    kind: "Tide gauge",
    address: "Pier head, east side",
    elevation: 4,
    timezone: "Europe/London",
  },
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CoordinateDetails } = ui;
  const [run, setRun] = useState(0);
  const [log, setLog] = useState("");
  const box = useRef<HTMLDivElement>(null);
  // Once per run: open the first card, so the page shows one without a hover
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelector("tc-coordinate-details")?.openCard(0), 900);
    return () => clearTimeout(t);
  }, [run]);
  // A fresh gazetteer per run, so Reset shows loading and the failure again
  const resolve = useMemo(() => {
    let failed = false;
    void run;
    return (lat: number, lng: number, signal: AbortSignal) =>
      new Promise<CoordinatePlace | null>((done, fail) => {
        const t = setTimeout(() => {
          const k = key(lat, lng);
          if (k === key(50.8021, -1.1105) && !failed) {
            failed = true;
            fail(new Error("The gazetteer didn't answer"));
            return;
          }
          done(GAZETTEER[k] ?? null);
        }, 700);
        signal.addEventListener("abort", () => clearTimeout(t));
      });
  }, [run]);

  return (
    <div ref={box} style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <CoordinateDetails
        key={run}
        text={TEXT}
        resolve={resolve}
        onOpenChange={(p) => p && setLog(`Card open for ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`)}
        onCopy={(text, notation) => setLog(`Copied ${notation === "dms" ? "DMS" : "decimal"} ${text}`)}
        onOpenMap={(d) => setLog(`Opening ${d.provider.name}`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Hover, focus or right-click a coordinate to see the place"}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRun((n) => n + 1);
            setLog("");
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
