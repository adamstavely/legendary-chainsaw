import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-run-controls> – every control a running agent needs, in one composer. While it answers: Stop, and a field that
 * either steers it mid-answer (Steer) or lines up what to ask next (Queue – queued asks wait as numbered chips and go
 * out in order). After a stop or a dropped connection it says so, with Resume – which carries on from where the answer
 * stopped – Retry and Dismiss. Under the field: Chat or Act, what the agent may do without asking, and how full the
 * context is ("62% of context"). Everything is an event; the app does the work and owns the state.
 * Standard: the composer on a gray tray. Clean: one white card. With a heading, it sits in the card's header.
 * Narrow, the mode and permissions fold into a More menu.
 *
 *   <tc-run-controls state="streaming" context="0.62" partial="1240"></tc-run-controls>
 *
 * Keyboard. Enter sends – or, while it answers, steers; Shift+Enter is a new line. Escape while it answers stops it.
 * Chat and Act are a radio group (arrow keys). The More menu closes with Escape and gives focus back.
 */

/** Where the run is */
export type RunControlsState = "idle" | "streaming" | "stopped" | "disconnected" | "done";
/** Chat answers; Act may use tools and change things */
export type RunControlsMode = "chat" | "act";
/** What the agent may do without asking */
export type RunControlsPermission = "ask" | "auto-edit" | "full";
/** tc-state-change */
export type RunControlsStateChange = { state: RunControlsState };
/** tc-mode-change */
export type RunControlsModeChange = { mode: RunControlsMode };
/** tc-permission-change */
export type RunControlsPermissionChange = { permission: RunControlsPermission };
/** tc-queue-change: the asks waiting, in the order they'll go out */
export type RunControlsQueueChange = { queue: string[] };
/** tc-send: a new ask */
export type RunControlsSend = { text: string };
/** tc-steer: a note for the answer in progress */
export type RunControlsSteer = { note: string };
/** tc-stop: how much of the answer had arrived */
export type RunControlsStop = { partial: number };
/** tc-resume: carry on from this many characters in */
export type RunControlsResume = { from: number };
/** The words it uses, to translate or reword */
export type RunControlsLabels = {
  placeholder: string;
  steerPlaceholder: string;
  send: string;
  steer: string;
  queue: string;
  stop: string;
  resume: string;
  retry: string;
  dismiss: string;
  /** While it answers */
  streaming: string;
  /** "{count} queued" */
  queued: string;
  /** "Stopped at {count} characters" – {count} is `partial` */
  stopped: string;
  /** "Connection lost at {count} characters" */
  disconnected: string;
  done: string;
  chat: string;
  act: string;
  mode: string;
  permission: string;
  ask: string;
  "auto-edit": string;
  full: string;
  /** "{percent}% of context" */
  context: string;
  more: string;
  /** A queued ask's remove button: "Remove {text}" */
  remove: string;
  message: string;
};

export const defaultRunControlsLabels: RunControlsLabels = {
  placeholder: "Ask anything",
  steerPlaceholder: "Steer it, or queue what's next",
  send: "Send",
  steer: "Steer",
  queue: "Queue",
  stop: "Stop",
  resume: "Resume",
  retry: "Retry",
  dismiss: "Dismiss",
  streaming: "Answering…",
  queued: "{count} queued",
  stopped: "Stopped at {count} characters",
  disconnected: "Connection lost at {count} characters",
  done: "Done",
  chat: "Chat",
  act: "Act",
  mode: "Mode",
  permission: "Permissions",
  ask: "Ask before acting",
  "auto-edit": "Auto-edit",
  full: "Full access",
  context: "{percent}% of context",
  more: "More",
  remove: "Remove {text}",
  message: "Message",
};

const MODES: RunControlsMode[] = ["chat", "act"];
const PERMISSIONS: RunControlsPermission[] = ["ask", "auto-edit", "full"];

