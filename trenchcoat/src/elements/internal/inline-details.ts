/*
 * What tc-entity-details and tc-identifier-details share: asking the page about one thing found in their text.
 * A cancelable lookup event fires first, with `respondWith()` for the answer; when nobody answers and the event isn't
 * prevented, the element's `resolve` hook is asked. Answers are cached by key for the element's life; failures aren't,
 * so the card can offer Retry. Lookups in flight are aborted when the element leaves the page, and forgotten, so a
 * card that's still open asks again when it comes back.
 *
 *   lookups = new InlineLookups<Info>(() => this.version++, isInfo);
 *   lookups.run(key, () => this.emit("tc-x-lookup", detail, { cancelable: true }), (signal) => this.resolve?.(…, signal));
 */

/** Where one lookup stands: asking, answered (null when there's nothing to know) or failed */
export type LookupEntry<D> = { status: "loading" } | { status: "done"; data: D | null } | { status: "error"; message: string };

/** What a lookup event's detail always carries: a signal that aborts when the element leaves, and respondWith() */
export type LookupHooks<D> = {
  signal: AbortSignal;
  respondWith: (answer: D | null | undefined | Promise<D | null | undefined>) => void;
};

const NO_ANSWER = Symbol("no answer");

export class InlineLookups<D> {
  private readonly cache = new Map<string, LookupEntry<D>>();
  private readonly aborts = new Set<AbortController>();

  constructor(
    /** Called whenever an entry changes, so the host re-renders */
    private readonly changed: () => void,
    /** Is this answer something to show? Anything else counts as "nothing known" */
    private readonly valid: (answer: unknown) => answer is D,
  ) {}

  get(key: string): LookupEntry<D> | undefined {
    return this.cache.get(key);
  }

  /** Forgets one answer, or all of them */
  forget(key?: string) {
    if (key === undefined) this.cache.clear();
    else this.cache.delete(key);
    this.changed();
  }

  /** Aborts lookups in flight and forgets them; call from disconnectedCallback */
  abortAll() {
    for (const a of this.aborts) a.abort();
    this.aborts.clear();
    for (const [k, e] of this.cache) if (e.status === "loading") this.cache.delete(k);
  }

  /**
   * Looks `key` up unless it's cached or in flight. `ask(hooks)` fires the event (returning false when it was
   * prevented); `resolve(signal)` is the fallback. Resolves with the new entry, or undefined when there was nothing to
   * do or the lookup was aborted.
   */
  async run(key: string, ask: (hooks: LookupHooks<D>) => boolean, resolve: (signal: AbortSignal) => unknown): Promise<LookupEntry<D> | undefined> {
    if (this.cache.has(key)) return undefined;
    this.cache.set(key, { status: "loading" });
    this.changed();
    const abort = new AbortController();
    this.aborts.add(abort);
    let answer: unknown = NO_ANSWER;
    const go = ask({ signal: abort.signal, respondWith: (a) => (answer = a) });
    try {
      let result: unknown = null;
      if (answer !== NO_ANSWER) result = answer;
      else if (go) result = resolve(abort.signal);
      const data = await result;
      if (abort.signal.aborted) return undefined;
      const entry: LookupEntry<D> = { status: "done", data: this.valid(data) ? data : null };
      this.cache.set(key, entry);
      return entry;
    } catch (err) {
      if (abort.signal.aborted) return undefined;
      const entry: LookupEntry<D> = { status: "error", message: err instanceof Error ? err.message : String(err ?? "") };
      this.cache.set(key, entry);
      return entry;
    } finally {
      this.aborts.delete(abort);
      this.changed();
    }
  }
}

/** A word character, in any script */
export const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);

/**
 * Drops punctuation a sentence put after a link or identifier: a trailing . , ; : ! ? ' " and closing brackets that
 * weren't opened inside it ("(see https://x.org/a_(b))." keeps the inner pair)
 */
export function trimTrailing(s: string) {
  let out = s;
  for (;;) {
    const last = out.at(-1);
    if (last === undefined) return out;
    if (/[.,;:!?'"’”]/.test(last)) {
      out = out.slice(0, -1);
      continue;
    }
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    if (pairs[last]) {
      const open = out.split(pairs[last]).length - 1;
      const close = out.split(last).length - 1;
      if (close > open) {
        out = out.slice(0, -1);
        continue;
      }
    }
    return out;
  }
}

/** Keeps the first of overlapping ranges, in the order given, then sorts them by position */
export function firstOfOverlaps<R extends { start: number; end: number }>(ranges: R[]): R[] {
  const kept: R[] = [];
  for (const r of ranges) if (!kept.some((k) => r.start < k.end && k.start < r.end)) kept.push(r);
  return kept.sort((a, b) => a.start - b.start);
}
