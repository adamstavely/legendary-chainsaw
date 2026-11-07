/** Hexagonal binning: points gathered into pointy-top hexagons of a given radius (after d3-hexbin's method) */

export interface HexCell {
  /** Column and row on the hex grid; odd rows are shifted half a hexagon right */
  i: number;
  j: number;
  /** The hexagon's centre, in the points' units */
  x: number;
  y: number;
  count: number;
  /** The sum of the points' values, when values were given */
  sum: number;
  /** How many of its points had a finite value – a mean's divisor */
  valued: number;
}

const SQRT3 = Math.sqrt(3);

/** The column and row of the hexagon (radius r, grid from (0, 0)) that holds the point */
export function hexIndex(x: number, y: number, radius: number): [number, number] {
  const dx = radius * SQRT3;
  const dy = radius * 1.5;
  const py = y / dy;
  let pj = Math.round(py);
  const px = x / dx - (pj & 1) / 2;
  let pi = Math.round(px);
  const py1 = py - pj;
  // Near a row boundary the nearest centre may be in the row above or below: compared in px, as the grid's steps differ
  if (Math.abs(py1) * 3 > 1) {
    const px1 = px - pi;
    const pi2 = pi + (px < pi ? -1 : 1) / 2;
    const pj2 = pj + (py < pj ? -1 : 1);
    const px2 = px - pi2;
    const py2 = py - pj2;
    if ((px1 * dx) ** 2 + (py1 * dy) ** 2 > (px2 * dx) ** 2 + (py2 * dy) ** 2) {
      pi = pi2 + (pj & 1 ? 1 : -1) / 2;
      pj = pj2;
    }
  }
  return [pi, pj];
}

/** One number per cell: rows and columns well inside ±2^20 */
export const hexKey = (i: number, j: number) => (j + 1048576) * 2097152 + (i + 1048576);

/**
 * Gathers points into hexagons of radius r (centre to corner). The grid starts at (0, 0); pass coordinates already
 * placed where the hexagons should line up. Non-finite points are skipped. The cells come in reading order: by row,
 * then by column
 */
export function hexbin(xs: ArrayLike<number>, ys: ArrayLike<number>, radius: number, values?: ArrayLike<number>): HexCell[] {
  const r = radius > 0 ? radius : 1;
  const dx = r * SQRT3;
  const dy = r * 1.5;
  const cells = new Map<number, HexCell>();
  const n = Math.min(xs.length, ys.length);
  for (let p = 0; p < n; p++) {
    const x = xs[p];
    const y = ys[p];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const [pi, pj] = hexIndex(x, y, r);
    const key = hexKey(pi, pj);
    let c = cells.get(key);
    if (!c) {
      c = { i: pi, j: pj, x: (pi + (pj & 1) / 2) * dx, y: pj * dy, count: 0, sum: 0, valued: 0 };
      cells.set(key, c);
    }
    c.count++;
    if (values) {
      const v = values[p];
      if (Number.isFinite(v)) {
        c.sum += v;
        c.valued++;
      }
    }
  }
  return [...cells.values()].sort((a, b) => a.j - b.j || a.i - b.i);
}

/** A hexagon's outline round (0, 0), pointy-top, as an SVG path to place with a transform or by adding the centre */
export function hexPath(radius: number, cx = 0, cy = 0): string {
  const w = (radius * SQRT3) / 2;
  const h = radius / 2;
  const f = (v: number) => Math.round(v * 100) / 100;
  return `M${f(cx)},${f(cy - radius)}L${f(cx + w)},${f(cy - h)}L${f(cx + w)},${f(cy + h)}L${f(cx)},${f(cy + radius)}L${f(cx - w)},${f(cy + h)}L${f(cx - w)},${f(cy - h)}Z`;
}
