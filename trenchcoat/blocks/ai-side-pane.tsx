"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  AIAnswer,
  Button,
  ChatComposer,
  ChatHistory,
  ClaimAnswer,
  LookProvider,
  MessageActions,
  PromptStarters,
  ReflectionGate,
  type AnswerClaim,
  type AnswerSource,
  type ChatComposerProps,
  type ChatConversation,
  type ChatModel,
  type ChatPageContext,
  type ClaimSource,
  type PromptStarter,
  type ReflectionGateSubmission,
  type ReflectionMode,
  type ReflectionPhase,
} from "trenchcoat/react";

/*
 * AI Side Pane – an assistant docked beside a page, holding a conversation about what's on it. Built on the Lit
 * components through trenchcoat/react (decision O): ai-answer and claim-answer for the answers, message-actions under
 * every finished answer, prompt-starters before the first message, chat-history in a panel, reflection-gate for answers the
 * app marks high-stakes, and the chat-composer with its full toolbar – model, settings, prompts, page context – and
 * the disclaimer under it. "Connect apps", "Select a project" and "Request approval" show only when their handler
 * (`onConnectApps`, `onSelectProject`, `onRequestApproval`) is passed.
 *
 * The app owns the conversation: it passes `messages`, appends to them in `onSend`, and streams an answer by growing
 * its `text` while `streaming` is set. The pane owns only its own chrome – open, collapsed to a rail, its width – each
 * of which a parent may control (`open` / `defaultOpen` / `onOpenChange`, and so on) to remember it.
 *
 * Layout: the host page is the children; the pane docks beside it. Drag its edge (or focus the edge and use the arrow
 * keys) to resize it, collapse it to a narrow rail, or press the shortcut (⌘. / Ctrl+. by default) to open it. Below
 * `breakpoint` (the block's own width) it becomes an overlay sheet with a scrim.
 *
 * Accessibility: docked, the pane is a complementary landmark named by its title; as a sheet it is a modal dialog that
 * keeps focus inside (Tab wraps, the page behind is inert) and closes on Escape or the scrim. The edge is a vertical
 * separator with its width as the value. Focus moves into the composer when the pane opens and goes back to where it
 * was (or the launcher) when it closes; collapsing focuses Expand, the history panel's search takes focus and gives it
 * back to History.
 */

export type SidePaneMessage = {
  id: string;
  role: "user" | "assistant";
  /** What the person wrote, or the answer – may grow while `streaming` is set */
  text: string;
  /** User messages: what was attached from the page, shown under the message, e.g. "Q3 report" */
  context?: string;
  /** Assistant: the sources the answer cites ([1] in the text is the first) – shown with ai-answer */
  sources?: AnswerSource[];
  /** Assistant: the answer as claims – when given, it's shown with claim-answer instead of ai-answer */
  claims?: AnswerClaim[];
  /** Assistant: the passages the claims rest on */
  claimSources?: ClaimSource[];
  /** Assistant (claims): the strongest case against the answer */
  counter?: string;
  /** Assistant: follow-up questions offered under the finished answer */
  followUps?: string[];
  /** Assistant: more text is still coming */
  streaming?: boolean;
  /** Assistant: a high-stakes answer – the reflection gate asks for this pause before it's relied on. "prior" hides the
   *  answer until the person has said what they expect */
  reflect?: ReflectionMode;
  /** Assistant: the answer failed – shown as an alert with Try again (onRegenerate) */
  error?: string;
};

type ComposerPassThrough = Pick<
  ChatComposerProps,
  | "placeholder"
  | "models"
  | "model"
  | "defaultModel"
  | "settings"
  | "defaultSettings"
  | "onSettingsChange"
  | "settingsModel"
  | "prompts"
  | "onPromptPick"
  | "onAttach"
  | "onSelectProject"
  | "onConnectApps"
  | "onRequestApproval"
  | "onDictate"
  | "demo"
>;

