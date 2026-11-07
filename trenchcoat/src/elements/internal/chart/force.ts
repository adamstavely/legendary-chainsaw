/*
 * A force-directed layout for node-link diagrams (not from ztd-charts): nodes repel one another, links pull their ends
 * together, a weak pull keeps loose pieces near the middle, and nodes never overlap. It runs a fixed number of steps in
 * one go, with no randomness, so the same graph always comes out the same; positions from an earlier layout warm-start
 * the next, so a changed graph moves a little rather than starting again.
 *
 * Repulsion is exact for small graphs and uses a Barnes–Hut quadtree above BH_FROM nodes; collisions use a grid.
 */

export type ForceNode = {
  id: string;
  /** Radius in px, for collisions */
  r: number;
  /** Held here, in px: a node the reader pinned */
  fx?: number;
  fy?: number;
};

/** A link between node indexes; `value` makes it shorter and stronger */
export type ForceLink = { source: number; target: number; value?: number };

export type ForceOptions = {
  width: number;
  height: number;
  /** Steps to run; by default 300 cold, 160 warm */
  ticks?: number;
  /** Earlier positions by id, as shares of the width and height (0–1) */
  previous?: ReadonlyMap<string, readonly [number, number]>;
  /** Space kept clear inside the edges, in px */
  margin?: number;
};

export type ForceResult = { x: Float64Array; y: Float64Array };

const BH_FROM = 300;
const THETA2 = 0.81;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** A small, fixed nudge for two nodes at the same point, so they part the same way every time */
const jiggle = (i: number) => (((i * 0.6180339887498949) % 1) - 0.5) * 1e-3;

type Quad = { x0: number; y0: number; size: number; mass: number; cx: number; cy: number; leaf: number; kids: (Quad | null)[] | null };

function buildQuad(x: Float64Array, y: Float64Array): Quad {
  const n = x.length;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    if (x[i] < x0) x0 = x[i];
    if (y[i] < y0) y0 = y[i];
    if (x[i] > x1) x1 = x[i];
    if (y[i] > y1) y1 = y[i];
  }
  const size = Math.max(x1 - x0, y1 - y0, 1) + 1;
  const root: Quad = { x0, y0, size, mass: 0, cx: 0, cy: 0, leaf: -1, kids: null };
  const insert = (q: Quad, i: number, depth: number) => {
    q.cx = (q.cx * q.mass + x[i]) / (q.mass + 1);
    q.cy = (q.cy * q.mass + y[i]) / (q.mass + 1);
    q.mass++;
    if (q.mass === 1) {
      q.leaf = i;
      return;
    }
    // Points on top of one another stop splitting: they share a leaf
    if (depth > 24) return;
    if (!q.kids) {
      q.kids = [null, null, null, null];
      const prev = q.leaf;
      q.leaf = -1;
      if (prev >= 0) place(q, prev, depth);
    }
    place(q, i, depth);
  };
  const place = (q: Quad, i: number, depth: number) => {
    const h = q.size / 2;
    const right = x[i] >= q.x0 + h ? 1 : 0;
    const below = y[i] >= q.y0 + h ? 1 : 0;
    const k = right + below * 2;
    let kid = q.kids![k];
    if (!kid) kid = q.kids![k] = { x0: q.x0 + right * h, y0: q.y0 + below * h, size: h, mass: 0, cx: 0, cy: 0, leaf: -1, kids: null };
    insert(kid, i, depth + 1);
  };
  for (let i = 0; i < n; i++) insert(root, i, 0);
  return root;
}

/**
 * Lays the nodes out in a width × height box and returns their centres in px. Deterministic: the same nodes, links,
 * size and previous positions always give the same result
 */
