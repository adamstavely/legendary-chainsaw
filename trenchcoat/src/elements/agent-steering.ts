import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OnScreenController, rescueFocus } from "./internal/controllers";

/*
 * <tc-agent-steering> – the Lit port of src/components/agent-steering.tsx: steer an agent while it works, without
 * stopping it. A white card on a soft gray tray: the run on top (title, model, a live clock, Pause) and the plan
 * below it – done steps, the active step with a spinner and its own clock, the steps still to come. Under the card:
 * the queued notes and the field, "Steer the agent…".
 *   · ↵ queues a note for the next step (`onQueue`)
 *   · when the agent takes a note in (moves it from `queue` to a step's `notes`), the card glides up into the plan
 *   · ⌘↵ (or "Now" on a queued note) interrupts: `onInterrupt`, the note goes to the active step right away
 * Clean is one white card: the queued notes and the field sit inside it, at the bottom.
 *
 *   <tc-agent-steering heading="Migrate users table" agent="Opus 5.5" .steps=${steps} .queue=${queue}
 *     .onQueue=${(text) => …}></tc-agent-steering>
 *
 * The clocks are painted straight into their text by a 10 Hz ticker that rests off screen and in hidden tabs – the
 * element never re-renders per tick.
 */

export type SteerNote = {
  id: string;
  text: string;
  /** Set when the agent took the note in – shows "Picked up" (or "Interrupted" when it was applied right away) */
  picked?: "next" | "now";
};
export type SteerStepStatus = "done" | "active" | "pending";
export type SteerStep = {
  id: string;
  title: string;
  status?: SteerStepStatus;
  /** Time the step took in ms – shown on done steps */
  duration?: number;
  /** When the active step started – its clock ticks from here */
  startedAt?: number | Date;
  /** Notes the agent took in for this step – a note that leaves the queue and shows up here glides over */
  notes?: SteerNote[];
};
export type SteerRunStatus = "running" | "paused" | "done";
/** A send handler: may return a promise – the field waits, and if it rejects the text comes back */
export type SteerSend = (text: string, queuedId?: string) => void | Promise<unknown>;

/* ---------- Helpers ---------- */

