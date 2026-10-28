import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OffScreenController } from "./internal/controllers";
import { ifDefined } from "lit/directives/if-defined.js";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-live-view> – watch the agent's screen as it works (browser or computer use). The stream is the app's: an image
 * URL per frame (`src`), a <video>, <canvas> or <img> element (`source`), or any content slotted as
 * `slot="screen"`. On top of it the element draws what the agent does, from `actions` in the frame's own pixels:
 *   · one pointer – the arrow of Agent Cursors – that glides from action to action
 *   · a click presses the arrow in and a ring spreads from the point
 *   · typing and key presses show on a small flag next to the pointer, the text as it is typed
 *   · a scroll shows its direction on the flag
 * Under the screen a caption says what the step is ("Step 4 of 9 · Picking a date"). In the header: Live / Paused /
 * You're in control, and a toolbar with Pause (Resume) and Take over (Hand back). While you have control the
 * overlays step aside, the screen gets a ring, and a click on it reports where in the frame it landed
 * (tc-screen-click), for the app to forward. Clean has no tray – one white card with the header inside it.
 *
 *   <tc-live-view heading="Booking a table" src=${frameUrl} .actions=${actions} step="4" steps="9"></tc-live-view>
 *
 * `paused` and `control` change on their own; preventDefault() on tc-paused-change / tc-control-change keeps control.
 */

export type LiveViewActionKind = "move" | "click" | "type" | "key" | "scroll";

export type LiveViewAction = {
  id: string;
  kind: LiveViewActionKind;
  /** Where, in the frame's own pixels from its top-left corner. Type, key and scroll may leave it out – the pointer
   *  stays where it was */
  x?: number;
  y?: number;
  /** type: the text typed so far. key: the keys, e.g. "Enter" or "Mod+L" (Mod shows as ⌘) */
  text?: string;
  /** scroll: how far, in frame pixels – positive scrolls down */
  delta?: number;
  /** What the step is – the caption while this is the latest action that has one */
  caption?: string;
};

/** Who drives the screen: the agent, or you after Take over */
export type LiveViewControl = "agent" | "user";
export type LiveViewPausedChange = { paused: boolean };
export type LiveViewControlChange = { control: LiveViewControl };
/** Where a click on the screen landed while you have control, in frame pixels */
export type LiveViewScreenClick = { x: number; y: number };

type LiveViewTool = "pause" | "control";
type LiveState = "live" | "paused" | "user" | "ended" | "waiting";
const STATE_LABEL: Record<LiveState, string> = {
  live: "Live",
  paused: "Paused",
  user: "You're in control",
  ended: "Finished",
  waiting: "Connecting",
};
const DEFAULT_FRAME = { w: 1280, h: 800 };
const KEY_GLYPH: Record<string, string> = {
  mod: "⌘",
  cmd: "⌘",
  meta: "⌘",
  ctrl: "Ctrl",
  control: "Ctrl",
  shift: "⇧",
  alt: "⌥",
  option: "⌥",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  escape: "Esc",
  esc: "Esc",
  backspace: "⌫",
  space: "Space",
};
const keysOf = (text: string) =>
  text
    .split("+")
    .map((k) => k.trim())
    .filter(Boolean)
    .map(
      (k) =>
        KEY_GLYPH[k.toLowerCase()] ?? (k.length === 1 ? k.toUpperCase() : k),
    );
/** The last letters of a long text – what is being typed now */
const tail = (text: string) =>
  text.length > 30 ? `…${text.slice(-29)}` : text;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* ---------- Icons (Lucide, ISC – lucide.dev; the arrow from Agent Cursors) ---------- */
const pauseIcon = svg`<rect class="ui-lv__solid" x="6.5" y="4.5" width="3.5" height="15" rx="1"></rect><rect class="ui-lv__solid" x="14" y="4.5" width="3.5" height="15" rx="1"></rect>`;
const playIcon = svg`<path class="ui-lv__solid" d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8Z"></path>`;
/* A hand reaching for the pointer: take over */
const takeIcon = svg`<path d="M18 11V6a2 2 0 0 0-4 0v0"></path><path d="M14 10V4a2 2 0 0 0-4 0v2"></path><path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>`;
/* Back to the agent */
const backIcon = svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>`;
const icon = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-lv__icon" viewBox="0 0 24 24" aria-hidden="true">
    ${body}
  </svg>`;
