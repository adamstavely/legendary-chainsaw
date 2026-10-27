import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { OffScreenController, ToolbarController } from "./internal/controllers";
import type { Look } from "./internal/look";
import "./voice-orb";

/*
 * <tc-voice-mode> – a spoken conversation with the model. The voice orb shows what the assistant is doing (idle,
 * listening, thinking, speaking); under it every turn is captioned as it's spoken – the words so far while a turn is
 * still coming in, then the finished text. A toolbar holds Mute, Captions, Interrupt and End.
 *
 *   <tc-voice-mode state="listening" .turns=${turns} .level=${0.4}></tc-voice-mode>
 *
 * The audio is the app's: the element shows `state`, `turns` and `level` and fires tc-interrupt and tc-end; `muted`
 * and `captions` are values with cancelable tc-muted-change / tc-captions-change events. Screen readers hear each turn
 * once it's finished ("Atlas: …") through a polite status region – never word by word while it streams in. The
 * caption list itself is not a live region.
 *
 * Keyboard: the controls are a toolbar – Tab reaches it once, ← → Home End move between its buttons. Esc anywhere
 * in the element interrupts while the assistant thinks or speaks.
 */

export type VoiceModeState = "idle" | "listening" | "thinking" | "speaking";

/** One turn of the conversation */
export type VoiceTurn = {
  id: string;
  role: "user" | "assistant";
  /** What was said so far */
  text: string;
  /** Still coming in (streaming speech recognition or speech) – shown with a caret, announced once it's done */
  partial?: boolean;
};

/** The line under the orb for each state, and while muted */
export type VoiceModeLabels = Partial<Record<VoiceModeState | "muted", string>>;

const LABELS: Record<VoiceModeState | "muted", string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  muted: "Muted",
};
const ORB_SIZE: Record<Look, number> = { standard: 148, clean: 128 };
/** Within this many px of the end, the caption list keeps following new words */
const STICK = 24;

/* ---------- Icons: Standard 24px outlines, Clean 16px thin lines ---------- */

const PATHS = {
  standard: {
    mic: "M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3ZM6 11.5a6 6 0 0 0 12 0M12 17.5v3",
    slash: "M4.5 4.5l15 15",
    captions: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM7.5 12.5h3M13.5 12.5h3M7.5 15.5h6",
    end: "M3.6 13.2c4.6-3.9 12.2-3.9 16.8 0 .4.4.5 1 .1 1.5l-1.3 1.6a1.1 1.1 0 0 1-1.4.3l-2.1-1.1a1.1 1.1 0 0 1-.6-1v-1.4a11.4 11.4 0 0 0-6.2 0v1.4c0 .4-.2.8-.6 1l-2.1 1.1a1.1 1.1 0 0 1-1.4-.3l-1.3-1.6a1.1 1.1 0 0 1 .1-1.5Z",
  },
  clean: {
    mic: "M8 2a2 2 0 0 1 2 2v3.5a2 2 0 0 1-4 0V4a2 2 0 0 1 2-2ZM4 7.5a4 4 0 0 0 8 0M8 11.5v2.5",
    slash: "M2.5 2.5l11 11",
    captions: "M2 4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5zM4.5 8.5h2M9 8.5h2.5M4.5 10.5h4",
    end: "M1.9 8.6c3.4-2.9 8.8-2.9 12.2 0 .3.3.3.7.1 1l-.9 1.2a.8.8 0 0 1-1 .2l-1.6-.8a.8.8 0 0 1-.4-.7v-1a8.3 8.3 0 0 0-4.6 0v1a.8.8 0 0 1-.4.7l-1.6.8a.8.8 0 0 1-1-.2l-.9-1.2a.8.8 0 0 1 .1-1Z",
  },
};
const icon = (look: Look, ...d: string[]) =>
  html`<svg viewBox=${look === "clean" ? "0 0 16 16" : "0 0 24 24"} class="ui-vm__glyph" aria-hidden="true">${d.map((p) => svg`<path d=${p}></path>`)}</svg>`;

/**
 * A voice conversation: the orb, live captions for every turn, and Mute, Captions, Interrupt and End.
 * @tag tc-voice-mode
 * @fires tc-muted-change - Mute was switched (`{ muted: boolean }`); cancelable – prevent it to keep `muted` (controlled use)
 * @fires tc-captions-change - Captions were shown or hidden (`{ captions: boolean }`); cancelable
 * @fires tc-interrupt - Interrupt was pressed (or Esc) while the assistant thinks or speaks; detail: null
 * @fires tc-end - End was pressed; detail: null
 */
