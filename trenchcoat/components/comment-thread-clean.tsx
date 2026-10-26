"use client";

/*
 * Comment Thread – one comment with its replies, including an assistant that reports what it did, in a single
 * self-contained file. Assistant replies can fold open to show the details; replying shows a thinking state
 * while an async answer comes back; if it fails, the thread says so and offers to try again.
 * `messages` stays the source of truth: when it changes (server data, realtime) the thread follows it, keyed by id.
 * Replies posted here show right away and are reported through onMessagesChange with the whole list – pass that list
 * back (same ids) and they're simply yours. Other DOM props and `ref` go to the root <section>.
 * New answers and a failed reply are announced once, in a small status region – the conversation itself isn't live,
 * so the "5min ago" times can tick without being read out again.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: comment-thread.tsx is Standard,
 * comment-thread-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows: the heading on top,
 * the conversation in the middle and the reply field lying right in the card as its last row. Its icons are 16px
 * with thin lines, the avatars 20px, and the thinking state shimmers.
 */
// Generated from src/components/comment-thread.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-ct";

export type ThreadAuthor = { name: string; avatar?: ReactNode | string; assistant?: boolean };

export type ThreadMessage = {
  id: string;
  author: ThreadAuthor;
  createdAt: Date | number;
  text: string;
  /** Assistant replies: a short status line that folds open to show these details */
  status?: string;
  details?: string[];
};

type CommentThreadOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in comment-thread.tsx, Clean in comment-thread-clean.tsx */
  look?: Look;
  title?: string;
  messages: ThreadMessage[];
  currentUser: ThreadAuthor;
  /** The assistant that answers – used for the thinking state */
  assistant?: ThreadAuthor;
  /**
   * Called with every new reply. Return a message (or a promise of one) to let the assistant answer;
   * return nothing to just post the reply.
   */
  onReply?: (text: string) => ThreadMessage | Promise<ThreadMessage | void> | void;
  /** The whole thread after a reply was posted here, or the assistant answered – store it and pass it back */
  onMessagesChange?: (messages: ThreadMessage[]) => void;
  onClose?: () => void;
  className?: string;
  ref?: Ref<HTMLElement>;
};

export type CommentThreadProps = Omit<ComponentPropsWithoutRef<"section">, keyof CommentThreadOwnProps> & CommentThreadOwnProps;

