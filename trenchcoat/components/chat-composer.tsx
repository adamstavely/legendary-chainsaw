"use client";

/*
 * Chat Composer – a single self-contained file.
 * Icons are inline SVGs and the styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: chat-composer.tsx is Standard,
 * chat-composer-clean.tsx is Clean). Standard is a white card on a gray tray that holds "Connect apps" /
 * "Select a project" above it, and scales with its width (calc(n * --u)); the message shows one line and grows to
 * two. Clean is one white card with hairline shadows and fixed px sizes: the message on top (growing up to four
 * lines), the tools in a row below it, and a quiet last row that connects apps and then lets you pick a project;
 * its icons are 16px glyphs with thin lines and solid shapes.
 */
// Generated from src/components/chat-composer.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type ComponentType, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-chat-composer";
/** The look of the composer around them – icons (and the default models' logos) draw themselves to match */
const LookContext = createContext<Look>(DEFAULT_LOOK);

type Step = "idle" | "loading" | "done";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  Logo?: ComponentType;
};

type ChatComposerOwnProps = {
  placeholder?: string;
  /** The message (controlled). Leave undefined to let the composer keep it, starting at `defaultValue` */
  value?: string;
  /** The message to start with when uncontrolled */
  defaultValue?: string;
  /** Every change to the message – typing, dictation, clearing after a send */
  onValueChange?: (value: string) => void;
  /** Models in the picker; the first one is selected by default. An empty list disables the picker */
  models?: ChatModel[];
  /** Id of the selected model (controlled). Leave undefined to let the composer keep it */
  model?: string;
  /** Id of the model selected at first when uncontrolled – defaults to the first model */
  defaultModel?: string;
  /** How long "Connect apps" and "Request approval" load at least, in ms */
  loadMs?: number;
  /** Sample transcript that appears word by word while recording when there's no onDictate */
  dictation?: string;
  /**
   * Live speech-to-text for the mic, called when recording starts. Push the transcript so far with `onTranscript`
   * (and the input level, 0–1, with `onLevel` for the trace); stop listening when `signal` aborts – on Discard,
   * Use recording or unmount. A rejection ends the recording with an error. Without it a sample transcript plays
   * (and warns once, unless `demo` is set)
   */
  onDictate?: (session: {
    onTranscript: (text: string) => void;
    onLevel: (level: number) => void;
    signal: AbortSignal;
  }) => void | Promise<unknown>;
  /**
   * Demo mode: connecting apps, requesting approval and dictation are simulated silently where their handlers
   * are missing. For galleries and prototypes
   */
  demo?: boolean;
  /**
   * Sends the message. Return a promise to keep the message (and a pending send button) until it settles: it is
   * cleared when it resolves and kept, with an error, when it rejects. A handler that returns nothing clears it
   * at once
   */
  onSend?: (message: string, details: { model: string }) => void | Promise<unknown>;
  /** Reports the model picked in the menu – with `model` set, also the only way the selection changes */
  onModelChange?: (model: ChatModel) => void;
  /** The plus button only reports the click – open your own file or folder picker here */
  onAttach?: () => void;
  /**
   * Connects the user's apps. Return a promise: "Connect apps" keeps loading until it settles, turns into
   * "Select a project" only when it resolves and shows an error when it rejects. A handler that returns nothing
   * counts as done after `loadMs`. Without it connecting is simulated (and warns once, unless `demo` is set)
   */
  onConnectApps?: () => void | Promise<unknown>;
  /** Requests unrestricted access – resolves, rejects and is simulated like onConnectApps */
  onRequestApproval?: () => void | Promise<unknown>;
  onSelectProject?: () => void;
  /** Visual style. Defaults to the file's look: Standard in chat-composer.tsx, Clean in chat-composer-clean.tsx */
  look?: Look;
};

export type ChatComposerProps = Omit<ComponentPropsWithoutRef<"div">, keyof ChatComposerOwnProps> &
  ChatComposerOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

/** Shown in the picker when the models list is empty */
const NO_MODEL: ChatModel = { id: "", name: "No model", description: "" };

/** A change handler for state whose changes another callback already reports (keeps useControllable from warning) */
const reportedElsewhere = () => {};

export const defaultModels: ChatModel[] = [
  { id: "auto", name: "Auto", description: "Picks the best model for each task", Logo: () => <SparklesIcon /> },
  { id: "claude", name: "Claude", description: "Thoughtful writing and code", Logo: () => <ClaudeLogo /> },
  { id: "chatgpt", name: "ChatGPT", description: "Quick answers for everyday tasks", Logo: () => <ChatGPTLogo /> },
];

/** Number of samples in the audio trace next to the recording controls */
const TRACE = 16;
const silentTrace = () => Array.from({ length: TRACE }, () => 0);

/** Clean: the message grows with the text up to this many lines, then scrolls (Standard: up to two) */
const MAX_LINES = 4;

// Warns once per page – not per instance or per feature – when a missing handler is simulated
let warnedSimulation = false;
const warnSimulation = (handler: string, what: string) => {
  if (warnedSimulation) return;
  warnedSimulation = true;
  console.warn(
    `ChatComposer: no ${handler} handler – simulating ${what}. Pass \`demo\` to keep the simulation, or the handler to wire it up. The simulation will be off by default in the next major version.`,
  );
};

/* ---------- Hooks ---------- */

/**
 * The message starts with one line and grows with the text, up to `maxLines`; longer text scrolls inside. Measured
 * only when the text changes: the line height is read first, then the content at zero height (one forced layout).
 */
function useAutoLines(textarea: RefObject<HTMLTextAreaElement | null>, text: string, heard: string, maxLines: number) {
  const [lines, setLines] = useState(1);
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 1;
    const prev = el.style.height;
    el.style.height = "0px";
    const content = el.scrollHeight;
    el.style.height = prev;
    setLines(Math.min(maxLines, Math.max(1, Math.round(content / lineHeight))));
  }, [textarea, text, heard, maxLines]);
  return lines;
}

/**
 * Model switch morph: the button glides to its new width while logo and name blur in (not on first render). The
 * width is kept current by a ResizeObserver, so it's only measured during a render when the model changed.
 */
