/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/highlight.ts. */
/** Resolves what to emphasise to a set of indexes */
import type { Highlight } from "./types";

/**
  * What to emphasise, as a set of indexes.
  * labels: the items' labels; values: the values to compare
 */
export function resolveHighlight<T>(
  h: Highlight<T> | undefined,
  data: readonly T[],
  labels: readonly string[],
  values: readonly number[],
  fallback: "max" | "min" | "first" | "last" | "none" = "max",
): Set<number> {
  const out = new Set<number>();
  const n = labels.length;
  const pick = (mode: string) => {
    if (!n) return;
    if (mode === "none") return;
    if (mode === "first") out.add(0);
    else if (mode === "last") out.add(n - 1);
    else if (mode === "max" || mode === "min") {
      let best = -1;
      let bv = mode === "max" ? -Infinity : Infinity;
      values.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        if (mode === "max" ? v > bv : v < bv) {
          bv = v;
          best = i;
        }
      });
      if (best >= 0) out.add(best);
    }
  };
  if (h === undefined || h === null) {
    pick(fallback);
    return out;
  }
  if (typeof h === "function") {
    data.forEach((d, i) => {
      // Items with no row (a heatmap's empty cell) aren't passed to the predicate
      if (i < n && d !== null && d !== undefined && h(d, i)) out.add(i);
    });
    return out;
  }
  const list = Array.isArray(h) ? h : [h];
  for (const item of list) {
    if (typeof item === "number") {
      if (item >= 0 && item < n) out.add(item);
    } else if (item === "max" || item === "min" || item === "first" || item === "last" || item === "none") pick(item);
    else {
      labels.forEach((l, i) => {
        if (l === item) out.add(i);
      });
    }
  }
  return out;
}
