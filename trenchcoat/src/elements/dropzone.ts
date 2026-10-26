import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-dropzone> – the Lit port of src/components/dropzone.tsx: drag files in and watch them upload.
 * Dragging files over the area fans out the little documents and says how many will drop. Every file gets a row with
 * a colored type badge, size, time left and its own progress bar; files that are too large or of the wrong type say
 * so, a failed upload can be retried, any row can be removed. Without `onUpload` the uploads are simulated – set
 * `demo` for a preview, or it warns once that nothing is uploaded. Clean has no tray – one white card with hairline
 * shadows, a dashed drop area, quiet rows and the summary as the card's last row.
 *
 *   <form><tc-dropzone name="files" required .accept=${[".pdf", "image/*"]} .onUpload=${upload}></tc-dropzone></form>
 *
 * Every change of the list fires a cancelable `tc-value-change` ({ value }): preventDefault() and pass the list back
 * through `value` to own it. It's a form-associated element: the added files (not the rejected ones) are submitted
 * under `name`, `required` asks for at least one, a form reset brings back the first list, a disabled fieldset
 * disables it.
 */

export type UploadStatus = "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  name: string;
  /** In bytes */
  size: number;
  status: UploadStatus;
  /** 0 to 1 */
  progress: number;
  error?: string;
  /** The real file – missing for the sample files */
  file?: File;
};

/** Uploads a file and reports its progress (0–1); throws to mark it as failed. `signal` aborts when the row is removed or the dropzone goes away */
export type DropzoneUpload = (file: File, onProgress: (progress: number) => void, signal: AbortSignal) => Promise<void>;

/** What the dropzone keeps about its own uploads: the simulation's timing, and whether a retry makes sense */
type Extra = { failAt?: number; retryable?: boolean; startedAt: number; duration: number };
type Row = UploadItem & { removing?: boolean };

const MB = 1024 * 1024;

/* ---------- Helpers ---------- */

const ext = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

/** Number and unit joined by a no-break space, so "25 MB" never splits across lines */
const formatSize = (bytes: number) =>
  bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;

/** "1.2 of 4.1 MB" */
const formatPart = (done: number, total: number) =>
  total < MB ? `${Math.round(done / 1024)} of ${formatSize(total)}` : `${(done / MB).toFixed(1)} of ${formatSize(total)}`;

const formatLeft = (s: number) => (s < 1 ? "almost done" : s < 60 ? `${Math.ceil(s)}s left` : `${Math.ceil(s / 60)} min left`);

/** Badge color per file type, for each look */
const KINDS: { exts: string[]; color: Record<Look, string> }[] = [
  { exts: ["pdf"], color: { standard: "#e5484d", clean: "#e5484d" } },
  { exts: ["xls", "xlsx", "csv", "numbers"], color: { standard: "#2f9e5b", clean: "#1a9a52" } },
  { exts: ["doc", "docx", "txt", "md", "pages", "rtf"], color: { standard: "#2f6bff", clean: "#0060e2" } },
  { exts: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "avif"], color: { standard: "#8b5cf6", clean: "#5B5BD6" } },
  { exts: ["mp4", "mov", "webm", "mp3", "wav"], color: { standard: "#f08c00", clean: "#e8a20c" } },
  { exts: ["ppt", "pptx", "key"], color: { standard: "#e8590c", clean: "#e8590c" } },
];
const kindColor = (name: string, look: Look) => KINDS.find((k) => k.exts.includes(ext(name)))?.color[look] ?? "#8f8f8f";

/** Simulated speed: about 1.2 MB/s with a floor, so small files still visibly fill */
const simDuration = (size: number) => Math.min(9000, Math.max(2600, (size / (1.2 * MB)) * 1000));

// Warns once per page (not per instance) when real files are simulated because onUpload is missing
let warnedSimulatedUpload = false;
const warnSimulatedUpload = () => {
  if (warnedSimulatedUpload) return;
  warnedSimulatedUpload = true;
  console.warn(
    "Dropzone: no onUpload handler – simulating uploads. Set `demo` to keep the simulation, or `onUpload` to wire it up. The simulation will be off by default in the next major version.",
  );
};

/** The time for upload timing – only ever read in handlers and timers, never while rendering */
const now = () => performance.now();

