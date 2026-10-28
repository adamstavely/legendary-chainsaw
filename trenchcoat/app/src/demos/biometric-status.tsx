import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BiometricModality } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A visitor's enrolment at a building's self-service kiosk: face and fingerprints are done, the iris scan is still
   being taken, the voice sample was too short and the old signature has expired. "Finish the iris scan" completes it. */

const START: BiometricModality[] = [
  { id: "face", label: "Face", kind: "face", detail: "Front and profile · captured today 09:41", status: "enrolled", quality: 0.96 },
  { id: "fingerprints", label: "Fingerprints", kind: "fingerprint", detail: "9 of 10 fingers · rolled", status: "partial", quality: 0.78 },
  { id: "iris", label: "Iris", kind: "iris", detail: "Left eye done · right eye scanning", status: "in-progress", quality: 0.5, qualityLabel: "Progress" },
  { id: "palm", label: "Palm", kind: "palm", detail: "Right palm · from last year's badge", status: "on-file", quality: 0.88 },
  { id: "voice", label: "Voice", kind: "voice", detail: "4 s sample · needs 10 s", status: "partial", quality: 0.34 },
  { id: "signature", label: "Signature", kind: "signature", detail: "Signed Mar 2023 · older than 2 years", status: "expired" },
  { id: "dna", label: "DNA", kind: "dna", detail: "Not part of this enrolment", status: "missing" },
];
const IRIS: BiometricModality = { id: "iris", label: "Iris", kind: "iris", detail: "Both eyes · captured today 09:46", status: "enrolled", quality: 0.92 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { BiometricStatus } = ui;
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const modalities = done ? START.map((m) => (m.id === "iris" ? IRIS : m)) : START;
  const picked = modalities.find((m) => m.id === selected);
  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <BiometricStatus
        title="Enrolment"
        description="Visitor badge 0412 · self-service kiosk, Lobby 2."
        modalities={modalities}
        match={{ label: "Photo ID match", value: 0.972, detail: "Face against the passport photo" }}
        selected={selected}
        onSelectedChange={(s) => setSelected(s)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {picked ? `${picked.label}: ${picked.detail ?? ""}. ` : "Pick a row, or move with the arrow keys and press Enter. "}
        <button type="button" style={textButton} onClick={() => setDone(!done)}>
          {done ? "Reset" : "Finish the iris scan"}
        </button>
      </div>
    </div>
  );
}