const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (time: number) => {
  const s = Math.max(0, Math.floor(time / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${pad(s % 60)}s`;
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};
const seconds = (time: number) => `${(Math.max(0, time) / 1000).toFixed(1)}s`;
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
const runLabel = (status: SteerRunStatus, runTime: number) => (status === "done" ? `Done in ${clock(runTime)}` : status === "paused" ? "Paused" : `Running · ${clock(runTime)}`);
let uidSeq = 0;

/* ---------- Icons ---------- */

// The header icon: a steering wheel
const steerIcon = svg`<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="2.5"></circle><path d="M12 14.5V21M9.6 11.2 3.3 9.8M14.4 11.2l6.3-1.4"></path>`;
const stepIcon = (status: SteerStepStatus) =>
  html`<span class="ui-st__step-icon" data-status=${status} aria-hidden="true">${status === "done"
    ? html`<svg width="16" height="16" viewBox="0 0 16 16">${svg`<circle cx="8" cy="8" r="6.5" fill="currentColor"></circle><path d="m5.4 8.2 1.8 1.8 3.4-3.7" fill="none" stroke="currentColor" class="ui-st__step-check" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`
    : status === "active"
      ? html`<svg width="16" height="16" viewBox="0 0 16 16">${svg`<circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.6"></circle><path d="M8 2.2a5.8 5.8 0 0 1 5.8 5.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>`}</svg>`
      : html`<svg width="16" height="16" viewBox="0 0 16 16">${svg`<circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2.2"></circle>`}</svg>`}</span>`;
const pauseIcon = html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${svg`<rect x="4.2" y="3.4" width="2.6" height="9.2" rx="0.9" fill="currentColor"></rect><rect x="9.2" y="3.4" width="2.6" height="9.2" rx="0.9" fill="currentColor"></rect>`}</svg>`;
const playIcon = html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M5 3.6v8.8c0 .6.6.9 1.1.6l6.6-4.4a.7.7 0 0 0 0-1.2L6.1 3c-.5-.3-1.1 0-1.1.6Z" fill="currentColor"></path>`}</svg>`;
const boltIcon = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="M6.9 1 2.6 6.6h3l-.5 4.4 4.3-5.6h-3L6.9 1Z" fill="currentColor"></path>`}</svg>`;
const closeIcon = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="m3.4 3.4 5.2 5.2M8.6 3.4 3.4 8.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const arrowUpIcon = html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 12.6V3.6M4.2 7.2 8 3.4l3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const checkIcon = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="m2.8 6.2 2 2 4.4-4.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const cornerIcon = html`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="M3 2.4v3.4c0 .9.7 1.6 1.6 1.6h4.6M7.6 5.6l1.8 1.8-1.8 1.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

/**
 * Steer an agent while it works: the run, its plan, the queued notes and a field to add one.
 * @tag tc-agent-steering
 * @fires tc-draft-change - The text in the field changed; detail `{ draft: string }`. Cancelable: preventDefault() keeps `draft` as it is (controlled use)
 * @fires tc-remove - ✕ on a queued note; detail `{ id: string }`
 * @fires tc-pause - Pause was pressed; detail: null
 * @fires tc-resume - Resume was pressed; detail: null
 */
export class TcAgentSteering extends TcElement {
  static override ui = "st";

  /** What the agent is working on, e.g. "Migrate users table" */
  @property() accessor heading = "";
  /** Name of the agent or model, e.g. "Opus 5.5" */
  @property() accessor agent = "";
  /** The plan: done steps, the active one and the steps still to come, in order */
  @property({ attribute: false }) accessor steps: SteerStep[] = [];
  /** Notes waiting for the next step, oldest first */
  @property({ attribute: false }) accessor queue: SteerNote[] = [];
  /** Where the run is: "running", "paused" or "done" – done disables the field */
  @property() accessor status: SteerRunStatus = "running";
  /** When the run started (epoch ms or a Date) – the clock in the header ticks from here */
  @property({ attribute: false }) accessor startedAt: number | Date | undefined = undefined;
  /** The text in the field */
  @property() accessor draft = "";
  /** Placeholder of the field while the run is open */
  @property() accessor placeholder = "Steer the agent…";
  /** ↵ in the field: queue this note for the next step. May return a promise (see SteerSend) */
  @property({ attribute: false }) accessor onQueue: SteerSend | undefined = undefined;
  /** ⌘↵ in the field, or "Now" on a queued note (then with its id): apply it to the active step right away. Unset
   *  hides "Now" and the hint */
  @property({ attribute: false }) accessor onInterrupt: SteerSend | undefined = undefined;
  /** Shows ✕ on the queued notes (tc-remove) */
  @property({ type: Boolean }) accessor removable = false;
  /** Shows Pause in the header while running (tc-pause) */
  @property({ type: Boolean }) accessor pausable = false;
  /** Shows Resume in the header while paused (tc-resume) */
  @property({ type: Boolean }) accessor resumable = false;

  /** @internal What screen readers hear: queued, interrupting, picked up, couldn't send */
  @state() accessor announce = "";
  /** @internal A note on its way (the send button waits), or one that didn't go through */
  @state() accessor sending: "pending" | "error" | null = null;
  /** @internal */
  @state() accessor mac = false;

  private uid = `tc-st-${++uidSeq}`;
  private screen = new OnScreenController(this);
  private firstSeen: number | null = null;
  private activeSince = new Map<string, number>();
  private ticker = 0;
  private placesBefore = new Map<string, { left: number; top: number }>();
  private boxHeight = 0;
  private lastShape: string | null = null;
  private queues = { now: [] as string[], before: [] as string[] };
  private seenPicked: Set<string> | null = null;

  constructor() {
    super();
    // Focus never falls to <body> when a queued note goes (Now, ✕) or the run ends: the same button on the next
    // note, else the one before, else the field, else Pause/Resume, else the card
    new FocusRescueController(this, (key) => {
      const field = this.field;
      const m = key?.match(/^(now|x):(.*)$/);
      if (m) {
        const was = this.queues.before;
        const at = was.indexOf(m[2]);
        const left = new Set(this.queue.map((n) => n.id));
        const order = [...was.slice(at + 1), ...was.slice(0, Math.max(0, at)).reverse()].filter((id) => left.has(id));
        for (const id of order) {
          const el = this.querySelector(`[data-focus-key="${CSS.escape(`${m[1]}:${id}`)}"]`) ?? this.querySelector(`[data-focus-key="${CSS.escape(`x:${id}`)}"]`);
          if (el) return el;
        }
      }
      return field && !field.disabled ? field : this.querySelector(".ui-st__icon-btn");
    });
  }

  private get field() {
    return this.querySelector<HTMLTextAreaElement>(".ui-st__field > textarea");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.firstSeen ??= Date.now();
    this.mac = isMac();
    window.addEventListener("resize", this.onResize);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.onResize);
    clearInterval(this.ticker);
    this.ticker = 0;
  }

  /* ---------- The clocks ---------- */

  private times(now: number) {
    return {
      runTime: now - (this.startedAt !== undefined ? ms(this.startedAt) : (this.firstSeen ?? now)),
      stepTime: (s: SteerStep) => now - (s.startedAt !== undefined ? ms(s.startedAt) : (this.activeSince.get(s.id) ?? now)),
    };
  }

  private paint = () => {
    const { runTime, stepTime } = this.times(Date.now());
    const label = runLabel(this.status, runTime);
    // The status shows in the header's right side, or under the title in narrow containers – both tick
    for (const stateEl of this.querySelectorAll(".ui-st__state")) {
      const text = [...stateEl.childNodes].reverse().find((n) => n.nodeType === 3);
      if (text && text.nodeValue !== label) text.nodeValue = label;
    }
    if (this.status !== "running") return;
    for (const s of this.steps) {
      if (s.status !== "active") continue;
      const el = this.querySelector<HTMLElement>(`.ui-st__step-time[data-step="${CSS.escape(s.id)}"]`);
      const value = seconds(stepTime(s));
      if (el && el.textContent !== value) el.textContent = value;
    }
  };

  /* ---------- Motion ---------- */

  private get glideBox(): HTMLElement | null {
    return this.resolvedLook === "clean" ? this.querySelector<HTMLElement>(".ui-st__card") : this;
  }

  private restingPlaces() {
    const origin = this.getBoundingClientRect();
    const at = new Map<string, { left: number; top: number }>();
    const tracked = new Map<string, HTMLElement>();
    for (const el of this.querySelectorAll<HTMLElement>("[data-track]")) {
      const r = el.getBoundingClientRect();
      tracked.set(el.dataset.track!, el);
      at.set(el.dataset.track!, { left: r.left - origin.left, top: r.top - origin.top });
    }
    return { at, tracked, height: this.glideBox?.offsetHeight ?? 0 };
  }

  private onResize = () => {
    const m = this.restingPlaces();
    this.placesBefore = m.at;
    this.boxHeight = m.height;
  };

  /* ---------- The field ---------- */

  private setDraft(next: string) {
    if (next === this.draft) return;
    if (this.emit("tc-draft-change", { draft: next }, { cancelable: true })) this.draft = next;
    else this.requestUpdate();
  }

  private watch(text: string, done: void | Promise<unknown> | undefined, restore: boolean) {
    if (!done || typeof (done as Promise<unknown>).then !== "function") {
      this.sending = null;
      return;
    }
    this.sending = "pending";
    (done as Promise<unknown>).then(
      () => {
        if (this.isConnected) this.sending = null;
      },
      () => {
        if (!this.isConnected) return;
        this.sending = "error";
        if (restore && !this.draft) this.setDraft(text);
        this.announce = `Couldn't send: ${text}`;
      },
    );
  }

  private send(now: boolean) {
    const text = this.draft.trim();
    if (!text || this.status === "done" || this.sending === "pending") return;
    const done = now ? this.onInterrupt?.(text) : this.onQueue?.(text);
    this.announce = now ? `Interrupting: ${text}` : `Queued for the next step: ${text}`;
    this.setDraft("");
    this.watch(text, done, true);
  }

  private onFieldKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.send(e.metaKey || e.ctrlKey);
    } else if (e.key === "Escape" && this.draft) {
      e.stopPropagation();
      this.setDraft("");
    }
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.dataset.status !== this.status) this.dataset.status = this.status;
    // What the agent took in, for screen readers
    const picked = this.steps.flatMap((s) => (s.notes ?? []).filter((n) => n.picked));
    if (!this.seenPicked) this.seenPicked = new Set(picked.map((n) => n.id));
    else
      for (const n of picked)
        if (!this.seenPicked.has(n.id)) {
          this.seenPicked.add(n.id);
          this.announce = `${this.agent || "The agent"} picked up: ${n.text}`;
        }
  }

  protected override updated() {
    this.toggleAttribute("data-offscreen", !this.screen.onScreen);
    // The queue before its last change – where a removed note sat (read by the focus rescue after this)
    const queueNow = this.queue.map((n) => n.id);
    if (queueNow.join("\u0000") !== this.queues.now.join("\u0000")) this.queues = { before: this.queues.now, now: queueNow };
    // When each active step without its own start time was first seen active
    const t = Date.now();
    for (const s of this.steps) if (s.status === "active" && s.startedAt === undefined && !this.activeSince.has(s.id)) this.activeSince.set(s.id, t);
    // The field grows with its text, up to three lines
    const field = this.field;
    if (field) {
      field.style.height = "0px";
      field.style.height = `${Math.min(field.scrollHeight, 60)}px`;
    }
    this.glide();
    // Paint the clocks at once, then tick while running, on screen and visible
    this.paint();
    const run = this.status === "running" && this.screen.onScreen && this.isConnected;
    if (run && !this.ticker) this.ticker = window.setInterval(this.paint, 100);
    else if (!run && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = 0;
    }
  }

  /** Measures where everything rests after each update, and when the shape changed, glides from before */
  private glide() {
    const shape = JSON.stringify([this.steps.map((s) => [s.id, s.status, s.title, (s.notes ?? []).map((n) => n.id)]), this.queue.map((n) => n.id), this.resolvedLook]);
    const { at, tracked, height } = this.restingPlaces();
    const changed = this.lastShape !== null && this.lastShape !== shape;
    this.lastShape = shape;
    if (changed && !reducedMotion()) {
      // The card grows and shrinks smoothly instead of jumping
      const box = this.glideBox;
      if (box && this.boxHeight && Math.abs(height - this.boxHeight) > 1) {
        box.animate([{ height: `${this.boxHeight}px` }, { height: `${height}px` }], { duration: 480, easing: EASE });
      }
      for (const [key, el] of tracked) {
        const id = key.slice(key.indexOf(":") + 1);
        // A note keeps its id from the queue into the plan – look for it under both keys
        const from = this.placesBefore.get(key) ?? (key.startsWith("note:") ? this.placesBefore.get(`queued:${id}`) : undefined);
        const to = at.get(key)!;
        if (!from) {
          el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: EASE });
          continue;
        }
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        const flew = !this.placesBefore.has(key);
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 },
            { transform: "none", zIndex: 2 },
          ],
          { duration: flew ? 620 : 480, easing: EASE },
        );
        // Landed in the plan: a soft wash says "this changed"
        if (flew) el.setAttribute("data-landed", "");
      }
    }
    this.placesBefore = at;
    this.boxHeight = height;
  }

  /* ---------- Render ---------- */

  private renderLower() {
    const open = this.status !== "done";
    const mod = this.mac ? "⌘" : "Ctrl";
    const sending = this.sending;
    return html`
      ${this.queue.length > 0
        ? html`<div class="ui-st__queue" data-track="queue:box">
            <div class="ui-st__label">Queued for the next step <span>${this.queue.length}</span></div>
            <ul class="ui-st__queued">
              ${this.queue.map(
                (n) => html`<li data-track=${`queued:${n.id}`} class="ui-st__chip">
                  <span class="ui-st__chip-text">${n.text}</span>
                  ${this.onInterrupt && open
                    ? html`<button
                        type="button"
                        class="ui-st__chip-btn"
                        data-focus-key=${`now:${n.id}`}
                        aria-label=${`Apply now: “${n.text}”`}
                        title=${`Apply now (${mod}↵)`}
                        @click=${() => this.watch(n.text, this.onInterrupt?.(n.text, n.id), false)}
                      >${boltIcon}Now</button>`
                    : nothing}
                  ${this.removable
                    ? html`<button
                        type="button"
                        class="ui-st__chip-x"
                        data-focus-key=${`x:${n.id}`}
                        aria-label=${`Remove “${n.text}”`}
                        @click=${(e: Event) => {
                          // Focus first goes to the next note's ✕ (or the one before, or the field) – then the note goes
                          const li = (e.currentTarget as HTMLElement).closest("li");
                          const near = (el: Element | null | undefined) => el?.querySelector(".ui-st__chip-x");
                          rescueFocus(li, [near(li?.nextElementSibling), near(li?.previousElementSibling), this.field]);
                          this.emit("tc-remove", { id: n.id });
                        }}
                      >${closeIcon}</button>`
                    : nothing}
                </li>`,
              )}
            </ul>
          </div>`
        : nothing}
      <div class="ui-st__compose" data-track="compose:box" ?data-disabled=${!open}>
        <div
          class="ui-st__field"
          @click=${(e: Event) => !(e.target as HTMLElement).closest("button") && this.field?.focus({ preventScroll: true })}
        >
          <textarea
            id=${`${this.uid}-field`}
            rows="1"
            .value=${live(this.draft)}
            ?disabled=${!open}
            placeholder=${open ? this.placeholder : "The run has finished"}
            aria-label="Steer the agent"
            aria-describedby=${`${this.uid}-hint`}
            @input=${(e: Event) => {
              this.setDraft((e.target as HTMLTextAreaElement).value);
              if (this.sending === "error") this.sending = null;
            }}
            @keydown=${(e: KeyboardEvent) => this.onFieldKeyDown(e)}
          ></textarea>
          <button
            type="button"
            class="ui-st__send"
            aria-label="Queue for the next step"
            ?disabled=${!this.draft.trim() || !open || sending === "pending"}
            aria-busy=${ifDefined(sending === "pending" ? "true" : undefined)}
            @click=${() => this.send(false)}
          >${arrowUpIcon}</button>
        </div>
        <div class="ui-st__hint" id=${`${this.uid}-hint`}>
          ${sending === "error"
            ? html`<span class="ui-st__error" role="alert">Couldn't send – try again</span>`
            : open
              ? html`<span><kbd>↵</kbd> next step</span>${this.onInterrupt ? html`<span><kbd>${mod}</kbd><kbd>↵</kbd> interrupt now</span>` : nothing}`
              : html`<span>Notes still in the queue were not used</span>`}
        </div>
      </div>
    `;
  }

  protected override render() {
    const look = this.resolvedLook;
    const status = this.status;
    const steps = this.steps;
    const done = steps.filter((s) => s.status === "done").length;
    // What's rendered is the clocks at the first-seen snapshot; updated() paints the real time before the browser does
    const { runTime, stepTime } = this.times(this.firstSeen ?? 0);
    const showToggle = (status === "running" && this.pausable) || (status === "paused" && this.resumable);
    const state = (where: "aside" | "sub") =>
      html`<span class="ui-st__state ui-st__state--${where}" data-status=${status}><span class="ui-st__pulse" aria-hidden="true"></span>${runLabel(status, runTime)}</span>`;
    const head = cardHead({
      icon: steerIcon,
      title: this.heading,
      subtitle: html`${this.agent ? html`${this.agent}<span class="ui-st__dot" aria-hidden="true">·</span>` : nothing}${status === "done" ? `${steps.length} steps` : `Step ${Math.min(done + 1, steps.length)} of ${steps.length}`}${state("sub")}`,
      aside: html`${state("aside")}
        ${showToggle
          ? html`<button
              type="button"
              class="ui-st__icon-btn"
              aria-label=${status === "running" ? "Pause the run" : "Resume the run"}
              title=${status === "running" ? "Pause" : "Resume"}
              @click=${() => this.emit(this.status === "running" ? "tc-pause" : "tc-resume", null)}
            >${status === "running" ? pauseIcon : playIcon}</button>`
          : nothing}`,
    });
    return html`
      ${look === "standard" ? head : nothing}
      <div class="ui-st__card">
        ${look === "clean" ? head : nothing}
        <ol class="ui-st__plan" aria-label="Plan">
          ${steps.map((s) => {
            const st = s.status ?? "pending";
            return html`<li data-track=${`step:${s.id}`} class="ui-st__step" data-status=${st} aria-current=${ifDefined(st === "active" ? "step" : undefined)}>
              <div class="ui-st__step-row">
                ${stepIcon(st)}
                <span class="ui-st__sr">${st === "done" ? "Done: " : st === "active" ? "In progress: " : "To do: "}</span>
                <span class="ui-st__step-title" title=${s.title}>${s.title}${st === "active" && status === "running" ? html`<span class="ui-st__shine" aria-hidden="true"><span>${s.title}</span></span>` : nothing}</span>
                <span
                  class="ui-st__step-time"
                  data-step=${s.id}
                  .textContent=${st === "done" && s.duration !== undefined ? seconds(s.duration) : st === "active" && status === "running" ? seconds(stepTime(s)) : ""}
                ></span>
              </div>
              ${(s.notes ?? []).map(
                (n) => html`<div data-track=${`note:${n.id}`} class="ui-st__note" data-picked=${ifDefined(n.picked)}>
                  ${cornerIcon}
                  <span class="ui-st__note-text">${n.text}</span>
                  ${n.picked ? html`<span class="ui-st__note-tag">${checkIcon}${n.picked === "now" ? "Interrupted" : "Picked up"}</span>` : nothing}
                </div>`,
              )}
            </li>`;
          })}
        </ol>
        ${look === "clean" ? this.renderLower() : nothing}
      </div>
      ${look === "standard" ? this.renderLower() : nothing}
      <span class="ui-st__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="st"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="st"] {
  --tc-agent-steering-accent: light-dark(#2f6bff, #5b8cff);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-tray-inset);
  overflow: hidden;
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="st"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="st"] {
  --tc-agent-steering-rail: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.16));
  --tc-agent-steering-accent: light-dark(rgba(0, 96, 226, 0.765), #5b9aff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="st"] *, [data-ui="st"] *::before, [data-ui="st"] *::after { box-sizing: border-box; }
:where([data-ui="st"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="st"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="st"] ol, [data-ui="st"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="st"] svg { display: block; flex: none; }
.ui-st__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card holds the run and its plan – the card recipe */
.ui-st__card { position: relative; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__card { overflow: hidden; }
/* ----- The run ----- */
.ui-st__dot { margin: 0 var(--tc-space-1-5); color: var(--tc-text-disabled); }
/* The run's state: a large status pill in Standard, plain text in Clean */
:where([data-look="standard"], [data-look="standard"] *).ui-st__state { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__state { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-st__pulse { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-agent-steering-accent); }
/* The live dot pulses a few times, then rests (2.2.2) */
.ui-st__pulse::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; background: var(--tc-agent-steering-accent); opacity: 0; animation: ui-st-pulse var(--tc-duration-shimmer) var(--tc-ease-decelerate) 3; }
.ui-st__state[data-status="paused"] .ui-st__pulse { background: var(--tc-status-warning-solid); }
.ui-st__state[data-status="done"] .ui-st__pulse { background: var(--tc-status-success-solid); }
.ui-st__state:not([data-status="running"]) .ui-st__pulse::after { display: none; }
/* One copy of the status at a time (display: none keeps the other from screen readers): on the right, or under the
   title in narrow containers so the title keeps the width */
[data-ui="st"] .ui-st__state--sub { display: none; }
/* Pause / Resume: a secondary icon button, like Button */
.ui-st__icon-btn { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-st__icon-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* ----- The plan: a quiet timeline under a divider ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__plan { display: grid; grid-template-columns: minmax(0, 1fr); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__plan { display: grid; grid-template-columns: minmax(0, 1fr); padding: var(--tc-space-2-5) var(--tc-space-3-5) var(--tc-space-3) !important; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step { position: relative; padding: var(--tc-space-1-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step { position: relative; padding: var(--tc-space-1) 0; }
/* Short rail segments between the icons, with a little air on both ends */
:where([data-look="standard"], [data-look="standard"] *).ui-st__step:not(:last-child)::after { content: ""; position: absolute; top: 27px; bottom: -3px; left: 7.5px; width: 1px; background: var(--tc-border-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step:not(:last-child)::after { content: ""; position: absolute; top: 25px; bottom: -3px; left: 7.5px; width: 0.5px; background: var(--tc-agent-steering-rail); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-row { display: flex; align-items: center; gap: var(--tc-space-3); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-row { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
.ui-st__step-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-text-disabled); }
/* The tick on a done step: the card's surface on an ink disc (Standard), white on the accent disc (Clean) – in both themes */
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-icon[data-status="done"] { color: var(--tc-text-primary); animation: ui-st-pop var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-check { stroke: var(--tc-surface-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-icon[data-status="done"] { color: var(--tc-agent-steering-accent); animation: ui-st-pop var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-check { stroke: var(--tc-text-on-accent); }
.ui-st__step-icon[data-status="active"] { color: var(--tc-agent-steering-accent); }
/* The spinner turns a few times, then rests as an arc (2.2.2) */
.ui-st__step-icon[data-status="active"] svg { animation: ui-st-spin var(--tc-duration-reveal-slow) linear 6; }
.ui-st__step-title { position: relative; flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-title { transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step[data-status="done"] .ui-st__step-title { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step[data-status="done"] .ui-st__step-title { color: var(--tc-text-secondary); }
.ui-st__step[data-status="pending"] .ui-st__step-title { color: var(--tc-text-muted); }
.ui-st__step[data-status="active"] .ui-st__step-title { font-weight: var(--tc-font-weight-medium); }
/* The active step shimmers while it runs: a window slides right while the lighter copy inside it slides left by the
   same amount, so the copy stays on the title – transform only, two passes, paused off screen */
.ui-st__shine { position: absolute; top: 0; bottom: 0; left: 0; width: 20%; overflow: hidden; pointer-events: none; animation: ui-st-shine var(--tc-duration-shimmer) linear 2 both; }
.ui-st__shine > span { position: absolute; top: 0; left: 0; width: 500%; overflow: hidden; color: var(--tc-text-disabled); white-space: nowrap; text-overflow: ellipsis; -webkit-mask-image: linear-gradient(90deg, transparent, #000 40% 60%, transparent); mask-image: linear-gradient(90deg, transparent, #000 40% 60%, transparent); animation: ui-st-shine-copy var(--tc-duration-shimmer) linear 2 both; }
[data-ui="st"][data-offscreen] .ui-st__shine, [data-ui="st"][data-offscreen] .ui-st__shine > span { animation-play-state: paused; }
@keyframes ui-st-shine { from { transform: translateX(-100%); } to { transform: translateX(500%); } }
@keyframes ui-st-shine-copy { from { transform: translateX(20%); } to { transform: translateX(-100%); } }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-time { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-time { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* A note the agent took in – attached to its step */
:where([data-look="standard"], [data-look="standard"] *).ui-st__note { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); margin: var(--tc-space-1-5) 0 var(--tc-space-0-5) var(--tc-space-7); padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-lg); background: var(--tc-fill-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__note > svg { margin-top: var(--tc-space-1); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); margin: var(--tc-space-1) 0 var(--tc-space-0-5) 26px; padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1) var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note > svg { margin-top: var(--tc-space-0-5); color: var(--tc-text-muted); }
.ui-st__note-text { flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__note-tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note-tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__note[data-landed] { animation: ui-st-land var(--tc-duration-shimmer) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note[data-landed] { animation: ui-st-land-clean var(--tc-duration-shimmer) var(--tc-ease-standard) both; }
/* ----- Queued notes: on the tray (Standard) or at the bottom of the card (Clean) ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__queue { padding: var(--tc-space-3) var(--tc-space-2) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__queue { padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-0-5) var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* The group label: the caption spec of each look */
.ui-st__label { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__label { margin: 0 var(--tc-space-1) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__label { margin-bottom: var(--tc-space-1-5); }
.ui-st__label span { display: grid; place-items: center; border-radius: var(--tc-radius-badge); letter-spacing: 0; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__label span { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); background: var(--tc-fill-hover); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__label span { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-st__queued { display: grid; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__chip { position: relative; display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 36px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3); border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__chip::before { content: ""; position: absolute; top: 9px; bottom: 9px; left: 0; width: 3px; border-radius: 0 var(--tc-radius-2xs) var(--tc-radius-2xs) 0; background: var(--tc-agent-steering-accent); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__chip-text { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__chip { position: relative; display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 32px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__chip::before { content: ""; position: absolute; top: 8px; bottom: 8px; left: 0; width: 2px; border-radius: 0 var(--tc-radius-2xs) var(--tc-radius-2xs) 0; background: var(--tc-agent-steering-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__chip-text { flex: 1; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* Now and ✕: small ghost buttons */
.ui-st__chip-btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) 0 calc(var(--tc-control-px-sm) - 2px); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-st__chip-btn:hover { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-st__chip-x { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-st__chip-x:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* ----- Steer: the field recipe (control edge, focus ring + halo on the wrapper) ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__compose { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__compose { padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-st__field { display: flex; align-items: flex-end; gap: var(--tc-space-2); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); cursor: text; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__field { min-height: 42px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__field { min-height: 36px; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-2-5); background: var(--tc-field-bg-sunken); }
.ui-st__field:hover { box-shadow: var(--tc-field-shadow-hover); }
[data-ui="st"] .ui-st__field:focus-within { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-st__field textarea { flex: 1; min-width: 0; height: 20px; padding: 0; border: 0; outline: none; background: none; font: inherit; color: var(--tc-text-primary); resize: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__field textarea { margin: var(--tc-space-1-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__field textarea { margin: var(--tc-space-1) 0; color: var(--tc-text-strong); }
.ui-st__field textarea::placeholder { color: var(--tc-text-placeholder); }
/* Send: the primary action, like Button */
.ui-st__send { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-st__send:not(:disabled):hover { background: var(--tc-action-primary-bg-hover); }
.ui-st__send:not(:disabled):active { background: var(--tc-action-primary-bg-active); transform: scale(0.94); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__send:disabled { opacity: 0.16; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__send:disabled { opacity: 0.18; cursor: default; }
.ui-st__hint { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__hint { margin: var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__hint { margin-top: var(--tc-space-2); }
.ui-st__hint > span { display: inline-flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
.ui-st__hint > .ui-st__error { color: var(--tc-status-danger-fg); }
[data-ui="st"] kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-kbd-fg); }
.ui-st__compose[data-disabled] .ui-st__field { opacity: 0.6; cursor: default; }
@keyframes ui-st-spin { to { transform: rotate(360deg); } }
@keyframes ui-st-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-st-pulse { from { opacity: 0.45; transform: scale(0.6); } to { opacity: 0; transform: scale(1.8); } }
@keyframes ui-st-land { 0%, 30% { background-color: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1px var(--tc-accent-subtle); } }
@keyframes ui-st-land-clean { 0%, 30% { background-color: var(--tc-accent-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-focus-ring); } }
/* Narrow containers: the status moves under the title, and tighter side padding */
@container (max-width: 380px) {
  [data-ui="st"] .ui-st__state--aside { display: none; }
  [data-ui="st"] .ui-st__state--sub { display: flex; width: fit-content; margin-top: var(--tc-space-1-5); }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__plan { padding-left: var(--tc-space-3-5); padding-right: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__plan,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__queue,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__compose { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
}
@media (pointer: coarse) {
  :where([data-look="standard"], [data-look="standard"] *).ui-st__icon-btn,
  :where([data-look="standard"], [data-look="standard"] *).ui-st__send { width: 36px; height: 36px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__chip-btn,
  :where([data-look="standard"], [data-look="standard"] *).ui-st__chip-x { height: 32px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__chip-x { width: 32px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__icon-btn,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__send { width: 34px; height: 34px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__chip-btn,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__chip-x { height: 30px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__chip-x { width: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="st"] *, [data-ui="st"] *::before, [data-ui="st"] *::after { animation: none !important; transition: none !important; }
  .ui-st__shine { display: none; }
}
`;
}

if (!customElements.get("tc-agent-steering")) customElements.define("tc-agent-steering", TcAgentSteering);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-steering": TcAgentSteering;
  }
}
