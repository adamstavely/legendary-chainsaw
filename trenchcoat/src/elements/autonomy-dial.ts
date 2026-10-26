import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-autonomy-dial> – the Lit port of src/components/autonomy-dial.tsx: how much an agent may do on its own.
 * Three levels as a segmented control – Always ask, If risky, Full auto – and the agent's actions in two groups,
 * "Runs on its own" and "Asks you first"; risky and destructive ones carry a small tag.
 *   · pick a level and the actions glide from one group to the other
 *   · the lock on an action pins it to "Asks you first", whatever the dial says
 *   · the counts next to both groups roll when they change
 * Standard: a white card on a gray tray with a gliding pill, the groups on the tray. Clean: one white card, the groups
 * inside it.
 *
 *   <tc-autonomy-dial heading="Support agent" .actions=${actions} level="1"></tc-autonomy-dial>
 */

export type AutonomyLevel = 0 | 1 | 2;
export type ActionRisk = "safe" | "risky" | "destructive";

export type AgentAction = {
  id: string;
  label: string;
  /** A few words on what it touches, e.g. "Gmail · to customers" */
  detail?: string;
  risk: ActionRisk;
  /** A 16px glyph or a small brand mark (cloned) */
  icon?: Element;
};

/** Does the agent have to ask before this action? */
export const asksFirst = (action: Pick<AgentAction, "id" | "risk">, level: AutonomyLevel, pinned: string[] = []) =>
  pinned.includes(action.id) || level === 0 || (level === 1 && action.risk !== "safe");

const LEVELS: { id: AutonomyLevel; label: string; hint: string }[] = [
  { id: 0, label: "Always ask", hint: "Nothing happens without your OK" },
  { id: 1, label: "If risky", hint: "Safe actions run, risky ones wait for you" },
  { id: 2, label: "Full auto", hint: "Everything runs, except what you locked" },
];
const RISK: Record<ActionRisk, string> = { safe: "", risky: "Risky", destructive: "Destructive" };
/** A calm in-and-out – the rows settle without a snap */
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const clamp = (n: number): AutonomyLevel => Math.max(0, Math.min(2, Math.round(n))) as AutonomyLevel;
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
let uidCount = 0;

/* Risk, lock and unlock – triangle-alert, octagon-alert, lock-keyhole and lock-keyhole-open: Lucide (ISC, lucide.dev) */
const lucide = (body: ReturnType<typeof svg>) =>
  html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const riskyIcon = () => lucide(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);
const destructiveIcon = () =>
  lucide(
    svg`<path d="M12 16h.01"></path><path d="M12 8v4"></path><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"></path>`,
  );
const lockedIcon = () => lucide(svg`<circle cx="12" cy="16" r="1"></circle><rect x="3" y="10" width="18" height="12" rx="2"></rect><path d="M7 10V7a5 5 0 0 1 10 0v3"></path>`);
const unlockedIcon = () => lucide(svg`<circle cx="12" cy="16" r="1"></circle><rect width="18" height="12" x="3" y="10" rx="2"></rect><path d="M7 10V7a5 5 0 0 1 9.33-2.5"></path>`);
const spark = () =>
  html`<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${svg`<path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor"></path><circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55"></circle>`}</svg>`;
const dotIcon = () => html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="2.4" fill="currentColor"></circle>`}</svg>`;

/** Where each row sits, relative to the host, and how tall the gliding box is – the "before" of a move */
type Snapshot = { rows: Map<string, number>; height: number };
type Roll = { shown: number; dir: "up" | "down" | null };

/**
 * How much an agent may do on its own: three levels, and the actions it runs alone or asks about first.
 * @tag tc-autonomy-dial
 * @fires tc-level-change - The user picked a level ({ level: AutonomyLevel }); cancelable
 * @fires tc-pinned-change - The user locked or unlocked an action ({ pinned: string[] }); cancelable
 */
