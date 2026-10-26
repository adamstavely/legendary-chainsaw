import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-permission-request> – the Lit port of src/components/permission-request.tsx: an agent asks for one specific
 * right. Who asks for what ("Coder wants to push to main"), why, and exactly what will happen – the files,
 * recipients or amounts – before anything does.
 *   · pick how long the right holds: just this once, for a while (e.g. 1 hour) or always
 *   · Allow or Deny – Enter and Esc work while the card has focus
 *   · then the card folds into one line: "Allowed for 1 hour" with a bar that drains until the right expires, and
 *     Revoke to take it back; destructive actions can never be allowed for always
 * Standard: a white card on a gray tray. Clean: one quiet white card, smaller and lighter throughout.
 *
 *   <tc-permission-request .agent=${{ name: "Coder" }} action="push to main" risk="risky"></tc-permission-request>
 */

export type PermissionRisk = "safe" | "risky" | "destructive";
export type PermissionScope = "once" | "timed" | "always";

export type PermissionDecision = {
  allow: boolean;
  scope: PermissionScope;
  /** When it was decided (ms) */
  at: number;
  /** When a timed right runs out (ms) */
  until?: number;
};

export type PermissionPreviewItem = {
  id: string;
  label: string;
  /** Right-aligned, e.g. "+12 −4" or "$240.00" – text, or an element (cloned) */
  meta?: string | Element;
  /** A 16px glyph or a small brand mark (cloned) */
  icon?: Element;
};

/** Who asks */
export type PermissionAgent = { name: string; model?: string; /** An avatar or logo (cloned); unset shows initials */ avatar?: Element };

const MIN = 60_000;
/** The wall clock – read only in event handlers and timers, never while rendering */
const clock = () => Date.now();
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const hhmm = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const span = (min: number) => (min % 60 === 0 ? `${min / 60} hour${min === 60 ? "" : "s"}` : `${min} min`);
const left = (ms: number) => {
  const m = Math.ceil(ms / MIN);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min ` : ""}left` : `${m} min left`;
};
const RISK: Record<PermissionRisk, string> = { safe: "", risky: "Risky", destructive: "Destructive" };
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const clone = (node: Element | undefined) => node?.cloneNode(true);
let uidCount = 0;

/* Risk, check, cross and clock – triangle-alert, octagon-alert, circle-check, circle-x and clock: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const riskyIcon = () => lucide(12, svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);
const destructiveIcon = () =>
  lucide(
    12,
    svg`<path d="M12 16h.01"></path><path d="M12 8v4"></path><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"></path>`,
  );
const checkIcon = () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m16 9-5.5 5.5L8 12"></path>`);
const crossIcon = () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`);
const clockIcon = () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`);
const dotIcon = () => html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="2.4" fill="currentColor"></circle>`}</svg>`;

/**
 * An agent asks for one specific right: what will happen, for how long, Allow or Deny – then one line with a countdown.
 * @tag tc-permission-request
 * @fires tc-decision-change - Allow, Deny or Revoke ({ decision: PermissionDecision | null }); cancelable
 * @fires tc-scope-change - The user picked how long ({ scope: PermissionScope }); cancelable
 * @fires tc-expire - A timed right ran out, once per decision ({ decision: PermissionDecision })
 */
export class TcPermissionRequest extends TcElement {
  static override ui = "pr";

