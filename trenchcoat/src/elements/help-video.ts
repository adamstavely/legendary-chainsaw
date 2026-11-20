import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { ModalController } from "./internal/modal";

/*
 * <tc-help-video> – point-in-time help: a small film-frame icon that sits beside a heading, a field label or a
 * toolbar, and opens one short tutorial in a modal player. Sprinkle one wherever a feature needs showing rather than
 * telling; each carries its own video.
 *   · the icon is a single film cell – sprocket holes along the top and bottom and a play mark punched through – in
 *     the text colour, sized to the text around it (`size`: sm, md or lg); a tooltip names the video and its length
 *   · `label` puts words beside the icon ("Watch how") for places where an icon alone is too quiet
 *   · once watched, a small check sits on the icon's corner; a file that plays to its end sets it
 *     (tc-watched-change), and a page can set `watched` itself – e.g. for an embed, or from what it stored
 *   · the player plays a file (`src`, with an optional WebVTT `captions` track) or an embed (`embed`, an iframe URL
 *     from a video host); with neither it says the video can't be played here. Chapters jump within a file
 *   · `open` is the page's to own (tc-open-change, cancelable – a page with its own player prevents it)
 *   · Escape, Close or a click outside shuts it, and focus goes back to the icon
 * The icon looks the same in Standard and Clean; the player is a card in both.
 *
 *   <h2>Alert queue <tc-help-video heading="Triage the alert queue" duration="125" src="/help/queue.mp4"></tc-help-video></h2>
 */

export type HelpVideoChapter = {
  /** Where it starts, in seconds */
  time: number;
  title: string;
};
export type HelpVideoSize = "sm" | "md" | "lg";
export type HelpVideoOpenChange = { open: boolean };
export type HelpVideoWatchedChange = { watched: boolean };

/** The element's words, every one renameable through `labels` */
export type HelpVideoLabels = {
  watch: string;
  watched: string;
  kicker: string;
  close: string;
  chapters: string;
  unavailable: string;
  finished: string;
  again: string;
  done: string;
};
export const defaultHelpVideoLabels: HelpVideoLabels = {
  watch: "Watch video",
  watched: "Watched",
  kicker: "Help video",
  close: "Close",
  chapters: "Chapters",
  unavailable: "This video can't be played here.",
  finished: "Finished",
  again: "Watch again",
  done: "Done",
};

/** m:ss, or h:mm:ss past an hour, from seconds */
export function helpVideoTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
const CROSS = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const AGAIN = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;
const HOLES = [3.6, 8.1, 12.6, 17.1];
let instances = 0;

/**
 * Point-in-time help: a small film-frame icon to put beside a heading or label, opening one short tutorial in a modal player with captions and chapters.
 * @tag tc-help-video
 * @fires tc-open-change - The player was opened or closed ({ open }: HelpVideoOpenChange); cancelable – prevented, `open` stays as it was
 * @fires tc-watched-change - The video played to its end ({ watched }: HelpVideoWatchedChange); cancelable – prevented, `watched` stays as it was
 */
export class TcHelpVideo extends TcElement {
  static override ui = "hvd";

  /** The video's title – the tooltip, the player's heading and the icon's accessible name */
  @property() accessor heading = "";
  /** A line or two about what it shows, under the player */
  @property() accessor description: string | undefined = undefined;
  /** Its length in seconds, shown in the tooltip and the player */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** A video file the browser can play */
  @property() accessor src: string | undefined = undefined;
  /** The file's type, e.g. "video/mp4", when the URL doesn't say */
  @property() accessor type: string | undefined = undefined;
  /** The player's picture before it plays */
  @property() accessor poster: string | undefined = undefined;
  /** A WebVTT captions file for `src` */
  @property() accessor captions: string | undefined = undefined;
  /** The captions' language (default "en") */
  @property({ attribute: "captions-lang" }) accessor captionsLang = "en";
  /** An embed URL from a video host, played in an iframe instead of `src` */
  @property() accessor embed: string | undefined = undefined;
  /** Points in the video to jump to (with `src`) */
  @property({ attribute: false }) accessor chapters: HelpVideoChapter[] = [];
  /** Words beside the icon, e.g. "Watch how"; unset, the icon stands alone with a tooltip */
  @property() accessor label = "";
  /** The icon's size against the text around it: "sm" (1em), "md" (1.25em, the default) or "lg" (1.5em) */
  @property({ reflect: true }) accessor size: HelpVideoSize = "md";
  /** Whether it has been watched – a check on the icon. Set when a file plays to its end, unless a tc-watched-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor watched = false;
  /** Whether the player is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Start playing a file as soon as the player opens */
  @property({ type: Boolean }) accessor autoplay = true;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<HelpVideoLabels> = {};

