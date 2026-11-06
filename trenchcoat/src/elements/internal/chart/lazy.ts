/* Ported from ztd-charts (MIT, © 2026 Junhan2 – https://github.com/Junhan2/ztd-charts), src/core/lazy.ts. */
/**
  * An array of fixed length whose items are made when first read, so 10,000 labels or events aren't all built.
  * Supports index reads, length, slice, map, forEach and indexOf (without the has trap, array methods skip empty slots).
 */
export function lazyArray<T>(n: number, make: (i: number) => T): T[] {
  const cache = new Array<T | undefined>(n);
  const has = new Uint8Array(n);
  const index = (prop: string | symbol): number => {
    if (typeof prop !== "string" || prop.length === 0 || prop.length > 9) return -1;
    const i = Number(prop);
    return Number.isInteger(i) && i >= 0 && i < n && String(i) === prop ? i : -1;
  };
  return new Proxy(cache as T[], {
    get(target, prop, recv) {
      const i = index(prop);
      if (i >= 0) {
        if (!has[i]) {
          target[i] = make(i);
          has[i] = 1;
        }
        return target[i];
      }
      return Reflect.get(target, prop, recv);
    },
    has(target, prop) {
      return index(prop) >= 0 || Reflect.has(target, prop);
    },
  });
}
