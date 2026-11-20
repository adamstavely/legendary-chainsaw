import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* Point-in-time help in a fictional case-review app, "Ledgerline": a film-frame icon beside the page title, beside a
   field's label, and with words beside an export button. The gallery has no video files, so the demo draws each
   tutorial itself – a mock of the app with a pointer walking through the task – and records it from a canvas when
   the page opens, with a captions track made the same way. Until a clip is ready (or where recording isn't
   available) the player says the video can't be played here. */

type Tutorial = { id: string; title: string; seconds: number; description: string; rows: string[]; target: number; panel: string; cues: string[]; chapters?: string[] };

const TUTORIALS: Tutorial[] = [
  {
    id: "queue",
    title: "Triage the alert queue",
    seconds: 12,
    description: "Sort new alerts by risk, take the ones that are yours and send the rest back with a reason.",
    rows: ["ALR-2041 · Card testing", "ALR-2042 · New payee", "ALR-2043 · Velocity", "ALR-2044 · Address change"],
    target: 2,
    panel: "ALR-2043",
    cues: ["The highest risk sits at the top.", "Take an alert to make it yours.", "Anything you can't handle goes back with a reason."],
    chapters: ["Sort by risk", "Take an alert", "Send one back"],
  },
  {
    id: "threshold",
    title: "Set a risk threshold",
    seconds: 10,
    description: "Alerts under the threshold skip the queue. Raise it to see fewer, lower it to catch more.",
    rows: ["Low · under 40", "Medium · 40–70", "High · over 70", "Custom"],
    target: 1,
    panel: "Threshold 55",
    cues: ["Pick a band, or set your own.", "The preview shows how many alerts it lets through.", "Save applies it from the next alert on."],
  },
  {
    id: "export",
    title: "Export the audit trail",
    seconds: 10,
    description: "Download every action on the selected cases as one signed file for an auditor.",
    rows: ["Case CS-118", "Case CS-121", "Case CS-124", "Case CS-130"],
    target: 0,
    panel: "Export",
    cues: ["Choose the cases to include.", "Export makes one signed file.", "Auditors can check it without an account."],
  },
];

