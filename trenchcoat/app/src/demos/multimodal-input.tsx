import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { MultimodalAttachment, MultimodalRejection } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A support agent attaches what a customer sent: a photo of the damage, a voice note, a screen recording and the
   invoice. This page stands in for the app: it "uploads" each file in steps (one timeout at a time, none once
   everything is up), then reports a length, a page count and a token estimate. The scan's upload drops the first
   time – Retry sends it again. A HEIC photo and a 412 MB video are turned away by the format and size checks.
   Drop or paste your own files too: they go through the same steps, and stay in this browser. */

const MB = 1024 * 1024;
const TICK = 260;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "audio/*", "video/mp4", "video/webm", ".pdf", ".txt", ".md"];

/** A small picture drawn on a canvas, as a PNG or a data URL */
function picture(hue: number, label: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 120;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createLinearGradient(0, 0, 160, 120);
  grad.addColorStop(0, `hsl(${hue} 55% 72%)`);
  grad.addColorStop(1, `hsl(${hue + 40} 45% 42%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 160, 120);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.fillRect(28, 36, 104, 56);
  g.strokeStyle = `hsl(${hue} 40% 30%)`;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(40, 80);
  g.lineTo(64, 52);
  g.lineTo(84, 70);
  g.lineTo(100, 58);
  g.lineTo(120, 80);
  g.stroke();
  g.fillStyle = `hsl(${hue} 40% 25%)`;
  g.font = "600 11px sans-serif";
  g.fillText(label, 34, 50);
  return c;
}
const png = (c: HTMLCanvasElement, name: string) =>
  new Promise<File>((resolve) => c.toBlob((b) => resolve(new File([b ?? new Blob()], name, { type: "image/png" })), "image/png"));
const sized = (file: File, size: number) => {
  Object.defineProperty(file, "size", { value: size });
  return file;
};

async function samples(): Promise<File[]> {
  return [
    await png(picture(18, "Damaged corner"), "damaged-box.png"),
    sized(new File(["voice"], "voice-note.m4a", { type: "audio/mp4" }), 1.4 * MB),
    sized(new File(["screen"], "checkout-error.mp4", { type: "video/mp4" }), 18 * MB),
    sized(new File(["invoice"], "invoice-10442.pdf", { type: "application/pdf" }), 220 * 1024),
    sized(new File(["scan"], "contract-scan.pdf", { type: "application/pdf" }), 3.1 * MB),
    sized(new File(["heic"], "IMG_4471.heic", { type: "image/heic" }), 2.2 * MB),
    sized(new File(["long"], "store-walkthrough.mp4", { type: "video/mp4" }), 412 * MB),
  ];
}

/** What the app learns once a file is up: a length, pages, tokens – made up from the file */
function processed(a: MultimodalAttachment): Partial<MultimodalAttachment> {
  const seed = [...a.name].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  if (a.kind === "image") return { tokens: 1100 + (seed % 500) };
  if (a.kind === "audio") {
    const duration = 40 + (seed % 120);
    return { duration, tokens: Math.round(duration * 32) };
  }
  if (a.kind === "video") {
    const duration = 60 + (seed % 200);
    return { duration, tokens: Math.round(duration * 110), preview: picture(210, "Checkout").toDataURL("image/png") };
  }
  const pages = 1 + (seed % 14);
  return { pages, tokens: pages * 560 };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MultimodalInput } = ui;
  const box = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<MultimodalAttachment[]>([]);
  const [text, setText] = useState("The customer says the box arrived crushed and checkout failed twice when they tried to reorder.");
  const [note, setNote] = useState("Drop, paste or attach files – or add the customer's.");
  const dropped = useRef(new Set<string>());

  // The app's uploads: one step for every file in flight, one timeout at a time
  const busy = value.some((a) => a.status === "queued" || a.status === "uploading");
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(
      () =>
        setValue((list) =>
          list.map((a) => {
            if (a.status === "queued") return { ...a, status: "uploading", progress: 0.05 };
            if (a.status !== "uploading") return a;
            const step = Math.max(0.08, Math.min(0.35, (2 * MB) / Math.max(a.size, 1)));
            const progress = Math.min(1, (a.progress ?? 0) + step);
            if (a.name.includes("scan") && progress > 0.6 && !dropped.current.has(a.id)) {
              dropped.current.add(a.id);
              return { ...a, status: "failed", error: "the connection dropped" };
            }
            return progress >= 1 ? { ...a, status: "ready", progress: 1, ...processed(a) } : { ...a, progress };
          }),
        ),
      TICK,
    );
    return () => clearTimeout(t);
  }, [value, busy]);

  return (
    <div ref={box} style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <MultimodalInput
        value={value}
        onChange={(next) => setValue(next)}
        text={text}
        onTextChange={setText}
        accept={ACCEPT}
        maxSize={25 * MB}
        limits={{ video: 200 * MB }}
        budget={64_000}
        placeholder="Write to the model, or drop files here"
        onSend={(t, attachments) => {
          setNote(`Sent ${attachments.length ? `${attachments.length} attachments and ` : ""}${t.trim() ? "the message" : "no message"}.`);
          setText("");
          setValue([]);
        }}
        onRetry={(a) => {
          setValue((list) => list.map((x) => (x.id === a.id ? { ...x, status: "uploading", progress: 0.6, error: undefined } : x)));
          setNote(`Retrying ${a.name}.`);
        }}
        onReject={(r: MultimodalRejection[]) => setNote(`${r.length === 1 ? "1 file was" : `${r.length} files were`} turned away.`)}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span>{note}</span>
        <span style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            style={textButton}
            onClick={async () => {
              const files = await samples();
              box.current?.querySelector("tc-multimodal-input")?.addFiles(files);
            }}
          >
            Add the customer's files
          </button>
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setValue([]);
              dropped.current.clear();
              setNote("Drop, paste or attach files – or add the customer's.");
            }}
          >
            Clear
          </button>
        </span>
      </div>
    </div>
  );
}
