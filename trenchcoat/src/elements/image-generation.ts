import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OffScreenController } from "./internal/controllers";
import { safeMediaUrl } from "./internal/safe-media";
import { copyText } from "./internal/util";

/*
 * <tc-image-generation> – one image while it's being made. Queued, it says its place in line; generating, the picture
 * resolves in its frame – an intermediate `preview` blurred less as the progress rises, or a soft field in the chart
 * colours with a grain that clears – over a bar with the step ("Step 18 of 30"), the percentage and the time left;
 * done, the image cross-fades in. Failed shows why with Try again; cancelled offers Start again. Under the frame: the
 * prompt (two lines, Show more for a long one), the model and size, and the actions for the state – Cancel while it
 * works; Download, Regenerate and Copy prompt when it's done.
 * Standard: the header on a gray tray, the frame and prompt on a white card, the actions on the tray below. Clean: one
 * white card, the header its first row and the actions its last.
 *
 *   <tc-image-generation heading="Report cover" prompt="…" status="generating" progress="0.4" step="12" steps="30"></tc-image-generation>
 *
 * The app owns the job: it sets `status`, `progress`, `step`, `src`… as the model reports, and answers tc-cancel,
 * tc-retry and tc-regenerate by starting or stopping work. Cancel, Download and Copy prompt are cancelable: unless
 * prevented, Cancel shows the card as cancelled, Download saves the image and Copy prompt copies it.
 * Nothing to arrow through: the buttons are in the tab order; Show more is a disclosure for the prompt.
 */

export type ImageGenerationStatus = "queued" | "generating" | "done" | "failed" | "cancelled";

export type ImageGenerationLabels = {
  queued: string;
  ready: string;
  failed: string;
  cancelled: string;
  cancel: string;
  retry: string;
  restart: string;
  download: string;
  regenerate: string;
  copyPrompt: string;
  copied: string;
  showMore: string;
  showLess: string;
};

/** The words used when the page gives none */
export const defaultImageGenerationLabels: ImageGenerationLabels = {
  queued: "Queued",
  ready: "Ready",
  failed: "Couldn't generate the image",
  cancelled: "Cancelled",
  cancel: "Cancel",
  retry: "Try again",
  restart: "Start again",
  download: "Download",
  regenerate: "Regenerate",
  copyPrompt: "Copy prompt",
  copied: "Copied",
  showMore: "Show more",
  showLess: "Show less",
};

/** Detail of tc-cancel: the state it was cancelled from */
export type ImageGenerationCancel = { status: ImageGenerationStatus };
/** Detail of tc-retry, tc-regenerate and tc-copy-prompt */
export type ImageGenerationRequest = { prompt: string };
/** Detail of tc-download */
export type ImageGenerationDownload = { src: string; filename: string };
/** Detail of tc-expanded-change: whether the whole prompt shows */
export type ImageGenerationExpandedChange = { expanded: boolean };

/** A prompt longer than this gets Show more */
const LONG_PROMPT = 120;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const known = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/** "16:9", "16/9", "1.5" → a CSS aspect-ratio; square when it can't be read */
export function parseAspectRatio(value: string | undefined): string {
  const m = String(value ?? "").match(/^\s*(\d*\.?\d+)\s*(?:[:/x×]\s*(\d*\.?\d+))?\s*$/);
  if (!m) return "1 / 1";
  const w = Number(m[1]);
  const h = m[2] === undefined ? 1 : Number(m[2]);
  return w > 0 && h > 0 ? `${w} / ${h}` : "1 / 1";
}

