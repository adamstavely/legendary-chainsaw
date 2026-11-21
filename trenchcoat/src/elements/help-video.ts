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
 *   · `updated-on` (a date) puts a small dot on the icon's top-right corner for `new-days` days (14 by default), to say
 *     the video changed; opening it clears the dot (tc-update-seen-change), and a page passes `update-seen` back to
 *     keep it cleared
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
/** One line of the transcript */
export type HelpVideoCue = {
  /** Where it's said, in seconds */
  time: number;
  text: string;
};
export type HelpVideoSize = "sm" | "md" | "lg";
export type HelpVideoOpenChange = { open: boolean };
export type HelpVideoWatchedChange = { watched: boolean };
export type HelpVideoUpdateSeenChange = { updateSeen: boolean };

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
  transcript: string;
  download: string;
  transcriptLoading: string;
  transcriptError: string;
  updated: string;
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
  transcript: "Transcript",
  download: "Download transcript",
  transcriptLoading: "Loading the transcript…",
  transcriptError: "The transcript couldn't be loaded.",
  updated: "Updated",
};

const DAY = 86_400_000;

/** The seconds in a WebVTT timestamp – "01:02.500" or "1:01:02.500" */
function vttSeconds(stamp: string) {
  const parts = stamp.trim().split(":").map(Number);
  return parts.reduce((total, n) => total * 60 + n, 0);
}

/**
 * A WebVTT file's cues as transcript lines: each cue's start and its words, with tags such as <v Name> and <b>
 * removed and the lines of one cue joined. NOTE, STYLE and REGION blocks are skipped.
 */
export function parseHelpVideoVtt(vtt: string): HelpVideoCue[] {
  const cues: HelpVideoCue[] = [];
  for (const block of vtt.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0 || /^(NOTE|STYLE|REGION)\b/.test(lines[0] ?? "")) continue;
    const text = lines
      .slice(at + 1)
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) cues.push({ time: vttSeconds(lines[at]!.split("-->")[0]!), text });
  }
  return cues;
}

/** A transcript as plain text: the title, then each line with its time */
export function helpVideoTranscriptText(heading: string, cues: HelpVideoCue[]) {
  return `${heading ? `${heading}\n\n` : ""}${cues.map((c) => `[${helpVideoTime(c.time)}] ${c.text}`).join("\n")}\n`;
}

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
const LINES = svg`<path d="M4 6h16"></path><path d="M4 10h16"></path><path d="M4 14h10"></path><path d="M4 18h7"></path>`;
const SAVE = svg`<path d="M12 4v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path>`;
const HOLES =[3.6, 8.1, 12.6, 17.1];
let instances = 0;

