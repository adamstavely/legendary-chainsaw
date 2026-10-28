import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import { copyText } from "./internal/util";

/*
 * <tc-file-summary> – what's in a file, summarised by AI. The header names the file with an icon for its type, its
 * size and length; the body is a short summary that can stream in, key points that cite their pages or timestamps,
 * the people, organisations, dates and amounts it mentions, and how much of the file the summary covers. Copy,
 * Regenerate and Open file sit in the footer, with when it was summarised and by which model.
 *   · `status` drives it: "idle" offers Summarise, "summarising" shows a shimmer until text arrives and a caret while
 *     it grows, "done" shows everything, "error" shows the message with Retry. The page streams by setting `summary`,
 *     `points` and `entities` as they arrive
 *   · a citation chip opens its page or time: with `href`, a link to `href#page=12` or `href#t=272` (prevent
 *     tc-cite-open to jump inside your own viewer instead)
 *   · Short / Detailed is a radio group; changing it fires a cancelable tc-length-change – summarise again on it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-file-summary status="done" .file=${{ name: "Q3 report.pdf", kind: "pdf", pages: 48 }} .summary=${text}
 *     .points=${points}></tc-file-summary>
 */

export type FileSummaryKind = "pdf" | "doc" | "sheet" | "slides" | "image" | "audio" | "video" | "other";
export type FileSummaryFile = {
  name: string;
  /** Picks the icon and the type's name; by default worked out from the name's extension */
  kind?: FileSummaryKind;
  /** In bytes */
  size?: number;
  /** For documents and slides */
  pages?: number;
  /** For audio and video, in ms */
  duration?: number;
};
/** Where a point comes from: a page, or a time in ms for audio and video */
export type FileSummaryRef = { page?: number; time?: number };
export type FileSummaryPoint = { id: string; text: string; refs?: FileSummaryRef[] };
export type FileSummaryEntityKind = "person" | "organization" | "date" | "amount";
export type FileSummaryEntity = {
  id: string;
  label: string;
  kind: FileSummaryEntityKind;
  /** How many times the file mentions it */
  count?: number;
};
export type FileSummaryStatus = "idle" | "summarising" | "done" | "error";
export type FileSummaryLength = "short" | "detailed";

/** Details of the events */
export type FileSummaryCiteOpen = { pointId: string; page?: number; time?: number };
export type FileSummaryLengthChange = { length: FileSummaryLength };
export type FileSummaryRetry = { reason: "regenerate" | "error" };

let uidCount = 0;

/* File types, copy, check, refresh, external link, sparkles, alert: Lucide (ISC, lucide.dev) */
const lucide = (body: TemplateResult, size = 16) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const page = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`;
const KIND_ICON: Record<FileSummaryKind, TemplateResult> = {
  pdf: svg`${page}<path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`,
  doc: svg`${page}<path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`,
  sheet: svg`${page}<path d="M8 13h2"></path><path d="M14 13h2"></path><path d="M8 17h2"></path><path d="M14 17h2"></path>`,
  slides: svg`<path d="M2 3h20"></path><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path><path d="m7 21 5-5 5 5"></path>`,
  image: svg`<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>`,
  audio: svg`<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>`,
  video: svg`<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect>`,
  other: page,
};
const KIND_LABEL: Record<FileSummaryKind, string> = { pdf: "PDF", doc: "Document", sheet: "Spreadsheet", slides: "Slides", image: "Image", audio: "Audio", video: "Video", other: "File" };
const EXT: Record<string, FileSummaryKind> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  txt: "doc",
  md: "doc",
  rtf: "doc",
  odt: "doc",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  ods: "sheet",
  ppt: "slides",
  pptx: "slides",
  key: "slides",
  odp: "slides",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  heic: "image",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  mp4: "video",
  mov: "video",
  webm: "video",
  mkv: "video",
};
const copyIcon = () => lucide(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`, 14);
const checkIcon = () => lucide(svg`<path d="M20 6 9 17l-5-5"></path>`, 14);
const refreshIcon = () => lucide(svg`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>`, 14);
const openIcon = () => lucide(svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`, 14);
const sparkIcon = () =>
  lucide(svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>`, 14);