  @state() private accessor time = 0;
  @state() private accessor ended = false;
  @state() private accessor announcement = "";
  private readonly uid = `tc-hvd-${++instances}`;
  private readonly modal = new ModalController(this, {
    dialog: () => this.querySelector<HTMLDialogElement>(".ui-hvd__dialog"),
    focus: () => this.player ?? this.querySelector<HTMLElement>(".ui-hvd__close"),
  });

  private get words(): HelpVideoLabels {
    return { ...defaultHelpVideoLabels, ...this.labels };
  }

  /** The <video> in the open player, when it plays a file */
  get player(): HTMLVideoElement | null {
    return this.querySelector<HTMLVideoElement>(".ui-hvd__screen video");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("open") && this.open) {
      this.time = 0;
      this.ended = false;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.modal.sync(this.open);
    if (changed.has("open") && this.open && this.autoplay && this.src) this.player?.play()?.catch(() => {});
  }

  private setOpen(open: boolean) {
    if (open === this.open) return;
    if (this.emit<HelpVideoOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  private finish() {
    this.ended = true;
    if (this.watched) return;
    if (this.emit<HelpVideoWatchedChange>("tc-watched-change", { watched: true }, { cancelable: true })) {
      this.watched = true;
      this.announcement = `${this.words.watched}: ${this.heading}`;
    }
  }

  private seek(t: number) {
    const p = this.player;
    if (!p) return;
    p.currentTime = t;
    p.play()?.catch(() => {});
  }

  private again() {
    this.ended = false;
    this.seek(0);
  }

  /** The film cell: a rounded frame with sprocket holes and a play mark cut out of it */
  private icon() {
    const mask = `${this.uid}-cut`;
    return html`<svg class="ui-hvd__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <mask id=${mask} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="white"></rect>
          ${HOLES.map((x) => svg`<rect x=${x} y="4.4" width="3.3" height="2.2" rx="0.7" fill="black"></rect><rect x=${x} y="17.4" width="3.3" height="2.2" rx="0.7" fill="black"></rect>`)}
          <path d="M10 9.4v5.2a.6.6 0 0 0 .9.52l4.4-2.6a.6.6 0 0 0 0-1.04l-4.4-2.6a.6.6 0 0 0-.9.52Z" fill="black"></path>
        </mask>
      </defs>
      <rect class="ui-hvd__cell" x="1.5" y="3" width="21" height="18" rx="3.2" mask=${`url(#${mask})`}></rect>
    </svg>`;
  }

  private renderScreen() {
    if (this.src)
      return html`<video
        controls
        playsinline
        preload="metadata"
        poster=${ifDefined(this.poster)}
        aria-label=${this.heading}
        @timeupdate=${(e: Event) => (this.time = (e.target as HTMLVideoElement).currentTime)}
        @ended=${() => this.finish()}
      >
        <source src=${this.src} type=${ifDefined(this.type)} />
        ${this.captions ? html`<track kind="captions" src=${this.captions} srclang=${this.captionsLang} label=${this.captionsLang} default />` : nothing}
      </video>`;
    if (this.embed)
      return html`<iframe src=${this.embed} title=${this.heading} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return html`<p class="ui-hvd__unavailable">${this.words.unavailable}</p>`;
  }

  private renderPlayer() {
    if (!this.open) return nothing;
    const w = this.words;
    const chapters = this.src ? this.chapters : [];
    const at = chapters.reduce((best, c, k) => (c.time <= this.time + 0.25 ? k : best), -1);
    return html`<div class="ui-hvd__panel">
      <div class="ui-hvd__bar">
        <div class="ui-hvd__heading">
          <p class="ui-hvd__kicker">${w.kicker}${this.duration != null ? ` · ${helpVideoTime(this.duration)}` : ""}${this.watched ? ` · ${w.watched}` : ""}</p>
          <h3 class="ui-hvd__name" id=${`${this.uid}-name`}>${this.heading}</h3>
        </div>
        <button type="button" class="ui-hvd__close" @click=${() => this.setOpen(false)}><svg viewBox="0 0 24 24" aria-hidden="true">${CROSS}</svg><span class="tc-sr-only">${w.close}</span></button>
      </div>
      <div class="ui-hvd__screen">${this.renderScreen()}</div>
      ${this.description || chapters.length
        ? html`<div class="ui-hvd__info">
            ${this.description ? html`<p class="ui-hvd__about" id=${`${this.uid}-about`}>${this.description}</p>` : nothing}
            ${chapters.length
              ? html`<div class="ui-hvd__chapters">
                  <p class="ui-hvd__chapters-head" id=${`${this.uid}-chapters`}>${w.chapters}</p>
                  <ol aria-labelledby=${`${this.uid}-chapters`}>
                    ${chapters.map(
                      (c, k) => html`<li>
                        <button type="button" class="ui-hvd__chapter" ?data-at=${k === at} aria-current=${k === at ? "true" : "false"} @click=${() => this.seek(c.time)}>
                          <span class="ui-hvd__chapter-time">${helpVideoTime(c.time)}</span> <span>${c.title}</span>
                        </button>
                      </li>`,
                    )}
                  </ol>
                </div>`
              : nothing}
          </div>`
        : nothing}
      ${this.ended
        ? html`<div class="ui-hvd__end">
            <span class="ui-hvd__done"><svg viewBox="0 0 24 24" aria-hidden="true">${CHECK}</svg>${w.finished}</span>
            <span class="ui-hvd__end-actions">
              <button type="button" class="tc-btn-sm ui-hvd__again" @click=${() => this.again()}><svg viewBox="0 0 24 24" aria-hidden="true">${AGAIN}</svg>${w.again}</button>
              <button type="button" class="tc-btn-sm ui-hvd__finish" @click=${() => this.setOpen(false)}>${w.done}</button>
            </span>
          </div>`
        : html`<div class="ui-hvd__gap"></div>`}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const length = this.duration != null ? helpVideoTime(this.duration) : "";
    const tip = [this.heading, length].filter(Boolean).join(" · ");
    return html`<button
        type="button"
        class="ui-hvd__trigger"
        aria-haspopup="dialog"
        ?data-labelled=${!!this.label}
        @click=${() => this.setOpen(true)}
      >
        <span class="ui-hvd__mark">${this.icon()}${this.watched ? html`<span class="ui-hvd__seen" aria-hidden="true"><svg viewBox="0 0 24 24">${CHECK}</svg></span>` : nothing}</span>
        ${this.label ? html`<span class="ui-hvd__label">${this.label}</span>` : nothing}
        <span class="tc-sr-only">${this.label ? "" : w.watch}: ${this.heading}${length ? `, ${length}` : ""}${this.watched ? `, ${w.watched}` : ""}</span>
        ${!this.label && tip ? html`<span class="ui-hvd__tip" aria-hidden="true">${tip}</span>` : nothing}
      </button>
      <dialog
        class="ui-hvd__dialog"
        aria-labelledby=${`${this.uid}-name`}
        aria-describedby=${ifDefined(this.open && this.description ? `${this.uid}-about` : undefined)}
        @cancel=${(e: Event) => {
          e.preventDefault();
          this.setOpen(false);
        }}
        @close=${() => {
          if (!this.modal.ownClose() && this.open) this.setOpen(false);
        }}
        @click=${(e: MouseEvent) => {
          // A click on the backdrop (the dialog itself, outside the panel) closes
          if (e.target === e.currentTarget) this.setOpen(false);
        }}
      >
        ${this.renderPlayer()}
      </dialog>
      <span class="tc-sr-only" role="status">${this.announcement}</span>`;
  }

  static override css = /* css */ `
/* The icon's size and colours, and the player's widest – override them on the element */
[data-ui="hvd"] {
  --tc-hvd-size: 1.25em; --tc-hvd-ink: var(--tc-text-secondary); --tc-hvd-ink-hover: var(--tc-text-primary);
  --tc-hvd-player: calc(var(--tc-space-16) * 12);
  position: relative; display: inline-flex; vertical-align: middle; font-weight: var(--tc-font-weight-regular); text-align: left;
}
[data-ui="hvd"][size="sm"] { --tc-hvd-size: 1em; }
[data-ui="hvd"][size="lg"] { --tc-hvd-size: 1.5em; }
[data-ui="hvd"] *, [data-ui="hvd"] *::before, [data-ui="hvd"] *::after { box-sizing: border-box; }
[data-ui="hvd"] :where(p, ol, h3) { margin: 0; }
[data-ui="hvd"] :where(ol) { padding: 0; list-style: none; }

/* The trigger: the icon on a hit area of at least 24 px, which doesn't push the line apart */
.ui-hvd__trigger { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: var(--tc-space-6); min-height: var(--tc-space-6); margin: calc(var(--tc-space-1) * -1) 0; padding: 0 var(--tc-space-0-5); border: 0; border-radius: var(--tc-radius-sm); background: transparent; color: var(--tc-hvd-ink); font: inherit; line-height: var(--tc-line-height-none); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hvd__trigger:hover { color: var(--tc-hvd-ink-hover); }
.ui-hvd__trigger:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hvd__trigger[data-labelled] { padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-surface-tray); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-hvd__trigger[data-labelled]:hover { background: var(--tc-border-default); }
.ui-hvd__mark { position: relative; display: inline-grid; place-items: center; flex: none; width: var(--tc-hvd-size); height: var(--tc-hvd-size); }
.ui-hvd__trigger[data-labelled] .ui-hvd__mark { width: calc(var(--tc-hvd-size) * 1.15); height: calc(var(--tc-hvd-size) * 1.15); }
.ui-hvd__icon { display: block; width: 100%; height: 100%; overflow: visible; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hvd__cell { fill: currentColor; }
.ui-hvd__trigger:hover .ui-hvd__icon { transform: scale(1.08) rotate(-4deg); }
.ui-hvd__seen { position: absolute; right: -22%; bottom: -18%; display: grid; place-items: center; width: 58%; height: 58%; border-radius: var(--tc-radius-full); background: var(--tc-status-success-fg); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-surface-raised); color: var(--tc-surface-raised); }
.ui-hvd__seen svg { width: 72%; height: 72%; fill: none; stroke: currentColor; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-hvd__label { white-space: nowrap; }
.ui-hvd__tip { position: absolute; left: 50%; bottom: calc(100% + var(--tc-space-1-5)); z-index: var(--tc-z-popover); width: max-content; max-width: calc(var(--tc-space-16) * 4); padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-family: var(--tc-font-sans); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); white-space: normal; text-align: center; pointer-events: none; opacity: 0; transform: translate(-50%, var(--tc-space-0-5)); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hvd__trigger:is(:hover, :focus-visible) .ui-hvd__tip { opacity: 1; transform: translate(-50%, 0); transition-delay: var(--tc-duration-moderate); }

/* The player */
.ui-hvd__dialog { width: min(var(--tc-hvd-player), 94vw); max-width: none; max-height: 92vh; margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); color: var(--tc-text-primary); box-shadow: var(--tc-shadow-overlay); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-normal); letter-spacing: normal; text-transform: none; }
.ui-hvd__dialog::backdrop { background: var(--tc-scrim); }
.ui-hvd__dialog:not([open]) { display: none; }
.ui-hvd__panel { display: grid; }
.ui-hvd__bar { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); }
.ui-hvd__heading { flex: 1 1 auto; min-width: 0; }
.ui-hvd__kicker { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-hvd__name { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-hvd__close { display: inline-grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-text-secondary); cursor: pointer; }
.ui-hvd__close:hover { background: var(--tc-surface-tray); color: var(--tc-text-primary); }
.ui-hvd__close svg, .ui-hvd__end svg { width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-hvd__screen { display: grid; place-items: center; aspect-ratio: 16 / 9; background: var(--tc-gray-950); }
.ui-hvd__screen :is(video, iframe) { display: block; width: 100%; height: 100%; border: 0; background: var(--tc-gray-950); }
.ui-hvd__unavailable { padding: var(--tc-space-4); color: var(--tc-gray-200); text-align: center; }
.ui-hvd__info { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) 0; }
.ui-hvd__about { color: var(--tc-text-secondary); }
.ui-hvd__chapters { display: grid; gap: var(--tc-space-1); }
.ui-hvd__chapters-head { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-hvd__chapters ol { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-hvd__chapter { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-radius-full); background: transparent; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-font-size-xs); cursor: pointer; }
.ui-hvd__chapter:hover { border-color: var(--tc-border-strong); }
.ui-hvd__chapter[data-at] { border-color: var(--tc-text-primary); background: var(--tc-text-primary); color: var(--tc-surface-raised); }
.ui-hvd__chapter-time { font-variant-numeric: tabular-nums; }
.ui-hvd__chapter:not([data-at]) .ui-hvd__chapter-time { color: var(--tc-text-secondary); }
.ui-hvd__gap { height: var(--tc-space-4); }
.ui-hvd__end { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
.ui-hvd__end-actions { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-hvd__done { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-success-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-hvd__finish { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
.ui-hvd__finish:hover { background: var(--tc-action-primary-bg-hover); }
@media (prefers-reduced-motion: reduce) {
  .ui-hvd__trigger, .ui-hvd__icon, .ui-hvd__tip { transition: none; }
  .ui-hvd__trigger:hover .ui-hvd__icon { transform: none; }
}
@media (forced-colors: active) {
  .ui-hvd__cell { fill: ButtonText; }
  .ui-hvd__seen { forced-color-adjust: none; background: Highlight; color: HighlightText; box-shadow: none; }
  .ui-hvd__chapter[data-at] { forced-color-adjust: none; background: Highlight; color: HighlightText; }
}
`;
}

if (!customElements.get("tc-help-video")) customElements.define("tc-help-video", TcHelpVideo);

declare global {
  interface HTMLElementTagNameMap {
    "tc-help-video": TcHelpVideo;
  }
}
