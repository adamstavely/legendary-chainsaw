import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A maintenance notice from a fictional research institute, with times written in several zones to hover or focus.
   The tooltip shows each one in the reader's zone – the browser's, or one picked below. "Version 2.4.1", "room
   14-10" and "07:30" (no zone) stay plain. A moment after the page opens, the first tooltip opens on its own. */

const TEXT = `Planned maintenance – archive search, 8 Nov

The index rebuild starts at 06:00 UTC and should be done by 07:30. Search is read-only from 05:30–09:00 UTC; uploads queue and finish after that.

The Boston team checks results at 9 am ET, Berlin at 16:00 CET. If it runs late, the fallback window is 2026-11-09 22:00 UTC. Questions to room 14-10 before 6:30 PM PST, please – version 2.4.1 is unaffected.`;

const ZONES = [undefined, "America/New_York", "Europe/Berlin", "Asia/Tokyo"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TimeDetails } = ui;
  const [zone, setZone] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelector("tc-time-details")?.openCard(0), 900);
    return () => clearTimeout(t);
  }, []);
  const tz = ZONES[zone];

  return (
    <div ref={box} style={{ width: "100%", maxWidth: 600, display: "grid", gap: 10, paddingTop: 72 }}>
      <TimeDetails text={TEXT} date="2026-11-08" timeZone={tz} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        Hover or focus a time – shown in {tz ?? "your browser's zone"}{" "}
        <button type="button" style={textButton} onClick={() => setZone((z) => (z + 1) % ZONES.length)}>
          Try {ZONES[(zone + 1) % ZONES.length] ?? "your own zone"}
        </button>
      </p>
    </div>
  );
}
