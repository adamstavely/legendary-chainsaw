/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/layout/stack.ts. */
/** Stacking series: from zero, to 100%, centred or as a streamgraph */
export type StackOffset = "zero" | "expand" | "silhouette" | "wiggle";

/**
  * Stacking. values[s][k] (series s, position k).
  * zero: from 0; expand: to 100%; silhouette: centred; wiggle: a streamgraph (a baseline that keeps the bands from swaying)
 */
export function stack(values: readonly (readonly number[])[], offset: StackOffset = "zero"): { y0: number[][]; y1: number[][] } {
  const ns = values.length;
  const nk = ns ? values[0].length : 0;
  const y0 = values.map(() => new Array<number>(nk).fill(0));
  const y1 = values.map(() => new Array<number>(nk).fill(0));
  const v = (s: number, k: number) => {
    const x = values[s][k];
    return Number.isFinite(x) && x > 0 ? x : 0;
  };
  const base = new Array<number>(nk).fill(0);
  if (offset === "wiggle" && ns > 0 && nk > 1) {
    let b = 0;
    for (let k = 1; k < nk; k++) {
      let s1 = 0;
      let s2 = 0;
      for (let s = 0; s < ns; s++) {
        const cur = v(s, k);
        const dv = cur - v(s, k - 1);
        let s3 = 0;
        for (let j = 0; j < s; j++) s3 += v(j, k) - v(j, k - 1);
        s1 += cur;
        s2 += (dv / 2 + s3) * cur;
      }
      if (s1) b -= s2 / s1;
      base[k] = b;
    }
  }
  for (let k = 0; k < nk; k++) {
    // Stacking from 0, negatives stack separately below 0 (positives up, negatives down)
    if (offset === "zero") {
      let pos = 0;
      let neg = 0;
      for (let s = 0; s < ns; s++) {
        const x = values[s][k];
        const val = Number.isFinite(x) ? x : 0;
        if (val >= 0) {
          y0[s][k] = pos;
          pos += val;
          y1[s][k] = pos;
        } else {
          y0[s][k] = neg;
          neg += val;
          y1[s][k] = neg;
        }
      }
      continue;
    }
    let tot = 0;
    for (let s = 0; s < ns; s++) tot += v(s, k);
    let acc = offset === "silhouette" ? -tot / 2 : base[k];
    for (let s = 0; s < ns; s++) {
      let val = v(s, k);
      if (offset === "expand") val = tot ? (val / tot) * 100 : 0;
      y0[s][k] = acc;
      acc += val;
      y1[s][k] = acc;
    }
  }
  if (offset === "wiggle" && nk) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = 0; k < nk; k++) {
      lo = Math.min(lo, y0[0]?.[k] ?? 0);
      hi = Math.max(hi, y1[ns - 1]?.[k] ?? 0);
    }
    // Centre the mean so the thickest point sits in the middle
    let mid = 0;
    for (let k = 0; k < nk; k++) mid += ((y0[0]?.[k] ?? 0) + (y1[ns - 1]?.[k] ?? 0)) / 2;
    mid /= nk;
    for (let s = 0; s < ns; s++)
      for (let k = 0; k < nk; k++) {
        y0[s][k] -= mid;
        y1[s][k] -= mid;
      }
  }
  return { y0, y1 };
}

/** A series order that suits a streamgraph (inside-out): series that peak early go in the middle */
export function insideOut(values: readonly (readonly number[])[]): number[] {
  const n = values.length;
  const peak = values.map((row) => {
    let best = 0;
    let bv = -Infinity;
    row.forEach((v, k) => {
      if (v > bv) {
        bv = v;
        best = k;
      }
    });
    return best;
  });
  const sums = values.map((row) => row.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0));
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => peak[a] - peak[b]);
  const top: number[] = [];
  const bottom: number[] = [];
  let st = 0;
  let sb = 0;
  for (const i of order) {
    if (st < sb) {
      top.push(i);
      st += sums[i];
    } else {
      bottom.push(i);
      sb += sums[i];
    }
  }
  return [...bottom.reverse(), ...top];
}