  /** Who asks */
  @property({ attribute: false }) accessor agent: PermissionAgent = { name: "" };
  /** What it wants to do, lower case after "wants to", e.g. "push to main" */
  @property() accessor action = "";
  /** Where, e.g. "acme/web" – shown with the tool's mark */
  @property() accessor target: string | undefined = undefined;
  /** The tool's mark next to the target (cloned) */
  @property({ attribute: false }) accessor toolIcon: Element | undefined = undefined;
  /** How much harm the action can do: safe shows no pill, risky a warning, destructive a danger pill and no "always" */
  @property() accessor risk: PermissionRisk = "risky";
  /** The agent's own words on why it needs this */
  @property() accessor reason: string | undefined = undefined;
  /** What will happen if you allow it – files, recipients, amounts */
  @property({ attribute: false }) accessor preview: PermissionPreviewItem[] = [];
  /** The heading over the preview list, e.g. "5 files will change" */
  @property({ attribute: "preview-title" }) accessor previewTitle = "What will happen";
  /** Rows shown before "N more" */
  @property({ type: Number, attribute: "preview-limit" }) accessor previewLimit = 3;
  /** The choices offered; "always" is never offered for destructive actions */
  @property({ attribute: false }) accessor scopes: PermissionScope[] = ["once", "timed", "always"];
  /** How long an Allow holds */
  @property() accessor scope: PermissionScope = "once";
  /** Minutes a timed right holds */
  @property({ type: Number }) accessor duration = 60;
  /** The decision – null while it waits */
  @property({ attribute: false }) accessor decision: PermissionDecision | null = null;
  /** The clock for the countdown, epoch ms – unset uses an internal clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;

  @state() private accessor open = false;
  @state() private accessor tick = 0;

  private uid = `tc-pr-${++uidCount}`;
  private shown = 0;
  private timer = 0;
  private io?: IntersectionObserver;
  private onScreen = true;
  private countdownKey = "";
  private reported: PermissionDecision | null = null;
  private foldHeight = 0;
  private lastShape = "";
  private lastDecided = false;
  private ro?: ResizeObserver;

  constructor() {
    super();
    // Safety net when the page swaps the decision while focus is inside: the card's main button, else the host
    new FocusRescueController(this, () => this.card?.querySelector('[data-focus-key="reset"], [data-focus-key="allow"]'));
  }

  private get card() {
    return this.querySelector<HTMLElement>(".ui-pr__card");
  }
  private get offered() {
    return this.scopes.filter((s) => !(s === "always" && this.risk === "destructive"));
  }
  private get chosenScope(): PermissionScope {
    const offered = this.offered;
    return offered.includes(this.scope) ? this.scope : (offered[0] ?? "once");
  }
  private get clockNow() {
    return this.now ?? this.tick;
  }
  private get expired() {
    const d = this.decision;
    return !!(d?.allow && d.until && this.clockNow >= d.until);
  }
  private get shape() {
    const d = this.decision;
    return d ? (this.expired ? "expired" : d.allow ? "allowed" : "denied") : `pending:${this.open}`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCountdown();
    this.countdownKey = "";
    this.ro?.disconnect();
    this.ro = undefined;
  }

  /* ---------- Decisions ---------- */

  // Before the card changes shape, focus (if it is inside) waits on the card itself; once the new shape is there it
  // moves on to that shape's main button – Revoke / Change after a decision, Allow when asked again
  private settleFocus = () => {
    const card = this.card;
    if (!card || document.activeElement !== card) return;
    card.querySelector<HTMLElement>('[data-focus-key="reset"], [data-focus-key="allow"]')?.focus({ preventScroll: true });
  };
  // A controlling page may keep the old shape – then the next frame puts focus back on its button
  private hold() {
    const card = this.card;
    if (rescueFocus(card, [card])) requestAnimationFrame(this.settleFocus);
  }
  private decide(next: PermissionDecision | null) {
    if (this.emit("tc-decision-change", { decision: next }, { cancelable: true })) this.decision = next;
  }
  private allow() {
    this.hold();
    const scope = this.chosenScope;
    const at = this.now ?? clock();
    // A decision made here: the countdown starts from its own moment
    if (this.now === undefined) this.commit(at);
    this.decide({ allow: true, scope, at, until: scope === "timed" ? at + this.duration * MIN : undefined });
  }
  private deny() {
    this.hold();
    this.decide({ allow: false, scope: this.chosenScope, at: this.now ?? clock() });
  }
  private reset() {
    this.hold();
    this.decide(null);
  }
  private setScope(next: PermissionScope) {
    if (next === this.scope) return;
    if (this.emit("tc-scope-change", { scope: next }, { cancelable: true })) this.scope = next;
  }