const arrow = html`<svg
  class="ui-lv__arrow"
  viewBox="-2.186 -0.256 18.514 22.277"
  aria-hidden="true"
>
  ${svg`<path transform="rotate(21.37)" d="M13.92 4.07c1.69.66 3.03 1.18 3.94 1.68.46.25.87.53 1.16.86.31.35.51.79.48 1.29-.03.51-.27.92-.62 1.23-.33.3-.77.53-1.25.74-.96.4-2.36.78-4.12 1.26-.56.15-.98.27-1.26.37-.26.1-.38.18-.47.27-.09.09-.17.21-.27.47-.1.28-.22.7-.37 1.26-.48 1.76-.86 3.16-1.26 4.12-.2.49-.44.93-.74 1.25-.32.35-.72.6-1.23.62-.51.03-.94-.17-1.29-.48-.33-.29-.61-.7-.86-1.16-.5-.91-1.02-2.25-1.68-3.94L1.66 7.76C.96 5.99.41 4.59.16 3.51-.09 2.44-.12 1.39.63.63 1.39-.12 2.44-.09 3.51.16c1.08.25 2.48.8 4.25 1.5l6.16 2.41Z"></path>`}
</svg>`;
const scrollArrow = (down: boolean) =>
  html`<svg class="ui-lv__icon" viewBox="0 0 24 24" aria-hidden="true">
    ${down
      ? svg`<path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path>`
      : svg`<path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path>`}
  </svg>`;

let instances = 0;

/**
 * The agent's screen, live: its clicks and typing drawn on top, a caption per step, and Pause / Take over.
 * @tag tc-live-view
 * @slot screen - Your own stream (an element with `slot="screen"`) – it fills the screen, under the overlays
 * @fires tc-paused-change - Pause or Resume was pressed ({ paused }: LiveViewPausedChange); cancelable
 * @fires tc-control-change - Take over or Hand back was pressed ({ control }: LiveViewControlChange); cancelable
 * @fires tc-screen-click - While you have control, a click on the screen ({ x, y }: LiveViewScreenClick, frame pixels)
 */
export class TcLiveView extends TcElement {
  static override ui = "lv";

  /** What the agent did, oldest first, in the frame's pixels – the last one is where the pointer is now */
  @property({ attribute: false }) accessor actions: LiveViewAction[] = [];
  /** The latest frame as an image URL */
  @property() accessor src: string | undefined = undefined;
  /** The frame's text alternative, for `src` */
  @property() accessor alt = "The agent's screen";
  /** A live element to show instead – a <video>, <canvas> or <img> the app keeps drawing into (it is moved here) */
  @property({ attribute: false }) accessor source:
    | HTMLVideoElement
    | HTMLCanvasElement
    | HTMLImageElement
    | undefined = undefined;
  /** The frame's width in its own pixels – the actions' coordinate space. Unset: the image's, video's or canvas's own.
   *  The screen takes the frame's shape and the overlays follow it; give a stream of the same shape (a different one
   *  is letterboxed inside the frame, and actions land on the frame, not on the picture) */
  @property({ type: Number, attribute: "frame-width" }) accessor frameWidth:
    | number
    | undefined = undefined;
  /** The frame's height in its own pixels */
  @property({ type: Number, attribute: "frame-height" }) accessor frameHeight:
    | number
    | undefined = undefined;
  /** What the agent is doing overall – e.g. "Booking a table for four" */
  @property() accessor heading = "";
  /** The step's caption – unset uses the latest action's `caption` */
  @property() accessor caption: string | undefined = undefined;
  /** The step's number, from 1 */
  @property({ type: Number }) accessor step: number | undefined = undefined;
  /** How many steps there are, when known */
  @property({ type: Number }) accessor steps: number | undefined = undefined;
  /** The name on the pointer's flag – e.g. "Operator"; unset shows the flag only for typing, keys and scrolls */
  @property() accessor agent = "";
  /** The pointer's color – defaults to the accent */
  @property() accessor color: string | undefined = undefined;
  /** The agent is paused – the screen dims and says so */
  @property({ type: Boolean, reflect: true }) accessor paused = false;
  /** Who drives the screen; "user" after Take over */
  @property({ reflect: true }) accessor control: LiveViewControl = "agent";
  /** The run is over: Finished, no pointer, no Pause or Take over */
  @property({ type: Boolean, reflect: true }) accessor ended = false;

