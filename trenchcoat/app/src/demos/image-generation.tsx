import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ImageGenerationStatus } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The cover is an SVG drawn here – ledger bars under a magnifier on a deep teal page – so nothing loads. The preview
 * the "model" sends while it works is the same drawing with less in it */

function cover(detail: number) {
  const bars = Array.from({ length: 7 }, (_, i) => {
    const h = [120, 168, 96, 210, 150, 236, 182][i];
    return `<rect x="${92 + i * 52}" y="${560 - h}" width="34" height="${h}" rx="6" fill="${i === 5 ? "#f2b45f" : "#7fc8b8"}" opacity="${0.55 + (i % 3) * 0.15}"/>`;
  }).join("");
  const lines = detail > 0.5 ? Array.from({ length: 6 }, (_, i) => `<path d="M80 ${600 + i * 26}h${260 - i * 24}" stroke="#cfe9e2" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>`).join("") : "";
  const glass = detail > 0.3 ? `<circle cx="330" cy="300" r="92" fill="#ffffff" fill-opacity=".12" stroke="#fff3dc" stroke-width="14"/><path d="M396 366l88 88" stroke="#fff3dc" stroke-width="22" stroke-linecap="round"/>` : "";
  const title = detail > 0.8 ? `<text x="80" y="140" font-family="Georgia, serif" font-size="46" fill="#fff3dc">Annual audit</text><text x="80" y="188" font-family="Georgia, serif" font-size="28" fill="#cfe9e2" fill-opacity=".8">Northfield Research Institute</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 768">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3b44"/><stop offset="1" stop-color="#1d5c5a"/></linearGradient>
<radialGradient id="glow" cx=".7" cy=".3" r=".6"><stop offset="0" stop-color="#f2b45f" stop-opacity=".45"/><stop offset="1" stop-color="#f2b45f" stop-opacity="0"/></radialGradient></defs>
<rect width="512" height="768" fill="url(#bg)"/><rect width="512" height="768" fill="url(#glow)"/>${title}${bars}${glass}${lines}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PROMPT =
  "A calm, editorial cover illustration for an annual audit report: ledger bars rising like a skyline under a large magnifying glass, deep teal and warm amber, flat shapes with soft grain, room at the top for the title";
const STEPS = 30;

type Job = { status: ImageGenerationStatus; position?: number; step?: number; error?: string };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ImageGeneration } = ui;
  // Starts part-way through, so there's something to see: step 18 of 30 with the preview coming through
  const [job, setJob] = useState<Job>({ status: "generating", step: 18 });
  const [note, setNote] = useState("Run it to watch a job go from the queue to the finished cover");
  const [run, setRun] = useState(0);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const start = () => {
    window.clearInterval(timer.current);
    setRun((n) => n + 1);
    setJob({ status: "queued", position: 2 });
    setNote("Queued behind one other job");
    let tick = 0;
    timer.current = window.setInterval(() => {
      tick++;
      if (tick === 6) setJob({ status: "queued", position: 1 });
      else if (tick === 12) setJob({ status: "generating", step: 0 });
      else if (tick > 12) {
        const step = Math.min(STEPS, tick - 12);
        if (step >= STEPS) {
          window.clearInterval(timer.current);
          setJob({ status: "done" });
          setNote("Done – Download, Regenerate or Copy prompt");
        } else setJob({ status: "generating", step });
      }
    }, 220);
  };
  const show = (next: Job, words: string) => {
    window.clearInterval(timer.current);
    setJob(next);
    setNote(words);
  };

  const step = job.step ?? 0;
  const fraction = step / STEPS;
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: 10 }}>
      <ImageGeneration
        key={run}
        title="Report cover"
        status={job.status}
        position={job.position}
        step={job.status === "generating" ? step : undefined}
        steps={STEPS}
        phase={fraction > 0.8 ? "Refining" : "Generating"}
        eta={job.status === "generating" ? Math.round((STEPS - step) * 0.22 * 10) / 10 : undefined}
        preview={job.status === "generating" && step > 3 ? cover(fraction) : undefined}
        src={job.status === "done" ? cover(1) : undefined}
        alt="Teal cover with amber and mint ledger bars rising under a large magnifying glass, the title Annual audit at the top"
        error={job.error}
        prompt={PROMPT}
        model="Studio model"
        size="1024 × 1536"
        aspectRatio="2:3"
        onCancel={() => show({ status: "cancelled" }, "Cancelled – Start again runs the job from the queue")}
        onRetry={start}
        onRegenerate={start}
        onDownload={() => setNote("Saved report-cover.svg")}
        onCopyPrompt={() => setNote("Prompt copied")}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span>{note}</span>
        <span style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={start} style={textButton}>
            Run it
          </button>
          <button type="button" onClick={() => show({ status: "failed", error: "The model timed out" }, "Failed – Try again starts the job again")} style={textButton}>
            Fail it
          </button>
        </span>
      </div>
    </div>
  );
}
