import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ImageGridTile } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Every image is an SVG drawn here – a lighthouse at dusk in a different light each time – so nothing loads */

type Scene = { sky: [string, string]; sun: string; sunY: number; sea: [string, string]; cliff: string; beam: string; stars?: boolean; alt: string };

const SCENES: Scene[] = [
  { sky: ["#2b3a6b", "#f2945f"], sun: "#ffd58a", sunY: 118, sea: ["#3a4f86", "#162040"], cliff: "#2b2233", beam: "#fff1c2", alt: "Watercolor lighthouse on a dark cliff, an orange dusk sky with a low sun over a calm blue sea" },
  { sky: ["#3b1f5e", "#ff9f80"], sun: "#ffe0b0", sunY: 104, sea: ["#5a3f7a", "#24163d"], cliff: "#1f1726", beam: "#ffe6d6", alt: "" },
  { sky: ["#0f2f3d", "#5fb8a4"], sun: "#e8fff4", sunY: 92, sea: ["#1d5560", "#0b2128"], cliff: "#142026", beam: "#e3fff6", alt: "Teal twilight over the sea, the lighthouse beam crossing a pale moon" },
  { sky: ["#0d1528", "#2c4570"], sun: "#f4f1de", sunY: 64, sea: ["#1d2d4d", "#080d1a"], cliff: "#0a0f1c", beam: "#fdf6cf", stars: true, alt: "Night scene: a starry sky, a small moon and the lighthouse beam sweeping a dark sea" },
  { sky: ["#5b2a3c", "#ffc371"], sun: "#fff0c8", sunY: 128, sea: ["#7a4256", "#2e1520"], cliff: "#2a1418", beam: "#fff4dc", alt: "Rose and gold sunset behind the lighthouse, the sun touching the horizon" },
  { sky: ["#24324f", "#9fb4d6"], sun: "#ffffff", sunY: 84, sea: ["#46597d", "#1b2438"], cliff: "#1a1f2c", beam: "#f5f8ff", alt: "Misty blue evening, the lighthouse lit against a hazy sky and a gray-blue sea" },
];