  /** @internal The media's own size, when it has one */
  @state() accessor natural: { w: number; h: number } | null = null;
  /** @internal Whether a slot="screen" child is there */
  @state() accessor hasSlot = false;
  /** @internal The toolbar's tab stop, by name – the buttons come and go */
  @state() accessor tool: LiveViewTool = "pause";
  /** @internal The live region */
  @state() accessor announce = "";

  private readonly uid = `tc-lv${++instances}`;
  private mo?: MutationObserver;

  constructor() {
    super();
    // The waiting shimmer pauses while the view is scrolled away
    new OffScreenController(this, () => !this.hasMedia);
    this.addEventListener("click", this.onScreenClick);
  }

  override connectedCallback() {
    super.connectedCallback();
    // Slotted streams arrive whenever the framework renders them
    this.mo = new MutationObserver(() => this.syncSlot());
    this.mo.observe(this, { childList: true });
    this.addEventListener("load", this.measure, true);
    this.addEventListener("loadedmetadata", this.measure, true);
    this.addEventListener("resize", this.measure, true);
    this.syncSlot();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mo?.disconnect();
    this.mo = undefined;
    this.removeEventListener("load", this.measure, true);
    this.removeEventListener("loadedmetadata", this.measure, true);
    this.removeEventListener("resize", this.measure, true);
  }

  /** @internal */
  private get slotted() {
    return this.querySelector<HTMLElement>(':scope > [slot="screen"]');
  }

  /** @internal */
  private get hasMedia() {
    return !!(this.src || this.source || this.hasSlot);
  }

  /** @internal */
  private syncSlot() {
    const has = !!this.slotted;
    if (has !== this.hasSlot) this.hasSlot = has;
    this.measure();
  }

  /** @internal The media whose own size sets the frame, when no size is given */
  private media(): Element | null {
    const own = this.querySelector(
      ":scope > .ui-lv__screen > :is(img, video, canvas)",
    );
    if (own) return own;
    const slot = this.slotted;
    if (!slot) return null;
    return slot.matches("img, video, canvas, svg")
      ? slot
      : slot.querySelector(":scope > :is(img, video, canvas, svg)");
  }

  /** @internal */
  private measure = () => {
    const m = this.media();
    let w = 0;
    let h = 0;
    if (m instanceof HTMLImageElement)
      [w, h] = [m.naturalWidth, m.naturalHeight];
    else if (m instanceof HTMLVideoElement)
      [w, h] = [m.videoWidth, m.videoHeight];
    else if (m instanceof HTMLCanvasElement) [w, h] = [m.width, m.height];
    else if (m instanceof SVGSVGElement && m.viewBox.baseVal)
      [w, h] = [m.viewBox.baseVal.width, m.viewBox.baseVal.height];
    const next = w > 0 && h > 0 ? { w, h } : null;
    if (next?.w !== this.natural?.w || next?.h !== this.natural?.h)
      this.natural = next;
  };

  /** @internal The frame's coordinate space */
  private get frame() {
    return {
      w: this.frameWidth ?? this.natural?.w ?? DEFAULT_FRAME.w,
      h: this.frameHeight ?? this.natural?.h ?? DEFAULT_FRAME.h,
    };
  }

