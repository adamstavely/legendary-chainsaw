import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FingerPosition, FingerPrint } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A new starter's access-badge enrolment at a live-scan kiosk: most prints are good, the left index is smudged, the
   right ring finger is bandaged and the left little finger hasn't been scanned yet. "Recapture" rescans the two. */

const AT = new Date(2026, 9, 26, 9, 40).getTime();
const DEVICE = "Live-scan kiosk · Lobby 2";

const START: FingerPrint[] = [
  { position: 1, status: "captured", quality: 1, pattern: "whorl", captured: AT, device: DEVICE },
  { position: 2, status: "captured", quality: 2, pattern: "loop", captured: AT, device: DEVICE },
  { position: 3, status: "captured", quality: 2, pattern: "loop", captured: AT, device: DEVICE },
  { position: 4, status: "bandaged", note: "Cut on the fingertip – recapture booked for next week.", pattern: "whorl" },
  { position: 5, status: "captured", quality: 3, pattern: "loop", captured: AT, device: DEVICE },
  { position: 6, status: "captured", quality: 1, pattern: "whorl", captured: AT, device: DEVICE },
  { position: 7, status: "poor", quality: 5, pattern: "arch", captured: AT, device: DEVICE, note: "Smudged – the finger moved during the roll." },
  { position: 8, status: "captured", quality: 2, pattern: "loop", captured: AT, device: DEVICE },
  { position: 9, status: "captured", quality: 3, pattern: "loop", captured: AT, device: DEVICE },
];
const RECAPTURED: FingerPrint[] = [
  ...START.filter((p) => p.position !== 7),
  { position: 7, status: "captured", quality: 2, pattern: "arch", captured: AT + 600_000, device: DEVICE },
  { position: 10, status: "captured", quality: 2, pattern: "loop", captured: AT + 660_000, device: DEVICE },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FingerprintCard } = ui;
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<FingerPosition | null>(7);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <FingerprintCard
        title="Fingerprints"
        description="Badge enrolment for a new starter, rolled prints."
        prints={done ? RECAPTURED : START}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {done ? "Left index and left little finger rescanned. " : "Pick a finger, or move with the arrow keys and press Enter. "}
        <button type="button" style={textButton} onClick={() => setDone(!done)}>
          {done ? "Reset" : "Recapture"}
        </button>
      </div>
    </div>
  );
}