function useModelMorph(button: RefObject<HTMLButtonElement | null>, modelId: string, clean: boolean) {
  const [morph, setMorph] = useState(false);
  const width = useRef(0);
  const shown = useRef(modelId);

  useEffect(() => {
    const el = button.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") {
      width.current = el.getBoundingClientRect().width;
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      width.current = box ? box.inlineSize : el.getBoundingClientRect().width;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [button, clean]);

  useLayoutEffect(() => {
    const el = button.current;
    if (!el || shown.current === modelId) return;
    shown.current = modelId;
    const from = width.current;
    const to = el.getBoundingClientRect().width;
    width.current = to;
    if (!morph || !from || Math.abs(from - to) < 0.5 || reducedMotion()) return;
    el.animate([{ width: `${from}px` }, { width: `${to}px` }], {
      duration: 460,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    });
  }, [button, modelId, morph]);

  return [morph, setMorph] as const;
}

type Say = {
  /** Results that arrive after unmount are ignored */
  alive: { current: boolean };
  /** True once the handler has resolved and loadMs has passed; false when it throws or rejects */
  settle: (handler?: () => unknown) => Promise<boolean>;
  setStatus: (status: string) => void;
  setError: (error: string) => void;
  fail: (message: string) => void;
};

/** "Connect apps" and "Request approval": idle → loading → done, or back to idle with an error */
function useStepAction(
  say: Say,
  {
    handler,
    demo,
    simulated,
    busy,
    done,
    failed,
  }: { handler?: () => unknown; demo: boolean; simulated: [handler: string, what: string]; busy: string; done: string; failed: string },
) {
  const [step, setStep] = useState<Step>("idle");
  const run = async () => {
    if (step !== "idle") return;
    setStep("loading");
    say.setError("");
    say.setStatus(busy);
    if (!handler && !demo) warnSimulation(...simulated);
    const ok = await say.settle(handler);
    if (!say.alive.current) return;
    if (ok) {
      setStep("done");
      say.setStatus(done);
    } else {
      setStep("idle");
      say.fail(failed);
    }
  };
  return [step, run] as const;
}

/** The audio trace's levels, drawn straight into the DOM – React doesn't re-render for a new level */
type TraceLevels = { levels: number[]; paint: () => void };

/**
 * Voice input. Simulated take (no onDictate): words arrive one by one and the trace scrolls with a made-up input
 * level. Live take: your speech-to-text pushes the words and the level until the signal aborts.
 */
function useDictation({
  onDictate,
  dictation,
  demo,
  say,
  textarea,
  closeMenu,
  setMessage,
}: {
  onDictate: ChatComposerOwnProps["onDictate"];
  dictation: string;
  demo: boolean;
  say: Say;
  textarea: RefObject<HTMLTextAreaElement | null>;
  closeMenu: () => void;
  setMessage: (update: (current: string) => string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [heard, setHeard] = useState(""); // gray, not yet confirmed
  const trace = useRef<TraceLevels>({ levels: silentTrace(), paint: () => {} });
  const dictating = useRef<AbortController | null>(null);
  const { alive } = say;

  // A live dictation is stopped on unmount
  useEffect(() => () => dictating.current?.abort(), []);

  const pushLevel = useCallback((level: number) => {
    const t = trace.current;
    t.levels = [...t.levels.slice(1), level];
    t.paint();
  }, []);

  const simulated = !onDictate;
  useEffect(() => {
    if (!recording || !simulated) return;
    const words = dictation.split(/\s+/).filter(Boolean);
    let count = 0;
    const speak = window.setInterval(() => {
      count = Math.min(words.length, count + 1);
      setHeard(words.slice(0, count).join(" "));
    }, 320);
    const listen = window.setInterval(() => {
      const talking = count < words.length;
      pushLevel(talking && Math.random() > 0.3 ? 0.3 + Math.random() * 0.7 : 0);
    }, 120);
    return () => {
      clearInterval(speak);
      clearInterval(listen);
    };
  }, [recording, dictation, simulated, pushLevel]);

  const start = () => {
    closeMenu();
    setHeard("");
    trace.current.levels = silentTrace();
    trace.current.paint();
    setRecording(true);
    say.setError("");
    say.setStatus("Recording. Press Escape to discard.");
    if (!onDictate) {
      if (!demo) warnSimulation("onDictate", "dictation");
      return;
    }
    const controller = new AbortController();
    dictating.current?.abort();
    dictating.current = controller;
    const { signal } = controller;
    const live = () => alive.current && !signal.aborted;
    Promise.resolve()
      .then(() =>
        onDictate({
          signal,
          onTranscript: (text) => live() && setHeard(text),
          onLevel: (level) => live() && pushLevel(Math.min(1, Math.max(0, level))),
        }),
      )
      .catch(() => {
        if (!live()) return;
        dictating.current = null;
        setRecording(false);
        setHeard("");
        say.fail("Dictation stopped working. Try again.");
      });
  };

  const stop = (keep: boolean) => {
    dictating.current?.abort();
    dictating.current = null;
    setRecording(false);
    if (keep && heard) {
      setMessage((current) => (current.trim() ? `${current.trimEnd()} ${heard}` : heard));
      say.setStatus("Recording added to your message.");
    } else {
      say.setStatus("Recording discarded.");
    }
    setHeard("");
    textarea.current?.focus();
  };

  return { recording, heard, trace, start, stop };
}

/* ---------- Component ---------- */

export function ChatComposer({
  placeholder = "Start by typing...",
  value,
  defaultValue = "",
  onValueChange,
  models = defaultModels,
  model: modelProp,
  defaultModel,
  loadMs = 1300,
  dictation = "Draft a short update for the team about this week's progress",
  onSend,
  onModelChange,
  onAttach,
  onConnectApps,
  onRequestApproval,
  onSelectProject,
  onDictate,
  demo = false,
  look,
  className,
  ref,
  ...rest
}: ChatComposerProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const [message, setMessage] = useControllable(value, defaultValue, onValueChange);
  // The selection is kept as an id; a model that's no longer in the list falls back to the first one
  const [modelId, setModelId] = useControllable(
    modelProp,
    defaultModel ?? models[0]?.id ?? "",
    onModelChange ? reportedElsewhere : undefined, // pickModel reports the whole model through onModelChange
  );
  const model = models.find((m) => m.id === modelId) ?? models[0] ?? NO_MODEL;
  const noModels = models.length === 0;
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const root = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(root, ref);
  const heardId = useId();
  const body = useRef<HTMLElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const modelButton = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  // Results that arrive after unmount are ignored
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const pending = timers.current;
    return () => {
      alive.current = false;
      pending.forEach(clearTimeout);
    };
  }, []);

  const later = (fn: () => void) => timers.current.push(window.setTimeout(fn, loadMs));
  const say: Say = {
    alive,
    settle: async (handler) => {
      try {
        await Promise.all([handler?.(), new Promise((r) => later(() => r(null)))]);
        return true;
      } catch {
        return false;
      }
    },
    setStatus,
    setError,
    // The alert below announces it, so the live status line stays quiet
    fail: (message) => {
      setError(message);
      setStatus("");
    },
  };

  const [apps, connect] = useStepAction(say, {
    handler: onConnectApps,
    demo,
    simulated: ["onConnectApps", "connecting apps"],
    busy: "Connecting apps…",
    done: "Apps connected. Select a project.",
    failed: "Your apps couldn't be connected. Try again.",
  });
  const [approval, requestApproval] = useStepAction(say, {
    handler: onRequestApproval,
    demo,
    simulated: ["onRequestApproval", "the approval"],
    busy: "Requesting approval…",
    done: "Unrestricted access granted.",
    failed: "Approval wasn't granted. Try again.",
  });

  const voice = useDictation({ onDictate, dictation, demo, say, textarea, closeMenu: () => setMenuOpen(false), setMessage });
  const { recording, heard } = voice;

  // A control that goes inert or away while focused hands focus on (WCAG 2.4.3): the mic to Discard recording and
  // "Connect apps" to "Select a project" (same data-focus-key), anything else to the message
  useFocusRescue(root, { fallback: () => textarea.current });

  // To two lines in Standard, MAX_LINES in Clean (which also counts the words heard while recording)
  const lines = useAutoLines(textarea, message, clean ? heard : "", clean ? MAX_LINES : 2);
  const [modelMorph, setModelMorph] = useModelMorph(modelButton, model.id, clean);

  const pickModel = (next: ChatModel) => {
    if (next.id !== model.id) setModelMorph(true);
    setModelId(next.id);
    setMenuOpen(false);
    setStatus(`${next.name} selected.`);
    onModelChange?.(next);
    modelButton.current?.focus();
  };

  /* ---------- Sending ---------- */

  const canSend = message.trim().length > 0 && !sending;
  const send = async () => {
    if (!canSend) return;
    const result = onSend?.(message.trim(), { model: model.id });
    textarea.current?.focus();
    if (!result || typeof (result as Promise<unknown>).then !== "function") {
      setMessage("");
      setStatus("Message sent.");
      return;
    }
    // Async send: the message stays (read-only) until the handler settles, and comes back editable on failure
    setSending(true);
    setError("");
    setStatus("Sending…");
    try {
      await result;
      if (!alive.current) return;
      setMessage("");
      setStatus("Message sent.");
    } catch {
      if (!alive.current) return;
      say.fail("Your message wasn't sent. Try again.");
    } finally {
      if (alive.current) setSending(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const onBodyKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && recording) {
      event.preventDefault();
      voice.stop(false);
    }
  };

  // Clicking anywhere on the white card (Clean: the writing area) puts the caret in the text area
  const focusMessage = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, textarea, input")) return;
    event.preventDefault();
    textarea.current?.focus();
  };

  // The message and, while recording, the heard words in gray behind the confirmed text
  const writing = (
    <>
      <textarea
        ref={textarea}
        className="ui-chat-composer__message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Message"
        spellCheck={false}
        readOnly={recording || sending}
      />

      <div className="ui-chat-composer__draft" aria-hidden="true">
        {message}
        {message && heard && !/\s$/.test(message) ? " " : ""}
        <span className="ui-chat-composer__heard">{heard}</span>
      </div>
    </>
  );

  const layout: LayoutProps = {
    writing,
    apps,
    approval,
    recording,
    sending,
    canSend,
    trace: voice.trace,
    heardId,
    focusMessage,
    connect,
    requestApproval,
    startRecording: voice.start,
    stopRecording: voice.stop,
    send,
    onAttach,
    onSelectProject,
    modelButton: (
      <ModelButton
        ref={modelButton}
        clean={clean}
        model={model}
        morph={modelMorph}
        open={menuOpen}
        disabled={noModels}
        onToggle={() => setMenuOpen((open) => !open)}
        onOpen={() => setMenuOpen(true)}
      />
    ),
  };

  return (
    <LookContext value={resolvedLook}>
      <div {...rest} ref={setRoot} className={className ? `${ROOT_CLASS} ${className}` : ROOT_CLASS} data-look={resolvedLook}>
        {/* React 19 hoists this into <head> once, no matter how many composers render */}
        <style href="ui-chat-composer" precedence="default">
          {css}
        </style>

        <section
          ref={body}
          className="ui-chat-composer__body"
          data-apps={apps}
          data-approval={approval}
          data-recording={recording}
          data-sending={sending || undefined}
          style={
            clean
              ? ({ "--tc-chat-composer-lines": lines } as CSSProperties)
              : ({ "--tc-chat-composer-grow": (lines - 1) * 106.424 } as CSSProperties)
          }
          aria-label="Message composer"
          onKeyDown={onBodyKeyDown}
        >
          {clean ? <CleanLayout {...layout} /> : <StandardLayout {...layout} />}

          <ModelMenu
            open={menuOpen && !noModels}
            models={models}
            selected={model}
            anchor={modelButton}
            container={body}
            clean={clean}
            onPick={pickModel}
            onClose={(refocus) => {
              setMenuOpen(false);
              if (refocus) modelButton.current?.focus();
            }}
          />
        </section>
        {error && (
          <p className="ui-chat-composer__error" role="alert">
            {error}
          </p>
        )}
        <p className="ui-chat-composer__sr-only" aria-live="polite">
          {status}
        </p>
        {/* The words heard so far, read with "Use recording" (the draft on screen is aria-hidden, and a live region
            would announce every word) */}
        <span id={heardId} hidden>
          {heard ? `Heard so far: ${heard}` : "Nothing heard yet."}
        </span>
      </div>
    </LookContext>
  );
}

/* ---------- Layouts: the same parts, arranged per look ---------- */

type LayoutProps = {
  writing: ReactNode;
  modelButton: ReactNode;
  apps: Step;
  approval: Step;
  recording: boolean;
  sending: boolean;
  canSend: boolean;
  trace: RefObject<TraceLevels>;
  /** Id of the hidden text with the words heard so far */
  heardId: string;
  focusMessage: (event: PointerEvent<HTMLDivElement>) => void;
  connect: () => void;
  requestApproval: () => void;
  startRecording: () => void;
  stopRecording: (keep: boolean) => void;
  send: () => void;
  onAttach?: () => void;
  onSelectProject?: () => void;
};

/** Clean: the message on top, the tools in a row below it, and a last row for apps and the project */
function CleanLayout(p: LayoutProps) {
  return (
    <>
      <div className="ui-chat-composer__write" onPointerDown={p.focusMessage}>
        <div className="ui-chat-composer__field">
          {p.writing}
        </div>

        <div className="ui-chat-composer__tools">
          <div className="ui-chat-composer__group">
            <button type="button" className="ui-chat-composer__icon-btn" aria-label="Add attachment" onClick={p.onAttach}>
              <PlusIcon />
            </button>
            <ApprovalButton clean approval={p.approval} onClick={p.requestApproval} />
          </div>

          <div className="ui-chat-composer__swap">
            <div className="ui-chat-composer__group ui-chat-composer__group--end" inert={p.recording}>
              {p.modelButton}
              <button type="button" className="ui-chat-composer__icon-btn" aria-label="Voice input" data-focus-key="voice" onClick={p.startRecording}>
                <MicIcon />
              </button>
              <button type="button" className="ui-chat-composer__send" aria-label="Send message" disabled={!p.canSend} aria-busy={p.sending || undefined} onClick={p.send}>
                <ArrowUpIcon />
              </button>
            </div>

            <div className="ui-chat-composer__group ui-chat-composer__group--end ui-chat-composer__group--voice" inert={!p.recording}>
              <Trace trace={p.trace} />
              <button type="button" className="ui-chat-composer__button" aria-label="Discard recording" data-focus-key="voice" onClick={() => p.stopRecording(false)}>
                <CancelIcon />
              </button>
              <button type="button" className="ui-chat-composer__send" aria-label="Use recording" aria-describedby={p.heardId} onClick={() => p.stopRecording(true)}>
                <TickIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The last row: connect your apps, then pick a project – the two swap in place */}
      <div className="ui-chat-composer__foot">
        <button type="button" className="ui-chat-composer__row ui-chat-composer__connect" data-focus-key="apps" onClick={p.connect} inert={p.apps === "done"} aria-busy={p.apps === "loading"}>
          <span className="ui-chat-composer__logos" aria-hidden="true">
            <span className="ui-chat-composer__logo">
              <GmailLogo />
            </span>
            <span className="ui-chat-composer__logo">
              <SlackLogo />
            </span>
            <span className="ui-chat-composer__logo">
              <ClickUpLogo />
            </span>
          </span>
          <span className="ui-chat-composer__shimmer">
            Connect apps
            <Shine text="Connect apps" />
          </span>
        </button>
        <button
          type="button"
          className="ui-chat-composer__row ui-chat-composer__project"
          data-focus-key="apps"
          onClick={p.onSelectProject}
          inert={p.apps !== "done"}
          aria-hidden={p.apps !== "done"}
        >
          <span className="ui-chat-composer__folder" aria-hidden="true">
            <FolderIcon />
          </span>
          <span>Select a project</span>
          <span className="ui-chat-composer__row-chevron" aria-hidden="true">
            <ChevronRightIcon />
          </span>
        </button>
      </div>
    </>
  );
}