  /** @internal */
  private get liveState(): LiveState {
    if (this.ended) return "ended";
    if (this.control === "user") return "user";
    if (this.paused) return "paused";
    return this.hasMedia ? "live" : "waiting";
  }

  /** @internal The caption in force: the property, else the latest action's */
  private get shownCaption() {
    if (this.caption !== undefined) return this.caption;
    for (let i = this.actions.length - 1; i >= 0; i--)
      if (this.actions[i].caption) return this.actions[i].caption!;
    return "";
  }

  /** @internal */
  private get stepText() {
    if (this.step === undefined) return "";
    return this.steps
      ? `Step ${this.step} of ${this.steps}`
      : `Step ${this.step}`;
  }

  /** @internal Which toolbar buttons show */
  private get tools(): LiveViewTool[] {
    if (this.ended) return [];
    return this.control === "user" ? ["control"] : ["pause", "control"];
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // One polite line: each new step, and each change of who drives
    if (
      this.hasUpdated &&
      (changed.has("paused") || changed.has("control") || changed.has("ended"))
    ) {
      const s = this.liveState;
      this.announce =
        s === "user"
          ? "You're in control. The agent waits until you hand back."
          : s === "paused"
            ? "Paused."
            : s === "ended"
              ? `Finished. ${this.shownCaption}`
              : "The agent is working again.";
      return;
    }
    if (
      changed.has("actions") ||
      changed.has("caption") ||
      changed.has("step")
    ) {
      const caption = this.shownCaption;
      const text = [this.stepText, caption].filter(Boolean).join(": ");
      if (text && !this.announce.endsWith(text)) this.announce = text;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("src") || changed.has("source") || changed.has("hasSlot"))
      this.measure();
  }

  /** @internal */
  private togglePause() {
    const paused = !this.paused;
    if (
      this.emit<LiveViewPausedChange>(
        "tc-paused-change",
        { paused },
        { cancelable: true },
      )
    )
      this.paused = paused;
  }

  /** @internal */
  private toggleControl() {
    const control: LiveViewControl = this.control === "user" ? "agent" : "user";
    if (
      this.emit<LiveViewControlChange>(
        "tc-control-change",
        { control },
        { cancelable: true },
      )
    )
      this.control = control;
  }