const alertIcon = () => lucide(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`, 16);

/** The kind of a file: given, else from its extension */
export const fileSummaryKind = (file: Pick<FileSummaryFile, "name" | "kind">): FileSummaryKind => file.kind ?? EXT[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "other";
/** 4:32, or 1:04:32 past an hour */
const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
/** "4 minutes 32 seconds", for screen readers */
const spoken = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const parts = [
    [Math.floor(s / 3600), "hour"],
    [Math.floor((s % 3600) / 60), "minute"],
    [s % 60, "second"],
  ] as const;
  return parts
    .filter(([n]) => n > 0)
    .map(([n, unit]) => `${n} ${unit}${n === 1 ? "" : "s"}`)
    .join(" ") || "0 seconds";
};
const bytes = (n: number, locale?: string) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: v < 10 && i > 0 ? 1 : 0 }).format(v)} ${units[i]}`;
};

/**
 * An AI summary of a file – the file's type, size and length, a summary that streams in, key points citing their
 * pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file.
 * @tag tc-file-summary
 * @fires tc-summarise - Summarise was pressed while `status` is "idle" – start summarising
 * @fires tc-retry - Regenerate, or Retry after an error ({ reason: "regenerate" | "error" }: FileSummaryRetry)
 * @fires tc-length-change - Short or Detailed was picked ({ length }: FileSummaryLengthChange); cancelable – prevented, `length` stays as it was
 * @fires tc-cite-open - A citation chip was used ({ pointId, page, time }: FileSummaryCiteOpen); cancelable – prevented, a link to the file doesn't open
 * @fires tc-entity-select - A person, organisation, date or amount was picked ({ entity }: { entity: FileSummaryEntity })
 * @fires tc-copy - The summary is on the clipboard ({ text })
 * @fires tc-open - Open file was used; cancelable – prevented, a link to the file doesn't open
 */
export class TcFileSummary extends TcElement {
  static override ui = "fsum";

  /** The file summarised */
  @property({ attribute: false }) accessor file: FileSummaryFile = { name: "Untitled" };
  /** Where the file opens; makes Open file and the citation chips links */
  @property() accessor href: string | undefined = undefined;
  /** Show Open file without `href` – it then only fires tc-open */
  @property({ type: Boolean }) accessor openable = false;
  /** Where the summary is: "idle", "summarising", "done" or "error" */
  @property({ reflect: true }) accessor status: FileSummaryStatus = "idle";
  /** The summary; may grow while "summarising". Blank lines split paragraphs */
  @property() accessor summary = "";
  /** The key points, each with the pages or times it comes from */
  @property({ attribute: false }) accessor points: FileSummaryPoint[] = [];
  /** People, organisations, dates and amounts the file mentions */
  @property({ attribute: false }) accessor entities: FileSummaryEntity[] = [];
  /** How much of the file the summary covers, e.g. "Covers 42 of 48 pages · 3 pages unreadable" */
  @property() accessor coverage: string | undefined = undefined;
  /** When it was summarised, as epoch ms */
  @property({ type: Number, attribute: "summarised-at" }) accessor summarisedAt: number | undefined = undefined;
  /** The model that wrote it, e.g. "Claude Sonnet" */
  @property() accessor model: string | undefined = undefined;
  /** Short or detailed. Changed by the user unless a tc-length-change listener calls preventDefault() */
  @property({ reflect: true }) accessor length: FileSummaryLength = "short";
  /** What went wrong, shown with "error" */
  @property() accessor error: string | undefined = undefined;
  /** The language for dates and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor copied = false;
  @state() private accessor announce = "";

  private uid = `tc-fsum-${++uidCount}`;
  private copiedTimer = 0;

  constructor() {
    super();
    // The shimmer pauses while the element is off screen
    new OffScreenController(this, () => this.status === "summarising");
    // Focus never drops to <body> when a button it was on goes away or is disabled (Summarise, Retry, Copy and
    // Regenerate while summarising)
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-fsum__len [tabindex='0']"));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  /* ---------- Actions ---------- */

  private get kind() {
    return fileSummaryKind(this.file);
  }

  /** The summary and key points as plain text, for Copy */
  private get plainText() {
    const points = this.points.map((p) => `• ${p.text}${p.refs?.length ? ` (${p.refs.map((r) => this.refLabel(r)).join(", ")})` : ""}`);
    return [this.file.name, "", this.summary.trim(), ...(points.length ? ["", "Key points", ...points] : [])].join("\n");
  }