/** MIME types guessed from the name, for files without a type (and the sample files) */
const MIME: Record<string, string> = { pdf: "application/pdf", csv: "text/csv", txt: "text/plain", md: "text/markdown", json: "application/json", zip: "application/zip" };
const KIND_MIME: [string[], string][] = [
  [["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "avif"], "image/"],
  [["mp4", "mov", "webm"], "video/"],
  [["mp3", "wav"], "audio/"],
];
const mimeOf = (name: string, file?: File) => {
  if (file?.type) return file.type.toLowerCase();
  const e = ext(name);
  const kind = KIND_MIME.find(([exts]) => exts.includes(e));
  return kind ? `${kind[1]}${e === "jpg" ? "jpeg" : e === "svg" ? "svg+xml" : e === "mov" ? "quicktime" : e === "mp3" ? "mpeg" : e}` : MIME[e] ?? "";
};
/** One `accept` entry: an extension (without the dot), a MIME type or a wildcard like image/* */
const matches = (entry: string, name: string, file?: File) => {
  if (!entry.includes("/")) return ext(name) === entry;
  const type = mimeOf(name, file);
  return entry.endsWith("/*") ? type.startsWith(entry.slice(0, -1)) : type === entry;
};
/** How an `accept` entry reads in the hint: "PDF", "Images" */
const acceptLabel = (entry: string) => {
  if (!entry.includes("/")) return entry.toUpperCase();
  const [type, sub] = entry.split("/");
  if (sub === "*") return ({ image: "Images", video: "Videos", audio: "Audio", text: "Text files" } as Record<string, string>)[type] ?? `${type} files`;
  return sub.replace(/^(x-|vnd\.)/, "").split(/[.+-]/)[0].toUpperCase();
};

/* ---------- Icons: 24px line glyphs, and (Clean) 16px solid shapes ---------- */

const glyph = (d: string, solid = false, className = "") =>
  html`<svg viewBox=${solid ? "0 0 16 16" : "0 0 24 24"} class=${["ui-dz__glyph", className].filter(Boolean).join(" ")} ?data-solid=${solid} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  upload: "M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15",
  close: "M7 7l10 10M17 7 7 17",
  check: "M5.5 12.5l4 4L18.5 8",
  retry: "M20 12a8 8 0 1 1-2.34-5.66L20 8.5M20 4v4.5h-4.5",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  /* Solid, 16 grid (Clean) */
  checkCircle: "M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z",
  alertCircle: "M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0ZM8 4.6a.6.6 0 0 0-.6.6v3.2a.6.6 0 0 0 1.2 0V5.2a.6.6 0 0 0-.6-.6Zm0 6.9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
};

/** Clean: the 16px file icon of a row – a thin document with a small label in the type's color */
const fileIcon = (name: string) =>
  html`<svg viewBox="0 0 16 16" class="ui-dz__file" aria-hidden="true">${svg`<path class="ui-dz__file-sheet" d="M4 1.75h5l3.25 3.25v8A1.25 1.25 0 0 1 11 14.25H4A1.25 1.25 0 0 1 2.75 13V3A1.25 1.25 0 0 1 4 1.75Z"></path><path class="ui-dz__file-fold" d="M9 1.75V4a1 1 0 0 0 1 1h2.25"></path><rect x="1" y="8.5" width="9" height="4.5" rx="1.25" fill=${kindColor(name, "clean")}></rect>`}</svg>`;

/** A small document with a folded corner and a colored type label – on the left, or on the right with `end` */
const fileBadge = (name: string, look: Look, end = false) => {
  const label = (ext(name) || "file").slice(0, 4).toUpperCase();
  const width = Math.max(18, label.length * (look === "clean" ? 5.2 : 5.4) + 8);
  const x = end ? 30 - width : 0;
  const color = kindColor(name, look);
  return html`<svg viewBox="0 0 30 36" class="ui-dz__badge" aria-hidden="true">${svg`<path d="M5 1h14l10 10v20a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4z" class="ui-dz__badge-sheet"></path><path d="M19 1v6a4 4 0 0 0 4 4h6" class="ui-dz__badge-fold"></path><rect x=${x} y="19" width=${width} height="11" rx="3" fill=${color} fill-opacity=${look === "clean" ? "0.12" : "0.14"}></rect><text x=${x + 4} y="27.2" class="ui-dz__badge-text" fill=${color}>${label}</text>`}</svg>`;
};

/* ---------- Sample drop for previews ---------- */

const SAMPLE = [
  { name: "Q3-Board-Report.pdf", size: 4.2 * MB },
  { name: "Hero-Shot.png", size: 2.6 * MB },
  { name: "Budget-2027.xlsx", size: 1.3 * MB, failAt: 0.62 },
  { name: "Product-Demo.mp4", size: 48 * MB },
];

/** How often progress that only moves pixels is committed (and reported through tc-value-change) */
const FLUSH_MS = 1000;

/** Writes into the text node Lit rendered, so Lit keeps owning it */
const setText = (el: Element | null | undefined, value: string) => {
  const node = el && ([...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE) as Text | undefined);
  if (node && node.data !== value) node.data = value;
};

/** "4s left" for one row – from its progress and how long it has been running */
const leftText = (progress: number, x: Extra | undefined, at: number) =>
  progress < 0.04 || !x || at <= x.startedAt ? "starting" : formatLeft(((1 - progress) * (at - x.startedAt)) / Math.max(0.05, progress) / 1000);

let instances = 0;

/**
 * Drag files in and watch them upload – a form-associated element.
 * @tag tc-dropzone
 * @fires tc-value-change - The list of files changed (added, progressed, finished, failed, removed); detail `{ value: UploadItem[] }`. Cancelable.
 */
export class TcDropzone extends TcElement {
  static override ui = "dz";
  static formAssociated = true;

  /** Allowed types: extensions (".pdf"), MIME types ("application/pdf") or wildcards ("image/*") – any file when unset */
  @property({ attribute: false }) accessor accept: string[] | undefined = undefined;
  /** Largest file in bytes */
  @property({ type: Number, attribute: "max-size" }) accessor maxSize = 25 * MB;
  /** Uploads a file; simulated when unset (and warns once, unless `demo` is set) */
  @property({ attribute: false }) accessor onUpload: DropzoneUpload | undefined = undefined;
  /** The list of files */
  @property({ attribute: false }) accessor value: UploadItem[] = [];
  /** Name for form submission: the added files (not the rejected ones) are submitted under it */
  @property({ reflect: true }) accessor name = "";
  /** A form needs at least one file that isn't rejected */
  @property({ type: Boolean }) accessor required = false;
  /** No files can be added, retried or removed */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Text under the title – defaults to the accepted types and size */
  @property() accessor hint: string | undefined = undefined;
  /** Plays a sample drop on its own – nice for previews */
  @property({ type: Boolean }) accessor autoplay = false;
  /** Demo mode: files dropped without onUpload are simulated silently */
  @property({ type: Boolean }) accessor demo = false;

  @state() private accessor formDisabled = false;
  /** What only this dropzone knows about its own uploads */
  @state() private accessor extra: Record<string, Extra> = {};
  /** Removed rows flash briefly at their old place, then fold away */
  @state() private accessor leaving: { item: UploadItem; index: number }[] = [];
  /** Number of files over the area, 0 = none */
  @state() private accessor dragging = 0;
  @state() private accessor announce = "";

  private readonly internals: ElementInternals;
  private readonly uid = `tc-dz${++instances}`;
  private counter = 0;
  /** The newest list, also between a change and the update that shows it */
  private latest: UploadItem[] = [];
  private initialValue: UploadItem[] | null = null;
  /** One controller per running upload, so removing its row (or the element) cancels it */
  private uploads = new Map<string, AbortController>();
  private timers = new Set<number>();
  /** Progress between commits, per row id */
  private live = new Map<string, number>();
  private lastFlush = 0;
  private frame = 0;
  private flushTimer = 0;
  private ticker = 0;
  private painter = 0;
  private onScreen = true;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private sized: [HTMLElement, HTMLElement] | null = null;
  private depth = 0;
  private lastIds = "";

  constructor() {
    super();
    this.internals = this.attachInternals();
    // Anything that takes the focused control away (a parent changing `value`, disabling) – focus goes to the drop area
    new FocusRescueController(this, () => this.area);
  }

  private get area() {
    return this.querySelector<HTMLButtonElement>(".ui-dz__area");
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.initialValue === null) this.initialValue = [...this.value];
    // Off-screen and hidden tabs aren't painted; both catch up when they're seen again
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver(([entry]) => {
        this.onScreen = entry.isIntersecting;
        this.paint();
      });
      this.io.observe(this);
    }
    document.addEventListener("visibilitychange", this.paint);
    if (this.autoplay) this.playSample();
  }

  /** The sample: files are dragged over, then dropped – once per connection, also when `autoplay` is set after it
   *  (frameworks such as React set properties after the element is in the page) */
  private sampled = false;
  private playSample() {
    if (this.sampled) return;
    this.sampled = true;
    this.later(() => (this.dragging = SAMPLE.length), 700);
    this.later(() => {
      this.dragging = 0;
      SAMPLE.forEach((s, n) => this.later(() => this.start(s), n * 140));
    }, 1900);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.uploads.forEach((c) => c.abort());
    this.uploads.clear();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.io?.disconnect();
    this.ro?.disconnect();
    this.ro = undefined;
    this.sized = null;
    document.removeEventListener("visibilitychange", this.paint);
    cancelAnimationFrame(this.frame);
    clearTimeout(this.flushTimer);
    clearInterval(this.ticker);
    clearInterval(this.painter);
    this.frame = this.flushTimer = this.ticker = this.painter = 0;
    // Back in the page: the sample may play again
    this.sampled = false;
  }

  formResetCallback() {
    this.setItems(() => [...(this.initialValue ?? [])]);
  }
  formDisabledCallback(disabled: boolean) {
    // Called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private later(run: () => void, ms: number) {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      run();
    }, ms);
    this.timers.add(t);
  }

  /* ---------- The list ---------- */

  /** Every change goes through here: reported, and applied unless a listener prevents it */
  private setItems(next: (list: UploadItem[]) => UploadItem[]) {
    const resolved = next(this.latest);
    if (resolved === this.latest) return;
    this.latest = resolved;
    if (this.emit("tc-value-change", { value: resolved }, { cancelable: true })) this.value = resolved;
  }
  private patch(id: string, patch: Partial<UploadItem>) {
    this.setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  private note(id: string, patch: Partial<Extra>) {
    if (this.extra[id]) this.extra = { ...this.extra, [id]: { ...this.extra[id], ...patch } };
  }

  /** Checks a file and starts its upload */
  private start(entry: { name: string; size: number; file?: File; failAt?: number }) {
    const id = `${this.uid}-${(this.counter++).toString(36)}`;
    const accepted = this.accepted;
    let error: string | undefined;
    if (accepted?.length && !accepted.some((a) => matches(a, entry.name, entry.file))) error = ext(entry.name) ? `.${ext(entry.name)} files aren't supported` : "This file type isn't supported";
    else if (entry.size > this.maxSize) error = `Too large – max ${formatSize(this.maxSize)}`;
    const item: UploadItem = { id, name: entry.name, size: entry.size, file: entry.file, status: error ? "error" : "uploading", progress: 0, error };
    this.extra = { ...this.extra, [id]: { failAt: entry.failAt, startedAt: now(), duration: simDuration(entry.size) } };
    this.setItems((list) => [...list, item]);
    if (error) this.announce = `${entry.name}: ${error}`;
    else if (this.onUpload && entry.file) this.run(item);
    else if (entry.file && !this.demo) warnSimulatedUpload();
  }

  /** A real upload through `onUpload`; whatever it reports after its row is gone is ignored */
  private run(item: UploadItem) {
    const upload = this.onUpload!;
    const controller = new AbortController();
    this.uploads.get(item.id)?.abort();
    this.uploads.set(item.id, controller);
    const { signal } = controller;
    const settle = () => {
      if (this.uploads.get(item.id) === controller) this.uploads.delete(item.id);
      this.live.delete(item.id);
    };
    Promise.resolve()
      .then(() => upload(item.file!, (p) => !signal.aborted && this.report(item.id, Math.max(0, Math.min(1, p))), signal))
      .then(() => {
        settle();
        if (signal.aborted) return;
        this.patch(item.id, { status: "done", progress: 1 });
        this.announce = `${item.name} uploaded`;
      })
      .catch((e: unknown) => {
        if (!signal.aborted) {
          // The bar stops where the upload got to
          const progress = this.live.get(item.id);
          const message = e instanceof Error && e.message ? e.message : "Upload failed";
          this.patch(item.id, { status: "error", error: message, ...(progress !== undefined && { progress }) });
          this.note(item.id, { retryable: true });
          this.announce = `${item.name}: ${message}`;
        }
        settle();
      });
  }

  private addFiles(files: FileList | File[]) {
    if (this.isDisabled) return;
    Array.from(files).forEach((file) => this.start({ name: file.name, size: file.size, file }));
  }

  private retry(item: UploadItem) {
    this.live.delete(item.id);
    this.patch(item.id, { status: "uploading", progress: 0, error: undefined });
    this.extra = { ...this.extra, [item.id]: { startedAt: now(), duration: this.extra[item.id]?.duration ?? simDuration(item.size) } };
    if (this.onUpload && item.file) this.run({ ...item, progress: 0 });
  }

  private removeItem(id: string) {
    // Cancels its upload right away; the row itself flashes briefly, then folds away
    this.uploads.get(id)?.abort();
    this.uploads.delete(id);
    const progress = this.live.get(id);
    this.live.delete(id);
    const list = this.latest;
    const found = list.find((i) => i.id === id);
    if (!found) return;
    // The folding row keeps the progress it had reached – and its place among the rows shown, folding ones included,
    // so no row moves (a moved row would lose focus)
    const item = progress !== undefined && found.status === "uploading" ? { ...found, progress } : found;
    const shown = this.rows();
    const index = shown.findIndex((r) => r.id === id);
    this.leaving = [...this.leaving, { item, index: index < 0 ? shown.length : index }];
    this.later(() => (this.leaving = this.leaving.filter((r) => r.item.id !== id)), 480);
    this.setItems((l) => l.filter((i) => i.id !== id));
  }

  private clearDone() {
    // Clear goes away with the rows it clears – focus moves to the drop area
    rescueFocus(this.querySelector(".ui-dz__clear"), [this.area]);
    this.latest.filter((i) => i.status !== "uploading").forEach((i) => this.removeItem(i.id));
  }

  /** Remove: focus moves to the next row's button (or the one before, or the drop area) before the row folds away */
  private removeRow(id: string) {
    const rows = [...this.querySelectorAll<HTMLElement>("li[data-id]:not([data-removing])")];
    const at = rows.findIndex((r) => r.dataset.id === id);
    const button = (row?: HTMLElement) => row?.querySelector<HTMLElement>(".ui-dz__icon-btn:last-child");
    rescueFocus(rows[at], [button(rows[at + 1]), button(rows[at - 1]), this.area]);
    this.removeItem(id);
  }

  /* ---------- Live progress: bars move without updating ---------- */

  /** Writes bars, "1.2 of 4.1 MB", "time left" and the summary straight into the DOM */
  private paint = () => {
    if (!this.isConnected || !this.onScreen || document.visibilityState === "hidden") return;
    const at = now();
    let total = 0;
    let sent = 0;
    const rows = new Map<string, Element>();
    this.querySelectorAll<HTMLElement>("li[data-id]:not([data-removing])").forEach((row) => rows.set(row.dataset.id!, row));
    for (const i of this.value) {
      if (i.status !== "uploading") continue;
      const p = this.live.get(i.id) ?? i.progress;
      total += i.size;
      sent += i.size * p;
      const row = rows.get(i.id);
      if (!row) continue;
      const bar = row.querySelector<HTMLElement>(".ui-dz__bar");
      bar?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      const fill = bar?.firstElementChild as HTMLElement | null | undefined;
      if (fill) fill.style.transform = `scaleX(${p})`;
      setText(row.querySelector('[data-part="sent"]'), formatPart(i.size * p, i.size));
      setText(row.querySelector('[data-part="left"]'), leftText(p, this.extra[i.id], at));
    }
    if (total) setText(this.querySelector('[data-part="total"]'), formatPart(sent, total));
  };

  /** Commits the live progress (plus `ended`: rows whose status changes) to the list */
  private flush(ended?: Map<string, Partial<UploadItem>>) {
    this.lastFlush = now();
    clearTimeout(this.flushTimer);
    this.flushTimer = 0;
    this.setItems((list) => {
      let changed = false;
      const next = list.map((i) => {
        const end = ended?.get(i.id);
        const p = this.live.get(i.id);
        if (end) {
          changed = true;
          return { ...i, ...end };
        }
        if (i.status !== "uploading" || p === undefined || p === i.progress) return i;
        changed = true;
        return { ...i, progress: p };
      });
      return changed ? next : list;
    });
  }

  /** A progress report: painted on the next frame, committed within FLUSH_MS */
  private report(id: string, progress: number) {
    this.live.set(id, progress);
    if (!this.frame)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.paint();
      });
    if (!this.flushTimer) this.flushTimer = window.setTimeout(() => this.flush(), FLUSH_MS);
  }

  /** Simulated uploads move on one ticker: progress is painted, the list changes when a file finishes or fails – and takes the progress along once a second */
  private tick = () => {
    const at = now();
    const ended = new Map<string, Partial<UploadItem>>();
    for (const i of this.value) {
      const x = this.extra[i.id];
      if (i.status !== "uploading" || !x || (this.onUpload && i.file)) continue;
      // Eased with a little jitter, like a real connection
      const raw = Math.min(1, (at - x.startedAt) / x.duration);
      const progress = Math.max(this.live.get(i.id) ?? i.progress, raw < 1 ? raw * (0.92 + Math.random() * 0.08) : 1);
      if (x.failAt !== undefined && progress >= x.failAt) {
        this.announce = `${i.name}: upload failed`;
        this.note(i.id, { retryable: true });
        ended.set(i.id, { progress: x.failAt, status: "error", error: "Connection lost" });
        this.live.delete(i.id);
      } else if (progress >= 1) {
        this.announce = `${i.name} uploaded`;
        ended.set(i.id, { progress: 1, status: "done" });
        this.live.delete(i.id);
      } else this.live.set(i.id, progress);
    }
    if (ended.size || at - this.lastFlush >= FLUSH_MS) this.flush(ended);
    else this.paint();
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.latest = this.value;
    if (changed.has("autoplay") && this.autoplay && this.isConnected) this.playSample();
  }

  protected override updated() {
    this.toggleAttribute("data-disabled", this.isDisabled);
    const items = this.value;
    // A row a parent took out of `value` stops its upload too
    const ids = items.map((i) => i.id).join("\u0001");
    if (ids !== this.lastIds) {
      this.lastIds = ids;
      const present = new Set(items.map((i) => i.id));
      this.uploads.forEach((c, id) => {
        if (present.has(id)) return;
        c.abort();
        this.uploads.delete(id);
      });
      this.live.forEach((_, id) => !present.has(id) && this.live.delete(id));
    }
    // The simulation's ticker, and "time left" counting while anything uploads
    const simulated = items.some((i) => i.status === "uploading" && this.extra[i.id] && (!this.onUpload || !i.file));
    if (simulated && !this.ticker) this.ticker = window.setInterval(this.tick, 90);
    else if (!simulated && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = 0;
    }
    const busy = items.some((i) => i.status === "uploading");
    if (busy && !this.painter) this.painter = window.setInterval(this.paint, 500);
    else if (!busy && this.painter) {
      clearInterval(this.painter);
      this.painter = 0;
    }
    // The live values painted over what was rendered
    this.paint();
    this.syncForm();
    this.syncHeight();
  }

  /** The card (Clean: its content – the last row stays put) glides to its new height whenever rows come, go or change */
  private syncHeight() {
    const outer = this.querySelector<HTMLElement>(this.resolvedLook === "clean" ? ".ui-dz__body" : ".ui-dz__card");
    const inner = this.querySelector<HTMLElement>(".ui-dz__inner");
    if (!outer || !inner || typeof ResizeObserver !== "function") return;
    if (this.sized && this.sized[0] === outer && this.sized[1] === inner) return;
    this.ro?.disconnect();
    this.sized = [outer, inner];
    const set = () => (outer.style.height = `${inner.offsetHeight}px`);
    set();
    this.ro = new ResizeObserver(set);
    this.ro.observe(inner);
  }

  /** The form gets the added files under `name`; `required` asks for one that isn't rejected, pointing at the drop area */
  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const usable = this.value.filter((i) => i.status !== "error");
    const disabled = this.isDisabled;
    if (this.name && !disabled) {
      const data = new FormData();
      usable.forEach((i) => i.file && data.append(this.name, i.file));
      this.internals.setFormValue(data);
    } else this.internals.setFormValue(null);
    if (this.required && !disabled && !usable.length) this.internals.setValidity({ valueMissing: true }, "Add at least one file", this.area ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Render ---------- */

  /** The rows: the list, with removed rows folding away where they were */
  private rows(): Row[] {
    const rows: Row[] = [...this.latest];
    [...this.leaving]
      .sort((a, b) => a.index - b.index)
      .forEach(({ item, index }) => rows.splice(Math.min(index, rows.length), 0, { ...item, removing: true }));
    return rows;
  }

  private get accepted() {
    return this.accept?.map((a) => (a.includes("/") ? a.toLowerCase() : a.replace(/^\./, "").toLowerCase()));
  }

  private onDragEnter(e: DragEvent) {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth += 1;
    this.dragging = Math.max(1, e.dataTransfer!.items.length);
  }
  private onDragOver(e: DragEvent) {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  }
  private onDragLeave() {
    this.depth = Math.max(0, this.depth - 1);
    if (!this.depth) this.dragging = 0;
  }
  private onDrop(e: DragEvent) {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth = 0;
    this.dragging = 0;
    this.addFiles(e.dataTransfer!.files);
  }
  private hasFiles(e: DragEvent) {
    return !this.isDisabled && !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
  }

  private renderArea(look: Look, hint: string): TemplateResult {
    const disabled = this.isDisabled;
    const dragging = this.dragging;
    return html`<input
        id=${this.uid}
        type="file"
        multiple
        aria-label="Choose files"
        accept=${ifDefined(this.accept?.join(","))}
        class="ui-dz__input"
        tabindex="-1"
        ?disabled=${disabled}
        @change=${(e: Event) => {
          const input = e.target as HTMLInputElement;
          if (input.files) this.addFiles(input.files);
          input.value = "";
        }}
      /><button
        type="button"
        class="ui-dz__area"
        ?data-dragging=${dragging > 0}
        aria-describedby=${`${this.uid}-hint`}
        ?disabled=${disabled}
        @click=${() => this.querySelector<HTMLInputElement>(`#${this.uid}`)?.click()}
        @dragenter=${this.onDragEnter}
        @dragover=${this.onDragOver}
        @dragleave=${this.onDragLeave}
        @drop=${this.onDrop}
      >
        <span class="ui-dz__stack" aria-hidden="true"
          ><span class="ui-dz__sheet ui-dz__sheet-l">${fileBadge("file.pdf", look)}</span><span class="ui-dz__sheet ui-dz__sheet-r">${fileBadge("file.png", look, true)}</span><span class="ui-dz__sheet ui-dz__sheet-m">${glyph(icons.upload)}</span></span
        >${keyed(
          dragging ? "drop" : "idle",
          html`<span class="ui-dz__title"
            >${dragging
              ? `Release to upload ${dragging === 1 ? "1 file" : `${dragging} files`}`
              : html`<span class="ui-dz__for-mouse">Drop files here or <span class="ui-dz__browse">browse</span></span><span class="ui-dz__for-touch">Tap to <span class="ui-dz__browse">choose files</span></span>`}</span
          >`,
        )}<span class="ui-dz__hint" id=${`${this.uid}-hint`}>${hint}</span>
      </button>`;
  }

  /** One file: badge, name, "1.2 of 4.1 MB · 4s left" and its bar – the moving parts are painted */
  private renderRow(i: Row, look: Look): TemplateResult {
    const clean = look === "clean";
    const x = this.extra[i.id];
    const disabled = this.isDisabled;
    const retryable = i.status === "error" && (x ? !!x.retryable : !!i.file);
    // A row on its way out is inert: nothing in it can take focus while it folds away
    return html`<li class="ui-dz__row" data-id=${i.id} data-status=${i.status} ?data-removing=${!!i.removing} .inert=${!!i.removing}>
      <div class="ui-dz__row-inner">
        ${clean ? fileIcon(i.name) : fileBadge(i.name, look)}
        <div class="ui-dz__info">
          <div class="ui-dz__line">
            <span class="ui-dz__name" title=${i.name}>${i.name}</span>${i.status === "done"
              ? html`<span class="ui-dz__done" role="img" aria-label="Uploaded">${clean ? glyph(icons.checkCircle, true) : glyph(icons.check)}</span>`
              : nothing}
          </div>
          ${keyed(
            i.status,
            html`<div class="ui-dz__meta">${i.status === "uploading"
              ? html`<span data-part="sent">${formatPart(i.size * i.progress, i.size)}</span><span class="ui-dz__dot">·</span><span data-part="left">starting</span>`
              : i.status === "done"
                ? formatSize(i.size)
                : html`<span class="ui-dz__error">${i.error}</span>`}</div>`,
          )}
          ${i.status !== "error" || retryable
            ? html`<div
                class="ui-dz__bar"
                ?data-hidden=${i.status === "done"}
                role="progressbar"
                aria-label=${`${i.name} upload`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow=${Math.round(i.progress * 100)}
              ><span style=${styleMap({ transform: `scaleX(${i.progress})` })}></span></div>`
            : nothing}
        </div>
        <div class="ui-dz__actions">${retryable
          ? html`<button
              type="button"
              class="ui-dz__icon-btn ui-dz__retry"
              aria-label=${`Retry ${i.name}`}
              ?disabled=${disabled}
              @click=${(e: Event) => {
                // Retry goes away once the upload runs again – focus moves to the row's Remove first
                const b = e.currentTarget as HTMLElement;
                rescueFocus(b, [b.nextElementSibling]);
                this.retry(i);
              }}
            >${glyph(icons.retry)}</button>`
          : nothing}<button type="button" class="ui-dz__icon-btn" aria-label=${`Remove ${i.name}`} ?disabled=${disabled} @click=${() => this.removeRow(i.id)}>${glyph(icons.close)}</button></div>
      </div>
    </li>`;
  }

  /** The last row (Clean) or the tray (Standard): "Uploading 2 of 4 · 1.2 of 8.1 MB", or what got uploaded, and Clear */
  private renderFoot(look: Look): TemplateResult {
    const clean = look === "clean";
    const items = this.value;
    const uploading = items.filter((i) => i.status === "uploading");
    const done = items.filter((i) => i.status === "done");
    const failed = items.filter((i) => i.status === "error");
    let summary: TemplateResult | null = null;
    if (items.length) {
      if (uploading.length) {
        const total = uploading.reduce((s, i) => s + i.size, 0);
        const sent = uploading.reduce((s, i) => s + i.size * i.progress, 0);
        const label = `Uploading ${uploading.length} of ${items.length}`;
        // The sent part moves with the bars – painted
        const part = html`<span data-part="total">${formatPart(sent, total)}</span>`;
        summary = clean
          ? html`<span class="ui-dz__summary"><span class="ui-dz__shimmer" data-text=${label}>${label}</span><span class="ui-dz__dot">·</span>${part}</span>`
          : html`<span>${label} · ${part}</span>`;
      } else {
        summary = html`<span class="ui-dz__summary ui-dz__summary-done"
          >${failed.length
            ? glyph(clean ? icons.alertCircle : icons.alert, clean, "ui-dz__warn")
            : glyph(clean ? icons.checkCircle : icons.check, clean, "ui-dz__ok")}${failed.length
            ? `${done.length} of ${items.length} uploaded`
            : `${done.length} ${done.length === 1 ? "file" : "files"} uploaded`}</span
        >`;
      }
    }
    return html`<div class="ui-dz__foot">
      ${summary ?? html`<span class="ui-dz__foot-idle">No files yet</span>`}
      ${(done.length > 0 || failed.length > 0) && !uploading.length && !this.isDisabled
        ? html`<button type="button" class="ui-dz__clear" @click=${this.clearDone}>Clear</button>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const accepted = this.accepted;
    const typeText = accepted?.length
      ? accepted.length <= 3
        ? accepted.map(acceptLabel).join(", ")
        : `${accepted.slice(0, 3).map(acceptLabel).join(", ")} and more`
      : "Any file";
    const hint = this.hint ?? `${typeText} · up to ${formatSize(this.maxSize)} each`;
    const rows = this.rows();
    const content = html`<div class="ui-dz__inner">
      ${this.renderArea(look, hint)}
      <ul class="ui-dz__list" aria-label="Uploads">
        ${repeat(
          rows,
          (i) => i.id,
          (i) => this.renderRow(i, look),
        )}
      </ul>
    </div>`;
    const foot = this.renderFoot(look);
    return html`
      ${look === "clean" ? html`<div class="ui-dz__card"><div class="ui-dz__body">${content}</div>${foot}</div>` : html`<div class="ui-dz__card">${content}</div>${foot}`}
      <span class="ui-dz__live" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="dz"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dz"] {
  /* The drop area: a faint well with a dashed edge that darkens on hover */
  --tc-dropzone-area-bg: light-dark(#fafafa, #1d1d20);
  --tc-dropzone-area-border-hover: light-dark(#b5b5b5, #5c5c63);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-3xl);
  background: var(--tc-surface-sunken);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: 1.45;
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="dz"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dz"] {
  /* The drop area's dashed edge darkens on hover */
  --tc-dropzone-area-border-hover: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.26));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="dz"] *, [data-ui="dz"] *::before, [data-ui="dz"] *::after { box-sizing: border-box; }
:where([data-ui="dz"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="dz"]) svg { display: block; flex: none; }
[data-ui="dz"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__card { overflow: hidden; border-radius: var(--tc-radius-2xl); transition: height var(--tc-duration-slow) var(--tc-ease-move); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__inner { display: flow-root; padding: var(--tc-space-1-5); }
/* 16px icons with thin ~1.1px lines, or solid shapes */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__glyph[data-solid] { fill: currentColor; stroke: none; }
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__card { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__body { overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__inner { display: flow-root; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); }
.ui-dz__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
[data-ui="dz"][data-disabled] .ui-dz__area { opacity: 0.55; cursor: not-allowed; }
/* The drop area */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area {
  position: relative;
  display: grid;
  justify-items: center;
  width: 100%;
  padding: 26px var(--tc-space-5) 22px;
  border-radius: var(--tc-radius-xl);
  background: var(--tc-dropzone-area-bg);
  text-align: center;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
/* The dashed outline turns solid and blue while files are dragged over */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1.5px dashed var(--tc-border-strong);
  border-radius: inherit;
  transition: border-color var(--tc-duration-base) var(--tc-ease-standard);
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area:hover::before { border-color: var(--tc-dropzone-area-border-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] { background: var(--tc-accent-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging]::before { border-style: solid; border-color: var(--tc-border-selected); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area:focus-visible { outline-offset: 3px; }
/* Three little documents that fan out while files are dragged over */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__stack { position: relative; width: 64px; height: 50px; margin-bottom: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 34px;
  height: 42px;
  margin-left: -17px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-overlay);
  box-shadow: 0 0 0 1px var(--tc-border-default), 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: transform var(--tc-duration-slower) var(--tc-ease-move);
}
/* The PDF and PNG behind: the same file badges as in the rows */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet-l,
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet-r { background: none; box-shadow: none; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06)); }
/* The drop area: white with a dashed hairline; blue dashes and a faint blue wash while files are dragged over */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area {
  position: relative;
  display: grid;
  justify-items: center;
  width: 100%;
  margin-bottom: var(--tc-space-1);
  padding: var(--tc-space-6) var(--tc-space-4) var(--tc-space-5);
  border: 1px dashed var(--tc-border-strong);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  text-align: center;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area:hover { border-color: var(--tc-dropzone-area-border-hover); background-color: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] { border-color: var(--tc-border-selected); background-color: var(--tc-accent-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area:focus-visible { outline-offset: 2px; }
/* Three little documents that fan out while files are dragged over */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__stack { position: relative; width: 64px; height: 44px; margin-bottom: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 30px;
  height: 36px;
  margin-left: -15px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  transition: transform var(--tc-duration-slower) var(--tc-ease-move);
}
/* The PDF and PNG behind */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet-l,
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet-r { background: none; box-shadow: none; filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.05)); }
.ui-dz__sheet .ui-dz__badge { width: 100%; height: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet-l { transform: translate(-9px, 2px) rotate(-10deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet-r { transform: translate(9px, 2px) rotate(10deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet-l { transform: translate(-12px, 2px) rotate(-10deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet-r { transform: translate(12px, 2px) rotate(10deg); }
.ui-dz__sheet-m { display: grid; place-items: center; transform: translateY(-2px); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet-m .ui-dz__glyph { width: 18px; height: 18px; color: var(--tc-text-primary); transition: transform var(--tc-duration-slower) var(--tc-ease-move), color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet-m .ui-dz__glyph { color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dz__area:hover .ui-dz__sheet-m { transform: translateY(-4px); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] .ui-dz__sheet-l { transform: translate(-30px, 0) rotate(-16deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] .ui-dz__sheet-r { transform: translate(30px, 0) rotate(16deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] .ui-dz__sheet-m { transform: translateY(-9px) scale(1.06); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area:hover .ui-dz__sheet-m .ui-dz__glyph { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] .ui-dz__sheet-l { transform: translate(-28px, 0) rotate(-16deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] .ui-dz__sheet-r { transform: translate(28px, 0) rotate(16deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] .ui-dz__sheet-m { transform: translateY(-8px) scale(1.05); }
.ui-dz__area[data-dragging] .ui-dz__sheet-m .ui-dz__glyph { color: var(--tc-accent-text); animation: ui-dz-bob 900ms ease-in-out infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__title { font-size: 14.5px; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__badge-sheet { fill: var(--tc-surface-raised); stroke: var(--tc-border-strong); stroke-width: 0.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__badge-fold { fill: none; stroke: var(--tc-border-strong); stroke-width: 0.9; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__badge-text { font-family: inherit; font-size: 6.5px; font-weight: var(--tc-font-weight-medium); letter-spacing: 0.04em; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__title { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-dz__browse { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__hint { margin-top: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__hint { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* File rows: each one grows in and folds away when removed */
.ui-dz__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-dz__row { display: grid; grid-template-rows: 1fr; animation: ui-dz-grow var(--tc-duration-slower) var(--tc-ease-move) both; transition: grid-template-rows var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
/* Removing: the row flashes briefly, like closing a window on a Mac, then folds away */
.ui-dz__row[data-removing] { grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-moderate) var(--tc-ease-move) var(--tc-duration-base), opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-base); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row-inner { position: relative; isolation: isolate; display: flex; align-items: center; gap: var(--tc-space-3); min-height: 0; overflow: hidden; padding: var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row-inner::before { content: ""; position: absolute; inset: 3px 0; border-radius: var(--tc-radius-lg); background: var(--tc-fill-strong); opacity: 0; pointer-events: none; z-index: -1; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__row-inner { position: relative; isolation: isolate; display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: 0; overflow: hidden; padding: var(--tc-space-2) 0 var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__row-inner::before { content: ""; position: absolute; inset: 2px 0; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); opacity: 0; pointer-events: none; z-index: -1; }
.ui-dz__row[data-removing] .ui-dz__row-inner::before { animation: ui-dz-flash var(--tc-duration-moderate) var(--tc-ease-decelerate) both; }
/* A row on its way out no longer reacts – its buttons lose their hover fill right away */
.ui-dz__row[data-removing] { pointer-events: none; }
.ui-dz__row[data-removing] .ui-dz__icon-btn { background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row:first-child .ui-dz__row-inner { margin-top: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row + .ui-dz__row .ui-dz__row-inner { border-top: 1px solid var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge { width: 28px; height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge-sheet { fill: var(--tc-surface-overlay); stroke: var(--tc-border-strong); stroke-width: 1.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge-fold { fill: none; stroke: var(--tc-border-strong); stroke-width: 1.2; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge-text { font-family: inherit; font-size: 7px; font-weight: 700; letter-spacing: 0.03em; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__row + .ui-dz__row .ui-dz__row-inner { border-top: 0.5px solid var(--tc-border-default); }
/* The 16px file icon, aligned with the name */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file { align-self: flex-start; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); overflow: visible; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file-sheet,
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file-fold { fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file-sheet { fill: var(--tc-surface-raised); }
.ui-dz__info { flex: 1; min-width: 0; }
.ui-dz__line { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__name { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__done { display: grid; place-items: center; flex: none; color: var(--tc-text-muted); animation: ui-dz-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__done .ui-dz__glyph { width: 14px; height: 14px; stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__meta { margin-top: 1px; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__name { overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__done { display: grid; place-items: center; flex: none; color: var(--tc-status-success-fg); animation: ui-dz-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__done .ui-dz__glyph { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-dz__dot { margin: 0 var(--tc-space-1); color: var(--tc-text-disabled); }
.ui-dz__error { color: var(--tc-status-danger-fg); }
.ui-dz__row[data-status="error"] .ui-dz__row-inner { animation: ui-dz-shake var(--tc-duration-slower) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__bar {
  position: relative;
  height: 4px;
  margin-top: var(--tc-space-2);
  overflow: hidden;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-fill-default);
  transition: height var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate), margin-top var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate), opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-base);
}
:where([data-look="standard"], [data-look="standard"] *).ui-dz__bar[data-hidden] { height: 0; margin-top: 0; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__bar > span {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-text-primary);
  transform-origin: left;
  transition: transform var(--tc-duration-base) linear, background-color var(--tc-duration-base) var(--tc-ease-standard);
}
/* A thin 2px progress bar in the accent blue */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__bar {
  position: relative;
  height: 2px;
  margin-top: var(--tc-space-1-5);
  margin-bottom: var(--tc-space-0-5);
  overflow: hidden;
  border-radius: 1px;
  background: var(--tc-fill-default);
  transition: height var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate), margin var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-moderate), opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-base);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__bar[data-hidden] { height: 0; margin-top: 0; margin-bottom: 0; opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__bar > span {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-accent);
  transform-origin: left;
  transition: transform var(--tc-duration-base) linear, background-color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-dz__row[data-status="error"] .ui-dz__bar > span { background: var(--tc-status-danger-solid); }
.ui-dz__actions { display: flex; flex: none; gap: var(--tc-space-0-5); }
/* Icon buttons: square ghost buttons at the small control size */
.ui-dz__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dz__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 40px; padding: 0 var(--tc-space-2) 0 var(--tc-space-3); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__foot > span { animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__retry:active .ui-dz__glyph { transform: rotate(120deg); transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
/* The last row inside the card */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: 44px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-4);
  border-top: 0.5px solid var(--tc-border-default);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot > span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__summary { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__summary .ui-dz__dot { color: var(--tc-text-disabled); }
.ui-dz__summary-done { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__ok { width: 14px; height: 14px; stroke: var(--tc-text-muted); stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__warn { width: 14px; height: 14px; stroke: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__clear { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__clear:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__ok { color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__warn { color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__summary-done .ui-dz__glyph { width: 16px; height: 16px; }
/* Clear: the secondary action */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__clear {
  flex: none;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
  animation: ui-dz-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__clear:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dz__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Shimmer over the working text – a lighter band runs through it */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__shimmer { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-shimmer) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-dz-sweep var(--tc-duration-shimmer) linear 3;
  pointer-events: none;
}
@keyframes ui-dz-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-dz-grow { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
@keyframes ui-dz-pop { 0% { transform: scale(0.4); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
@keyframes ui-dz-bob { 50% { transform: translateY(-3px); } }
@keyframes ui-dz-flash { 0% { opacity: 0; } 35% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ui-dz-shake { 20%, 60% { transform: translateX(-3px); } 40%, 80% { transform: translateX(3px); } }
/* Narrow (phones) */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area { padding: 22px var(--tc-space-4) var(--tc-space-4-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__title { font-size: var(--tc-font-size-lg); }
}
@keyframes ui-dz-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
/* Narrow (phones) */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area { padding: var(--tc-space-5) var(--tc-space-3) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot { padding-left: var(--tc-space-3); }
}
.ui-dz__for-touch { display: none; }
/* Touch screens: bigger buttons, and a title that fits tapping */
@media (hover: none) and (pointer: coarse) {
.ui-dz__for-mouse { display: none; }
.ui-dz__for-touch { display: inline; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__icon-btn { width: 40px; height: 40px; border-radius: var(--tc-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__actions { margin-right: -4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__clear { height: 36px; padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__icon-btn { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__clear { height: 34px; padding: 0 var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dz"] *, [data-ui="dz"] *::before, [data-ui="dz"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-dropzone")) customElements.define("tc-dropzone", TcDropzone);

declare global {
  interface HTMLElementTagNameMap {
    "tc-dropzone": TcDropzone;
  }
}