  /** @internal APG toolbar: one tab stop, arrow keys move between the buttons */
  private onToolKey = (e: KeyboardEvent) => {
    const tools = this.tools;
    const n = tools.length;
    if (!n) return;
    const at = Math.max(0, tools.indexOf(this.tool));
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next: number;
    if (e.key in moves) next = (at + moves[e.key] + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    this.tool = tools[next];
    this.querySelector<HTMLButtonElement>(
      `.ui-lv__tools [data-tool="${tools[next]}"]`,
    )?.focus();
  };

  /** @internal While you have control, a click on the screen reports where it landed */
  private onScreenClick = (e: MouseEvent) => {
    if (this.control !== "user" || this.ended) return;
    const screen = this.querySelector<HTMLElement>(":scope > .ui-lv__screen");
    if (!screen) return;
    const r = screen.getBoundingClientRect();
    if (
      !r.width ||
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      return;
    const { w, h } = this.frame;
    this.emit<LiveViewScreenClick>("tc-screen-click", {
      x: Math.round(((e.clientX - r.left) / r.width) * w),
      y: Math.round(((e.clientY - r.top) / r.height) * h),
    });
  };

  /** @internal The pointer, its flag and the click ring */
  private overlay() {
    const actions = this.actions;
    const last = actions[actions.length - 1];
    if (!last || this.ended || this.control === "user") return nothing;
    let at: { x: number; y: number } | null = null;
    for (let i = actions.length - 1; i >= 0 && !at; i--) {
      const a = actions[i];
      if (a.x !== undefined && a.y !== undefined) at = { x: a.x, y: a.y };
    }
    if (!at) return nothing;
    const { w, h } = this.frame;
    const px = clamp01(at.x / w);
    const py = clamp01(at.y / h);
    const pos = styleMap({ "--x": String(px), "--y": String(py) });
    const flip = { x: px > 0.68, y: py > 0.84 };

    let flagBody: unknown = nothing;
    if (last.kind === "type")
      flagBody = html`<span class="ui-lv__typed"
        >${tail(last.text ?? "")}<span class="ui-lv__caret"></span
      ></span>`;
    else if (last.kind === "key")
      flagBody = html`<span class="ui-lv__keys"
        >${keysOf(last.text ?? "").map(
          (k) => html`<kbd class="ui-lv__kbd">${k}</kbd>`,
        )}</span
      >`;
    else if (last.kind === "scroll") {
      const down = (last.delta ?? 1) >= 0;
      flagBody = html`<span class="ui-lv__scroll"
        >${scrollArrow(down)}${down ? "Scrolling down" : "Scrolling up"}</span
      >`;
    }
    const showFlag = !!this.agent || flagBody !== nothing;

    return html`<div
        class="ui-lv__track"
        style=${pos}
        data-kind=${last.kind}
        ?data-flip-x=${flip.x}
        ?data-flip-y=${flip.y}
      >
        ${keyed(
          last.kind === "click" ? last.id : "rest",
          html`<span class="ui-lv__ptr" ?data-press=${last.kind === "click"}
            >${arrow}</span
          >`,
        )}
        ${showFlag
          ? html`<span class="ui-lv__flag"
              >${this.agent
                ? html`<span class="ui-lv__who">${this.agent}</span>`
                : nothing}${flagBody}</span
            >`
          : nothing}
      </div>
      ${last.kind === "click" && last.x !== undefined
        ? keyed(
            last.id,
            html`<div class="ui-lv__ring-track" style=${pos}>
              <span class="ui-lv__ring"></span>
            </div>`,
          )
        : nothing}`;
  }

  protected override render() {
    const { w, h } = this.frame;
    const live = this.liveState;
    const media = this.hasMedia;
    const caption = this.shownCaption;
    const stepText = this.stepText;
    const tools = this.tools;
    const stop = tools.includes(this.tool) ? this.tool : tools[0];
    const ratio = `${w} / ${h}`;
    const headingId = `${this.uid}-h`;

    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    const head = cardHead({
      icon: svg`<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path><path d="m10 7.5 4 2.5-4 2.5z"></path>`,
      title: this.heading || "Live view",
      id: headingId,
      aside: html`<span class="ui-lv__state" data-state=${live}
          ><span class="ui-lv__dot"></span>${STATE_LABEL[live]}</span
        >
        ${tools.length
          ? html`<div
              class="ui-lv__tools"
              role="toolbar"
              aria-label="Live view"
              @keydown=${this.onToolKey}
            >
              ${repeat(
                tools,
                (t) => t,
                (t) =>
                  t === "pause"
                    ? html`<button
                        type="button"
                        class="ui-lv__btn"
                        data-tool="pause"
                        tabindex=${t === stop ? 0 : -1}
                        @focus=${() => (this.tool = t)}
                        @click=${() => this.togglePause()}
                      >
                        ${icon(this.paused ? playIcon : pauseIcon)}${this.paused
                          ? "Resume"
                          : "Pause"}
                      </button>`
                    : html`<button
                        type="button"
                        class="ui-lv__btn ui-lv__btn--primary"
                        data-tool="control"
                        tabindex=${t === stop ? 0 : -1}
                        @focus=${() => (this.tool = t)}
                        @click=${() => this.toggleControl()}
                      >
                        ${icon(
                          this.control === "user" ? backIcon : takeIcon,
                        )}${this.control === "user" ? "Hand back" : "Take over"}
                      </button>`,
              )}
            </div>`
          : nothing}`,
    });

    return html`
      <div class="ui-lv__bar">${head}</div>
      <div class="ui-lv__card"></div>
      <div
        class="ui-lv__screen"
        role="group"
        aria-roledescription="live view"
        aria-label=${this.heading
          ? `The agent's screen – ${this.heading}`
          : "The agent's screen"}
        style=${styleMap({ aspectRatio: ratio })}
        ?data-empty=${!media}
      >
        ${this.source ??
        (this.src
          ? html`<img
              class="ui-lv__img"
              src=${ifDefined(safeMediaUrl(this.src))}
              alt=${this.alt}
              draggable="false"
            />`
          : nothing)}
        ${media
          ? nothing
          : html`<div class="ui-lv__wait">
              <span class="ui-lv__wait-shine"></span
              ><span class="ui-lv__wait-text"
                >Waiting for the agent's screen…</span
              >
            </div>`}
      </div>
      <div
        class="ui-lv__over"
        aria-hidden="true"
        data-state=${live}
        style=${styleMap({ "--tc-live-view-c": this.color })}
      >
        ${this.overlay()}
        ${live === "paused" || live === "user"
          ? html`<span class="ui-lv__badge" data-state=${live}
              >${icon(live === "paused" ? pauseIcon : takeIcon)}${live ===
              "paused"
                ? "Paused"
                : "You're in control"}</span
            >`
          : nothing}
      </div>
      <div class="ui-lv__cap">
        ${stepText
          ? html`<span class="ui-lv__step">${stepText}</span>`
          : nothing}
        ${keyed(
          caption,
          html`<span class="ui-lv__cap-text" ?data-empty=${!caption}
            >${caption ||
            (live === "ended" ? "Done" : "Waiting for the first step")}</span
          >`,
        )}
      </div>
      <span class="ui-lv__sr" role="status" aria-live="polite"
        >${this.announce}</span
      >
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="lv"] */
[data-ui="lv"] {
  /* The pointer's ink; the outline keeps it readable on any screen, light or dark */
  --tc-live-view-c: var(--tc-accent);
  --tc-live-view-outline: #ffffff;
  --tc-live-view-glide: var(--tc-duration-slower);
  /* The caret blinks a few times, then holds still (WCAG 2.2.2) */
  --tc-live-view-blink: 1100ms;
  /* A paused screen fades back under a wash */
  --tc-live-view-wash: light-dark(rgba(255, 255, 255, 0.45), rgba(0, 0, 0, 0.45));
  /* The screen sits inset in its card; its corners follow the card's */
  --tc-live-view-inset: var(--tc-space-1-5);
  --tc-live-view-screen-radius: calc(var(--tc-card-radius) - var(--tc-live-view-inset));
  position: relative;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "bar" "screen" "cap";
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-lv / inline-size;
}
/* Clean: no tray – one white card, the header inside it */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="lv"] {
  --tc-live-view-inset: var(--tc-space-2);
  --tc-live-view-screen-radius: var(--tc-radius-sm);
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="lv"] *, [data-ui="lv"] *::before, [data-ui="lv"] *::after { box-sizing: border-box; }
[data-ui="lv"] svg { display: block; flex: none; }
/* ----- The header's place in the grid; at its right the state and the toolbar ----- */
.ui-lv__bar { grid-area: bar; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__bar { border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-lv__state { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-lv__state[data-state="live"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-lv__state[data-state="user"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-lv__state[data-state="ended"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-lv__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-lv__state[data-state="paused"] .ui-lv__dot, .ui-lv__state[data-state="waiting"] .ui-lv__dot { background: var(--tc-text-muted); }
/* Live: the dot breathes a few times when the stream starts, then holds */
.ui-lv__state[data-state="live"] .ui-lv__dot { animation: ui-lv-breathe var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
.ui-lv__tools { display: flex; flex: none; gap: var(--tc-space-1-5); }
/* Pause / Take over: Button's secondary and primary – small on the tray, the default size in Clean */
.ui-lv__btn { appearance: none; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-control-px-sm) 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); letter-spacing: normal; color: var(--tc-action-secondary-fg); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__btn { height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-lv__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-lv__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-lv__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-lv__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-lv__btn:active { transform: scale(0.97); }
.ui-lv__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-lv__icon { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__icon { stroke-width: 1.4; }
/* The pause bars and the play triangle are solid shapes */
.ui-lv__icon .ui-lv__solid { fill: currentColor; stroke: none; }
/* ----- The card under the screen and the caption ----- */
.ui-lv__card { grid-row: 2 / 4; grid-column: 1; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__card { display: none; }
/* The screen, your stream (slot="screen") and the overlays share one cell, stacked */
.ui-lv__screen, [data-ui="lv"] > [slot="screen"], .ui-lv__over {
  grid-area: screen;
  min-width: 0;
  margin: var(--tc-live-view-inset) var(--tc-live-view-inset) 0;
  overflow: hidden;
  border-radius: var(--tc-live-view-screen-radius);
}
.ui-lv__screen { position: relative; display: grid; background: var(--tc-surface-sunken); }
.ui-lv__screen > :is(img, video, canvas) { display: block; width: 100%; height: 100%; object-fit: contain; }
[data-ui="lv"] > [slot="screen"] { position: relative; z-index: 1; display: block; }
[data-ui="lv"] > [slot="screen"] > :is(img, video, canvas, svg, iframe) { display: block; width: 100%; height: 100%; border: 0; object-fit: contain; }
/* Before the first frame: a soft sweep and a line */
.ui-lv__wait { position: relative; display: grid; place-items: center; overflow: hidden; }
.ui-lv__wait-text { position: relative; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-lv__wait-shine { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); transform: translateX(-100%); animation: ui-lv-sweep var(--tc-duration-shimmer) var(--tc-ease-in-out) 6; }
[data-ui="lv"][data-offscreen] .ui-lv__wait-shine { animation-play-state: paused; }
/* ----- The overlays: never in the way of the stream ----- */
.ui-lv__over { position: relative; z-index: 2; pointer-events: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), box-shadow var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-lv__over[data-state="paused"] { background: var(--tc-live-view-wash); }
/* You drive: a ring in the accent says the screen is yours */
.ui-lv__over[data-state="user"] { box-shadow: inset 0 0 0 2px var(--tc-accent); }
[data-ui="lv"][control="user"]:not([ended]) > :is(.ui-lv__screen, [slot="screen"]) { cursor: crosshair; }
/* A track as big as the screen, moved by the point's share of it – translate() of its own size is the screen's size */
.ui-lv__track, .ui-lv__ring-track { position: absolute; inset: 0; transform: translate(calc(var(--x) * 100%), calc(var(--y) * 100%)); }
.ui-lv__track { transition: transform var(--tc-live-view-glide) var(--tc-ease-move); animation: ui-lv-fade var(--tc-duration-moderate) var(--tc-ease-standard) both; }
/* Typing: the pointer holds still and the flag follows the text */
.ui-lv__ptr { position: absolute; top: -0.6px; left: -2.3px; display: block; transform-origin: 2px 1px; }
.ui-lv__arrow { width: 19px; height: 23px; overflow: visible; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28)); }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__arrow { width: 17px; height: 21px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.24)); }
.ui-lv__arrow path { fill: var(--tc-live-view-c); stroke: var(--tc-live-view-outline); stroke-width: 1.4; paint-order: stroke; }
/* A click: the arrow presses in around its tip once it arrives */
.ui-lv__ptr[data-press] { animation: ui-lv-press var(--tc-duration-moderate) var(--tc-ease-standard) var(--tc-live-view-glide) both; }
/* The ring spreads from the point once the pointer gets there */
.ui-lv__ring { position: absolute; top: -14px; left: -14px; width: 28px; height: 28px; border: 2px solid var(--tc-live-view-c); border-radius: 50%; opacity: 0.55; animation: ui-lv-ring var(--tc-duration-reveal) var(--tc-ease-out) var(--tc-live-view-glide) both; }
/* The flag: the name, what is typed, the keys or the scroll */
.ui-lv__flag { position: absolute; top: 21px; left: 14px; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); max-width: 260px; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-radius-md); background: var(--tc-surface-inverse); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: normal; color: var(--tc-text-on-inverse); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__flag { top: 19px; left: 13px; border-radius: var(--tc-radius-sm); font-weight: var(--tc-font-weight-regular); }
.ui-lv__track[data-flip-x] .ui-lv__flag { left: -6px; translate: -100% 0; }
.ui-lv__track[data-flip-y] .ui-lv__flag { top: -8px; translate: 0 -100%; }
.ui-lv__track[data-flip-x][data-flip-y] .ui-lv__flag { translate: -100% -100%; }
.ui-lv__who { flex: none; font-weight: var(--tc-font-weight-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__who { font-weight: var(--tc-font-weight-medium); }
.ui-lv__who + * { padding-left: var(--tc-space-1-5); border-left: 1px solid color-mix(in srgb, var(--tc-text-on-inverse) 24%, transparent); }
/* What is typed: the latest letters stay in view, the start fades out under a long text */
.ui-lv__typed { min-width: 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); white-space: pre; }
.ui-lv__caret { display: inline-block; width: 1.5px; height: 13px; background: currentColor; vertical-align: middle; animation: ui-lv-blink var(--tc-live-view-blink) steps(1, end) 4; }
.ui-lv__keys { display: inline-flex; gap: var(--tc-space-1); }
.ui-lv__kbd { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-on-inverse-bg); font: inherit; font-size: var(--tc-font-size-xs); }
.ui-lv__scroll { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-lv__scroll .ui-lv__icon { width: 12px; height: 12px; }
/* Paused / You're in control: a chip on top of the screen */
.ui-lv__badge { position: absolute; top: var(--tc-space-3); left: 50%; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3) 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-surface-inverse); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); letter-spacing: normal; color: var(--tc-text-on-inverse); white-space: nowrap; translate: -50% 0; animation: ui-lv-drop var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-lv__badge[data-state="user"] { background: var(--tc-accent); color: var(--tc-text-on-accent); }
.ui-lv__badge .ui-lv__icon { width: 12px; height: 12px; }
/* ----- The caption: the step's number, then what it is ----- */
.ui-lv__cap { grid-area: cap; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: 44px; padding: var(--tc-space-2) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-lv__cap { min-height: 40px; padding: var(--tc-space-2) var(--tc-space-3-5) var(--tc-space-2-5); }
.ui-lv__step { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-lv__step::after { content: "·"; margin-left: var(--tc-space-2); color: var(--tc-text-disabled); }
.ui-lv__cap-text { min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; animation: ui-lv-caption var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-lv__cap-text[data-empty] { color: var(--tc-text-muted); }
.ui-lv__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-lv-breathe { 50% { opacity: 0.35; } }
@keyframes ui-lv-sweep { to { transform: translateX(100%); } }
@keyframes ui-lv-fade { from { opacity: 0; } }
@keyframes ui-lv-press { 40% { transform: scale(0.8); } }
@keyframes ui-lv-ring { 0% { opacity: 0; transform: scale(0.3); } 1% { opacity: 0.9; } 100% { opacity: 0; transform: scale(1.6); } }
@keyframes ui-lv-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
@keyframes ui-lv-drop { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ui-lv-caption { from { opacity: 0; transform: translateY(3px); } }
/* Narrow: the header's state and toolbar wrap under the title; the caption stacks */
@container ui-lv (max-width: 380px) {
  .ui-lv__flag { max-width: 180px; }
  .ui-lv__cap { align-items: flex-start; flex-direction: column; gap: 0; padding-top: var(--tc-space-2); }
  .ui-lv__step { font-size: var(--tc-font-size-sm); }
  .ui-lv__step::after { content: none; }
  .ui-lv__cap-text { max-width: 100%; }
}
@media (pointer: coarse) {
  .ui-lv__btn { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="lv"] *, [data-ui="lv"] *::before, [data-ui="lv"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-live-view"))
  customElements.define("tc-live-view", TcLiveView);

declare global {
  interface HTMLElementTagNameMap {
    "tc-live-view": TcLiveView;
  }
}