export class TcVoiceMode extends TcElement {
  static override ui = "vm";

  /** What the assistant is doing: idle · listening · thinking · speaking */
  @property() accessor state: VoiceModeState = "idle";
  /** The conversation so far, oldest first. A turn still coming in has `partial` set */
  @property({ attribute: false }) accessor turns: VoiceTurn[] = [];
  /** Input or output loudness from 0 to 1, for the orb – unset, the orb fakes a natural level */
  @property({ type: Number }) accessor level: number | undefined = undefined;
  /** The microphone is muted. Changed by the element unless a tc-muted-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor muted = false;
  /** The captions are shown. Changed by the element unless a tc-captions-change listener calls preventDefault() */
  @property({ attribute: false }) accessor captions = true;
  /** A title over the orb – unset, there's none */
  @property() accessor heading = "";
  /** The assistant's name on its turns and in what screen readers hear */
  @property() accessor name = "Assistant";
  /** The person's name on their turns */
  @property({ attribute: "user-name" }) accessor userName = "You";
  /** Shown while there are no turns yet */
  @property() accessor placeholder = "Start talking – your words show up here.";
  /** The line under the orb, per state and while muted */
  @property({ attribute: false }) accessor labels: VoiceModeLabels = {};

  /** @internal What screen readers hear: finished turns, one update per change */
  @state() accessor said = "";

  private announced = new Set<string>();
  private stick = true;