/**
 * Point-in-time help: a small film-frame icon to put beside a heading or label, opening one short tutorial in a modal player with captions and chapters.
 * @tag tc-help-video
 * @fires tc-open-change - The player was opened or closed ({ open }: HelpVideoOpenChange); cancelable – prevented, `open` stays as it was
 * @fires tc-watched-change - The video played to its end ({ watched }: HelpVideoWatchedChange); cancelable – prevented, `watched` stays as it was
 * @fires tc-update-seen-change - The player was opened while the Updated dot showed ({ updateSeen }: HelpVideoUpdateSeenChange); cancelable – prevented, the dot stays
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
  /** The transcript's lines, `{ time, text }`. Unset, it's read from the `captions` file when first shown */
  @property({ attribute: false }) accessor transcript: HelpVideoCue[] | undefined = undefined;
  /** A transcript file to download instead of the text one made from the lines, e.g. a PDF */
  @property({ attribute: "transcript-file" }) accessor transcriptFile: string | undefined = undefined;
  /** When the video last changed, as a date ("2026-11-12"); for `new-days` days after it, a dot on the icon says so */
  @property({ attribute: "updated-on" }) accessor updatedOn: string | undefined = undefined;
  /** How many days after `updated-on` the dot shows (default 14) */
  @property({ type: Number, attribute: "new-days" }) accessor newDays = 14;
  /** Whether this person has seen the update – the dot is cleared. Set when the player opens, unless a tc-update-seen-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true, attribute: "update-seen" }) accessor updateSeen = false;
  /** The time to measure `new-days` from, in milliseconds; unset, the clock's */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<HelpVideoLabels> = {};

  @state() private accessor time = 0;
  @state() private accessor ended = false;
  @state() private accessor announcement = "";
  @state() private accessor reading = false;
  @state() private accessor loaded: HelpVideoCue[] | undefined = undefined;
  @state() private accessor loading: "idle" | "loading" | "error" = "idle";
  private loadingFrom: string | undefined;
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
    if (changed.has("captions") && changed.get("captions") !== undefined) {
      this.loaded = undefined;
      this.loading = "idle";
      this.loadingFrom = undefined;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.modal.sync(this.open);
    if (changed.has("open") && this.open && this.autoplay && this.src) this.player?.play()?.catch(() => {});
    // Keep the line being said in view – scrolling the transcript only, never the page
    if (this.reading && (changed.has("time") || changed.has("reading"))) {
      const list = this.querySelector<HTMLElement>(".ui-hvd__transcript");
      const now = list?.querySelector<HTMLElement>("[data-at]");
      if (list && now) {
        const top = now.offsetTop - list.offsetTop;
        if (top < list.scrollTop || top + now.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = Math.max(0, top - list.clientHeight / 3);
      }
    }
  }

  /** The transcript's lines: the ones given, or the ones read from the captions file */
  get transcriptCues(): HelpVideoCue[] | undefined {
    return this.transcript ?? this.loaded;
  }

  private get hasTranscript() {
    return !!(this.transcript?.length || this.transcriptFile || (this.captions && this.src));
  }

  /** Reads the captions file into transcript lines, once */
  private async loadTranscript(): Promise<HelpVideoCue[] | undefined> {
    if (this.transcript) return this.transcript;
    if (this.loaded) return this.loaded;
    const from = this.captions;
    if (!from || this.loadingFrom === from) return undefined;
    this.loadingFrom = from;
    this.loading = "loading";
    try {
      const res = await fetch(from);
      if (!res.ok) throw new Error(String(res.status));
      const cues = parseHelpVideoVtt(await res.text());
      if (this.captions !== from) return undefined;
      this.loaded = cues;
      this.loading = "idle";
      return cues;
    } catch {
      if (this.captions === from) {
        this.loading = "error";
        this.loadingFrom = undefined;
      }
      return undefined;
    }
  }

  private toggleTranscript() {
    this.reading = !this.reading;
    if (this.reading) void this.loadTranscript();
  }

  /** Saves the transcript as a text file */
  private async download() {
    const cues = await this.loadTranscript();
    if (!cues?.length) return;
    const url = URL.createObjectURL(new Blob([helpVideoTranscriptText(this.heading, cues)], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "help-video"}-transcript.txt`;
    a.hidden = true;
    this.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /** When the update was made, if it was in the last `new-days` days */
  private get recentUpdate(): Date | undefined {
    if (!this.updatedOn) return undefined;
    const at = new Date(this.updatedOn);
    if (Number.isNaN(at.getTime())) return undefined;
    return (this.now ?? Date.now()) < at.getTime() + this.newDays * DAY ? at : undefined;
  }

  /** Whether the Updated dot shows: a recent update this person hasn't opened yet */
  get showsUpdate(): boolean {
    return !!this.recentUpdate && !this.updateSeen;
  }

  private setOpen(open: boolean) {
    if (open === this.open) return;
    if (!this.emit<HelpVideoOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    if (open && this.showsUpdate && this.emit<HelpVideoUpdateSeenChange>("tc-update-seen-change", { updateSeen: true }, { cancelable: true })) this.updateSeen = true;
    this.open = open;
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

  /** The Transcript and Download buttons under the video, and the transcript when it's shown */
  private renderTranscript() {
    const w = this.words;
    const cues = this.transcriptCues;
    const panel = `${this.uid}-transcript`;
    const canMake = !!(this.transcript?.length || this.captions);
    const seekable = !!this.src;
    const at = cues ? cues.reduce((best, c, k) => (c.time <= this.time + 0.25 ? k : best), -1) : -1;
    return html`<div class="ui-hvd__tools">
        ${this.transcript?.length || this.captions
          ? html`<button type="button" class="ui-hvd__tool ui-hvd__show" aria-expanded=${this.reading ? "true" : "false"} aria-controls=${panel} @click=${() => this.toggleTranscript()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">${LINES}</svg>${w.transcript}
            </button>`
          : nothing}
        ${this.transcriptFile
          ? html`<a class="ui-hvd__tool ui-hvd__download" href=${this.transcriptFile} download><svg viewBox="0 0 24 24" aria-hidden="true">${SAVE}</svg>${w.download}</a>`
          : canMake
            ? html`<button type="button" class="ui-hvd__tool ui-hvd__download" @click=${() => void this.download()}><svg viewBox="0 0 24 24" aria-hidden="true">${SAVE}</svg>${w.download}</button>`
            : nothing}
      </div>
      ${this.reading && canMake
        ? html`<div class="ui-hvd__reader" id=${panel} role="region" aria-label=${w.transcript}>
            ${cues?.length
              ? html`<ol class="ui-hvd__transcript" tabindex="-1">
                  ${cues.map((c, k) =>
                    seekable
                      ? html`<li>
                          <button type="button" class="ui-hvd__cue" ?data-at=${k === at} aria-current=${k === at ? "true" : "false"} @click=${() => this.seek(c.time)}>
                            <span class="ui-hvd__cue-time">${helpVideoTime(c.time)}</span> <span>${c.text}</span>
                          </button>
                        </li>`
                      : html`<li class="ui-hvd__cue"><span class="ui-hvd__cue-time">${helpVideoTime(c.time)}</span> <span>${c.text}</span></li>`,
                  )}
                </ol>`
              : html`<p class="ui-hvd__reader-note" role="status">${this.loading === "error" ? w.transcriptError : this.loading === "loading" ? w.transcriptLoading : ""}</p>`}
          </div>`
        : nothing}`;
  }

  private renderPlayer() {
    if (!this.open) return nothing;
    const w = this.words;
    const chapters = this.src ? this.chapters : [];
    const at = chapters.reduce((best, c, k) => (c.time <= this.time + 0.25 ? k : best), -1);
    const updated = this.recentUpdate;
    return html`<div class="ui-hvd__panel">
      <div class="ui-hvd__bar">
        <div class="ui-hvd__heading">
          <p class="ui-hvd__kicker">${w.kicker}${this.duration != null ? ` · ${helpVideoTime(this.duration)}` : ""}${this.watched ? ` · ${w.watched}` : ""}${updated ? html` · <span class="ui-hvd__kicker-new">${w.updated} ${updated.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}</span>` : nothing}</p>
          <h3 class="ui-hvd__name" id=${`${this.uid}-name`}>${this.heading}</h3>
        </div>
        <button type="button" class="ui-hvd__close" @click=${() => this.setOpen(false)}><svg viewBox="0 0 24 24" aria-hidden="true">${CROSS}</svg><span class="tc-sr-only">${w.close}</span></button>
      </div>
      <div class="ui-hvd__screen">${this.renderScreen()}</div>
      ${this.hasTranscript ? this.renderTranscript() : nothing}
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
    const fresh = this.showsUpdate;
    const tip = [this.heading, length, fresh ? w.updated : ""].filter(Boolean).join(" · ");
    return html`<button
        type="button"
        class="ui-hvd__trigger"
        aria-haspopup="dialog"
        ?data-labelled=${!!this.label}
        @click=${() => this.setOpen(true)}
      >
        <span class="ui-hvd__mark">${this.icon()}${this.watched ? html`<span class="ui-hvd__seen" aria-hidden="true"><svg viewBox="0 0 24 24">${CHECK}</svg></span>` : nothing}${fresh ? html`<span class="ui-hvd__new" aria-hidden="true"></span>` : nothing}</span>
        ${this.label ? html`<span class="ui-hvd__label">${this.label}</span>` : nothing}
        <span class="tc-sr-only">${this.label ? "" : w.watch}: ${this.heading}${length ? `, ${length}` : ""}${this.watched ? `, ${w.watched}` : ""}${fresh ? `, ${w.updated}` : ""}</span>
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
  --tc-hvd-player: calc(var(--tc-space-16) * 12); --tc-hvd-dot: var(--tc-accent);
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
.ui-hvd__new { position: absolute; top: -10%; right: -10%; width: 30%; height: 30%; min-width: var(--tc-space-1); min-height: var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-hvd-dot); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-surface-raised); animation: tc-hvd-new var(--tc-duration-slow) var(--tc-ease-standard) 2; }
@keyframes tc-hvd-new { 50% { transform: scale(1.35); } }
.ui-hvd__kicker-new { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
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
.ui-hvd__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3) 0; }
.ui-hvd__tool { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); text-decoration: none; cursor: pointer; }
.ui-hvd__tool:hover { background: var(--tc-surface-tray); color: var(--tc-text-primary); }
.ui-hvd__tool[aria-expanded="true"] { background: var(--tc-surface-tray); color: var(--tc-text-primary); }
.ui-hvd__tool:focus-visible, .ui-hvd__cue:focus-visible, .ui-hvd__chapter:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hvd__tool svg { width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-hvd__download { margin-left: auto; }
.ui-hvd__reader { margin: var(--tc-space-2) var(--tc-space-4) 0; border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-hvd__transcript { display: grid; max-height: calc(var(--tc-space-16) * 3); padding: var(--tc-space-1); overflow-y: auto; overscroll-behavior: contain; }
.ui-hvd__cue { display: grid; grid-template-columns: calc(var(--tc-space-10)) 1fr; gap: var(--tc-space-2); width: 100%; margin: 0; padding: var(--tc-space-1) var(--tc-space-2); border: 0; border-radius: var(--tc-radius-sm); background: transparent; color: var(--tc-text-primary); font: inherit; text-align: left; }
button.ui-hvd__cue { cursor: pointer; }
button.ui-hvd__cue:hover { background: var(--tc-surface-tray); }
.ui-hvd__cue[data-at] { border-radius: 0 var(--tc-radius-sm) var(--tc-radius-sm) 0; background: var(--tc-surface-raised); box-shadow: inset var(--tc-space-0-5) 0 0 var(--tc-text-primary); }
.ui-hvd__cue-time { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; line-height: inherit; padding-top: var(--tc-space-0-5); }
.ui-hvd__reader-note { padding: var(--tc-space-3); color: var(--tc-text-secondary); }
.ui-hvd__reader-note:empty { display: none; }
.ui-hvd__gap { height: var(--tc-space-4); }
.ui-hvd__end { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
.ui-hvd__end-actions { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-hvd__done { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-success-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-hvd__finish { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); box-shadow: var(--tc-action-primary-shadow); }
.ui-hvd__finish:hover { background: var(--tc-action-primary-bg-hover); }
@media (prefers-reduced-motion: reduce) {
  .ui-hvd__trigger, .ui-hvd__icon, .ui-hvd__tip { transition: none; }
  .ui-hvd__trigger:hover .ui-hvd__icon { transform: none; }
  .ui-hvd__new { animation: none; }
}
@media (forced-colors: active) {
  .ui-hvd__cell { fill: ButtonText; }
  .ui-hvd__new { forced-color-adjust: none; background: Highlight; box-shadow: none; }
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
