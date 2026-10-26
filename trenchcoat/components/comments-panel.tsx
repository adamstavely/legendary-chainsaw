"use client";

/*
 * Comments Panel – a comment feed with filters, runnable /edit commands and a composer, in a single self-contained file.
 * Filter by questions or edits, sort, run an edit and undo it, resolve comments, add new ones.
 * `comments` stays the source of truth: when it changes the feed follows it, keyed by id. Comments added here show
 * right away and are reported through onCommentsChange with the whole list – pass it back (same ids) to keep them.
 * onAdd may return a promise: the new comment shows as pending, and if it rejects it is taken out again with an
 * error and its text back in the field. `resolved` and `filter` are controlled when defined, otherwise uncontrolled
 * from their defaults; changes are always reported. Other DOM props and `ref` go to the root <section>.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: comments-panel.tsx is Standard,
 * comments-panel-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows: heading, filter tabs,
 * the feed and the composer are rows of that card. Quiet gray type, thin 16px icons (solid for the applied check and
 * Run edit's play), the edit count in the tab as a chip, and a shimmering "Running…".
 */
// Generated from src/components/comments-panel.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type Dispatch, type ReactNode, type Ref, type RefObject, type SetStateAction } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-cp";

export type CommentAuthor = { name: string; avatar?: string };

export type PanelComment = {
  id: string;
  author: CommentAuthor;
  /** When it was written – a Date or a timestamp */
  createdAt: Date | number;
  text: string;
};

export type CommentsFilter = "all" | "questions" | "edits";

type CommentsPanelOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in comments-panel.tsx, Clean in comments-panel-clean.tsx */
  look?: Look;
  comments: PanelComment[];
  /** Who writes new comments */
  currentUser: CommentAuthor;
  title?: string;
  /**
   * Runs an /edit command – resolve when done, reject to show that it failed. Without it the edit is simulated:
   * marked as applied after a beat (and warns once, unless `demo` is set)
   */
  onRunEdit?: (comment: PanelComment) => Promise<void> | void;
  /**
   * Reverts an edit that onRunEdit applied – resolve when done, reject to keep it applied with an error.
   * Without it an applied edit offers no Undo, since the panel can't take it back on its own
   */
  onUndoEdit?: (comment: PanelComment) => Promise<void> | void;
  /** Demo mode: edits are simulated silently when onRunEdit is missing. For galleries and prototypes */
  demo?: boolean;
  /** A new comment – may return a promise: pending while it runs, a rejection takes the comment out again */
  onAdd?: (comment: PanelComment) => Promise<unknown> | void;
  /** The whole feed after a comment was added here (or taken out again when onAdd failed) */
  onCommentsChange?: (comments: PanelComment[]) => void;
  /** Ids of resolved comments – controlled when defined */
  resolved?: string[];
  defaultResolved?: string[];
  onResolvedChange?: (resolved: string[]) => void;
  /** The filter tab – controlled when defined */
  filter?: CommentsFilter;
  defaultFilter?: CommentsFilter;
  onFilterChange?: (filter: CommentsFilter) => void;
  /** Shows a close button in the header */
  onClose?: () => void;
  className?: string;
  ref?: Ref<HTMLElement>;
};

export type CommentsPanelProps = Omit<ComponentPropsWithoutRef<"section">, keyof CommentsPanelOwnProps> & CommentsPanelOwnProps;

type Tab = CommentsFilter;
const NONE: string[] = [];
type EditState = "idle" | "running" | "done" | "undoing";

// Warns once per page (not per instance) when edits are simulated because onRunEdit is missing
let warnedSimulatedEdit = false;
const warnSimulatedEdit = () => {
  if (warnedSimulatedEdit) return;
  warnedSimulatedEdit = true;
  console.warn(
    "CommentsPanel: no onRunEdit handler – simulating edits. Pass `demo` to keep the simulation, or `onRunEdit` to wire it up. The simulation will be off by default in the next major version.",
  );
};

const isEdit = (c: PanelComment) => /^\/edit\b/i.test(c.text.trim());
const isQuestion = (c: PanelComment) => !isEdit(c) && c.text.trim().endsWith("?");