type OwnProps = ComposerPassThrough & {
  /** The host page – the pane docks beside it */
  children?: ReactNode;
  /** The pane's title, its landmark's and dialog's name */
  title?: string;
  /** The conversation, oldest first. The app owns it */
  messages?: SidePaneMessage[];
  /** Send a message: append it (and the answer) to `messages`. Return a promise to keep the text in the composer
   *  until it settles. `pageContext` is set only while the page is connected – send it with the message */
  onSend?: (text: string, details: { model: string; pageContext?: ChatPageContext }) => void | Promise<unknown>;
  /** Stop was pressed while an answer was streaming */
  onStop?: (messageId: string) => void;
  /** Regenerate, or Try again after an error */
  onRegenerate?: (messageId: string) => void | Promise<unknown>;
  /** A thumb up or down on an answer (null: cleared) */
  onFeedback?: (messageId: string, value: "up" | "down" | null, reason?: string) => void;
  /** A claim was sent to verification */
  onVerify?: (messageId: string, claim: AnswerClaim, sources: ClaimSource[]) => void;
  /** The reflection gate on a high-stakes answer was submitted (return false to keep it open) or, with
   *  `reflectionSkippable`, skipped (null) */
  onReflect?: (messageId: string, submission: ReflectionGateSubmission | null) => boolean | void;
  /** Lets people skip the reflection gate */
  reflectionSkippable?: boolean;
  /** Suggestions before the first message – derive them from what's on the page */
  starters?: PromptStarter[];
  /** The heading over the suggestions */
  startersTitle?: string;
  /** New chat was pressed – start an empty conversation */
  onNewChat?: () => void;
  /** Past conversations for the History panel – leave undefined to hide History */
  conversations?: ChatConversation[];
  /** Called with the whole list after a rename, pin, move or delete in History */
  onConversationsChange?: (conversations: ChatConversation[]) => void;
  /** The open conversation's id */
  conversation?: string | null;
  /** A conversation was picked in History – load its messages */
  onConversationChange?: (id: string | null) => void;
  /** Called with the model picked in the toolbar */
  onModelChange?: (model: ChatModel) => void;
  /** What's on the page (controlled) – shown as the composer's page-context chip. Leave undefined to let the pane keep
   *  it, starting at `defaultPageContext` – or leave both unset for no chip */
  pageContext?: ChatPageContext;
  defaultPageContext?: ChatPageContext;
  /** The chip was toggled, or an attached item removed */
  onPageContextChange?: (pageContext: ChatPageContext, change: "connect" | "disconnect" | "items") => void;
  /** The line under the composer; "" hides it */
  disclaimer?: string;
  /** Open (controlled) – leave undefined to start at `defaultOpen` */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Collapsed to the rail (controlled) – leave undefined to start at `defaultCollapsed` */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** The docked width in px (controlled) – pass it with `onWidthChange` to remember it */
  width?: number;
  defaultWidth?: number;
  /** Reported once a drag ends, and on every arrow-key step */
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  /** Opens the pane (or moves focus into it; pressed inside, closes it). "mod" is ⌘ on a Mac and Ctrl elsewhere;
   *  e.g. "mod+.", "mod+shift+k", "alt+a". null turns it off */
  shortcut?: string | null;
  /** Below this width of the block, in px, the pane is an overlay sheet instead of docked */
  breakpoint?: number;
  /** Which side it docks on */
  side?: "left" | "right";
  /** A floating "Ask AI" button while the pane is closed – false if your page has its own */
  launcher?: boolean;
  /** The look of the pane and every component in it; unset follows the nearest look provider */
  look?: "standard" | "clean";
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type AiSidePaneProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const NO_MESSAGES: SidePaneMessage[] = [];
const noop = () => {};
const DISCLAIMER = "AI can make mistakes. Check important info.";
const RAIL = 52;
const PAGE_MIN = 280;

/**
 * State a parent may control: controlled when `value` is defined (changes are only reported through `onChange`),
 * otherwise kept here from `defaultValue` (and still reported). Whether `onChange` is passed never decides which.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

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

/* ---------- Shortcut ---------- */

type Shortcut = { key: string; mod: boolean; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean };

function parseShortcut(s: string | null | undefined): Shortcut | null {
  if (!s) return null;
  const parts = s.toLowerCase().split("+");
  // "mod++" ends in an empty part: the key is "+"
  const key = parts[parts.length - 1] === "" ? "+" : parts[parts.length - 1];
  const mods = new Set(parts.slice(0, parts[parts.length - 1] === "" ? -2 : -1));
  return { key, mod: mods.has("mod"), meta: mods.has("meta") || mods.has("cmd"), ctrl: mods.has("ctrl") || mods.has("control"), alt: mods.has("alt") || mods.has("option"), shift: mods.has("shift") };
}

const KEY_CODES: Record<string, string> = { ".": "Period", ",": "Comma", "/": "Slash", ";": "Semicolon", "'": "Quote", "[": "BracketLeft", "]": "BracketRight", "\\": "Backslash", "`": "Backquote", "-": "Minus", "=": "Equal" };

function matches(e: KeyboardEvent, s: Shortcut) {
  if (s.mod ? !(e.metaKey || e.ctrlKey) : e.metaKey !== s.meta || e.ctrlKey !== s.ctrl) return false;
  if (e.altKey !== s.alt || e.shiftKey !== s.shift) return false;
  const code = KEY_CODES[s.key] ?? (/^[a-z]$/.test(s.key) ? `Key${s.key.toUpperCase()}` : /^\d$/.test(s.key) ? `Digit${s.key}` : "");
  // The code covers layouts and Alt / Shift changing the character
  return e.key.toLowerCase() === s.key || (!!code && e.code === code);
}

/** How the shortcut reads, and its aria-keyshortcuts value */
function describeShortcut(s: Shortcut | null, mac: boolean) {
  if (!s) return { label: "", aria: undefined };
  const key = s.key.length === 1 ? s.key.toUpperCase() : s.key[0].toUpperCase() + s.key.slice(1);
  const meta = s.meta || (s.mod && mac);
  const ctrl = s.ctrl || (s.mod && !mac);
  const aria = [ctrl && "Control", s.alt && "Alt", s.shift && "Shift", meta && "Meta", key].filter(Boolean).join("+");
  const label = mac
    ? [ctrl && "⌃", s.alt && "⌥", s.shift && "⇧", meta && "⌘", key].filter(Boolean).join("")
    : [ctrl && "Ctrl", s.alt && "Alt", s.shift && "Shift", meta && "Win", key].filter(Boolean).join("+");
  return { label, aria };
}

/* ---------- Focus ---------- */

/** Focuses what `find` returns once it's there – the Lit components render a frame after React commits */
function focusSoon(find: () => HTMLElement | null | undefined, tries = 8) {
  const el = find();
  // A hidden element (the pane before React shows it) doesn't take focus: try again next frame
  el?.focus({ preventScroll: true });
  if (el && el.ownerDocument.activeElement === el) return;
  if (tries > 0 && typeof requestAnimationFrame === "function") requestAnimationFrame(() => focusSoon(find, tries - 1));
}

/** A tc-button's inner button, or the element itself */
const focusable = (el: Element | null | undefined) => (el ? ((el.matches("tc-button") ? el.querySelector("button") : el) as HTMLElement | null) : null);

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function tabbables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el.tabIndex >= 0 && !el.closest("[inert], [hidden]") && (el.getClientRects().length > 0 || typeof window.matchMedia !== "function"),
  );
}

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Icons (Lucide, ISC) ---------- */