export class TcAutonomyDial extends TcElement {
  static override ui = "ad";

  @property({ attribute: false }) accessor actions: AgentAction[] = [];
  /** 0 Ask every time · 1 Ask before risky actions · 2 Full auto */
  @property({ type: Number }) accessor level: AutonomyLevel = 1;
  /** Ids of actions that always ask, whatever the level */
  @property({ attribute: false }) accessor pinned: string[] = [];
  /** Heading, e.g. the agent's name */
  @property() accessor heading = "Agent permissions";
  /** Line under the heading */
  @property() accessor subtitle = "What it may do without asking you";

  private uid = `tc-ad-${++uidCount}`;
  private rolls: { own: Roll; ask: Roll } | null = null;
  private snap: Snapshot | null = null;
  private lastShape = "";
  private lastLook = "";

  constructor() {
    super();
    // A pinned or unpinned action moves to the other group (a new element): focus follows its lock button there,
    // through the shared data-focus-key, instead of dropping to <body> (WCAG 2.4.3)
    new FocusRescueController(this);
  }

  private get lvl(): AutonomyLevel {
    return clamp(Number(this.level) || 0);
  }

  private split() {
    const own = this.actions.filter((a) => !asksFirst(a, this.lvl, this.pinned));
    const ask = this.actions.filter((a) => asksFirst(a, this.lvl, this.pinned));
    return { own, ask };
  }

  private setLevel(next: AutonomyLevel) {
    if (next === this.lvl) return;
    this.snapshot();
    if (this.emit("tc-level-change", { level: next }, { cancelable: true })) this.level = next;
  }

  private togglePin(id: string) {
    this.snapshot();
    const next = this.pinned.includes(id) ? this.pinned.filter((p) => p !== id) : [...this.pinned, id];
    if (this.emit("tc-pinned-change", { pinned: next }, { cancelable: true })) this.pinned = next;
  }