  private onKey(e: KeyboardEvent) {
    if (this.decision || e.isComposing) return;
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === "Enter" && tag !== "BUTTON") {
      e.preventDefault();
      this.allow();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.deny();
    }
  }

  private onScopeKey(e: KeyboardEvent) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const offered = this.offered;
    const next = offered[(offered.indexOf(this.chosenScope) + step + offered.length) % offered.length];
    this.setScope(next);
    (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`[data-scope="${next}"]`)?.focus();
  }

  /* ---------- The countdown: the words update when they change, the bar drains on its own ---------- */

  private commit(t: number) {
    this.shown = t;
    this.tick = t;
  }

  private stopCountdown() {
    window.clearInterval(this.timer);
    this.timer = 0;
    this.io?.disconnect();
    this.io = undefined;
    document.removeEventListener("visibilitychange", this.sync);
  }

  private first = false;
  private step = () => {
    const d = this.decision;
    const until = d?.until;
    if (until === undefined || !d) return;
    const t = clock();
    const total = until - d.at;
    const bar = this.querySelector<HTMLElement>(".ui-pr__drain > span");
    if (bar && total) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, (until - t) / total))})`;
    if (this.first || t >= until || left(until - t) !== left(until - this.shown)) this.commit(t);
    this.first = false;
  };

  // Only while the card is on screen and the tab is visible: back on screen, catch up at once, then every second
  private sync = () => {
    const run = this.onScreen && document.visibilityState !== "hidden";
    if (run && !this.timer) {
      this.step();
      this.timer = window.setInterval(() => this.step(), 1000);
    } else if (!run && this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  };

  private runCountdown() {
    const d = this.decision;
    const until = d?.allow && d.scope === "timed" ? d.until : undefined;
    const ticking = until !== undefined && this.now === undefined && this.tick < until;
    const key = ticking ? `${until}|${d!.at}` : "";
    if (key === this.countdownKey) return;
    this.stopCountdown();
    this.countdownKey = key;
    if (!ticking) return;
    // The first reading goes through a render, so what it shows is current
    this.first = true;
    this.onScreen = true;
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        this.onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
        this.sync();
      });
      this.io.observe(this);
    }
    document.addEventListener("visibilitychange", this.sync);
    // After this update, not inside it: the first reading re-renders
    queueMicrotask(() => {
      if (this.countdownKey === key && !this.timer) this.sync();
    });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The countdown starts at the decision's own time; the real clock is read after the first render
    if (!this.hasUpdated) this.commit(this.decision?.at ?? 0);
    this.dataset.risk = this.risk;
    this.dataset.state = this.shape.split(":")[0];
  }

  protected override firstUpdated() {
    // The card's height, kept fresh while it resizes without a change of shape (content, fonts, container width)
    const card = this.card;
    if (card && typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => {
        const c = this.card;
        if (c && !c.getAnimations?.().length) this.foldHeight = c.offsetHeight;
      });
      this.ro.observe(card);
    }
  }

  protected override updated() {
    // The card folds to one line and back: its height animates when its shape changes
    const card = this.card;
    const shape = this.shape;
    if (card) {
      const from = this.foldHeight;
      const to = card.offsetHeight;
      this.foldHeight = to;
      if (this.lastShape && this.lastShape !== shape && !reducedMotion() && from && Math.abs(to - from) > 1 && typeof card.animate === "function") {
        card.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 380, easing: EASE });
      }
    }
    this.lastShape = shape;
    // When the shape changes, focus held on the card moves on to the new shape's button
    const decided = !!this.decision;
    if (decided !== this.lastDecided) {
      this.lastDecided = decided;
      this.settleFocus();
    }
    this.runCountdown();
    // Tell the page once per decision when its timed right runs out
    const d = this.decision;
    if (this.expired && d && this.reported !== d) {
      this.reported = d;
      this.emit("tc-expire", { decision: d });
    }
  }

  /* ---------- Rendering ---------- */

  private renderDecided(d: PermissionDecision) {
    const now = this.clockNow;
    const expired = this.expired;
    const name = this.agent.name;
    const total = d.until ? d.until - d.at : 0;
    const share = total ? Math.max(0, Math.min(1, (d.until! - now) / total)) : 0;
    const kind = expired ? "expired" : d.allow ? "allowed" : "denied";
    const headline = expired ? "Access expired" : !d.allow ? "Denied" : d.scope === "once" ? "Allowed once" : d.scope === "timed" ? `Allowed for ${span(Math.round(total / MIN))}` : "Always allowed";
    const note = expired
      ? `${name} will ask again`
      : !d.allow
        ? `${name} was told and won't do it`
        : d.scope === "timed"
          ? `${left(d.until! - now)} · until ${hhmm(d.until!)}`
          : d.scope === "once"
            ? `At ${hhmm(d.at)} · it won't carry over`
            : `${name} won't ask for this again`;
    return html`<div class="ui-pr__result" data-kind=${kind}>
      <span class="ui-pr__result-icon">${kind === "allowed" ? checkIcon() : kind === "denied" ? crossIcon() : clockIcon()}</span>
      <span class="ui-pr__result-text">
        <span class="ui-pr__result-head">${headline}<span class="ui-pr__result-action"> · ${this.action}</span></span>
        <span class="ui-pr__result-note">${note}</span>
      </span>
      <button type="button" class="ui-pr__ghost" data-focus-key="reset" @click=${this.reset}>${d.allow && !expired && d.scope !== "once" ? "Revoke" : expired ? "Ask again" : "Change"}</button>
      ${d.allow && d.scope === "timed" && !expired
        ? html`<span class="ui-pr__drain" aria-hidden="true"><span style=${styleMap({ transform: `scaleX(${share})` })}></span></span>`
        : nothing}
    </div>`;
  }

  private renderPreview() {
    const preview = this.preview;
    const shown = this.open ? preview : preview.slice(0, this.previewLimit);
    const hidden = preview.length - shown.length;
    return html`<section class="ui-pr__preview" aria-labelledby=${`${this.uid}-what`}>
      <h4 class="ui-pr__label" id=${`${this.uid}-what`}>${this.previewTitle}<span class="ui-pr__count">${preview.length}</span></h4>
      <ul class="ui-pr__list">
        ${repeat(
          shown,
          (p) => p.id,
          (p, i) => html`<li class="ui-pr__item" style=${styleMap({ animationDelay: `${i * 40}ms` })}>
            <span class="ui-pr__item-icon">${p.icon ? clone(p.icon) : dotIcon()}</span>
            <span class="ui-pr__item-label">${p.label}</span>
            ${p.meta != null ? html`<span class="ui-pr__item-meta">${typeof p.meta === "string" ? p.meta : clone(p.meta)}</span>` : nothing}
          </li>`,
        )}
      </ul>
      ${(hidden > 0 || this.open) && preview.length > this.previewLimit
        ? html`<button type="button" class="ui-pr__more" aria-expanded=${this.open ? "true" : "false"} @click=${() => (this.open = !this.open)}>${this.open ? "Show less" : `${hidden} more`}</button>`
        : nothing}
    </section>`;
  }

  private renderAsk() {
    const { agent, action, target, risk, reason, uid } = this;
    const offered = this.offered;
    const scope = this.chosenScope;
    const scopeLabel = (s: PermissionScope) => (s === "once" ? "Just once" : s === "timed" ? span(this.duration) : "Always");
    const allowLabel = scope === "once" ? "Allow once" : scope === "timed" ? `Allow for ${span(this.duration)}` : "Always allow";
    return html`<div class="ui-pr__ask">
      <div class="ui-pr__body">
        <header class="ui-pr__head">
          <span class="ui-pr__avatar" ?data-logo=${!!agent.avatar}>${agent.avatar ? clone(agent.avatar) : initials(agent.name)}</span>
          <span class="ui-pr__heading">
            <span class="ui-pr__title" id=${`${uid}-title`}><b>${agent.name}</b> wants to <b>${action}</b></span>
            ${target || agent.model
              ? html`<span class="ui-pr__sub">${this.toolIcon ? html`<span class="ui-pr__tool">${clone(this.toolIcon)}</span>` : nothing}${target ?? agent.model}</span>`
              : nothing}
          </span>
          ${risk !== "safe" ? html`<span class="ui-pr__risk" data-risk=${risk}>${risk === "risky" ? riskyIcon() : destructiveIcon()}${RISK[risk]}</span>` : nothing}
        </header>
        ${reason ? html`<p class="ui-pr__why" id=${`${uid}-why`}>${reason}</p>` : nothing}
        ${this.preview.length > 0 ? this.renderPreview() : nothing}
      </div>
      <div class="ui-pr__answer">
        ${offered.length > 1
          ? html`<div class="ui-pr__scopes" role="radiogroup" aria-label="How long">
              ${offered.map(
                (s) => html`<button
                  type="button"
                  role="radio"
                  aria-checked=${s === scope ? "true" : "false"}
                  class="ui-pr__scope"
                  data-scope=${s}
                  tabindex=${s === scope ? 0 : -1}
                  @click=${() => this.setScope(s)}
                  @keydown=${this.onScopeKey}
                >${scopeLabel(s)}</button>`,
              )}
            </div>`
          : nothing}
        ${risk === "destructive" && this.scopes.includes("always") ? html`<span class="ui-pr__hint">Destructive actions can't be allowed for always</span>` : nothing}
        <div class="ui-pr__buttons">
          <button type="button" class="ui-pr__btn" @click=${this.deny}>Deny<kbd class="ui-pr__kbd">Esc</kbd></button>
          <button type="button" class="ui-pr__btn ui-pr__btn--primary" data-focus-key="allow" @click=${this.allow}>
            ${keyed(allowLabel, html`<span class="ui-pr__btn-label">${allowLabel}</span>`)}<kbd class="ui-pr__kbd">↵</kbd>
          </button>
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const d = this.decision;
    const expired = this.expired;
    // Announced once per outcome – the countdown's minutes are not
    const announcement = d
      ? `${
          expired
            ? "Access expired"
            : !d.allow
              ? "Denied"
              : d.scope === "once"
                ? "Allowed once"
                : d.scope === "timed"
                  ? `Allowed for ${span(Math.round(((d.until ?? d.at) - d.at) / MIN))}`
                  : "Always allowed"
        }: ${this.agent.name} ${d.allow && !expired ? "may" : "may not"} ${this.action}`
      : "";
    return html`
      <span class="ui-pr__sr" role="status">${announcement}</span>
      <div
        class="ui-pr__card"
        tabindex="-1"
        role=${ifDefined(d ? undefined : "group")}
        aria-labelledby=${ifDefined(d ? undefined : `${this.uid}-title`)}
        aria-describedby=${ifDefined(d || !this.reason ? undefined : `${this.uid}-why`)}
        @keydown=${this.onKey}
      >
        ${d ? this.renderDecided(d) : this.renderAsk()}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the answer sits on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pr"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  padding: var(--tc-tray-inset);
  overflow: hidden;
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pr"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pr"] *, [data-ui="pr"] *::before, [data-ui="pr"] *::after { box-sizing: border-box; }
:where([data-ui="pr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="pr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="pr"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="pr"] h4, [data-ui="pr"] p { margin: 0; }
[data-ui="pr"] svg { display: block; flex: none; }
.ui-pr__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-pr__ask { animation: ui-pr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__card { overflow: hidden; border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* ----- Who asks for what ----- */
.ui-pr__head { display: flex; align-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__head { gap: var(--tc-space-3); padding: var(--tc-space-4) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__head { gap: var(--tc-space-2-5); padding: var(--tc-space-3-5) var(--tc-space-3-5) 0 var(--tc-space-4); }
.ui-pr__avatar { display: grid; flex: none; place-items: center; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-avatar-font-weight); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__avatar { width: 32px; height: 32px; border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__avatar[data-logo] > svg { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__avatar { width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__avatar[data-logo] > svg { width: 16px; height: 16px; }
.ui-pr__heading { display: grid; flex: 1; min-width: 0; }
.ui-pr__title b { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__title { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__title b { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__title { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__title b { color: var(--tc-text-strong); }
.ui-pr__sub { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-pr__tool { display: grid; flex: none; place-items: center; width: 12px; height: 12px; }
.ui-pr__tool > svg { width: 12px; height: 12px; }
/* Risk: a header pill – glyph and word on a status tone */
.ui-pr__risk { display: inline-flex; flex: none; align-self: start; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); margin-top: 1px; padding: 0 var(--tc-pill-px-lg) 0 calc(var(--tc-pill-px-lg) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-pr__risk[data-risk="destructive"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The agent's reason: a quiet line with a rule on the left */
.ui-pr__why { padding-left: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__why { margin: var(--tc-space-3) var(--tc-space-4) 0 60px !important; border-left: 2px solid var(--tc-border-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__why { margin: var(--tc-space-3) var(--tc-space-4) 0 54px !important; border-left: 2px solid var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* ----- What will happen ----- */
.ui-pr__preview { margin-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__preview { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__preview { padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-1); }
.ui-pr__label { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__label { margin: 0 var(--tc-space-2) var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__label { margin: 0 var(--tc-space-1-5) var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); }
/* The count: a badge */
.ui-pr__count { display: grid; place-items: center; border-radius: var(--tc-radius-badge); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__count { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__count { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-pr__list { display: grid; }
.ui-pr__item { display: flex; align-items: center; gap: var(--tc-space-2-5); animation: ui-pr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item { min-height: 32px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__item { min-height: 30px; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); }
.ui-pr__item-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item-icon { color: var(--tc-text-muted); }
.ui-pr__item-icon > svg { width: 16px; height: 16px; }
.ui-pr__item-label { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item-label { font-size: var(--tc-font-size-md); }
.ui-pr__item-meta { flex: none; color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item-meta { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__item-meta { font-size: var(--tc-font-size-sm); }
.ui-pr__more { padding: var(--tc-space-0-5) 0; color: var(--tc-text-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__more { margin: 0 0 var(--tc-space-1-5) 34px; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__more { margin: 0 0 var(--tc-space-1) var(--tc-space-8); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-pr__more:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__body:not(:has(.ui-pr__preview)) { padding-bottom: var(--tc-space-4); }
/* Without a preview the answer sits a little below the heading or the reason */
:where([data-look="clean"], [data-look="clean"] *).ui-pr__body:not(:has(.ui-pr__preview)) { padding-bottom: var(--tc-space-3-5); }
/* ----- How long, and the answer ----- */
.ui-pr__answer { display: grid; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__answer { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__answer { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* How long – Standard: a segmented track, the chosen one raised in white; Clean: separate chips. The chosen one also
   carries a ring in the selected colour, so it doesn't rely on a faint fill */
.ui-pr__scope { flex: 1; font-weight: var(--tc-font-weight-medium); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-pr__scope[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-pr__scope[aria-checked="false"]:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scopes { display: flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope { height: var(--tc-control-h-md); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scopes { display: flex; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope { padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope[aria-checked="false"]:hover { background: var(--tc-fill-strong); }
.ui-pr__hint { line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__hint { margin: -6px var(--tc-space-1) 0; font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__hint { margin-top: -6px; font-size: var(--tc-font-size-xs); }
.ui-pr__buttons { display: flex; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__buttons { justify-content: flex-end; }
/* Deny and Allow: Button's secondary and primary recipes (Standard large, Clean medium) */
.ui-pr__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-pr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__btn { flex: 1; height: var(--tc-control-h-lg); padding: 0 var(--tc-control-px-lg); border-radius: var(--tc-control-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__btn { height: var(--tc-control-h-md); padding: 0 calc(var(--tc-control-px-md) - 2px) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-pr__btn:active { transform: scale(0.98); }
.ui-pr__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-pr__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-pr__btn--primary:active { background: var(--tc-action-primary-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__btn--primary { flex: 1.4; }
[data-ui="pr"][data-risk="destructive"] .ui-pr__btn--primary { background: var(--tc-status-danger-fg); color: var(--tc-text-on-inverse); }
.ui-pr__btn-label { animation: ui-pr-swap var(--tc-duration-base) var(--tc-ease-move) both; }
/* Key hints: the kbd chip; inside the primary button it sits on the ink */
.ui-pr__kbd { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: 1; color: var(--tc-kbd-fg); }
.ui-pr__btn--primary .ui-pr__kbd { background: var(--tc-kbd-on-inverse-bg); box-shadow: none; color: inherit; }
/* ----- The decided line: a white card ----- */
.ui-pr__result { position: relative; display: flex; align-items: center; padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result { gap: var(--tc-space-3); min-height: 60px; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); animation: ui-pr-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result { gap: var(--tc-space-2-5); min-height: 56px; animation: ui-pr-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-pr__result-icon { display: grid; flex: none; place-items: center; animation: ui-pr-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-icon { width: 18px; height: 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-icon > svg { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result-icon { width: 16px; height: 16px; }
.ui-pr__result[data-kind="allowed"] .ui-pr__result-icon { color: var(--tc-status-success-fg); }
.ui-pr__result[data-kind="denied"] .ui-pr__result-icon { color: var(--tc-status-danger-fg); }
.ui-pr__result[data-kind="expired"] .ui-pr__result-icon { color: var(--tc-text-muted); }
.ui-pr__result-text { display: grid; flex: 1; min-width: 0; }
.ui-pr__result-head { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-head { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result-head { color: var(--tc-text-strong); }
.ui-pr__result-action { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-pr__result-note { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Revoke / Change: Standard's secondary button, Clean's ghost button */
.ui-pr__ghost { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__ghost { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__ghost:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__ghost { color: var(--tc-action-ghost-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* The time left: a thin bar along the bottom that drains until the right runs out */
.ui-pr__drain { position: absolute; right: 0; bottom: 0; left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__drain { height: 3px; background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__drain { height: 2px; background: var(--tc-fill-subtle); }
.ui-pr__drain > span { display: block; height: 100%; background: var(--tc-status-success-fg); transform-origin: left; transition: transform var(--tc-duration-reveal-slow) linear; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__drain > span { opacity: 0.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__drain > span { opacity: 0.7; }
@keyframes ui-pr-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-pr-swap { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-pr-pop { 0% { opacity: 0; transform: scale(0.5); } 60% { opacity: 1; transform: scale(1.12); } }
/* Narrow containers: the reason loses its indent, no keyboard hints */
@container (max-width: 360px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pr__why { margin-left: var(--tc-space-4) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope { padding: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__kbd { display: none; }
}
/* Narrow containers: the reason loses its indent, the buttons share the width */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pr__why { margin-left: var(--tc-space-4) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scopes { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope { padding: var(--tc-space-1) var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__buttons > .ui-pr__btn { flex: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__kbd { display: none; }
}
@media (hover: none) {
  .ui-pr__kbd { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope { height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__btn { height: 46px; }
.ui-pr__ghost { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope { padding: var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__btn { height: 40px; padding: 0 var(--tc-space-4); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pr"] *, [data-ui="pr"] *::before, [data-ui="pr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-permission-request")) customElements.define("tc-permission-request", TcPermissionRequest);

declare global {
  interface HTMLElementTagNameMap {
    "tc-permission-request": TcPermissionRequest;
  }
}