const W = 640;
const H = 360;
const INK = ["#4f7cff", "#16a37f", "#d9822b", "#8b5cf6", "#e0457b"];

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** One moment of a tutorial: the app's window with the pointer at time `t` (0–1) */
function draw(ctx: CanvasRenderingContext2D, tut: Tutorial, i: number, t: number) {
  const ink = INK[i % INK.length]!;
  ctx.fillStyle = "#eef0f4";
  ctx.fillRect(0, 0, W, H);
  // Window
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(24, 20, W - 48, H - 40, 10);
  ctx.fill();
  ctx.fillStyle = "#f6f7f9";
  ctx.fillRect(24, 50, 150, H - 70);
  ctx.fillStyle = "#1c1d21";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillText("Ledgerline", 40, 40);
  ctx.fillStyle = "#8a8f98";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(tut.title, 140, 40);
  // Sidebar
  ["Home", "Queue", "Cases", "Reports"].forEach((s, k) => {
    ctx.fillStyle = k === 1 ? "#1c1d21" : "#8a8f98";
    ctx.fillText(s, 40, 80 + k * 26);
  });
  // Rows
  const rowY = (k: number) => 76 + k * 46;
  const click = 0.45;
  tut.rows.forEach((r, k) => {
    const on = k === tut.target && t > click;
    ctx.fillStyle = on ? ink + "22" : "#ffffff";
    ctx.strokeStyle = on ? ink : "#e3e5ea";
    ctx.beginPath();
    ctx.roundRect(190, rowY(k), 250, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1c1d21";
    ctx.fillText(r, 204, rowY(k) + 22);
  });
  // The panel that slides in after the click
  const p = ease(clamp((t - click) / 0.2));
  if (p > 0) {
    const x = W - 24 - 150 * p;
    ctx.fillStyle = "#fbfbfd";
    ctx.fillRect(x, 50, 150, H - 70);
    ctx.fillStyle = ink;
    ctx.fillRect(x, 50, 3, H - 70);
    ctx.fillStyle = "#1c1d21";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillText(tut.panel, x + 14, 76);
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#c5c9d1";
    for (let k = 0; k < 4; k++) ctx.fillRect(x + 14, 92 + k * 18, 110 - k * 16, 8);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.roundRect(x + 14, H - 70, 80, 26, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Done", x + 38, H - 52);
  }
  // Pointer: from the corner to the row, then on to the panel's button
  const target = { x: 300, y: rowY(tut.target) + 18 };
  const button = { x: W - 120, y: H - 57 };
  const a = ease(clamp(t / click));
  const b = ease(clamp((t - 0.75) / 0.15));
  const px = 560 + (target.x - 560) * a + (button.x - target.x) * b;
  const py = 300 + (target.y - 300) * a + (button.y - target.y) * b;
  const ring = clamp(1 - Math.abs(t - click) / 0.06);
  if (ring > 0) {
    ctx.strokeStyle = ink;
    ctx.globalAlpha = ring;
    ctx.beginPath();
    ctx.arc(px, py, 16 * (1.4 - ring * 0.4), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#1c1d21";
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py + 18);
  ctx.lineTo(px + 5, py + 13);
  ctx.lineTo(px + 12, py + 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function canvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
}

/** A still from just after the click, as the frame's picture */
function poster(tut: Tutorial, i: number) {
  const c = canvas();
  const ctx = c.getContext("2d");
  if (!ctx || typeof ctx.roundRect !== "function") return undefined;
  draw(ctx, tut, i, 0.62);
  return c.toDataURL("image/jpeg", 0.85);
}

const stamp = (s: number) => `00:${String(Math.floor(s)).padStart(2, "0")}.${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;

function captions(tut: Tutorial) {
  const part = tut.seconds / tut.cues.length;
  const body = tut.cues.map((cue, k) => `${stamp(k * part)} --> ${stamp((k + 1) * part - 0.2)}\n${cue}`).join("\n\n");
  return URL.createObjectURL(new Blob([`WEBVTT\n\n${body}\n`], { type: "text/vtt" }));
}

/** Records the tutorial's drawing as a clip; null where the browser can't record a canvas */
function record(tut: Tutorial, i: number): Promise<{ url: string; type: string } | null> {
  const c = canvas();
  const ctx = c.getContext("2d");
  if (!ctx || typeof c.captureStream !== "function" || typeof MediaRecorder === "undefined" || typeof ctx.roundRect !== "function") return Promise.resolve(null);
  const type = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
  if (!type) return Promise.resolve(null);
  return new Promise((resolve) => {
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 600_000 });
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    rec.onstop = () => resolve({ url: URL.createObjectURL(new Blob(parts, { type: type.split(";")[0] })), type: type.split(";")[0]! });
    const start = performance.now();
    const ms = tut.seconds * 1000;
    const tick = window.setInterval(() => {
      const t = (performance.now() - start) / ms;
      draw(ctx, tut, i, Math.min(1, t));
      if (t >= 1) {
        window.clearInterval(tick);
        rec.stop();
        stream.getTracks().forEach((track) => track.stop());
      }
    }, 1000 / 30);
    draw(ctx, tut, i, 0);
    rec.start(1000);
  });
}

type Clip = { url: string; type: string; captions: string };

const page: CSSProperties = { ...surface, display: "grid", gap: 18, padding: 20, borderRadius: 14, width: "100%", boxSizing: "border-box" };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const fieldBox: CSSProperties = { display: "grid", gap: 6, maxWidth: 260 };
const input: CSSProperties = { height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid var(--tc-border-default, light-dark(#e3e3e3, #2e2e33))", background: "transparent", color: "inherit", font: "inherit" };
const exportBtn: CSSProperties = { height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--tc-border-default, light-dark(#e3e3e3, #2e2e33))", background: "transparent", color: "inherit", font: "inherit", fontSize: 13 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HelpVideo } = ui;
  const [watched, setWatched] = useState<Record<string, boolean>>({ threshold: true });
  const [clips, setClips] = useState<Record<string, Clip>>({});
  const fieldId = useId();
  const posters = useMemo(() => TUTORIALS.map((t, i) => (typeof document === "undefined" ? undefined : poster(t, i))), []);

  useEffect(() => {
    let live = true;
    const made: string[] = [];
    TUTORIALS.forEach((t, i) =>
      record(t, i).then((clip) => {
        if (!clip) return;
        const track = captions(t);
        made.push(clip.url, track);
        if (live) setClips((all) => ({ ...all, [t.id]: { ...clip, captions: track } }));
      }),
    );
    return () => {
      live = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const props = (id: string) => {
    const i = TUTORIALS.findIndex((t) => t.id === id);
    const t = TUTORIALS[i]!;
    const clip = clips[id];
    return {
      title: t.title,
      description: t.description,
      duration: t.seconds,
      poster: posters[i],
      src: clip?.url,
      type: clip?.type,
      captions: clip?.captions,
      chapters: t.chapters?.map((title, k) => ({ time: (k * t.seconds) / t.chapters!.length, title })) ?? [],
      watched: !!watched[id],
      onWatchedChange: (w: boolean) => setWatched((all) => ({ ...all, [id]: w })),
    };
  };
  const ready = Object.keys(clips).length;

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <div style={page}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <h2 style={{ ...row, margin: 0, fontSize: 20 }}>
            Alert queue <HelpVideo {...props("queue")} />
          </h2>
          <div style={row}>
            <HelpVideo {...props("export")} label="Watch how" size="sm" />
            <button type="button" style={exportBtn}>
              Export audit trail
            </button>
          </div>
        </div>
        <div style={fieldBox}>
          <div style={{ ...row, gap: 4, fontSize: 13, fontWeight: 500 }}>
            <label htmlFor={fieldId}>Risk threshold</label>
            <HelpVideo {...props("threshold")} size="sm" />
          </div>
          <input id={fieldId} style={input} defaultValue="55" inputMode="numeric" />
        </div>
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        {ready < TUTORIALS.length ? `Recording the demo's clips from its own drawing (${ready} of ${TUTORIALS.length} ready). ` : "Point at an icon for its title; click it to play. "}
        <button type="button" style={textButton} onClick={() => setWatched({})}>
          Mark all unwatched
        </button>
      </div>
    </div>
  );
}
