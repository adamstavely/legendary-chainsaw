import type { ReactiveElement } from "lit";
import { PopoverController } from "./popover";

/*
 * What the detect-in-text hover cards share – tc-coordinate-details, tc-entity-details, tc-identifier-details,
 * tc-isbn-details and tc-time-details: asking the page about one thing found in their text (InlineLookups), and the
 * card itself – which mark it's open on, opening and closing it, pinning it with a click, the right-click and Menu-key
 * openers, and a status line that announces a repeated message (InlineCard).
 *
 * InlineLookups – asking the page about one thing found in the text.
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

/** The status line's next message: a trailing space makes a repeated message count as new for screen readers */
export const sayAgain = (said: string, text: string) => (said === text ? `${text} ` : text);

/** How a card opens: pinned (it stays until dismissed) and with focus moved into it */
export type InlineOpen = { pin?: boolean; focus?: boolean };

/**
 * The card of a detect-in-text element: one card at a time, on the mark at `host.openAt` (-1 when none). The host keeps
 * `openAt` as reactive state and renders its marks as `.ui-<prefix>__mark[data-i]` buttons and the card as
 * `.ui-<prefix>__pop`; the card's body, lookups and events stay the host's own.
 *   · "dialog" (the default) – below the mark's first line, focus returns to the mark, Tab moves into it
 *   · "tooltip" – above the mark, centred, nothing inside to reach
 */
export class InlineCard {
  readonly pop: PopoverController;

  constructor(
    private readonly host: ReactiveElement & { openAt: number },
    private readonly o: {
      /** The element's CSS prefix: "ent" for .ui-ent__mark and .ui-ent__pop */
      prefix: string;
      /** How many marks there are */
      count: () => number;
      hoverDelay: () => number;
      /** Whether right-click and the Menu key open a card */
      menu?: () => boolean;
      kind?: "dialog" | "tooltip";
      /** A card opened on mark i (it wasn't open there before): reset per-card state, fire tc-open-change, look it up */
      opened: (i: number) => void;
      /** The card closed: reset per-card state and fire tc-open-change */
      closed: () => void;
    },
  ) {
    const tip = o.kind === "tooltip";
    this.pop = new PopoverController(host, {
      popover: () => host.querySelector<HTMLElement>(`.ui-${o.prefix}__pop`),
      anchor: () => {
        const m = this.markAt(host.openAt);
        if (!m?.isConnected) return null;
        // The mark's first line, when it wraps
        return m.getClientRects()[0] ?? m.getBoundingClientRect();
      },
      side: tip ? "top" : "bottom",
      align: tip ? "center" : "start",
      kind: tip ? "tooltip" : "dialog",
      trigger: () => this.markAt(host.openAt),
      ...(tip ? {} : { returnFocus: () => this.markAt(host.openAt), tabBridge: true }),
      hover: { delay: o.hoverDelay },
      closeOnFocusOut: true,
      onClose: () => this.closed(),
    });
  }

  /** The mark button for match i */
  markAt(i: number) {
    return i < 0 ? null : this.host.querySelector<HTMLElement>(`.ui-${this.o.prefix}__mark[data-i="${i}"]`);
  }

  /** Opens the card on mark i; a card that was pinned elsewhere lets go */
  open(i: number, how: InlineOpen = {}) {
    if (i < 0 || i >= this.o.count()) return;
    if (this.host.openAt !== i) {
      if (this.host.openAt >= 0) this.pop.pinned = false;
      this.host.openAt = i;
      this.o.opened(i);
    }
    this.pop.show({ focus: !!how.focus, pin: !!how.pin });
  }

  /** After the controller closed it (Escape, outside, focus gone, anchor gone) or close() */
  closed() {
    if (this.host.openAt < 0) return;
    this.host.openAt = -1;
    this.o.closed();
  }

  /** Closes the open card, if any */
  close() {
    if (this.pop.open) this.pop.close();
    else this.closed();
  }

  /** A mark's click: Enter or Space (detail 0) opens the card with focus in it; a click pins it, or closes a pinned one */
  onMarkClick(e: MouseEvent, i: number) {
    if (e.detail === 0) this.open(i, { pin: true, focus: true });
    else if (this.host.openAt === i && this.pop.pinned) this.close();
    else this.open(i, { pin: true });
  }

  /** A mark's right-click: the card takes the place of the browser's menu, on the marks only */
  onMarkMenu(e: MouseEvent, i: number) {
    if (this.o.menu && !this.o.menu()) return;
    e.preventDefault();
    if (this.host.openAt !== i || !this.pop.open || !this.pop.pinned) this.open(i, { pin: true });
  }

  /** A mark's Menu key or Shift + F10: the card, with focus in it */
  onMarkKey(e: KeyboardEvent, i: number) {
    if (this.o.menu && !this.o.menu()) return;
    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      this.open(i, { pin: true, focus: true });
    }
  }
}