  private onKey(e: KeyboardEvent) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = clamp(this.lvl + step);
    this.setLevel(next);
    this.querySelector<HTMLElement>(`.ui-ad__segmented [data-level="${next}"]`)?.focus();
  }

  /* ---------- Motion: actions glide between the groups ---------- */

  private measure(): Snapshot | null {
    if (!this.isConnected) return null;
    const top = this.getBoundingClientRect().top;
    // The box whose height glides: the whole tray in Standard, the card in Clean
    const box = this.resolvedLook === "clean" ? this.querySelector<HTMLElement>(".ui-ad__card") : this;
    const rows = new Map<string, number>();
    this.querySelectorAll<HTMLElement>(".ui-ad__row[data-id]").forEach((el) => rows.set(el.dataset.id!, el.getBoundingClientRect().top - top));
    return { rows, height: box?.offsetHeight ?? 0 };
  }

  private snapshot() {
    this.snap = this.measure();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.dataset.level = String(this.lvl);
    const { own, ask } = this.split();
    // The counts roll up or down when they change
    const roll = (prev: Roll | undefined, value: number): Roll => (!prev || prev.shown === value ? (prev ?? { shown: value, dir: null }) : { shown: value, dir: value > prev.shown ? "up" : "down" });
    this.rolls = { own: roll(this.rolls?.own, own.length), ask: roll(this.rolls?.ask, ask.length) };
  }

  protected override updated() {
    const clean = this.resolvedLook === "clean";
    // The pill sits under the chosen level – the levels are as wide as their words, so it is measured
    const seg = this.querySelector<HTMLElement>(".ui-ad__segmented");
    if (seg) {
      const btn = clean ? null : seg.querySelector<HTMLElement>(`[data-level="${this.lvl}"]`);
      if (btn) {
        seg.style.setProperty("--x", `${btn.offsetLeft}px`);
        seg.style.setProperty("--w", `${btn.offsetWidth}px`);
      } else {
        seg.style.removeProperty("--x");
        seg.style.removeProperty("--w");
        if (!seg.getAttribute("style")) seg.removeAttribute("style");
      }
    }

    const { own, ask } = this.split();
    const shape = `${own.map((a) => a.id).join(",")}|${ask.map((a) => a.id).join(",")}`;
    const look = this.resolvedLook;
    if (this.lastShape === shape || this.lastLook !== look) {
      // First layout (or a new look): the baseline for the next move
      if (this.lastLook !== look) this.snap = null;
      this.lastShape = shape;
      this.lastLook = look;
      if (!this.snap) this.snap = this.measure();
      return;
    }
    this.lastShape = shape;
    const from = this.snap;
    const to = this.measure();
    this.snap = to;
    if (reducedMotion() || !from || !to) return;
    const card = clean ? this.querySelector<HTMLElement>(".ui-ad__card") : this;
    if (card && from.height && Math.abs(to.height - from.height) > 1 && typeof card.animate === "function") {
      card.animate([{ height: `${from.height}px` }, { height: `${to.height}px` }], { duration: 420, easing: EASE });
    }
    let k = 0;
    this.querySelectorAll<HTMLElement>(".ui-ad__row[data-id]").forEach((el) => {
      const id = el.dataset.id!;
      const a = from.rows.get(id);
      const b = to.rows.get(id);
      if (a === undefined || b === undefined) return;
      const dy = a - b;
      if (Math.abs(dy) < 1 || typeof el.animate !== "function") return;
      // Rows that change group glide a beat after each other
      el.animate([{ transform: `translateY(${dy}px)`, zIndex: 2 }, { transform: "none", zIndex: 2 }], { duration: 420, delay: k++ * 20, easing: EASE, fill: "backwards" });
    });
  }

  /* ---------- One action ---------- */

  private row(a: AgentAction, asks: boolean) {
    const isPinned = this.pinned.includes(a.id);
    return html`<li class="ui-ad__row" data-id=${a.id} ?data-asks=${asks}>
      <span class="ui-ad__icon">${a.icon ? a.icon.cloneNode(true) : dotIcon()}</span>
      <span class="ui-ad__name">
        <span class="ui-ad__line">
          <span class="ui-ad__label" title=${a.label}>${a.label}</span>
          ${a.risk !== "safe" ? html`<span class="ui-ad__risk" data-risk=${a.risk}>${a.risk === "risky" ? riskyIcon() : destructiveIcon()}${RISK[a.risk]}</span>` : nothing}
        </span>
        ${a.detail ? html`<span class="ui-ad__detail" title=${a.detail}>${a.detail}</span>` : nothing}
      </span>
      <button
        type="button"
        class="ui-ad__pin"
        aria-pressed=${isPinned ? "true" : "false"}
        aria-label=${`Always ask before: ${a.label}`}
        data-focus-key=${`pin:${a.id}`}
        title=${isPinned ? "Always asks – click to follow the dial again" : "Always ask, whatever the dial says"}
        @click=${() => this.togglePin(a.id)}
      >
        ${isPinned ? lockedIcon() : unlockedIcon()}
      </button>
    </li>`;
  }

  private roll(r: Roll) {
    return keyed(r.shown, html`<span class="ui-ad__roll" data-dir=${ifDefined(r.dir ?? undefined)}>${r.shown}</span>`);
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const lvl = this.lvl;
    const { own, ask } = this.split();
    const rolls = this.rolls!;
    const current = LEVELS[lvl];
    const uid = this.uid;

    /* What it does on its own, and what waits for you – on the tray (Standard) or inside the card (Clean) */
    const groups = html`<div class="ui-ad__groups">
      <section class="ui-ad__group" aria-labelledby=${`${uid}-own`}>
        <h4 class="ui-ad__group-head" id=${`${uid}-own`}>Runs on its own<span class="ui-ad__count">${this.roll(rolls.own)}</span></h4>
        <ul class="ui-ad__list">
          ${repeat(own, (a) => a.id, (a) => this.row(a, false))}
          ${own.length === 0 ? html`<li class="ui-ad__empty">Every action waits for you</li>` : nothing}
        </ul>
      </section>
      <section class="ui-ad__group" aria-labelledby=${`${uid}-ask`}>
        <h4 class="ui-ad__group-head" id=${`${uid}-ask`}>Asks you first<span class="ui-ad__count">${this.roll(rolls.ask)}</span></h4>
        <ul class="ui-ad__list">
          ${repeat(ask, (a) => a.id, (a) => this.row(a, true))}
          ${ask.length === 0 ? html`<li class="ui-ad__empty">The agent runs everything itself</li>` : nothing}
        </ul>
      </section>
    </div>`;

    return html`
      <div class="ui-ad__card">
        <header class="ui-ad__head">
          <span class="ui-ad__spark">${spark()}</span>
          <span class="ui-ad__heading">
            <span class="ui-ad__title" title=${this.heading}>${this.heading}</span>
            ${this.subtitle ? html`<span class="ui-ad__sub" title=${this.subtitle}>${this.subtitle}</span>` : nothing}
          </span>
        </header>
        <div class="ui-ad__levels">
          <div class="ui-ad__segmented" role="radiogroup" aria-label="Autonomy" aria-describedby=${`${uid}-hint`} @keydown=${this.onKey}>
            ${clean ? nothing : html`<span class="ui-ad__pill" aria-hidden="true"></span>`}
            ${LEVELS.map(
              (l) => html`<button
                type="button"
                role="radio"
                aria-checked=${l.id === lvl ? "true" : "false"}
                tabindex=${l.id === lvl ? 0 : -1}
                data-level=${l.id}
                class="ui-ad__level"
                @click=${() => this.setLevel(l.id)}
              >${l.label}</button>`,
            )}
          </div>
          <span class="ui-ad__sr" id=${`${uid}-hint`}>${current.hint}</span>
        </div>
        ${clean ? groups : nothing}
      </div>
      ${clean ? nothing : groups}
      <span class="ui-ad__sr" aria-live="polite">${`${current.label}: ${own.length} on its own, ${ask.length} ask first`}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ad"] */
[data-ui="ad"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: the card and the groups on a tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ad"] {
  max-width: 420px;
  padding: var(--tc-tray-inset);
  overflow: hidden;
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-size: var(--tc-font-size-lg);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ad"] {
  max-width: 400px;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
}
[data-ui="ad"] *, [data-ui="ad"] *::before, [data-ui="ad"] *::after { box-sizing: border-box; }
:where([data-ui="ad"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ad"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ad"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="ad"] h4 { margin: 0; }
[data-ui="ad"] svg { display: block; flex: none; }
.ui-ad__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The card holds the heading and the levels – the edge is a shadow, not a border */
.ui-ad__card { position: relative; border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__card { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__card { overflow: hidden; background: var(--tc-surface-raised); }
.ui-ad__head { display: flex; align-items: center; padding: var(--tc-space-4) var(--tc-space-4) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__head { gap: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__head { gap: var(--tc-space-2-5); }
.ui-ad__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-ad__heading { display: grid; min-width: 0; }
.ui-ad__title { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__title { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__title { color: var(--tc-text-strong); }
.ui-ad__sub { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* ----- Standard levels: the segmented-control recipe – a track, a raised thumb glides to the chosen one ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__levels { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__segmented { position: relative; display: flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pill { position: absolute; top: var(--tc-seg-pad); bottom: var(--tc-seg-pad); left: 0; width: var(--w, 0); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); transform: translateX(var(--x, 0)); transition: transform var(--tc-duration-slow) var(--tc-ease-move), width var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { position: relative; flex: 1; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
/* The chosen level: the thumb, the primary colour and the strong weight – not a fill alone */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level[aria-checked="true"] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level[aria-checked="false"]:hover { color: var(--tc-text-primary); }
/* ----- On the tray: the two groups ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ad__groups { display: grid; gap: var(--tc-space-3-5); padding: var(--tc-space-3-5) var(--tc-space-1) var(--tc-space-1); }
.ui-ad__group-head { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__group-head { margin: 0 var(--tc-space-2) var(--tc-space-2) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
/* The count: a small badge with a soft lift – no taller than the heading */
.ui-ad__count { display: grid; place-items: center; overflow: hidden; border-radius: var(--tc-radius-badge); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__count { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- Clean levels: three separate buttons ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__levels { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__segmented { position: relative; display: flex; gap: var(--tc-space-2); }
/* The others are gray, the chosen one is white with a lift and a ≥ 3:1 selected edge (WCAG 1.4.11) */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { position: relative; flex: 1; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level[aria-checked="true"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-selected), var(--tc-shadow-raised); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level[aria-checked="false"]:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* ----- The two groups: spacing between them, one hairline above ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ad__groups { display: grid; gap: var(--tc-space-3-5); padding: var(--tc-space-3-5) var(--tc-space-2-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__group-head { margin: 0 var(--tc-space-1-5) var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__count { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-ad__roll { display: block; }
.ui-ad__roll[data-dir="up"] { animation: ui-ad-roll-up var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-ad__roll[data-dir="down"] { animation: ui-ad-roll-down var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-ad__list { display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__list { gap: var(--tc-space-1); }
.ui-ad__row { position: relative; display: flex; align-items: center; gap: var(--tc-space-3); background: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__row { min-height: 42px; padding: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-3-5); border-radius: var(--tc-radius-xl); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row { min-height: 30px; padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row:hover { background: var(--tc-fill-subtle); }
.ui-ad__icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
.ui-ad__icon > svg { width: 16px; height: 16px; }
.ui-ad__name { display: grid; flex: 1; min-width: 0; }
/* The name and its risk tag wrap onto two lines rather than the tag cutting the name off */
.ui-ad__line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); min-width: 0; }
.ui-ad__label { min-width: 0; max-width: 100%; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__label { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); }
.ui-ad__detail { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Risk: a small pill right after the name – glyph and word; safe actions carry nothing */
.ui-ad__risk { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-ad__risk > svg { width: 12px; height: 12px; }
.ui-ad__risk[data-risk="destructive"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The lock: an icon button like Button's ghost icon button, always visible (≥ 3:1) */
.ui-ad__pin { display: grid; flex: none; place-items: center; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pin { width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__pin { width: var(--tc-control-h-md); height: var(--tc-control-h-md); }
.ui-ad__pin:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-ad__pin[aria-pressed="true"] { color: var(--tc-text-secondary); }
/* Empty group: one quiet tag across the whole width */
.ui-ad__empty { display: flex; align-items: center; justify-content: center; background: var(--tc-fill-subtle); color: var(--tc-text-muted); text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__empty { min-height: 42px; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-xl); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__empty { min-height: 30px; margin: var(--tc-space-0-5) 0; padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
@keyframes ui-ad-roll-up { from { opacity: 0; transform: translateY(70%); } }
@keyframes ui-ad-roll-down { from { opacity: 0; transform: translateY(-70%); } }
/* Narrow containers: the levels get tighter – the details stay (truncated, the full text in a tooltip) */
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { padding: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__segmented { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { padding: var(--tc-space-1) var(--tc-space-1-5); font-size: var(--tc-font-size-sm); }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ad__level { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ad__pin { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__level { padding: var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__pin { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ad__row { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ad"] *, [data-ui="ad"] *::before, [data-ui="ad"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-autonomy-dial")) customElements.define("tc-autonomy-dial", TcAutonomyDial);

declare global {
  interface HTMLElementTagNameMap {
    "tc-autonomy-dial": TcAutonomyDial;
  }
}
