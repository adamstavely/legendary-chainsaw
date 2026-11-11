import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PixelLoaderPattern } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's audit tooling at work: one loader per pattern, then how a run ends. */

const RUNS: { pattern: PixelLoaderPattern; label: string }[] = [
  { pattern: "wave", label: "Reading the audit log" },
  { pattern: "drive", label: "Matching vendor IDs" },
  { pattern: "dots", label: "Checking review dates" },
  { pattern: "orbit", label: "Drafting the summary" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PixelLoader } = ui;
  const [run, setRun] = useState(0);
  const [ended, setEnded] = useState<"working" | "done" | "error">("working");
  // The last two rows finish after a few seconds – one well, one not
  useEffect(() => {
    setEnded("working");
    const t = window.setTimeout(() => setEnded("done"), 4200);
    return () => window.clearTimeout(t);
  }, [run]);
  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "start", width: "100%", maxWidth: 360 }}>
      {RUNS.map((r) => (
        <PixelLoader key={`${r.pattern}-${run}`} pattern={r.pattern} label={r.label} />
      ))}
      <PixelLoader key={`done-${run}`} pattern="wave" label="Exporting the register" state={ended} />
      <PixelLoader key={`error-${run}`} pattern="orbit" size="sm" label="Uploading to the archive" state={ended === "done" ? "error" : "working"} />
      <div style={caption}>
        The last two end after a few seconds: one in a check, one in a cross.{" "}
        <button type="button" style={textButton} onClick={() => setRun((n) => n + 1)}>
          Run again
        </button>
      </div>
    </div>
  );
}