export function forceLayout(nodes: readonly ForceNode[], links: readonly ForceLink[], opts: ForceOptions): ForceResult {
  const n = nodes.length;
  const W = Math.max(1, opts.width);
  const H = Math.max(1, opts.height);
  const cx = W / 2;
  const cy = H / 2;
  const margin = opts.margin ?? 6;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  if (!n) return { x, y };
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const r = nodes.map((d) => Math.max(1, d.r));
  const fixed = nodes.map((d) => d.fx !== undefined && d.fy !== undefined);

  // The usual link length: the box shared out between the nodes
  const L = Math.max(22, Math.min(110, Math.sqrt((W * H) / n) * 0.8));
  const deg = new Float64Array(n);
  const ls = links.filter((l) => l.source !== l.target && l.source >= 0 && l.target >= 0 && l.source < n && l.target < n);
  ls.forEach((l) => {
    deg[l.source]++;
    deg[l.target]++;
  });
  const maxV = Math.max(1e-9, ...ls.map((l) => Math.max(0, l.value ?? 1)));
  const dist = ls.map((l) => {
    // Stronger links are shorter; never so short the two circles touch
    const share = Math.max(0, l.value ?? 1) / maxV;
    return Math.max(r[l.source] + r[l.target] + 6, L * (1.15 - 0.4 * share));
  });
  const strength = ls.map((l) => 1 / Math.max(1, Math.min(deg[l.source], deg[l.target])));
  const bias = ls.map((l) => deg[l.source] / Math.max(1, deg[l.source] + deg[l.target]));

  // Where they start: earlier positions where there are some, a node new to the graph beside the neighbours it already
  // has, the rest on a sunflower spiral round the middle
  const prev = opts.previous;
  const warm = !!prev && nodes.some((d) => prev.has(d.id));
  const placed = new Uint8Array(n);
  nodes.forEach((d, i) => {
    if (fixed[i]) {
      x[i] = d.fx!;
      y[i] = d.fy!;
      placed[i] = 1;
      return;
    }
    const p = prev?.get(d.id);
    if (p) {
      x[i] = p[0] * W;
      y[i] = p[1] * H;
      placed[i] = 1;
    }
  });
  const spiral = (i: number, ox: number, oy: number, step: number) => {
    const rad = step * Math.sqrt(0.5 + i);
    const a = i * GOLDEN;
    return [ox + rad * Math.cos(a), oy + rad * Math.sin(a)] as const;
  };
  let fresh = 0;
  nodes.forEach((_, i) => {
    if (placed[i]) return;
    let sx = 0;
    let sy = 0;
    let k = 0;
    for (const l of ls) {
      const o = l.source === i ? l.target : l.target === i ? l.source : -1;
      if (o >= 0 && placed[o]) {
        sx += x[o];
        sy += y[o];
        k++;
      }
    }
    const [px, py] = k ? spiral(fresh + 1, sx / k, sy / k, L * 0.35) : spiral(i, cx, cy, L * 0.45);
    x[i] = px;
    y[i] = py;
    fresh++;
  });

  const ticks = opts.ticks ?? (warm ? 160 : 300);
  let alpha = warm ? 0.3 : 1;
  const alphaMin = 0.001;
  const decay = 1 - Math.pow(alphaMin / alpha, 1 / Math.max(1, ticks));
  const velocityDecay = 0.6;
  const charge = -L * 1.4;
  const gravity = 0.035;

  for (let t = 0; t < ticks; t++) {
    alpha += (0 - alpha) * decay;

    // Links: a spring towards each one's length, the heavier end moving less
    ls.forEach((l, k) => {
      const s = l.source;
      const g = l.target;
      let dx = x[g] + vx[g] - x[s] - vx[s] || jiggle(k);
      let dy = y[g] + vy[g] - y[s] - vy[s] || jiggle(k + 1);
      const len = Math.sqrt(dx * dx + dy * dy);
      const f = ((len - dist[k]) / len) * alpha * strength[k];
      dx *= f;
      dy *= f;
      vx[g] -= dx * bias[k];
      vy[g] -= dy * bias[k];
      vx[s] += dx * (1 - bias[k]);
      vy[s] += dy * (1 - bias[k]);
    });

    // Repulsion between every pair, or between a node and a far-off group's centre of mass
    if (n <= BH_FROM) {
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          let dx = x[j] - x[i];
          let dy = y[j] - y[i];
          if (!dx && !dy) {
            dx = jiggle(i + j);
            dy = jiggle(i * 3 + j);
          }
          const l2 = Math.max(dx * dx + dy * dy, 1);
          const w = (charge * alpha) / l2;
          vx[i] += dx * w;
          vy[i] += dy * w;
          vx[j] -= dx * w;
          vy[j] -= dy * w;
        }
    } else {
      const root = buildQuad(x, y);
      for (let i = 0; i < n; i++) {
        const stack: Quad[] = [root];
        while (stack.length) {
          const q = stack.pop()!;
          if (!q.mass) continue;
          const dx = q.cx - x[i];
          const dy = q.cy - y[i];
          const l2 = Math.max(dx * dx + dy * dy, 1);
          if (q.kids && (q.size * q.size) / l2 >= THETA2) {
            for (const kid of q.kids) if (kid) stack.push(kid);
            continue;
          }
          if (!q.kids && q.leaf === i && q.mass === 1) continue;
          // A leaf holding this node among others still repels by the others
          const m = !q.kids && q.leaf === i ? q.mass - 1 : q.mass;
          const w = (charge * alpha * m) / l2;
          vx[i] += dx * w;
          vy[i] += dy * w;
        }
      }
    }

    // A gentle pull to the middle keeps pieces that aren't joined on screen
    for (let i = 0; i < n; i++) {
      vx[i] += (cx - x[i]) * gravity * alpha;
      vy[i] += (cy - y[i]) * gravity * alpha;
    }

    for (let i = 0; i < n; i++) {
      if (fixed[i]) {
        vx[i] = vy[i] = 0;
        continue;
      }
      vx[i] *= velocityDecay;
      vy[i] *= velocityDecay;
      x[i] += vx[i];
      y[i] += vy[i];
    }
    collide(x, y, r, fixed, 0.7);
  }

  // Fit the drawing in the box: shrink it about its middle if it spills over, then centre it (pinned nodes stay put)
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    x0 = Math.min(x0, x[i] - r[i]);
    y0 = Math.min(y0, y[i] - r[i]);
    x1 = Math.max(x1, x[i] + r[i]);
    y1 = Math.max(y1, y[i] + r[i]);
  }
  const s = Math.min(1, (W - margin * 2) / Math.max(1, x1 - x0), (H - margin * 2) / Math.max(1, y1 - y0));
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const anyFixed = fixed.some(Boolean);
  for (let i = 0; i < n; i++) {
    if (fixed[i]) continue;
    x[i] = anyFixed ? mx + (x[i] - mx) * s : cx + (x[i] - mx) * s;
    y[i] = anyFixed ? my + (y[i] - my) * s : cy + (y[i] - my) * s;
  }
  // Shrinking can bring circles together again: part them, kept inside the box
  for (let k = 0; k < 40; k++) {
    const moved = collide(x, y, r, fixed, 1);
    for (let i = 0; i < n; i++) {
      if (fixed[i]) continue;
      x[i] = Math.max(margin + r[i], Math.min(W - margin - r[i], x[i]));
      y[i] = Math.max(margin + r[i], Math.min(H - margin - r[i], y[i]));
    }
    if (!moved) break;
  }
  return { x, y };
}

