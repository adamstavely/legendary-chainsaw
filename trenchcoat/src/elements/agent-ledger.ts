import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OnScreenController } from "./internal/controllers";

/*
 * <tc-agent-ledger> – the Lit port of src/components/agent-ledger.tsx: everything an agent changed in your systems,
 * each change with an undo. A soft gray tray with the agent and the count, a white card with a row per change –
 * newest first, new ones sliding in as the agent works.
 *   · every row keeps its height: the system's logo, what was done and to what, and before → after
 *   · point at a row and its time turns into "Undo"; point at Undo and every change that builds on it lights up –
 *     "Also undone" where it can be reversed, "Can't undo" where it can't (a sent email, a payout)
 *   · undo strikes the change through, its dependents a beat after each other; "Redo" brings them back, and with them
 *     any undone change they build on
 *
 *   <tc-agent-ledger agent="Launch agent" .entries=${[{ id: "a", action: "Changed price", system: "Stripe", at }]}>
 *   </tc-agent-ledger>
 *
 * Clean drops the gray tray for a plain bar above one quiet white panel: smaller logo tiles, medium weights, 0.5px
 * dividers, and Undo / Redo as flat text buttons instead of raised pills.
 */

export type LedgerEntry = {
  id: string;
  /** What was done, in a few words – e.g. "Changed price" */
  action: string;
  /** To what – e.g. "Pro plan" */
  target?: string;
  /** Where – e.g. "Stripe"; shown after the time and in the labels */
  system: string;
  /** The system's logo, an element that's cloned; unset shows the system's first letter */
  icon?: Element;
  /** When it happened (epoch ms) */
  at: number;
  /** Before and after – e.g. ["$29", "$34"]; or a single line of detail */
  change?: [before: string, after: string];
  detail?: string;
  /** False for changes that can't be taken back – a sent email, a payout (default true) */
  reversible?: boolean;
  /** Ids of the changes this one builds on – undoing one of those undoes this one too */
  dependsOn?: string[];
};

/** Undo or redo of a set of changes; may return a promise – the rows wait for it and go back if it rejects */
export type LedgerAction = (ids: string[]) => void | Promise<unknown>;

/* ---------- Helpers ---------- */

const ago = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

/**
 * The chains between changes, worked out once per list of entries: everything that builds on a change (directly or
 * through others, in the order it's reached) and everything it builds on (nearest first) – each chain walked once, the
 * first time it's asked for
 */
const chainsOf = (entries: LedgerEntry[]) => {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const builtOn = new Map<string, LedgerEntry[]>();
  for (const e of entries) for (const dep of e.dependsOn ?? []) if (!builtOn.get(dep)?.includes(e)) builtOn.set(dep, [...(builtOn.get(dep) ?? []), e]);
  const walk = (id: string, next: (cur: string) => LedgerEntry[]) => {
    const out: LedgerEntry[] = [];
    const seen = new Set([id]);
    const queue = [id];
    while (queue.length) {
      for (const e of next(queue.shift()!)) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        out.push(e);
        queue.push(e.id);
      }
    }
    return out;
  };
  const down = new Map<string, LedgerEntry[]>();
  const up = new Map<string, LedgerEntry[]>();
  const cached = (cache: Map<string, LedgerEntry[]>, id: string, next: (cur: string) => LedgerEntry[]) => {
    let chain = cache.get(id);
    if (!chain) cache.set(id, (chain = walk(id, next)));
    return chain;
  };
  return {
    dependentsOf: (id: string) => cached(down, id, (cur) => builtOn.get(cur) ?? []),
    dependenciesOf: (id: string) => cached(up, id, (cur) => (byId.get(cur)?.dependsOn ?? []).flatMap((dep) => byId.get(dep) ?? [])),
  };
};

/* ---------- Icons ---------- */