  constructor() {
    super();
    // The caret and the state dots pulse – paused while the element is scrolled away
    new OffScreenController(this, () => this.state !== "idle" || this.turns.some((t) => t.partial));
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.canInterrupt) {
        e.stopPropagation();
        this.interrupt();
      }
    });
  }

  private get canInterrupt() {
    return this.state === "speaking" || this.state === "thinking";
  }
  private get list() {
    return this.querySelector<HTMLElement>(".ui-vm__captions");
  }
  private get tools() {
    return [...this.querySelectorAll<HTMLButtonElement>(".ui-vm__bar button")];
  }

  /* ---------- Values and actions ---------- */

  private toggleMuted() {
    const next = !this.muted;
    if (this.emit("tc-muted-change", { muted: next }, { cancelable: true })) this.muted = next;
  }
  private toggleCaptions() {
    const next = !this.captions;
    if (this.emit("tc-captions-change", { captions: next }, { cancelable: true })) this.captions = next;
  }
  private interrupt() {
    if (this.canInterrupt) this.emit("tc-interrupt", null);
  }
  private end() {
    this.emit("tc-end", null);
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.state = this.state;
    if (changed.has("turns")) {
      // Turns that were already there when the element first rendered aren't read out again
      const fresh = this.turns.filter((t) => !t.partial && t.text.trim() && !this.announced.has(t.id));
      for (const t of fresh) this.announced.add(t.id);
      if (this.hasUpdated && fresh.length) this.said = fresh.map((t) => `${t.role === "user" ? this.userName : this.name}: ${t.text.trim()}`).join(" ");
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    // The captions follow the newest words – unless someone scrolled up to read
    const list = this.list;
    if (list && (changed.has("turns") || changed.has("captions")) && this.stick) list.scrollTop = list.scrollHeight;
  }

  private onScroll = (e: Event) => {
    const el = e.currentTarget as HTMLElement;
    this.stick = el.scrollHeight - el.scrollTop - el.clientHeight <= STICK;
  };

  /* ---------- Toolbar keyboard (WAI-ARIA toolbar: one tab stop, arrows move) ---------- */

  private toolbar = new ToolbarController(this, { items: () => this.tools });

  /* ---------- Render ---------- */

  private renderTurn(t: VoiceTurn) {
    const who = t.role === "user" ? this.userName : this.name;
    return html`<li class="ui-vm__turn" data-role=${t.role} ?data-partial=${!!t.partial}>
      <span class="ui-vm__who">${who}</span>
      <p class="ui-vm__text">${t.text}${t.partial ? html`<span class="ui-vm__caret" aria-hidden="true"></span>` : nothing}</p>
    </li>`;
  }

  private renderBar(look: Look) {
    const p = PATHS[look];
    const canInterrupt = this.canInterrupt;
    return html`<div class="ui-vm__bar" role="toolbar" aria-label="Voice controls" @keydown=${this.toolbar.onKeyDown} @focusin=${this.toolbar.onFocusIn}>
      <div class="ui-vm__toggles">
        <button type="button" class="ui-vm__tool" aria-label="Mute" aria-pressed=${this.muted ? "true" : "false"} @click=${() => this.toggleMuted()}>
          ${this.muted ? icon(look, p.mic, p.slash) : icon(look, p.mic)}
        </button>
        <button type="button" class="ui-vm__tool" aria-label="Captions" aria-pressed=${this.captions ? "true" : "false"} @click=${() => this.toggleCaptions()}>
          ${icon(look, p.captions)}
        </button>
      </div>
      <div class="ui-vm__actions">
        <button
          type="button"
          class="ui-vm__interrupt"
          aria-disabled=${canInterrupt ? "false" : "true"}
          aria-keyshortcuts="Escape"
         
          @click=${() => this.interrupt()}
        ><span class="ui-vm__stop" aria-hidden="true"></span>Interrupt</button>
        <button type="button" class="ui-vm__end" @click=${() => this.end()}>${icon(look, p.end)}End</button>
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const label = this.muted && this.state === "listening" ? (this.labels.muted ?? LABELS.muted) : (this.labels[this.state] ?? LABELS[this.state]);
    // Muted, the orb hears nothing
    const level = this.muted && this.state === "listening" ? 0 : this.level;
    const turns = this.turns;
    const body = html`<div class="ui-vm__body">
      ${this.heading ? html`<h3 class="ui-vm__heading">${this.heading}</h3>` : nothing}
      <div class="ui-vm__stage">
        <tc-voice-orb class="ui-vm__orb" aria-hidden="true" state=${this.state} .level=${level} size=${ORB_SIZE[look]} .label=${false}></tc-voice-orb>
        ${keyed(
          label,
          html`<p class="ui-vm__state">${label}${this.state !== "idle" && !(this.muted && this.state === "listening")
              ? html`<span class="ui-vm__dots" aria-hidden="true"><i></i><i></i><i></i></span>`
              : nothing}</p>`,
        )}
      </div>
      ${this.captions
        ? html`<div class="ui-vm__captions" role="region" aria-label="Captions" tabindex="0" @scroll=${this.onScroll}>
            ${turns.length
              ? html`<ol class="ui-vm__turns">${repeat(turns, (t) => t.id, (t) => this.renderTurn(t))}</ol>`
              : html`<p class="ui-vm__empty">${this.placeholder}</p>`}
          </div>`
        : nothing}
    </div>`;
    return html`
      ${clean ? html`<div class="ui-vm__card">${body}${this.renderBar(look)}</div>` : html`<div class="ui-vm__card">${body}</div>${this.renderBar(look)}`}
      <span class="ui-vm__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Theme: the tokens' light-dark() values follow color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="vm"] {
  /* One blink of the state dots; they blink four times per state and then stay lit (WCAG 2.2.2) */
  --tc-voice-mode-blink: var(--tc-duration-reveal-slow);
  /* The orb's moving dots */
  --tc-voice-orb-accent: var(--tc-accent);
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 420px;
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}
/* Standard: a white card on a gray tray; the controls sit on the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="vm"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-relaxed);
  color: var(--tc-text-secondary);
}
/* Clean: one white card with hairline shadows; the controls are its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="vm"] {
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
}
[data-ui="vm"] *, [data-ui="vm"] *::before, [data-ui="vm"] *::after { box-sizing: border-box; }
:where([data-ui="vm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="vm"]) svg { display: block; flex: none; }
[data-ui="vm"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-vm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.ui-vm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__card { background: var(--tc-surface-on-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__body { padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__body { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
.ui-vm__heading { margin: 0; color: var(--tc-title-color); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); }

/* ----- The orb and the state under it ----- */
.ui-vm__stage { display: grid; justify-items: center; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__stage { padding: var(--tc-space-2) 0 var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__stage { padding: var(--tc-space-2) 0 var(--tc-space-3); }
.ui-vm__state { display: inline-flex; align-items: baseline; margin: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); white-space: nowrap; animation: ui-vm-in var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
[data-ui="vm"]:is([data-state="listening"], [data-state="speaking"]):not([muted]) .ui-vm__state { color: var(--tc-text-primary); }
[data-ui="vm"][muted][data-state="listening"] .ui-vm__state { color: var(--tc-status-danger-fg); }
.ui-vm__dots { display: inline-flex; gap: var(--tc-space-0-5); margin-left: var(--tc-space-0-5); }
.ui-vm__dots i { width: 2.5px; height: 2.5px; border-radius: 50%; background: currentColor; animation: ui-vm-blink var(--tc-voice-mode-blink) var(--tc-ease-standard) 4; }
.ui-vm__dots i:nth-child(2) { animation-delay: var(--tc-duration-fast); }
.ui-vm__dots i:nth-child(3) { animation-delay: var(--tc-duration-slow); }

/* ----- Captions: one line per turn, the newest at the bottom ----- */
.ui-vm__captions {
  max-height: 216px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  border-radius: var(--tc-radius-md);
  -webkit-mask: linear-gradient(transparent, #000 16px);
  mask: linear-gradient(transparent, #000 16px);
}
.ui-vm__captions:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); -webkit-mask: none; mask: none; }
.ui-vm__turns { display: grid; gap: var(--tc-space-3); margin: 0; padding: var(--tc-space-3) 0 0; list-style: none; }
.ui-vm__turn { display: grid; gap: var(--tc-space-0-5); animation: ui-vm-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-vm__who { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-vm__text { margin: 0; overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__text { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__turn[data-role="assistant"] .ui-vm__text { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__text { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__turn[data-role="assistant"] .ui-vm__text { color: var(--tc-text-strong); }
/* Words still coming in are quieter */
.ui-vm__turn[data-partial] .ui-vm__text { color: var(--tc-text-muted); }
.ui-vm__empty { margin: 0; padding: var(--tc-space-3) 0 var(--tc-space-1); text-align: center; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__caret {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: var(--tc-space-1);
  border-radius: 50%;
  background: var(--tc-text-primary);
  vertical-align: 0.05em;
  animation: ui-vm-pulse var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-vm__caret {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: var(--tc-space-1);
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-accent);
  vertical-align: 0.1em;
  animation: ui-vm-pulse-clean var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite;
}
[data-ui="vm"][data-offscreen] :is(.ui-vm__caret, .ui-vm__dots i) { animation-play-state: paused; }

/* ----- Controls: a toolbar. Mute and Captions on the left; Interrupt and End on the right ----- */
.ui-vm__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__bar { height: 48px; padding: 0 var(--tc-space-1) 0 var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__bar { height: 48px; padding: 0 var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-vm__toggles, .ui-vm__actions { display: flex; align-items: center; gap: var(--tc-space-1); }
.ui-vm__actions { gap: var(--tc-space-1-5); }
.ui-vm__tool {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-vm__tool { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__tool:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__tool { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__tool:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* Captions on: the selected fill with a ≥ 3:1 ring and the accent */
.ui-vm__tool[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
/* Muted is a warning, not a choice: red, so it's never missed */
.ui-vm__tool[aria-label="Mute"][aria-pressed="true"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__glyph { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }

.ui-vm__interrupt, .ui-vm__end {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-vm__interrupt { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-vm__interrupt:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-vm__interrupt[aria-disabled="true"] { color: var(--tc-text-disabled); box-shadow: var(--tc-action-secondary-shadow); cursor: default; }
.ui-vm__stop { width: 8px; height: 8px; margin: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); background: currentColor; }
/* End: the library's destructive button – a red label on a light red fill */
.ui-vm__end { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-vm__end:hover { background: color-mix(in srgb, var(--tc-status-danger-bg) 88%, var(--tc-status-danger-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-vm__end .ui-vm__glyph { fill: currentColor; stroke: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-vm__end .ui-vm__glyph { fill: currentColor; stroke: none; }

@keyframes ui-vm-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes ui-vm-blink { 0%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
@keyframes ui-vm-pulse { 50% { transform: scale(0.6); opacity: 0.45; } }
@keyframes ui-vm-pulse-clean { 50% { opacity: 0.3; } }

/* Narrow: a little less room around the content and the buttons */
@container (max-width: 340px) {
  :where([data-look="standard"], [data-look="standard"] *).ui-vm__body { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
  .ui-vm__interrupt, .ui-vm__end { padding: 0 var(--tc-control-px-sm); }
}
@media (hover: none) and (pointer: coarse) {
  .ui-vm__tool { width: var(--tc-control-h-lg); height: var(--tc-control-h-lg); }
  .ui-vm__interrupt, .ui-vm__end { height: var(--tc-control-h-lg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="vm"] *, [data-ui="vm"] *::before, [data-ui="vm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-voice-mode")) customElements.define("tc-voice-mode", TcVoiceMode);

declare global {
  interface HTMLElementTagNameMap {
    "tc-voice-mode": TcVoiceMode;
  }
}