const Glyph = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const SparkleIcon = () => (
  <Glyph>
    <path d="M9.94 14.06 4 12l5.94-2.06L12 4l2.06 5.94L20 12l-5.94 2.06L12 20z" />
  </Glyph>
);
const NewChatIcon = () => (
  <Glyph>
    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4z" />
  </Glyph>
);
const HistoryIcon = () => (
  <Glyph>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </Glyph>
);
const CloseIcon = () => (
  <Glyph>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Glyph>
);
const PanelIcon = ({ side, open }: { side: "left" | "right"; open: boolean }) => (
  <Glyph>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d={side === "right" ? "M15 3v18" : "M9 3v18"} />
    {/* The chevron points the way the pane will move */}
    <path d={(side === "right") === open ? "m8 9 3 3-3 3" : side === "right" ? "m11 9-3 3 3 3" : "m16 15-3-3 3-3"} />
  </Glyph>
);
const BackIcon = () => (
  <Glyph>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Glyph>
);
const PageIcon = () => (
  <Glyph>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </Glyph>
);

/* ---------- Thread ---------- */

type Handlers = {
  send: (text: string) => void;
  stop: (id: string) => void;
  regenerate: (id: string) => void | Promise<unknown>;
  feedback: (id: string, value: "up" | "down" | null, reason?: string) => void;
  verify: (id: string, claim: AnswerClaim, sources: ClaimSource[]) => void;
  phase: (id: string, phase: ReflectionPhase) => void;
  reflect: (id: string, submission: ReflectionGateSubmission | null) => boolean | void;
};

/** The plain text of a claim answer, for Copy and Read aloud */
const claimText = (claims: AnswerClaim[]) => claims.map((c) => c.text).join("");

const AssistantMessage = memo(function AssistantMessage({
  m,
  animate,
  phase,
  last,
  skippable,
  on,
}: {
  m: SidePaneMessage;
  animate: boolean;
  phase: ReflectionPhase | undefined;
  last: boolean;
  skippable: boolean;
  on: Handlers;
}) {
  const reflecting = !!m.reflect && !m.streaming && !m.error;
  const settled = phase === "done" || phase === "skipped";
  // "prior" asks for an expectation before the answer is shown
  const hidden = reflecting && m.reflect === "prior" && !settled;
  const gate = reflecting ? (
    <div className="ui-sp__gate">
      <ReflectionGate
        mode={m.reflect}
        answer={m.text || (m.claims ? claimText(m.claims) : "")}
        claims={m.reflect === "checkpoint" && m.claims ? m.claims.filter((c) => c.source).map((c) => ({ id: c.id, text: c.text.trim() })) : []}
        phase={phase ?? "open"}
        onPhaseChange={(p) => on.phase(m.id, p)}
        onSubmit={(s) => on.reflect(m.id, s)}
        onSkip={skippable ? () => on.reflect(m.id, null) : undefined}
      />
    </div>
  ) : null;

  // One row of actions under every finished answer: ai-answer's own row is turned off for it
  const actions = (text: string) =>
    m.streaming ? null : (
      <MessageActions
        text={text}
        actions={["copy", "regenerate", "feedback"]}
        onRegenerate={() => on.regenerate(m.id)}
        onFeedback={(kind, reason) => on.feedback(m.id, kind, reason)}
      />
    );
  let answer: ReactNode = null;
  if (!hidden && m.claims) {
    answer = (
      <>
        <ClaimAnswer claims={m.claims} sources={m.claimSources ?? []} counter={m.counter ?? ""} onVerify={(claim, sources) => on.verify(m.id, claim, sources)} />
        {actions(claimText(m.claims))}
        {last && !m.streaming && m.followUps?.length ? (
          <PromptStarters variant="follow-ups" title="Follow up" hints={false} items={m.followUps.map((q, i) => ({ id: `${m.id}-f${i}`, text: q }))} onSend={(text) => on.send(text)} />
        ) : null}
      </>
    );
  } else if (!hidden && (m.text || m.streaming)) {
    answer = (
      <>
        <AIAnswer
          answer={m.text}
          sources={m.sources ?? []}
          streaming={!!m.streaming}
          animate={animate}
          hideActions
          followUps={last ? (m.followUps ?? []) : []}
          onFollowUp={(q) => on.send(q)}
          onStop={() => on.stop(m.id)}
        />
        {actions(m.text)}
      </>
    );
  }

  return (
    <article className="ui-sp__msg ui-sp__msg--ai" aria-label="Assistant" data-ui-message="">
      {m.reflect === "prior" && gate}
      {answer}
      {m.reflect !== "prior" && gate}
      {m.error && (
        <div className="ui-sp__error" role="alert">
          <span>{m.error}</span>
          <Button variant="secondary" size="sm" data-action="retry" label="Try again" onClick={() => void on.regenerate(m.id)} />
        </div>
      )}
    </article>
  );
});

const UserMessage = memo(function UserMessage({ m }: { m: SidePaneMessage }) {
  return (
    <article className="ui-sp__msg ui-sp__msg--user" aria-label="You">
      <p className="ui-sp__bubble">{m.text}</p>
      {m.context && (
        <span className="ui-sp__attached">
          <PageIcon />
          <span className="ui-sp__sr">Sent with </span>
          {m.context}
        </span>
      )}
    </article>
  );
});

/* ---------- The pane ---------- */