function ago(time: number, now: number) {
  const s = Math.max(0, Math.round((now - time) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export function CommentThread({
  look,
  title = "Comment",
  messages: given,
  currentUser,
  assistant,
  onReply,
  onMessagesChange,
  onClose,
  className,
  ref,
  ...rest
}: CommentThreadProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  // The thread is the prop, plus what was posted here and isn't in the prop yet (matched by id)
  const [local, setLocal] = useState<ThreadMessage[]>([]);
  const givenIds = new Set(given.map((m) => m.id));
  const messages = [...given, ...local.filter((m) => !givenIds.has(m.id))];
  const latest = useRef(messages);
  useLayoutEffect(() => {
    latest.current = messages;
  });
  const post = (m: ThreadMessage) => {
    const next = [...latest.current.filter((x) => x.id !== m.id), m];
    latest.current = next;
    setLocal((l) => [...l.filter((x) => x.id !== m.id), m]);
    onMessagesChange?.(next);
  };
  // Assistant replies that are there from the start come in a beat after the comment above them
  const [firstIds] = useState(() => new Set(given.filter((m) => m.author.assistant).map((m) => m.id)));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  // A reply the assistant couldn't answer – shown with Try again
  const [failed, setFailed] = useState<string | null>(null);
  // Relative times count from the newest message while rendering on the server, then from the real clock
  const [now, setNow] = useState(() => Math.max(0, ...given.map((m) => +m.createdAt)));
  const listRef = useRef<HTMLDivElement>(null);
  const morphRef = useSmoothHeight(listRef);
  const rootRef = useRef<HTMLElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  const inputRef = useRef<HTMLInputElement>(null);
  // Send disables itself and Try again goes away once used: focus moves to the reply field, never to <body>
  useFocusRescue(rootRef, { fallback: () => inputRef.current });
  // What the status region says: the latest answer that came in, or that one couldn't be posted
  const [announce, setAnnounce] = useState("");
  const seen = useRef<Set<string> | null>(null);
  const idKey = messages.map((m) => m.id).join("\n");
  const me = currentUser.name;
  useEffect(() => {
    const list = latest.current;
    const ids = new Set(list.map((m) => m.id));
    if (seen.current) {
      const fresh = list.filter((m) => !seen.current!.has(m.id) && m.author.name !== me);
      const last = fresh[fresh.length - 1];
      if (last) setAnnounce(`${last.author.name}: ${[last.text, last.status].filter(Boolean).join(". ")}`);
    }
    seen.current = ids;
  }, [idKey, me]);
  const count = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    const read = () => setNow(Date.now());
    read();
    const t = window.setInterval(read, 30_000);
    return () => window.clearInterval(t);
  }, []);

  // Follow the conversation as it grows
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  const send = () => {
    const text = draft.trim();
    if (!text || thinking) return;
    // Sent with the button: it is about to be disabled, so the reply field takes focus for the next one
    rescueFocus(rootRef.current?.querySelector(".ui-ct__send"), [inputRef.current]);
    setDraft("");
    const at = Date.now();
    setNow(at);
    lockHeight(true);
    post({ id: `${uid}-${++count.current}`, author: currentUser, createdAt: at, text });
    void answer(text);
  };
  // Ask for the assistant's answer – again with Try again when it failed
  const answer = async (text: string) => {
    setFailed(null);
    let reply: ReturnType<NonNullable<typeof onReply>>;
    const fail = () => {
      setFailed(text);
      setAnnounce(assistant ? `${assistant.name} couldn't answer.` : "Couldn't post the reply.");
    };
    try {
      reply = onReply?.(text);
    } catch {
      fail();
      return;
    }
    if (!reply) return;
    setThinking(true);
    try {
      const message = await reply;
      if (!alive.current) return;
      const at = Date.now();
      if (message) post({ ...message, createdAt: at });
      setNow(at);
    } catch {
      if (alive.current) fail();
    } finally {
      if (alive.current) setThinking(false);
    }
  };

  // New messages keep the card at its height and the conversation scrolls up; folding details lets it grow again
  const lockHeight = (on: boolean) => {
    const list = listRef.current;
    if (list) list.style.maxHeight = on ? `${list.offsetHeight}px` : "";
  };

  const toggle = (id: string) => {
    lockHeight(false);
    setOpen((o) => {
      const next = new Set(o);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <style href="ui-comment-thread" precedence="default">
        {css}
      </style>
      <section aria-label={title} {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook}>
        <header className="ui-ct__head">
          <h3 className="ui-ct__title">{title}</h3>
          <span className="ui-ct__count">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </span>
          {onClose && (
            <button type="button" className="ui-ct__icon-btn" aria-label="Close comment" onClick={onClose}>
              <Icon look={resolvedLook} d={clean ? "m4.5 4.5 7 7M11.5 4.5l-7 7" : "m4 4 8 8M12 4l-8 8"} />
            </button>
          )}
        </header>

        {/* Clean: only the conversation glides to its new height – the reply row below always stays in view */}
        <div className={clean ? "ui-ct__morph" : "ui-ct__card ui-ct__morph"} ref={morphRef}>
        {/* Scrolls: focusable, so the conversation can be scrolled from the keyboard */}
        <div className="ui-ct__scroll" ref={listRef} role="region" aria-label="Messages" tabIndex={0}>
          {messages.map((m) => {
            const isOpen = open.has(m.id);
            const command = /^\/edit\b/i.test(m.text.trim());
            return (
              <article key={m.id} className="ui-ct__msg" data-delayed={firstIds.has(m.id) || undefined}>
                <div className="ui-ct__meta">
                  <Avatar author={m.author} look={resolvedLook} />
                  <span className="ui-ct__name">{m.author.name}</span>
                  <time className="ui-ct__time" dateTime={new Date(m.createdAt).toISOString()}>
                    {ago(+m.createdAt, now)}
                  </time>
                </div>
                {m.text && (
                  <p className="ui-ct__text">
                    {command ? (
                      <>
                        <span className="ui-ct__command">{clean ? "/edit" : "/Edit"}</span> {m.text.trim().replace(/^\/edit\s*/i, "")}
                      </>
                    ) : (
                      m.text
                    )}
                  </p>
                )}
                {m.status && (
                  <div className="ui-ct__status">
                    <button
                      type="button"
                      className="ui-ct__status-btn"
                      aria-expanded={isOpen}
                      disabled={!m.details?.length}
                      onClick={() => toggle(m.id)}
                    >
                      {clean ? (
                        <>
                          <svg viewBox="0 0 16 16" className="ui-ct__check" aria-hidden="true">
                            <path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z" />
                          </svg>
                          <span className="ui-ct__status-text">{m.status}</span>
                        </>
                      ) : (
                        <>
                          <span className="ui-ct__check">
                            <Icon look={resolvedLook} d="m4 8.3 2.6 2.6L12 5.4" size={12} />
                          </span>
                          {m.status}
                        </>
                      )}
                      {!!m.details?.length && (
                        <span className="ui-ct__chevron">
                          <Icon look={resolvedLook} d={clean ? "m5 6.5 3 3 3-3" : "m4.5 6.25 3.5 3.5 3.5-3.5"} size={14} />
                        </span>
                      )}
                    </button>
                    {!!m.details?.length && (
                      <div className="ui-ct__details" data-open={isOpen || undefined} inert={!isOpen}>
                        <ul>
                          {m.details.map((d, i) => (
                            <li key={d} style={{ "--i": i } as CSSProperties}>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {failed !== null && !thinking && (
            <article className="ui-ct__msg ui-ct__failed">
              <p className="ui-ct__text">
                {assistant ? `${assistant.name} couldn't answer.` : "Couldn't post the reply."}{" "}
                <button type="button" className="ui-ct__retry" onClick={() => void answer(failed)}>
                  Try again
                </button>
              </p>
            </article>
          )}
          {thinking && assistant && (
            <article className="ui-ct__msg" aria-label={`${assistant.name} is thinking`}>
              <div className="ui-ct__meta">
                <Avatar author={assistant} look={resolvedLook} />
                <span className="ui-ct__name">{assistant.name}</span>
              </div>
              {clean ? (
                <p className="ui-ct__text">
                  <span className="ui-ct__thinking" data-text="Thinking…">
                    Thinking…
                  </span>
                </p>
              ) : (
                <p className="ui-ct__thinking">Thinking…</p>
              )}
            </article>
          )}
        </div>
        </div>

        <form
          className="ui-ct__composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={inputRef}
            className="ui-ct__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter that confirms an IME composition doesn't send
              if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
            }}
            placeholder={assistant ? `Reply, or ask @${assistant.name}…` : "Add comment…"}
            aria-label="Reply"
          />
          <button type="submit" className="ui-ct__send" aria-label="Send reply" disabled={!draft.trim() || thinking}>
            {clean ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 12.5v-9M4.25 7.25 8 3.5l3.75 3.75" />
              </svg>
            ) : (
              <Icon look={resolvedLook} d="M8 13V3M3.5 7.5 8 3l4.5 4.5" size={14} />
            )}
          </button>
        </form>
        {/* Mounted from the start, so its first message is read out */}
        <p className="ui-ct__live" role="status">
          {announce}
        </p>
      </section>
    </>
  );
}

function Avatar({ author, look }: { author: ThreadAuthor; look: Look }) {
  const size = look === "clean" ? 20 : 24;
  if (author.avatar && typeof author.avatar !== "string") return <span className="ui-ct__avatar">{author.avatar}</span>;
  if (typeof author.avatar === "string") {
    return <img className="ui-ct__avatar" src={author.avatar} alt="" width={size} height={size} loading="lazy" />;
  }
  return (
    <span className="ui-ct__avatar ui-ct__avatar--initials" aria-hidden="true">
      {author.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

/** A simple assistant mark: a full circle with a blue-to-violet gradient – pass your own logo as `avatar` instead */
export function AssistantMark() {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b9dff" />
          <stop offset="0.5" stopColor="#2f6bff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill={`url(#${id}-fill)`} />
    </svg>
  );
}

/** Standard: lines drawn by attributes at the given size. Clean: 16px icons with thin, round lines (styled by .ui-ct__glyph) */
const Icon = ({ d, size = 16, look }: { d: string; size?: number; look: Look }) =>
  look === "clean" ? (
    <svg viewBox="0 0 16 16" className="ui-ct__glyph" aria-hidden="true">
      <path d={d} />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );

/**
 * Lets a box glide to the height of its content instead of jumping: the outer box follows the inner one
 * with a height transition whenever the content grows or shrinks.
 */

/* ---------- Shared helpers (inlined from src/internal) ---------- */

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
.ui-ct:where([data-look="standard"]),
.ui-ct__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 600;
  --_tc-avatar-md: 24px;
  --_tc-avatar-sm: 20px;
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-badge: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-7: 28px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-ct:where([data-look="clean"]),
.ui-ct__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 500;
  --_tc-avatar-md: 24px;
  --_tc-avatar-sm: 20px;
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal: 700ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-badge: 5px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-7: 28px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

/* Colors and motion as variables – override them on .ui-ct */
.ui-ct {
  --tc-comment-thread-avatar-ring: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  /* Each message builds up piece by piece – this far apart */
  --tc-comment-thread-step: 60ms;
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Standard: like the Chat Composer – a tray with heading and reply field, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *).ui-ct {
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
/* Clean: no tray – one card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *).ui-ct {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-comment-thread-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-comment-thread-avatar-ring: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  -webkit-tap-highlight-color: transparent;
}
.ui-ct *, .ui-ct *::before, .ui-ct *::after { box-sizing: border-box; }
:where(.ui-ct) button { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ct button:focus-visible, .ui-ct__scroll:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* The conversation scrolls inside its card: its ring sits just inside */
.ui-ct__scroll:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-ct) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
/* ---------- Header ---------- */
.ui-ct__head { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-height: 46px; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__head { gap: var(--tc-space-2, var(--_tc-space-2)); min-height: 48px; padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4)); border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-ct__title { margin: 0; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__title { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-ct__count { margin-right: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__count { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* Close: a ghost icon button */
.ui-ct__icon-btn { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__icon-btn { width: var(--tc-control-h-md, var(--_tc-control-h-md)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); }
.ui-ct__icon-btn:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* ---------- The conversation ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
.ui-ct__scroll {
  display: grid;
  gap: var(--tc-space-4-5, var(--_tc-space-4-5));
  align-content: start;
  min-height: var(--tc-comment-thread-min-height, 0px);
  max-height: var(--tc-comment-thread-max-height, 340px);
  padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-4-5, var(--_tc-space-4-5));
  overflow-y: auto;
  scrollbar-width: thin;
  border-radius: inherit;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__scroll {
  gap: var(--tc-space-4, var(--_tc-space-4));
  padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3, var(--_tc-space-3));
  scrollbar-width: none;
  /* Soft edges at the top and towards the reply row, so nothing ends in a hard cut */
  -webkit-mask-image: linear-gradient(transparent, #000 12px, #000 calc(100% - 10px), transparent);
  mask-image: linear-gradient(transparent, #000 12px, #000 calc(100% - 10px), transparent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__scroll::-webkit-scrollbar { display: none; }
/* Each message builds up piece by piece: name row, text, status – the assistant's first reply a beat later */
.ui-ct__msg { --tc-comment-thread-d: 0ms; min-width: 0; }
.ui-ct__msg[data-delayed] { --tc-comment-thread-d: var(--tc-duration-reveal, var(--_tc-duration-reveal)); }
.ui-ct__msg > * { animation: ui-ct-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; animation-delay: var(--tc-comment-thread-d); }
.ui-ct__msg > :nth-child(2) { animation-delay: calc(var(--tc-comment-thread-d) + var(--tc-duration-instant, var(--_tc-duration-instant))); }
.ui-ct__msg > :nth-child(3) { animation-delay: calc(var(--tc-comment-thread-d) + var(--tc-duration-instant, var(--_tc-duration-instant)) * 2); }
.ui-ct__meta { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__meta { gap: var(--tc-space-2, var(--_tc-space-2)); }
.ui-ct__avatar { display: grid; place-items: center; flex: none; width: var(--tc-avatar-md, var(--_tc-avatar-md)); height: var(--tc-avatar-md, var(--_tc-avatar-md)); border-radius: 50%; object-fit: cover; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__avatar { width: var(--tc-avatar-sm, var(--_tc-avatar-sm)); height: var(--tc-avatar-sm, var(--_tc-avatar-sm)); }
img.ui-ct__avatar { box-shadow: 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-comment-thread-avatar-ring); }
.ui-ct__avatar svg { width: 100%; height: 100%; }
.ui-ct__avatar--initials { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); font-size: var(--tc-avatar-font-size, var(--_tc-avatar-font-size)); font-weight: var(--tc-avatar-font-weight, var(--_tc-avatar-font-weight)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__avatar--initials { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-ct__name { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__name { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-ct__time { flex: none; margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); white-space: nowrap; color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__time { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-ct__text { margin: var(--tc-space-2, var(--_tc-space-2)) 0 0; font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); overflow-wrap: break-word; color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Clean: text and status line up with the name, not the avatar */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__text { margin: var(--tc-space-1, var(--_tc-space-1)) 0 0 var(--tc-space-7, var(--_tc-space-7)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ct__command { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Clean "/edit": a small gray tag */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__command {
  display: inline-block;
  margin-right: 1px;
  padding: 0 var(--tc-space-1, var(--_tc-space-1));
  border-radius: var(--tc-radius-badge, var(--_tc-radius-badge));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Status: a ghost row – a green check, the line, and a chevron to fold the details open */
.ui-ct__status { margin-top: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status { margin: var(--tc-space-1, var(--_tc-space-1)) 0 0 22px; }
.ui-ct__status-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  max-width: 100%;
  height: 26px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* The button reset sets margin: 0 – shift the row so the check icon sits centered under the avatars */
:where([data-look="standard"], [data-look="standard"] *).ui-ct .ui-ct__status-btn { margin-left: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status-btn { gap: var(--tc-space-1-5, var(--_tc-space-1-5)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ct__status-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
.ui-ct__status-btn:disabled { cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-ct__check { display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: var(--tc-status-success-solid, var(--_tc-status-success-solid)); color: #fff; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__check { width: 16px; height: 16px; fill: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
.ui-ct__chevron { display: grid; color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ct__status-btn:hover .ui-ct__chevron { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ct__status-btn[aria-expanded="true"] .ui-ct__chevron { transform: rotate(180deg); }
.ui-ct__details { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-ct__details[data-open] { grid-template-rows: 1fr; }
.ui-ct__details ul { min-height: 0; overflow: hidden; margin: 0; padding: 0 0 0 var(--tc-space-7, var(--_tc-space-7)); list-style: none; }
.ui-ct__details li {
  position: relative;
  margin-top: var(--tc-space-1-5, var(--_tc-space-1-5));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  /* Closing: lines fade out quickly while the box folds */
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li { margin-top: var(--tc-space-1, var(--_tc-space-1)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Opening: lines come in one after another */
.ui-ct__details[data-open] li {
  opacity: 1;
  transform: none;
  transition-duration: var(--tc-duration-slow, var(--_tc-duration-slow)), var(--tc-duration-slower, var(--_tc-duration-slower));
  transition-delay: calc(var(--tc-comment-thread-step) * (1 + var(--i, 0)));
}
/* Tree lines instead of dots: each line gets its own corner – down on the axis of the check icon, then a rounded turn right */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__details li:first-child { margin-top: var(--tc-space-1, var(--_tc-space-1)); }
.ui-ct__details li::before {
  content: "";
  position: absolute;
  left: -16.625px;
  top: -3px;
  width: 10.5px;
  height: 13px;
  border-left: 1.25px solid var(--tc-border-strong, var(--_tc-border-strong));
  border-bottom: 1.25px solid var(--tc-border-strong, var(--_tc-border-strong));
  border-bottom-left-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
}
/* The first branch starts with a small gap under the check icon */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__details li:first-child::before { top: -5px; height: 15px; }
/* Clean: thin tree lines */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li:first-child { margin-top: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li::before { left: -14.5px; width: 9px; height: 13.5px; border-left-width: 1px; border-bottom-width: 1px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li:first-child::before { top: -6px; height: 16.5px; }
/* "Thinking…": a lighter band sweeps across the gray text – a few times, then it holds still (WCAG 2.2.2).
   The band is clipped to the letters (background-clip: text), which a transform can't move */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__thinking {
  display: inline-block;
  margin: var(--tc-space-2, var(--_tc-space-2)) 0 0;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  background: linear-gradient(90deg, var(--tc-text-muted, var(--_tc-text-muted)) 0%, var(--tc-text-muted, var(--_tc-text-muted)) 35%, rgba(255, 255, 255, 0.9) 50%, var(--tc-text-muted, var(--_tc-text-muted)) 65%, var(--tc-text-muted, var(--_tc-text-muted)) 100%);
  background-size: 300% 100%;
  background-position: 0% 0;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ui-ct-shine var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__thinking { position: relative; display: inline-block; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__thinking::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-comment-thread-shimmer) 50%, transparent 62%) 0% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-ct-shine var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 3;
  pointer-events: none;
}
/* ---------- Reply row ---------- */
.ui-ct__composer { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-4-5, var(--_tc-space-4-5)); border-radius: var(--tc-card-radius, var(--_tc-card-radius)); transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* Clean: lies right in the card as its last row */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__composer { flex: none; gap: var(--tc-space-2, var(--_tc-space-2)); margin: 0; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4)); border-radius: 0 0 var(--tc-card-radius, var(--_tc-card-radius)) var(--tc-card-radius, var(--_tc-card-radius)); }
/* Typing: the reply row shows the field focus ring (the field itself is borderless) */
.ui-ct__composer:has(.ui-ct__input:focus-visible) { box-shadow: inset 0 0 0 var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) var(--tc-focus-ring, var(--_tc-focus-ring)); }
.ui-ct__input {
  flex: 1;
  min-width: 0;
  height: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  caret-color: var(--tc-accent, var(--_tc-accent));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__input { height: 28px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-ct__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
/* Send: the primary action as an icon-only button, like Button – flat ink */
.ui-ct__send {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send { width: var(--tc-control-h-md, var(--_tc-control-h-md)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); }
.ui-ct__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
.ui-ct__send:not(:disabled):active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); transform: scale(0.94); }
.ui-ct__send:disabled { opacity: 0.3; cursor: default; }
/* Clean: a quiet gray tile until there is something to send */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send:disabled { opacity: 1; background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: none; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
@keyframes ui-ct-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-ct-shine { from { background-position: 100% 0; } to { background-position: 0% 0; } }
/* A reply the assistant couldn't answer, with Try again */
.ui-ct__failed .ui-ct__text { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-ct__retry { margin: 0; padding: 0; border: 0; background: none; font: inherit; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
/* The status region: read out, not shown */
.ui-ct__live { position: absolute; width: 1px; height: 1px; margin: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ui-ct { position: relative; }
/* Height changes glide instead of jumping */
.ui-ct__morph { overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__morph { flex: none; }
.ui-ct__morph[data-smooth] { transition: height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* Narrow containers: a little less padding */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ct__head { padding-left: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__scroll { padding-left: var(--tc-space-3, var(--_tc-space-3)); padding-right: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__composer { padding-left: var(--tc-space-3, var(--_tc-space-3)); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ct__icon-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status-btn { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__input { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li:first-child::before { top: -9px; height: 19.5px; }
}
@media (prefers-reduced-motion: reduce) {
.ui-ct__msg > *, .ui-ct__thinking, .ui-ct__thinking::after { animation: none; }
.ui-ct__details, .ui-ct__details li, .ui-ct__chevron, .ui-ct__morph[data-smooth] { transition: none; }
}
/* Text fields: the reply row carries the focus ring – also against global :focus-visible rules of the host page */
.ui-ct input:not([type="checkbox"]):not([type="radio"]):focus-visible,
.ui-ct textarea:focus-visible,
.ui-ct [contenteditable]:focus-visible { outline: none; }
`;