/** Standard: a gray tray with "Select a project" / "Connect apps", and the white card on top of it */
function StandardLayout(p: LayoutProps) {
  return (
    <>
      <div className="ui-chat-composer__tray">
        <button
          type="button"
          className="ui-chat-composer__row ui-chat-composer__project"
          data-focus-key="apps"
          onClick={p.onSelectProject}
          inert={p.apps !== "done"}
          aria-hidden={p.apps !== "done"}
        >
          <span className="ui-chat-composer__icon ui-chat-composer__icon--folder">
            <FolderIcon />
          </span>
          <span className="ui-chat-composer__label">Select a project</span>
        </button>

        <button
          type="button"
          className="ui-chat-composer__row ui-chat-composer__connect"
          data-focus-key="apps"
          onClick={p.connect}
          inert={p.apps === "done"}
          aria-busy={p.apps === "loading"}
        >
          <span className="ui-chat-composer__logos" aria-hidden="true">
            <span className="ui-chat-composer__logo ui-chat-composer__logo--gmail">
              <GmailLogo />
            </span>
            <span className="ui-chat-composer__logo ui-chat-composer__logo--slack">
              <SlackLogo />
            </span>
            <span className="ui-chat-composer__logo ui-chat-composer__logo--clickup">
              <ClickUpLogo />
            </span>
          </span>
          <span className="ui-chat-composer__label ui-chat-composer__shimmer">
            Connect apps
            <Shine text="Connect apps" />
          </span>
        </button>
      </div>

      <div className="ui-chat-composer__card" onPointerDown={p.focusMessage}>
        {p.writing}

        <div className="ui-chat-composer__toolbar">
          <button type="button" className="ui-chat-composer__icon-btn" aria-label="Add attachment" onClick={p.onAttach}>
            <span className="ui-chat-composer__icon">
              <PlusIcon />
            </span>
          </button>
          <ApprovalButton clean={false} approval={p.approval} onClick={p.requestApproval} />
        </div>

        <div className="ui-chat-composer__toolbar ui-chat-composer__toolbar--end" inert={p.recording}>
          {p.modelButton}
          <button
            type="button"
            className="ui-chat-composer__icon-btn"
            aria-label="Voice input"
            data-focus-key="voice"
            onClick={p.startRecording}
          >
            <span className="ui-chat-composer__icon">
              <MicIcon />
            </span>
          </button>
          <button
            type="button"
            className="ui-chat-composer__send"
            aria-label="Send message"
            disabled={!p.canSend}
            aria-busy={p.sending || undefined}
            onClick={p.send}
          >
            <ArrowUpIcon />
          </button>
        </div>

        <div
          className="ui-chat-composer__toolbar ui-chat-composer__toolbar--end ui-chat-composer__toolbar--voice"
          inert={!p.recording}
        >
          <Trace trace={p.trace} />
          <button
            type="button"
            className="ui-chat-composer__square"
            aria-label="Discard recording"
            data-focus-key="voice"
            onClick={() => p.stopRecording(false)}
          >
            <CancelIcon />
          </button>
          <button
            type="button"
            className="ui-chat-composer__square"
            aria-label="Use recording"
            aria-describedby={p.heardId}
            onClick={() => p.stopRecording(true)}
          >
            <TickIcon />
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------- Parts ---------- */

/** The loading shimmer's copy of a label (decorative) */
const Shine = ({ text }: { text: string }) => (
  <span className="ui-chat-composer__shine" aria-hidden="true">
    <span>{text}</span>
  </span>
);

/** "Request approval", which turns into "Unrestricted access" once granted */
function ApprovalButton({ clean, approval, onClick }: { clean: boolean; approval: Step; onClick: () => void }) {
  return (
    <button
      type="button"
      className="ui-chat-composer__approval"
      onClick={onClick}
      aria-busy={approval === "loading"}
      aria-disabled={approval !== "idle"}
    >
      {!clean && <span className="ui-chat-composer__wash" aria-hidden="true" />}
      <span className={clean ? "ui-chat-composer__approval-icon" : "ui-chat-composer__icon"} aria-hidden="true">
        <HandIcon />
        <ShieldIcon />
      </span>
      <span className="ui-chat-composer__approval-text">
        <span className="ui-chat-composer__request ui-chat-composer__shimmer" aria-hidden={approval === "done"}>
          Request approval
          <Shine text="Request approval" />
        </span>
        <span className="ui-chat-composer__granted" aria-hidden={approval !== "done"}>
          Unrestricted access
        </span>
      </span>
    </button>
  );
}

/** The selected model – opens the menu */
function ModelButton({
  ref,
  clean,
  model,
  morph,
  open,
  disabled,
  onToggle,
  onOpen,
}: {
  ref: Ref<HTMLButtonElement>;
  clean: boolean;
  model: ChatModel;
  morph: boolean;
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      className="ui-chat-composer__model"
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {/* A new key per model replays the morph-in of logo and name */}
      <span className="ui-chat-composer__model-face" key={model.id} data-morph={morph || undefined}>
        {model.Logo && model.id !== "auto" && (
          <span className="ui-chat-composer__model-logo" aria-hidden="true">
            <model.Logo />
          </span>
        )}
        <span className={clean ? undefined : "ui-chat-composer__label"}>{model.name}</span>
      </span>
      <span className={clean ? "ui-chat-composer__chevron" : "ui-chat-composer__icon ui-chat-composer__icon--chevron"} aria-hidden="true">
        <ChevronIcon />
      </span>
    </button>
  );
}

/** One bar of the audio trace: silence is a dot, sound a bar */
const traceHeight = (clean: boolean, level: number) => (clean ? `${Math.max(2, level * 16)}px` : `calc(${Math.max(8, level * 64)} * var(--u))`);

/** Audio trace: it scrolls in from the right. React renders it silent once; new levels are written to the bars */
function Trace({ trace }: { trace: RefObject<TraceLevels> }) {
  const clean = useContext(LookContext) === "clean";
  const el = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    const t = trace.current;
    t.paint = () => t.levels.forEach((level, i) => (node.children[i] as HTMLElement | undefined)?.style.setProperty("height", traceHeight(clean, level)));
    t.paint();
    return () => {
      t.paint = () => {};
    };
  }, [trace, clean]);
  return (
    <span ref={el} className="ui-chat-composer__trace" aria-hidden="true">
      {Array.from({ length: TRACE }, (_, i) => (
        <span key={i} style={{ height: traceHeight(clean, 0) }} />
      ))}
    </span>
  );
}

/** The rectangle the menu has to stay in: the nearest ancestor that clips, otherwise the viewport */
function clippingFrame(from: HTMLElement) {
  for (let el = from.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el);
    if (overflowX !== "visible" || overflowY !== "visible") return el.getBoundingClientRect();
  }
  return { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
}

/* ---------- Model picker: opens upward, or downward when there is no room above ---------- */

/**
 * Places the menu next to the model button, always inside the visible frame (the nearest clipping ancestor, or the
 * viewport). It opens in two steps: first the closed shape moves to the button, then it morphs open – in one step
 * the very first opening had no start shape and just appeared. `onPlaced` runs as the menu is placed.
 */