function ago(time: number, now: number) {
  const s = Math.max(0, Math.round((now - time) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* ---------- Parts ---------- */

/**
 * Keeps "2min ago" honest: the clock is read after mount and every 30s – but only while the panel is on screen and
 * the tab is visible, and it renders only when one of the shown times would read differently
 */
function useRelativeClock(rootRef: { current: HTMLElement | null }, comments: { current: PanelComment[] }, setNow: Dispatch<SetStateAction<number>>) {
  useLayoutEffect(() => {
    let timer = 0;
    let onScreen = true;
    const read = () => {
      const at = Date.now();
      setNow((prev) => (comments.current.some((c) => ago(+c.createdAt, prev) !== ago(+c.createdAt, at)) ? at : prev));
    };
    const run = () => {
      const want = onScreen && document.visibilityState !== "hidden";
      if (want && !timer) {
        read();
        timer = window.setInterval(read, 30_000);
      } else if (!want && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    const el = rootRef.current;
    const io =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            onScreen = entries[entries.length - 1].isIntersecting;
            run();
          })
        : undefined;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", run);
    run();
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", run);
      window.clearInterval(timer);
    };
  }, [rootRef, comments, setNow]);
}

type FilterBarProps = { tab: Tab; setTab: (tab: Tab) => void; editCount: number; newest: boolean; setNewest: (newest: boolean) => void; look: Look };

const SORTS = [
  { label: "Newest first", value: true },
  { label: "Oldest first", value: false },
];

/**
 * All · Questions · Edits (toggle buttons – they filter one list, so no tab pattern), and the sort menu (APG menu
 * button: focus moves onto the checked item, ↑/↓/Home/End move, Esc returns to the button, Tab closes)
 */
function FilterBar({ tab, setTab, editCount, newest, setNewest, look }: FilterBarProps) {
  const clean = look === "clean";
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [menu]);
  // Opening moves focus onto the active item
  useEffect(() => {
    if (menu) items.current[active]?.focus({ preventScroll: true });
  }, [menu, active]);
  const openMenu = (at?: number) => {
    setActive(at ?? Math.max(0, SORTS.findIndex((o) => o.value === newest)));
    setMenu(true);
  };
  const close = () => {
    // Focus first, then unmount the menu – it never drops to <body>
    triggerRef.current?.focus({ preventScroll: true });
    setMenu(false);
  };
  return (
    <div className="ui-cp__bar">
      <div className="ui-cp__tabs" role="group" aria-label="Filter comments">
        {(["all", "questions", "edits"] as Tab[]).map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} className="ui-cp__tab" onClick={() => setTab(t)}>
            {{ all: "All", questions: "Questions", edits: "Edits" }[t]}
            {t === "edits" &&
              editCount > 0 &&
              (clean ? (
                <span className="ui-cp__count" key={editCount}>
                  <span className="ui-cp__sr">, </span>
                  {editCount}
                  <span className="ui-cp__sr"> to run</span>
                </span>
              ) : (
                <span className="ui-cp__badge">
                  <span className="ui-cp__sr">, </span>
                  {editCount}
                  <span className="ui-cp__sr"> to run</span>
                </span>
              ))}
          </button>
        ))}
      </div>
      <div className="ui-cp__sort" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          className="ui-cp__icon-btn"
          aria-label="Sort comments"
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => (menu ? setMenu(false) : openMenu())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              openMenu(e.key === "ArrowUp" ? SORTS.length - 1 : 0);
            }
          }}
        >
          <Icon name="sort" look={look} />
        </button>
        {menu && (
          <div
            className="ui-cp__menu"
            role="menu"
            aria-label="Sort comments"
            onKeyDown={(e) => {
              const last = SORTS.length - 1;
              const move = (i: number) => {
                e.preventDefault();
                setActive(i < 0 ? last : i > last ? 0 : i);
              };
              if (e.key === "ArrowDown") move(active + 1);
              else if (e.key === "ArrowUp") move(active - 1);
              else if (e.key === "Home") move(0);
              else if (e.key === "End") move(last);
              else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
              } else if (e.key === "Tab") setMenu(false);
            }}
          >
            {SORTS.map((o, i) => (
              <button
                key={o.label}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={newest === o.value}
                tabIndex={i === active ? 0 : -1}
                className="ui-cp__menu-item"
                onClick={() => {
                  setNewest(o.value);
                  close();
                }}
              >
                {o.label}
                {newest === o.value && <Icon name="check" look={look} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type CommentItemProps = {
  comment: PanelComment;
  state: EditState;
  resolved: boolean;
  pending: boolean;
  now: number;
  clean: boolean;
  look: Look;
  canUndo: boolean;
  failure?: string;
  onResolve: () => void;
  onRun: () => void;
  onUndo: () => void;
};

/** One comment: who and when, the text – and for an /edit, Run edit or "Edit applied" with Undo */
function CommentItem({ comment: c, state, resolved, pending, now, clean, look, canUndo, failure, onResolve, onRun, onUndo }: CommentItemProps) {
  const edit = isEdit(c);
  return (
    <li
      className="ui-cp__item"
      data-id={c.id}
      data-resolved={resolved || undefined}
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
    >
      <div className="ui-cp__meta">
        <Avatar author={c.author} look={look} />
        <span className="ui-cp__name">{c.author.name}</span>
        <time className="ui-cp__time" dateTime={new Date(c.createdAt).toISOString()}>
          {ago(+c.createdAt, now)}
        </time>
        <button
          type="button"
          className="ui-cp__resolve"
          aria-pressed={resolved}
          aria-label={resolved ? "Reopen comment" : "Resolve comment"}
          title={resolved ? "Reopen" : "Resolve"}
          onClick={onResolve}
        >
          <Icon name="resolve" look={look} />
        </button>
      </div>
      <p className="ui-cp__text">
        {edit ? (
          <>
            <span className="ui-cp__command">/Edit</span> {c.text.trim().replace(/^\/edit\s*/i, "")}
          </>
        ) : (
          c.text
        )}
      </p>
      {edit && !resolved && (
        <div className="ui-cp__actions">
          {state === "done" || state === "undoing" ? (
            <>
              <span className="ui-cp__done">
                <Icon name="done" look={look} />
                Edit applied
              </span>
              {canUndo && (
                <button
                  type="button"
                  className="ui-cp__link"
                  data-focus-key={`edit-${c.id}`}
                  aria-disabled={state === "undoing" || undefined}
                  onClick={() => state !== "undoing" && onUndo()}
                >
                  Undo
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="ui-cp__btn"
              data-focus-key={`edit-${c.id}`}
              aria-disabled={state === "running" || undefined}
              onClick={() => state !== "running" && onRun()}
            >
              {state === "running" ? (
                <>
                  {clean ? (
                    <>
                      <span className="ui-cp__spinner" aria-hidden="true" />
                      <span className="ui-cp__shimmer">
                        Running…
                        {/* A narrow window sweeps a full-colour copy of the label across it (transform only) */}
                        <span className="ui-cp__shine" aria-hidden="true">
                          <span>Running…</span>
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="ui-cp__spinner" aria-hidden="true" /> Running…
                    </>
                  )}
                </>
              ) : clean ? (
                <>
                  <Icon name="play" look={look} />
                  Run edit
                </>
              ) : (
                "Run edit"
              )}
            </button>
          )}
          {failure && (
            <span className="ui-cp__error" role="alert">
              {failure}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

/** The field for a new comment */
function Composer({ author, look, draft, onDraft, onAdd }: { author: CommentAuthor; look: Look; draft: string; onDraft: (text: string) => void; onAdd: () => void }) {
  return (
    <form
      className="ui-cp__composer"
      onSubmit={(e) => {
        e.preventDefault();
        // Send turns disabled once the field is cleared – focus goes back to the field, not to <body>
        const form = e.currentTarget;
        rescueFocus(form.querySelector(".ui-cp__send"), [form.querySelector<HTMLInputElement>(".ui-cp__input")]);
        onAdd();
      }}
    >
      <Avatar author={author} look={look} />
      <input
        className="ui-cp__input"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => {
          // Enter that confirms an IME composition doesn't send
          if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
        }}
        placeholder="Add a comment or /edit…"
        aria-label="Add a comment"
      />
      <button type="submit" className="ui-cp__send" aria-label="Send comment" disabled={!draft.trim()}>
        <Icon name="up" look={look} />
      </button>
    </form>
  );
}

export function CommentsPanel({
  look,
  comments: given,
  currentUser,
  title = "Comments",
  onRunEdit,
  onUndoEdit,
  demo = false,
  onAdd,
  onCommentsChange,
  resolved: resolvedProp,
  defaultResolved = NONE,
  onResolvedChange,
  filter,
  defaultFilter = "all",
  onFilterChange,
  onClose,
  className,
  ref,
  ...rest
}: CommentsPanelProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  // The feed is the prop, plus comments added here that aren't in the prop yet (matched by id)
  const [local, setLocal] = useState<PanelComment[]>([]);
  const comments = useMemo(() => {
    const ids = new Set(given.map((c) => c.id));
    return [...local.filter((c) => !ids.has(c.id)), ...given];
  }, [given, local]);
  const latest = useRef(comments);
  useLayoutEffect(() => {
    latest.current = comments;
  });
  const report = (next: PanelComment[]) => {
    latest.current = next;
    onCommentsChange?.(next);
  };
  // Comments whose onAdd is still running, and why the last one failed
  const [adding, setAdding] = useState<Set<string>>(() => new Set());
  const [addError, setAddError] = useState<string | null>(null);
  const added = useRef(0);
  const [tab, setTab] = useControllable<Tab>(filter, defaultFilter, onFilterChange, "filter");
  const [resolvedIds, setResolvedIds] = useControllable<string[]>(resolvedProp, defaultResolved, onResolvedChange, "resolved");
  const resolved = useMemo(() => new Set(resolvedIds), [resolvedIds]);
  const [newest, setNewest] = useState(true);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  // Why the last run or undo of an edit failed, by comment id
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  // Relative times count from the newest comment while rendering on the server, then from the real clock
  const [now, setNow] = useState(() => Math.max(0, ...given.map((c) => +c.createdAt)));
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  // The persistent status region: final results only (edit applied / undone, comment added)
  const [announce, setAnnounce] = useState("");
  // Run edit ↔ Undo share a focus key; when an edit is applied and there's no Undo, focus goes to its Resolve button
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const id = key?.startsWith("edit-") ? key.slice(5) : null;
      const item = id ? [...(rootRef.current?.querySelectorAll<HTMLElement>(".ui-cp__item") ?? [])].find((li) => li.dataset.id === id) : null;
      return item?.querySelector<HTMLElement>(".ui-cp__resolve") ?? rootRef.current?.querySelector<HTMLElement>(".ui-cp__input");
    },
  });
  const listRef = useRef<HTMLUListElement>(null);
  const morphRef = useSmoothHeight(listRef);
  // Edits that settle after unmount are ignored
  const alive = useRef(true);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useRelativeClock(rootRef, latest, setNow);

  const open = comments.filter((c) => !resolved.has(c.id));
  const pendingEdits = open.filter((c) => isEdit(c) && edits[c.id] !== "done" && edits[c.id] !== "undoing").length;
  const counts = { all: open.length, questions: open.filter(isQuestion).length, edits: pendingEdits };

  const shown = useMemo(() => {
    const list = comments.filter((c) => tab === "all" || (tab === "questions" ? isQuestion(c) : isEdit(c)));
    return [...list].sort((a, b) => (+b.createdAt - +a.createdAt) * (newest ? 1 : -1));
  }, [comments, tab, newest]);

  const fail = (id: string, message: string) => setFailures((f) => ({ ...f, [id]: message }));
  const clearFailure = (id: string) =>
    setFailures((f) => {
      if (!(id in f)) return f;
      const next = { ...f };
      delete next[id];
      return next;
    });

  const run = async (c: PanelComment) => {
    setEdits((e) => ({ ...e, [c.id]: "running" }));
    clearFailure(c.id);
    if (!onRunEdit && !demo) warnSimulatedEdit();
    try {
      await (onRunEdit ? onRunEdit(c) : new Promise((r) => timers.current.push(window.setTimeout(r, 1100))));
      if (alive.current) {
        setEdits((e) => ({ ...e, [c.id]: "done" }));
        setAnnounce("Edit applied.");
      }
    } catch {
      if (!alive.current) return;
      setEdits((e) => ({ ...e, [c.id]: "idle" }));
      fail(c.id, "The edit couldn't be applied.");
    }
  };

  // Undo only where it can be honoured: the edit was simulated, or onUndoEdit takes it back
  const canUndo = !!onUndoEdit || !onRunEdit;
  const undo = async (c: PanelComment) => {
    setEdits((e) => ({ ...e, [c.id]: "undoing" }));
    clearFailure(c.id);
    try {
      await onUndoEdit?.(c);
      if (alive.current) {
        setEdits((e) => ({ ...e, [c.id]: "idle" }));
        setAnnounce("Edit undone.");
      }
    } catch {
      if (!alive.current) return;
      setEdits((e) => ({ ...e, [c.id]: "done" }));
      fail(c.id, "The edit couldn't be undone.");
    }
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    const at = Date.now();
    const comment: PanelComment = { id: `${uid}-${++added.current}`, author: currentUser, createdAt: at, text };
    setLocal((list) => [comment, ...list]);
    report([comment, ...latest.current]);
    setDraft("");
    setAddError(null);
    setTab("all");
    setNewest(true);
    setNow(at);
    setAnnounce("Comment added.");
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
    // onAdd may be async: pending until it settles; a rejection takes the comment out and gives its text back
    const takeBack = () => {
      setLocal((list) => list.filter((c) => c.id !== comment.id));
      report(latest.current.filter((c) => c.id !== comment.id));
      setDraft((d) => d || text);
      setAddError("The comment couldn't be added.");
      setAnnounce("");
    };
    let work: unknown;
    try {
      work = onAdd?.(comment);
    } catch {
      takeBack();
      return;
    }
    if (!work || typeof (work as Promise<unknown>).then !== "function") return;
    const settle = (ok: boolean) => {
      if (!alive.current) return;
      setAdding((s) => {
        const next = new Set(s);
        next.delete(comment.id);
        return next;
      });
      if (!ok) takeBack();
    };
    setAdding((s) => new Set(s).add(comment.id));
    (work as Promise<unknown>).then(
      () => settle(true),
      () => settle(false),
    );
  };

  return (
    <>
      <style href="ui-comments-panel" precedence="default">
        {css}
      </style>
      <section aria-label={title} {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook}>
        <header className="ui-cp__head">
          <h3 className="ui-cp__title">{title}</h3>
          {onClose && (
            <button type="button" className="ui-cp__icon-btn" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>
              <Icon name="close" look={resolvedLook} />
            </button>
          )}
        </header>

        {/* Standard: the filter bar and the feed in a white card on the tray; Clean: rows of the one card */}
        <Rows clean={clean}>
          <FilterBar tab={tab} setTab={setTab} editCount={counts.edits} newest={newest} setNewest={setNewest} look={resolvedLook} />

          <div className="ui-cp__morph" ref={morphRef}>
          <ul className="ui-cp__list" ref={listRef}>
            {shown.length === 0 && (
              <li className="ui-cp__empty">{tab === "questions" ? "No open questions." : "No edits to run."}</li>
            )}
            {shown.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                state={edits[c.id] ?? "idle"}
                resolved={resolved.has(c.id)}
                pending={adding.has(c.id)}
                now={now}
                clean={clean}
                look={resolvedLook}
                canUndo={canUndo}
                failure={failures[c.id]}
                onResolve={() => setResolvedIds((r) => (r.includes(c.id) ? r.filter((id) => id !== c.id) : [...r, c.id]))}
                onRun={() => run(c)}
                onUndo={() => undo(c)}
              />
            ))}
          </ul>
          </div>
        </Rows>

        <Composer
          author={currentUser}
          look={resolvedLook}
          draft={draft}
          onDraft={(text) => {
            setDraft(text);
            setAddError(null);
          }}
          onAdd={add}
        />
        {addError && (
          <p className="ui-cp__error ui-cp__add-error" role="alert">
            {addError}
          </p>
        )}
        <span className="ui-cp__sr" role="status">
          {announce}
        </span>
      </section>
    </>
  );
}

function Avatar({ author, look }: { author: CommentAuthor; look: Look }) {
  const size = look === "clean" ? 20 : 22;
  const initials = author.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return author.avatar ? (
    <img className="ui-cp__avatar" src={author.avatar} alt="" width={size} height={size} loading="lazy" />
  ) : (
    <span className="ui-cp__avatar ui-cp__avatar--initials" aria-hidden="true">
      {initials}
    </span>
  );
}

/** Standard: the filter bar and the feed sit in a white card on the tray. Clean: they are rows of the one card */
const Rows = ({ clean, children }: { clean: boolean; children: ReactNode }) =>
  clean ? <>{children}</> : <div className="ui-cp__card">{children}</div>;

/* ---------- Icons – Standard: 1.5px lines drawn by attributes; Clean: 16px, thin lines with round caps or solid glyphs ---------- */

type IconName = "close" | "sort" | "check" | "resolve" | "done" | "play" | "up";
const standardIcons: Record<Exclude<IconName, "play">, [d: string, size: number]> = {
  close: ["m4 4 8 8M12 4l-8 8", 16],
  sort: ["M2.5 4.5h11M4.5 8h7M6.5 11.5h3", 16],
  check: ["m3.5 8.5 3 3 6-7", 14],
  resolve: ["m3.5 8.5 3 3 6-7", 14],
  done: ["m3.5 8.5 3 3 6-7", 14],
  up: ["M8 13V3M3.5 7.5 8 3l4.5 4.5", 14],
};
const cleanIcons: Record<IconName, [d: string, solid?: boolean, className?: string]> = {
  close: ["M4.5 4.5l7 7M11.5 4.5l-7 7"],
  sort: ["M2.5 4.5h11M4.5 8h7M6.5 11.5h3"],
  check: ["m3.5 8.5 3 3 6-7", false, "ui-cp__menu-check"],
  resolve: ["M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM5.5 8.2l1.7 1.7 3.3-3.8"],
  done: ["M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z", true],
  play: ["M5 3.6a.8.8 0 0 1 1.2-.7l6.3 3.9a1.4 1.4 0 0 1 0 2.4l-6.3 3.9a.8.8 0 0 1-1.2-.7V3.6Z", true],
  up: ["M8 12.5v-9M4 7.5l4-4 4 4"],
};

const Icon = ({ name, look }: { name: IconName; look: Look }) => {
  if (look === "clean" || name === "play") {
    const [d, solid, className] = cleanIcons[name];
    return (
      <svg viewBox="0 0 16 16" className={["ui-cp__glyph", className].filter(Boolean).join(" ")} data-solid={solid || undefined} aria-hidden="true">
        <path d={d} />
      </svg>
    );
  }
  const [d, size] = standardIcons[name];
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
};

/**
 * Lets a box glide to the height of its content instead of jumping: the outer box follows the inner one
 * with a height transition whenever the content grows or shrinks.
 */

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

/** The outer box follows the inner box's height, with a transition after the first frame */
function useSmoothHeight(inner: RefObject<HTMLElement | null>) {
  const outer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const sync = () => {
      o.style.height = `${i.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(i);
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [inner]);
  return outer;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-cp:where([data-look="standard"]),
.ui-cp__portal:where([data-look="standard"]) {
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 600;
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-radius: 10px;
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-menu-item-px: 10px;
  --_tc-menu-item-radius: 8px;
  --_tc-menu-item-selected-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-radius-badge: 999px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-seg-track-radius: 10px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-cp:where([data-look="clean"]),
.ui-cp__portal:where([data-look="clean"]) {
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 500;
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-radius: 8px;
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-font-size: 13px;
  --_tc-menu-item-h: 32px;
  --_tc-menu-item-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-menu-item-px: 8px;
  --_tc-menu-item-radius: 6px;
  --_tc-menu-item-selected-fg: light-dark(#0058cf, #70b8ff);
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-radius-badge: 5px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-seg-pad: 2px;
  --_tc-seg-thumb-bg: light-dark(#ffffff, #34343a);
  --_tc-seg-thumb-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-seg-track-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-seg-track-radius: 8px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-cp {
  --tc-comments-panel-initials-bg: light-dark(#eef3ff, rgba(47, 107, 255, 0.16));
  --tc-comments-panel-avatar-ring: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  /* The tray pattern: heading and composer on the tray, the white card sits on top of it */
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-cp */
:where([data-look="clean"], [data-look="clean"] *).ui-cp {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-comments-panel-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-cp *, .ui-cp *::before, .ui-cp *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
.ui-cp button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 6px 10px 6px 18px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__title { margin: 0; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: transparent;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__icon-btn:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px 14px;
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
/* Filter: the segmented pattern – a track with a raised thumb; selected also carries a ≥3:1 ring */
.ui-cp__tabs { display: flex; min-width: 0; padding: var(--tc-seg-pad, var(--_tc-seg-pad)); border-radius: var(--tc-seg-track-radius, var(--_tc-seg-track-radius)); background: var(--tc-seg-track-bg, var(--_tc-seg-track-bg)); }
.ui-cp__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  height: calc(var(--tc-control-h-md, var(--_tc-control-h-md)) - 2 * var(--tc-seg-pad, var(--_tc-seg-pad)));
  padding: 0 10px;
  border: 0;
  border-radius: calc(var(--tc-seg-track-radius, var(--_tc-seg-track-radius)) - var(--tc-seg-pad, var(--_tc-seg-pad)));
  background: transparent;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md)) !important;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cp__tab:hover { color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
.ui-cp__tab[aria-pressed="true"] {
  background: var(--tc-seg-thumb-bg, var(--_tc-seg-thumb-bg));
  box-shadow: var(--tc-seg-thumb-shadow, var(--_tc-seg-thumb-shadow)), inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected));
  color: var(--tc-text-primary, var(--_tc-text-primary)) !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__tab[aria-pressed="true"] { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  background: var(--tc-surface-inverse, var(--_tc-surface-inverse));
  box-shadow: 0 0 0 2px var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs));
  font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__sort { position: relative; }
/* Sort menu: the menu pattern */
.ui-cp__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: 2px;
  min-width: 160px;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  transform-origin: top right;
  animation: ui-cp-drop var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-cp__menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 0 var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border: 0;
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  background: transparent;
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size)) !important;
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: left;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cp__menu-item:hover,
.ui-cp__menu-item:focus-visible { background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover)); }
.ui-cp__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__list {
  max-height: var(--tc-comments-panel-max-height, 360px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__item {
  padding: 14px 16px 16px;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  animation: ui-cp-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-cp) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-cp) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__glyph[data-solid] { fill: currentColor; stroke: none; }
/* Heading row */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 0 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__title { margin: 0; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
/* Ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn[aria-expanded="true"] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Filter tabs: the button-switch look */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 12px 16px;
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__count {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  margin-right: -4px;
  padding: 0 4px;
  border-radius: var(--tc-radius-badge, var(--_tc-radius-badge));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  animation: ui-cp-pop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tab[aria-pressed="true"] .ui-cp__count { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Sort menu: the popover */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__sort { position: relative; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__menu-check { stroke-width: 1.4; }
/* The feed */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__list {
  max-height: var(--tc-comments-panel-max-height, 360px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--tc-fill-strong, var(--_tc-fill-strong)) transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__item {
  padding: 12px 16px 14px;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  animation: ui-cp-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cp__item:first-child { border-top: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__meta { display: flex; align-items: center; gap: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__avatar {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 1px var(--tc-comments-panel-avatar-ring);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__avatar--initials {
  display: grid;
  place-items: center;
  background: var(--tc-comments-panel-initials-bg);
  font-size: var(--tc-avatar-font-size, var(--_tc-avatar-font-size));
  font-weight: var(--tc-avatar-font-weight, var(--_tc-avatar-font-weight));
  color: var(--tc-accent-text, var(--_tc-accent-text));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__name { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__time { margin-left: auto; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__resolve {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-right: -4px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: transparent;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__avatar {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__avatar--initials {
  display: grid;
  place-items: center;
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-avatar-font-size, var(--_tc-avatar-font-size));
  font-weight: var(--tc-avatar-font-weight, var(--_tc-avatar-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__name {
  min-width: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__time {
  flex: none;
  margin-left: auto;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Resolve: a ghost icon button that shows on hover, a soft green fill when resolved */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: -2px -4px -2px 0;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  opacity: 0;
  transition: opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cp__item:hover .ui-cp__resolve,
.ui-cp__resolve:focus-visible,
.ui-cp__resolve[aria-pressed="true"] { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__resolve:hover { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__resolve[aria-pressed="true"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__text {
  margin: 8px 0 0;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve[aria-pressed="true"] { background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__text {
  margin: 6px 0 0 28px;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  overflow-wrap: anywhere;
}
/* Resolved: the text turns muted (still ≥4.5:1) and is struck through, the resolve button stays checked */
.ui-cp__item[data-resolved] .ui-cp__text,
.ui-cp__item[data-resolved] .ui-cp__command { color: var(--tc-text-muted, var(--_tc-text-muted)); text-decoration: line-through; text-decoration-color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__command { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__actions { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
/* Run edit: looks exactly like Button secondary */
.ui-cp__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size)) !important;
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)) !important;
  transition: box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cp__btn:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-cp__btn[aria-disabled="true"] { color: var(--tc-text-muted, var(--_tc-text-muted)) !important; cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--tc-border-strong, var(--_tc-border-strong));
  border-top-color: var(--tc-text-primary, var(--_tc-text-primary));
  border-radius: 50%;
  animation: ui-cp-spin var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__command { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__actions { display: flex; align-items: center; gap: 10px; margin: 10px 0 0 28px; }
/* Run edit: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__btn .ui-cp__glyph { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__spinner {
  flex: none;
  width: 12px;
  height: 12px;
  margin: 0 2px;
  border: 2px solid var(--tc-fill-strong, var(--_tc-fill-strong));
  border-top-color: var(--tc-accent-text, var(--_tc-accent-text));
  border-radius: 50%;
  animation: ui-cp-spin var(--tc-duration-reveal, var(--_tc-duration-reveal)) linear infinite;
}
/* "Running…": a lighter band sweeps across the gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__shimmer { position: relative; display: inline-block; }
/* The window and the copy inside it move in opposite directions, so the copy stays on the label – transform only,
   three passes and done */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__shine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  overflow: hidden;
  pointer-events: none;
  animation: ui-cp-window var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3 both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-cp-window-copy var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3 both;
}
.ui-cp__error { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-cp__add-error { margin: 6px 12px 0; }
.ui-cp__item[data-pending] { opacity: 0.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__done {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px 0 8px;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
  animation: ui-cp-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__link {
  padding: 0;
  border: 0;
  background: none;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md)) !important;
  color: var(--tc-text-muted, var(--_tc-text-muted)) !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__link:hover { color: var(--tc-text-primary, var(--_tc-text-primary)) !important; }
.ui-cp__link[aria-disabled="true"] { cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__empty { padding: 28px 16px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Composer in the gray extension */
:where([data-look="standard"], [data-look="standard"] *).ui-cp__composer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 9px 9px 16px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__input {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-cp__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
/* Send: an icon-only Button primary */
.ui-cp__send {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)) !important;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-cp__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px 0 8px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
  animation: ui-cp-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__link {
  height: 28px;
  padding: 0 4px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  transition: color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__link:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__empty { padding: 28px 16px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* The last row: composer under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__composer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__input {
  flex: 1;
  min-width: 0;
  height: 28px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  caret-color: var(--tc-accent-text, var(--_tc-accent-text));
}
/* Send: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__send .ui-cp__glyph { stroke-width: 1.5; }
.ui-cp__send:disabled { opacity: 0.4; cursor: default; }
.ui-cp__send:not(:disabled):active { transform: scale(0.94); }
@keyframes ui-cp-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-cp-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-cp-pop { from { opacity: 0; transform: scale(0.8); } }
@keyframes ui-cp-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-cp__item,
:where([data-look="standard"], [data-look="standard"] *).ui-cp__menu,
:where([data-look="standard"], [data-look="standard"] *).ui-cp__done { animation: none; }
}
@keyframes ui-cp-window { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@keyframes ui-cp-window-copy { from { transform: translateX(40%); } to { transform: translateX(-100%); } }
/* Height changes glide instead of jumping */
.ui-cp__morph { overflow: hidden; }
.ui-cp__morph[data-smooth] { transition: height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-cp__morph[data-smooth] { transition: none; }
}
/* Narrow: tighter edges, smaller tab gaps */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp__head { padding-left: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__bar { padding-left: 14px; padding-right: 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tabs { gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tab { padding: 4px 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__item { padding-left: 14px; padding-right: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__composer { padding-left: 14px; }
}
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp__text,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__actions { margin-left: 0; }
}
/* Touch screens: taller targets, resolve always visible */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__send { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tab { padding: 6px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__menu-item { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__done,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__link { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__input { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve { width: 32px; height: 32px; margin: -6px -6px -6px 0; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp *,
:where([data-look="clean"], [data-look="clean"] *).ui-cp *::before,
:where([data-look="clean"], [data-look="clean"] *).ui-cp *::after { animation: none !important; transition: none !important; }
}
/* The composer is the field: its row shows the field focus ring (focus ring + halo) while the input has focus */
.ui-cp__composer { border-radius: var(--tc-field-radius, var(--_tc-field-radius)); transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-cp__input:focus { outline: none; }
.ui-cp__composer:has(.ui-cp__input:focus) { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__composer { border-radius: 0 0 var(--tc-radius-lg, var(--_tc-radius-lg)) var(--tc-radius-lg, var(--_tc-radius-lg)); }
/* Announcements for screen readers only */
.ui-cp__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