/** Pushes overlapping circles apart (with a 1px gap), found through a grid; true when any moved */
function collide(x: Float64Array, y: Float64Array, r: readonly number[], fixed: readonly boolean[], strength: number): boolean {
  const n = x.length;
  const gap = 1;
  const cell = Math.max(4, Math.max(...r) * 2 + gap);
  const grid = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const key = `${Math.floor(x[i] / cell)},${Math.floor(y[i] / cell)}`;
    const arr = grid.get(key);
    if (arr) arr.push(i);
    else grid.set(key, [i]);
  }
  let moved = false;
  for (let i = 0; i < n; i++) {
    const gx = Math.floor(x[i] / cell);
    const gy = Math.floor(y[i] / cell);
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) {
        const arr = grid.get(`${gx + ox},${gy + oy}`);
        if (!arr) continue;
        for (const j of arr) {
          if (j <= i) continue;
          let dx = x[j] - x[i];
          let dy = y[j] - y[i];
          const min = r[i] + r[j] + gap;
          let d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          if (!d2) {
            dx = jiggle(i + j) || 1e-3;
            dy = jiggle(i * 7 + j);
            d2 = dx * dx + dy * dy;
          }
          const d = Math.sqrt(d2);
          const push = ((min - d) / d) * strength;
          const fi = fixed[i] ? 0 : fixed[j] ? 1 : r[j] * r[j] / (r[i] * r[i] + r[j] * r[j]);
          const fj = fixed[j] ? 0 : 1 - fi;
          if (!fi && !fj) continue;
          x[i] -= dx * push * fi;
          y[i] -= dy * push * fi;
          x[j] += dx * push * fj;
          y[j] += dy * push * fj;
          moved = true;
        }
      }
  }
  return moved;
}
