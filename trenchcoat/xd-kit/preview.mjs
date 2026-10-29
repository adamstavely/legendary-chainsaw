// Draws extracted components back as SVG, beside a screenshot of the real thing, so the kit can be checked without XD.
// The SVG follows XD's rules where they differ from the web's: one drop shadow per shape, point text placed by its
// baseline, area text wrapped in its box.
//   node xd-kit/preview.mjs <slug> [variant]     → xd-kit/.preview/<slug>.<variant>.html (variant: standard-light …)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rgba = (c) => (c ? `rgba(${c.r},${c.g},${c.b},${c.a})` : "none");

let uid = 0;
function rectPath(x, y, w, h, r = [0, 0, 0, 0]) {
  const [a, b, c, d] = r;
  return `M${x + a} ${y}H${x + w - b}${b ? `A${b} ${b} 0 0 1 ${x + w} ${y + b}` : ""}V${y + h - c}${c ? `A${c} ${c} 0 0 1 ${x + w - c} ${y + h}` : ""}H${x + d}${d ? `A${d} ${d} 0 0 1 ${x} ${y + h - d}` : ""}V${y + a}${a ? `A${a} ${a} 0 0 1 ${x + a} ${y}` : ""}Z`;
}

export function toSvg(layers, defs) {
  return layers.map((l) => layer(l, defs)).join("");
}
function layer(l, defs) {
  const op = l.opacity !== undefined ? ` opacity="${l.opacity}"` : "";
  if (l.t === "group") {
    let clip = "";
    if (l.clip) {
      const id = `c${++uid}`;
      defs.push(`<clipPath id="${id}"><path d="${rectPath(l.clip.x, l.clip.y, l.clip.w, l.clip.h, l.clip.radii)}"/></clipPath>`);
      clip = ` clip-path="url(#${id})"`;
    }
    return `<g${op}${clip}>${toSvg(l.layers, defs)}</g>`;
  }
  if (l.t === "rect") {
    let fill = rgba(l.fill);
    if (l.gradient) {
      const id = `g${++uid}`;
      defs.push(
        `<linearGradient id="${id}" x1="${l.gradient.start[0]}" y1="${l.gradient.start[1]}" x2="${l.gradient.end[0]}" y2="${l.gradient.end[1]}">${l.gradient.stops.map((s) => `<stop offset="${s.at}" stop-color="${rgba(s.color)}"/>`).join("")}</linearGradient>`,
      );
      fill = `url(#${id})`;
    }
    let filter = "";
    if (l.shadow) {
      const id = `s${++uid}`;
      defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${l.shadow.x}" dy="${l.shadow.y}" stdDeviation="${l.shadow.blur / 2}" flood-color="${rgba(l.shadow.color)}"/></filter>`);
      filter = ` filter="url(#${id})"`;
      if (fill === "none") fill = "rgba(0,0,0,0.001)";
    }
    let out = `<path d="${rectPath(l.x, l.y, l.w, l.h, l.radii)}" fill="${fill}"${filter}${op}/>`;
    if (l.stroke) {
      // XD's inner stroke: drawn inset by half its width
      const s = l.stroke;
      const k = s.outside ? -s.width / 2 : s.width / 2;
      const r = (l.radii ?? [0, 0, 0, 0]).map((v) => Math.max(0, v - k));
      out += `<path d="${rectPath(l.x + k, l.y + k, l.w - 2 * k, l.h - 2 * k, r)}" fill="none" stroke="${rgba(s.color)}" stroke-width="${s.width}"${s.dash ? ` stroke-dasharray="${s.dash.join(" ")}"` : ""}${op}/>`;
    }
    return out;
  }
  if (l.t === "path") {
    const s = l.stroke;
    return `<path d="${l.d}" fill="${rgba(l.fill)}"${s ? ` stroke="${rgba(s.color)}" stroke-width="${s.width}" stroke-linecap="${s.cap ?? "butt"}" stroke-linejoin="${s.join ?? "miter"}"${s.dash ? ` stroke-dasharray="${s.dash.join(" ")}"` : ""}` : ""}${op}/>`;
  }
  if (l.t === "image") {
    return `<image href="${esc(l.src)}" x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" preserveAspectRatio="xMidYMid slice"/>`;
  }
  if (l.t === "text") {
    const f = l.font;
    const family = f.family === "mono" ? "Menlo, monospace" : "Inter";
    const style = `font-family:${family};font-size:${f.size}px;font-weight:${f.weight};${f.italic ? "font-style:italic;" : ""}letter-spacing:${(f.tracking / 1000) * f.size}px;${f.transform !== "none" ? `text-transform:${f.transform === "titlecase" ? "capitalize" : f.transform};` : ""}${f.underline ? "text-decoration:underline;" : ""}${f.strike ? "text-decoration:line-through;" : ""}`;
    if (!l.area) {
      const anchor = { left: "start", center: "middle", right: "end" }[l.align];
      return `<text x="${l.x}" y="${l.y}" text-anchor="${anchor}" fill="${rgba(l.color)}" style="${style}white-space:pre">${esc(f.transform === "uppercase" ? l.text.toUpperCase() : l.text)}</text>`;
    }
    // Area text: the first baseline `baseline` below the top, then a line every `lineHeight`
    const firstBaseline = (l.lineHeight - f.size * 1.21) / 2 + f.size * 0.969;
    return `<foreignObject x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h + 40}"><div xmlns="http://www.w3.org/1999/xhtml" style="${style}color:${rgba(l.color)};line-height:${l.lineHeight}px;text-align:${l.align};white-space:pre-wrap;margin-top:${l.baseline - firstBaseline}px">${esc(l.text)}</div></foreignObject>`;
  }
  return "";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [slug, only] = process.argv.slice(2);
  const data = JSON.parse(readFileSync(join(HERE, "plugin", "kit", `${slug}.json`), "utf8"));
  const out = join(HERE, ".preview");
  mkdirSync(out, { recursive: true });
  for (const [variant, tree] of Object.entries(data.variants)) {
    if (!tree || (only && variant !== only)) continue;
    const defs = [];
    const body = toSvg(tree.layers, defs);
    const bg = variant.endsWith("dark") ? "#0e0e10" : "#fafaf9";
    const pad = 24;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tree.w + 2 * pad}" height="${tree.h + 2 * pad}" viewBox="${tree.x - pad} ${tree.y - pad} ${tree.w + 2 * pad} ${tree.h + 2 * pad}"><defs>${defs.join("")}</defs><rect x="${tree.x - pad}" y="${tree.y - pad}" width="100%" height="100%" fill="${bg}"/>${body}</svg>`;
    writeFileSync(join(out, `${slug}.${variant}.svg`), svg);
  }
  console.log(`preview: ${out}`);
}
