// Runs in the page (added by xd-kit/extract.mjs): reads a rendered component back out of the DOM as a tree of plain
// layers – rectangles, text, vector paths and images – in the shapes Adobe XD's plugin API can rebuild. Coordinates are
// CSS pixels from the top-left of the component, colours are { r, g, b, a } with channels 0–255 and a 0–1.
//
//   window.__xdMaterialize(roots)   ::before / ::after with content → real spans (call before reading, per theme)
//   window.__xdRestore()            undoes it
//   window.__xdExtract(roots)       → { w, h, layers }
//
// Layer kinds:
//   { t: "rect", name, x, y, w, h, fill?, gradient?, stroke?, radii?, shadow?, opacity? }
//   { t: "text", name, x, y, w?, h?, text, font, color, align, area, lineHeight, baseline }
//   { t: "path", name, d, fill?, stroke?, opacity? }
//   { t: "image", name, x, y, w, h, src, radii? }
//   { t: "group", name, layers, opacity?, clip? }
(() => {
  /* ---------- Colours ---------- */

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const colours = new Map();
  /** Any CSS colour the browser computed → { r, g, b, a }, or null when it paints nothing */
  function colour(css, alpha = 1) {
    if (!css || css === "none" || css === "transparent") return null;
    let c = colours.get(css);
    if (c === undefined) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#010203";
      ctx.fillStyle = css;
      // Painting and reading back converts every syntax (color(), oklch(), color-mix()) to sRGB
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      c = a === 0 ? null : { r, g, b, a: Math.round((a / 255) * 1000) / 1000 };
      colours.set(css, c);
    }
    if (!c) return null;
    const a = Math.round(c.a * alpha * 1000) / 1000;
    return a <= 0.004 ? null : { ...c, a };
  }

  /* ---------- Geometry helpers ---------- */

  let ox = 0;
  let oy = 0;
  const rnd = (n) => Math.round(n * 100) / 100;
  const box = (r) => ({ x: rnd(r.left - ox), y: rnd(r.top - oy), w: rnd(r.width), h: rnd(r.height) });
  const px = (v) => parseFloat(v) || 0;

  function radii(cs, w, h) {
    const one = (v, size) => {
      const first = v.split(" ")[0];
      return first.endsWith("%") ? (parseFloat(first) / 100) * size : px(first);
    };
    const cap = Math.min(w, h) / 2;
    const r = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map((v, i) =>
      rnd(Math.min(cap, one(v, i % 2 ? h : w))),
    );
    return r.some((v) => v > 0) ? r : undefined;
  }

  /** Splits a comma-separated CSS list, leaving commas inside parentheses alone */
  function splitList(v) {
    const out = [];
    let depth = 0;
    let cur = "";
    for (const ch of v) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  /** box-shadow → [{ inset, x, y, blur, spread, color }] */
  function shadows(v) {
    if (!v || v === "none") return [];
    return splitList(v).map((s) => {
      const inset = /\binset\b/.test(s);
      const col = s.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]+|\b[a-z]+\b(?<!inset))/i);
      const nums = s
        .replace(col ? col[0] : "", "")
        .replace("inset", "")
        .trim()
        .split(/\s+/)
        .map(px);
      return { inset, x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0, color: colour(col ? col[0] : "black") };
    });
  }

  /** linear-gradient(...) → XD's start and end points (fractions of the box) and stops; other gradients → null */
  function linearGradient(v, w, h) {
    const m = v.match(/^linear-gradient\((.*)\)$/s);
    if (!m) return null;
    const parts = splitList(m[1]);
    let angle = 180;
    if (/^-?[\d.]+(deg|turn|rad)$/.test(parts[0])) {
      const a = parts.shift();
      angle = a.endsWith("turn") ? parseFloat(a) * 360 : a.endsWith("rad") ? (parseFloat(a) * 180) / Math.PI : parseFloat(a);
    } else if (parts[0].startsWith("to ")) {
      const dir = parts.shift();
      const map = { "to top": 0, "to right": 90, "to bottom": 180, "to left": 270, "to top right": 45, "to right top": 45, "to bottom right": 135, "to right bottom": 135, "to bottom left": 225, "to left bottom": 225, "to top left": 315, "to left top": 315 };
      angle = map[dir] ?? 180;
    }
    const stops = [];
    parts.forEach((p, i) => {
      const pos = p.match(/\s(-?[\d.]+)(%|px)\s*$/);
      const col = colour(pos ? p.slice(0, pos.index) : p);
      let at = pos ? (pos[2] === "%" ? parseFloat(pos[1]) / 100 : parseFloat(pos[1]) / Math.max(1, w)) : NaN;
      stops.push({ at, color: col ?? { r: 0, g: 0, b: 0, a: 0 } });
    });
    if (stops.length < 2) return null;
    // Unpositioned stops spread evenly between their neighbours, as CSS does
    if (Number.isNaN(stops[0].at)) stops[0].at = 0;
    if (Number.isNaN(stops[stops.length - 1].at)) stops[stops.length - 1].at = 1;
    for (let i = 1; i < stops.length - 1; i++) {
      if (!Number.isNaN(stops[i].at)) continue;
      let j = i;
      while (Number.isNaN(stops[j].at)) j++;
      for (let k = i; k < j; k++) stops[k].at = stops[i - 1].at + ((stops[j].at - stops[i - 1].at) * (k - i + 1)) / (j - i + 1);
    }
    for (let i = 1; i < stops.length; i++) stops[i].at = Math.max(stops[i].at, stops[i - 1].at + 0.0001);
    // CSS's gradient line runs through the centre at `angle`, long enough to reach the corners
    const rad = (angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    const sx = 0.5 - (dx * half) / Math.max(1, w);
    const sy = 0.5 - (dy * half) / Math.max(1, h);
    return {
      start: [rnd(sx), rnd(sy)],
      end: [rnd(1 - sx + 0), rnd(1 - sy)],
      stops: stops.map((s) => ({ at: Math.min(1, Math.max(0, rnd(s.at))), color: s.color })),
    };
  }

  /* ---------- SVG paths: any path data → absolute M / L / C / Z, through a matrix ---------- */

  function shapeToPath(el) {
    const n = (a) => el[a]?.baseVal?.value ?? px(el.getAttribute(a));
    switch (el.tagName.toLowerCase()) {
      case "path":
        return el.getAttribute("d") || "";
      case "rect": {
        const x = n("x"), y = n("y"), w = n("width"), h = n("height");
        let rx = n("rx"), ry = n("ry");
        if (!el.hasAttribute("ry")) ry = rx;
        if (!el.hasAttribute("rx")) rx = ry;
        rx = Math.min(rx, w / 2);
        ry = Math.min(ry, h / 2);
        if (!rx && !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
        return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
      }
      case "circle":
      case "ellipse": {
        const cx = n("cx"), cy = n("cy");
        const rx = el.tagName.toLowerCase() === "circle" ? n("r") : n("rx");
        const ry = el.tagName.toLowerCase() === "circle" ? n("r") : n("ry");
        return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
      }
      case "line":
        return `M${n("x1")} ${n("y1")}L${n("x2")} ${n("y2")}`;
      case "polyline":
      case "polygon": {
        const pts = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
        let d = "";
        for (let i = 0; i + 1 < pts.length; i += 2) d += `${i ? "L" : "M"}${pts[i]} ${pts[i + 1]}`;
        return el.tagName.toLowerCase() === "polygon" ? d + "Z" : d;
      }
    }
    return "";
  }

  /** Arc → cubic Béziers (endpoint parameterisation, per the SVG spec's implementation notes) */
  function arcToCubics(x1, y1, rx, ry, phi, large, sweep, x2, y2) {
    // An arc to its own start draws nothing (SVG omits it); a flat one is a straight line
    if (x1 === x2 && y1 === y2) return [];
    if (!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const s = Math.sin((phi * Math.PI) / 180);
    const c = Math.cos((phi * Math.PI) / 180);
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1p = c * dx + s * dy;
    const y1p = -s * dx + c * dy;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) {
      rx *= Math.sqrt(lam);
      ry *= Math.sqrt(lam);
    }
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let k = den ? Math.sqrt(Math.max(0, num / den)) : 0;
    if (large === sweep) k = -k;
    const cxp = (k * rx * y1p) / ry;
    const cyp = (-k * ry * x1p) / rx;
    const cx = c * cxp - s * cyp + (x1 + x2) / 2;
    const cy = s * cxp + c * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => {
      const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      return a;
    };
    const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && dt > 0) dt -= 2 * Math.PI;
    if (sweep && dt < 0) dt += 2 * Math.PI;
    const segs = Math.ceil(Math.abs(dt) / (Math.PI / 2));
    const out = [];
    const delta = dt / segs;
    const t = (4 / 3) * Math.tan(delta / 4);
    let th = t1;
    const pt = (a) => [cx + rx * Math.cos(a) * c - ry * Math.sin(a) * s, cy + rx * Math.cos(a) * s + ry * Math.sin(a) * c];
    const dpt = (a) => [-rx * Math.sin(a) * c - ry * Math.cos(a) * s, -rx * Math.sin(a) * s + ry * Math.cos(a) * c];
    for (let i = 0; i < segs; i++) {
      const a0 = th;
      const a1 = th + delta;
      const p0 = pt(a0);
      const p1 = pt(a1);
      const d0 = dpt(a0);
      const d1 = dpt(a1);
      out.push([p0[0] + t * d0[0], p0[1] + t * d0[1], p1[0] - t * d1[0], p1[1] - t * d1[1], p1[0], p1[1]]);
      th = a1;
    }
    return out;
  }

  /** Path data → absolute "M x y L x y C … Z", every point through `m` (a DOMMatrix) */
  function normalisePath(d, m) {
    // Tokens: commands, numbers, and – where an arc's flags go – single 0 / 1 digits, which may run into what follows
    // ("a2 2 0 001.2-1" is flags 0, 0 then 1.2)
    const tokens = [];
    {
      const num = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/i;
      let rest = d;
      let cmdNow = "";
      let argN = 0;
      while ((rest = rest.replace(/^[\s,]+/, ""))) {
        if (/^[a-zA-Z]/.test(rest)) {
          cmdNow = rest[0].toUpperCase();
          argN = 0;
          tokens.push(rest[0]);
          rest = rest.slice(1);
          continue;
        }
        const slot = argN % 7;
        if (cmdNow === "A" && (slot === 3 || slot === 4) && /^[01]/.test(rest)) {
          tokens.push(rest[0]);
          rest = rest.slice(1);
        } else {
          const m = rest.match(num);
          if (!m) break;
          tokens.push(m[0]);
          rest = rest.slice(m[0].length);
        }
        argN++;
      }
    }
    let i = 0;
    let cmd = "";
    let x = 0, y = 0, sx = 0, sy = 0;
    let lcx = 0, lcy = 0, lqx = 0, lqy = 0, prev = "";
    const out = [];
    const P = (px_, py_) => {
      const p = m.transformPoint(new DOMPoint(px_, py_));
      return `${rnd(p.x - ox)} ${rnd(p.y - oy)}`;
    };
    const num = () => parseFloat(tokens[i++]);
    const isNum = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]);
    while (i < tokens.length) {
      if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
      const rel = cmd === cmd.toLowerCase();
      const C = cmd.toUpperCase();
      if (C === "Z") {
        out.push("Z");
        x = sx;
        y = sy;
        prev = "Z";
        continue;
      }
      if (!isNum()) break;
      const bx = rel ? x : 0;
      const by = rel ? y : 0;
      if (C === "M") {
        x = bx + num();
        y = by + num();
        sx = x;
        sy = y;
        out.push(`M${P(x, y)}`);
        cmd = rel ? "l" : "L";
      } else if (C === "L") {
        x = bx + num();
        y = by + num();
        out.push(`L${P(x, y)}`);
      } else if (C === "H") {
        x = (rel ? x : 0) + num();
        out.push(`L${P(x, y)}`);
      } else if (C === "V") {
        y = (rel ? y : 0) + num();
        out.push(`L${P(x, y)}`);
      } else if (C === "C" || C === "S") {
        let x1, y1;
        if (C === "C") {
          x1 = bx + num();
          y1 = by + num();
        } else {
          [x1, y1] = /[CS]/.test(prev) ? [2 * x - lcx, 2 * y - lcy] : [x, y];
        }
        const x2 = bx + num(), y2 = by + num(), ex = bx + num(), ey = by + num();
        out.push(`C${P(x1, y1)} ${P(x2, y2)} ${P(ex, ey)}`);
        lcx = x2;
        lcy = y2;
        x = ex;
        y = ey;
      } else if (C === "Q" || C === "T") {
        let qx, qy;
        if (C === "Q") {
          qx = bx + num();
          qy = by + num();
        } else {
          [qx, qy] = /[QT]/.test(prev) ? [2 * x - lqx, 2 * y - lqy] : [x, y];
        }
        const ex = bx + num(), ey = by + num();
        out.push(`C${P(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y))} ${P(ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey))} ${P(ex, ey)}`);
        lqx = qx;
        lqy = qy;
        x = ex;
        y = ey;
      } else if (C === "A") {
        const rx = num(), ry = num(), rot = num(), large = num(), sweep = num();
        const ex = bx + num(), ey = by + num();
        for (const c of arcToCubics(x, y, rx, ry, rot, !!large, !!sweep, ex, ey)) out.push(`C${P(c[0], c[1])} ${P(c[2], c[3])} ${P(c[4], c[5])}`);
        x = ex;
        y = ey;
      } else {
        i++;
      }
      prev = C;
    }
    // Whatever the maths couldn't place is left out rather than handed to XD as NaN
    return out.filter((seg) => !seg.includes("NaN")).join("");
  }

  /* ---------- Fonts and text ---------- */

  const ascents = new Map();
  /** The share of a line's content box above the baseline, for this font */
  function ascentRatio(cs) {
    const key = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    let r = ascents.get(key);
    if (r === undefined) {
      ctx.font = key;
      const m = ctx.measureText("Hg");
      r = m.fontBoundingBoxAscent / (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) || 0.8;
      ascents.set(key, r);
    }
    return r;
  }
  const TEXT_PROPS = ["fontStyle", "fontWeight", "fontFamily", "fontSize", "letterSpacing", "textTransform", "textDecorationLine", "fontVariantNumeric", "color", "textAlign"];
  /** The text properties of a computed style, some replaced (a computed style can't be spread) */
  const styleWith = (cs, over) => Object.assign(Object.fromEntries(TEXT_PROPS.map((p) => [p, cs[p]])), over);
  function fontOf(cs) {
    const fam = cs.fontFamily.toLowerCase();
    let decoration = cs.textDecorationLine;
    return {
      family: /mono|menlo|consolas|courier/.test(fam.split(",")[0]) ? "mono" : "sans",
      weight: Math.round(px(cs.fontWeight) / 100) * 100 || 400,
      italic: cs.fontStyle === "italic" || cs.fontStyle.startsWith("oblique"),
      size: rnd(px(cs.fontSize)),
      tracking: cs.letterSpacing === "normal" ? 0 : Math.round((px(cs.letterSpacing) / px(cs.fontSize)) * 1000),
      transform: { uppercase: "uppercase", lowercase: "lowercase", capitalize: "titlecase" }[cs.textTransform] ?? "none",
      underline: decoration.includes("underline") || undefined,
      strike: decoration.includes("line-through") || undefined,
      tabular: cs.fontVariantNumeric.includes("tabular-nums") || undefined,
    };
  }
  /** Text decorations come from the inline ancestors up to the block that holds the text */
  function decorationOf(el) {
    const d = { underline: false, strike: false };
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.textDecorationLine.includes("underline")) d.underline = true;
      if (cs.textDecorationLine.includes("line-through")) d.strike = true;
      if (cs.display !== "inline") break;
    }
    return d;
  }
  function blockOf(el) {
    for (let e = el; e; e = e.parentElement) {
      const d = getComputedStyle(e).display;
      if (d !== "inline" && d !== "contents") return e;
    }
    return el;
  }
  function contentBox(el) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      left: r.left + px(cs.borderLeftWidth) + px(cs.paddingLeft),
      right: r.right - px(cs.borderRightWidth) - px(cs.paddingRight),
      top: r.top + px(cs.borderTopWidth) + px(cs.paddingTop),
    };
  }
  function measure(cs, s) {
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    return ctx.measureText(s).width;
  }

  /** A text layer for `str` drawn in `rects` (the client rects of its lines), styled by `cs` */
  function textLayer(str, rects, cs, el, name) {
    const lines = [];
    for (const r of rects) {
      if (r.width < 0.5 || r.height < 0.5) continue;
      const line = lines.find((l) => Math.abs(l.top - r.top) < 2);
      if (line) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
      } else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
    }
    if (!lines.length) return null;
    lines.sort((a, b) => a.top - b.top);
    const font = fontOf(cs);
    const deco = decorationOf(el);
    if (deco.underline) font.underline = true;
    if (deco.strike) font.strike = true;
    const ratio = ascentRatio(cs);
    const first = lines[0];
    const baseline = first.top + (first.bottom - first.top) * ratio;
    const color = colour(cs.color);
    if (!color) return null;
    const align = { center: "center", right: "right", end: "right", "-webkit-center": "center" }[cs.textAlign] ?? "left";
    if (lines.length === 1) {
      const anchor = align === "center" ? (first.left + first.right) / 2 : align === "right" ? first.right : first.left;
      return { t: "text", name, text: str, font, color, align, area: false, x: rnd(anchor - ox), y: rnd(baseline - oy), w: rnd(first.right - first.left), h: rnd(first.bottom - first.top) };
    }
    // Wrapped text: an area as wide as the block it wraps in, its lines as far apart as the browser set them
    const block = contentBox(blockOf(el));
    const lineHeight = rnd((lines[lines.length - 1].top - first.top) / (lines.length - 1));
    const left = Math.min(block.left, ...lines.map((l) => l.left));
    const right = Math.max(block.right, ...lines.map((l) => l.right));
    const top = baseline - lineHeight * 0.5 - (first.bottom - first.top) * (ratio - 0.5);
    return {
      t: "text",
      name,
      text: str,
      font,
      color,
      align,
      area: true,
      x: rnd(left - ox),
      y: rnd(top - oy),
      w: rnd(right - left + 2),
      h: rnd(lines[lines.length - 1].bottom - top + 2),
      lineHeight,
      baseline: rnd(baseline - top),
    };
  }

  /** The text a nowrap + ellipsis element shows, cut to fit */
  function ellipsised(str, cs, el, startX) {
    const end = contentBox(el).right;
    if (measure(cs, str) <= end - startX + 0.5) return str;
    let lo = 0;
    let hi = str.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (measure(cs, str.slice(0, mid).trimEnd() + "…") <= end - startX) lo = mid;
      else hi = mid - 1;
    }
    return str.slice(0, lo).trimEnd() + "…";
  }

  /* ---------- ::before and ::after as real elements ---------- */

  const made = [];
  const SKIP_PROPS = new Set(["content", "counter-increment", "counter-reset", "counter-set", "quotes", "animation", "animation-name", "transition", "transition-property"]);
  function pseudoText(content, el) {
    if (!content || content === "none" || content === "normal") return null;
    // `"↵" / ""` – the part after the slash is the alternative text
    const main = content.split(/\s\/\s/)[0];
    let s = "";
    const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|attr\(([^)]+)\)|(open-quote|close-quote)/g;
    let m;
    let any = false;
    while ((m = re.exec(main))) {
      any = true;
      if (m[1] !== undefined || m[2] !== undefined) s += (m[1] ?? m[2]).replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, "$1");
      else if (m[3]) s += el.getAttribute(m[3].trim()) ?? "";
      else s += m[4] === "open-quote" ? "“" : "”";
    }
    return any ? s : null;
  }
  window.__xdMaterialize = (roots) => {
    if (!document.getElementById("xd-nopseudo")) {
      const st = document.createElement("style");
      st.id = "xd-nopseudo";
      st.textContent = ".xd-nopseudo-b::before { content: none !important; } .xd-nopseudo-a::after { content: none !important; }";
      document.head.append(st);
    }
    for (const root of roots) {
      const els = [root, ...root.querySelectorAll("*")].filter((e) => !(e instanceof SVGElement) && !/^(input|textarea|select|img|br|hr|svg|canvas|video|iframe)$/i.test(e.tagName));
      const plan = [];
      for (const el of els) {
        for (const which of ["::before", "::after"]) {
          const pcs = getComputedStyle(el, which);
          const text = pseudoText(pcs.content, el);
          if (text === null || pcs.display === "none") continue;
          const style = [];
          for (let i = 0; i < pcs.length; i++) {
            const p = pcs[i];
            if (!SKIP_PROPS.has(p)) style.push(`${p}:${pcs.getPropertyValue(p)}`);
          }
          plan.push({ el, which, text, style: style.join(";") });
        }
      }
      // Read everything first, then write, so one pseudo-element's span doesn't change the next one's styles
      for (const p of plan) {
        const span = document.createElement("span");
        span.dataset.xdPseudo = p.which;
        span.setAttribute("style", p.style);
        span.textContent = p.text;
        if (p.which === "::before") p.el.prepend(span);
        else p.el.append(span);
        p.el.classList.add(p.which === "::before" ? "xd-nopseudo-b" : "xd-nopseudo-a");
        made.push({ span, el: p.el });
      }
    }
  };
  window.__xdRestore = () => {
    for (const { span, el } of made.splice(0)) {
      span.remove();
      el.classList.remove("xd-nopseudo-b", "xd-nopseudo-a");
    }
  };

  /* ---------- Images ---------- */

  function rasterise(el) {
    try {
      if (el instanceof HTMLCanvasElement) return el.toDataURL("image/png");
      if (el instanceof HTMLImageElement && el.complete && el.naturalWidth) {
        const c = document.createElement("canvas");
        c.width = el.naturalWidth;
        c.height = el.naturalHeight;
        c.getContext("2d").drawImage(el, 0, 0);
        return c.toDataURL("image/png");
      }
    } catch {
      // A cross-origin image taints the canvas: no pixels to give
    }
    return null;
  }

  /* ---------- The walk ---------- */

  const nameOf = (el) => {
    const tag = el.tagName.toLowerCase();
    if (el.dataset?.xdPseudo) return el.dataset.xdPseudo === "::before" ? "before" : "after";
    const ui = [...el.classList].find((c) => /^ui-[a-z0-9]+__/.test(c));
    if (ui) return ui.replace(/^ui-[a-z0-9]+__/, "");
    if (tag.startsWith("tc-")) return tag.slice(3);
    const cls = [...el.classList].find((c) => !c.startsWith("xd-"));
    return cls || tag;
  };
  const hidden = (cs) => cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse" || px(cs.opacity) === 0;
  const srOnly = (el, cs, r) =>
    (r.width <= 1.5 && r.height <= 1.5 && cs.overflow !== "visible") || cs.clip === "rect(0px, 0px, 0px, 0px)" || /inset\(50%\)/.test(cs.clipPath) || el.classList.contains("tc-sr-only");

  function paintBox(el, cs, r, name) {
    const out = [];
    const b = box(r);
    if (b.w < 0.5 || b.h < 0.5) return out;
    const rad = radii(cs, r.width, r.height);
    const layer = { t: "rect", name, ...b };
    if (rad) layer.radii = rad;
    let paints = false;
    const bg = colour(cs.backgroundColor);
    if (bg) {
      layer.fill = bg;
      paints = true;
    }
    // Background images, bottom layer first (CSS lists the top one first): each linear gradient is a shape of its own
    // with XD's gradient fill, so stacked gradients still mix; a data: url() is an image; other kinds are left out
    const overlays = [];
    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      for (const img of splitList(cs.backgroundImage).reverse()) {
        const g = linearGradient(img, r.width, r.height);
        if (g) {
          const o = { t: "rect", name: `${name} gradient`, ...b, gradient: g };
          if (rad) o.radii = rad;
          overlays.push(o);
          continue;
        }
        const url = img.match(/^url\("?(.*?)"?\)$/);
        if (url && url[1].startsWith("data:image/")) overlays.push({ t: "image", name: `${name} image`, ...b, src: url[1], radii: rad });
      }
    }
    // Borders: four equal sides → the rectangle's stroke; otherwise a thin bar per side
    const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
      w: cs[`border${s}Style`] === "none" || cs[`border${s}Style`] === "hidden" ? 0 : px(cs[`border${s}Width`]),
      c: cs[`border${s}Color`],
      style: cs[`border${s}Style`],
    }));
    const live = sides.filter((s) => s.w > 0 && colour(s.c));
    const extra = [];
    if (live.length === 4 && sides.every((s) => s.w === sides[0].w && s.c === sides[0].c)) {
      layer.stroke = { color: colour(sides[0].c), width: sides[0].w, inside: true, dash: sides[0].style === "dashed" ? [sides[0].w * 3, sides[0].w * 2] : sides[0].style === "dotted" ? [sides[0].w, sides[0].w] : undefined };
      paints = true;
    } else if (live.length) {
      const [t, rr, bb, l] = sides;
      const bars = [
        [t, b.x, b.y, b.w, t.w],
        [rr, b.x + b.w - rr.w, b.y, rr.w, b.h],
        [bb, b.x, b.y + b.h - bb.w, b.w, bb.w],
        [l, b.x, b.y, l.w, b.h],
      ];
      bars.forEach(([s, x, y, w, h], i) => {
        const col = s.w > 0 && colour(s.c);
        if (col) extra.push({ t: "rect", name: `${name} border-${["top", "right", "bottom", "left"][i]}`, x: rnd(x), y: rnd(y), w: rnd(w), h: rnd(h), fill: col });
      });
    }
    // box-shadow: a crisp ring (no blur, no offset) is a border; the strongest soft outer shadow is XD's drop shadow
    let best = null;
    for (const s of shadows(cs.boxShadow)) {
      if (!s.color) continue;
      if (!s.blur && !s.x && !s.y && s.spread > 0) {
        if (!layer.stroke) {
          layer.stroke = { color: s.color, width: s.spread, inside: s.inset, outside: !s.inset };
          paints = true;
        } else {
          const ring = { t: "rect", name: `${name} ring`, ...b, stroke: { color: s.color, width: s.spread, inside: s.inset, outside: !s.inset } };
          if (rad) ring.radii = rad;
          extra.push(ring);
        }
      } else if (!s.inset && (s.blur > 0 || s.x || s.y)) {
        const weight = s.color.a * (s.blur + Math.abs(s.y) + Math.abs(s.x) + s.spread);
        if (!best || weight > best.weight) best = { ...s, weight };
      }
    }
    if (best) {
      layer.shadow = { x: best.x, y: best.y, blur: best.blur + best.spread, color: best.color };
      if (!paints) {
        // A shadow needs a shape to cast it: the box, filled with the colour behind it would be wrong, so leave it clear
        paints = true;
      }
    }
    if (overlays.length) {
      // One gradient and nothing else: the box itself takes it
      if (!layer.fill && !layer.stroke && !layer.shadow && overlays.length === 1 && overlays[0].gradient) {
        layer.gradient = overlays[0].gradient;
        paints = true;
        overlays.length = 0;
      } else if (layer.stroke) {
        // The border goes over the gradients, as CSS draws it
        const ring = { t: "rect", name: `${name} border`, ...b, stroke: layer.stroke };
        if (rad) ring.radii = rad;
        delete layer.stroke;
        overlays.push(ring);
      }
    }
    if (paints && (layer.fill || layer.stroke || layer.shadow || layer.gradient)) out.push(layer);
    out.push(...overlays, ...extra);
    return out;
  }

  function fieldText(el, cs, name) {
    const r = el.getBoundingClientRect();
    let str = "";
    let col = cs.color;
    if (el instanceof HTMLSelectElement) str = el.selectedOptions[0]?.textContent ?? "";
    else if (el.type === "checkbox" || el.type === "radio" || el.type === "range" || el.type === "color") return null;
    else {
      str = el.value;
      if (!str && el.placeholder) {
        str = el.placeholder;
        col = getComputedStyle(el, "::placeholder").color;
      }
      if (el.type === "password") str = "•".repeat(str.length);
    }
    if (!str.trim()) return null;
    const pad = { l: px(cs.paddingLeft) + px(cs.borderLeftWidth), t: px(cs.paddingTop) + px(cs.borderTopWidth), b: px(cs.paddingBottom) + px(cs.borderBottomWidth) };
    const lh = cs.lineHeight === "normal" ? px(cs.fontSize) * 1.2 : px(cs.lineHeight);
    if (el instanceof HTMLTextAreaElement) {
      const fakeRects = [];
      const width = r.width - pad.l - px(cs.paddingRight) - px(cs.borderRightWidth);
      // Wrap by measuring words, the way the field does
      const lines = [];
      for (const para of str.split("\n")) {
        let line = "";
        for (const word of para.split(" ")) {
          const t = line ? `${line} ${word}` : word;
          if (line && measure(cs, t) > width) {
            lines.push(line);
            line = word;
          } else line = t;
        }
        lines.push(line);
      }
      const top = r.top + pad.t;
      const visible = Math.max(1, Math.floor((r.height - pad.t - pad.b) / lh));
      lines.slice(0, visible).forEach((_, i) => fakeRects.push({ top: top + i * lh, bottom: top + (i + 1) * lh, left: r.left + pad.l, right: r.left + pad.l + width, width, height: lh }));
      const layer = textLayer(lines.slice(0, visible).join("\n"), fakeRects, styleWith(cs, { color: col }), el, `${name} text`);
      if (layer) layer.color = colour(col) ?? layer.color;
      return layer;
    }
    // Single line: vertically centred in the field, the way inputs and selects draw their text
    const size = px(cs.fontSize);
    const contentH = size * 1.21;
    const top = r.top + (r.height - contentH) / 2;
    const inner = { left: r.left + pad.l, right: r.right - px(cs.paddingRight) - px(cs.borderRightWidth) };
    const shown = ellipsised(str, cs, el, inner.left);
    const w = measure(cs, shown);
    const align = { center: "center", right: "right", end: "right" }[cs.textAlign] ?? "left";
    const left = align === "center" ? (inner.left + inner.right - w) / 2 : align === "right" ? inner.right - w : inner.left;
    const fake = { top, bottom: top + contentH, left, right: left + w, width: w, height: contentH };
    const layer = textLayer(shown, [fake], styleWith(cs, { color: col }), el, `${name} text`);
    if (layer) layer.color = colour(col) ?? layer.color;
    return layer;
  }

  function walkSvg(svg, name, inheritedOpacity) {
    const layers = [];
    const visit = (node, op) => {
      for (const child of node.children) {
        const tag = child.tagName.toLowerCase();
        if (/^(defs|clippath|mask|symbol|marker|pattern|lineargradient|radialgradient|title|desc|style|filter)$/.test(tag)) continue;
        const cs = getComputedStyle(child);
        if (hidden(cs)) continue;
        const o = op * px(cs.opacity === "" ? "1" : cs.opacity);
        if (tag === "g" || tag === "a" || tag === "svg") {
          visit(child, o);
          continue;
        }
        if (tag === "text") {
          const r = child.getBoundingClientRect();
          const str = child.textContent.trim();
          if (!str || r.width < 0.5) continue;
          const fillC = colour(cs.fill);
          const l = textLayer(str, [r], styleWith(cs, { color: cs.fill, textAlign: "left" }), child, `${name} text`);
          if (l && fillC) {
            l.color = colour(cs.fill, px(cs.fillOpacity) * o);
            layers.push(l);
          }
          continue;
        }
        if (tag === "foreignobject") continue;
        if (tag === "image") {
          const href = child.getAttribute("href") || child.getAttribute("xlink:href");
          const r = child.getBoundingClientRect();
          if (href?.startsWith("data:image/")) layers.push({ t: "image", name: `${name} image`, ...box(r), src: href });
          continue;
        }
        if (!/^(path|rect|circle|ellipse|line|polyline|polygon)$/.test(tag)) continue;
        const d0 = shapeToPath(child);
        if (!d0) continue;
        const ctm = child.getScreenCTM();
        if (!ctm) continue;
        const m = new DOMMatrix([ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f]);
        const d = normalisePath(d0, m);
        if (!d) continue;
        const scale = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c)) || 1;
        const paintOf = (v) => {
          if (!v || v === "none") return null;
          const url = v.match(/url\("?#([^")]+)"?\)/);
          if (url) {
            const g = document.getElementById(url[1]);
            const stop = g?.querySelector("stop");
            if (!stop) return null;
            const scs = getComputedStyle(stop);
            return colour(scs.stopColor, px(scs.stopOpacity || "1"));
          }
          return colour(v);
        };
        const fill = paintOf(cs.fill);
        const stroke = paintOf(cs.stroke);
        const layer = { t: "path", name: `${name} ${tag}`, d };
        if (fill) layer.fill = { ...fill, a: rnd(fill.a * px(cs.fillOpacity || "1")) };
        if (stroke && px(cs.strokeWidth) > 0) {
          const nonScaling = cs.vectorEffect === "non-scaling-stroke";
          const w = px(cs.strokeWidth) * (nonScaling ? 1 : scale);
          const dash = cs.strokeDasharray && cs.strokeDasharray !== "none" ? cs.strokeDasharray.split(/[\s,]+/).map((v) => rnd(px(v) * (nonScaling ? 1 : scale))) : undefined;
          // A dash pattern used to draw a line in (dashoffset = length) leaves nothing showing: skip the stroke
          const offset = px(cs.strokeDashoffset) * scale;
          const drawnOut = dash && dash.length === 1 && Math.abs(offset) >= dash[0] - 0.5;
          if (!drawnOut) layer.stroke = { color: { ...stroke, a: rnd(stroke.a * px(cs.strokeOpacity || "1")) }, width: rnd(w), cap: cs.strokeLinecap, join: cs.strokeLinejoin, dash: dash?.every((v) => v === 0) ? undefined : dash };
        }
        if (!layer.fill && !layer.stroke) continue;
        if (o * inheritedOpacity < 0.999) layer.opacity = rnd(o);
        layers.push(layer);
      }
    };
    visit(svg, 1);
    return layers;
  }

  /** One element → its layers (a group when it has a look of its own and children, or several children with a name) */
  function walk(el, depth) {
    const cs = getComputedStyle(el);
    if (hidden(cs)) return [];
    const r = el.getBoundingClientRect();
    if (srOnly(el, cs, r)) return [];
    const name = nameOf(el);
    const tag = el.tagName.toLowerCase();
    if (el instanceof SVGSVGElement) {
      if (r.width < 0.5 || r.height < 0.5) return [];
      const layers = walkSvg(el, name, 1);
      const op = px(cs.opacity);
      return layers.length > 1 || op < 1 ? [{ t: "group", name: name === "svg" ? "icon" : name, layers, opacity: op < 1 ? rnd(op) : undefined }] : layers;
    }
    if (cs.display === "contents") return stacked(el, depth);
    const own = paintBox(el, cs, r, name);
    if (tag === "img" || tag === "canvas") {
      const src = rasterise(el);
      if (src && r.width > 0.5) own.push({ t: "image", name, ...box(r), src, radii: radii(cs, r.width, r.height) });
    } else if (tag === "input" || tag === "textarea" || tag === "select") {
      if (el.type === "checkbox" || el.type === "radio") {
        // Native boxes are drawn by the OS; the library draws its own on top, so only the appearance-none ones paint here
      }
      const t = fieldText(el, cs, name);
      if (t) own.push(t);
    } else if (tag === "iframe" || tag === "video") {
      own.push({ t: "rect", name: `${name} placeholder`, ...box(r), fill: { r: 200, g: 205, b: 212, a: 1 } });
    } else if (tag === "hr") {
      // Painted by its border above
    }
    const kids = /^(input|textarea|select|img|canvas|iframe|video)$/.test(tag) ? [] : stacked(el, depth);
    const layers = [...own, ...kids];
    if (!layers.length) return [];
    const op = px(cs.opacity);
    // Overflow clipping: only when something actually spills out of the box
    let clip;
    if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
      const b = box(r);
      const spills = (l) => {
        const lb = boundsOf(l);
        return lb && (lb.x < b.x - 0.5 || lb.y < b.y - 0.5 || lb.x + lb.w > b.x + b.w + 0.5 || lb.y + lb.h > b.y + b.h + 0.5);
      };
      // Rounded corners clip too: anything reaching into a corner gets cut to the curve
      const rr = radii(cs, r.width, r.height);
      const corner = (l) => {
        const lb = boundsOf(l);
        if (!lb || !rr) return false;
        const m = Math.max(...rr) * 0.3;
        const nearX = lb.x < b.x + m || lb.x + lb.w > b.x + b.w - m;
        const nearY = lb.y < b.y + m || lb.y + lb.h > b.y + b.h - m;
        return nearX && nearY;
      };
      if (kids.some(spills) || kids.some(corner)) clip = { ...b, radii: rr };
    }
    const meaningful = depth === 0 || /^tc-/.test(tag) || [...el.classList].some((c) => /^ui-[a-z0-9]+__/.test(c));
    if (depth === 0 || clip || op < 1 || (own.length && kids.length) || (meaningful && layers.length > 1)) {
      return [{ t: "group", name, layers, opacity: op < 1 ? rnd(op) : undefined, clip }];
    }
    return layers;
  }

  /**
   * An element's children's layers in CSS paint order, roughly: negative z-index first, then the in-flow content in
   * document order, then positioned children (sticky labels, overlays) by z-index – so a sticky column covers what
   * scrolls under it, as it does on screen
   */
  function stacked(el, depth) {
    const parts = [...el.childNodes].map((n, i) => {
      let key = 0;
      if (n.nodeType === 1 && !(n instanceof SVGElement && n.tagName.toLowerCase() !== "svg")) {
        const cs = getComputedStyle(n);
        const z = parseInt(cs.zIndex, 10);
        if (cs.position !== "static" || cs.display === "contents") key = cs.position === "static" ? 0 : Number.isNaN(z) ? 1 : z < 0 ? -1 : z === 0 ? 1 : 1 + z;
      }
      return { key, i, layers: childLayers(n, el, depth) };
    });
    parts.sort((a, b) => a.key - b.key || a.i - b.i);
    return parts.flatMap((p) => p.layers);
  }

  function childLayers(n, parent, depth) {
    if (n.nodeType === 1) return walk(n, depth + 1);
    if (n.nodeType !== 3) return [];
    const raw = n.data;
    if (!raw.trim()) return [];
    const cs = getComputedStyle(parent);
    if (hidden(cs)) return [];
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()];
    if (!rects.length) return [];
    const pre = /^pre/.test(cs.whiteSpace) || cs.whiteSpace === "break-spaces";
    let str = pre ? raw : raw.replace(/\s+/g, " ").trim();
    if (!pre && rects.length > 1) {
      // Wrapped prose: the lines come back joined; XD wraps them again inside the area
    }
    const block = blockOf(parent);
    const bcs = getComputedStyle(block);
    if (bcs.textOverflow === "ellipsis" && block.scrollWidth > block.clientWidth + 1) str = ellipsised(str, cs, block, rects[0].left);
    const l = textLayer(str, rects, cs, parent, "text");
    return l ? [l] : [];
  }

  function boundsOf(l) {
    if (l.t === "group") {
      if (l.clip) return l.clip;
      const bs = l.layers.map(boundsOf).filter(Boolean);
      if (!bs.length) return null;
      const x = Math.min(...bs.map((b) => b.x));
      const y = Math.min(...bs.map((b) => b.y));
      return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y };
    }
    if (l.t === "path") {
      const nums = l.d.match(/-?[\d.]+/g)?.map(Number) ?? [];
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      if (!xs.length) return null;
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    if (l.t === "text") {
      if (l.area) return { x: l.x, y: l.y, w: l.w, h: l.h };
      const left = l.align === "center" ? l.x - l.w / 2 : l.align === "right" ? l.x - l.w : l.x;
      return { x: left, y: l.y - l.h * 0.8, w: l.w, h: l.h };
    }
    return { x: l.x, y: l.y, w: l.w, h: l.h };
  }

  window.__xdExtract = (roots) => {
    // The origin: the top-left of everything the roots paint
    const rs = roots.map((r) => r.getBoundingClientRect());
    ox = Math.min(...rs.map((r) => r.left));
    oy = Math.min(...rs.map((r) => r.top));
    const layers = roots.flatMap((r) => walk(r, 0));
    const all = layers.map(boundsOf).filter(Boolean);
    const right = Math.max(...rs.map((r) => r.right - ox), ...all.map((b) => b.x + b.w));
    const bottom = Math.max(...rs.map((r) => r.bottom - oy), ...all.map((b) => b.y + b.h));
    const left = Math.min(0, ...all.map((b) => b.x));
    const top = Math.min(0, ...all.map((b) => b.y));
    return { x: rnd(left), y: rnd(top), w: Math.ceil(right - left), h: Math.ceil(bottom - top), layers };
  };
})();
