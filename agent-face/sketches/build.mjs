// Writes sheet.html: a static sheet comparing three takes on Donovan. Run with `node build.mjs`.
import { writeFileSync } from "node:fs";
// The sheet records the placeholder shapes these takes were judged on, before the real logo arrived
const LOGO_PATH = "M50 5C57 30 74 60 94 94C78 84 63 77 50 75C37 77 22 84 6 94C26 60 43 30 50 5Z";
const SOFT_PATH = "M50 7C60 27 84 57 90 78C93 91 80 94 69 88C61 84 55 82 50 82C45 82 39 84 31 88C20 94 7 91 10 78C16 57 40 27 50 7Z";
const GRADIENT = ["#F28C28", "#7B3FE4", "#19A7E6"];

const STATES = ["idle", "listening", "thinking", "speaking", "happy", "confused", "sleeping", "error", "surprised"];
const SIZES = [160, 64, 26, 16];
const INK = "#fff";
let uid = 0;

const fill = (id) => `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="8" y1="92" x2="92" y2="8">${GRADIENT.map((c, i) => `<stop offset="${i / 2}" stop-color="${c}"/>`).join("")}</linearGradient></defs>`;
const stroke = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

// Eye radius and line weight grow as the drawing shrinks, so features survive at 16 and 26 px
const metrics = (size) => (size <= 16 ? { r: 7, w: 6.5, full: false } : size <= 26 ? { r: 5.5, w: 5, full: false } : { r: 4.2, w: 3.2, full: true });

