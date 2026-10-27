import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { ToolbarController } from "./internal/controllers";
import { compact } from "./internal/format";

/*
 * <tc-multimodal-input> – a message box that takes images, audio, video and documents with the text. Files come in
 * through the clip button, by dropping them anywhere on the box, or by pasting them into the message. Each one gets a
 * tile: an image's thumbnail, a recording's or video's length, a document's page count; its upload state and progress;
 * and the token estimate the app supplies. Files of a format that isn't accepted, or over the size for their kind, are
 * turned away with the reason, and the box sums the estimates – against a budget, when there is one.
 *   · the tiles are one toolbar: Tab reaches it once; ← → Home End move between the tiles' buttons; Delete or
 *     Backspace removes the tile in focus, and focus moves to the next tile, else the one before, else the message
 *   · Enter sends, Shift+Enter starts a new line; Send waits until every upload is done
 * The element uploads nothing and estimates nothing: a tc-value-change of type "add" hands the app the new files, and
 * the app reports progress, failures, durations, page counts and tokens back through `value`. Images get a local
 * thumbnail (an object URL, revoked when the tile goes) until the app gives a `preview`.
 * Standard is a white card on a gray tray, with the totals on the tray; Clean is one white card with hairline
 * shadows, the totals as its last row, quieter tiles and thinner icons.
 *
 *   <tc-multimodal-input .accept=${["image/*", "audio/*", ".pdf"]} budget="32000"></tc-multimodal-input>
 *
 * Every change of the attachments fires a cancelable `tc-value-change` ({ value, change }) and every edit of the
 * message a cancelable `tc-text-change` ({ text }) – preventDefault() and pass them back to own them.
 */

export type MultimodalKind = "image" | "audio" | "video" | "document";
export type MultimodalStatus = "queued" | "uploading" | "ready" | "failed";
export type MultimodalAttachment = {
  id: string;
  name: string;
  kind: MultimodalKind;
  /** The MIME type */
  type?: string;
  /** In bytes */
  size: number;
  status: MultimodalStatus;
  /** Upload progress, 0–1 */
  progress?: number;
  /** Why the upload failed, in a few words */
  error?: string;
  /** A thumbnail URL for an image or a video */
  preview?: string;
  /** A recording's or video's length, in seconds */
  duration?: number;
  /** A document's page count */
  pages?: number;
  /** The app's token estimate for this attachment */
  tokens?: number;
};
/** A file the user added, with the attachment it became */
export type MultimodalFile = { attachment: MultimodalAttachment; file: File };
/** A file that was turned away, and why */
export type MultimodalRejection = { name: string; reason: string };
export type MultimodalChange = { type: "add"; files: MultimodalFile[] } | { type: "remove"; attachment: MultimodalAttachment } | { type: "clear" };
export type MultimodalValueChange = { value: MultimodalAttachment[]; change: MultimodalChange };
export type MultimodalTextChange = { text: string };
export type MultimodalSend = { text: string; attachments: MultimodalAttachment[] };
export type MultimodalRetry = { attachment: MultimodalAttachment; file?: File };
export type MultimodalReject = { rejections: MultimodalRejection[] };

const MB = 1024 * 1024;
const KINDS: MultimodalKind[] = ["image", "audio", "video", "document"];
const KIND_NAME: Record<MultimodalKind, [string, string]> = { image: ["Image", "Images"], audio: ["Recording", "Recordings"], video: ["Video", "Videos"], document: ["Document", "Documents"] };
const EXT_KIND: Record<string, MultimodalKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", heic: "image", avif: "image", svg: "image",
  mp3: "audio", wav: "audio", m4a: "audio", ogg: "audio", flac: "audio",
  mp4: "video", mov: "video", webm: "video", mkv: "video",
};