  private async copy() {
    const text = this.plainText;
    if (!(await copyText(text))) return;
    this.copied = true;
    this.announce = "Summary copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 1800);
    this.emit("tc-copy", { text });
  }

  private setLength(next: FileSummaryLength) {
    if (next === this.length) return;
    if (!this.emit<FileSummaryLengthChange>("tc-length-change", { length: next }, { cancelable: true })) return;
    this.length = next;
  }

  private onLengthKey(e: KeyboardEvent) {
    const order = ["short", "detailed"] as const;
    const at = order.indexOf(this.length);
    const to = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key) ? (at + 1) % 2 : e.key === "Home" ? 0 : e.key === "End" ? 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.setLength(order[to]);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-fsum__len [data-len="${this.length}"]`)?.focus());
  }

  private refLabel(r: FileSummaryRef) {
    return r.time !== undefined ? clock(r.time) : r.page !== undefined ? `p. ${r.page}` : "";
  }
  private refHref(r: FileSummaryRef) {
    if (!this.href) return undefined;
    const base = this.href.split("#")[0];
    return r.time !== undefined ? `${base}#t=${Math.round(r.time / 1000)}` : r.page !== undefined ? `${base}#page=${r.page}` : base;
  }

  private openCite(e: Event, point: FileSummaryPoint, r: FileSummaryRef) {
    if (!this.emit<FileSummaryCiteOpen>("tc-cite-open", { pointId: point.id, page: r.page, time: r.time }, { cancelable: true })) e.preventDefault();
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const was = changed.get("status") as FileSummaryStatus | undefined;
    // Announced politely when the status changes, not on the first render
    if (changed.has("status") && was !== undefined) {
      if (this.status === "summarising") this.announce = `Summarising ${this.file.name}`;
      else if (this.status === "done") this.announce = `Summary of ${this.file.name} ready`;
      else if (this.status === "error") this.announce = `Couldn't summarise ${this.file.name}${this.error ? `: ${this.error}` : ""}`;
      else this.announce = "";
    }
    if (changed.has("status") && this.status !== "done") this.copied = false;
    // The header icon takes the file type's colour
    this.dataset.kind = this.kind;
  }

  /* ---------- Rendering ---------- */

  private renderHead() {
    const f = this.file;
    const kind = this.kind;
    const nf = new Intl.NumberFormat(this.locale);
    const meta = [
      KIND_LABEL[kind],
      f.size !== undefined ? bytes(f.size, this.locale) : "",
      f.pages !== undefined ? `${nf.format(f.pages)} ${f.pages === 1 ? "page" : "pages"}` : "",
      f.duration !== undefined ? clock(f.duration) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return cardHead({
      icon: KIND_ICON[kind],
      title: html`<span class="ui-fsum__name" title=${f.name}>${f.name}</span>`,
      subtitle: meta,
      id: `${this.uid}-title`,
      aside: html`<div class="ui-fsum__len" role="radiogroup" aria-label="Summary length" @keydown=${this.onLengthKey}>
        ${(["short", "detailed"] as const).map(
          (l) => html`<button
            type="button"
            role="radio"
            class="ui-fsum__len-opt"
            data-len=${l}
            aria-checked=${this.length === l ? "true" : "false"}
            tabindex=${this.length === l ? 0 : -1}
            @click=${() => this.setLength(l)}
          >${l === "short" ? "Short" : "Detailed"}</button>`,
        )}
      </div>`,
    });
  }

  private renderSummary() {
    const streaming = this.status === "summarising";
    const paras = this.summary.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (!paras.length && streaming)
      return html`<div class="ui-fsum__skeleton" aria-hidden="true"><span></span><span></span><span></span></div>`;
    return html`<div class="ui-fsum__summary" aria-busy=${streaming ? "true" : "false"}>
      ${paras.map((p, i) => html`<p class="ui-fsum__p">${p}${streaming && i === paras.length - 1 ? html`<span class="ui-fsum__caret" aria-hidden="true"></span>` : nothing}</p>`)}
    </div>`;
  }

  private renderPoints() {
    if (!this.points.length) return nothing;
    return html`<section class="ui-fsum__section" aria-labelledby=${`${this.uid}-points`}>
      <h4 class="ui-fsum__caption" id=${`${this.uid}-points`}>Key points</h4>
      <ul class="ui-fsum__points">
        ${repeat(
          this.points,
          (p) => p.id,
          (p) => html`<li class="ui-fsum__point">
            <span class="ui-fsum__bullet" aria-hidden="true"></span>
            <span class="ui-fsum__point-text">${p.text}${(p.refs ?? []).map((r) => {
              const label = this.refLabel(r);
              if (!label) return nothing;
              // Read as "Open page 12" / "Open at 4 minutes 32 seconds"; seen as "p. 12" / "4:32"
              const body = html`<span class="tc-sr-only">${r.time !== undefined ? `Open at ${spoken(r.time)}` : `Open page ${r.page}`}</span><span aria-hidden="true">${label}</span>`;
              const href = this.refHref(r);
              return href
                ? html` <a class="ui-fsum__cite" href=${href} target="_blank" rel="noopener" @click=${(e: Event) => this.openCite(e, p, r)}>${body}</a>`
                : html` <button type="button" class="ui-fsum__cite" @click=${(e: Event) => this.openCite(e, p, r)}>${body}</button>`;
            })}</span>
          </li>`,
        )}
      </ul>
    </section>`;
  }

  private renderEntities() {
    const groups = [
      { id: "who", label: "People & organisations", kinds: ["person", "organization"] },
      { id: "what", label: "Dates & amounts", kinds: ["date", "amount"] },
    ]
      .map((g) => ({ ...g, items: this.entities.filter((e) => g.kinds.includes(e.kind)) }))
      .filter((g) => g.items.length);
    if (!groups.length) return nothing;
    return html`<div class="ui-fsum__entities">
      ${groups.map(
        (g) => html`<section class="ui-fsum__section" aria-labelledby=${`${this.uid}-${g.id}`}>
          <h4 class="ui-fsum__caption" id=${`${this.uid}-${g.id}`}>${g.label}</h4>
          <ul class="ui-fsum__chips">
            ${repeat(
              g.items,
              (e) => e.id,
              (e) => html`<li>
                <button
                  type="button"
                  class="ui-fsum__chip"
                  data-kind=${e.kind}
                  @click=${() => this.emit("tc-entity-select", { entity: e })}
                >
                  <span class="ui-fsum__chip-label">${e.label}</span>${e.count !== undefined
                    ? html`<span class="ui-fsum__chip-count" aria-hidden="true">${e.count}</span><span class="tc-sr-only">, mentioned ${e.count} ${e.count === 1 ? "time" : "times"}</span>`
                    : nothing}
                </button>
              </li>`,
            )}
          </ul>
        </section>`,
      )}
    </div>`;
  }

  private renderBody() {
    const s = this.status;
    if (s === "idle")
      return html`<div class="ui-fsum__idle">
        <p class="ui-fsum__idle-text">Get the gist, the key points with their ${this.kind === "audio" || this.kind === "video" ? "times" : "pages"}, and who and what it mentions.</p>
        <button type="button" class="ui-fsum__primary" @click=${() => this.emit("tc-summarise", null)}>${sparkIcon()}Summarise</button>
      </div>`;
    if (s === "error")
      return html`<div class="ui-fsum__error" role="alert">
        <span class="ui-fsum__error-icon">${alertIcon()}</span>
        <div class="ui-fsum__error-text">
          <p class="ui-fsum__error-title">Couldn't summarise this file</p>
          ${this.error ? html`<p class="ui-fsum__error-detail">${this.error}</p>` : nothing}
        </div>
        <button type="button" class="tc-btn-sm ui-fsum__retry" @click=${() => this.emit<FileSummaryRetry>("tc-retry", { reason: "error" })}>${refreshIcon()}Retry</button>
      </div>`;
    return html`<div class="ui-fsum__body">
      ${this.renderSummary()} ${this.renderPoints()} ${this.renderEntities()}
      ${this.coverage ? html`<p class="ui-fsum__coverage">${this.coverage}</p>` : nothing}
    </div>`;
  }

  private renderFoot() {
    const s = this.status;
    if (s === "idle" || s === "error") return nothing;
    const done = s === "done";
    const when = done && this.summarisedAt !== undefined ? new Intl.DateTimeFormat(this.locale, { dateStyle: "medium", timeStyle: "short" }).format(this.summarisedAt) : "";
    const by = [when ? `Summarised ${when}` : done ? "Summarised" : "Summarising…", this.model ? `with ${this.model}` : ""].filter(Boolean).join(" ");
    const showOpen = !!this.href || this.openable;
    return html`<div class="ui-fsum__foot">
      <span class="ui-fsum__by">${sparkIcon()}<span>${by}</span></span>
      <span class="ui-fsum__actions">
        <button type="button" class="tc-btn-sm ui-fsum__copy" ?disabled=${!done} ?data-copied=${this.copied} @click=${() => void this.copy()}>
          ${this.copied ? checkIcon() : copyIcon()}<span>${this.copied ? "Copied" : "Copy"}</span>
        </button>
        <button type="button" class="tc-btn-sm ui-fsum__regen" ?disabled=${!done} @click=${() => this.emit<FileSummaryRetry>("tc-retry", { reason: "regenerate" })}>${refreshIcon()}<span>Regenerate</span></button>
        ${showOpen
          ? this.href
            ? html`<a
                class="tc-btn-sm ui-fsum__open"
                href=${this.href}
                target="_blank"
                rel="noopener"
                @click=${(e: Event) => {
                  if (!this.emit("tc-open", null, { cancelable: true })) e.preventDefault();
                }}
                >${openIcon()}<span>Open file</span></a
              >`
            : html`<button type="button" class="tc-btn-sm ui-fsum__open" @click=${() => this.emit("tc-open", null, { cancelable: true })}>${openIcon()}<span>Open file</span></button>`
          : nothing}
      </span>
    </div>`;
  }

  protected override render() {
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${this.renderHead()}
      <div class="ui-fsum__card">${this.renderBody()} ${this.renderFoot()}</div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fsum"] {
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
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fsum"] {
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
[data-ui="fsum"] *, [data-ui="fsum"] *::before, [data-ui="fsum"] *::after { box-sizing: border-box; }
:where([data-ui="fsum"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fsum"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="fsum"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="fsum"] h4, [data-ui="fsum"] p { margin: 0; }
[data-ui="fsum"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fsum"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-fsum__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header: the file's type, name and size, and Short / Detailed ----- */
[data-ui="fsum"][data-kind="pdf"] .tc-head__icon { color: var(--tc-status-danger-fg); }
[data-ui="fsum"][data-kind="sheet"] .tc-head__icon { color: var(--tc-status-success-fg); }
[data-ui="fsum"][data-kind="slides"] .tc-head__icon { color: var(--tc-tone-amber-fg); }
[data-ui="fsum"][data-kind="image"] .tc-head__icon { color: var(--tc-tone-pink-fg); }
[data-ui="fsum"]:is([data-kind="audio"], [data-kind="video"]) .tc-head__icon { color: var(--tc-tone-violet-fg); }
.ui-fsum__name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-fsum__len { display: flex; flex: none; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-fsum__len-opt { display: inline-flex; align-items: center; height: 24px; padding: 0 var(--tc-space-2-5) !important; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-fsum__len-opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); color: var(--tc-text-primary); box-shadow: var(--tc-seg-thumb-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-fsum__len-opt[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- Idle: what a summary gives, and Summarise ----- */
.ui-fsum__idle { display: grid; justify-items: start; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-fsum__idle-text { color: var(--tc-text-secondary); line-height: var(--tc-line-height-snug); }
.ui-fsum__primary { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) !important; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg) !important; font-size: var(--tc-control-font-size) !important; font-weight: var(--tc-control-font-weight) !important; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fsum__primary:hover { background: var(--tc-action-primary-bg-hover) !important; }
.ui-fsum__primary:active { background: var(--tc-action-primary-bg-active) !important; }
/* ----- The summary: paragraphs that stream in, or a shimmer before the first words ----- */
.ui-fsum__body { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-fsum__body { padding-top: var(--tc-space-2); }
.ui-fsum__summary { display: grid; gap: var(--tc-space-2); }
.ui-fsum__p { color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); }
:where([data-look="clean"], [data-look="clean"] *).ui-fsum__p { line-height: var(--tc-line-height-loose); }
.ui-fsum__caret { display: inline-block; width: 2px; height: 1em; margin-left: var(--tc-space-0-5); vertical-align: text-bottom; background: var(--tc-accent); animation: ui-fsum-blink var(--tc-duration-shimmer) steps(2, start) infinite; }
.ui-fsum__skeleton { display: grid; gap: var(--tc-space-2); }
.ui-fsum__skeleton > span { position: relative; display: block; height: 12px; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); }
.ui-fsum__skeleton > span:nth-child(2) { width: 92%; }
.ui-fsum__skeleton > span:nth-child(3) { width: 64%; }
.ui-fsum__skeleton > span::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); transform: translateX(-100%); animation: ui-fsum-shimmer var(--tc-duration-shimmer) linear infinite; }
[data-offscreen] .ui-fsum__skeleton > span::after, [data-offscreen] .ui-fsum__caret { animation-play-state: paused; }
/* ----- Key points, with their citations ----- */
.ui-fsum__section { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-fsum__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-fsum__points { display: grid; gap: var(--tc-space-2); }
.ui-fsum__point { display: flex; gap: var(--tc-space-2); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-fsum__bullet { display: flex; flex: none; align-items: center; height: 1lh; }
.ui-fsum__bullet::before { content: ""; width: 5px; height: 5px; border-radius: var(--tc-radius-full); background: var(--tc-icon-muted); }
.ui-fsum__point-text { min-width: 0; }
.ui-fsum__cite { display: inline-flex; align-items: center; height: 18px; margin-left: var(--tc-space-0-5) !important; padding: 0 var(--tc-space-1-5) !important; border-radius: var(--tc-radius-badge); background: var(--tc-fill-default) !important; font-size: var(--tc-font-size-xs) !important; line-height: var(--tc-line-height-none); color: var(--tc-text-secondary) !important; text-decoration: none; font-variant-numeric: tabular-nums; vertical-align: text-bottom; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fsum__cite:hover { background: var(--tc-fill-selected) !important; color: var(--tc-accent-text) !important; }
/* ----- Who and what it mentions ----- */
.ui-fsum__entities { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--tc-space-4); }
.ui-fsum__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-fsum__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); max-width: 100%; padding: 0 var(--tc-pill-px) !important; border-radius: var(--tc-pill-radius); background: var(--tc-fill-subtle) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-pill-font-size) !important; color: var(--tc-text-primary) !important; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fsum__chip:hover { background: var(--tc-fill-default) !important; }
.ui-fsum__chip-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-fsum__chip-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-fsum__chip[data-kind="person"]::before, .ui-fsum__chip[data-kind="organization"]::before, .ui-fsum__chip[data-kind="date"]::before, .ui-fsum__chip[data-kind="amount"]::before { content: ""; flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-full); }
.ui-fsum__chip[data-kind="person"]::before { background: var(--tc-tone-violet-fg); }
.ui-fsum__chip[data-kind="organization"]::before { border-radius: var(--tc-radius-2xs); background: var(--tc-tone-amber-fg); }
.ui-fsum__chip[data-kind="date"]::before { background: var(--tc-chart-1); }
.ui-fsum__chip[data-kind="amount"]::before { border-radius: var(--tc-radius-2xs); background: var(--tc-status-success-fg); }
.ui-fsum__coverage { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- Error ----- */
.ui-fsum__error { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); margin: var(--tc-space-3); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-fsum__error-icon { display: flex; align-items: center; height: 1lh; }
.ui-fsum__error-text { flex: 1; min-width: 0; }
.ui-fsum__error-title { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-fsum__error-detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* ----- The footer: who summarised it and when, and the actions ----- */
.ui-fsum__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-fsum__by { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-fsum__by > svg { color: var(--tc-icon-muted); }
.ui-fsum__actions { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-fsum__actions .tc-btn-sm { text-decoration: none; }
.ui-fsum__copy[data-copied] { color: var(--tc-status-success-fg); }
@keyframes ui-fsum-shimmer { to { transform: translateX(100%); } }
@keyframes ui-fsum-blink { to { visibility: hidden; } }
@container (max-width: 420px) {
  .ui-fsum__actions .tc-btn-sm > span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="fsum"] *, [data-ui="fsum"] *::before, [data-ui="fsum"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-fsum__cite, .ui-fsum__chip { border: 1px solid ButtonText; }
  .ui-fsum__len-opt[aria-checked="true"] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-file-summary")) customElements.define("tc-file-summary", TcFileSummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-file-summary": TcFileSummary;
  }
}
