import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AttestationResult } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Verify an evidence package before you rely on it. Try a sample package below (a valid one and a tampered one), or
   drop any file: the demo hashes it with SHA-256 in this page (crypto.subtle) – nothing is uploaded – and, since it
   isn't a signed package, reports it invalid. */

const VALID = "sha256:9f2c41ab07e3d5c88e1f6a2b4c7d90e3f1a2b3c4d5e6f708192a3b4c5d1c51d08aa";
const TAMPERED = "sha256:4be0d2a1c3f59e7716a8b2c4d6e8f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2";

const SAMPLES: Record<string, AttestationResult> = {
  [VALID]: {
    valid: true,
    name: "vendor-risk-q3.evidence",
    hash: VALID,
    signer: "Release key · Risk team",
    signedAt: "24 Oct 2026, 16:05",
    signature: { ok: true, detail: "Ed25519 signature matches the release key" },
    chain: { ok: true, detail: "42 of 42 links intact, oldest first" },
    coverage: { ok: true, detail: "Covers everything the manifest lists", items: ["Run manifest", "14 source chunks", "4 claims", "Risk memo §2"] },
  },
  [TAMPERED]: {
    valid: false,
    name: "procurement-brief-v1.4.evidence",
    hash: TAMPERED,
    signer: "Release key · Risk team",
    signedAt: "19 Oct 2026, 09:12",
    signature: { ok: true, detail: "Ed25519 signature matches the release key" },
    chain: { ok: false, detail: "Link 17 doesn't match link 16" },
    coverage: { ok: false, detail: "2 files are missing from the package", items: ["Run manifest", "9 source chunks"] },
    reasons: ["A record was changed after the package was signed (link 17).", "The manifest lists 11 source chunks; the package holds 9."],
  },
};

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function verify(input: string | File): Promise<AttestationResult> {
  await pause(900);
  if (typeof input === "string") {
    const key = input.toLowerCase().startsWith("sha256:") ? input.toLowerCase() : `sha256:${input.toLowerCase()}`;
    const known = SAMPLES[key];
    if (known) return known;
    return { valid: false, hash: key, signature: { ok: false, detail: "No package with this hash is on record" }, reasons: ["Check the hash was copied in full."] };
  }
  // Hashed here, in the page – the file never leaves it
  const digest = await crypto.subtle.digest("SHA-256", await input.arrayBuffer());
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return {
    valid: false,
    name: input.name,
    hash: `sha256:${hex}`,
    signature: { ok: false, detail: "The file carries no signature" },
    reasons: ["This file isn't a signed evidence package."],
  };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AttestationCheck } = ui;
  const [result, setResult] = useState<AttestationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const sample = (hash: string) => {
    setBusy(true);
    setResult(null);
    void verify(hash).then((r) => {
      setResult(r);
      setBusy(false);
    });
  };
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <AttestationCheck verify={verify} accept={[".evidence", ".json", ".zip"]} result={result} onResultChange={setResult} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {busy ? "Checking the sample… " : "Drop any file, or try a sample: "}
        <button type="button" style={textButton} disabled={busy} onClick={() => sample(VALID)}>
          valid package
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} disabled={busy} onClick={() => sample(TAMPERED)}>
          tampered package
        </button>
      </p>
    </div>
  );
}