/* Lucide arrow-up, square, rotate-ccw, play, ellipsis, list-plus (ISC – lucide.dev) */
const icons = {
  send: svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`,
  stop: svg`<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"></rect>`,
  retry: svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`,
  resume: svg`<polygon points="7 4 19 12 7 20 7 4"></polygon>`,
  more: svg`<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>`,
  queue: svg`<path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M16 18H3"></path><path d="M18 9v6"></path><path d="M21 12h-6"></path>`,
  steer: svg`<path d="M3 12h13"></path><path d="m12 7 5 5-5 5"></path><path d="M21 5v14"></path>`,
};
/* Lucide "sliders-horizontal" (ISC – lucide.dev) */
const headIcon = svg`<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"></path>`;
const icon = (paths: unknown) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

let instances = 0;

/**
 * One composer with every control a running agent needs – stop, resume, retry, steer, queue, mode, permissions, context.
 * @tag tc-run-controls
 * @fires tc-send - Send was pressed ({ text }: RunControlsSend); cancelable – prevented, the text stays and the state doesn't change
 * @fires tc-steer - A steering note was sent while it answers ({ note }: RunControlsSteer); cancelable – prevented, the note stays
 * @fires tc-stop - Stop was pressed ({ partial }: RunControlsStop); cancelable – prevented, the state stays
 * @fires tc-resume - Resume was pressed ({ from }: RunControlsResume); cancelable – prevented, the state stays
 * @fires tc-retry - Retry was pressed (detail: {}); cancelable – prevented, the state stays
 * @fires tc-dismiss - Dismiss was pressed (detail: {}); cancelable – prevented, the state stays
 * @fires tc-state-change - The state is about to change ({ state }: RunControlsStateChange); cancelable – prevented, `state` stays as it was
 * @fires tc-mode-change - Chat or Act was chosen ({ mode }: RunControlsModeChange); cancelable – prevented, `mode` stays as it was
 * @fires tc-permission-change - A permission was chosen ({ permission }: RunControlsPermissionChange); cancelable – prevented, `permission` stays as it was
 * @fires tc-queue-change - An ask was queued or removed ({ queue }: RunControlsQueueChange); cancelable – prevented, `queue` stays as it was
 */
export class TcRunControls extends TcElement {
  static override ui = "runc";

  /** A heading for the card; empty (the default) leaves the header out */
  @property() accessor heading = "";
  /** Where the run is. Changed by the controls unless tc-state-change is prevented */
  @property({ reflect: true }) accessor state: RunControlsState = "idle";
  /** Chat or Act. Changed by the toggle unless tc-mode-change is prevented */
  @property() accessor mode: RunControlsMode = "chat";
  /** What the agent may do without asking. Changed by the select unless tc-permission-change is prevented */
  @property() accessor permission: RunControlsPermission = "ask";
  /** The asks waiting to go out, in order. Changed by Queue and the chips unless tc-queue-change is prevented */
  @property({ attribute: false }) accessor queue: string[] = [];
  /** How full the context window is, 0–1; unset hides the ring */
  @property({ type: Number }) accessor context: number | undefined = undefined;
  /** How many characters of the answer have arrived – Resume carries on from here */
  @property({ type: Number }) accessor partial = 0;
  /** The text in the field */
  @property() accessor value = "";
  /** Everything disabled */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** The words it uses, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<RunControlsLabels> = {};