/* A small ledger mark for the title (drawn for Trenchcoat) */
const ledgerMark = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<rect x="2" y="1.8" width="12" height="12.4" rx="2.6" stroke="currentColor" stroke-width="1.3"></rect><path d="M5 5.4h6M5 8h6M5 10.6h3.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>`}</svg>`;
/* undo-2, redo-2 and lock: Lucide (ISC, lucide.dev) */
const undoIcon = html`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"></path>`}</svg>`;
const redoIcon = html`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m15 14 5-5-5-5"></path><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"></path>`}</svg>`;
const lockIcon = html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`}</svg>`;

const nameOf = (e: LedgerEntry) => `${e.action}${e.target ? ` ${e.target}` : ""}`;

let uid = 0;

/**
 * Everything an agent changed, newest first, each change with an Undo that takes what builds on it along.
 * @tag tc-agent-ledger
 * @fires tc-undone-change - The undone ids changed (`{ undone: string[] }`, the whole new list); cancelable – prevent it to keep `undone` as it is (controlled use)
 * @fires tc-undo - A change was undone (`{ ids: string[] }`: the change and its reversible dependents)
 * @fires tc-redo - A change was redone (`{ ids: string[] }`: the change, what went with it and the undone changes it builds on)
 */
export class TcAgentLedger extends TcElement {
  static override ui = "alg";

  /** The heading, and the list's name */
  @property() accessor heading = "Ledger";
  /** Who made the changes – e.g. "Launch agent" */
  @property() accessor agent = "";
  @property({ attribute: false }) accessor entries: LedgerEntry[] = [];
  /** The clock for "2m ago", in epoch ms – unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Ids of undone changes */
  @property({ attribute: false }) accessor undone: string[] = [];
  /** Lights up a change and what builds on it, as if its Undo were pointed at – e.g. for a walkthrough */
  @property({ attribute: "point-at" }) accessor pointAt: string | null = null;
  /** Called with the ids an Undo takes back; a returned promise holds the rows until it settles, a rejection reverts them */
  @property({ attribute: false }) accessor onUndo: LedgerAction | undefined = undefined;
  /** Called with the ids a Redo brings back; a returned promise holds the rows until it settles, a rejection reverts them */
  @property({ attribute: false }) accessor onRedo: LedgerAction | undefined = undefined;

  /** @internal An undo or redo on its way (its rows wait) */
  @state() accessor pending: ReadonlySet<string> = new Set();
  /** @internal The undo or redo that failed */
  @state() accessor failed: "undo" | "redo" | null = null;
  /** @internal The row whose Undo is pointed at */
  @state() accessor preview: string | null = null;
  /** @internal What the last undo or redo did, for screen readers */
  @state() accessor said = "";
  /** @internal The order rows were struck through in, for the stagger */
  @state() accessor order: Record<string, number> = {};
  /** @internal The element's own clock */
  @state() accessor tick = 0;

  private label = `tc-alg-${++uid}`;
  /** The changes already there when the ledger appears just show – only the ones added later grow in */
  private initial: Set<string> | null = null;
  private chains = chainsOf([]);
  private ownSet = false;
  private timer = 0;
  private away = false;
  private screen = new OnScreenController(this);

  constructor() {
    super();
    // If the focused Undo / Redo goes (its entry was removed), focus moves to the next row's action, not <body>
    new FocusRescueController(this, () => this.querySelector(".ui-alg__act"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.now === undefined) this.readClock();
  }

  private readClock = () => {
    this.tick = Date.now();
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopClock();
  }

  private stopClock() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
  }

