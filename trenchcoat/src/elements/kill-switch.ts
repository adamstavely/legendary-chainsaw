import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-kill-switch> – system posture and the emergency stop. The header says how things stand – normal, elevated or
 * stopped – and lists what's running. Stop (for one item) or Stop everything opens a confirmation that names exactly
 * what it halts and takes an optional reason; confirming adds an active stop, which Resume lifts. The element changes
 * nothing by itself: tc-stop and tc-resume tell the app, which halts and resumes the real work.
 *   · the confirmation is a modal dialog: focus moves to Cancel, Tab and Shift+Tab stay inside it, Escape cancels, and
 *     focus returns to the button that opened it (or the new stop's Resume when that button is gone)
 *   · posture follows the active stops unless the app sets it: a stop on everything → stopped, any stop → elevated
 * Standard: the header on a gray tray, then a white card, then Stop everything on the tray. Clean: one white card – the
 * header is its first row, the button its last.
 *
 *   <tc-kill-switch .running=${running} .stops=${stops}></tc-kill-switch>
 */

export type KillPosture = "normal" | "elevated" | "stopped";
/** Something a stop can halt: an agent, a schedule, a queue */
export type KillRunning = {
  id: string;
  label: string;
  /** A quiet line, e.g. "3 runs in progress" */
  detail?: string;
  /** A small tag, e.g. "Agent" or "Schedule" */
  kind?: string;
};
/** An active stop. `target` is "all" or a running item's id */
export type KillStop = {
  id: string;
  target: string;
  /** What it halts, e.g. "Everything" or "Billing agent" */
  label: string;
  reason?: string;
  /** Who stopped it */
  by?: string;
  /** When: a Date or epoch ms (shown as a time of day), or text as it is */
  at?: Date | number | string;
};

/** Details of the events */
export type KillStopEvent = { stop: KillStop; halts: KillRunning[]; stops: KillStop[] };
export type KillResumeEvent = { stop: KillStop; stops: KillStop[] };

/** The postures' names used when the page gives none */
export const defaultKillPostureLabels: Record<KillPosture, string> = { normal: "Normal", elevated: "Elevated", stopped: "Stopped" };
const POSTURE_LINE: Record<KillPosture, string> = {
  normal: "Everything is running normally.",
  elevated: "Some work is stopped.",
  stopped: "Everything is stopped.",
};
const ALL = "all";
const TIME = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const when = (at: KillStop["at"]) => (at === undefined || at === "" ? "" : typeof at === "string" ? at : TIME.format(at));
let uidCount = 0;

/* Octagon-x, play, power (the header): Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const octagon = (size: number) =>
  lucide(size, svg`<path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`);
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);

/**
 * System posture and the emergency stop: what's running, a confirmed Stop that names what it halts, and the active
 * stops with Resume.
 * @tag tc-kill-switch
 * @fires tc-stop - A stop was confirmed ({ stop, halts, stops }: KillStopEvent – `stops` is the list with it added); cancelable – prevented, `stops` stays as it was
 * @fires tc-resume - Resume was pressed on an active stop ({ stop, stops }: KillResumeEvent – `stops` is the list without it); cancelable – prevented, `stops` stays as it was
 */
export class TcKillSwitch extends TcElement {
  static override ui = "ks";

  /** The heading */
  @property() accessor heading = "Emergency stop";
  /** The posture; unset follows the stops – a stop on everything is "stopped", any other stop "elevated" */
  @property() accessor posture: KillPosture | undefined = undefined;
  /** The line under the heading; unset says what the posture means */
  @property({ attribute: "posture-note" }) accessor postureNote: string | undefined = undefined;
  /** What a stop can halt */
  @property({ attribute: false }) accessor running: KillRunning[] = [];
  /** The active stops. Changed by the user unless a tc-stop or tc-resume listener calls preventDefault() */
  @property({ attribute: false }) accessor stops: KillStop[] = [];
  /** The postures' names, merged over the defaults (Normal, Elevated, Stopped) */
  @property({ attribute: false }) accessor postureLabels: Partial<Record<KillPosture, string>> = {};
  /** Who a stop made here is by */
  @property() accessor you = "You";
  /** The big button's text */
  @property({ attribute: "stop-all-label" }) accessor stopAllLabel = "Stop everything";
  /** One running item's Stop button */
  @property({ attribute: "stop-label" }) accessor stopLabel = "Stop";
  /** An active stop's Resume button */
  @property({ attribute: "resume-label" }) accessor resumeLabel = "Resume";
  /** The confirmation's Cancel button */
  @property({ attribute: "cancel-label" }) accessor cancelLabel = "Cancel";
  /** What a stop does, said in the confirmation and next to Stop everything */
  @property({ attribute: "stop-note" }) accessor stopNote = "Work in progress halts at its next step. Nothing is undone.";
  /** The reason field's label in the confirmation */
  @property({ attribute: "reason-label" }) accessor reasonLabel = "Reason";
  /** The confirmation needs a reason before Stop can be pressed */
  @property({ type: Boolean, attribute: "require-reason" }) accessor requireReason = false;

  /** What the open confirmation would stop: "all", a running id, or null when it's closed */
  @state() private accessor confirming: string | null = null;
  @state() private accessor reason = "";
  @state() private accessor reasonMissing = false;
  @state() private accessor announce = "";

  private uid = `tc-ks-${++uidCount}`;
  private stopCount = 0;
  private opener: HTMLElement | null = null;

  constructor() {
    super();
    // Focus never drops to <body> when the button it was on goes away (a Resume, or a Stop that became "Stopped")
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-ks__resume, .ui-ks__stop-all:not([aria-disabled='true']), .ui-ks__stop"));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  /* ---------- The model ---------- */

  private label(p: KillPosture) {
    return this.postureLabels[p] ?? defaultKillPostureLabels[p];
  }
  private get resolvedPosture(): KillPosture {
    return this.posture ?? (this.stops.some((s) => s.target === ALL) ? "stopped" : this.stops.length ? "elevated" : "normal");
  }
  private get allStopped() {
    return this.stops.some((s) => s.target === ALL);
  }
  private stopFor(id: string) {
    return this.stops.find((s) => s.target === ALL || s.target === id);
  }
  /** What a stop on `target` would halt: everything still running, or the one item */
  private halts(target: string) {
    return target === ALL ? this.running.filter((r) => !this.stopFor(r.id)) : this.running.filter((r) => r.id === target);
  }
  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-ks__dialog");
  }

  /* ---------- The confirmation ---------- */

  private ask(target: string, opener: HTMLElement) {
    if (target === ALL ? this.allStopped : this.stopFor(target)) return;
    this.opener = opener;
    this.reason = "";
    this.reasonMissing = false;
    this.confirming = target;
    void this.updateComplete.then(() => {
      const d = this.dialogEl;
      if (!d) return;
      if (!d.open) {
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
      }
      d.querySelector<HTMLElement>(".ui-ks__cancel")?.focus();
    });
  }

  private close(focus: HTMLElement | null = this.opener) {
    if (this.confirming === null) return;
    const d = this.dialogEl;
    if (d?.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    this.confirming = null;
    this.opener = null;
    void this.updateComplete.then(() => (focus?.isConnected ? focus : this.querySelector<HTMLElement>(".ui-ks__stop-all"))?.focus());
  }

  private confirm() {
    const target = this.confirming;
    if (target === null) return;
    const reason = this.reason.trim();
    if (this.requireReason && !reason) {
      this.reasonMissing = true;
      this.querySelector<HTMLTextAreaElement>(".ui-ks__reason")?.focus();
      return;
    }
    const item = this.running.find((r) => r.id === target);
    const stop: KillStop = { id: `${this.uid}-stop-${++this.stopCount}`, target, label: target === ALL ? "Everything" : (item?.label ?? target), by: this.you, ...(reason ? { reason } : {}) };
    // A stop on everything goes first; the single stops stay, so they still hold after everything resumes
    const stops = target === ALL ? [stop, ...this.stops] : [...this.stops, stop];
    const halts = this.halts(target);
    if (!this.emit<KillStopEvent>("tc-stop", { stop, halts, stops }, { cancelable: true })) {
      this.close();
      return;
    }
    this.stops = stops;
    this.announce = `Stopped: ${stop.label}`;
    // The Stop button that opened it is gone (the row now says Stopped): focus the new stop's Resume instead
    const opener = this.opener;
    this.close(null);
    void this.updateComplete.then(() => {
      const keep = opener?.isConnected && opener.getAttribute("aria-disabled") !== "true" && !opener.hidden ? opener : null;
      (keep ?? this.querySelector<HTMLElement>(`[data-focus-key="resume:${CSS.escape(stop.id)}"]`))?.focus();
    });
  }

  private resume(stop: KillStop) {
    const stops = this.stops.filter((s) => s !== stop);
    if (!this.emit<KillResumeEvent>("tc-resume", { stop, stops }, { cancelable: true })) return;
    // Focus moves to the next stop's Resume, else back to what can be stopped
    const list = this.stops;
    const i = list.indexOf(stop);
    const next = list[i + 1] ?? list[i - 1];
    this.stops = stops;
    this.announce = `Resumed: ${stop.label}`;
    void this.updateComplete.then(() => {
      const target =
        (next && this.querySelector<HTMLElement>(`[data-focus-key="resume:${CSS.escape(next.id)}"]`)) ||
        (stop.target !== ALL && this.querySelector<HTMLElement>(`[data-focus-key="stop:${CSS.escape(stop.target)}"]`)) ||
        this.querySelector<HTMLElement>(".ui-ks__stop-all");
      target?.focus();
    });
  }

  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== "Tab") return;
    // Tab and Shift+Tab stay inside the dialog
    const items = [...(this.dialogEl?.querySelectorAll<HTMLElement>("button, textarea, [href]") ?? [])].filter((el) => !el.hasAttribute("disabled"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !this.dialogEl?.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.dataset.posture = this.resolvedPosture;
  }

  /* ---------- Rendering ---------- */

  private renderRunning() {
    const id = this.uid;
    if (!this.running.length) return html`<p class="ui-ks__none">Nothing is running.</p>`;
    return html`<section class="ui-ks__section" aria-labelledby=${`${id}-running`}>
      <h4 class="ui-ks__label" id=${`${id}-running`}>Running<span class="ui-ks__count">${this.running.filter((r) => !this.stopFor(r.id)).length}</span></h4>
      <ul class="ui-ks__list">
        ${repeat(
          this.running,
          (r) => r.id,
          (r) => {
            const stopped = !!this.stopFor(r.id);
            return html`<li class="ui-ks__item" ?data-stopped=${stopped}>
              <span class="ui-ks__dot" aria-hidden="true"></span>
              <span class="ui-ks__item-text">
                <span class="ui-ks__item-name">${r.label}${r.kind ? html`<span class="ui-ks__kind">${r.kind}</span>` : nothing}</span>
                ${r.detail ? html`<span class="ui-ks__item-detail">${r.detail}</span>` : nothing}
              </span>
              ${stopped
                ? html`<span class="ui-ks__stopped">Stopped</span>`
                : html`<button
                    type="button"
                    class="ui-ks__btn ui-ks__btn--ghost ui-ks__stop"
                    data-focus-key=${`stop:${r.id}`}
                    aria-haspopup="dialog"
                    aria-label=${`${this.stopLabel} ${r.label}`}
                    @click=${(e: Event) => this.ask(r.id, e.currentTarget as HTMLElement)}
                  >${this.stopLabel}</button>`}
            </li>`;
          },
        )}
      </ul>
    </section>`;
  }

  private renderStops() {
    if (!this.stops.length) return nothing;
    const id = this.uid;
    return html`<section class="ui-ks__section ui-ks__section--stops" aria-labelledby=${`${id}-stops`}>
      <h4 class="ui-ks__label" id=${`${id}-stops`}>Active stops<span class="ui-ks__count">${this.stops.length}</span></h4>
      <ul class="ui-ks__list">
        ${repeat(
          this.stops,
          (s) => s.id,
          (s) => {
            const meta = [s.by ? `By ${s.by === this.you ? this.you.toLowerCase() : s.by}` : "", when(s.at), s.reason ?? ""].filter(Boolean);
            return html`<li class="ui-ks__item ui-ks__stop-row" data-target=${s.target === ALL ? "all" : "one"}>
              <span class="ui-ks__stop-icon" aria-hidden="true">${octagon(14)}</span>
              <span class="ui-ks__item-text">
                <span class="ui-ks__item-name">${s.label}</span>
                ${meta.length ? html`<span class="ui-ks__item-detail">${meta.join(" · ")}</span>` : nothing}
              </span>
              <button type="button" class="ui-ks__btn ui-ks__btn--secondary ui-ks__resume" data-focus-key=${`resume:${s.id}`} aria-label=${`${this.resumeLabel} ${s.label}`} @click=${() => this.resume(s)}>
                ${playIcon()}${this.resumeLabel}
              </button>
            </li>`;
          },
        )}
      </ul>
    </section>`;
  }

  private renderDialog() {
    const target = this.confirming;
    const id = this.uid;
    const halts = target === null ? [] : this.halts(target);
    const name = target === null ? "" : target === ALL ? "everything" : (this.running.find((r) => r.id === target)?.label ?? target);
    return html`<dialog
      class="ui-ks__dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby=${`${id}-dlg-title`}
      aria-describedby=${`${id}-dlg-desc`}
      @keydown=${this.onDialogKey}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.close();
      }}
    >
      ${target === null
        ? nothing
        : html`<div class="ui-ks__dlg">
            <div class="ui-ks__dlg-head">
              <span class="ui-ks__dlg-icon" aria-hidden="true">${octagon(18)}</span>
              <h3 class="ui-ks__dlg-title" id=${`${id}-dlg-title`}>Stop ${name}?</h3>
            </div>
            <div id=${`${id}-dlg-desc`} class="ui-ks__dlg-desc">
              <p class="ui-ks__dlg-lead">${halts.length ? `This halts ${halts.length === 1 ? "1 item" : `${halts.length} items`}:` : "Nothing is running right now; new work won't start."}</p>
              ${halts.length
                ? html`<ul class="ui-ks__halts">
                    ${halts.map((r) => html`<li class="ui-ks__halt"><span class="ui-ks__halt-name">${r.label}</span>${r.detail ? html`<span class="ui-ks__halt-detail">${r.detail}</span>` : nothing}</li>`)}
                  </ul>`
                : nothing}
              <p class="ui-ks__dlg-note">${this.stopNote}</p>
            </div>
            <div class="ui-ks__field">
              <label class="ui-ks__field-label" for=${`${id}-reason`}>${this.reasonLabel}${this.requireReason ? nothing : html`<span class="ui-ks__optional"> · optional</span>`}</label>
              <textarea
                id=${`${id}-reason`}
                class="ui-ks__reason"
                rows="2"
                .value=${this.reason}
                ?required=${this.requireReason}
                aria-invalid=${this.reasonMissing ? "true" : "false"}
                aria-describedby=${ifDefined(this.reasonMissing ? `${id}-reason-missing` : undefined)}
                @input=${(e: Event) => {
                  this.reason = (e.target as HTMLTextAreaElement).value;
                  if (this.reason.trim()) this.reasonMissing = false;
                }}
              ></textarea>
              ${this.reasonMissing ? html`<p class="ui-ks__invalid" id=${`${id}-reason-missing`}>Say why, so others know when it's safe to resume.</p>` : nothing}
            </div>
            <div class="ui-ks__dlg-actions">
              <button type="button" class="ui-ks__btn ui-ks__btn--secondary ui-ks__cancel" @click=${() => this.close()}>${this.cancelLabel}</button>
              <button type="button" class="ui-ks__btn ui-ks__btn--danger ui-ks__confirm" @click=${() => this.confirm()}>${octagon(14)}Stop ${target === ALL ? "everything" : name}</button>
            </div>
          </div>`}
    </dialog>`;
  }

  protected override render() {
    const posture = this.resolvedPosture;
    const id = this.uid;
    const canStopAll = !this.allStopped;
    return html`
      <span class="ui-ks__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: svg`<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>`,
        title: this.heading,
        id: `${id}-title`,
        subtitle: this.postureNote ?? POSTURE_LINE[posture],
        aside: html`<span class="ui-ks__posture" data-posture=${posture}><span class="ui-ks__sr">Posture: </span><span class="ui-ks__posture-dot" aria-hidden="true"></span>${this.label(posture)}</span>`,
      })}
      <div class="ui-ks__card">
        ${this.renderStops()} ${this.renderRunning()}
      </div>
      <div class="ui-ks__foot">
        <p class="ui-ks__foot-note">${this.stopNote}</p>
        <button
          type="button"
          class="ui-ks__btn ui-ks__btn--danger ui-ks__stop-all"
          aria-haspopup="dialog"
          aria-disabled=${canStopAll ? "false" : "true"}
          @click=${(e: Event) => canStopAll && this.ask(ALL, e.currentTarget as HTMLElement)}
        >${octagon(16)}${this.stopAllLabel}</button>
      </div>
      ${this.renderDialog()}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; Stop everything sits on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ks"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card; the button is its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ks"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ks"] *, [data-ui="ks"] *::before, [data-ui="ks"] *::after { box-sizing: border-box; }
:where([data-ui="ks"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ks"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ks"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="ks"] h3, [data-ui="ks"] h4, [data-ui="ks"] p { margin: 0; }
[data-ui="ks"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ks"] svg[stroke-width] { stroke-width: 1.5; }
.ui-ks__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ks__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Posture ----- */
/* The posture pill, in the header's aside */
.ui-ks__posture { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); white-space: nowrap; }
.ui-ks__posture-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-ks__posture[data-posture="normal"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-ks__posture[data-posture="elevated"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-ks__posture[data-posture="stopped"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* ----- Running and the active stops ----- */
.ui-ks__section { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Standard: the card's first part needs no divider above it */
.ui-ks__card > :first-child { border-top: 0; }
.ui-ks__label { display: flex; align-items: center; gap: var(--tc-space-1-5); margin: 0 var(--tc-space-2) var(--tc-space-1) !important; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ks__label { font-weight: var(--tc-font-weight-medium); }
.ui-ks__count { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-ks__list { display: grid; }
.ui-ks__item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-3); min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-2); }
.ui-ks__item + .ui-ks__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ks__dot { width: 8px; height: 8px; margin: 0 var(--tc-space-1); border-radius: 50%; background: var(--tc-status-success-solid); box-shadow: 0 0 0 3px var(--tc-status-success-bg); }
.ui-ks__item[data-stopped] .ui-ks__dot { background: var(--tc-status-danger-solid); box-shadow: 0 0 0 3px var(--tc-status-danger-bg); }
.ui-ks__item-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ks__item-name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); min-width: 0; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-ks__item[data-stopped] .ui-ks__item-name { color: var(--tc-text-secondary); }
.ui-ks__item-detail { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; }
.ui-ks__kind { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-ks__stopped { padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-danger-fg); }
.ui-ks__stop-icon { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-md); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-ks__stop-row { animation: ui-ks-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-ks__none { padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }
/* ----- Buttons: secondary, ghost and danger, medium ----- */
.ui-ks__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-ks__btn:active { transform: scale(0.98); }
.ui-ks__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-ks__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ks__btn--ghost { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-status-danger-fg); }
.ui-ks__btn--ghost:hover { background: var(--tc-status-danger-bg); }
/* The emergency stop: the danger action fill */
.ui-ks__btn--danger { background: var(--tc-action-danger-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-danger-fg); }
.ui-ks__btn--danger:hover { background: var(--tc-action-danger-bg-hover); }
.ui-ks__btn--danger[aria-disabled="true"] { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; transform: none; }
.ui-ks__resume { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); }
.ui-ks__resume > svg { color: var(--tc-status-success-fg); }
/* ----- Stop everything ----- */
.ui-ks__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ks__foot { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-ks__foot { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ks__foot-note { flex: 1 1 14rem; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- The confirmation ----- */
.ui-ks__dialog { width: min(440px, calc(100vw - 2 * var(--tc-space-4))); max-height: calc(100vh - 2 * var(--tc-space-4)); margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-ks__dialog:not([open]) { display: none; }
.ui-ks__dialog::backdrop { background: var(--tc-scrim); }
.ui-ks__dialog[open] { animation: ui-ks-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-ks__dlg { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-5); }
.ui-ks__dlg-head { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-ks__dlg-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-ks__dlg-title { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); color: var(--tc-title-color); }
.ui-ks__dlg-desc { display: grid; gap: var(--tc-space-2); }
.ui-ks__dlg-lead { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-ks__halts { display: grid; max-height: 12rem; overflow: auto; padding: var(--tc-space-1) var(--tc-space-3) !important; border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-ks__halt { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0 var(--tc-space-3); padding: var(--tc-space-1-5) 0; }
.ui-ks__halt + .ui-ks__halt { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ks__halt-name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-ks__halt-detail { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-ks__dlg-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-ks__field { display: grid; gap: var(--tc-space-1-5); }
.ui-ks__field-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
.ui-ks__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-ks__reason { width: 100%; min-height: calc(var(--tc-field-h) * 1.75); margin: 0; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-snug); resize: vertical; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ks__reason:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ks__reason:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-ks__reason[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-ks__invalid { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
.ui-ks__dlg-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
@keyframes ui-ks-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-ks-pop { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
@container (max-width: 400px) {
  .ui-ks__foot .ui-ks__btn { flex: 1 1 100%; }
}
@media (max-width: 400px) {
  .ui-ks__dlg { padding: var(--tc-space-4); }
  .ui-ks__dlg-actions > .ui-ks__btn { flex: 1 1 0; }
}
@media (pointer: coarse) {
  .ui-ks__btn { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ks"] *, [data-ui="ks"] *::before, [data-ui="ks"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-kill-switch")) customElements.define("tc-kill-switch", TcKillSwitch);

declare global {
  interface HTMLElementTagNameMap {
    "tc-kill-switch": TcKillSwitch;
  }
}