/** A 512×512 lighthouse scene; `hd` adds the fine detail an upscale brings out */
function draw(n: number, hd = false) {
  const s = SCENES[n % SCENES.length];
  const stars = s.stars
    ? Array.from({ length: hd ? 40 : 22 }, (_, i) => `<circle cx="${(i * 97) % 512}" cy="${(i * 53) % 150}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`).join("")
    : "";
  const waves = Array.from({ length: hd ? 9 : 5 }, (_, i) => `<path d="M${-20 + i * 13} ${330 + i * 22}q60 -6 120 0t120 0t120 0t120 0t120 0" stroke="${s.sun}" stroke-opacity="${0.18 - i * 0.012}" stroke-width="${hd ? 1.5 : 2.5}" fill="none"/>`).join("");
  const birds = hd ? `<path d="M120 150q8 -8 16 0q8 -8 16 0M168 128q6 -6 12 0q6 -6 12 0" stroke="${s.cliff}" stroke-width="2" fill="none" stroke-linecap="round"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sky[0]}"/><stop offset="1" stop-color="${s.sky[1]}"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sea[0]}"/><stop offset="1" stop-color="${s.sea[1]}"/></linearGradient>
<radialGradient id="g"><stop offset="0" stop-color="${s.sun}" stop-opacity=".55"/><stop offset="1" stop-color="${s.sun}" stop-opacity="0"/></radialGradient></defs>
<rect width="512" height="300" fill="url(#k)"/>${stars}
<circle cx="150" cy="${200 + s.sunY / 2}" r="150" fill="url(#g)"/><circle cx="150" cy="${200 + s.sunY / 2}" r="${s.stars ? 18 : 34}" fill="${s.sun}"/>
<rect y="298" width="512" height="214" fill="url(#w)"/>${waves}
<ellipse cx="150" cy="${312}" rx="${s.stars ? 26 : 60}" ry="5" fill="${s.sun}" opacity=".45"/>
<path d="M300 300 L512 230 L512 512 L270 512 Q300 420 280 360 Z" fill="${s.cliff}"/>
<polygon points="392,148 120,96 120,206" fill="${s.beam}" opacity="${hd ? 0.22 : 0.16}"/>
<path d="M378 268 L384 158 L400 158 L406 268 Z" fill="#f3efe6"/><path d="M380 232h24v12h-24zM382 196h20v12h-20z" fill="#c2453c"/>
<rect x="381" y="140" width="22" height="18" rx="3" fill="${s.beam}"/><path d="M376 140 L392 124 L408 140 Z" fill="#c2453c"/>
${hd ? `<path d="M384 172h16M383 186h18M381 216h22M380 256h24" stroke="#00000022" stroke-width="1"/>` : ""}${birds}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type Job = { scene: number; speed: number; fail?: boolean; upscale?: boolean };

const START: [string, Job][] = [
  ["v1", { scene: 0, speed: 0.07 }],
  ["v2", { scene: 1, speed: 0.055 }],
  ["v3", { scene: 2, speed: 0.06, fail: true }],
  ["v4", { scene: 3, speed: 0.045 }],
];
const pending = (id: string, activity = "Generating"): ImageGridTile => ({ id, alt: "", status: "pending", progress: 0, activity });

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ImageGrid } = ui;
  const [tiles, setTiles] = useState<ImageGridTile[]>(() => START.map(([id]) => pending(id)));
  const [note, setNote] = useState("Click an image or press Space to pick it · Enter opens a tile's actions · F2 edits its alt text");
  const [run, setRun] = useState(0);
  const [picked, setPicked] = useState<string | null>("v1");
  const [tries, setTries] = useState<Record<string, number>>({});
  const jobs = useRef(new Map<string, Job>(START));
  const next = useRef(4);
  const busy = tiles.some((t) => t.status === "pending");

  // One ticker while anything is generating; it stops when every tile has settled
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => {
      setTiles((list) =>
        list.map((t) => {
          const job = jobs.current.get(t.id);
          if (t.status !== "pending" || !job) return t;
          const progress = Math.min(1, (t.progress ?? 0) + job.speed * (0.7 + Math.random() * 0.6));
          if (job.fail && progress >= 0.62) {
            jobs.current.set(t.id, { ...job, fail: false });
            return { ...t, status: "failed", progress: undefined, error: "The model timed out" };
          }
          if (progress < 1) return { ...t, progress };
          const scene = SCENES[job.scene % SCENES.length];
          return { id: t.id, status: "done", src: draw(job.scene, job.upscale), alt: job.upscale ? t.alt : scene.alt, upscaled: job.upscale };
        }),
      );
    }, 120);
    return () => clearInterval(timer);
  }, [busy, run]);

  const regenerate = (tile: ImageGridTile, index: number) => {
    const job = jobs.current.get(tile.id);
    // Try again redraws the same scene; Regenerate draws a new one
    const scene = tile.status === "failed" && job ? job.scene : next.current++;
    jobs.current.set(tile.id, { scene, speed: 0.06 + Math.random() * 0.03 });
    setTries((t) => ({ ...t, [tile.id]: (t[tile.id] ?? 1) + 1 }));
    if (picked === tile.id) setPicked(null);
    setTiles((list) => list.map((t) => (t.id === tile.id ? pending(t.id) : t)));
    setNote(`Regenerating variation ${index + 1}`);
  };
  const upscale = (tile: ImageGridTile, index: number) => {
    const job = jobs.current.get(tile.id);
    if (!job) return;
    jobs.current.set(tile.id, { ...job, speed: 0.08, upscale: true });
    setTiles((list) => list.map((t) => (t.id === tile.id ? { ...t, status: "pending", progress: 0, activity: "Upscaling" } : t)));
    setNote(`Upscaling variation ${index + 1} to 2048 × 2048`);
  };
  const replay = () => {
    jobs.current = new Map(START);
    next.current = 4;
    setTiles(START.map(([id]) => pending(id)));
    setPicked("v1");
    setTries({});
    setNote("Click an image or press Space to pick it · Enter opens a tile's actions · F2 edits its alt text");
    setRun((n) => n + 1);
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <ImageGrid
        title="Lighthouse at dusk"
        prompt="A lighthouse on a sea cliff at dusk, soft watercolor, warm light on the water"
        tiles={tiles.map((t) => ({
          ...t,
          // The app's own state on each tile: the one picked for the cover, and how many tries it took
          ...(t.id === picked ? { badge: "Picked", badgeTone: "success" as const } : {}),
          ...((tries[t.id] ?? 1) > 1 ? { meta: `${tries[t.id]} tries` } : {}),
        }))}
        onOpen={(tile, index) => {
          setPicked(tile.id);
          setNote(`Opened variation ${index + 1} – picked for the cover`);
        }}
        onTilesChange={(list) => {
          setTiles(list.map(({ badge: _b, badgeTone: _t, meta: _m, ...t }) => t));
          setNote("Alt text saved");
        }}
        onRegenerate={regenerate}
        onUpscale={upscale}
        onDownload={(_tile, index) => setNote(`Saved variation ${index + 1}`)}
        onCompareChange={(pair) => setNote(pair ? "Drag the divider, or use the arrow keys on it" : "Back to the grid")}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note}</span>
        <button type="button" onClick={replay} style={textButton}>
          Replay
        </button>
      </div>
    </div>
  );
}