function useMenuPlacement({
  open,
  anchor,
  container,
  panel,
  clean,
  onPlaced,
}: {
  open: boolean;
  anchor: RefObject<HTMLButtonElement | null>;
  container: RefObject<HTMLElement | null>;
  panel: RefObject<HTMLDivElement | null>;
  clean: boolean;
  onPlaced: () => void;
}) {
  const [place, setPlace] = useState({ top: 0, left: 0, up: true, fromTop: 0, fromLeft: 0, fromRadius: 0 });
  const [visible, setVisible] = useState(false);
  const [placing, setPlacing] = useState(false);
  const placed = useRef(onPlaced);
  useLayoutEffect(() => {
    placed.current = onPlaced;
  });

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    if (!anchor.current || !container.current || !panel.current) return;
    const button = anchor.current.getBoundingClientRect();
    const box = container.current.getBoundingClientRect();
    const frame = clippingFrame(container.current);
    const width = panel.current.offsetWidth;
    const height = panel.current.offsetHeight;
    const gap = 8;
    const inset = 8;

    const roomAbove = button.top - gap - (frame.top + inset);
    const roomBelow = frame.bottom - inset - (button.bottom + gap);
    const up = roomAbove >= height || roomAbove >= roomBelow;
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
    const top = clamp(
      up ? button.top - gap - height : button.bottom + gap,
      frame.top + inset,
      frame.bottom - inset - height,
    );
    const left = clamp(button.right - width, frame.left + inset, frame.right - inset - width);

    // The morph starts as a button-sized piece in the corner closest to the button
    const fromLeft = clamp(button.left - left, 0, width - 1);
    const fromTop = up ? clamp(height - button.height, 0, height - 1) : 0;
    setPlace({
      top: top - box.top,
      left: left - box.left,
      up,
      fromTop,
      fromLeft,
      fromRadius: clean ? 6 : button.height / 2,
    });
    placed.current();
    setPlacing(true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- placed when it opens, not when the look or refs change

  // Once the closed shape sits at the button, apply it, then open – so the browser has a start shape to morph from
  useLayoutEffect(() => {
    if (!open || visible || !panel.current) return;
    void getComputedStyle(panel.current).clipPath;
    setPlacing(false);
    setVisible(true);
  }, [place]); // eslint-disable-line react-hooks/exhaustive-deps -- runs once the new place is applied, not on open/visible

  return { place, visible, placing };
}

function ModelMenu({
  open,
  models,
  selected,
  anchor,
  container,
  clean,
  onPick,
  onClose,
}: {
  open: boolean;
  models: ChatModel[];
  selected: ChatModel;
  anchor: RefObject<HTMLButtonElement | null>;
  container: RefObject<HTMLElement | null>;
  /** Clean morphs from a 6px-rounded button, Standard from a pill */
  clean: boolean;
  onPick: (model: ChatModel) => void;
  onClose: (refocus: boolean) => void;
}) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [fill, setFill] = useState({ y: 0, h: 0, glide: false });
  // The fill only shows while the pointer is over a row (or the keyboard moves through the list)
  const [shown, setShown] = useState(false);
  const wasShown = useRef(false);

  // Placed and focused on the selected model each time it opens
  const { place, visible, placing } = useMenuPlacement({
    open,
    anchor,
    container,
    panel,
    clean,
    onPlaced: () => {
      setActive(
        Math.max(
          0,
          models.findIndex((m) => m.id === selected.id),
        ),
      );
      setShown(false);
    },
  });

  useEffect(() => {
    if (visible) panel.current?.focus({ preventScroll: true });
  }, [visible]);

  // One fill glides between rows; when it first appears it fades in on the spot
  useLayoutEffect(() => {
    const row = rows.current[active];
    if (row) setFill({ y: row.offsetTop, h: row.offsetHeight, glide: wasShown.current && shown });
    wasShown.current = shown;
  }, [active, open, shown]);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const away = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || anchor.current?.contains(target)) return;
      onClose(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, onClose, anchor]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = models.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
      setShown(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPick(models[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose(true);
    } else if (event.key === "Tab") {
      // The list closes (and goes inert): Tab moves on from the model button instead of from nowhere
      rescueFocus(panel.current, [anchor.current]);
      onClose(false);
    }
  };

  return (
    <div
      className="ui-chat-composer__menu"
      data-open={visible}
      data-placing={placing}
      data-up={place.up}
      style={
        {
          top: place.top,
          left: place.left,
          "--from-top": `${place.fromTop}px`,
          "--from-left": `${place.fromLeft}px`,
          "--from-bottom": place.up ? "0px" : `calc(100% - ${place.fromRadius * 2}px)`,
          "--from-radius": `${place.fromRadius}px`,
        } as CSSProperties
      }
      inert={!visible}
    >
      <div
        ref={panel}
        className="ui-chat-composer__menu-panel"
        role="listbox"
        tabIndex={-1}
        aria-label="Select a model"
        aria-activedescendant={`${id}-${active}`}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setShown(false)}
      >
        <span
          className="ui-chat-composer__menu-fill"
          aria-hidden="true"
          data-glide={fill.glide}
          style={{ transform: `translateY(${fill.y}px)`, height: fill.h, opacity: shown ? 1 : 0 }}
        />
        {models.map((m, i) => (
          <div
            key={m.id}
            ref={(el) => {
              rows.current[i] = el;
            }}
            id={`${id}-${i}`}
            role="option"
            aria-selected={m.id === selected.id}
            className="ui-chat-composer__option"
            onPointerEnter={() => {
              setActive(i);
              setShown(true);
            }}
            onClick={() => onPick(m)}
          >
            <span className="ui-chat-composer__option-logo" aria-hidden="true">
              {m.Logo && <m.Logo />}
            </span>
            <span className="ui-chat-composer__option-text">
              <span className="ui-chat-composer__option-name">{m.name}</span>
              <span className="ui-chat-composer__option-desc">{m.description}</span>
            </span>
            <span className="ui-chat-composer__option-check" aria-hidden="true">
              <TickIcon />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Icons ----------
 * Each icon draws itself in the look of the composer it sits in: Standard's stroke icons share one style,
 * Clean's are 16px glyphs with thin lines and solid shapes. */

const StdPlusIcon = () => (
  <svg viewBox="0 0 68.155 68.155" fill="none" aria-hidden="true">
    <path
      d="M34.0812 11.3588V56.7954M56.7995 34.0771H11.3629"
      stroke="currentColor"
      strokeWidth="4.25969"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StdHandIcon = () => (
  <svg viewBox="0 0 68.155 68.155" fill="none" className="ui-chat-composer__hand" aria-hidden="true">
    <path
      d="M52.5305 32.6557V24.8463C52.5305 22.1016 54.7555 19.8766 57.5001 19.8766C60.2448 19.8766 62.4698 22.1016 62.4698 24.8463V42.027C62.4698 53.3194 53.3154 62.4735 42.0233 62.4735H34.2388M22.7127 39.7552L15.94 31.8537C14.8314 30.5602 13.2129 29.8159 11.5094 29.8159H11.1235C8.11379 29.8159 5.67395 32.2558 5.67395 35.2655C5.67395 36.3412 5.99241 37.393 6.58919 38.2881L16.4118 53.0221C20.3482 58.9269 26.9753 62.4735 34.0719 62.4735"
      stroke="currentColor"
      strokeWidth="4.25969"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M52.534 24.1378V16.3284C52.534 13.5837 50.3091 11.3588 47.5644 11.3588C44.8197 11.3588 42.5948 13.5837 42.5948 16.3284V29.8174"
      stroke="currentColor"
      strokeWidth="4.25969"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M42.5958 29.8198V10.6513C42.5958 7.90661 40.3708 5.68163 37.6262 5.68163C34.8815 5.68163 32.6565 7.90661 32.6565 10.6513V28.4"
      stroke="currentColor"
      strokeWidth="4.25969"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M32.6576 28.3975V16.3284C32.6576 13.5837 30.4326 11.3588 27.6879 11.3588C24.9433 11.3588 22.7183 13.5837 22.7183 16.3284V39.7567"
      stroke="currentColor"
      strokeWidth="4.25969"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StdShieldIcon = () => (
  <svg viewBox="0 0 66.543 66.543" fill="none" className="ui-chat-composer__shield" aria-hidden="true">
    <path
      d="M33.2482 22.1795V33.27"
      stroke="#F44900"
      strokeWidth="4.15894"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M33.5966 43.67H33.2501M33.9432 43.67C33.9432 44.0529 33.633 44.3631 33.2501 44.3631C32.8672 44.3631 32.5569 44.0529 32.5569 43.67C32.5569 43.2871 32.8672 42.9768 33.2501 42.9768C33.633 42.9768 33.9432 43.2871 33.9432 43.67Z"
      stroke="#F44900"
      strokeWidth="4.15894"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M58.202 31.0087V22.9595C58.202 18.4124 58.202 16.1389 57.0816 14.6555C55.9612 13.1722 53.4278 12.452 48.3612 11.0118C44.8995 10.0278 41.848 8.84228 39.41 7.76002C36.0859 6.28445 34.4237 5.54666 33.2484 5.54666C32.0728 5.54666 30.4109 6.28445 27.0868 7.76002C24.6487 8.84228 21.5973 10.0278 18.1357 11.0118C13.069 12.452 10.5356 13.1722 9.4152 14.6555C8.29475 16.1389 8.29475 18.4124 8.29475 22.9595V31.0087C8.29475 46.605 22.3319 55.9626 29.3498 59.6666C31.0331 60.5549 31.8748 60.9991 33.2484 60.9991C34.622 60.9991 35.4635 60.5549 37.1467 59.6666C44.1648 55.9626 58.202 46.605 58.202 31.0087Z"
      stroke="#F44900"
      strokeWidth="4.15894"
      strokeLinecap="round"
    />
  </svg>
);

/* mic, chevron-down and arrow-up: Lucide (ISC, lucide.dev) */
const StdMicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19v3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <rect x="9" y="2" width="6" height="13" rx="3" />
  </svg>
);

const StdChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const StdArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
);

const StdFolderIcon = () => (
  <svg viewBox="0 0 67 67" fill="none" aria-hidden="true">
    <path
      d="M11.1704 15.3527V30.7069H55.837V23.7277C55.837 19.8732 52.7123 16.7485 48.8578 16.7485H33.5037L29.5778 10.8598C28.5423 9.30649 26.799 8.37352 24.9322 8.37352H18.1495C14.295 8.37352 11.1704 11.4982 11.1704 15.3527Z"
      fill="#00A1FF"
    />
    <path
      d="M33.5037 16.7485L29.5778 10.8598C28.5423 9.30649 26.799 8.37352 24.9322 8.37352H18.1495C14.295 8.37352 11.1704 11.4982 11.1704 15.3527V30.7068H55.837V23.7277C55.837 19.8732 52.7123 16.7485 48.8578 16.7485H33.5037ZM33.5037 16.7485H23.7328"
      stroke="#00A1FF"
      strokeWidth="4.1875"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      opacity="0.4"
      d="M6.59197 42.3758C5.54336 37.1185 5.01906 34.4899 6.50878 32.7085C6.6081 32.5899 6.71315 32.4751 6.82359 32.3646C8.47975 30.71 11.4107 30.71 17.2725 30.71H49.7312C55.5931 30.71 58.5238 30.71 60.1801 32.3646C60.2904 32.4751 60.3957 32.5899 60.495 32.7085C61.9847 34.4899 61.4604 37.1185 60.4118 42.3758C58.9041 49.9348 58.15 53.7144 55.3073 56.0363C55.1133 56.1945 54.9134 56.3467 54.7076 56.4921C51.6932 58.6266 47.4792 58.6266 39.0506 58.6266H27.9531C19.5246 58.6266 15.3104 58.6266 12.296 56.4921C12.0904 56.3467 11.8904 56.1945 11.6965 56.0363C8.85353 53.7144 8.09969 49.9348 6.59197 42.3758Z"
      fill="#929292"
    />
    <path
      d="M6.59197 42.3758C5.54336 37.1185 5.01906 34.4899 6.50878 32.7085C6.6081 32.5899 6.71315 32.4751 6.82359 32.3646C8.47975 30.71 11.4107 30.71 17.2725 30.71H49.7312C55.5931 30.71 58.5238 30.71 60.1801 32.3646C60.2904 32.4751 60.3957 32.5899 60.495 32.7085C61.9847 34.4899 61.4604 37.1185 60.4118 42.3758C58.9041 49.9348 58.15 53.7144 55.3073 56.0363C55.1133 56.1945 54.9134 56.3467 54.7076 56.4921C51.6932 58.6266 47.4792 58.6266 39.0506 58.6266H27.9531C19.5246 58.6266 15.3104 58.6266 12.296 56.4921C12.0904 56.3467 11.8904 56.1945 11.6965 56.0363C8.85353 53.7144 8.09969 49.9348 6.59197 42.3758Z"
      fill="#3CC7FF"
      stroke="#3CC7FF"
      strokeWidth="4.1875"
    />
  </svg>
);

/* ---------- Clean icons ---------- */

/* Clean's stroke icons share this style */
const cleanLine = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const CleanPlusIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 2.5c.28 0 .5.22.5.5v4.5H13a.5.5 0 0 1 0 1H8.5V13a.5.5 0 0 1-1 0V8.5H3a.5.5 0 0 1 0-1h4.5V3c0-.28.22-.5.5-.5Z" />
  </svg>
);

const CleanHandIcon = () => (
  <svg viewBox="0 0 68.155 68.155" fill="none" className="ui-chat-composer__hand" aria-hidden="true">
    <path
      d="M52.5305 32.6557V24.8463C52.5305 22.1016 54.7555 19.8766 57.5001 19.8766C60.2448 19.8766 62.4698 22.1016 62.4698 24.8463V42.027C62.4698 53.3194 53.3154 62.4735 42.0233 62.4735H34.2388M22.7127 39.7552L15.94 31.8537C14.8314 30.5602 13.2129 29.8159 11.5094 29.8159H11.1235C8.11379 29.8159 5.67395 32.2558 5.67395 35.2655C5.67395 36.3412 5.99241 37.393 6.58919 38.2881L16.4118 53.0221C20.3482 58.9269 26.9753 62.4735 34.0719 62.4735"
      stroke="currentColor"
      strokeWidth="4.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M52.534 24.1378V16.3284C52.534 13.5837 50.3091 11.3588 47.5644 11.3588C44.8197 11.3588 42.5948 13.5837 42.5948 16.3284V29.8174"
      stroke="currentColor"
      strokeWidth="4.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M42.5958 29.8198V10.6513C42.5958 7.90661 40.3708 5.68163 37.6262 5.68163C34.8815 5.68163 32.6565 7.90661 32.6565 10.6513V28.4"
      stroke="currentColor"
      strokeWidth="4.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M32.6576 28.3975V16.3284C32.6576 13.5837 30.4326 11.3588 27.6879 11.3588C24.9433 11.3588 22.7183 13.5837 22.7183 16.3284V39.7567"
      stroke="currentColor"
      strokeWidth="4.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CleanShieldIcon = () => (
  <svg viewBox="0 0 66.543 66.543" fill="none" className="ui-chat-composer__shield" aria-hidden="true">
    <path
      d="M33.2482 22.1795V33.27"
      stroke="currentColor"
      strokeWidth="4.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M33.5966 43.67H33.2501M33.9432 43.67C33.9432 44.0529 33.633 44.3631 33.2501 44.3631C32.8672 44.3631 32.5569 44.0529 32.5569 43.67C32.5569 43.2871 32.8672 42.9768 33.2501 42.9768C33.633 42.9768 33.9432 43.2871 33.9432 43.67Z"
      stroke="currentColor"
      strokeWidth="4.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M58.202 31.0087V22.9595C58.202 18.4124 58.202 16.1389 57.0816 14.6555C55.9612 13.1722 53.4278 12.452 48.3612 11.0118C44.8995 10.0278 41.848 8.84228 39.41 7.76002C36.0859 6.28445 34.4237 5.54666 33.2484 5.54666C32.0728 5.54666 30.4109 6.28445 27.0868 7.76002C24.6487 8.84228 21.5973 10.0278 18.1357 11.0118C13.069 12.452 10.5356 13.1722 9.4152 14.6555C8.29475 16.1389 8.29475 18.4124 8.29475 22.9595V31.0087C8.29475 46.605 22.3319 55.9626 29.3498 59.6666C31.0331 60.5549 31.8748 60.9991 33.2484 60.9991C34.622 60.9991 35.4635 60.5549 37.1467 59.6666C44.1648 55.9626 58.202 46.605 58.202 31.0087Z"
      stroke="currentColor"
      strokeWidth="4.6"
      strokeLinecap="round"
    />
  </svg>
);

/* mic, chevron-down and arrow-up: Lucide (ISC, lucide.dev) */
const CleanMicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19v3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <rect x="9" y="2" width="6" height="13" rx="3" />
  </svg>
);

const CleanChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CleanArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
);

const CleanFolderIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 4.25C2 3.56 2.56 3 3.25 3h2.88c.33 0 .65.13.88.37L8.13 4.5h4.62c.69 0 1.25.56 1.25 1.25v.75H2V4.25Z" />
    <path d="M2 7.5h12v4.25c0 .69-.56 1.25-1.25 1.25h-9.5C2.56 13 2 12.44 2 11.75V7.5Z" opacity="0.72" />
  </svg>
);