  /** @internal Narrow: mode and permissions fold into More */
  @state() accessor narrow = false;
  /** @internal The More menu is open */
  @state() accessor moreOpen = false;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-runc${++instances}`;
  private ro?: ResizeObserver;
  private lastState: RunControlsState | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    document.removeEventListener("pointerdown", this.away);
  }

  private word(key: keyof RunControlsLabels, vars: Record<string, string> = {}) {
    const text = this.labels[key] ?? defaultRunControlsLabels[key];
    return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  }

  private get live() {
    return this.state === "streaming";
  }
  private get halted() {
    return this.state === "stopped" || this.state === "disconnected";
  }

  /* ---------- Actions ---------- */

  private setState(next: RunControlsState) {
    if (next === this.state) return;
    if (this.emit<RunControlsStateChange>("tc-state-change", { state: next }, { cancelable: true })) this.state = next;
  }

  private setQueue(next: string[]) {
    if (this.emit<RunControlsQueueChange>("tc-queue-change", { queue: next }, { cancelable: true })) this.queue = next;
  }

  private send() {
    const text = this.value.trim();
    if (!text || this.disabled) return;
    if (!this.emit<RunControlsSend>("tc-send", { text }, { cancelable: true })) return;
    this.value = "";
    this.setState("streaming");
  }

  private steer() {
    const note = this.value.trim();
    if (!note || this.disabled) return;
    if (!this.emit<RunControlsSteer>("tc-steer", { note }, { cancelable: true })) return;
    this.value = "";
  }

  private enqueue() {
    const text = this.value.trim();
    if (!text || this.disabled) return;
    const before = this.queue;
    this.setQueue([...this.queue, text]);
    if (this.queue !== before) this.value = "";
  }

  private stop() {
    if (this.emit<RunControlsStop>("tc-stop", { partial: this.partial }, { cancelable: true })) this.setState("stopped");
  }

  private resume() {
    if (this.emit<RunControlsResume>("tc-resume", { from: this.partial }, { cancelable: true })) this.setState("streaming");
  }

  private retry() {
    if (this.emit("tc-retry", {}, { cancelable: true })) this.setState("streaming");
  }

  private dismiss() {
    if (this.emit("tc-dismiss", {}, { cancelable: true })) this.setState("idle");
  }

  private setMode(next: RunControlsMode) {
    if (next === this.mode) return;
    if (this.emit<RunControlsModeChange>("tc-mode-change", { mode: next }, { cancelable: true })) this.mode = next;
  }

  private setPermission(next: RunControlsPermission, select?: HTMLSelectElement) {
    if (next === this.permission) return;
    if (this.emit<RunControlsPermissionChange>("tc-permission-change", { permission: next }, { cancelable: true })) this.permission = next;
    else if (select) select.value = this.permission;
  }

  /* ---------- Keys ---------- */

  private onFieldKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.live) {
      e.preventDefault();
      this.stop();
      return;
    }
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    if (this.live) this.steer();
    else this.send();
  };

  private onModeKey = (e: KeyboardEvent) => {
    const i = MODES.indexOf(this.mode);
    const to = { ArrowLeft: i - 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowDown: i + 1, Home: 0, End: MODES.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const group = e.currentTarget as HTMLElement;
    this.setMode(MODES[(to + MODES.length) % MODES.length]);
    void this.updateComplete.then(() => group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };

  private toggleMore(open = !this.moreOpen) {
    this.moreOpen = open;
    if (open) document.addEventListener("pointerdown", this.away);
    else document.removeEventListener("pointerdown", this.away);
  }

  private away = (e: PointerEvent) => {
    if (!this.querySelector(".ui-runc__more-wrap")?.contains(e.target as Node)) this.toggleMore(false);
  };

  private onMoreKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    this.toggleMore(false);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-runc__more")?.focus());
  };

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("state")) {
      if (this.lastState !== null && this.lastState !== this.state) {
        const n = this.partial.toLocaleString("en-US");
        const say =
          this.state === "streaming"
            ? this.word("streaming")
            : this.state === "stopped"
              ? this.word("stopped", { count: n })
              : this.state === "disconnected"
                ? this.word("disconnected", { count: n })
                : this.state === "done"
                  ? this.word("done")
                  : "";
        if (say) this.said = this.said === say ? `${say} ` : say;
      }
      this.lastState = this.state;
    }
    if (!this.narrow && this.moreOpen) this.toggleMore(false);
  }

  protected override firstUpdated() {
    if (typeof ResizeObserver === "undefined") return;
    this.ro = new ResizeObserver(() => {
      this.narrow = this.clientWidth > 0 && this.clientWidth < 440;
    });
    this.ro.observe(this);
  }

  /* ---------- Render ---------- */

  private renderMode() {
    return html`<div class="ui-runc__modes" role="radiogroup" aria-label=${this.word("mode")} @keydown=${this.onModeKey}>
      ${MODES.map(
        (m) =>
          html`<button
            type="button"
            role="radio"
            class="ui-runc__mode"
            data-mode=${m}
            aria-checked=${this.mode === m ? "true" : "false"}
            tabindex=${this.mode === m ? "0" : "-1"}
            ?disabled=${this.disabled}
            @click=${() => this.setMode(m)}
          >${this.word(m)}</button>`,
      )}
    </div>`;
  }

  private renderPermission() {
    const id = `${this.uid}-perm`;
    return html`<span class="ui-runc__perm">
      <label class="tc-sr-only" for=${id}>${this.word("permission")}</label>
      <select
        id=${id}
        class="ui-runc__select"
        .value=${this.permission}
        ?disabled=${this.disabled}
        @change=${(e: Event) => this.setPermission((e.target as HTMLSelectElement).value as RunControlsPermission, e.target as HTMLSelectElement)}
      >
        ${PERMISSIONS.map((p) => html`<option value=${p} ?selected=${this.permission === p}>${this.word(p)}</option>`)}
      </select>
    </span>`;
  }

  private renderContext() {
    if (this.context === undefined) return nothing;
    const pct = Math.round(Math.max(0, Math.min(1, this.context)) * 100);
    const tone = pct >= 90 ? "danger" : pct >= 75 ? "warning" : "";
    const words = this.word("context", { percent: String(pct) });
    return html`<div class="ui-runc__context" data-tone=${tone} .role=${"meter"} aria-label=${words} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct}>
      <svg class="ui-runc__ring" viewBox="0 0 20 20" aria-hidden="true">
        <circle class="ui-runc__ring-track" cx="10" cy="10" r="7.5" pathLength="100"></circle>
        <circle class="ui-runc__ring-fill" cx="10" cy="10" r="7.5" pathLength="100" style=${styleMap({ strokeDasharray: `${pct} 100` })}></circle>
      </svg>
      <span class="ui-runc__context-words" aria-hidden="true">${this.narrow ? `${pct}%` : words}</span>
    </div>`;
  }

  private renderStatus() {
    const n = this.partial.toLocaleString("en-US");
    if (this.live)
      return html`<div class="ui-runc__status" data-state="streaming">
        <span class="ui-runc__pulse" aria-hidden="true"></span><span>${this.word("streaming")}</span>
        ${this.queue.length ? html`<span class="ui-runc__muted"> · ${this.word("queued", { count: String(this.queue.length) })}</span>` : nothing}
      </div>`;
    if (this.halted)
      return html`<div class="ui-runc__status" data-state=${this.state}>
        <span class="ui-runc__halt">${this.word(this.state === "stopped" ? "stopped" : "disconnected", { count: n })}</span>
        <span class="ui-runc__halt-actions">
          <button type="button" class="ui-runc__btn ui-runc__btn--primary" ?disabled=${this.disabled} @click=${() => this.resume()}>${icon(icons.resume)}${this.word("resume")}</button>
          <button type="button" class="ui-runc__btn" ?disabled=${this.disabled} @click=${() => this.retry()}>${icon(icons.retry)}${this.word("retry")}</button>
          <button type="button" class="ui-runc__btn ui-runc__btn--ghost" ?disabled=${this.disabled} @click=${() => this.dismiss()}>${this.word("dismiss")}</button>
        </span>
      </div>`;
    return nothing;
  }

  protected override render() {
    const fieldId = `${this.uid}-field`;
    const hasText = !!this.value.trim();
    const actions = this.live
      ? html`${hasText
            ? html`<button type="button" class="ui-runc__btn" ?disabled=${this.disabled} @click=${() => this.enqueue()}>${icon(icons.queue)}${this.word("queue")}</button>
                <button type="button" class="ui-runc__btn" ?disabled=${this.disabled} @click=${() => this.steer()}>${icon(icons.steer)}${this.word("steer")}</button>`
            : nothing}
          <button type="button" class="ui-runc__round ui-runc__round--stop" ?disabled=${this.disabled} @click=${() => this.stop()}>${icon(icons.stop)}<span class="tc-sr-only">${this.word("stop")}</span></button>`
      : html`${this.halted && hasText
            ? html`<button type="button" class="ui-runc__btn" ?disabled=${this.disabled} @click=${() => this.enqueue()}>${icon(icons.queue)}${this.word("queue")}</button>`
            : nothing}
          <button type="button" class="ui-runc__round" ?disabled=${this.disabled || !hasText} @click=${() => this.send()}>${icon(icons.send)}<span class="tc-sr-only">${this.word("send")}</span></button>`;
    const secondary = this.narrow
      ? html`<span class="ui-runc__more-wrap">
          <button
            type="button"
            class="ui-runc__btn ui-runc__btn--ghost ui-runc__more"
            aria-expanded=${this.moreOpen ? "true" : "false"}
            aria-controls=${`${this.uid}-more`}
            ?disabled=${this.disabled}
            @click=${() => this.toggleMore()}
          >${icon(icons.more)}${this.word("more")}</button>
          <div class="ui-runc__pop" id=${`${this.uid}-more`} ?hidden=${!this.moreOpen} @keydown=${this.onMoreKey}>${this.renderMode()}${this.renderPermission()}</div>
        </span>`
      : html`${this.renderMode()}${this.renderPermission()}`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading }) : nothing}
      <div class="ui-runc__box">
        ${this.renderStatus()}
        ${this.queue.length
          ? html`<ol class="ui-runc__queue" aria-label=${this.word("queued", { count: String(this.queue.length) })}>
              ${repeat(
                this.queue,
                (q, i) => `${i}:${q}`,
                (q, i) => html`<li class="ui-runc__chip">
                  <span class="ui-runc__chip-n" aria-hidden="true">${i + 1}</span><span class="ui-runc__chip-text">${q}</span>
                  <button
                    type="button"
                    class="ui-runc__chip-x"
                    ?disabled=${this.disabled}
                    @click=${() => this.setQueue(this.queue.filter((_, j) => j !== i))}
                  ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${svg`<path d="M18 6 6 18M6 6l12 12"></path>`}</svg><span class="tc-sr-only">${this.word("remove", { text: q })}</span></button>
                </li>`,
              )}
            </ol>`
          : nothing}
        <label class="tc-sr-only" for=${fieldId}>${this.word("message")}</label>
        <textarea
          id=${fieldId}
          class="ui-runc__field"
          rows="2"
          .value=${this.value}
          placeholder=${this.live ? this.word("steerPlaceholder") : this.word("placeholder")}
          ?disabled=${this.disabled}
          @input=${(e: Event) => (this.value = (e.target as HTMLTextAreaElement).value)}
          @keydown=${this.onFieldKey}
        ></textarea>
        <div class="ui-runc__bar">
          <div class="ui-runc__left">${secondary}</div>
          <div class="ui-runc__right">${this.renderContext()}${actions}</div>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="runc"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="runc"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="runc"] *, [data-ui="runc"] *::before, [data-ui="runc"] *::after { box-sizing: border-box; }
:where([data-ui="runc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="runc"] :is(button, select):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="runc"] button:disabled { cursor: not-allowed; opacity: 0.5; }
:where([data-ui="runc"]) :is(p, ol) { margin: 0; padding: 0; }
[data-ui="runc"] ol { list-style: none; }
[data-ui="runc"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-runc__box { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-runc__box { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3); }
/* ----- Status ----- */
.ui-runc__status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-runc__status[data-state="streaming"] { color: var(--tc-accent-text); }
.ui-runc__muted { color: var(--tc-text-muted); }
.ui-runc__pulse { width: var(--tc-space-2); height: var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-accent-solid); animation: ui-runc-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-runc__status[data-state="stopped"] .ui-runc__halt { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-runc__status[data-state="disconnected"] .ui-runc__halt { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-runc__halt-actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-left: auto; }
/* ----- Queue ----- */
.ui-runc__queue { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-runc__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); max-width: 100%; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
.ui-runc__chip-n { display: grid; place-items: center; min-width: var(--tc-space-4); height: var(--tc-space-4); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-runc__chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-runc__chip-x { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-full); color: var(--tc-text-muted); }
.ui-runc__chip-x:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-runc__chip-x svg { width: var(--tc-space-3); height: var(--tc-space-3); }
/* ----- Field ----- */
.ui-runc__field { display: block; width: 100%; min-height: var(--tc-control-h-lg); padding: var(--tc-space-1) 0; border: 0; background: none; color: var(--tc-text-primary); font: inherit; resize: none; field-sizing: content; max-height: 40vh; }
.ui-runc__field::placeholder { color: var(--tc-text-placeholder); }
[data-ui="runc"] .ui-runc__field:focus-visible { outline: none; }
.ui-runc__box:has(.ui-runc__field:focus-visible) { box-shadow: var(--tc-field-shadow-focus); }
/* ----- Bar ----- */
.ui-runc__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-runc__left, .ui-runc__right { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-runc__right { margin-left: auto; }
.ui-runc__modes { display: inline-flex; padding: var(--tc-space-0-5); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-runc__mode { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-runc__mode[aria-checked="true"] { background: var(--tc-surface-raised); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-runc__select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-sm); cursor: pointer; }
.ui-runc__context { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-runc__ring { width: var(--tc-space-4); height: var(--tc-space-4); transform: rotate(-90deg); }
.ui-runc__ring-track { fill: none; stroke: var(--tc-border-default); stroke-width: 2.5; }
.ui-runc__ring-fill { fill: none; stroke: var(--tc-accent-solid); stroke-width: 2.5; stroke-linecap: round; transition: stroke-dasharray var(--tc-duration-base) var(--tc-ease-move); }
.ui-runc__context[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-runc__context[data-tone="warning"] .ui-runc__ring-fill { stroke: var(--tc-status-warning-solid); }
.ui-runc__context[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-runc__context[data-tone="danger"] .ui-runc__ring-fill { stroke: var(--tc-status-danger-solid); }
.ui-runc__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-runc__btn svg { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
.ui-runc__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-runc__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-runc__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-runc__btn--ghost { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
.ui-runc__btn--ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); box-shadow: none; }
.ui-runc__round { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-radius-full); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-runc__round svg { width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-runc__round:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-runc__round--stop svg { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
/* ----- More ----- */
.ui-runc__more-wrap { position: relative; }
.ui-runc__pop { position: absolute; bottom: calc(100% + var(--tc-space-2)); left: 0; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-2); padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
.ui-runc__pop[hidden] { display: none; }
@keyframes ui-runc-pulse { 50% { opacity: 0.35; } }
@media (forced-colors: active) {
  .ui-runc__ring-fill { stroke: CanvasText; }
  .ui-runc__mode[aria-checked="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-runc__pulse { animation: none; }
  .ui-runc__mode, .ui-runc__ring-fill { transition: none; }
}
`;
}

if (!customElements.get("tc-run-controls")) customElements.define("tc-run-controls", TcRunControls);

declare global {
  interface HTMLElementTagNameMap {
    "tc-run-controls": TcRunControls;
  }
}
