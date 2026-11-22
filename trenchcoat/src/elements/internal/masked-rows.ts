import { html, svg, type ReactiveElement } from "lit";

/*
 * What the masked record lists share – Account List, Asset List, Contact Channels and Document List: an identifier
 * masked until it's shown, one row at a time, through a cancelable tc-revealed-change; the eye icons on the reveal
 * button; and one tab stop for every row's buttons (↑ / ↓ between rows, ← / → between a row's buttons, Home / End).
 * Row content stays each element's own.
 */

/** A Lucide icon (ISC, lucide.dev) at a size, drawn in the text colour */
export const lucideIcon = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** The reveal button's eye, while the value is masked */
export const eyeIcon = () => lucideIcon(15, svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`);
/** The reveal button's struck-through eye, while the value is shown */
export const eyeOffIcon = () =>
  lucideIcon(15, svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M14.08 14.16a3 3 0 0 1-4.16-4.16"></path><path d="m2 2 20 20"></path>`);
/** The arrow on a row's View / Open button */
export const arrowIcon = () => lucideIcon(14, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);

/** tc-revealed-change's detail */
export type RevealedChange = { revealed: string[]; id: string; shown: boolean };

/**
 * Shows or masks one row's value: works out the ids that would be shown, fires the cancelable tc-revealed-change
 * through the host's `emit`, and returns the new list – or null when a listener prevented it
 */
export function requestReveal(
  emit: (name: string, detail: RevealedChange, options: { cancelable: boolean }) => boolean,
  revealed: readonly string[],
  id: string,
  shown: boolean,
): string[] | null {
  const next = shown ? [...revealed.filter((x) => x !== id), id] : revealed.filter((x) => x !== id);
  return emit("tc-revealed-change", { revealed: next, id, shown }, { cancelable: true }) ? next : null;
}

/** Where the tab stop is: a row, and a button in it by its key (a column number, or a name) */
export type RowStop<K extends number | string> = { r: number; k: K };

/**
 * One tab stop for a list's row buttons. Each button carries `data-at="<row>:<key>"`; `keys(r)` lists a row's buttons
 * in order. When a row lacks the button the stop was on, it lands on the row's `fallback` button ("first" or "last").
 * The host keeps the stop in its own state (`get` / `set`) so its render can give the right button tabindex 0.
 */
export class RowButtonGrid<K extends number | string> {
  constructor(
    private host: ReactiveElement,
    private o: {
      count: () => number;
      keys: (r: number) => K[];
      get: () => RowStop<K>;
      set: (stop: RowStop<K>) => void;
      fallback: "first" | "last";
    },
  ) {}

  private pick(keys: K[], k: K): K | undefined {
    if (keys.includes(k)) return k;
    return this.o.fallback === "first" ? keys[0] : keys[keys.length - 1];
  }

  /** Moves the tab stop to row r's button k (or its fallback) and focuses it */
  focusAt(r: number, k: K) {
    const n = this.o.count();
    if (!n) return;
    r = Math.max(0, Math.min(n - 1, r));
    const keys = this.o.keys(r);
    const at = this.pick(keys, k);
    if (at === undefined) return;
    this.o.set({ r, k: at });
    const key = typeof at === "string" ? CSS.escape(at) : String(at);
    void this.host.updateComplete.then(() => this.host.querySelector<HTMLElement>(`[data-at="${r}:${key}"]`)?.focus());
  }

  /** The list's keydown: arrows, Home and End move the tab stop */
  onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const at = btn.dataset.at!;
    const r = Number(at.slice(0, at.indexOf(":")));
    const raw = at.slice(at.indexOf(":") + 1);
    const keys = this.o.keys(r);
    const k = (keys.find((x) => String(x) === raw) ?? raw) as K;
    const i = keys.indexOf(k);
    const moves: Record<string, [number, K]> = {
      ArrowUp: [r - 1, k],
      ArrowDown: [r + 1, k],
      ArrowLeft: [r, keys[Math.max(0, i - 1)]],
      ArrowRight: [r, keys[Math.min(keys.length - 1, i + 1)]],
      Home: [0, k],
      End: [this.o.count() - 1, k],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  /** Keeps the tab stop on a row and a button that exist – call from willUpdate */
  keepInRange() {
    const n = this.o.count();
    if (!n) return;
    const cur = this.o.get();
    const r = Math.min(cur.r, n - 1);
    const keys = this.o.keys(r);
    if (r === cur.r && keys.includes(cur.k)) return;
    // A row with no buttons keeps an empty key, as the lists did before they shared this
    this.o.set({ r, k: this.pick(keys, cur.k) ?? ("" as K) });
  }
}