export function AiSidePane({
  children,
  title = "Assistant",
  messages = NO_MESSAGES,
  onSend,
  onStop,
  onRegenerate,
  onFeedback,
  onVerify,
  onReflect,
  reflectionSkippable = false,
  starters,
  startersTitle,
  onNewChat,
  conversations,
  onConversationsChange,
  conversation,
  onConversationChange,
  onModelChange,
  pageContext: pageContextProp,
  defaultPageContext,
  onPageContextChange,
  disclaimer = DISCLAIMER,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  width: widthProp,
  defaultWidth = 400,
  onWidthChange,
  minWidth = 320,
  maxWidth = 640,
  shortcut = "mod+.",
  breakpoint = 720,
  side = "right",
  launcher = true,
  look,
  placeholder = "Ask about this page…",
  models,
  model,
  defaultModel,
  settings,
  defaultSettings,
  onSettingsChange,
  settingsModel,
  prompts,
  onPromptPick,
  onAttach,
  onSelectProject,
  onConnectApps,
  onRequestApproval,
  onDictate,
  demo,
  className,
  ref,
  style,
  ...rest
}: AiSidePaneProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange, "open");
  const [collapsed, setCollapsed] = useControllable(collapsedProp, defaultCollapsed, onCollapsedChange, "collapsed");
  const clamp = useCallback((w: number) => Math.round(Math.min(maxWidth, Math.max(minWidth, w))), [minWidth, maxWidth]);
  const [widthRaw, setWidth] = useControllable(widthProp, defaultWidth, onWidthChange, "width");
  const width = clamp(widthRaw);
  const [page, setPage] = useControllable<ChatPageContext | undefined>(pageContextProp, defaultPageContext, onPageContextChange && noop, "pageContext");
  const [modelNow, setModelNow] = useControllable(model, defaultModel ?? "", onModelChange && noop, "model");
  const [settingsNow, setSettingsNow] = useControllable(settings, defaultSettings, onSettingsChange && noop, "settings");
  // The message in the composer – kept here so a starter can fill it
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [lookNow, setLookNow] = useState<"standard" | "clean">(look ?? "standard");
  const [mac, setMac] = useState(false);
  const [phases, setPhases] = useState<Record<string, ReflectionPhase>>({});

  // Answers already there when a conversation is shown appear at once; ones that arrive later stream in
  const firstId = messages[0]?.id ?? "";
  const [shown, setShown] = useState(() => ({ first: firstId, ids: new Set(messages.map((m) => m.id)) }));
  if (shown.first !== firstId) setShown({ first: firstId, ids: new Set(messages.map((m) => m.id)) });

  const uid = useId();
  const titleId = `${uid}-title`;
  const paneId = `${uid}-pane`;
  const historyId = `${uid}-history`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rootRefs = useRootRef(rootRef, ref);
  const paneRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const historyBtn = useRef<HTMLElement | null>(null);
  const expandBtn = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const sc = useMemo(() => parseShortcut(shortcut), [shortcut]);
  const keys = describeShortcut(sc, mac);
  const docked = !overlay;
  const rail = docked && collapsed;
  const showHistory = historyOpen && !rail && !!conversations;

  // Platform and look: read after mount, so server and client render alike
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setMac(/mac|iphone|ipad/i.test(nav.userAgentData?.platform ?? nav.userAgent));
  }, []);
  useEffect(() => {
    if (look) return setLookNow(look);
    // Follow the nearest look provider, including when it changes
    const provider = rootRef.current?.parentElement?.closest("tc-look-provider");
    const read = () => setLookNow(provider?.getAttribute("look") === "clean" ? "clean" : "standard");
    read();
    if (!provider || typeof MutationObserver !== "function") return;
    const mo = new MutationObserver(read);
    mo.observe(provider, { attributes: true, attributeFilter: ["look"] });
    return () => mo.disconnect();
  }, [look]);

  // Docked or overlay, from the block's own width
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = (w: number) => {
      // No layout (tests, hidden): stay docked
      if (w > 0) setOverlay(w < breakpoint);
    };
    measure(root.getBoundingClientRect().width);
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    ro.observe(root);
    return () => ro.disconnect();
  }, [breakpoint]);

  /* ----- Focus on open, close, collapse, history ----- */
  const focusComposer = useCallback(() => focusSoon(() => paneRef.current?.querySelector<HTMLElement>("tc-chat-composer textarea")), []);
  const openPane = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && !paneRef.current?.contains(active) && active !== document.body) returnTo.current = active;
    setOpen(true);
    setCollapsed(false);
    focusComposer();
  }, [setOpen, setCollapsed, focusComposer]);
  const closePane = useCallback(() => {
    const inside = paneRef.current?.contains(document.activeElement) || document.activeElement === document.body;
    setOpen(false);
    setHistoryOpen(false);
    if (!inside) return;
    const back = returnTo.current;
    returnTo.current = null;
    // Back where focus was before the pane opened, else the launcher, else the page
    focusSoon(() => (back?.isConnected && !back.closest("[inert]") && back.getClientRects().length ? back : launcherRef.current ?? rootRef.current?.querySelector<HTMLElement>(".ui-sp__page")));
  }, [setOpen]);
  const collapse = useCallback(
    (next: boolean) => {
      setCollapsed(next);
      setHistoryOpen(false);
      if (next) focusSoon(() => focusable(expandBtn.current));
      else focusComposer();
    },
    [setCollapsed, focusComposer],
  );
  const toggleHistory = useCallback((next: boolean) => {
    setHistoryOpen(next);
    if (next) focusSoon(() => document.getElementById(historyId)?.querySelector<HTMLElement>("input"));
    else focusSoon(() => focusable(historyBtn.current));
  }, [historyId]);
  const newChat = useCallback(() => {
    setHistoryOpen(false);
    setCollapsed(false);
    onNewChat?.();
    focusComposer();
  }, [onNewChat, setCollapsed, focusComposer]);

  // Becoming a sheet while open makes it modal: focus goes in
  const wasOverlay = useRef(overlay);
  useEffect(() => {
    if (overlay && !wasOverlay.current && open && !paneRef.current?.contains(document.activeElement)) focusComposer();
    wasOverlay.current = overlay;
  }, [overlay, open, focusComposer]);

  /* ----- Shortcut, Escape ----- */
  const live = useRef({ open, rail, overlay, showHistory, openPane, closePane, toggleHistory, focusComposer });
  live.current = { open, rail, overlay, showHistory, openPane, closePane, toggleHistory, focusComposer };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = live.current;
      const inside = e.target instanceof Node && !!paneRef.current?.contains(e.target);
      if (sc && matches(e, sc)) {
        e.preventDefault();
        if (!s.open || s.rail) s.openPane();
        else if (inside) s.closePane();
        else {
          returnTo.current = document.activeElement as HTMLElement | null;
          s.focusComposer();
        }
        return;
      }
      // Window, bubble phase: menus and popovers inside the pane handle their own Escape first
      if (e.key !== "Escape" || e.defaultPrevented || !s.open) return;
      if (inside && s.showHistory) {
        e.preventDefault();
        s.toggleHistory(false);
      } else if (s.overlay && !s.rail) {
        e.preventDefault();
        s.closePane();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sc]);

  // The sheet keeps Tab inside
  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !overlay || !open || e.defaultPrevented) return;
    const items = tabbables(e.currentTarget);
    if (!items.length) return;
    const first = items[0];
    const lastItem = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !e.currentTarget.contains(active))) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && active === lastItem) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ----- Resize ----- */
  const drag = useRef<{ x: number; w: number; next: number } | null>(null);
  const paint = (w: number) => {
    rootRef.current?.style.setProperty("--sp-w", `${w}px`);
    handleRef.current?.setAttribute("aria-valuenow", String(w));
    handleRef.current?.setAttribute("aria-valuetext", `${w} pixels wide`);
  };
  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const w = paneRef.current?.getBoundingClientRect().width || width;
    drag.current = { x: e.clientX, w, next: Math.round(w) };
    rootRef.current?.setAttribute("data-resizing", "");
  };
  // While dragging only the CSS variable moves – no React render per pointer move; the width is reported at the end
  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    d.next = clamp(d.w + (side === "right" ? -dx : dx));
    paint(d.next);
  };
  const onDragEnd = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    rootRef.current?.removeAttribute("data-resizing");
    setWidth(d.next);
  };
  const onHandleKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 64 : 16;
    // The arrows move the edge: toward the page widens the pane
    const grow = side === "right" ? "ArrowLeft" : "ArrowRight";
    const shrink = side === "right" ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === grow) next = width + step;
    else if (e.key === shrink) next = width - step;
    else if (e.key === "Home") next = minWidth;
    else if (e.key === "End") next = maxWidth;
    else if (e.key === "Enter") next = clamp(defaultWidth);
    if (next === null) return;
    e.preventDefault();
    next = clamp(next);
    paint(next);
    setWidth(next);
  };

  /* ----- Thread ----- */
  // Follow the conversation while it grows, unless the reader scrolled up
  const stick = useRef(true);
  useEffect(() => {
    const thread = threadRef.current;
    const inner = thread?.firstElementChild;
    if (!thread || !inner || typeof ResizeObserver !== "function") return;
    const onScroll = () => (stick.current = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 48);
    const ro = new ResizeObserver(() => {
      if (stick.current) thread.scrollTop = thread.scrollHeight;
    });
    ro.observe(inner);
    thread.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      thread.removeEventListener("scroll", onScroll);
    };
  }, []);
  const lastRole = messages[messages.length - 1]?.role;
  useEffect(() => {
    // A message just sent: back to the bottom
    if (lastRole === "user") {
      stick.current = true;
      const thread = threadRef.current;
      if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }, [messages.length, lastRole]);

  const send = useCallback(
    (text: string, model = "") => {
      const message = text.trim();
      if (!message) return;
      stick.current = true;
      return onSend?.(message, { model, pageContext: page?.connected ? page : undefined });
    },
    [onSend, page],
  );

  // Stable handlers for the memoised messages, reading the latest props
  const latest = useRef({ send, onStop, onRegenerate, onFeedback, onVerify, onReflect });
  latest.current = { send, onStop, onRegenerate, onFeedback, onVerify, onReflect };
  const on = useMemo<Handlers>(
    () => ({
      send: (text) => void latest.current.send(text),
      stop: (id) => latest.current.onStop?.(id),
      regenerate: (id) => latest.current.onRegenerate?.(id),
      feedback: (id, value, reason) => latest.current.onFeedback?.(id, value, reason),
      verify: (id, claim, sources) => latest.current.onVerify?.(id, claim, sources),
      phase: (id, phase) => setPhases((p) => (p[id] === phase ? p : { ...p, [id]: phase })),
      reflect: (id, submission) => latest.current.onReflect?.(id, submission),
    }),
    [],
  );

  const current = conversations?.find((c) => c.id === conversation);
  const connected = !!page?.connected;
  const empty = messages.length === 0;

  const header = (
    <div className="tc-head ui-sp__head">
      <div className="tc-head__main">
        <span className="tc-head__icon" aria-hidden="true">
          <SparkleIcon />
        </span>
        <div className="tc-head__text">
          <h2 className="tc-head__title" id={titleId}>
            {title}
          </h2>
          {current && !empty && <p className="tc-head__sub ui-sp__ellipsis">{current.title}</p>}
        </div>
      </div>
      <div className="ui-sp__tools">
        <Button variant="ghost" size="sm" data-action="new-chat" hideLabel label="New chat" icon={<NewChatIcon />} onClick={newChat} />
        {conversations && (
          <Button
            ref={(el: HTMLElement | null) => {
              historyBtn.current = el;
            }}
            variant="ghost"
            size="sm"
            hideLabel
            data-action="history"
            label="History"
            icon={<HistoryIcon />}
            aria-expanded={showHistory ? "true" : "false"}
            aria-controls={historyId}
            onClick={() => toggleHistory(!showHistory)}
          />
        )}
        {docked && <Button variant="ghost" size="sm" data-action="collapse" hideLabel label="Collapse to rail" icon={<PanelIcon side={side} open />} onClick={() => collapse(true)} />}
        <Button variant="ghost" size="sm" data-action="close" hideLabel label={`Close ${title}`} icon={<CloseIcon />} aria-keyshortcuts={keys.aria} onClick={closePane} />
      </div>
    </div>
  );

  const body = (
    <div className="ui-sp__body" hidden={rail}>
      <div className="ui-sp__thread" ref={threadRef} hidden={showHistory}>
        <div className="ui-sp__inner">
          {empty ? (
            <div className="ui-sp__empty">
              <p className="ui-sp__hello">{connected ? `Ask about ${page!.title}` : "Ask anything"}</p>
              <p className="ui-sp__hint">{connected ? "The assistant can see this page." : page ? "Page context is off – answers won't use this page." : "Answers appear here."}</p>
              {starters?.length ? (
                <PromptStarters
                  title={startersTitle ?? (connected ? `From ${page!.title}` : "Suggestions")}
                  items={starters}
                  onSend={(text) => void send(text)}
                  onFill={(text) => {
                    setDraft(text);
                    focusComposer();
                  }}
                />
              ) : null}
            </div>
          ) : (
            messages.map((m, i) =>
              m.role === "user" ? (
                <UserMessage key={m.id} m={m} />
              ) : (
                <AssistantMessage key={m.id} m={m} animate={!shown.ids.has(m.id)} phase={phases[m.id]} last={i === messages.length - 1} skippable={reflectionSkippable} on={on} />
              ),
            )
          )}
        </div>
      </div>
      {conversations && (
        <div className="ui-sp__history" id={historyId} role="region" aria-label="Chat history" hidden={!showHistory}>
          <Button variant="ghost" size="sm" data-action="back" label="Back to chat" icon={<BackIcon />} onClick={() => toggleHistory(false)} />
          <ChatHistory
            conversations={conversations}
            onConversationsChange={onConversationsChange ?? (() => {})}
            value={conversation ?? null}
            onChange={(id) => {
              onConversationChange?.(id);
              setHistoryOpen(false);
              focusComposer();
            }}
            onNewChat={newChat}
            hints={false}
            maxHeight={360}
          />
        </div>
      )}
      <div className="ui-sp__composer" hidden={showHistory}>
        <ChatComposer
          placeholder={placeholder}
          value={draft}
          onValueChange={setDraft}
          models={models}
          model={modelNow}
          onModelChange={(m) => {
            setModelNow(m.id);
            onModelChange?.(m);
          }}
          modelSwitcher="toolbar"
          settings={settingsNow}
          onSettingsChange={(next, changed) => {
            setSettingsNow(next);
            onSettingsChange?.(next, changed);
          }}
          settingsModel={settingsModel}
          prompts={prompts}
          onPromptPick={onPromptPick}
          pageContext={page}
          onPageContextChange={(next, change) => {
            setPage(next);
            onPageContextChange?.(next, change);
          }}
          disclaimer={disclaimer}
          onSend={(text, details) => send(text, details.model)}
          onAttach={onAttach}
          onSelectProject={onSelectProject}
          onConnectApps={onConnectApps}
          onRequestApproval={onRequestApproval}
          // Apps, projects and approval are offered only when the app handles them
          hideConnectApps={!onConnectApps}
          hideProject={!onSelectProject}
          hideApproval={!onRequestApproval}
          onDictate={onDictate}
          demo={demo}
        />
      </div>
    </div>
  );

  const railBar = (
    <div className="ui-sp__rail" hidden={!rail}>
      <Button
        ref={(el: HTMLElement | null) => {
          expandBtn.current = el;
        }}
        variant="ghost"
        size="sm"
        hideLabel
        data-action="expand"
        label={`Expand ${title}`}
        icon={<PanelIcon side={side} open={false} />}
        aria-keyshortcuts={keys.aria}
        onClick={() => collapse(false)}
      />
      <Button variant="ghost" size="sm" data-action="rail-new-chat" hideLabel label="New chat" icon={<NewChatIcon />} onClick={newChat} />
      <span className="ui-sp__rail-mark" aria-hidden="true">
        <SparkleIcon />
      </span>
    </div>
  );

  const sheet = overlay && open;
  const pane = (
    <div
      ref={paneRef}
      id={paneId}
      className="ui-sp__pane"
      role={sheet ? "dialog" : "complementary"}
      aria-modal={sheet ? "true" : undefined}
      aria-labelledby={titleId}
      hidden={!open}
      data-rail={rail || undefined}
      onKeyDown={trapTab}
    >
      {railBar}
      <div className="ui-sp__frame" hidden={rail}>
        {header}
        {body}
      </div>
    </div>
  );

  const content = (
    <div
      {...rest}
      ref={rootRefs}
      className={["ui-sp", className].filter(Boolean).join(" ")}
      data-look={lookNow}
      data-side={side}
      data-overlay={overlay || undefined}
      data-open={open || undefined}
      style={{ ...style, ["--sp-w" as string]: `${rail ? RAIL : width}px`, ["--sp-page-min" as string]: `${PAGE_MIN}px` }}
    >
      <div className="ui-sp__page" inert={sheet || undefined}>
        {children}
      </div>
      {docked && open && !rail && (
        <div
          ref={handleRef}
          className="ui-sp__handle"
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={`Resize ${title}`}
          aria-controls={paneId}
          aria-valuenow={width}
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuetext={`${width} pixels wide`}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onLostPointerCapture={onDragEnd}
          onKeyDown={onHandleKey}
          onDoubleClick={() => {
            const w = clamp(defaultWidth);
            paint(w);
            setWidth(w);
          }}
        />
      )}
      {sheet && <div className="ui-sp__scrim" aria-hidden="true" onClick={closePane} />}
      {pane}
      {launcher && !open && (
        <button ref={launcherRef} type="button" className="ui-sp__launcher" aria-keyshortcuts={keys.aria} aria-controls={paneId} aria-expanded="false" onClick={openPane}>
          <SparkleIcon />
          <span>Ask AI</span>
          {keys.label && <kbd aria-hidden="true">{keys.label}</kbd>}
        </button>
      )}
    </div>
  );

  return (
    <>
      <style href="ui-ai-side-pane" precedence="default">
        {css}
      </style>
      {look ? <LookProvider look={look}>{content}</LookProvider> : content}
    </>
  );
}