function eye(kind, x, y, r, w) {
  switch (kind) {
    case "closed": return `<path d="M${x - r * 1.2} ${y}H${x + r * 1.2}" ${stroke(w)}/>`;
    case "smile": return `<path d="M${x - r * 1.3} ${y + r * 0.5}Q${x} ${y - r * 1.5} ${x + r * 1.3} ${y + r * 0.5}" ${stroke(w)}/>`;
    case "cross": { const d = r * 0.9; return `<path d="M${x - d} ${y - d}L${x + d} ${y + d}M${x + d} ${y - d}L${x - d} ${y + d}" ${stroke(w)}/>`; }
    case "wide": return `<circle cx="${x}" cy="${y}" r="${r * 1.35}" fill="${INK}"/>`;
    case "small": return `<circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="${INK}"/>`;
    case "up": return `<circle cx="${x + r * 0.5}" cy="${y - r * 0.6}" r="${r}" fill="${INK}"/>`;
    default: return `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
  }
}

const EYES = {
  idle: ["dot", "dot"], listening: ["wide", "wide"], thinking: ["up", "up"], speaking: ["dot", "dot"], happy: ["smile", "smile"],
  confused: ["dot", "small"], sleeping: ["closed", "closed"], error: ["cross", "cross"], surprised: ["wide", "wide"],
};

function mouth(state, cx, y, w) {
  switch (state) {
    case "speaking": return `<ellipse cx="${cx}" cy="${y}" rx="4" ry="3.2" fill="${INK}"/>`;
    case "happy": return `<path d="M${cx - 5} ${y - 1}Q${cx} ${y + 4} ${cx + 5} ${y - 1}" ${stroke(w)}/>`;
    case "confused": return `<path d="M${cx - 5} ${y + 1}Q${cx - 2} ${y - 2} ${cx} ${y}T${cx + 5} ${y}" ${stroke(w)}/>`;
    case "error": return `<path d="M${cx - 5} ${y}H${cx + 5}" ${stroke(w)}/>`;
    case "surprised": return `<circle cx="${cx}" cy="${y}" r="2.8" fill="${INK}"/>`;
    default: return "";
  }
}

function face(state, size, { eyeY, gap, mouthY }) {
  const { r, w, full } = metrics(size);
  const [a, b] = EYES[state];
  return eye(a, 50 - gap, eyeY, r, w) + eye(b, 50 + gap, eyeY, r, w) + (full ? mouth(state, 50, mouthY, w) : "");
}

const onLogo = (state, size, id) => `<path d="${LOGO_PATH}" fill="url(#${id})"/>${face(state, size, { eyeY: 53, gap: 9, mouthY: 66 })}`;
const onSoft = (state, size, id) => `<path d="${SOFT_PATH}" fill="url(#${id})"/>${face(state, size, { eyeY: 52, gap: 12, mouthY: 67 })}`;

// No face: the outline's pose carries the state, with a small extra mark at sizes that can hold one
const POSE = {
  idle: "", listening: "translate(0 3) scale(1 .94)", thinking: "rotate(12 50 60)", speaking: "scale(1.04 .94)", happy: "translate(0 -5)",
  confused: "rotate(-16 50 60)", sleeping: "rotate(78 50 56) scale(.86)", error: "", surprised: "translate(50 94) scale(.9 1.1) translate(-50 -94)",
};
const EXTRA = {
  listening: `<path d="M12 28A12 12 0 0 0 12 52M88 28A12 12 0 0 1 88 52" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  thinking: `<circle cx="84" cy="18" r="4" fill="currentColor"/><circle cx="92" cy="32" r="2.6" fill="currentColor"/>`,
  speaking: `<path d="M80 30V46M88 24V52M96 33V43" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  sleeping: `<path d="M72 14H84L72 26H84" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  confused: `<circle cx="84" cy="26" r="3" fill="currentColor"/>`,
  surprised: `<path d="M18 10L24 20M82 10L76 20" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>`,
};
function noFace(state, size, id) {
  if (state === "error") {
    const crack = `<path d="M58 22L44 42L58 54L46 76" stroke="var(--surface)" stroke-width="${size <= 26 ? 8 : 4}" stroke-linejoin="round" fill="none"/>`;
    return `<path d="${LOGO_PATH}" fill="url(#${id})"/>${crack}`;
  }
  const muted = state === "sleeping" ? ` opacity=".45"` : "";
  return `<g transform="${POSE[state]}"${muted}><path d="${LOGO_PATH}" fill="url(#${id})"/></g>${size >= 64 ? EXTRA[state] ?? "" : ""}`;
}

const svg = (draw, state, size, label) => {
  const id = `g${uid++}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${label}"><title>${label}</title>${fill(id)}${draw(state, size, id)}</svg>`;
};

const TAKES = [
  { key: "A", name: "Eyes on the logo", note: "The logo stays exactly as it is and gains a face. The most recognisable, but the narrow body leaves little room.", draw: onLogo },
  { key: "B", name: "Softened, with a face", note: "A rounder, wider spear tip with more room for expression. The friendliest, and the furthest from the logo.", draw: onSoft },
  { key: "C", name: "No face", note: "Only the logo's pose and small marks beside it show the state. The most serious, and the hardest to read.", draw: noFace },
];

const cards = (take) => STATES.map((s) => `<figure class="card"><div class="big">${svg(take.draw, s, 160, `Donovan, ${s}`)}</div><div class="small">${SIZES.slice(1).map((z) => svg(take.draw, s, z, `Donovan, ${s}, ${z} pixels`)).join("")}</div><figcaption>${s}</figcaption></figure>`).join("");

const inPlace = (take) => `<div class="app">
  <div class="bar">${svg(take.draw, "idle", 26, "Donovan")}<strong>DONOVAN</strong><span class="search">Search chats, skills, servers, models…</span></div>
  <div class="read"><span class="tile">${svg(take.draw, "thinking", 26, "Donovan, thinking")}</span><div><small>Donovan's read on your queue</small><p>Two things are time-sensitive. The go/no-go moved up to 2:00 PM, and a rollout note is waiting on your approval.</p></div></div>
  <div class="composer">${svg(take.draw, "listening", 16, "Donovan, listening")}<span>Ask about your brief…</span></div>
</div>`;

const section = (take) => `<section>
  <h2><span>${take.key}</span> ${take.name}</h2><p class="note">${take.note}</p>
  <h3>In place</h3>${inPlace(take)}
  <div class="themes"><div class="theme light"><h3>Light</h3><div class="grid">${cards(take)}</div></div><div class="theme dark"><h3>Dark</h3><div class="grid">${cards(take)}</div></div></div>
</section>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Donovan sketches</title><style>
:root{--ink:#24272d;--muted:#6f7c8b;--line:#edeef1;--surface:#fff}
*{box-sizing:border-box}body{margin:0;padding:32px 16px 64px;background:#fff;color:var(--ink);font:14px/1.5 Inter,-apple-system,BlinkMacSystemFont,sans-serif}
main{max-width:1500px;margin:auto}h1{font-size:26px;margin:0}h2{font-size:20px;margin:0}h2 span{display:inline-grid;place-items:center;width:28px;height:28px;margin-right:6px;border-radius:50%;background:#2c4261;color:#fff;font-size:14px}h3{font-size:12px;margin:20px 0 8px;color:var(--muted);font-weight:600}
.note{margin:4px 0 0;color:var(--muted)}section{margin-top:40px;padding-top:32px;border-top:1px solid var(--line)}
.themes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,600px),1fr));gap:16px}.theme{padding:0 16px 16px;border-radius:12px;background:var(--surface);color:var(--ink)}.theme h3{margin-top:12px;color:var(--muted)}
.light{--surface:#f7f8fa}.light .card{--surface:#fff}.dark{--surface:#14171c;--ink:#edeef1;--muted:#8e9aa8;--line:#2a2f37}.dark .card{--surface:#1d2127}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:8px}.card{margin:0;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);text-align:center}.big{display:flex;justify-content:center}.small{display:flex;align-items:center;justify-content:center;gap:12px;min-height:66px}figcaption{color:var(--muted);font-size:12px}svg{display:block;flex:none;overflow:visible}
.app{max-width:760px;border:1px solid var(--line);border-radius:12px;overflow:hidden}.bar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--line)}.search{margin-left:auto;padding:4px 12px;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:12px}.read{display:flex;gap:12px;margin:14px;padding:14px;border:1px solid var(--line);border-radius:10px}.tile{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:8px;background:#eef5ff}.read small{color:var(--muted)}.read p{margin:2px 0 0}.composer{display:flex;align-items:center;gap:8px;margin:14px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;color:var(--muted)}
</style></head><body><main><h1>Donovan sketches</h1><p class="note">Three takes on Donovan in all nine states, at 160, 64, 26 and 16 px. The spear tip is a placeholder until the real logo arrives.</p>${TAKES.map(section).join("")}</main></body></html>`;

writeFileSync(new URL("./sheet.html", import.meta.url), html);