/** Seconds left in words: "about 12 s left", "about 2 min left", "a moment left" */
export function formatEta(seconds: number): string {
  if (!(seconds > 0)) return "a moment left";
  if (seconds < 60) return `about ${Math.max(1, Math.round(seconds))} s left`;
  return `about ${Math.round(seconds / 60)} min left`;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/** The file extension of an image URL: from a data: URL's type or the path, else png */
const extOf = (src: string) => {
  const data = src.match(/^data:image\/([\w.+-]+)/i);
  if (data) return data[1].toLowerCase().replace("svg+xml", "svg").replace("jpeg", "jpg");
  const path = src.split(/[?#]/)[0].match(/\.(png|jpe?g|webp|gif|avif|svg)$/i);
  return path ? path[1].toLowerCase().replace("jpeg", "jpg") : "png";
};
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "image";

/* ---------- Icons: 24px line glyphs (after Lucide, ISC) ---------- */

const glyph = (d: string, className = "") =>
  html`<svg viewBox="0 0 24 24" class=${["ui-igen__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  sparkle: "M12 3.5l1.9 5.1a1 1 0 0 0 .6.6l5 1.8-5 1.8a1 1 0 0 0-.6.6L12 18.5l-1.9-5.1a1 1 0 0 0-.6-.6l-5-1.8 5-1.8a1 1 0 0 0 .6-.6zM18.5 3v3M17 4.5h3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  stop: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5h5v5h-5z",
  regenerate: "M20 12a8 8 0 1 1-2.34-5.66L20 8.5M20 4v4.5h-4.5",
  download: "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14",
  copy: "M9 9h10v10H9zM5 15V5h10",
  check: "M5.5 12.5l4 4L18.5 8",
  x: "M6 6l12 12M18 6 6 18",
};

let instances = 0;

/**
 * One image while it's generated: queued, a picture that sharpens as it progresses with the step and time left, then the image – or why it failed.
 * @tag tc-image-generation
 * @fires tc-cancel - Cancel while queued or generating. Cancelable: unless prevented, the card shows as cancelled ({ status }: ImageGenerationCancel)
 * @fires tc-retry - Try again on a failed image; the app starts the job again ({ prompt }: ImageGenerationRequest)
 * @fires tc-regenerate - Regenerate on a done image, or Start again after a cancel; the app starts a new job ({ prompt }: ImageGenerationRequest)
 * @fires tc-download - Download on a done image. Cancelable: unless prevented, the image is saved ({ src, filename }: ImageGenerationDownload)
 * @fires tc-copy-prompt - Copy prompt. Cancelable: unless prevented, the prompt is copied ({ prompt }: ImageGenerationRequest)
 * @fires tc-expanded-change - Show more or Show less on a long prompt. Cancelable – prevented, `expanded` stays as it was ({ expanded }: ImageGenerationExpandedChange)
 */
export class TcImageGeneration extends TcElement {
  static override ui = "igen";

  /** Names the card – what the image is for */
  @property() accessor heading = "Image";
  /** Where the job is: "queued", "generating", "done", "failed" or "cancelled" */
  @property({ reflect: true }) accessor status: ImageGenerationStatus = "generating";
  /** The image's place in the queue while queued – 1 is next */
  @property({ type: Number }) accessor position: number | undefined = undefined;
  /** How far along it is, 0 to 1, while generating; left out, the bar sweeps */
  @property({ type: Number }) accessor progress: number | undefined = undefined;
  /** The step the model is on, while generating */
  @property({ type: Number }) accessor step: number | undefined = undefined;
  /** How many steps the job takes */
  @property({ type: Number }) accessor steps: number | undefined = undefined;
  /** Seconds left, when the model estimates it */
  @property({ type: Number }) accessor eta: number | undefined = undefined;
  /** What it's doing while generating, in a word – "Generating", "Refining", "Upscaling" */
  @property() accessor phase = "Generating";
  /** The finished image's URL – a data: URL works too. Shown when done */
  @property() accessor src: string | undefined = undefined;
  /** What the finished image shows, for people who can't see it */
  @property() accessor alt = "";
  /** An intermediate image the model sent, shown blurred while generating – the blur falls as the progress rises */
  @property() accessor preview: string | undefined = undefined;
  /** Why it failed, in a few words */
  @property() accessor error: string | undefined = undefined;
  /** The prompt the image comes from */
  @property() accessor prompt = "";
  /** The model's name, shown as a chip under the prompt */
  @property() accessor model: string | undefined = undefined;
  /** The image's size, shown as a chip – "1024 × 1536" */
  @property() accessor size: string | undefined = undefined;
  /** The frame's shape, so nothing jumps when the image arrives: "1:1", "16:9", "3:4" … */
  @property({ attribute: "aspect-ratio" }) accessor aspectRatio = "1:1";
  /** File name for Download – from the heading by default */
  @property() accessor filename: string | undefined = undefined;
  /** Whether a long prompt shows in full */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<ImageGenerationLabels> = {};

  /** @internal What the status region says */
  @state() accessor said = "";
  /** @internal Copy prompt just worked */
  @state() accessor copied = false;

  private readonly uid = `tc-igen${++instances}`;
  private lastStatus: ImageGenerationStatus | null = null;
  private lastQuarter = 0;
  private timers = new Set<number>();
  private urls = new Set<string>();

  constructor() {
    super();
    // The field drifts and the bar sweeps only while there's work to show, and pause while scrolled away
    new OffScreenController(this, () => this.status === "generating" || this.status === "queued");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls.clear();
  }

  private word(key: keyof ImageGenerationLabels) {
    return this.labels[key] ?? defaultImageGenerationLabels[key];
  }

  private later(run: () => void, ms: number) {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      run();
    }, ms);
    this.timers.add(t);
  }

  /** Progress as 0–1 when it's known: from `progress`, else from the step */
  private get fraction(): number | undefined {
    if (known(this.progress)) return clamp(this.progress, 0, 1);
    if (known(this.step) && known(this.steps) && this.steps > 0) return clamp(this.step / this.steps, 0, 1);
    return undefined;
  }

  private get stepText() {
    return known(this.step) && known(this.steps) && this.steps > 0 ? `Step ${Math.min(this.step, this.steps)} of ${this.steps}` : "";
  }

  private get queueText() {
    return known(this.position) && this.position > 0 ? (this.position === 1 ? "Next in line" : `${ordinal(this.position)} in line`) : "Waiting to start";
  }

  /** The state in a few words: the header's aside and what a screen reader hears */
  private get statusText() {
    switch (this.status) {
      case "queued":
        return `${this.word("queued")} · ${this.queueText}`;
      case "generating": {
        const f = this.fraction;
        return [this.phase, this.stepText, known(f) ? `${Math.round(f * 100)}%` : ""].filter(Boolean).join(" · ");
      }
      case "done":
        return this.word("ready");
      case "failed":
        return this.error || this.word("failed");
      case "cancelled":
        return this.word("cancelled");
    }
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const first = this.lastStatus === null;
    const f = this.fraction;
    const quarter = this.status === "generating" && known(f) ? Math.floor(f * 4) : 0;
    if (!first && this.status !== this.lastStatus) {
      // A change of state, once: the finished image's alt text is said here and nowhere else
      if (this.status === "done") this.said = this.alt.trim() ? `${this.word("ready")}: ${this.alt}` : this.word("ready");
      else if (this.status === "failed") this.said = `${this.word("failed")}${this.error ? `: ${this.error}` : ""}`;
      else this.said = this.statusText;
      this.copied = false;
    } else if (!first && this.status === "generating" && quarter > this.lastQuarter && quarter < 4) {
      // Coarse progress: every quarter, not every tick
      this.said = `${this.phase} ${quarter * 25}%`;
    }
    this.lastStatus = this.status;
    this.lastQuarter = quarter;
  }

  /* ---------- Actions ---------- */

  private cancel() {
    if (this.status !== "queued" && this.status !== "generating") return;
    if (!this.emit<ImageGenerationCancel>("tc-cancel", { status: this.status }, { cancelable: true })) return;
    this.status = "cancelled";
  }

  private retry() {
    this.said = "Trying again";
    this.emit<ImageGenerationRequest>("tc-retry", { prompt: this.prompt });
  }

  private regenerate() {
    this.emit<ImageGenerationRequest>("tc-regenerate", { prompt: this.prompt });
  }

  private download() {
    const src = safeMediaUrl(this.src);
    if (this.status !== "done" || !src) return;
    const filename = this.filename ?? `${slugify(this.heading)}.${extOf(src)}`;
    if (!this.emit<ImageGenerationDownload>("tc-download", { src, filename }, { cancelable: true })) return;
    const a = document.createElement("a");
    a.download = filename;
    a.href = src;
    if (!/^(data|blob):/i.test(src)) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    a.hidden = true;
    document.body.append(a);
    a.click();
    a.remove();
  }

  private async copyPrompt() {
    if (!this.prompt) return;
    if (!this.emit<ImageGenerationRequest>("tc-copy-prompt", { prompt: this.prompt }, { cancelable: true })) return;
    if (!(await copyText(this.prompt)) || !this.isConnected) return;
    this.copied = true;
    this.said = `${this.word("copied")}: prompt`;
    this.later(() => (this.copied = false), 1600);
  }

  private toggleExpanded() {
    const next = !this.expanded;
    if (this.emit<ImageGenerationExpandedChange>("tc-expanded-change", { expanded: next }, { cancelable: true })) this.expanded = next;
  }

  /* ---------- Render ---------- */

  private renderField(): TemplateResult {
    const preview = this.status === "generating" ? safeMediaUrl(this.preview) : undefined;
    return html`<div class="ui-igen__field" aria-hidden="true">
      ${preview
        ? html`<img class="ui-igen__preview" src=${preview} alt="" draggable="false" decoding="async" />`
        : html`<span class="ui-igen__blobs"></span>`}
      <svg class="ui-igen__grain">
        <filter id=${`${this.uid}-grain`}><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"></feTurbulence><feColorMatrix type="saturate" values="0"></feColorMatrix></filter>
        <rect width="100%" height="100%" filter=${`url(#${this.uid}-grain)`}></rect>
      </svg>
    </div>`;
  }

  private renderState(f: number | undefined): TemplateResult | typeof nothing {
    const s = this.status;
    if (s === "done") return nothing;
    if (s === "failed" || s === "cancelled") {
      const failed = s === "failed";
      return html`<div class="ui-igen__state" data-kind=${s}>
        ${glyph(failed ? icons.alert : icons.stop, "ui-igen__state-icon")}
        <span class="ui-igen__state-text">${failed ? this.error || this.word("failed") : this.word("cancelled")}</span>
        <button type="button" class="ui-igen__btn" data-primary @click=${failed ? () => this.retry() : () => this.regenerate()}>
          ${glyph(icons.regenerate)}<span>${this.word(failed ? "retry" : "restart")}</span>
        </button>
      </div>`;
    }
    const queued = s === "queued";
    const pct = known(f) ? Math.round(f * 100) : undefined;
    const valuetext = [this.stepText, pct !== undefined ? `${pct}%` : "", known(this.eta) ? formatEta(this.eta) : ""].filter(Boolean).join(", ");
    return html`<div class="ui-igen__state" data-kind=${s}>
        <span class="ui-igen__pill">
          ${glyph(queued ? icons.clock : icons.sparkle, queued ? "" : "ui-igen__spark")}
          <span>${queued ? this.queueText : this.phase}</span>
          ${!queued && pct !== undefined ? html`<span class="ui-igen__pct">${pct}%</span>` : nothing}
        </span>
        ${!queued && (this.stepText || known(this.eta))
          ? html`<span class="ui-igen__meta">${[this.stepText, known(this.eta) ? formatEta(this.eta) : ""].filter(Boolean).join(" · ")}</span>`
          : nothing}
      </div>
      ${queued
        ? nothing
        : html`<div
            class="ui-igen__bar"
            role="progressbar"
            aria-label=${`${this.heading}: ${this.phase}`}
            aria-valuemin=${ifDefined(pct !== undefined ? "0" : undefined)}
            aria-valuemax=${ifDefined(pct !== undefined ? "100" : undefined)}
            aria-valuenow=${ifDefined(pct)}
            aria-valuetext=${ifDefined(valuetext || undefined)}
            ?data-indeterminate=${pct === undefined}
          ><span style=${styleMap({ transform: `scaleX(${pct !== undefined ? f : 0.3})` })}></span></div>`}`;
  }

  private renderFrame(): TemplateResult {
    const f = this.fraction;
    const done = this.status === "done" && !!safeMediaUrl(this.src);
    // How much is still unresolved: blur and grain fall with it. A job with no progress sits in the middle
    const left = this.status === "generating" ? 1 - (f ?? 0.4) : 1;
    return html`<div
      class="ui-igen__frame"
      data-status=${this.status}
      style=${styleMap({ "--tc-igen-ratio": parseAspectRatio(this.aspectRatio), "--tc-igen-left": left.toFixed(3) })}
    >
      ${done ? nothing : this.renderField()}
      ${done ? keyed(this.src, html`<img class="ui-igen__img" src=${ifDefined(safeMediaUrl(this.src))} alt=${this.alt} draggable="false" decoding="async" />`) : nothing}
      ${this.renderState(f)}
    </div>`;
  }

  private renderPrompt(): TemplateResult | typeof nothing {
    const chips = [this.model, this.size].filter((c): c is string => !!c);
    if (!this.prompt && !chips.length) return nothing;
    const long = this.prompt.length > LONG_PROMPT;
    return html`<div class="ui-igen__about">
      ${this.prompt
        ? html`<p class="ui-igen__prompt" id=${`${this.uid}-prompt`} ?data-clamped=${long && !this.expanded}>${this.prompt}</p>
            ${long
              ? html`<button type="button" class="ui-igen__more" aria-expanded=${this.expanded ? "true" : "false"} aria-controls=${`${this.uid}-prompt`} @click=${() => this.toggleExpanded()}>
                  ${this.word(this.expanded ? "showLess" : "showMore")}
                </button>`
              : nothing}`
        : nothing}
      ${chips.length ? html`<div class="ui-igen__chips">${chips.map((c) => html`<span class="ui-igen__chip">${c}</span>`)}</div>` : nothing}
    </div>`;
  }

  private renderActions(): TemplateResult {
    const s = this.status;
    let buttons: TemplateResult | typeof nothing = nothing;
    if (s === "queued" || s === "generating") {
      buttons = html`<button type="button" class="ui-igen__btn" @click=${() => this.cancel()}>${glyph(icons.x)}<span>${this.word("cancel")}</span></button>`;
    } else if (s === "done") {
      buttons = html`${safeMediaUrl(this.src) ? html`<button type="button" class="ui-igen__btn" @click=${() => this.download()}>${glyph(icons.download)}<span>${this.word("download")}</span></button>` : nothing}
        <button type="button" class="ui-igen__btn" @click=${() => this.regenerate()}>${glyph(icons.regenerate)}<span>${this.word("regenerate")}</span></button>`;
    }
    const copy = this.prompt
      ? html`<button type="button" class="ui-igen__btn" data-ghost @click=${() => this.copyPrompt()}>
          ${glyph(this.copied ? icons.check : icons.copy)}<span>${this.word(this.copied ? "copied" : "copyPrompt")}</span>
        </button>`
      : nothing;
    const eta = s === "generating" && known(this.eta) ? formatEta(this.eta) : "";
    return html`<div class="ui-igen__foot">
      <span class="ui-igen__summary">${eta}</span>
      <span class="ui-igen__actions">${buttons}${copy}</span>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      // Lucide "image"
      icon: svg`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>`,
      title: this.heading,
      id: `${this.uid}-title`,
      aside: html`<span class="ui-igen__aside" data-status=${this.status}>${this.statusText}</span>`,
    });
    const body = html`<div class="ui-igen__body">${this.renderFrame()}${this.renderPrompt()}</div>`;
    const foot = this.renderActions();
    return html`
      <div class="ui-igen__root" role="group" aria-labelledby=${`${this.uid}-title`}>
        ${clean ? html`<div class="ui-igen__card">${head}${body}${foot}</div>` : html`${head}<div class="ui-igen__card">${body}</div>${foot}`}
      </div>
      <span class="ui-igen__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Sizes and the blur as variables – override them on [data-ui="igen"] */
[data-ui="igen"] {
  --tc-image-generation-blur: 26px;
  --tc-image-generation-glyph: 16px;
  --tc-image-generation-bar: 3px;
  --tc-image-generation-grain: 0.42;
  /* one drift of the colour field, there and back */
  --tc-image-generation-cycle: 9s;
  box-sizing: border-box;
  container-type: inline-size;
  display: block;
  width: 100%;
  max-width: 440px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray – the header on it, the white card, the actions below */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="igen"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="igen"] { --tc-image-generation-bar: 2px; color: var(--tc-text-primary); }
[data-ui="igen"] *, [data-ui="igen"] *::before, [data-ui="igen"] *::after { box-sizing: border-box; }
:where([data-ui="igen"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="igen"]) svg { display: block; flex: none; }
[data-ui="igen"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-igen__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-igen__glyph { width: var(--tc-image-generation-glyph); height: var(--tc-image-generation-glyph); fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-igen__glyph { stroke-width: 1.5; }
:where([data-look="standard"], [data-look="standard"] *).ui-igen__card { min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-igen__card { min-width: 0; overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* The header's aside: where the job is */
.ui-igen__aside { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; }
.ui-igen__aside[data-status="done"] { color: var(--tc-status-success-fg); }
.ui-igen__aside[data-status="failed"] { color: var(--tc-status-danger-fg); }
/* ----- The frame: the image's shape from the start ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-igen__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-igen__body { display: grid; gap: var(--tc-space-3); padding: 0 var(--tc-space-3) var(--tc-space-1); }
.ui-igen__frame { position: relative; display: grid; place-items: center; aspect-ratio: var(--tc-igen-ratio, 1 / 1); overflow: hidden; isolation: isolate; border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-igen__frame { border-radius: var(--tc-radius-md); }
.ui-igen__frame::after { content: ""; position: absolute; inset: 0; z-index: 3; border-radius: inherit; box-shadow: inset 0 0 0 1px var(--tc-border-subtle); pointer-events: none; }
/* The field: a preview blurred by what's left, or soft colour; the grain clears as it resolves */
.ui-igen__field { position: absolute; inset: 0; overflow: hidden; }
.ui-igen__preview, .ui-igen__blobs { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(calc(var(--tc-image-generation-blur) * var(--tc-igen-left, 1))); transform: scale(1.08); transition: filter var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-igen__blobs {
  background:
    radial-gradient(circle at 22% 28%, color-mix(in srgb, var(--tc-chart-1) 70%, transparent), transparent 55%),
    radial-gradient(circle at 78% 24%, color-mix(in srgb, var(--tc-chart-3) 60%, transparent), transparent 55%),
    radial-gradient(circle at 62% 78%, color-mix(in srgb, var(--tc-chart-5) 60%, transparent), transparent 60%),
    radial-gradient(circle at 18% 82%, color-mix(in srgb, var(--tc-chart-2) 50%, transparent), transparent 55%),
    var(--tc-surface-well);
  animation: ui-igen-drift var(--tc-image-generation-cycle) var(--tc-ease-in-out) infinite alternate;
}
.ui-igen__frame[data-status="queued"] .ui-igen__blobs, .ui-igen__frame[data-status="cancelled"] .ui-igen__blobs { opacity: 0.35; animation: none; }
.ui-igen__frame[data-status="failed"] .ui-igen__blobs { opacity: 0.2; animation: none; }
.ui-igen__grain { position: absolute; inset: -20%; width: 140%; height: 140%; opacity: calc(var(--tc-image-generation-grain) * var(--tc-igen-left, 1)); mix-blend-mode: soft-light; animation: ui-igen-grain var(--tc-duration-shimmer) steps(4) infinite; transition: opacity var(--tc-duration-slow) var(--tc-ease-standard); pointer-events: none; }
.ui-igen__frame:not([data-status="generating"]) .ui-igen__grain { animation: none; }
/* Done: the image cross-fades in over the field's last state */
.ui-igen__img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; user-select: none; -webkit-user-drag: none; animation: ui-igen-reveal var(--tc-duration-reveal) var(--tc-ease-decelerate) both; }
/* ----- The state over the frame ----- */
.ui-igen__state { position: relative; z-index: 2; display: grid; justify-items: center; gap: var(--tc-space-1-5); max-width: 100%; padding: 0 var(--tc-space-4); text-align: center; }
.ui-igen__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3); border-radius: var(--tc-radius-full); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-control); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
.ui-igen__pct { font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-igen__meta { padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-surface-overlay); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; color: var(--tc-text-secondary); }
.ui-igen__spark { color: var(--tc-accent-text); animation: ui-igen-twinkle var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-igen__state[data-kind="failed"], .ui-igen__state[data-kind="cancelled"] { padding: var(--tc-space-3) var(--tc-space-4); border-radius: var(--tc-radius-lg); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-raised); }
.ui-igen__state-icon { color: var(--tc-text-muted); }
.ui-igen__state[data-kind="failed"] .ui-igen__state-icon { color: var(--tc-status-danger-fg); }
.ui-igen__state-text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
/* The bar along the bottom edge */
.ui-igen__bar { position: absolute; z-index: 2; left: var(--tc-space-3); right: var(--tc-space-3); bottom: var(--tc-space-3); height: var(--tc-image-generation-bar); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-overlay); }
.ui-igen__bar > span { position: absolute; inset: 0; border-radius: inherit; background: var(--tc-text-primary); transform-origin: left; transition: transform var(--tc-duration-base) linear; }
:where([data-look="clean"], [data-look="clean"] *).ui-igen__bar > span { background: var(--tc-accent); }
.ui-igen__bar[data-indeterminate] > span { animation: ui-igen-slide var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
[data-ui="igen"][data-offscreen] :is(.ui-igen__blobs, .ui-igen__grain, .ui-igen__spark, .ui-igen__bar > span) { animation-play-state: paused; }
/* ----- The prompt, the model and size ----- */
.ui-igen__about { display: grid; justify-items: start; gap: var(--tc-space-1-5); min-width: 0; padding: 0 var(--tc-space-1); }
.ui-igen__prompt { margin: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-igen__prompt[data-clamped] { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.ui-igen__more { min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
.ui-igen__more:hover { text-decoration: underline; }
.ui-igen__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-igen__chip { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-text-secondary); white-space: nowrap; }
/* ----- The actions: on the tray (Standard), the card's last row (Clean) ----- */
.ui-igen__foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--tc-space-2); min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-igen__foot { margin-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-igen__summary { font-variant-numeric: tabular-nums; }
.ui-igen__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-1); margin-left: auto; }
.ui-igen__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-igen__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-igen__btn[data-ghost] { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
.ui-igen__btn[data-ghost]:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-igen__btn .ui-igen__glyph { width: calc(var(--tc-image-generation-glyph) - 2px); height: calc(var(--tc-image-generation-glyph) - 2px); }
@keyframes ui-igen-drift { from { transform: scale(1.08) translate(-3%, -2%) rotate(-2deg); } to { transform: scale(1.14) translate(3%, 2%) rotate(3deg); } }
@keyframes ui-igen-grain { 0% { transform: translate(0, 0); } 25% { transform: translate(-6%, 4%); } 50% { transform: translate(5%, -5%); } 75% { transform: translate(-3%, -6%); } 100% { transform: translate(0, 0); } }
@keyframes ui-igen-reveal { from { opacity: 0; filter: blur(12px); transform: scale(1.03); } to { opacity: 1; filter: none; transform: none; } }
@keyframes ui-igen-slide { from { transform: translateX(-100%) scaleX(0.3); } to { transform: translateX(340%) scaleX(0.3); } }
@keyframes ui-igen-twinkle { 50% { opacity: 0.45; transform: scale(0.88) rotate(12deg); } }
/* Narrow: the summary goes under the actions' row rather than squeezing them */
@container (max-width: 340px) {
  .ui-igen__summary:empty { display: none; }
  .ui-igen__btn { padding: 0 var(--tc-space-2); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="igen"] *, [data-ui="igen"] *::before, [data-ui="igen"] *::after { animation: none !important; transition: none !important; }
  /* The indeterminate bar holds a third of the way */
  .ui-igen__bar[data-indeterminate] > span { transform: scaleX(0.3) !important; }
}
@media (forced-colors: active) {
  .ui-igen__bar > span { background: Highlight; }
  .ui-igen__field { display: none; }
}
`;
}

if (!customElements.get("tc-image-generation")) customElements.define("tc-image-generation", TcImageGeneration);

declare global {
  interface HTMLElementTagNameMap {
    "tc-image-generation": TcImageGeneration;
  }
}