const css = /* css */ `
/* Theme: every colour is a token, so dark follows color-scheme – a .dark class, data-theme / data-tc-theme="dark"
   or the OS setting (data-tc-theme="system") */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }

.ui-sp {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  container-type: inline-size;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-sp[data-side="left"] { flex-direction: row-reverse; }
.ui-sp *, .ui-sp *::before, .ui-sp *::after { box-sizing: border-box; }
.ui-sp [hidden] { display: none !important; }
.ui-sp__sr { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-sp__ellipsis { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* The host page */
.ui-sp__page { flex: 1 1 auto; min-width: 0; overflow: auto; }

/* The pane, docked */
.ui-sp__pane {
  flex: none;
  display: flex;
  flex-direction: column;
  width: min(var(--sp-w), calc(100% - var(--sp-page-min)));
  min-width: 0;
  height: 100%;
  overflow: hidden;
  transition: width var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-sp__pane[data-rail] { width: var(--sp-w); }
.ui-sp[data-resizing] .ui-sp__pane { transition: none; }
.ui-sp[data-resizing] { cursor: col-resize; user-select: none; }
.ui-sp__frame { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }

/* Standard: the header on the gray tray, the conversation and composer on the white card */
.ui-sp[data-look="standard"] .ui-sp__pane { background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); padding: var(--tc-tray-inset, 4px); }
.ui-sp[data-look="standard"] .ui-sp__body {
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  border-radius: var(--tc-card-radius, 16px);
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-sp[data-look="standard"][data-side="right"]:not([data-overlay]) .ui-sp__pane { border-left: var(--tc-hairline, 1px) solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-sp[data-look="standard"][data-side="left"]:not([data-overlay]) .ui-sp__pane { border-right: var(--tc-hairline, 1px) solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
/* Clean: one white surface – the header is its first row, a hairline from the page */
.ui-sp[data-look="clean"] .ui-sp__pane { background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); }
.ui-sp[data-look="clean"][data-side="right"]:not([data-overlay]) .ui-sp__pane { box-shadow: calc(var(--tc-hairline, 1px) * -1) 0 0 var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-sp[data-look="clean"][data-side="left"]:not([data-overlay]) .ui-sp__pane { box-shadow: var(--tc-hairline, 1px) 0 0 var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-sp[data-look="clean"] .ui-sp__head { border-bottom: var(--tc-hairline, 1px) solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }

/* The tools stay on the title's row, however narrow: the title gives way */
.ui-sp .ui-sp__head { flex: none; flex-wrap: nowrap; }
.ui-sp .ui-sp__head .tc-head__main { flex: 1 1 0; min-width: 0; }
.ui-sp__tools { flex: none; display: flex; align-items: center; gap: var(--tc-space-0-5, 2px); margin-left: auto; }

.ui-sp__body { position: relative; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }

/* The conversation */
.ui-sp__thread { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.ui-sp__inner { display: flex; flex-direction: column; gap: var(--tc-space-4, 16px); padding: var(--tc-space-4, 16px) var(--tc-space-3, 12px); }
.ui-sp__msg { display: flex; flex-direction: column; gap: var(--tc-space-2, 8px); min-width: 0; }
.ui-sp__msg--user { align-items: flex-end; }
.ui-sp__bubble {
  max-width: 88%;
  margin: 0;
  padding: var(--tc-space-2, 8px) var(--tc-space-3, 12px);
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.ui-sp__attached { display: inline-flex; align-items: center; gap: var(--tc-space-1, 4px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-xs, 11px); }
.ui-sp__attached svg { width: 12px; height: 12px; }
.ui-sp__gate { min-width: 0; }
.ui-sp__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2, 8px);
  padding: var(--tc-space-2, 8px) var(--tc-space-3, 12px);
  border-radius: var(--tc-radius-lg, 10px);
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-status-danger-border, color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-size: var(--tc-font-size-md, 13px);
}

/* Before the first message */
.ui-sp__empty { display: flex; flex-direction: column; gap: var(--tc-space-1, 4px); padding-top: var(--tc-space-2, 8px); }
.ui-sp__hello { margin: 0; color: var(--tc-title-color, light-dark(#171717, #ededed)); font-size: var(--tc-title-font-size, 14px); font-weight: var(--tc-title-font-weight, 600); line-height: var(--tc-title-line-height, 20px); letter-spacing: var(--tc-title-tracking, -0.006em); }
.ui-sp__hint { margin: 0 0 var(--tc-space-3, 12px); color: var(--tc-subtitle-color, light-dark(#404040, #c8c8cc)); font-size: var(--tc-subtitle-font-size, 12px); line-height: var(--tc-subtitle-line-height, 16px); }

/* History, in place of the conversation */
.ui-sp__history { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-2, 8px); flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: var(--tc-space-2, 8px) var(--tc-space-2, 8px) var(--tc-space-3, 12px); }
.ui-sp__history > tc-chat-history { align-self: stretch; }

.ui-sp__composer { flex: none; padding: var(--tc-space-2, 8px) var(--tc-space-2, 8px) var(--tc-space-2-5, 10px); }
.ui-sp[data-look="clean"] .ui-sp__composer { padding: var(--tc-space-2, 8px) var(--tc-space-3, 12px) var(--tc-space-3, 12px); }

/* The rail */
.ui-sp__rail { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-1, 4px); flex: 1 1 auto; padding-top: var(--tc-space-2, 8px); }
.ui-sp__rail-mark { display: grid; place-items: center; width: var(--tc-head-icon-size, 28px); height: var(--tc-head-icon-size, 28px); margin-top: auto; margin-bottom: var(--tc-space-2, 8px); border-radius: var(--tc-head-icon-radius, 8px); background: var(--tc-head-icon-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-head-icon-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); color: var(--tc-head-icon-fg, light-dark(#404040, #c8c8cc)); }
.ui-sp__rail-mark svg { width: var(--tc-head-glyph, 16px); height: var(--tc-head-glyph, 16px); }
.ui-sp .tc-head__icon svg { width: var(--tc-head-glyph, 16px); height: var(--tc-head-glyph, 16px); stroke-width: var(--tc-head-glyph-stroke, 1.75); }

/* The edge: a wide grab area with a line that shows on hover, focus and drag */
.ui-sp__handle {
  flex: none;
  position: relative;
  z-index: 2;
  width: var(--tc-space-2, 8px);
  margin-inline: calc(var(--tc-space-1, 4px) * -1);
  cursor: col-resize;
  touch-action: none;
  outline: none;
}
.ui-sp__handle::after {
  content: "";
  position: absolute;
  inset-block: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: transparent;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-sp__handle:hover::after, .ui-sp[data-resizing] .ui-sp__handle::after { background: var(--tc-border-strong, light-dark(#dedede, #3a3a40)); }
.ui-sp__handle:focus-visible::after { width: 3px; background: var(--tc-accent, #2f68ff); }

/* Below the breakpoint: a sheet over the page */
.ui-sp[data-overlay] .ui-sp__pane {
  position: absolute;
  inset-block: 0;
  right: 0;
  z-index: var(--tc-z-drawer, 50);
  width: min(var(--sp-w), calc(100% - var(--tc-space-10, 40px)));
  box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  animation: ui-sp-in var(--tc-duration-moderate, 260ms) var(--tc-ease-emphasized, cubic-bezier(0.32, 0.72, 0.24, 1));
}
.ui-sp[data-overlay][data-side="left"] .ui-sp__pane { right: auto; left: 0; animation-name: ui-sp-in-left; }
@container (max-width: 480px) { .ui-sp[data-overlay] .ui-sp__pane { width: 100%; } }
.ui-sp__scrim { position: absolute; inset: 0; z-index: var(--tc-z-drawer-scrim, 40); background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6))); animation: ui-sp-fade var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease); }
@keyframes ui-sp-in { from { transform: translateX(100%); } }
@keyframes ui-sp-in-left { from { transform: translateX(-100%); } }
@keyframes ui-sp-fade { from { opacity: 0; } }

/* Closed: a floating launcher */
.ui-sp__launcher {
  position: absolute;
  bottom: var(--tc-space-4, 16px);
  right: var(--tc-space-4, 16px);
  z-index: var(--tc-z-sticky, 10);
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, 8px);
  height: var(--tc-control-h-md, 32px);
  margin: 0;
  padding: 0 var(--tc-control-px-md, 12px);
  border: 0;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-action-primary-bg, light-dark(#171717, #ededed));
  box-shadow: var(--tc-action-primary-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))), var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  color: var(--tc-action-primary-fg, light-dark(#ffffff, #111113));
  font: inherit;
  font-size: var(--tc-control-font-size, 13px);
  font-weight: var(--tc-control-font-weight, 500);
  cursor: pointer;
}
.ui-sp[data-side="left"] .ui-sp__launcher { right: auto; left: var(--tc-space-4, 16px); }
.ui-sp__launcher:hover { background: var(--tc-action-primary-bg-hover, light-dark(#262626, #ffffff)); }
.ui-sp__launcher:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-sp__launcher svg { width: 16px; height: 16px; }
.ui-sp__launcher kbd { font: inherit; font-size: var(--tc-font-size-xs, 11px); opacity: 0.7; }

@media (prefers-reduced-motion: reduce) {
  .ui-sp__pane, .ui-sp__handle::after { transition: none; }
  .ui-sp[data-overlay] .ui-sp__pane, .ui-sp__scrim { animation: none; }
}
@media (forced-colors: active) {
  .ui-sp__pane { border-inline: 1px solid CanvasText; }
  .ui-sp__handle::after { background: CanvasText; }
  .ui-sp__bubble { border: 1px solid CanvasText; }
}
`;