/* sparkles, check and x: Lucide (ISC, lucide.dev) */
const CleanSparklesIcon = () => (
  <svg viewBox="0 0 24 24" {...cleanLine} aria-hidden="true">
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </svg>
);

const CleanTickIcon = () => (
  <svg viewBox="0 0 24 24" {...cleanLine} strokeWidth={2} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CleanCancelIcon = () => (
  <svg viewBox="0 0 24 24" {...cleanLine} aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M8.14 5.73a.38.38 0 0 1 0 .54L5.4 9a.38.38 0 0 1-.53-.53L7.34 6 4.88 3.53a.38.38 0 0 1 .53-.53l2.73 2.73Z" />
  </svg>
);

/** Unique ids for gradients, so several composers on one page don't clash */
const useSvgId = () => "ui-cc" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

const GmailLogo = () => {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 56.4108 44.8722" fill="none" aria-hidden="true">
      <path
        d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z"
        fill={`url(#${id}-0)`}
      />
      <path
        d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z"
        fill="#FC413D"
      />
      <path
        d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z"
        fill={`url(#${id}-1)`}
      />
      <defs>
        <linearGradient
          id={`${id}-0`}
          x1="50.3153"
          y1="5.76727"
          x2="50.3153"
          y2="44.8701"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60D673" />
          <stop offset="0.17" stopColor="#42C868" />
          <stop offset="0.39" stopColor="#0EBC5F" />
          <stop offset="0.62" stopColor="#00A9BB" />
          <stop offset="0.86" stopColor="#3C90FF" />
          <stop offset="1" stopColor="#3186FF" />
        </linearGradient>
        <linearGradient
          id={`${id}-1`}
          x1="6.04194e-05"
          y1="6.45153"
          x2="56.4107"
          y2="6.45153"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.08" stopColor="#FF63A0" />
          <stop offset="0.3" stopColor="#FC413D" />
          <stop offset="0.5" stopColor="#FC413D" />
          <stop offset="0.65" stopColor="#FC413D" />
          <stop offset="0.72" stopColor="#FC5C30" />
          <stop offset="0.86" stopColor="#FEB10C" />
          <stop offset="0.91" stopColor="#FEC700" />
          <stop offset="0.96" stopColor="#FFDB0F" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const SlackLogo = () => (
  <svg viewBox="0 0 49.883 49.877" fill="none" aria-hidden="true">
    <g transform="translate(0 0)">
      <path
        d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z"
        fill="#36C5F0"
      />
      <path
        d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z"
        fill="#36C5F0"
      />
    </g>
    <g transform="translate(26.28 0)">
      <path
        d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z"
        fill="#2EB67D"
      />
      <path
        d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z"
        fill="#2EB67D"
      />
    </g>
    <g transform="translate(0 26.28)">
      <path
        d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z"
        fill="#E01E5A"
      />
      <path
        d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z"
        fill="#E01E5A"
      />
    </g>
    <g transform="translate(26.28 26.28)">
      <path
        d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z"
        fill="#ECB22E"
      />
      <path
        d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z"
        fill="#ECB22E"
      />
    </g>
  </svg>
);

const ClickUpLogo = () => {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 49.7096 59.6884" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 45.9002L9.1618 38.8247C14.0602 45.1745 19.2307 48.1679 24.9455 48.1679C30.6603 48.1679 35.7401 45.2652 40.3663 38.9154L49.7096 45.8094C42.997 54.8805 34.6516 59.6882 24.9455 59.6882C15.3301 59.6882 6.89403 54.8805 0 45.9002Z"
        fill={`url(#${id}-0)`}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.9535 15.3301L8.62558 29.3903L1.09657 20.5914L25.0442 0L48.8105 20.5914L41.1908 29.2996L24.9535 15.3301Z"
        fill={`url(#${id}-1)`}
      />
      <defs>
        <linearGradient id={`${id}-0`} x1="0" y1="49.2666" x2="49.75" y2="49.2666" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8930FD" />
          <stop offset="1" stopColor="#49CCF9" />
        </linearGradient>
        <linearGradient
          id={`${id}-1`}
          x1="1.09231"
          y1="14.6901"
          x2="48.7603"
          y2="14.6901"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF02F0" />
          <stop offset="1" stopColor="#FFC800" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* Line icons that follow the text color */
const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* sparkles, check and x: Lucide (ISC, lucide.dev) */
const StdSparklesIcon = () => (
  <svg viewBox="0 0 24 24" {...line} aria-hidden="true">
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </svg>
);

const StdTickIcon = () => (
  <svg viewBox="0 0 24 24" {...line} strokeWidth={1.75} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const StdCancelIcon = () => (
  <svg viewBox="0 0 24 24" {...line} color="#737373" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/* Model logos */
const ClaudeLogo = () => (
  <svg viewBox="0 0 1200 1200" aria-hidden="true">
    <path
      fill="#D97757"
      d="M 233.959793 800.214905 L 468.644287 668.536987 L 472.590637 657.100647 L 468.644287 650.738403 L 457.208069 650.738403 L 417.986633 648.322144 L 283.892639 644.69812 L 167.597321 639.865845 L 54.926208 633.825623 L 26.577238 627.785339 L 3.3e-05 592.751709 L 2.73832 575.27533 L 26.577238 559.248352 L 60.724873 562.228149 L 136.187973 567.382629 L 249.422867 575.194763 L 331.570496 580.026978 L 453.261841 592.671082 L 472.590637 592.671082 L 475.328857 584.859009 L 468.724915 580.026978 L 463.570557 575.194763 L 346.389313 495.785217 L 219.543671 411.865906 L 153.100723 363.543762 L 117.181267 339.060425 L 99.060455 316.107361 L 91.248367 266.01355 L 123.865784 230.093994 L 167.677887 233.073853 L 178.872513 236.053772 L 223.248367 270.201477 L 318.040283 343.570496 L 441.825592 434.738342 L 459.946411 449.798706 L 467.194672 444.64447 L 468.080597 441.020203 L 459.946411 427.409485 L 392.617493 305.718323 L 320.778564 181.932983 L 288.80542 130.630859 L 280.348999 99.865845 C 277.369171 87.221436 275.194641 76.590698 275.194641 63.624268 L 312.322174 13.20813 L 332.8591 6.604126 L 382.389313 13.20813 L 403.248352 31.328979 L 434.013519 101.71814 L 483.865753 212.537048 L 561.181274 363.221497 L 583.812134 407.919434 L 595.892639 449.315491 L 600.40271 461.959839 L 608.214783 461.959839 L 608.214783 454.711609 L 614.577271 369.825623 L 626.335632 265.61084 L 637.771851 131.516846 L 641.718201 93.745117 L 660.402832 48.483276 L 697.530334 24.000122 L 726.52356 37.852417 L 750.362549 72 L 747.060486 94.067139 L 732.886047 186.201416 L 705.100708 330.52356 L 686.979919 427.167847 L 697.530334 427.167847 L 709.61084 415.087341 L 758.496704 350.174561 L 840.644348 247.490051 L 876.885925 206.738342 L 919.167847 161.71814 L 946.308838 140.29541 L 997.61084 140.29541 L 1035.38269 196.429626 L 1018.469849 254.416199 L 965.637634 321.422852 L 921.825562 378.201538 L 859.006714 462.765259 L 819.785278 530.41626 L 823.409424 535.812073 L 832.75177 534.92627 L 974.657776 504.724915 L 1051.328979 490.872559 L 1142.818848 475.167786 L 1184.214844 494.496582 L 1188.724854 514.147644 L 1172.456421 554.335693 L 1074.604126 578.496765 L 959.838989 601.449829 L 788.939636 641.879272 L 786.845764 643.409485 L 789.261841 646.389343 L 866.255127 653.637634 L 899.194702 655.409424 L 979.812134 655.409424 L 1129.932861 666.604187 L 1169.154419 692.537109 L 1192.671265 724.268677 L 1188.724854 748.429688 L 1128.322144 779.194641 L 1046.818848 759.865845 L 856.590759 714.604126 L 791.355774 698.335754 L 782.335693 698.335754 L 782.335693 703.731567 L 836.69812 756.885986 L 936.322205 846.845581 L 1061.073975 962.81897 L 1067.436279 991.490112 L 1051.409424 1014.120911 L 1034.496704 1011.704712 L 924.885986 929.234924 L 882.604126 892.107544 L 786.845764 811.48999 L 780.483276 811.48999 L 780.483276 819.946289 L 802.550415 852.241699 L 919.087341 1027.409424 L 925.127625 1081.127686 L 916.671204 1098.604126 L 886.469849 1109.154419 L 853.288696 1103.114136 L 785.073914 1007.355835 L 714.684631 899.516785 L 657.906067 802.872498 L 650.979858 806.81897 L 617.476624 1167.704834 L 601.771851 1186.147705 L 565.530212 1200 L 535.328857 1177.046997 L 519.302124 1139.919556 L 535.328857 1066.550537 L 554.657776 970.792053 L 570.362488 894.68457 L 584.536926 800.134277 L 592.993347 768.724976 L 592.429626 766.630859 L 585.503479 767.516968 L 514.22821 865.369263 L 405.825531 1011.865906 L 320.053711 1103.677979 L 299.516815 1111.812256 L 263.919525 1093.369263 L 267.221497 1060.429688 L 287.114136 1031.114136 L 405.825531 880.107361 L 477.422913 786.52356 L 523.651062 732.483276 L 523.328918 724.671265 L 520.590698 724.671265 L 205.288605 929.395935 L 149.154434 936.644409 L 124.993355 914.01355 L 127.973183 876.885986 L 139.409409 864.80542 L 234.201385 799.570435 L 233.879227 799.8927 Z"
    />
  </svg>
);

const ChatGPTLogo = () => (
  <svg viewBox="0 0 68.614 68.002" aria-hidden="true">
    <path
      fill="currentColor"
      d="M26.3166 24.7525V18.2923C26.3166 17.7482 26.5208 17.3401 26.9966 17.0684L39.9853 9.5882C41.7533 8.56821 43.8615 8.09244 46.0372 8.09244C54.1973 8.09244 59.3658 14.4167 59.3658 21.1486C59.3658 21.6245 59.3658 22.1686 59.2976 22.7127L45.8331 14.8243C45.0172 14.3486 44.2009 14.3486 43.385 14.8243L26.3166 24.7525ZM56.6454 49.9134V34.4766C56.6454 33.5244 56.2371 32.8444 55.4213 32.3685L38.3529 22.4403L43.9291 19.244C44.405 18.9723 44.8131 18.9723 45.289 19.244L58.2776 26.7242C62.018 28.9005 64.5338 33.5244 64.5338 38.0122C64.5338 43.1802 61.4739 47.9406 56.6454 49.9128V49.9134ZM22.3045 36.3131L16.7284 33.0492C16.2526 32.7775 16.0484 32.3692 16.0484 31.8251V16.8649C16.0484 9.58891 21.6245 4.08038 29.1729 4.08038C32.0293 4.08038 34.6809 5.03262 36.9255 6.7326L23.5292 14.485C22.7134 14.9608 22.3052 15.6408 22.3052 16.5932V36.3137L22.3045 36.3131ZM34.307 43.2491L26.3166 38.7611V29.2412L34.307 24.7532L42.2968 29.2412V38.7611L34.307 43.2491ZM39.4411 63.9219C36.5848 63.9219 33.9333 62.9697 31.6886 61.2699L45.0848 53.5173C45.9007 53.0415 46.3089 52.3615 46.3089 51.4091V31.6886L51.9533 34.9525C52.4291 35.2242 52.6333 35.6324 52.6333 36.1766V51.1369C52.6333 58.4128 46.9889 63.9214 39.4411 63.9214V63.9219ZM23.3245 48.7576L10.3358 41.2775C6.59541 39.1011 4.07967 34.4773 4.07967 29.9894C4.07967 24.7532 7.2078 20.0612 12.0356 18.0889V33.5933C12.0356 34.5455 12.4439 35.2255 13.2597 35.7014L30.2605 45.5613L24.6844 48.7576C24.2086 49.0293 23.8003 49.0293 23.3245 48.7576ZM22.5769 59.9099C14.8926 59.9099 9.24834 54.1297 9.24834 46.9895C9.24834 46.4454 9.31651 45.9013 9.38411 45.3572L22.7804 53.1097C23.5962 53.5856 24.4127 53.5856 25.2284 53.1097L42.2968 43.2498V49.71C42.2968 50.2541 42.0927 50.6622 41.6168 50.9339L28.6283 58.4141C26.8601 59.4341 24.752 59.9099 22.5762 59.9099H22.5769ZM39.4411 68.0017C47.6694 68.0017 54.5372 62.1538 56.1019 54.4013C63.718 52.4291 68.6141 45.2889 68.6141 38.0129C68.6141 33.2526 66.5743 28.6288 62.9021 25.2966C63.2421 23.8685 63.4462 22.4403 63.4462 21.0129C63.4462 11.2887 55.5578 4.01207 46.4454 4.01207C44.6098 4.01207 42.8416 4.28375 41.0735 4.89614C38.0129 1.90392 33.7968 0 29.1729 0C20.9447 0 14.0769 5.84782 12.5122 13.6003C4.89614 15.5725 0 22.7127 0 29.9887C0 34.749 2.03983 39.3728 5.71204 42.705C5.37205 44.1331 5.16797 45.5613 5.16797 46.9889C5.16797 56.713 13.0563 63.9895 22.1686 63.9895C24.0044 63.9895 25.7725 63.7179 27.5407 63.1055C30.6005 66.0977 34.8166 68.0017 39.4411 68.0017Z"
    />
  </svg>
);

/* Each icon in the look of the composer it sits in */
const lookIcon = (Standard: () => ReactNode, Clean: () => ReactNode) =>
  function Icon() {
    return useContext(LookContext) === "clean" ? <Clean /> : <Standard />;
  };
const PlusIcon = lookIcon(StdPlusIcon, CleanPlusIcon);
const HandIcon = lookIcon(StdHandIcon, CleanHandIcon);
const ShieldIcon = lookIcon(StdShieldIcon, CleanShieldIcon);
const MicIcon = lookIcon(StdMicIcon, CleanMicIcon);
const ChevronIcon = lookIcon(StdChevronIcon, CleanChevronIcon);
const ArrowUpIcon = lookIcon(StdArrowUpIcon, CleanArrowUpIcon);
const FolderIcon = lookIcon(StdFolderIcon, CleanFolderIcon);
const SparklesIcon = lookIcon(StdSparklesIcon, CleanSparklesIcon);
const TickIcon = lookIcon(StdTickIcon, CleanTickIcon);
const CancelIcon = lookIcon(StdCancelIcon, CleanCancelIcon);

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
.ui-chat-composer:where([data-look="standard"]),
.ui-chat-composer__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
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
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3-5: 14px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-z-dropdown: 30;
}
.ui-chat-composer:where([data-look="clean"]),
.ui-chat-composer__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
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
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3-5: 14px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-z-dropdown: 30;
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

/* Chat Composer – authored in design units (--u), so it scales with the composer width */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer {
  --tc-chat-composer-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));
  --tc-chat-composer-alert: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  --tc-chat-composer-alert-bg: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));

  --tc-chat-composer-load: 650ms; /* one shimmer sweep; loading runs two */
  --tc-chat-composer-swap: 620ms; /* gray layer switch; the label fades scale with it */
  --tc-chat-composer-ease-swap: cubic-bezier(0.72, 0, 0.1, 1);

  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 680px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body {
  /* 1 unit grows with the width up to 0.27px, so a wider composer keeps compact controls. It never drops below the
     size where the smallest (59.428-unit) labels are 13px (the type floor; the send button is then 24px), and both ends are in
     rem, so the user's font size scales it (WCAG 1.4.4) */
  --u: clamp(calc(0.8125rem / 59.428), calc(100cqw / var(--tc-chat-composer-span, 1900)), calc(0.27rem / 16));
  /* The gray tray frames the white card on every side, like the other components */
  --tc-chat-composer-frame: 20;
  --tc-chat-composer-inset: calc(var(--tc-chat-composer-frame) * var(--u));
  /* The card starts with one text line and grows by one more while typing (set from the script) */
  --tc-chat-composer-card-h: calc(453.576 + var(--tc-chat-composer-grow, 0));
  position: relative;
  /* card + 169 strip + the frame above and below */
  height: calc((var(--tc-chat-composer-card-h) + 169 + 2 * var(--tc-chat-composer-frame)) * var(--u));
  transition: height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  font-synthesis: none;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  text-align: left;
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body svg {
  display: block;
  max-width: none;
}
/* ---------- Gray layer ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__tray {
  position: absolute;
  inset: 0;
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  border-radius: calc(92.758 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__row {
  position: absolute;
  /* Shifted by the frame, so the rows keep lining up with the card's content */
  left: calc(84 * var(--u) + var(--tc-chat-composer-inset));
  display: flex;
  align-items: center;
  white-space: nowrap;
}
/* The strip next to the card is 169 units plus the frame, so the rows sit half a frame lower to stay centered */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__project {
  top: calc(50.4 * var(--u) + var(--tc-chat-composer-inset) / 2); /* text optically centered in the strip */
  left: calc(78.5 * var(--u) + var(--tc-chat-composer-inset)); /* the folder glyph has 5.5 units of air on the left */
  height: calc(67 * var(--u));
  gap: calc(26.752 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__connect {
  top: calc((var(--tc-chat-composer-card-h) + 50.4) * var(--u) + var(--tc-chat-composer-inset) * 1.5);
  transition: top var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  height: calc(68.155 * var(--u));
  gap: calc(27.213 * var(--u));
  border-radius: calc(24 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__label {
  position: relative;
  display: block;
  font-size: calc(60.453 * var(--u));
  line-height: calc(60.453 * var(--u));
  letter-spacing: calc(-0.5634 * var(--u));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__project .ui-chat-composer__label {
  font-size: calc(59.428 * var(--u));
  line-height: calc(59.428 * var(--u));
  letter-spacing: calc(-0.5539 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon {
  position: relative;
  flex: none;
  width: calc(68.155 * var(--u));
  height: calc(68.155 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon--folder {
  width: calc(67 * var(--u));
  height: calc(67 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon--chevron {
  width: calc(52 * var(--u));
  height: calc(52 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon > svg,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* Line icons draw with currentColor */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon > svg {
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logos {
  display: flex;
  align-items: center;
  gap: calc(27.213 * var(--u));
  height: calc(59.688 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo {
  position: relative;
  flex: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo--gmail {
  width: calc(56.411 * var(--u));
  height: calc(44.872 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo--slack {
  width: calc(49.883 * var(--u));
  height: calc(49.877 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo--clickup {
  width: calc(49.71 * var(--u));
  height: calc(59.688 * var(--u));
}
/* ---------- White text area ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__card {
  position: absolute;
  left: var(--tc-chat-composer-inset);
  top: var(--tc-chat-composer-inset);
  box-sizing: border-box;
  width: calc(100% - 2 * var(--tc-chat-composer-inset));
  height: calc(var(--tc-chat-composer-card-h) * var(--u));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  border: calc(4 * var(--u)) solid var(--tc-border-default, var(--_tc-border-default));
  border-radius: calc(66 * var(--u));
  box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control));
  overflow: clip;
  cursor: text;
  transition:
    transform var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap),
    height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__message {
  position: absolute;
  left: calc(66 * var(--u)) /* text starts 73 units from the card edge, like the reference */;
  right: calc(69 * var(--u));
  top: calc(83.2 * var(--u)); /* cap height sits 113 units below the card edge */
  box-sizing: border-box;
  height: calc((106.424 + var(--tc-chat-composer-grow, 0)) * var(--u));
  transition: height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  resize: none;
  overflow-y: auto;
  scrollbar-width: none;
  font: inherit;
  font-size: calc(73.396 * var(--u));
  line-height: calc(106.424 * var(--u));
  letter-spacing: calc(-1.4679 * var(--u));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  caret-color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__message::-webkit-scrollbar {
  display: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__message::placeholder {
  color: var(--tc-text-placeholder, var(--_tc-text-placeholder));
  opacity: 1;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar {
  position: absolute;
  left: calc(95.2 * var(--u)); /* bottom row centers sit 133 units from the edges */
  top: calc((282.476 + var(--tc-chat-composer-grow, 0)) * var(--u));
  height: calc(68.155 * var(--u));
  display: flex;
  align-items: center;
  gap: calc(46.678 * var(--u));
  transform-origin: 0 50%;
  transition:
    transform var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap),
    top var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
}
/* Right side: model picker, voice and send */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar--end {
  left: auto;
  right: calc(73 * var(--u));
  gap: calc(40 * var(--u));
  transform-origin: 100% 50%;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  display: flex;
  align-items: center;
  border-radius: calc(24 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  gap: calc(10 * var(--u));
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn svg,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model svg {
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: calc(112 * var(--u));
  height: calc(112 * var(--u));
  border-radius: 50%;
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)) !important;
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
  transition:
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send svg {
  width: calc(60 * var(--u));
  height: calc(60 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send:disabled {
  opacity: 0.18;
  cursor: default;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send:not(:disabled):active {
  transform: scale(0.94);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval {
  position: relative;
  display: flex;
  align-items: center;
  gap: calc(21.783 * var(--u));
  border-radius: calc(33.156 * var(--u));
  white-space: nowrap;
  transition: padding var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__wash {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-chat-composer-alert-bg);
  opacity: 0;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval .ui-chat-composer__icon > svg {
  transition:
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)),
    color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__hand {
  transform-origin: 50% 90%;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__shield {
  opacity: 0;
  transform: scale(0.4);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval-text {
  position: relative;
  display: grid;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval-text > span {
  grid-area: 1 / 1;
  font-size: calc(60.453 * var(--u));
  line-height: calc(60.453 * var(--u));
  letter-spacing: calc(-0.5634 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__request {
  transition:
    color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    filter var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__granted {
  color: var(--tc-chat-composer-alert);
  opacity: 0;
  filter: blur(8px);
  transition:
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    filter var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
/* Loading shimmer: a dark band sweeps once per --load across a copy of the label */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__card:has(.ui-chat-composer__message:focus-visible) {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body button:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
/* ---------- States ---------- */

/* Hover, only while actionable */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="idle"] .ui-chat-composer__connect:hover .ui-chat-composer__label,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval:hover .ui-chat-composer__request,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project:hover .ui-chat-composer__label,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model:hover .ui-chat-composer__label {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval:hover .ui-chat-composer__hand,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn:hover svg,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model:hover .ui-chat-composer__icon svg {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Loading */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo {
  animation: ui-chat-composer-hop var(--tc-chat-composer-load) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 2;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo--slack {
  animation-delay: var(--tc-duration-instant, var(--_tc-duration-instant));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo--clickup {
  animation-delay: var(--tc-duration-base, var(--_tc-duration-base));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__hand {
  animation: ui-chat-composer-wave var(--tc-chat-composer-load) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 2;
}
@keyframes ui-chat-composer-hop {
  0%,
  70%,
  100% {
    transform: translateY(0);
  }
  32% {
    transform: translateY(calc(-13 * var(--u)));
  }
}
@keyframes ui-chat-composer-wave {
  0%,
  76%,
  100% {
    transform: rotate(0deg);
  }
  18% {
    transform: rotate(16deg);
  }
  38% {
    transform: rotate(-10deg);
  }
  58% {
    transform: rotate(7deg);
  }
}
/* Apps connected: the card slides down, the gray layer switches from bottom to top.
   Label timings are fractions of --swap, so the whole switch speeds up or slows down together. */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__connect {
  transition:
    opacity calc(var(--tc-chat-composer-swap) * 0.55) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) calc(var(--tc-chat-composer-swap) * 0.38),
    transform calc(var(--tc-chat-composer-swap) * 0.75) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-chat-composer-swap) * 0.33);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__project {
  opacity: 0;
  transform: translateY(calc(-18 * var(--u)));
  transition:
    opacity calc(var(--tc-chat-composer-swap) * 0.23) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    transform calc(var(--tc-chat-composer-swap) * 0.55) var(--tc-chat-composer-ease-swap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__connect {
  opacity: 0;
  transform: translateY(calc(18 * var(--u)));
  pointer-events: none;
  transition:
    opacity calc(var(--tc-chat-composer-swap) / 3) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    transform calc(var(--tc-chat-composer-swap) * 2 / 3) var(--tc-chat-composer-ease-swap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project {
  opacity: 1;
  transform: none;
  transition:
    opacity calc(var(--tc-chat-composer-swap) / 2) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) calc(var(--tc-chat-composer-swap) * 0.15),
    transform calc(var(--tc-chat-composer-swap) * 0.8) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-chat-composer-swap) * 0.14);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__card {
  transform: translateY(calc(169 * var(--u)));
}
/* Approval granted: pill "Unrestricted access" */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__approval {
  padding: calc(22.104 * var(--u));
  cursor: default;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__wash {
  opacity: 1;
  transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__hand {
  opacity: 0;
  transform: scale(0.4) rotate(-14deg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__shield {
  opacity: 1;
  transform: none;
  transition:
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant)),
    transform var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-spring, var(--_tc-ease-spring)) var(--tc-duration-instant, var(--_tc-duration-instant));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__request {
  opacity: 0;
  filter: blur(8px);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__granted {
  opacity: 1;
  filter: blur(0);
  transition:
    opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant)),
    filter var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant));
}
/* A failed connect, approval or dictation, said under the composer */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__error {
  margin: var(--tc-space-2, var(--_tc-space-2)) 0 0;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: center;
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer *,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer *::after {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__hand {
    animation: none !important;
}
}
/* ---------- Pressed feedback for every button ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  transition: transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project:active,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn:active,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model:active {
  transform: scale(0.96);
}
/* ---------- Model button ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  overflow: clip;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face {
  display: inline-flex;
  align-items: center;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph] {
  animation: ui-chat-composer-model-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph] .ui-chat-composer__model-logo {
  animation: ui-chat-composer-logo-in var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
@keyframes ui-chat-composer-model-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(30%);
  }
}
@keyframes ui-chat-composer-logo-in {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-12deg);
  }
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-logo {
  display: grid;
  place-items: center;
  width: calc(50 * var(--u));
  height: calc(50 * var(--u));
  margin-right: calc(6 * var(--u));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-logo svg {
  width: 100%;
  height: 100%;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model[aria-expanded="true"] .ui-chat-composer__label {
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model[aria-expanded="true"] .ui-chat-composer__icon--chevron svg {
  transform: rotate(180deg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon--chevron svg {
  transition:
    transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)),
    color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* ---------- Model menu ----------
   Opening morphs the panel out of the corner next to the model button:
   a clip-path grows from a button-sized piece to the full panel. */
/* Moving the closed shape to the button happens instantly, otherwise the opening would start mid-way */
/* The rows fade in once the shape has opened up, and out first when closing */
/* ---------- Voice recording ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send svg {
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar--end {
  transition:
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
/* Heard words: the draft sits exactly on top of the text area */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__draft {
  position: absolute;
  left: calc(66 * var(--u));
  right: calc(69 * var(--u));
  top: calc(83.2 * var(--u));
  height: calc((106.424 + var(--tc-chat-composer-grow, 0)) * var(--u));
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  font-size: calc(73.396 * var(--u));
  line-height: calc(106.424 * var(--u));
  letter-spacing: calc(-1.4679 * var(--u));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  pointer-events: none;
  visibility: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__heard {
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__draft {
  visibility: visible;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message {
  color: transparent;
  caret-color: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message::placeholder {
  color: transparent;
}
/* Audio trace: silence is a dot, sound a bar – it scrolls in from the right */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__trace {
  display: flex;
  align-items: center;
  gap: calc(14 * var(--u));
  height: calc(68 * var(--u));
  margin-right: calc(10 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__trace > span {
  flex: none;
  width: calc(8 * var(--u));
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  background: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: height var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
/* Discard and confirm: white squares with the card's line, like the send button in size */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square {
  flex: none;
  display: grid !important;
  place-items: center;
  box-sizing: border-box;
  width: calc(112 * var(--u));
  height: calc(112 * var(--u));
  border: 0 !important;
  border-radius: calc(32 * var(--u)) !important;
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)) !important;
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)) !important;
  transition:
    box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square:hover {
  box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square:active {
  transform: scale(0.95);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square svg {
  width: calc(56 * var(--u));
  height: calc(56 * var(--u));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar--voice {
  gap: calc(24 * var(--u));
  opacity: 0;
  transform: translateY(calc(16 * var(--u)));
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__toolbar--end:not(.ui-chat-composer__toolbar--voice) {
  opacity: 0;
  transform: translateY(calc(-16 * var(--u)));
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__toolbar--voice {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph],
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph] .ui-chat-composer__model-logo {
    animation: none;
}
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
/* Colors and motion as variables – override them on .ui-chat-composer */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-chat-composer-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-chat-composer-load: 650ms; /* one shimmer sweep; loading runs two */
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body {
  position: relative;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body *,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body *::before,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body *::after { box-sizing: border-box; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-chat-composer__body) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body svg { display: block; flex: none; max-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body:has(.ui-chat-composer__message:focus-visible) { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* ---------- Writing area ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__write { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); cursor: text; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__field { position: relative; padding: 0 var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__draft {
  display: block;
  width: 100%;
  height: calc(var(--tc-chat-composer-lines, 1) * 20px);
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message {
  outline: 0;
  background: transparent;
  resize: none;
  overflow-y: auto;
  scrollbar-width: none;
  caret-color: var(--tc-accent, var(--_tc-accent));
  transition: height var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__draft { position: absolute; inset: 0 4px; width: auto; overflow: hidden; pointer-events: none; visibility: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__heard { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__draft { visibility: visible; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message { color: transparent; caret-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message::placeholder { color: transparent; }
/* ---------- Tools under the message ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__tools { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2, var(--_tc-space-2)); margin-top: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__group { display: flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__swap { display: grid; justify-items: end; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__swap > * { grid-area: 1 / 1; }
/* Ghost icon buttons: 28px, icon in the gray of the reference */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn svg:not([fill="none"]) { fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn:active { transform: scale(0.94); }
/* Request approval: the tab-button look – a hairline, gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: 28px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-icon { position: relative; width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-icon svg { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__hand { transform-origin: 50% 90%; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__shield { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); opacity: 0; transform: scale(0.4); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-text { position: relative; display: grid; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-text > span { grid-area: 1 / 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__request { transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), filter var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__granted { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); opacity: 0; filter: blur(6px); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), filter var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__approval { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-status-danger-border, var(--_tc-status-danger-border)); cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__hand { opacity: 0; transform: scale(0.4) rotate(-14deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__shield { opacity: 1; transform: none; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant)), transform var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-spring, var(--_tc-ease-spring)) var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__request { opacity: 0; filter: blur(6px); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__granted { opacity: 1; filter: none; transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant)), filter var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__hand { animation: ui-chat-composer-wave-clean var(--tc-chat-composer-load) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 2; }
/* Model: a quiet button – logo, name and a small chevron */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  height: 28px;
  padding: 0 var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-2, var(--_tc-space-2));
  overflow: clip;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model[aria-expanded="true"] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model:active { transform: scale(0.97); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-face { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-face[data-morph] { animation: ui-chat-composer-model-in-clean var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-face[data-morph] .ui-chat-composer__model-logo { animation: ui-chat-composer-logo-in-clean var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-logo { display: grid; place-items: center; width: 14px; height: 14px; color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-logo svg { width: 100%; height: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__chevron { display: grid; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__chevron svg { width: 14px; height: 14px; transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model[aria-expanded="true"] .ui-chat-composer__chevron svg { transform: rotate(180deg); }
/* Send: the dark chip of the reference; empty, it falls back to a gray tile */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  margin-left: var(--tc-space-0-5, var(--_tc-space-0-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)) !important;
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send:disabled { background: var(--tc-fill-default, var(--_tc-fill-default)) !important; color: var(--tc-text-disabled, var(--_tc-text-disabled)); cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send:not(:disabled):active { transform: scale(0.94); }
/* Recording: the trace, discard and keep take the place of the right group */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__group--end { transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__group--voice { gap: var(--tc-space-1-5, var(--_tc-space-1-5)); opacity: 0; transform: translateY(6px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__group--end:not(.ui-chat-composer__group--voice) { opacity: 0; transform: translateY(-6px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__group--voice { opacity: 1; transform: none; pointer-events: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__trace { display: flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); height: 20px; margin-right: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__trace > span { flex: none; width: 2px; border-radius: var(--tc-radius-full, var(--_tc-radius-full)); background: var(--tc-accent, var(--_tc-accent)); transition: height var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
/* Discard: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)) !important;
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button:active { transform: scale(0.94); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button svg { width: 16px; height: 16px; }
/* ---------- Last row: connect apps → select a project ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__foot {
  display: grid;
  height: 36px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  overflow: hidden;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row {
  grid-area: 1 / 1;
  align-self: center;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  height: 26px;
  padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), filter var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="idle"] .ui-chat-composer__connect:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__logos { display: flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__logo { position: relative; display: grid; place-items: center; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__logo svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__folder { width: 16px; height: 16px; color: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__folder svg { width: 100%; height: 100%; fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row-chevron { width: 12px; height: 12px; margin-left: -2px; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row-chevron svg { width: 100%; height: 100%; fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__project { opacity: 0; transform: translateY(10px); filter: blur(3px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__connect { opacity: 0; transform: translateY(-10px); filter: blur(3px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project { opacity: 1; transform: none; filter: none; pointer-events: auto; transition-delay: 0ms, 0ms, var(--tc-duration-quick, var(--_tc-duration-quick)), var(--tc-duration-quick, var(--_tc-duration-quick)), var(--tc-duration-quick, var(--_tc-duration-quick)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo { animation: ui-chat-composer-hop-clean var(--tc-chat-composer-load) var(--tc-ease-in-out, var(--_tc-ease-in-out)) 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo:nth-child(2) { animation-delay: var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo:nth-child(3) { animation-delay: var(--tc-duration-base, var(--_tc-duration-base)); }
/* Loading shimmer: a dark band sweeps across a copy of the label */
/* ---------- Model menu: grows out of the corner next to the model button ---------- */
/* A failed connect, approval or dictation, said under the composer */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__error {
  margin: var(--tc-space-2, var(--_tc-space-2)) 0 0;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  text-align: center;
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
@keyframes ui-chat-composer-hop-clean { 0%, 70%, 100% { transform: none; } 32% { transform: translateY(-3px); } }
@keyframes ui-chat-composer-wave-clean { 0%, 76%, 100% { transform: rotate(0deg); } 18% { transform: rotate(16deg); } 38% { transform: rotate(-10deg); } 58% { transform: rotate(7deg); } }
@keyframes ui-chat-composer-model-in-clean { from { opacity: 0; filter: blur(3px); transform: translateY(30%); } }
@keyframes ui-chat-composer-logo-in-clean { from { opacity: 0; transform: scale(0.6) rotate(-12deg); } }
/* Narrow containers: the approval button keeps just its icon */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval { padding: 0; width: 28px; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__foot { height: 42px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer *,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer *::after { animation: none !important; transition-duration: 1ms !important; transition-delay: 0ms !important; }
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
/* ---------- Model menu (both looks): the menu pattern tokens ----------
   Opening morphs the panel out of the corner next to the model button: a clip-path grows from a button-sized
   piece to the full panel. */
.ui-chat-composer__menu {
  --morph: var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized));
  position: absolute;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  width: 260px;
  max-width: calc(100cqw - 16px);
  transition: visibility 0s linear 0s;
}
.ui-chat-composer__menu[data-open="false"] {
  visibility: hidden;
  pointer-events: none;
  transition: visibility 0s linear var(--tc-duration-slow, var(--_tc-duration-slow));
}
.ui-chat-composer__menu-panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  outline: none;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  letter-spacing: 0;
  /* open: room around the panel so the shadow isn't clipped */
  clip-path: inset(-40px -40px -40px -40px round var(--tc-menu-radius, var(--_tc-menu-radius)));
  transition: clip-path var(--morph);
}
/* Moving the closed shape to the button happens instantly, otherwise the opening would start mid-way */
.ui-chat-composer__menu[data-placing="true"] .ui-chat-composer__menu-panel {
  transition: none !important;
}
.ui-chat-composer__menu[data-open="false"] .ui-chat-composer__menu-panel {
  clip-path: inset(var(--from-top) 0 var(--from-bottom) var(--from-left) round var(--from-radius));
  transition: clip-path var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-in-out, var(--_tc-ease-in-out));
}
/* The rows fade in once the shape has opened up, and out first when closing */
.ui-chat-composer__menu-panel > * {
  transition:
    opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) var(--tc-duration-instant, var(--_tc-duration-instant)),
    transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-instant, var(--_tc-duration-instant));
}
.ui-chat-composer__menu[data-open="false"] .ui-chat-composer__menu-panel > * {
  opacity: 0;
  transition: opacity var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-in, var(--_tc-ease-in));
}
.ui-chat-composer__menu[data-open="false"] .ui-chat-composer__option {
  transform: translateY(4px);
}
.ui-chat-composer__menu[data-open="false"][data-up="false"] .ui-chat-composer__option {
  transform: translateY(-4px);
}
/* The active row: a fill that glides between rows. With the keyboard it is always shown and gets the focus ring,
   since the list itself holds focus (aria-activedescendant) */
.ui-chat-composer__menu-fill {
  position: absolute;
  left: var(--tc-menu-padding, var(--_tc-menu-padding));
  right: var(--tc-menu-padding, var(--_tc-menu-padding));
  top: 0;
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  background: var(--tc-menu-item-hover, var(--_tc-menu-item-hover));
  pointer-events: none;
  transition:
    transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)),
    height var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
.ui-chat-composer__menu-fill[data-glide="false"] {
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate));
}
.ui-chat-composer__menu-panel:focus-visible .ui-chat-composer__menu-fill {
  opacity: 1 !important;
  box-shadow: inset 0 0 0 var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) var(--tc-focus-ring, var(--_tc-focus-ring));
}
.ui-chat-composer__option {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5, var(--_tc-space-2-5));
  min-height: var(--tc-menu-item-h, var(--_tc-menu-item-h));
  padding: 6px var(--tc-menu-item-px, var(--_tc-menu-item-px));
  border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius));
  cursor: pointer;
}
.ui-chat-composer__option-logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-chat-composer__option-logo svg {
  width: 100%;
  height: 100%;
}
.ui-chat-composer__option-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.ui-chat-composer__option-name {
  font-size: var(--tc-menu-item-font-size, var(--_tc-menu-item-font-size));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-chat-composer__option-desc {
  overflow: hidden;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Selected: accent name and a ✓ (not colour alone) */
.ui-chat-composer__option[aria-selected="true"] .ui-chat-composer__option-name {
  color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg));
}
.ui-chat-composer__option-check {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-menu-item-selected-fg, var(--_tc-menu-item-selected-fg));
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)),
    transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-spring, var(--_tc-ease-spring));
}
.ui-chat-composer__option-check svg {
  width: 100%;
  height: 100%;
}
.ui-chat-composer__option[aria-selected="true"] .ui-chat-composer__option-check {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .ui-chat-composer__menu-panel,
  .ui-chat-composer__menu-panel > *,
  .ui-chat-composer__menu-fill,
  .ui-chat-composer__option-check {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
/* ---------- Focus (both looks) ----------
   The message field shows the focus ring on its card while you type (WCAG 2.4.7); the field itself draws none */
.ui-chat-composer__message:focus-visible {
  outline: none;
}
/* ---------- Loading shimmer (both looks) ----------
   A band of brighter label sweeps twice across the label: the window slides one way and the copy inside it the
   other way, so only transform animates (composited) */
.ui-chat-composer__shimmer {
  position: relative;
}
.ui-chat-composer__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
}
.ui-chat-composer__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-chat-composer-shimmer);
}
.ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__connect .ui-chat-composer__shine,
.ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__request .ui-chat-composer__shine {
  opacity: 1;
  animation: ui-chat-composer-sweep var(--tc-chat-composer-load) linear 2 both;
}
.ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__connect .ui-chat-composer__shine > span,
.ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__request .ui-chat-composer__shine > span {
  animation: ui-chat-composer-sweep-text var(--tc-chat-composer-load) linear 2 both;
}
@keyframes ui-chat-composer-sweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes ui-chat-composer-sweep-text {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ui-chat-composer__shine {
    display: none;
  }
}
/* Standard, narrow: at the type floor the toolbars would meet – "Request approval" keeps just its icon (its name
   stays for screen readers), like Clean below 400px */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval-text,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__approval-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}
}
`;
