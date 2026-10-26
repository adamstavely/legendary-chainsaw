import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RunManifestSetting, RunManifestSource, RunVerification } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The record of a supplier-risk analysis run. A reviewer is working through its claims, so the verification summary
   fills in beat by beat until every claim has a state – then nothing ticks. Copy the hash or the whole manifest, or
   press Export. */

const SETTINGS: RunManifestSetting[] = [
  { label: "Temperature", value: "0.2" },
  { label: "Top-p", value: "0.9" },
  { label: "Max tokens", value: "4,096" },
  { label: "Seed", value: "118734" },
];

const SOURCES: RunManifestSource[] = [
  { id: "contracts", label: "Supplier contracts 2024–2026", detail: "1,204 documents · indexed Oct 22" },
  { id: "filings", label: "Public filings", detail: "312 documents · indexed Oct 20" },
  { id: "upload", label: "Uploaded: northwind-audit.pdf", detail: "48 pages · added by Priya" },
  { id: "news", label: "Trade press archive", detail: "9,880 articles · indexed Oct 18" },
  { id: "notes", label: "Team notes · Q3 supplier calls", detail: "27 notes" },
];

/** What the reviewer decides, claim by claim */
const DECISIONS: (keyof RunVerification)[] = ["verified", "verified", "unverifiable", "verified", "incorrect", "verified", "dismissed", "verified", "verified"];
const START: RunVerification = { verified: 9, unverifiable: 1, incorrect: 0, dismissed: 1, pending: DECISIONS.length };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RunManifest } = ui;
  const [done, setDone] = useState(0);
  const [log, setLog] = useState("");

  // One claim reviewed per beat until none are left
  useEffect(() => {
    if (done >= DECISIONS.length) return;
    const t = setTimeout(() => setDone((n) => n + 1), 1200);
    return () => clearTimeout(t);
  }, [done]);

  const verification: RunVerification = { ...START, pending: DECISIONS.length - done };
  for (const d of DECISIONS.slice(0, done)) verification[d] = (verification[d] ?? 0) + 1;

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 10 }}>
      <RunManifest
        title="Run manifest"
        runId="run_8f2c41d07a"
        timestamp="Oct 24, 14:02 UTC"
        model="Opus 5.5"
        modelId="claude-opus-5-5-20261001"
        settings={SETTINGS}
        instructionLabel="Supplier risk analyst · v4"
        instructionHash="sha256:3f9a2c71d0e4b6a85c19f2e7d4a0b3c6e81f5d9a7b2c4e60f1a3d8b5c7e9b81e"
        sources={SOURCES}
        intent="Which of our top 20 suppliers carry a concentration or solvency risk we should act on this quarter?"
        verification={verification}
        onCopy={(field) => setLog(`Copied the ${field === "manifest" ? "manifest as JSON" : field === "instruction" ? "full instruction hash" : `${field} id`}.`)}
        onExport={(m) => setLog(`Export requested: ${m.runId}, ${m.sources.length} sources, ${m.verification.pending} claims still to review.`)}
      />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || (done < DECISIONS.length ? "A reviewer is working through the claims" : "Every claim has been reviewed")}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setDone(0);
            setLog("");
          }}
        >
          Replay
        </button>
      </p>
    </div>
  );
}