  /** Without a clock from outside, "2m ago" keeps itself fresh; off screen or in a hidden tab it waits, and reads again on return */
  private syncClock() {
    const run = this.now === undefined && this.isConnected;
    if (!run || !this.screen.onScreen) {
      if (run) this.away = true;
      this.stopClock();
      return;
    }
    if (this.away) {
      this.away = false;
      this.readClock();
    }
    if (!this.timer) this.timer = window.setInterval(this.readClock, 15000);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.initial) this.initial = new Set(this.entries.map((e) => e.id));
    if (changed.has("entries")) this.chains = chainsOf(this.entries);
    if (changed.has("now") && this.now === undefined && changed.get("now") !== undefined) this.readClock();
    // Undone from outside: the ones that just joined strike through in the order they're listed
    if (changed.has("undone") && this.hasUpdated && !this.ownSet) {
      const was = (changed.get("undone") as string[] | undefined) ?? [];
      const fresh = this.undone.filter((id) => !was.includes(id));
      if (fresh.length) this.order = Object.fromEntries(fresh.map((id, i) => [id, i]));
    }
    this.ownSet = false;
  }

  protected override updated() {
    this.syncClock();
  }

  /** Changes the undone list through the cancelable event */
  private setUndone(next: (u: string[]) => string[]) {
    const undone = next(this.undone);
    if (this.emit("tc-undone-change", { undone }, { cancelable: true })) {
      this.ownSet = true;
      this.undone = undone;
    }
  }

  private chainOf(id: string, undone: Set<string>) {
    return this.chains.dependentsOf(id).filter((e) => !undone.has(e.id));
  }

  // The rows show the result at once; a promise holds them until it settles, and a rejection takes the step back
  private track(kind: "undo" | "redo", ids: string[], done: void | Promise<unknown> | undefined, revert: () => void) {
    this.failed = null;
    if (!done || typeof (done as Promise<unknown>).then !== "function") return;
    this.pending = new Set([...this.pending, ...ids]);
    const settle = () => (this.pending = new Set([...this.pending].filter((id) => !ids.includes(id))));
    (done as Promise<unknown>).then(
      () => this.isConnected && settle(),
      () => {
        if (!this.isConnected) return;
        settle();
        revert();
        this.failed = kind;
      },
    );
  }

  private say(verb: string, e: LedgerEntry, ids: string[], kept = 0) {
    const more = ids.length - 1;
    this.said = `${verb}: ${nameOf(e)}${more ? `, and ${more} ${more === 1 ? "change" : "changes"} with it` : ""}${kept ? `. ${kept} can't be undone` : ""}`;
  }

  private undoEntry(e: LedgerEntry) {
    if (this.pending.has(e.id)) return;
    const chain = this.chainOf(e.id, new Set(this.undone));
    const ids = [e.id, ...chain.filter((d) => d.reversible !== false).map((d) => d.id)];
    this.say("Undone", e, ids, chain.length + 1 - ids.length);
    this.order = Object.fromEntries(ids.map((id, i) => [id, i]));
    this.setUndone((u) => [...u, ...ids.filter((id) => !u.includes(id))]);
    this.preview = null;
    this.emit("tc-undo", { ids });
    this.track("undo", ids, this.onUndo?.(ids), () => this.setUndone((u) => u.filter((id) => !ids.includes(id))));
  }

  private redoEntry(e: LedgerEntry) {
    if (this.pending.has(e.id)) return;
    const undone = new Set(this.undone);
    // Back with it come the ones that went with it – and the undone ones they build on, which they can't stand without
    const back = [e.id, ...this.chains.dependentsOf(e.id).filter((d) => undone.has(d.id)).map((d) => d.id)];
    const needed = back.flatMap((id) => this.chains.dependenciesOf(id).map((d) => d.id).reverse());
    const ids = [...new Set([...needed.filter((id) => undone.has(id)), ...back])];
    this.say("Redone", e, ids);
    this.order = {};
    this.setUndone((u) => u.filter((id) => !ids.includes(id)));
    this.emit("tc-redo", { ids });
    this.track("redo", ids, this.onRedo?.(ids), () => this.setUndone((u) => [...u, ...ids.filter((id) => !u.includes(id))]));
  }

  protected override render() {
    const undone = new Set(this.undone);
    const now = this.now ?? this.tick;
    const sorted = [...this.entries].sort((a, b) => b.at - a.at);
    const lit = this.preview ?? this.pointAt;
    const previewIds = new Map((lit ? this.chainOf(lit, undone) : []).map((e) => [e.id, e.reversible !== false ? "also" : "kept"] as const));
    const count = this.entries.length;
    const undoneCount = this.entries.filter((e) => undone.has(e.id)).length;
    const initial = this.initial ?? new Set<string>();

    return html`
      <header class="ui-alg__bar">
        <span class="ui-alg__mark">${ledgerMark}</span>
        <span class="ui-alg__title" id=${this.label}>${this.heading}</span>
        ${this.agent ? html`<span class="ui-alg__agent" title=${this.agent}>${this.agent}</span>` : nothing}
        <span class="ui-alg__sum">
          <span><b>${count}</b> ${count === 1 ? "change" : "changes"}</span>
          ${undoneCount > 0 ? html`<span class="ui-alg__sum-undone"><b>${undoneCount}</b> undone</span>` : nothing}
          ${this.failed ? html`<span class="ui-alg__error" role="alert">${this.failed === "undo" ? "Couldn't undo" : "Couldn't redo"} – try again</span>` : nothing}
        </span>
        <span class="ui-alg__sr" role="status">${this.said}</span>
      </header>

      <ol class="ui-alg__panel" aria-labelledby=${this.label}>
        ${repeat(
          sorted,
          (e) => e.id,
          (e) => {
            const isUndone = undone.has(e.id);
            const mark = previewIds.get(e.id);
            const blocked = e.reversible === false;
            const builds = isUndone || blocked ? 0 : this.chainOf(e.id, undone).length;
            const pending = this.pending.has(e.id);
            return html`<li
              class="ui-alg__row"
              ?data-undone=${isUndone}
              ?data-initial=${initial.has(e.id)}
              ?data-pending=${pending}
              aria-busy=${ifDefined(pending ? "true" : undefined)}
              ?data-preview=${lit === e.id}
              data-chain=${ifDefined(mark)}
              style=${styleMap({ "--o": String(this.order[e.id] ?? 0) })}
            >
              <span class="ui-alg__icon" aria-hidden="true">${e.icon ? e.icon.cloneNode(true) : e.system.slice(0, 1)}</span>
              <div class="ui-alg__main">
                <span class="ui-alg__what">
                  <span class="ui-alg__action">${e.action}</span>
                  ${e.target ? html`<span class="ui-alg__target" title=${e.target}>${e.target}</span>` : nothing}
                  <span class="ui-alg__strike" aria-hidden="true"></span>
                </span>
                <span class="ui-alg__change">
                  ${e.change
                    ? html`<span class="ui-alg__before">${e.change[0]}</span><span class="ui-alg__arrow" aria-hidden="true">→</span><span class="ui-alg__sr"> to </span><span class="ui-alg__after" title=${e.change[1]}>${e.change[1]}</span>`
                    : html`<span class="ui-alg__detail" title=${ifDefined(e.detail)}>${e.detail}</span>`}
                </span>
              </div>
              <div class="ui-alg__end">
                ${mark
                  ? html`<span class="ui-alg__flag" data-kind=${mark}>${mark === "also" ? "Also undone" : html`${lockIcon}Can't undo`}</span>`
                  : html`<span class="ui-alg__time" ?data-hide=${isUndone || !blocked}>${isUndone ? "Undone" : html`${ago(now - e.at)}<span class="ui-alg__sys"> · ${e.system}</span>`}</span>
                      ${!isUndone && blocked
                        ? nothing
                        : html`<button
                            type="button"
                            class="ui-alg__act"
                            aria-disabled=${ifDefined(pending ? "true" : undefined)}
                            aria-label=${isUndone ? `Redo: ${nameOf(e)}` : `Undo: ${nameOf(e)}${builds ? ` – and ${builds} that build on it` : ""}`}
                            @mouseenter=${() => !undone.has(e.id) && (this.preview = e.id)}
                            @mouseleave=${() => this.preview === e.id && (this.preview = null)}
                            @focus=${() => !new Set(this.undone).has(e.id) && (this.preview = e.id)}
                            @blur=${() => this.preview === e.id && (this.preview = null)}
                            @click=${() => (new Set(this.undone).has(e.id) ? this.redoEntry(e) : this.undoEntry(e))}
                          >
                            ${isUndone ? redoIcon : undoIcon}<span class="ui-alg__act-label">${isUndone ? "Redo" : "Undo"}</span>
                          </button>`}`}
              </div>
            </li>`;
          },
        )}
      </ol>
    `;
  }

  static override css = /* css */ `

/* Colors, sizes and motion as variables – override them on [data-ui="alg"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="alg"] {
  /* Three layers: the gray tray, the white panel on it and the tiles on the panel (lighter again in dark) */
  --tc-agent-ledger-tray-bg: var(--tc-surface-tray);
  --tc-agent-ledger-panel-bg: var(--tc-surface-on-tray);
  --tc-agent-ledger-card-bg: var(--tc-surface-control);
  /* Rows an undo would also revert (blue) or keep (amber) */
  --tc-agent-ledger-also-bg: light-dark(#f5f8ff, #1c2232);
  --tc-agent-ledger-also-chip-bg: light-dark(#e3ecff, #1d2b4d);
  --tc-agent-ledger-kept-bg: light-dark(#fff8ee, #2a2219);
  --tc-agent-ledger-row: 62px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-agent-ledger-tray-bg);
  container: ui-alg / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on [data-ui="alg"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="alg"] {
  /* The icon tiles sit a step lighter than the panel in dark */
  --tc-agent-ledger-card-bg: var(--tc-surface-control);
  --tc-agent-ledger-also-chip-bg: light-dark(rgba(0, 96, 226, 0.09), rgba(91, 154, 255, 0.16));
  /* Rows an undo would also revert (blue) or keep (amber) */
  --tc-agent-ledger-also-bg: light-dark(rgba(0, 96, 226, 0.045), rgba(91, 154, 255, 0.07));
  --tc-agent-ledger-kept-bg: light-dark(#ff9c0014, rgba(255, 160, 40, 0.09));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-agent-ledger-row: 56px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-alg / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="alg"] *, [data-ui="alg"] *::before, [data-ui="alg"] *::after { box-sizing: border-box; }
:where([data-ui="alg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="alg"]) button { letter-spacing: inherit; }
[data-ui="alg"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-alg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-ui="alg"] svg { display: block; flex: none; }
/* ----- On the tray: whose changes, how many ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
/* ----- The bar: whose changes, how many ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; margin-bottom: var(--tc-space-4); }
.ui-alg__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__title { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sum { display: flex; align-items: center; gap: var(--tc-space-3-5); margin-left: auto; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sum b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__title { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__agent { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sum { display: flex; align-items: center; gap: var(--tc-space-3-5); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sum b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-alg__sum-undone { animation: ui-alg-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
.ui-alg__error { color: var(--tc-status-danger-fg); animation: ui-alg-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
.ui-alg__row[data-pending] .ui-alg__act { cursor: progress; opacity: 0.6; }
/* ----- The white card: one row per change, newest first ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__panel { display: grid; margin: 0; padding: var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-agent-ledger-panel-bg); box-shadow: var(--tc-card-shadow); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; align-items: center; column-gap: var(--tc-space-3); min-height: var(--tc-agent-ledger-row); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); animation: ui-alg-grow var(--tc-duration-slowest) var(--tc-ease-move) backwards; }
/* A new change opens its row – the card grows smoothly instead of jumping – and then fades in */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row > * { animation: ui-alg-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-fast) backwards; }
/* ----- The white panel: one row per change, newest first ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__panel { display: grid; margin: 0; padding: var(--tc-space-1); overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; column-gap: var(--tc-space-3); min-height: var(--tc-agent-ledger-row); padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-sm); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); animation: ui-alg-grow var(--tc-duration-slowest) var(--tc-ease-move) backwards; }
/* A new change opens its row – the panel grows smoothly instead of jumping – and then fades in */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row > * { animation: ui-alg-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-fast) backwards; }
.ui-alg__row[data-initial], .ui-alg__row[data-initial] > * { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row + .ui-alg__row::before { content: ""; position: absolute; top: 0; right: 12px; left: 54px; height: var(--tc-hairline); background: var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row + .ui-alg__row::before { content: ""; position: absolute; top: -0.25px; right: 12px; left: 50px; height: var(--tc-hairline); background: var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row:hover { background: var(--tc-fill-subtle); }
/* Pointing at Undo: this row and every change built on it light up */
.ui-alg__row[data-preview] { background: var(--tc-accent-subtle); }
.ui-alg__row[data-chain="also"] { background: var(--tc-agent-ledger-also-bg); }
.ui-alg__row[data-chain="kept"] { background: var(--tc-agent-ledger-kept-bg); }
.ui-alg__row:is([data-preview], [data-chain]) + .ui-alg__row::before, .ui-alg__row:is([data-preview], [data-chain])::before { opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-agent-ledger-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard), filter var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__icon > svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm); background: var(--tc-agent-ledger-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); transition: opacity var(--tc-duration-slow) var(--tc-ease-standard), filter var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__icon > svg { width: 14px; height: 14px; }
/* Two lines: what was done to what – then before → after */
.ui-alg__main { position: relative; display: grid; min-width: 0; }
.ui-alg__what { position: relative; display: flex; align-items: baseline; gap: var(--tc-space-1-5); justify-self: start; min-width: 0; max-width: 100%; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__action { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__target { min-width: 0; overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__change { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__action { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__target { min-width: 0; overflow: hidden; color: var(--tc-text-secondary); text-overflow: ellipsis; transition: color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__change { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-alg__before { flex: none; text-decoration: line-through; text-decoration-color: var(--tc-text-disabled); }
.ui-alg__arrow { flex: none; color: var(--tc-icon-muted); }
.ui-alg__detail { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__after { min-width: 0; overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; }
/* Undone: a line draws across what was done, a beat after each other down the chain, and the row goes quiet */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__strike { position: absolute; top: 50%; left: -2px; width: calc(100% + 4px); height: 1.5px; border-radius: var(--tc-radius-2xs); background: var(--tc-text-muted); transform: scaleX(0); transform-origin: left; pointer-events: none; transition: transform var(--tc-duration-slower) var(--tc-ease-move) calc(var(--o, 0) * var(--tc-duration-quick)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__after { min-width: 0; overflow: hidden; color: var(--tc-text-secondary); text-overflow: ellipsis; }
/* Undone: a line draws across the text, a beat after each other down the chain, and the row goes quiet */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__strike { position: absolute; top: 50%; left: -2px; width: calc(100% + 4px); height: 1px; border-radius: var(--tc-radius-2xs); background: var(--tc-text-muted); transform: scaleX(0); transform-origin: left; pointer-events: none; transition: transform var(--tc-duration-slower) var(--tc-ease-move) calc(var(--o, 0) * var(--tc-duration-quick)); }
.ui-alg__row[data-undone] .ui-alg__strike { transform: scaleX(1); }
.ui-alg__row[data-undone] :is(.ui-alg__action, .ui-alg__target, .ui-alg__after) { color: var(--tc-text-muted); transition-delay: calc(var(--o, 0) * var(--tc-duration-quick)); }
.ui-alg__row[data-undone] .ui-alg__icon { opacity: 0.5; filter: grayscale(1); transition-delay: calc(var(--o, 0) * var(--tc-duration-quick)); }
/* On the right: one slot – the time, or Undo / Redo on hover, or what an undo does to this row */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__end { position: relative; display: grid; justify-items: end; align-items: center; min-width: 120px; min-height: var(--tc-control-h-sm); }
/* The time only shows – the buttons in the same slot sit on top and get every click */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__time { grid-area: 1 / 1; pointer-events: none; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
/* On the right: one slot – the time, or Undo / Redo on hover, or what an undo does to this row */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__end { position: relative; display: grid; justify-items: end; align-items: center; min-width: 108px; min-height: var(--tc-control-h-sm); }
/* The time only shows – the buttons in the same slot sit on top and get every click */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__time { grid-area: 1 / 1; pointer-events: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-alg__row[data-undone] .ui-alg__time { color: var(--tc-text-muted); }
/* Undo / Redo: Button's secondary recipe (Standard) and its ghost recipe (Clean), small size */
.ui-alg__act { position: relative; z-index: 1; grid-area: 1 / 1; display: inline-flex; align-items: center; min-height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); font-weight: var(--tc-control-font-weight); white-space: nowrap; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act { gap: var(--tc-space-1-5); margin-right: -4px; padding: 0 var(--tc-control-px-sm) 0 calc(var(--tc-control-px-sm) - 2px); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); color: var(--tc-action-secondary-fg); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act { gap: var(--tc-space-1); margin-right: -6px; padding: 0 var(--tc-control-px-sm); font-size: var(--tc-font-size-sm); color: var(--tc-action-ghost-fg); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row:is(:hover, :focus-within) .ui-alg__time[data-hide] { opacity: 0; }
.ui-alg__row:is(:hover, :focus-within, [data-preview]) .ui-alg__act { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row:is(:hover, :focus-within) .ui-alg__time[data-hide],
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row[data-preview] .ui-alg__time[data-hide] { opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row[data-preview] .ui-alg__act { color: var(--tc-accent-text); }
/* What an undo does to this row: a status pill (header size) */
.ui-alg__flag { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; animation: ui-alg-fade var(--tc-duration-fast) var(--tc-ease-standard) both; }
.ui-alg__flag[data-kind="also"] { background: var(--tc-agent-ledger-also-chip-bg); color: var(--tc-accent-text); }
.ui-alg__flag[data-kind="kept"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* ----- Narrow: smaller gaps, the time stands alone ----- */
@container ui-alg (max-width: 480px) {
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row { column-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row + .ui-alg__row::before { left: 50px; right: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__end { min-width: 76px; }
  /* The logo already says where – the time stands alone */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sys { display: none; }
  /* Undo and Redo shrink to their icon – the label stays for screen readers */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act { width: var(--tc-control-h-sm); justify-content: center; padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row[data-preview] .ui-alg__time[data-hide] { opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row[data-preview] .ui-alg__act { background: var(--tc-agent-ledger-also-chip-bg); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act:hover { background: var(--tc-action-ghost-bg-hover); }
/* ----- Narrow: smaller gaps, the system's name drops from the time ----- */
@container ui-alg (max-width: 480px) {
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row { column-gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row + .ui-alg__row::before { left: 46px; right: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__end { min-width: 64px; }
  /* The logo already says where – the time stands alone */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sys { display: none; }
  /* Undo and Redo shrink to their icon – the label stays for screen readers */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act { width: var(--tc-control-h-sm); justify-content: center; padding: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
/* Touch screens can't point: Undo and Redo show on every row, in place of the time */
@media (hover: none) {
  .ui-alg__act { opacity: 1; }
  .ui-alg__time[data-hide] { opacity: 0; }
}
@keyframes ui-alg-grow { from { min-height: 0; height: 0; padding-top: 0; padding-bottom: 0; } to { height: var(--tc-agent-ledger-row); } }
@keyframes ui-alg-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ui-alg-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="alg"] *, [data-ui="alg"] *::before, [data-ui="alg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-ledger")) customElements.define("tc-agent-ledger", TcAgentLedger);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-ledger": TcAgentLedger;
  }
}
