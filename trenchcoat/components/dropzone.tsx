"use client";

/*
 * Dropzone – drag files in and watch them upload, in a single self-contained file.
 * Dragging files over the area fans out the little documents and says how many will drop.
 * Every file gets a row with a colored type badge, size, time left and its own progress bar;
 * files that are too large or of the wrong type say so, a failed upload can be retried, any row can be removed.
 * Without `onUpload` the uploads are simulated – pass `demo` for a preview, or it warns once that nothing is uploaded.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: dropzone.tsx is Standard,
 * dropzone-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows, a dashed drop area,
 * quiet list rows with 16px type-tinted file icons and thin blue progress bars, solid status icons, and the
 * summary as the card's last row, where "Uploading …" shimmers while files are on their way.
 */
// Generated from src/components/dropzone.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type DragEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-dz";

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

export type DropzoneOwnProps = {
  /** Allowed types: extensions (".pdf"), MIME types ("application/pdf") or wildcards ("image/*") – any file when
   *  left out */
  accept?: string[];
  /** Largest file in bytes */
  maxSize?: number;
  /**
   * Upload a file and report its progress (0–1); throw to mark it as failed. `signal` aborts when the row is
   * removed or the dropzone unmounts – stop the upload then. Simulated when left out (and warns once, unless
   * `demo` is set)
   */
  onUpload?: (file: File, onProgress: (progress: number) => void, signal: AbortSignal) => Promise<void>;
  /** The list of files. Controlled when defined – pass back what onChange reports (progress included), preload
   *  files that are already uploaded, or clear it with []. Otherwise the dropzone keeps its own list */
  value?: UploadItem[];
  /** Starting list when uncontrolled */
  defaultValue?: UploadItem[];
  /** Called whenever the list changes */
  onChange?: (items: UploadItem[]) => void;
  /** Name for native form submission: the added files (not the rejected ones) are submitted under it */
  name?: string;
  /** A native form needs at least one file that isn't rejected */
  required?: boolean;
  /** No files can be added, retried or removed */
  disabled?: boolean;
  /** Text under the title – defaults to the accepted types and size */
  hint?: string;
  /** Plays a sample drop on its own – nice for previews */
  autoplay?: boolean;
  /** Demo mode: files dropped without onUpload are simulated silently. For galleries and prototypes */
  demo?: boolean;
  /** Visual style. Defaults to the file's look: Standard in dropzone.tsx, Clean in dropzone-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type DropzoneProps = Omit<ComponentPropsWithoutRef<"div">, keyof DropzoneOwnProps> & DropzoneOwnProps;

/** What the dropzone keeps about its own uploads: the simulation's timing, and whether a retry makes sense */
type Extra = { failAt?: number; retryable?: boolean; startedAt: number; duration: number };
const EMPTY: UploadItem[] = [];

const MB = 1024 * 1024;

/* ---------- Helpers ---------- */

const ext = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

/** Number and unit joined by a no-break space, so "25 MB" never splits across lines */
const formatSize = (bytes: number) =>
  bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))}\u00a0KB` : `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)}\u00a0MB`;

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
    "Dropzone: no onUpload handler – simulating uploads. Pass `demo` to keep the simulation, or `onUpload` to wire it up. The simulation will be off by default in the next major version.",
  );
};

/** The time for upload timing – only ever read in handlers and effects */
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
  if (sub === "*") return { image: "Images", video: "Videos", audio: "Audio", text: "Text files" }[type] ?? `${type} files`;
  return sub.replace(/^(x-|vnd\.)/, "").split(/[.+-]/)[0].toUpperCase();
};

/* ---------- Icons: 24px line glyphs, and (Clean) 16px solid shapes ---------- */

const Glyph = ({ d, solid, className }: { d: string; solid?: boolean; className?: string }) => (
  <svg
    viewBox={solid ? "0 0 16 16" : "0 0 24 24"}
    className={["ui-dz__glyph", className].filter(Boolean).join(" ")}
    data-solid={solid || undefined}
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
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
function FileIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 16 16" className="ui-dz__file" aria-hidden="true">
      <path className="ui-dz__file-sheet" d="M4 1.75h5l3.25 3.25v8A1.25 1.25 0 0 1 11 14.25H4A1.25 1.25 0 0 1 2.75 13V3A1.25 1.25 0 0 1 4 1.75Z" />
      <path className="ui-dz__file-fold" d="M9 1.75V4a1 1 0 0 0 1 1h2.25" />
      <rect x="1" y="8.5" width="9" height="4.5" rx="1.25" fill={kindColor(name, "clean")} />
    </svg>
  );
}

/** A small document with a folded corner and a colored type label – on the left, or on the right with `end` */
function FileBadge({ name, end, look }: { name: string; end?: boolean; look: Look }) {
  const label = (ext(name) || "file").slice(0, 4).toUpperCase();
  const width = Math.max(18, label.length * (look === "clean" ? 5.2 : 5.4) + 8);
  const x = end ? 30 - width : 0;
  return (
    <svg viewBox="0 0 30 36" className="ui-dz__badge" aria-hidden="true">
      <path d="M5 1h14l10 10v20a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4z" className="ui-dz__badge-sheet" />
      <path d="M19 1v6a4 4 0 0 0 4 4h6" className="ui-dz__badge-fold" />
      <rect x={x} y="19" width={width} height="11" rx="3" fill={kindColor(name, look)} fillOpacity={look === "clean" ? "0.12" : "0.14"} />
      <text x={x + 4} y="27.2" className="ui-dz__badge-text" fill={kindColor(name, look)}>
        {label}
      </text>
    </svg>
  );
}

/** A PDF and a PNG behind the upload card – they fan out while files are dragged over */
function Stack({ look }: { look: Look }) {
  return (
    <span className="ui-dz__stack" aria-hidden="true">
      <span className="ui-dz__sheet ui-dz__sheet-l">
        <FileBadge name="file.pdf" look={look} />
      </span>
      <span className="ui-dz__sheet ui-dz__sheet-r">
        <FileBadge name="file.png" end look={look} />
      </span>
      <span className="ui-dz__sheet ui-dz__sheet-m">
        <Glyph d={icons.upload} />
      </span>
    </span>
  );
}

/* ---------- Sample drop for previews ---------- */

const SAMPLE = [
  { name: "Q3-Board-Report.pdf", size: 4.2 * MB },
  { name: "Hero-Shot.png", size: 2.6 * MB },
  { name: "Budget-2027.xlsx", size: 1.3 * MB, failAt: 0.62 },
  { name: "Product-Demo.mp4", size: 48 * MB },
];

/* ---------- Live progress: bars move without re-rendering ---------- */

/** How often progress that only moves pixels is committed (and reported through onChange) */
const FLUSH_MS = 1000;

/** Writes into the text node React rendered, so React keeps owning it */
const setText = (el: Element | null | undefined, value: string) => {
  const node = el?.firstChild;
  if (node && node.nodeType === Node.TEXT_NODE && node.nodeValue !== value) node.nodeValue = value;
};

/** "4s left" for one row – from its progress and how long it has been running */
const leftText = (progress: number, x: Extra | undefined, at: number) =>
  progress < 0.04 || !x || at <= x.startedAt ? "starting" : formatLeft(((1 - progress) * (at - x.startedAt)) / Math.max(0.05, progress) / 1000);

/**
 * Progress between commits. Uploads report (or the simulation computes) progress many times a second; it lands in
 * `live`, and `paint` writes bars, "1.2 of 4.1 MB", "time left" and the summary straight into the DOM. The list
 * itself – what onChange reports – takes the live values at most once per FLUSH_MS, and at once whenever a status
 * changes. Painting pauses while the dropzone is off-screen or the tab is hidden and catches up when seen again.
 */
function useLiveProgress(
  root: { current: HTMLElement | null },
  items: UploadItem[],
  extra: Record<string, Extra>,
  setItems: (next: (list: UploadItem[]) => UploadItem[]) => void,
  busy: boolean,
) {
  const live = useRef(new Map<string, number>());
  const latest = useRef({ items, extra });
  const onScreen = useRef(true);
  const lastFlush = useRef(0);
  const pending = useRef({ frame: 0, flush: 0 });

  const paint = useCallback(() => {
    const el = root.current;
    if (!el || !onScreen.current || document.visibilityState === "hidden") return;
    const { items, extra } = latest.current;
    const at = now();
    let total = 0;
    let sent = 0;
    const rows = new Map<string, Element>();
    el.querySelectorAll<HTMLElement>("li[data-id]:not([data-removing])").forEach((row) => rows.set(row.dataset.id!, row));
    for (const i of items) {
      if (i.status !== "uploading") continue;
      const p = live.current.get(i.id) ?? i.progress;
      total += i.size;
      sent += i.size * p;
      const row = rows.get(i.id);
      if (!row) continue;
      const bar = row.querySelector<HTMLElement>(".ui-dz__bar");
      bar?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      const fill = bar?.firstElementChild as HTMLElement | null | undefined;
      if (fill) fill.style.transform = `scaleX(${p})`;
      setText(row.querySelector('[data-part="sent"]'), formatPart(i.size * p, i.size));
      setText(row.querySelector('[data-part="left"]'), leftText(p, extra[i.id], at));
    }
    if (total) setText(el.querySelector('[data-part="total"]'), formatPart(sent, total));
  }, [root]);

  // After every commit: the newest list, and the live values painted over what was rendered from it, before paint
  useLayoutEffect(() => {
    latest.current = { items, extra };
    paint();
  });

  /** Commits the live progress (plus `ended`: rows whose status changes) to the list */
  const flush = useCallback(
    (ended?: Map<string, Partial<UploadItem>>) => {
      lastFlush.current = now();
      window.clearTimeout(pending.current.flush);
      pending.current.flush = 0;
      setItems((list) => {
        let changed = false;
        const next = list.map((i) => {
          const end = ended?.get(i.id);
          const p = live.current.get(i.id);
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
    },
    [setItems],
  );

  /** A progress report: painted on the next frame, committed within FLUSH_MS */
  const report = useCallback(
    (id: string, progress: number) => {
      live.current.set(id, progress);
      if (!pending.current.frame) {
        pending.current.frame = requestAnimationFrame(() => {
          pending.current.frame = 0;
          paint();
        });
      }
      if (!pending.current.flush) pending.current.flush = window.setTimeout(() => flush(), FLUSH_MS);
    },
    [paint, flush],
  );

  // Off-screen and hidden tabs aren't painted; both catch up when they're seen again
  useEffect(() => {
    const el = root.current;
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            onScreen.current = entry.isIntersecting;
            paint();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", paint);
    const timers = pending.current;
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", paint);
      cancelAnimationFrame(timers.frame);
      window.clearTimeout(timers.flush);
      timers.frame = timers.flush = 0;
    };
  }, [root, paint]);

  // "Time left" keeps counting while anything uploads, real uploads included – written, not rendered
  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(paint, 500);
    return () => clearInterval(t);
  }, [busy, paint]);

  return { live, lastFlush, paint, flush, report };
}

/* ---------- Pieces ---------- */

type Row = UploadItem & { removing?: boolean };

/** One file: badge, name, "1.2 of 4.1 MB · 4s left" and its bar – the moving parts are painted by useLiveProgress */
function UploadRow({
  item: i,
  extra: x,
  look,
  disabled,
  onRetry,
  onRemove,
}: {
  item: Row;
  extra: Extra | undefined;
  look: Look;
  disabled: boolean;
  onRetry: (item: UploadItem) => void;
  onRemove: (id: string) => void;
}) {
  const clean = look === "clean";
  const retryable = i.status === "error" && (x ? !!x.retryable : !!i.file);
  return (
    // A row on its way out is inert: nothing in it can take focus while it folds away
    <li className="ui-dz__row" data-id={i.id} data-status={i.status} data-removing={i.removing || undefined} inert={i.removing}>
      <div className="ui-dz__row-inner">
        {clean ? <FileIcon name={i.name} /> : <FileBadge name={i.name} look={look} />}
        <div className="ui-dz__info">
          <div className="ui-dz__line">
            <span className="ui-dz__name" title={i.name}>
              {i.name}
            </span>
            {i.status === "done" && (
              <span className="ui-dz__done" role="img" aria-label="Uploaded">
                {clean ? <Glyph d={icons.checkCircle} solid /> : <Glyph d={icons.check} />}
              </span>
            )}
          </div>
          <div className="ui-dz__meta" key={i.status}>
            {i.status === "uploading" && (
              <>
                <span data-part="sent">{formatPart(i.size * i.progress, i.size)}</span>
                <span className="ui-dz__dot">·</span>
                {/* The time left needs the clock – rendered as "starting", painted with the real value before paint */}
                <span data-part="left">starting</span>
              </>
            )}
            {i.status === "done" && formatSize(i.size)}
            {i.status === "error" && <span className="ui-dz__error">{i.error}</span>}
          </div>
          {/* Stays in place and folds away once done, so the row shrinks smoothly; rejected files never get one */}
          {(i.status !== "error" || retryable) && (
            <div
              className="ui-dz__bar"
              data-hidden={i.status === "done" || undefined}
              role="progressbar"
              aria-label={`${i.name} upload`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(i.progress * 100)}
            >
              <span style={{ transform: `scaleX(${i.progress})` }} />
            </div>
          )}
        </div>
        <div className="ui-dz__actions">
          {retryable && (
            <button
              type="button"
              className="ui-dz__icon-btn ui-dz__retry"
              aria-label={`Retry ${i.name}`}
              disabled={disabled}
              onClick={(e) => {
                // Retry goes away once the upload runs again – focus moves to the row's Remove first
                rescueFocus(e.currentTarget, [e.currentTarget.nextElementSibling]);
                onRetry(i);
              }}
            >
              <Glyph d={icons.retry} />
            </button>
          )}
          <button type="button" className="ui-dz__icon-btn" aria-label={`Remove ${i.name}`} disabled={disabled} onClick={() => onRemove(i.id)}>
            <Glyph d={icons.close} />
          </button>
        </div>
      </div>
    </li>
  );
}

/** The last row (Clean) or the tray (Standard): "Uploading 2 of 4 · 1.2 of 8.1 MB", or what got uploaded, and Clear */
function Foot({ items, look, disabled, onClear }: { items: UploadItem[]; look: Look; disabled: boolean; onClear: () => void }) {
  const clean = look === "clean";
  const uploading = items.filter((i) => i.status === "uploading");
  const done = items.filter((i) => i.status === "done");
  const failed = items.filter((i) => i.status === "error");

  let summary: ReactNode = null;
  if (items.length) {
    if (uploading.length) {
      const total = uploading.reduce((s, i) => s + i.size, 0);
      const sent = uploading.reduce((s, i) => s + i.size * i.progress, 0);
      const label = `Uploading ${uploading.length} of ${items.length}`;
      // The sent part moves with the bars – painted by useLiveProgress
      const part = <span data-part="total">{formatPart(sent, total)}</span>;
      summary = clean ? (
        <span className="ui-dz__summary">
          {/* The working part shimmers, the numbers stay calm */}
          <span className="ui-dz__shimmer" data-text={label}>
            {label}
          </span>
          <span className="ui-dz__dot">·</span>
          {part}
        </span>
      ) : (
        <span>
          {label} · {part}
        </span>
      );
    } else {
      summary = (
        <span className="ui-dz__summary ui-dz__summary-done">
          {failed.length ? (
            <Glyph d={clean ? icons.alertCircle : icons.alert} solid={clean} className="ui-dz__warn" />
          ) : (
            <Glyph d={clean ? icons.checkCircle : icons.check} solid={clean} className="ui-dz__ok" />
          )}
          {failed.length ? `${done.length} of ${items.length} uploaded` : `${done.length} ${done.length === 1 ? "file" : "files"} uploaded`}
        </span>
      );
    }
  }

  return (
    <div className="ui-dz__foot">
      {summary ?? <span className="ui-dz__foot-idle">No files yet</span>}
      {(done.length > 0 || failed.length > 0) && !uploading.length && !disabled && (
        <button type="button" className="ui-dz__clear" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}

/** The drop area: counts drag enters and leaves, so moving over its children doesn't flicker */
function DropArea({
  uid,
  accept,
  hint,
  dragging,
  setDragging,
  disabled,
  look,
  onFiles,
  areaRef,
}: {
  uid: string;
  accept?: string[];
  hint: string;
  dragging: number;
  setDragging: (n: number) => void;
  disabled: boolean;
  look: Look;
  onFiles: (files: FileList | File[]) => void;
  areaRef: { current: HTMLButtonElement | null };
}) {
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const hasFiles = (e: DragEvent) => !disabled && Array.from(e.dataTransfer.types).includes("Files");
  const onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current += 1;
    setDragging(Math.max(1, e.dataTransfer.items.length));
  };
  const onDragOver = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (!depth.current) setDragging(0);
  };
  const onDrop = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setDragging(0);
    onFiles(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={input}
        id={uid}
        type="file"
        multiple
        aria-label="Choose files"
        accept={accept?.join(",")}
        className="ui-dz__input"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        ref={areaRef}
        type="button"
        className="ui-dz__area"
        data-dragging={dragging > 0 || undefined}
        aria-describedby={`${uid}-hint`}
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Stack look={look} />
        <span className="ui-dz__title" key={dragging ? "drop" : "idle"}>
          {dragging ? (
            `Release to upload ${dragging === 1 ? "1 file" : `${dragging} files`}`
          ) : (
            <>
              {/* Phones can't drag files in – they get a plain "tap" title */}
              <span className="ui-dz__for-mouse">
                Drop files here or <span className="ui-dz__browse">browse</span>
              </span>
              <span className="ui-dz__for-touch">
                Tap to <span className="ui-dz__browse">choose files</span>
              </span>
            </>
          )}
        </span>
        <span className="ui-dz__hint" id={`${uid}-hint`}>
          {hint}
        </span>
      </button>
    </>
  );
}

/* ---------- Dropzone ---------- */

export function Dropzone({
  accept,
  maxSize = 25 * MB,
  onUpload,
  value,
  defaultValue,
  onChange,
  hint,
  autoplay = false,
  demo = false,
  name,
  required = false,
  disabled = false,
  look,
  className,
  ref,
  ...rest
}: DropzoneProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  // The list a parent may own: controlled by `value`, else kept here from `defaultValue`; every change is reported
  const [items, setItems] = useControllable<UploadItem[]>(value, defaultValue ?? EMPTY, onChange, "value");
  // What only this dropzone knows about its own uploads (timing of the simulation, whether a retry makes sense)
  const [extra, setExtra] = useState<Record<string, Extra>>({});
  // Removed rows flash briefly at their old place, then fold away
  const [leaving, setLeaving] = useState<{ item: UploadItem; index: number }[]>([]);
  const [dragging, setDragging] = useState(0); // number of files over the area, 0 = none
  const [announce, setAnnounce] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);
  const area = useRef<HTMLButtonElement>(null);
  const formInput = useRef<HTMLInputElement>(null);
  // The box that glides to the content's height: the whole card (Standard) or the part above the last row (Clean)
  const bodyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  // One controller per running upload, so removing its row (or unmounting) cancels it
  const uploads = useRef(new Map<string, AbortController>());
  const removals = useRef<number[]>([]);
  useEffect(() => {
    const running = uploads.current;
    const timers = removals.current;
    return () => {
      running.forEach((c) => c.abort());
      running.clear();
      timers.forEach(clearTimeout);
    };
  }, []);

  const busy = items.some((i) => i.status === "uploading");
  const { live, lastFlush, paint, flush, report } = useLiveProgress(root, items, extra, setItems, busy);
  // The ticker reads the newest list and timings
  const latest = useRef({ items, extra });
  useLayoutEffect(() => {
    latest.current = { items, extra };
  });

  const accepted = accept?.map((a) => (a.includes("/") ? a.toLowerCase() : a.replace(/^\./, "").toLowerCase()));
  const typeText = accepted?.length
    ? accepted.length <= 3
      ? accepted.map(acceptLabel).join(", ")
      : `${accepted.slice(0, 3).map(acceptLabel).join(", ")} and more`
    : "Any file";
  const hintText = hint ?? `${typeText} · up to ${formatSize(maxSize)} each`;

  // A row a parent took out of `value` stops its upload too
  const ids = items.map((i) => i.id).join("\u0001");
  useEffect(() => {
    const present = new Set(ids.split("\u0001"));
    uploads.current.forEach((c, id) => {
      if (present.has(id)) return;
      c.abort();
      uploads.current.delete(id);
    });
    live.current.forEach((_, id) => !present.has(id) && live.current.delete(id));
  }, [ids, live]);

  // Native forms: the added files go into a named file input; `required` asks for at least one file that isn't rejected
  const usable = items.filter((i) => i.status !== "error");
  const fileKey = usable.map((i) => i.id).join("\u0001");
  useEffect(() => {
    const el = formInput.current;
    if (!el) return;
    if (name && typeof DataTransfer === "function") {
      try {
        const dt = new DataTransfer();
        usable.forEach((i) => i.file && dt.items.add(i.file));
        el.files = dt.files;
      } catch {
        // Browsers without a constructible DataTransfer submit no files; uploads through onUpload still work
      }
    }
    el.setCustomValidity(required && !usable.length ? "Add at least one file" : "");
  }, [fileKey, name, required]); // eslint-disable-line react-hooks/exhaustive-deps -- `usable` is keyed by fileKey

  // The card (Clean: its content – the last row stays put) glides to its new height whenever rows come, go or change
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const inner = innerRef.current;
    if (!body || !inner) return;
    const set = () => (body.style.height = `${inner.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const update = (id: string, patch: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const note = (id: string, patch: Partial<Extra>) => setExtra((all) => (all[id] ? { ...all, [id]: { ...all[id], ...patch } } : all));

  /** Checks a file and starts its upload */
  const start = (entry: { name: string; size: number; file?: File; failAt?: number }) => {
    const id = `${uid}-${(counter.current++).toString(36)}`;
    let error: string | undefined;
    if (accepted?.length && !accepted.some((a) => matches(a, entry.name, entry.file))) error = ext(entry.name) ? `.${ext(entry.name)} files aren't supported` : "This file type isn't supported";
    else if (entry.size > maxSize) error = `Too large – max ${formatSize(maxSize)}`;
    const item: UploadItem = { id, name: entry.name, size: entry.size, file: entry.file, status: error ? "error" : "uploading", progress: 0, error };
    setExtra((all) => ({ ...all, [id]: { failAt: entry.failAt, startedAt: now(), duration: simDuration(entry.size) } }));
    setItems((list) => [...list, item]);
    if (error) setAnnounce(`${entry.name}: ${error}`);
    else if (onUpload && entry.file) run(item);
    else if (entry.file && !demo) warnSimulatedUpload();
  };

  /** A real upload through `onUpload`; whatever it reports after its row is gone is ignored */
  const run = (item: UploadItem) => {
    const controller = new AbortController();
    uploads.current.get(item.id)?.abort();
    uploads.current.set(item.id, controller);
    const { signal } = controller;
    const settle = () => {
      if (uploads.current.get(item.id) === controller) uploads.current.delete(item.id);
      live.current.delete(item.id);
    };
    Promise.resolve()
      .then(() => onUpload!(item.file!, (p) => !signal.aborted && report(item.id, Math.max(0, Math.min(1, p))), signal))
      .then(() => {
        settle();
        if (signal.aborted) return;
        update(item.id, { status: "done", progress: 1 });
        setAnnounce(`${item.name} uploaded`);
      })
      .catch((e: unknown) => {
        if (!signal.aborted) {
          // The bar stops where the upload got to
          const progress = live.current.get(item.id);
          const message = e instanceof Error && e.message ? e.message : "Upload failed";
          update(item.id, { status: "error", error: message, ...(progress !== undefined && { progress }) });
          note(item.id, { retryable: true });
          setAnnounce(`${item.name}: ${message}`);
        }
        settle();
      });
  };

  const addFiles = (files: FileList | File[]) => {
    if (disabled) return;
    Array.from(files).forEach((file) => start({ name: file.name, size: file.size, file }));
  };

  // Simulated uploads move on a single ticker: progress is painted, the list only changes when a file finishes
  // or fails – and takes the progress along once a second
  const simulated = items.some((i) => i.status === "uploading" && extra[i.id] && (!onUpload || !i.file));
  useEffect(() => {
    if (!simulated) return;
    const t = window.setInterval(() => {
      const at = now();
      const { items, extra: timing } = latest.current;
      const ended = new Map<string, Partial<UploadItem>>();
      for (const i of items) {
        const x = timing[i.id];
        if (i.status !== "uploading" || !x || (onUpload && i.file)) continue;
        // Eased with a little jitter, like a real connection
        const raw = Math.min(1, (at - x.startedAt) / x.duration);
        const progress = Math.max(live.current.get(i.id) ?? i.progress, raw < 1 ? raw * (0.92 + Math.random() * 0.08) : 1);
        if (x.failAt !== undefined && progress >= x.failAt) {
          setAnnounce(`${i.name}: upload failed`);
          note(i.id, { retryable: true });
          ended.set(i.id, { progress: x.failAt, status: "error", error: "Connection lost" });
          live.current.delete(i.id);
        } else if (progress >= 1) {
          setAnnounce(`${i.name} uploaded`);
          ended.set(i.id, { progress: 1, status: "done" });
          live.current.delete(i.id);
        } else live.current.set(i.id, progress);
      }
      if (ended.size || at - lastFlush.current >= FLUSH_MS) flush(ended);
      else paint();
    }, 90);
    return () => clearInterval(t);
  }, [simulated, onUpload, live, lastFlush, flush, paint]);

  // The sample: files are dragged over, then dropped
  useEffect(() => {
    if (!autoplay) return;
    const timers = [
      window.setTimeout(() => setDragging(SAMPLE.length), 700),
      window.setTimeout(() => {
        setDragging(0);
        SAMPLE.forEach((s, n) => window.setTimeout(() => start(s), n * 140));
      }, 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [autoplay]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = (item: UploadItem) => {
    live.current.delete(item.id);
    update(item.id, { status: "uploading", progress: 0, error: undefined });
    setExtra((all) => ({ ...all, [item.id]: { startedAt: now(), duration: all[item.id]?.duration ?? simDuration(item.size) } }));
    if (onUpload && item.file) run({ ...item, progress: 0 });
  };
  const remove = (id: string) => {
    // Cancels its upload right away; the row itself flashes briefly, then folds away
    uploads.current.get(id)?.abort();
    uploads.current.delete(id);
    const progress = live.current.get(id);
    live.current.delete(id);
    setItems((list) => {
      const index = list.findIndex((i) => i.id === id);
      if (index < 0) return list;
      // The folding row keeps the progress it had reached
      const item = progress !== undefined && list[index].status === "uploading" ? { ...list[index], progress } : list[index];
      setLeaving((rows) => [...rows, { item, index }]);
      removals.current.push(window.setTimeout(() => setLeaving((rows) => rows.filter((r) => r.item.id !== id)), 480));
      return list.filter((i) => i.id !== id);
    });
  };
  const clearDone = () => {
    // Clear goes away with the rows it clears – focus moves to the drop area
    rescueFocus(root.current?.querySelector(".ui-dz__clear"), [area.current]);
    items.filter((i) => i.status !== "uploading").forEach((i) => remove(i.id));
  };
  /** Remove: focus moves to the next row's button (or the one before, or the drop area) before the row folds away */
  const removeRow = (id: string) => {
    const rows = [...(root.current?.querySelectorAll<HTMLElement>("li[data-id]:not([data-removing])") ?? [])];
    const at = rows.findIndex((r) => r.dataset.id === id);
    const button = (row?: HTMLElement) => row?.querySelector<HTMLElement>(".ui-dz__icon-btn:last-child");
    rescueFocus(rows[at], [button(rows[at + 1]), button(rows[at - 1]), area.current]);
    remove(id);
  };
  // Anything else that takes the focused control away (a parent changing `value`, disabling) – focus goes to the
  // drop area, not <body>
  useFocusRescue(root, { fallback: () => area.current });

  // The rows: the list, with removed rows folding away where they were
  const rows: Row[] = [...items];
  leaving.forEach(({ item, index }) => rows.splice(Math.min(index, rows.length), 0, { ...item, removing: true }));

  // The drop area and the list of uploads
  const content = (
    <div ref={innerRef} className="ui-dz__inner">
      <DropArea
        uid={uid}
        accept={accept}
        hint={hintText}
        dragging={dragging}
        setDragging={setDragging}
        disabled={disabled}
        look={resolvedLook}
        onFiles={addFiles}
        areaRef={area}
      />
      <ul className="ui-dz__list" aria-label="Uploads">
        {rows.map((i) => (
          <UploadRow key={i.id} item={i} extra={extra[i.id]} look={resolvedLook} disabled={disabled} onRetry={retry} onRemove={removeRow} />
        ))}
      </ul>
    </div>
  );

  const foot = <Foot items={items} look={resolvedLook} disabled={disabled} onClear={clearDone} />;

  return (
    <div {...rest} ref={rootRef} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-disabled={disabled || undefined}>
      {/* React 19 hoists this into <head> once, no matter how many dropzones render */}
      <style href="ui-dropzone" precedence="default">
        {css}
      </style>

      {clean ? (
        <div className="ui-dz__card">
          {/* Only the content glides to its new height – the last row below always stays in view */}
          <div ref={bodyRef} className="ui-dz__body">
            {content}
          </div>
          {/* The last row of the card, under a hairline */}
          {foot}
        </div>
      ) : (
        <>
          <div ref={bodyRef} className="ui-dz__card">
            {content}
          </div>
          {/* The tray below the card */}
          {foot}
        </>
      )}

      {/* Native forms: the files under `name`; `required` is checked here and points the browser at the drop area */}
      {(name || required) && (
        <input
          ref={formInput}
          type="file"
          multiple
          name={name}
          className="ui-dz__input"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onFocus={() => area.current?.focus()}
        />
      )}

      <span className="ui-dz__live" role="status">
        {announce}
      </span>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-dz:where([data-look="standard"]),
.ui-dz__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
}
.ui-dz:where([data-look="clean"]),
.ui-dz__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.3));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-dz */
:where([data-look="standard"], [data-look="standard"] *).ui-dz {
  /* The drop area: a faint well with a dashed edge that darkens on hover */
  --tc-dropzone-area-bg: light-dark(#fafafa, #1d1d20);
  --tc-dropzone-area-border-hover: light-dark(#b5b5b5, #5c5c63);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  padding: 4px;
  border-radius: var(--tc-radius-3xl, var(--_tc-radius-3xl));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: 1.45;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-dz */
:where([data-look="clean"], [data-look="clean"] *).ui-dz {
  /* The drop area's dashed edge darkens on hover */
  --tc-dropzone-area-border-hover: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.26));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 520px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-dz *, .ui-dz *::before, .ui-dz *::after { box-sizing: border-box; }
:where(.ui-dz) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-dz) svg { display: block; flex: none; }
.ui-dz button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__card { overflow: hidden; border-radius: var(--tc-radius-2xl, var(--_tc-radius-2xl)); transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__inner { display: flow-root; padding: 6px; }
/* 16px icons with thin ~1.1px lines, or solid shapes */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__glyph[data-solid] { fill: currentColor; stroke: none; }
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__card { overflow: hidden; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__body { overflow: hidden; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__inner { display: flow-root; padding: 8px 8px 4px; }
.ui-dz__input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.ui-dz[data-disabled] .ui-dz__area { opacity: 0.55; cursor: not-allowed; }
/* The drop area */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area {
  position: relative;
  display: grid;
  justify-items: center;
  width: 100%;
  padding: 26px 20px 22px;
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  background: var(--tc-dropzone-area-bg);
  text-align: center;
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* The dashed outline turns solid and blue while files are dragged over */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1.5px dashed var(--tc-border-strong, var(--_tc-border-strong));
  border-radius: inherit;
  transition: border-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area:hover::before { border-color: var(--tc-dropzone-area-border-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging]::before { border-style: solid; border-color: var(--tc-border-selected, var(--_tc-border-selected)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area:focus-visible { outline-offset: 3px; }
/* Three little documents that fan out while files are dragged over */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__stack { position: relative; width: 64px; height: 50px; margin-bottom: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 34px;
  height: 42px;
  margin-left: -17px;
  border-radius: 7px;
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
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
  margin-bottom: 4px;
  padding: 24px 16px 20px;
  border: 1px dashed var(--tc-border-strong, var(--_tc-border-strong));
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  text-align: center;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area:hover { border-color: var(--tc-dropzone-area-border-hover); background-color: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] { border-color: var(--tc-border-selected, var(--_tc-border-selected)); background-color: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area:focus-visible { outline-offset: 2px; }
/* Three little documents that fan out while files are dragged over */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__stack { position: relative; width: 64px; height: 44px; margin-bottom: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 30px;
  height: 36px;
  margin-left: -15px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
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
:where([data-look="standard"], [data-look="standard"] *).ui-dz__sheet-m .ui-dz__glyph { width: 18px; height: 18px; color: var(--tc-text-primary, var(--_tc-text-primary)); transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__sheet-m .ui-dz__glyph { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-dz__area:hover .ui-dz__sheet-m { transform: translateY(-4px); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] .ui-dz__sheet-l { transform: translate(-30px, 0) rotate(-16deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] .ui-dz__sheet-r { transform: translate(30px, 0) rotate(16deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area[data-dragging] .ui-dz__sheet-m { transform: translateY(-9px) scale(1.06); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area:hover .ui-dz__sheet-m .ui-dz__glyph { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] .ui-dz__sheet-l { transform: translate(-28px, 0) rotate(-16deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] .ui-dz__sheet-r { transform: translate(28px, 0) rotate(16deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area[data-dragging] .ui-dz__sheet-m { transform: translateY(-8px) scale(1.05); }
.ui-dz__area[data-dragging] .ui-dz__sheet-m .ui-dz__glyph { color: var(--tc-accent-text, var(--_tc-accent-text)); animation: ui-dz-bob 900ms ease-in-out infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__title { font-size: 14.5px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__badge-sheet { fill: var(--tc-surface-raised, var(--_tc-surface-raised)); stroke: var(--tc-border-strong, var(--_tc-border-strong)); stroke-width: 0.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__badge-fold { fill: none; stroke: var(--tc-border-strong, var(--_tc-border-strong)); stroke-width: 0.9; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__badge-text { font-family: inherit; font-size: 6.5px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: 0.04em; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__title { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-dz__browse { color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__hint { margin-top: 3px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__hint { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* File rows: each one grows in and folds away when removed */
.ui-dz__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-dz__row { display: grid; grid-template-rows: 1fr; animation: ui-dz-grow var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; transition: grid-template-rows var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* Removing: the row flashes briefly, like closing a window on a Mac, then folds away */
.ui-dz__row[data-removing] { grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-base, var(--_tc-duration-base)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row-inner { position: relative; isolation: isolate; display: flex; align-items: center; gap: 12px; min-height: 0; overflow: hidden; padding: 10px 6px 10px 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row-inner::before { content: ""; position: absolute; inset: 3px 0; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-fill-strong, var(--_tc-fill-strong)); opacity: 0; pointer-events: none; z-index: -1; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__row-inner { position: relative; isolation: isolate; display: flex; align-items: center; gap: 10px; min-height: 0; overflow: hidden; padding: 8px 0 8px 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__row-inner::before { content: ""; position: absolute; inset: 2px 0; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-default, var(--_tc-fill-default)); opacity: 0; pointer-events: none; z-index: -1; }
.ui-dz__row[data-removing] .ui-dz__row-inner::before { animation: ui-dz-flash var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) both; }
/* A row on its way out no longer reacts – its buttons lose their hover fill right away */
.ui-dz__row[data-removing] { pointer-events: none; }
.ui-dz__row[data-removing] .ui-dz__icon-btn { background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row:first-child .ui-dz__row-inner { margin-top: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__row + .ui-dz__row .ui-dz__row-inner { border-top: 1px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge { width: 28px; height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge-sheet { fill: var(--tc-surface-overlay, var(--_tc-surface-overlay)); stroke: var(--tc-border-strong, var(--_tc-border-strong)); stroke-width: 1.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge-fold { fill: none; stroke: var(--tc-border-strong, var(--_tc-border-strong)); stroke-width: 1.2; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__badge-text { font-family: inherit; font-size: 7px; font-weight: 700; letter-spacing: 0.03em; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__row + .ui-dz__row .ui-dz__row-inner { border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
/* The 16px file icon, aligned with the name */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file { align-self: flex-start; width: 16px; height: 16px; margin-top: 2px; overflow: visible; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file-sheet,
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file-fold { fill: none; stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__file-sheet { fill: var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-dz__info { flex: 1; min-width: 0; }
.ui-dz__line { display: flex; align-items: center; gap: 6px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__name { overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__done { display: grid; place-items: center; flex: none; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-dz-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__done .ui-dz__glyph { width: 14px; height: 14px; stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__meta { margin-top: 1px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__name { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__done { display: grid; place-items: center; flex: none; color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); animation: ui-dz-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__done .ui-dz__glyph { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__meta { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-dz__dot { margin: 0 5px; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-dz__error { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-dz__row[data-status="error"] .ui-dz__row-inner { animation: ui-dz-shake var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__bar {
  position: relative;
  height: 4px;
  margin-top: 7px;
  overflow: hidden;
  border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-moderate, var(--_tc-duration-moderate)), margin-top var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-moderate, var(--_tc-duration-moderate)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-base, var(--_tc-duration-base));
}
:where([data-look="standard"], [data-look="standard"] *).ui-dz__bar[data-hidden] { height: 0; margin-top: 0; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__bar > span {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-text-primary, var(--_tc-text-primary));
  transform-origin: left;
  transition: transform var(--tc-duration-base, var(--_tc-duration-base)) linear, background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* A thin 2px progress bar in the accent blue */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__bar {
  position: relative;
  height: 2px;
  margin-top: 6px;
  margin-bottom: 2px;
  overflow: hidden;
  border-radius: 1px;
  background: var(--tc-fill-default, var(--_tc-fill-default));
  transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-moderate, var(--_tc-duration-moderate)), margin var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-moderate, var(--_tc-duration-moderate)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-base, var(--_tc-duration-base));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__bar[data-hidden] { height: 0; margin-top: 0; margin-bottom: 0; opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__bar > span {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-accent, var(--_tc-accent));
  transform-origin: left;
  transition: transform var(--tc-duration-base, var(--_tc-duration-base)) linear, background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-dz__row[data-status="error"] .ui-dz__bar > span { background: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
.ui-dz__actions { display: flex; flex: none; gap: 2px; }
/* Icon buttons: square ghost buttons at the small control size */
.ui-dz__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-dz__icon-btn:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-dz__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; padding: 0 8px 0 12px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__foot > span { animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__retry:active .ui-dz__glyph { transform: rotate(120deg); transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* The last row inside the card */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 44px;
  padding: 0 8px 0 16px;
  border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot > span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__summary { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__summary .ui-dz__dot { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-dz__summary-done { display: inline-flex; align-items: center; gap: 6px; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__ok { width: 14px; height: 14px; stroke: var(--tc-text-muted, var(--_tc-text-muted)); stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__warn { width: 14px; height: 14px; stroke: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__clear { height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__clear:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__ok { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__warn { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__summary-done .ui-dz__glyph { width: 16px; height: 16px; }
/* Clear: the secondary action */
:where([data-look="clean"], [data-look="clean"] *).ui-dz__clear {
  flex: none;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  transition: box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-dz-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-dz__clear:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
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
  background: linear-gradient(90deg, transparent 38%, var(--tc-shimmer, var(--_tc-shimmer)) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-dz-sweep var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3;
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
:where([data-look="standard"], [data-look="standard"] *).ui-dz__area { padding: 22px 16px 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__title { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); }
}
@keyframes ui-dz-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
/* Narrow (phones) */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-dz__area { padding: 20px 12px 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot { padding-left: 12px; }
}
.ui-dz__for-touch { display: none; }
/* Touch screens: bigger buttons, and a title that fits tapping */
@media (hover: none) and (pointer: coarse) {
.ui-dz__for-mouse { display: none; }
.ui-dz__for-touch { display: inline; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__icon-btn { width: 40px; height: 40px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__actions { margin-right: -4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dz__clear { height: 36px; padding: 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__icon-btn { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dz__clear { height: 34px; padding: 0 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-dz *, .ui-dz *::before, .ui-dz *::after { animation: none !important; transition: none !important; }
}
`;