const ext = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");
/** What kind of attachment a file is: from its MIME type, else its extension */
export function multimodalKind(file: { name: string; type?: string }): MultimodalKind {
  const t = (file.type ?? "").toLowerCase();
  for (const k of ["image", "audio", "video"] as const) if (t.startsWith(`${k}/`)) return k;
  return EXT_KIND[ext(file.name)] ?? "document";
}
/** One `accept` entry: ".pdf", "pdf", "image/png" or "image/*" */
const matches = (entry: string, file: { name: string; type?: string }) => {
  const e = entry.toLowerCase().trim();
  if (!e.includes("/")) return ext(file.name) === e.replace(/^\./, "");
  const t = (file.type ?? "").toLowerCase();
  return e.endsWith("/*") ? t.startsWith(e.slice(0, -1)) || multimodalKind(file) === e.slice(0, -2) : t === e;
};
/** The kind an accept entry covers, if it names one */
const entryKind = (entry: string): MultimodalKind | null => {
  const e = entry.toLowerCase().trim();
  if (!e.includes("/")) return EXT_KIND[e.replace(/^\./, "")] ?? "document";
  const top = e.split("/")[0];
  return (KINDS as string[]).includes(top) ? (top as MultimodalKind) : top === "application" || top === "text" ? "document" : null;
};
/** How an accept entry reads: "PDF", "PNG", "Images" */
const entryLabel = (entry: string) => {
  const e = entry.toLowerCase().trim();
  if (!e.includes("/")) return e.replace(/^\./, "").toUpperCase();
  const [top, sub] = e.split("/");
  if (sub === "*") return (KINDS as string[]).includes(top) ? KIND_NAME[top as MultimodalKind][1].toLowerCase() : `${top} files`;
  return sub.replace(/^(x-|vnd\.)/, "").split(/[.+-]/)[0].toUpperCase();
};
const list = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`);
/** "840 KB", "2.4 MB" – number and unit joined by a no-break space */
export const formatBytes = (bytes: number) => (bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`);
/** "0:42", "12:05", "1:02:10" */
const clock = (s: number) => {
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (body: TemplateResult, cls = "ui-mmi__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const KIND_ICON: Record<MultimodalKind, () => TemplateResult> = {
  image: () => glyph(svg`<rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"></path>`, "ui-mmi__kind-svg"),
  audio: () => glyph(svg`<path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"></path>`, "ui-mmi__kind-svg"),
  video: () => glyph(svg`<rect x="2" y="5" width="14" height="14" rx="2"></rect><path d="m22 8-6 4 6 4z"></path>`, "ui-mmi__kind-svg"),
  document: () => glyph(svg`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5M9 13h6M9 17h4"></path>`, "ui-mmi__kind-svg"),
};
const clip = () => glyph(svg`<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 0 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"></path>`);
const cross = () => glyph(svg`<path d="M7 7l10 10M17 7 7 17"></path>`);
const retry = () => glyph(svg`<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.5M20 4v4.5h-4.5"></path>`);
const send = () => glyph(svg`<path d="M12 19V5M5 12l7-7 7 7"></path>`);
const alert = () => glyph(svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 8v4.5M12 16h.01"></path>`);
const play = () => glyph(svg`<path d="M8 5.5v13l10.5-6.5z"></path>`, "ui-mmi__play");

let instances = 0;

/**
 * A message box that takes images, audio, video and documents: upload state and progress, previews, format and size
 * checks, and the app's token estimates per attachment and in total.
 * @tag tc-multimodal-input
 * @fires tc-value-change - The attachments changed ({ value, change }: MultimodalValueChange – change is { type: "add", files } with each new File, { type: "remove", attachment } or { type: "clear" } after a send); cancelable – prevent it to control `value`
 * @fires tc-text-change - The message was edited ({ text }: MultimodalTextChange); cancelable – prevent it to control `text`
 * @fires tc-send - Send was pressed, or Enter in the message ({ text, attachments }: MultimodalSend); cancelable – prevented, the box keeps its text and attachments
 * @fires tc-retry - Retry was pressed on an attachment that failed ({ attachment, file }: MultimodalRetry – `file` when it was added here)
 * @fires tc-reject - Files were turned away ({ rejections }: MultimodalReject)
 */
export class TcMultimodalInput extends TcElement {
  static override ui = "mmi";

  /** The attachments. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: MultimodalAttachment[] = [];
  /** The message. Changed by the user unless a tc-text-change listener calls preventDefault() */
  @property() accessor text = "";
  /** The message's placeholder */
  @property() accessor placeholder = "Write a message, or drop files here";
  /** Names the message box for screen readers */
  @property() accessor label = "Message";
  /** What it accepts: extensions (".pdf"), MIME types ("image/png") or families ("audio/*"); unset accepts any file */
  @property({ attribute: false }) accessor accept: string[] | undefined = undefined;
  /** The largest file, in bytes, for any kind without its own limit */
  @property({ type: Number, attribute: "max-size" }) accessor maxSize = 20 * MB;
  /** The largest file per kind, in bytes – { video: 200 * 1024 * 1024 } */
  @property({ attribute: false }) accessor limits: Partial<Record<MultimodalKind, number>> = {};
  /** How many attachments fit */
  @property({ type: Number, attribute: "max-files" }) accessor maxFiles = 10;
  /** The token budget for the attachments; over it, Send waits. Unset shows the total alone */
  @property({ type: Number }) accessor budget: number | undefined = undefined;
  /** The Send button's name */
  @property({ attribute: "send-label" }) accessor sendLabel = "Send";
  /** Turns the box off */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** @internal Files are being dragged over the box: how many */
  @state() accessor dragging = 0;
  /** @internal What was turned away last */
  @state() accessor rejections: MultimodalRejection[] = [];
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-mmi${++instances}`;
  private files = new Map<string, File>();
  private urls = new Map<string, string>();
  private depth = 0;
  private added = 0;
  private readonly toolbar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-mmi__tile-btn")] });

  override disconnectedCallback() {
    super.disconnectedCallback();
    // A move within the page reconnects at once; a removal frees the thumbnails
    queueMicrotask(() => {
      if (this.isConnected) return;
      for (const url of this.urls.values()) URL.revokeObjectURL(url);
      this.urls.clear();
      this.files.clear();
    });
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("value")) {
      // Thumbnails and files of attachments that are gone are let go
      const ids = new Set(this.value.map((a) => a.id));
      for (const [id, url] of this.urls)
        if (!ids.has(id)) {
          URL.revokeObjectURL(url);
          this.urls.delete(id);
        }
      for (const id of this.files.keys()) if (!ids.has(id)) this.files.delete(id);
    }
  }

  /* ---------- The checks ---------- */

  private limitFor(kind: MultimodalKind) {
    return this.limits[kind] ?? this.maxSize;
  }

  /** Why a file is turned away, or null */
  private reasonFor(file: File) {
    const kind = multimodalKind(file);
    const accept = this.accept;
    if (accept?.length && !accept.some((a) => matches(a, file))) {
      const e = ext(file.name);
      const same = accept.filter((a) => entryKind(a) === kind).map(entryLabel);
      const what = e ? `${e.toUpperCase()} files aren't supported` : "This type of file isn't supported";
      return same.length ? `${what} – use ${list(same)}` : `${KIND_NAME[kind][1]} aren't supported here`;
    }
    const limit = this.limitFor(kind);
    if (file.size > limit) return `${formatBytes(file.size)} – ${KIND_NAME[kind][1].toLowerCase()} can be up to ${formatBytes(limit)}`;
    return null;
  }

  /** Adds files as if they were dropped: checks each, turns away what doesn't fit, and fires tc-value-change for the rest */
  addFiles(files: Iterable<File>) {
    if (this.disabled) return;
    const rejections: MultimodalRejection[] = [];
    const take: MultimodalFile[] = [];
    let room = Math.max(0, this.maxFiles - this.value.length);
    for (const file of files) {
      const reason = this.reasonFor(file);
      if (reason) {
        rejections.push({ name: file.name, reason });
        continue;
      }
      if (room <= 0) {
        rejections.push({ name: file.name, reason: `Only ${plural(this.maxFiles, "attachment")} fit` });
        continue;
      }
      room--;
      const kind = multimodalKind(file);
      const attachment: MultimodalAttachment = { id: `${this.uid}-a${++this.added}`, name: file.name, kind, type: file.type || undefined, size: file.size, status: "queued" };
      take.push({ attachment, file });
    }
    this.rejections = rejections;
    if (rejections.length) this.emit<MultimodalReject>("tc-reject", { rejections });
    const said: string[] = [];
    if (take.length) {
      // A local thumbnail for images until the app gives a preview
      for (const t of take)
        if (t.attachment.kind === "image" && typeof URL.createObjectURL === "function") {
          const url = URL.createObjectURL(t.file);
          this.urls.set(t.attachment.id, url);
          t.attachment.preview = url;
        }
      const value = [...this.value, ...take.map((t) => t.attachment)];
      if (this.emit<MultimodalValueChange>("tc-value-change", { value, change: { type: "add", files: take } }, { cancelable: true })) this.value = value;
      for (const t of take) this.files.set(t.attachment.id, t.file);
      said.push(`Attached ${take.length === 1 ? take[0].file.name : plural(take.length, "file")}`);
    }
    if (rejections.length) said.push(rejections.length === 1 ? `${rejections[0].name} wasn't attached: ${rejections[0].reason}` : `${plural(rejections.length, "file")} weren't attached`);
    if (said.length) this.spoken = said.join(". ");
  }

  /* ---------- Changes ---------- */

  private removeAttachment(a: MultimodalAttachment) {
    const tiles = [...this.querySelectorAll<HTMLElement>(".ui-mmi__tile")];
    const at = tiles.findIndex((t) => t.dataset.id === a.id);
    const nextId = tiles[at + 1]?.dataset.id ?? tiles[at - 1]?.dataset.id;
    const hadFocus = !!tiles[at]?.contains(document.activeElement);
    const value = this.value.filter((x) => x.id !== a.id);
    if (!this.emit<MultimodalValueChange>("tc-value-change", { value, change: { type: "remove", attachment: a } }, { cancelable: true })) return;
    this.value = value;
    this.spoken = `Removed ${a.name}`;
    if (!hadFocus) return;
    void this.updateComplete.then(() => {
      const target = nextId ? this.querySelector<HTMLElement>(`.ui-mmi__tile[data-id="${CSS.escape(nextId)}"] .ui-mmi__remove`) : this.querySelector<HTMLElement>(".ui-mmi__message");
      target?.focus();
    });
  }

  private setText(text: string) {
    if (this.emit<MultimodalTextChange>("tc-text-change", { text }, { cancelable: true })) this.text = text;
    else this.requestUpdate();
  }

  /** @internal Why Send waits, or "" */
  private get blocked() {
    const v = this.value;
    const busy = v.filter((a) => a.status === "queued" || a.status === "uploading").length;
    if (busy) return `Waiting for ${plural(busy, "upload")}`;
    if (v.some((a) => a.status === "failed")) return "Retry or remove the file that didn't upload";
    if (this.budget !== undefined && this.total > this.budget) return `${compact(this.total - this.budget)} tokens over the budget`;
    return "";
  }
  /** @internal */
  private get total() {
    return this.value.reduce((n, a) => n + (a.tokens ?? 0), 0);
  }

  private trySend() {
    if (this.disabled || this.blocked || (!this.text.trim() && !this.value.length)) return;
    const detail: MultimodalSend = { text: this.text, attachments: this.value };
    if (!this.emit<MultimodalSend>("tc-send", detail, { cancelable: true })) return;
    this.setText("");
    if (this.value.length && this.emit<MultimodalValueChange>("tc-value-change", { value: [], change: { type: "clear" } }, { cancelable: true })) this.value = [];
    this.rejections = [];
    this.spoken = "Sent";
  }

  /* ---------- Input ---------- */

  private hasFiles(e: DragEvent) {
    return !this.disabled && !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
  }
  private onDragEnter = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth += 1;
    this.dragging = Math.max(1, e.dataTransfer!.items?.length ?? 1);
  };
  private onDragOver = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  };
  private onDragLeave = () => {
    this.depth = Math.max(0, this.depth - 1);
    if (!this.depth) this.dragging = 0;
  };
  private onDrop = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth = 0;
    this.dragging = 0;
    this.addFiles(e.dataTransfer!.files);
  };
  private onPaste = (e: ClipboardEvent) => {
    const files = [...(e.clipboardData?.files ?? [])];
    if (!files.length) return;
    e.preventDefault();
    this.addFiles(files);
  };
  private onMessageKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.trySend();
    }
  };
  private onTilesKey = (e: KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      const id = (e.target as HTMLElement).closest<HTMLElement>(".ui-mmi__tile")?.dataset.id;
      const a = this.value.find((x) => x.id === id);
      if (!a) return;
      e.preventDefault();
      this.removeAttachment(a);
      return;
    }
    this.toolbar.onKeyDown(e);
  };

  /* ---------- Rendering ---------- */

  /** @internal "2.4 MB · 1:24 · ≈ 1.2k tokens", or the upload's progress, or why it failed */
  private meta(a: MultimodalAttachment) {
    if (a.status === "failed") return a.error ? `Didn't upload – ${a.error}` : "Didn't upload";
    if (a.status === "queued") return `${formatBytes(a.size)} · Waiting to upload`;
    if (a.status === "uploading") return `Uploading ${Math.round((a.progress ?? 0) * 100)}%`;
    const parts = [formatBytes(a.size)];
    if (a.tokens !== undefined) parts.push(`≈ ${compact(a.tokens)} tokens`);
    else parts.push("Estimating tokens");
    return parts.join(" · ");
  }

  /** @internal The thumbnail: the image, or the kind's icon with its length or page count */
  private thumb(a: MultimodalAttachment) {
    const badge = a.duration !== undefined ? clock(a.duration) : a.pages !== undefined ? `${a.pages} p.` : "";
    const img = a.preview && (a.kind === "image" || a.kind === "video");
    return html`<span class="ui-mmi__thumb" data-kind=${a.kind} ?data-image=${!!img}>
      ${img ? html`<img src=${a.preview!} alt="" loading="lazy" decoding="async" />` : KIND_ICON[a.kind]()}
      ${img && a.kind === "video" ? play() : nothing}
      ${badge ? html`<span class="ui-mmi__badge">${badge}</span>` : nothing}
    </span>`;
  }

  private tile(a: MultimodalAttachment) {
    const descId = `${a.id}-d`;
    const kindWord = KIND_NAME[a.kind][0];
    const extra = a.duration !== undefined ? `, ${clock(a.duration)} long` : a.pages !== undefined ? `, ${plural(a.pages, "page")}` : "";
    return html`<div class="ui-mmi__tile" role="group" aria-label=${a.name} data-id=${a.id} data-status=${a.status} data-kind=${a.kind}>
      ${this.thumb(a)}
      <span class="ui-mmi__info">
        <span class="ui-mmi__name" title=${a.name}>${a.name}</span>
        <span class="ui-mmi__meta" id=${descId}><span class="ui-mmi__sr">${kindWord}${extra}. </span>${this.meta(a)}</span>
      </span>
      ${a.status === "uploading" || a.status === "queued"
        ? html`<span class="ui-mmi__bar" aria-hidden="true"><span style=${styleMap({ transform: `scaleX(${Math.max(0, Math.min(1, a.progress ?? 0))})` })}></span></span>`
        : nothing}
      <span class="ui-mmi__tile-actions">
        ${a.status === "failed"
          ? html`<button type="button" class="ui-mmi__tile-btn ui-mmi__retry" aria-label=${`Retry ${a.name}`} aria-describedby=${descId} title="Retry" ?disabled=${this.disabled} @click=${() =>
              this.emit<MultimodalRetry>("tc-retry", { attachment: a, ...(this.files.has(a.id) ? { file: this.files.get(a.id) } : {}) })}>${retry()}</button>`
          : nothing}
        <button type="button" class="ui-mmi__tile-btn ui-mmi__remove" aria-label=${`Remove ${a.name}`} aria-describedby=${descId} title="Remove" ?disabled=${this.disabled} @click=${() => this.removeAttachment(a)}>${cross()}</button>
      </span>
    </div>`;
  }

  private renderTotals() {
    const v = this.value;
    const total = this.total;
    const estimating = v.filter((a) => a.tokens === undefined && a.status !== "failed").length;
    const budget = this.budget;
    const over = budget !== undefined && total > budget;
    const blocked = this.blocked;
    const hint = this.hintText;
    return html`<div class="ui-mmi__totals" id=${`${this.uid}-totals`}>
      ${v.length
        ? html`<span class="ui-mmi__count">${plural(v.length, "attachment")}</span>
            <span class="ui-mmi__tokens" ?data-over=${over}>
              ${budget !== undefined
                ? html`<span class="ui-mmi__meter" aria-hidden="true"><span style=${styleMap({ transform: `scaleX(${Math.min(1, total / Math.max(1, budget))})` })}></span></span>`
                : nothing}
              ≈ ${compact(total)}${budget !== undefined ? ` of ${compact(budget)}` : ""} tokens${estimating ? html`<span class="ui-mmi__estimating"> · ${estimating} estimating</span>` : nothing}
            </span>
            ${blocked ? html`<span class="ui-mmi__wait" ?data-warn=${over || blocked.startsWith("Retry")}>${blocked}</span>` : nothing}`
        : html`<span class="ui-mmi__hint">${hint}</span>`}
    </div>`;
  }

  /** @internal "Images, recordings, PDF · up to 20 MB each" */
  private get hintText() {
    const accept = this.accept;
    // Three kinds or more read as kinds ("images, recordings and documents"); fewer as formats ("PNG, JPEG or PDF")
    const kinds = KINDS.filter((k) => accept?.some((a) => entryKind(a) === k));
    const what = !accept?.length
      ? "Images, audio, video or documents"
      : kinds.length >= 3
        ? list(kinds.map((k) => KIND_NAME[k][1].toLowerCase()))
        : list([...new Set(accept.map(entryLabel))].slice(0, 4));
    const sized = Object.keys(this.limits).length ? "" : ` · up to ${formatBytes(this.maxSize)} each`;
    return `${what.charAt(0).toUpperCase()}${what.slice(1)}${sized}`;
  }

  protected override render() {
    const v = this.value;
    const clean = this.resolvedLook === "clean";
    const blocked = this.blocked;
    const canSend = !this.disabled && !blocked && (!!this.text.trim() || v.length > 0);
    const inputId = `${this.uid}-file`;
    const rejId = `${this.uid}-rej`;
    const box = html`<div
      class="ui-mmi__box"
      ?data-dragging=${this.dragging > 0}
      @dragenter=${this.onDragEnter}
      @dragover=${this.onDragOver}
      @dragleave=${this.onDragLeave}
      @drop=${this.onDrop}
    >
      ${v.length
        ? html`<div class="ui-mmi__tiles" role="toolbar" aria-label=${`Attachments: ${v.length}`} @keydown=${this.onTilesKey} @focusin=${this.toolbar.onFocusIn}>
            ${repeat(v, (a) => a.id, (a) => this.tile(a))}
          </div>`
        : nothing}
      ${this.rejections.length
        ? html`<div class="ui-mmi__rejected" id=${rejId}>
            ${alert()}
            <ul class="ui-mmi__rej-list">
              ${this.rejections.map((r) => html`<li><span class="ui-mmi__rej-name">${r.name}</span> – ${r.reason}</li>`)}
            </ul>
            <button type="button" class="ui-mmi__icon-btn ui-mmi__dismiss" aria-label="Dismiss" title="Dismiss" @click=${() => {
              this.rejections = [];
              void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-mmi__message")?.focus());
            }}>${cross()}</button>
          </div>`
        : nothing}
      <textarea
        class="ui-mmi__message"
        rows="1"
        aria-label=${this.label}
        aria-describedby=${ifDefined(this.rejections.length ? rejId : undefined)}
        placeholder=${this.placeholder}
        .value=${live(this.text)}
        ?disabled=${this.disabled}
        @input=${(e: Event) => this.setText((e.target as HTMLTextAreaElement).value)}
        @keydown=${this.onMessageKey}
        @paste=${this.onPaste}
      ></textarea>
      <div class="ui-mmi__tools">
        <input
          id=${inputId}
          class="ui-mmi__file"
          type="file"
          multiple
          tabindex="-1"
          aria-hidden="true"
          accept=${ifDefined(this.accept?.join(","))}
          ?disabled=${this.disabled}
          @change=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            if (input.files) this.addFiles(input.files);
            input.value = "";
          }}
        />
        <button
          type="button"
          class="ui-mmi__icon-btn ui-mmi__attach"
          aria-label="Attach files"
          aria-describedby=${`${this.uid}-totals`}
          title="Attach files"
          ?disabled=${this.disabled}
          @click=${() => this.querySelector<HTMLInputElement>(`#${this.uid}-file`)?.click()}
        >${clip()}</button>
        ${clean ? this.renderTotals() : html`<span class="ui-mmi__spacer"></span>`}
        <button type="button" class="ui-mmi__send" aria-label=${this.sendLabel} title=${blocked || this.sendLabel} ?disabled=${!canSend} @click=${() => this.trySend()}>${send()}</button>
      </div>
      ${this.dragging
        ? html`<div class="ui-mmi__drop" aria-hidden="true"><span>${clip()}Drop to attach ${this.dragging === 1 ? "1 file" : `${this.dragging} files`}</span></div>`
        : nothing}
    </div>`;
    return html`
      ${box}
      ${clean ? nothing : this.renderTotals()}
      <span class="ui-mmi__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="mmi"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-mmi / inline-size;
}
/* Standard: a gray tray around the white box; the totals sit on the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mmi"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
[data-ui="mmi"] *, [data-ui="mmi"] *::before, [data-ui="mmi"] *::after { box-sizing: border-box; }
[data-ui="mmi"] svg { display: block; flex: none; }
[data-ui="mmi"] ul { margin: 0; padding: 0; list-style: none; }
:where([data-ui="mmi"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mmi"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mmi"] button:disabled { cursor: not-allowed; }
.ui-mmi__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-mmi__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-mmi__glyph { stroke-width: 1.5; }
.ui-mmi__file { display: none; }
/* ----- The box: tiles, the message, the tools ----- */
.ui-mmi__box { position: relative; display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mmi__box:focus-within { box-shadow: var(--tc-card-shadow), 0 0 0 var(--tc-focus-halo-width) var(--tc-focus-halo); }
:where([data-look="clean"], [data-look="clean"] *).ui-mmi__box { padding: var(--tc-space-3); background: var(--tc-surface-raised); }
.ui-mmi__box[data-dragging] { box-shadow: var(--tc-card-shadow), inset 0 0 0 1.5px var(--tc-accent); }
.ui-mmi__drop { position: absolute; inset: 0; display: grid; place-items: center; border-radius: inherit; background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); pointer-events: none; animation: ui-mmi-in var(--tc-duration-fast) var(--tc-ease-standard) both; }
.ui-mmi__drop > span { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
/* Tiles: a thumbnail, the name, the state; their buttons on the right */
.ui-mmi__tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(188px, 1fr)); gap: var(--tc-space-1-5); }
.ui-mmi__tile { position: relative; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-2-5); min-width: 0; height: 56px; padding: var(--tc-space-2) var(--tc-space-1) var(--tc-space-2) var(--tc-space-2); overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); animation: ui-mmi-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-mmi__tile { border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mmi__tile[data-status="failed"] { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); }
.ui-mmi__thumb { position: relative; display: grid; place-items: center; width: 40px; height: 40px; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-mmi__thumb { border-radius: var(--tc-radius-sm); }
.ui-mmi__thumb[data-kind="image"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-mmi__thumb[data-kind="audio"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-mmi__thumb[data-kind="video"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-mmi__thumb[data-kind="document"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-mmi__thumb[data-image] { background: var(--tc-fill-default); }
.ui-mmi__thumb img { width: 100%; height: 100%; object-fit: cover; }
.ui-mmi__kind-svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-mmi__kind-svg { stroke-width: 1.35; }
.ui-mmi__play { position: absolute; width: 16px; height: 16px; fill: var(--tc-text-on-inverse); stroke: none; filter: drop-shadow(0 0 1px var(--tc-shadow-color-strong)); }
.ui-mmi__badge { position: absolute; right: var(--tc-space-0-5); bottom: var(--tc-space-0-5); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); font-variant-numeric: tabular-nums; }
.ui-mmi__info { display: grid; min-width: 0; }
.ui-mmi__name { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; }
.ui-mmi__meta { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-mmi__tile[data-status="failed"] .ui-mmi__meta { color: var(--tc-status-danger-fg); }
.ui-mmi__bar { position: absolute; right: var(--tc-space-2); bottom: var(--tc-space-1); left: var(--tc-space-2); height: 2px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-mmi__bar > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-accent); transform-origin: left; transition: transform var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-mmi__tile-actions { display: flex; align-items: center; }
.ui-mmi__tile-btn, .ui-mmi__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mmi__tile-btn .ui-mmi__glyph { width: 14px; height: 14px; }
[data-ui="mmi"] :is(.ui-mmi__tile-btn, .ui-mmi__icon-btn):hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-mmi__retry { color: var(--tc-status-danger-fg); }
/* Turned away: what and why */
.ui-mmi__rejected { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-1) var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mmi__rejected > svg { margin-top: var(--tc-space-0-5); color: var(--tc-status-warning-fg); }
.ui-mmi__rej-list { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; margin-top: var(--tc-space-0-5) !important; overflow-wrap: anywhere; }
.ui-mmi__rej-name { font-weight: var(--tc-font-weight-medium); }
.ui-mmi__dismiss { flex: none; width: 24px; height: 24px; }
/* The message */
.ui-mmi__message { display: block; width: 100%; min-height: 44px; max-height: 200px; margin: 0; padding: var(--tc-space-1) var(--tc-space-1-5); border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; line-height: var(--tc-line-height-normal); resize: none; field-sizing: content; }
.ui-mmi__message::placeholder { color: var(--tc-text-placeholder); }
.ui-mmi__message:disabled { cursor: not-allowed; }
.ui-mmi__tools { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-mmi__spacer { flex: 1; }
.ui-mmi__attach { color: var(--tc-text-secondary); }
/* Send: a square primary action at control height */
.ui-mmi__send { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-mmi__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-mmi__send:active:not(:disabled) { transform: scale(0.96); }
:where([data-look="clean"], [data-look="clean"] *).ui-mmi__send { width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); }
[data-ui="mmi"] .ui-mmi__send:disabled { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); }
/* ----- The totals: on the tray (Standard), or the box's last row (Clean) ----- */
.ui-mmi__totals { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mmi__totals { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mmi__totals { flex: 1; }
.ui-mmi__count { color: var(--tc-text-secondary); }
.ui-mmi__tokens { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); }
.ui-mmi__tokens[data-over] { color: var(--tc-status-danger-fg); }
.ui-mmi__meter { width: 48px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-meter-track); }
.ui-mmi__meter > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transform-origin: left; transition: transform var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-mmi__tokens[data-over] .ui-mmi__meter > span { background: var(--tc-status-danger-solid); }
.ui-mmi__estimating { color: var(--tc-text-muted); }
.ui-mmi__wait { color: var(--tc-text-muted); }
.ui-mmi__wait[data-warn] { color: var(--tc-status-danger-fg); }
@keyframes ui-mmi-in { from { opacity: 0; transform: translateY(2px); } }
/* Narrow: one tile a row */
@container ui-mmi (max-width: 460px) {
  .ui-mmi__tiles { grid-template-columns: minmax(0, 1fr); }
}
@media (pointer: coarse) {
  .ui-mmi__tile-btn, .ui-mmi__icon-btn { width: 40px; height: 40px; }
  .ui-mmi__send { width: 40px; height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mmi"] *, [data-ui="mmi"] *::before, [data-ui="mmi"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-multimodal-input")) customElements.define("tc-multimodal-input", TcMultimodalInput);

declare global {
  interface HTMLElementTagNameMap {
    "tc-multimodal-input": TcMultimodalInput;
  }
}
