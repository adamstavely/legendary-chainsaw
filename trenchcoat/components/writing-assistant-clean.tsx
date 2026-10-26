"use client";

/*
 * Writing Assistant – a compact AI chat card, in a single self-contained file.
 * A soft pink-violet-blue glow behind a welcome line, suggestion chips, a prompt field and a mic button.
 * Pick a suggestion, type, or dictate: the words appear live in the field, and once you stop speaking the
 * finished text waits there for you to send. Replies stream in word by word.
 * Dictation uses the browser's speech recognition where available; with `demo` a short simulated take stands in.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: writing-assistant.tsx is Standard,
 * writing-assistant-clean.tsx is Clean). Clean is one white card: a header with the assistant's name, a welcome
 * line with suggestion chips, and the prompt row as the last row with a mic and a send button next to it. The
 * pink-violet-blue of Standard stays as a small accent – a gradient sparkle next to the name and a faint glow
 * behind the welcome line – and "Writing…" shimmers where Standard shows typing dots.
 */
// Generated from src/components/writing-assistant.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type FormEvent, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-wa";

/** One message of the conversation */
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in writing-assistant.tsx, Clean in writing-assistant-clean.tsx */
  look?: Look;
  name?: string;
  tagline?: string;
  /** Big line on the welcome screen */
  greeting?: string;
  suggestions?: string[];
  placeholder?: string;
  /**
   * Your answer for a message – return text or a promise of text. A rejected promise shows an error and lets
   * the message be sent again. `signal` aborts when the chat is reset or the component unmounts, so a request can
   * be cancelled. Without it a sample writer answers (and warns once, unless `demo` is set). `history` is the
   * conversation so far, ending with this message
   */
  respond?: (message: string, context: { signal: AbortSignal; history: ChatMessage[] }) => string | Promise<string>;
  /** The conversation (controlled) – read it, seed it or restore it; new messages are asked for through `onMessagesChange` */
  messages?: ChatMessage[];
  /** Starting conversation when `messages` isn't controlled */
  defaultMessages?: ChatMessage[];
  /** Called with the whole conversation whenever a message is added or the chat is reset */
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** Text in the prompt field (controlled) */
  draft?: string;
  /** Starting text in the prompt field when `draft` isn't controlled */
  defaultDraft?: string;
  onDraftChange?: (draft: string) => void;
  /**
   * "auto" uses real speech recognition when the browser has it and shows an error otherwise (or plays the
   * sample take with `demo`); "simulate" always plays a sample take
   */
  speech?: "auto" | "simulate";
  /**
   * Demo mode: the sample writer stands in for a missing `respond` without a warning, and dictation plays the
   * sample take where the browser has no speech recognition. For galleries and prototypes
   */
  demo?: boolean;
  /** Sample sentence for simulated dictation */
  dictation?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type WritingAssistantProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

type Message = ChatMessage;
const NO_MESSAGES: ChatMessage[] = [];

const sampleReply = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("remind"))
    return "Hi team, just a friendly nudge: the report is due this Friday. If anything is holding you up, let me know today and we'll sort it out together. Thanks!";
  if (m.includes("shorter") || m.includes("short"))
    return "Here's a tighter version: “Thanks for the quick turnaround – the new draft reads much better. Let's ship it Friday.”";
  if (m.includes("tone"))
    return "I softened the opening and swapped the direct ask for a question, so it sounds friendly but still clear about the deadline.";
  if (m.includes("reply"))
    return "Hi Sam, thanks for the update! Thursday works for me – I'll bring the revised numbers so we can decide on the spot.";
  if (m.includes("email") || m.includes("polish"))
    return "I fixed two typos, split the long second paragraph and moved your main ask to the first line, so it's the first thing they read.";
  return "Got it. Here's a first draft – tell me if it should sound more formal, shorter or more playful, and I'll adjust it.";
};

// Warns once per page (not per instance) when the sample writer stands in for a missing `respond`
let warnedSampleReplies = false;
const warnSampleReplies = () => {
  if (warnedSampleReplies) return;
  warnedSampleReplies = true;
  console.warn(
    "WritingAssistant: no respond handler – simulating replies. Pass `demo` to keep the simulation, or `respond` to wire it up. The simulation will be off by default in the next major version.",
  );
};

// What a recognition error means for the user; errors without a message (no speech, aborted) just stop listening
const dictationError = (error: string) =>
  error === "not-allowed" || error === "service-not-allowed"
    ? "Microphone access was blocked."
    : error === "network"
      ? "Dictation needs a network connection."
      : error === "audio-capture"
        ? "No microphone was found."
        : "";

// Minimal typing for the Web Speech API, which isn't in the DOM lib yet
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/** One line of the prompt and the field's padding: it grows up to four lines, then scrolls */
const FIELD: Record<Look, { line: number; pad: number }> = { standard: { line: 21, pad: 19 }, clean: { line: 20, pad: 8 } };

/** The head: the assistant's name (Clean: with a gradient sparkle), its tagline and New chat */
function Header({ clean, gradientId, name, tagline, chatting, onReset }: { clean: boolean; gradientId: string; name: string; tagline: string; chatting: boolean; onReset: () => void }) {
  return (
    <header className="ui-wa__head">
      <div className="ui-wa__id">
        <h3 className="ui-wa__name">
          {/* Clean keeps Standard's gradient as a small accent */}
          {clean && (
            <svg className="ui-wa__mark" viewBox="0 0 16 16" aria-hidden="true">
              <defs>
                <linearGradient id={gradientId} x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--tc-tone-pink-solid, var(--_tc-tone-pink-solid))" />
                  <stop offset="0.5" stopColor="var(--tc-tone-violet-solid, var(--_tc-tone-violet-solid))" />
                  <stop offset="1" stopColor="var(--tc-accent, var(--_tc-accent))" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#${gradientId})`}
                d="M8 1.5c.3 2.9 1.6 4.2 4.5 4.5-2.9.3-4.2 1.6-4.5 4.5-.3-2.9-1.6-4.2-4.5-4.5 2.9-.3 4.2-1.6 4.5-4.5Z"
              />
              <path
                fill={`url(#${gradientId})`}
                d="M12.25 10c.13 1.3.7 1.87 2 2-1.3.13-1.87.7-2 2-.13-1.3-.7-1.87-2-2 1.3-.13 1.87-.7 2-2Z"
              />
            </svg>
          )}
          {name}
        </h3>
        <p className="ui-wa__tagline">{tagline}</p>
      </div>
      <button type="button" className="ui-wa__new" aria-label="New chat" onClick={onReset} tabIndex={chatting ? 0 : -1}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {clean ? <path d="M12 5v14M5 12h14" /> : <path d="M12 5.5v13M5.5 12h13" />}
        </svg>
      </button>
    </header>
  );
}

/** The messages – the reply streaming in shows its first word, the rest is written in – or the welcome with suggestions */
function Conversation({
  listRef,
  messages,
  streamed,
  typing,
  clean,
  greeting,
  suggestions,
  onChip,
}: {
  listRef: Ref<HTMLDivElement>;
  messages: Message[];
  streamed: { id: string; words: number } | null;
  /** Waiting for the reply: typing dots (Standard) or a shimmering "Writing…" (Clean) */
  typing: boolean;
  clean: boolean;
  greeting: string;
  suggestions: string[];
  /** A suggestion was picked – it's sent, and the welcome (with the chip) goes away */
  onChip: (text: string) => void;
}) {
  const shownText = (m: Message) => (streamed?.id === m.id ? m.text.split(/\s+/).slice(0, streamed.words).join(" ") : m.text);

  return messages.length > 0 ? (
    // Not a live region: the reply streams in word by word – the status region below says it once, finished
    <div className="ui-wa__messages" ref={listRef}>
      {messages.map((m) => (
        <p key={m.id} className={`ui-wa__msg ui-wa__msg--${m.role}`} data-msg={m.id}>
          {shownText(m)}
        </p>
      ))}
      {typing && (
        <p className="ui-wa__msg ui-wa__msg--assistant ui-wa__typing" aria-hidden="true">
          {/* Standard: three typing dots · Clean: a shimmering "Writing…" */}
          {clean ? (
            <span className="ui-wa__shimmer" data-text="Writing…" aria-hidden="true">
              Writing…
            </span>
          ) : (
            <>
              <i />
              <i />
              <i />
            </>
          )}
        </p>
      )}
    </div>
  ) : (
    <div className="ui-wa__welcome">
      <p className="ui-wa__greeting">{greeting}</p>
      <div className="ui-wa__chips">
        {suggestions.map((s) => (
          <button key={s} type="button" className="ui-wa__chip" onClick={() => onChip(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The prompt: a field that grows up to four lines, the mic, and Send (Standard: inside the field, Clean: last) */
function PromptRow({
  look,
  inputRef,
  value,
  listening,
  busy,
  placeholder,
  onDraft,
  onSend,
  onMic,
}: {
  look: Look;
  inputRef: { current: HTMLTextAreaElement | null };
  /** The draft, or the words heard so far while listening */
  value: string;
  listening: boolean;
  busy: boolean;
  placeholder: string;
  onDraft: (draft: string) => void;
  onSend: () => void;
  onMic: () => void;
}) {
  const clean = look === "clean";
  // The field grows with its text up to four lines, then scrolls – and keeps the newest words in view
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const { line, pad } = FIELD[look];
    el.style.height = `${Math.min(el.scrollHeight, 4 * line + pad)}px`;
    if (listening || document.activeElement !== el) el.scrollTop = el.scrollHeight;
  }, [value, listening, look, inputRef]);

  // Standard: inside the field · Clean: after the mic, at the end of the last row
  const sendButton = !!value && !listening && (
    <button type="submit" className="ui-wa__send" aria-label="Send" disabled={busy}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {clean ? <path d="M12 19V5.5M6 11c0 0 4.4-6 6-6s6 6 6 6" /> : <path d="M12 18.5v-13M6.5 11 12 5.5l5.5 5.5" />}
      </svg>
    </button>
  );

  return (
    <form
      className="ui-wa__row"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSend();
      }}
    >
      <div className="ui-wa__field" data-listening={listening ? "" : undefined}>
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          readOnly={listening}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift + Enter starts a new line
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={listening ? "Listening…" : placeholder}
          aria-label="Message"
        />
        {!clean && sendButton}
      </div>
      <button
        type="button"
        className="ui-wa__mic"
        data-listening={listening ? "" : undefined}
        aria-pressed={listening}
        aria-label={listening ? "Stop dictation" : "Dictate"}
        onClick={onMic}
        disabled={busy && !listening}
      >
        <span className="ui-wa__pulse" aria-hidden="true" />
        {listening ? (
          <span className="ui-wa__wave" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3ZM6 11.5a6 6 0 0 0 12 0M12 17.5v3" />
          </svg>
        )}
      </button>
      {clean && sendButton}
    </form>
  );
}

export function WritingAssistant({
  look,
  name = "Quill",
  tagline = "Your writing companion.",
  greeting = "What should we write?",
  suggestions = ["Polish my email", "Make it shorter", "Fix the tone", "Draft a reply"],
  placeholder = "Ask anything…",
  respond,
  speech = "auto",
  demo = false,
  dictation = "Write a friendly reminder that the report is due on Friday",
  messages: messagesProp,
  defaultMessages = NO_MESSAGES,
  onMessagesChange,
  draft: draftProp,
  defaultDraft = "",
  onDraftChange,
  className,
  ref,
  ...rest
}: WritingAssistantProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  // Clean's sparkle fills with a gradient – one id per instance; message ids share the prefix
  const uid = useId();
  const gradientId = ROOT_CLASS + uid.replace(/[^a-zA-Z0-9_-]/g, "");
  const [messages, setMessages] = useControllable(messagesProp, defaultMessages, onMessagesChange);
  const [draft, setDraft] = useControllable(draftProp, defaultDraft, onDraftChange);
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // What screen readers hear: "Writing…" while waiting, then the whole reply once it's in – never word by word
  const [said, setSaid] = useState("");
  // The reply streaming in: React renders its first word, the timers write the rest into its text (see paintStream)
  const [streamed, setStreamed] = useState<{ id: string; words: number } | null>(null);
  const stream = useRef<{ id: string; parts: string[]; words: number } | null>(null);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const timers = useRef<number[]>([]);
  // Bumped by reset and unmount, so a reply that arrives afterwards is dropped
  const run = useRef(0);
  // Aborts the reply on its way when the chat is reset or the component unmounts
  const pending = useRef<AbortController | null>(null);
  const makeId = () => `${gradientId}-${nextId.current++}`;

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(
    () => () => {
      run.current++;
      timers.current.forEach((t) => window.clearTimeout(t));
      recRef.current?.abort();
      pending.current?.abort();
    },
    [],
  );

  // Keep the newest message in view
  const follow = () => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  useEffect(follow, [messages, streamed]);

  /** Writes the words streamed so far into the reply's text node – no commit per word */
  const paintStream = () => {
    const s = stream.current;
    const node = s && listRef.current?.querySelector(`[data-msg="${s.id}"]`)?.firstChild;
    if (!s || !node || node.nodeType !== Node.TEXT_NODE) return false;
    const text = s.parts.slice(0, s.words).join(" ");
    if (node.nodeValue === text) return false;
    node.nodeValue = text;
    return true;
  };
  // A commit while streaming renders the first word again – put the streamed words back before paint
  useLayoutEffect(() => {
    paintStream();
  });

  // When the prompt grows and the chat gets shorter, the messages move up with it instead of being cut off
  const chatting = messages.length > 0;
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let lastHeight = el.clientHeight;
    const ro = new ResizeObserver(() => {
      if (el.clientHeight < lastHeight) el.scrollTop = el.scrollHeight;
      lastHeight = el.clientHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [chatting]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setDraft("");
    setInterim("");
    setError("");
    const userMsg: Message = { id: makeId(), role: "user", text };
    let history: Message[] = [];
    setMessages((m) => (history = [...m, userMsg]));
    setBusy(true);
    setSaid("Writing…");
    const current = run.current;
    const controller = new AbortController();
    pending.current = controller;
    const answer = async () => {
      if (respond) return respond(text, { signal: controller.signal, history });
      if (!demo) warnSampleReplies();
      return sampleReply(text);
    };
    let reply: string;
    try {
      [reply] = await Promise.all([answer(), new Promise((r) => later(() => r(null), 700))]);
    } catch {
      if (pending.current === controller) pending.current = null;
      // The typing dots go and the field is free again, so the message can be sent once more
      if (run.current === current) {
        setBusy(false);
        setSaid("");
        setError("Couldn't get a reply. Try again.");
      }
      return;
    }
    if (pending.current === controller) pending.current = null;
    if (run.current !== current) return;
    const id = makeId();
    setMessages((m) => [...m, { id, role: "assistant", text: reply }]);
    const announce = () => setSaid(`${name}: ${reply}`);
    // Stream the reply in word by word
    const parts = reply.split(/\s+/);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStreamed(null);
      setBusy(false);
      announce();
      return;
    }
    // One commit to start (the first word), one to end; the words in between are written, not rendered
    stream.current = { id, parts, words: 1 };
    setStreamed({ id, words: 1 });
    const next = () => {
      const s = stream.current;
      if (!s || s.id !== id) return;
      if (s.words < parts.length) {
        s.words++;
        if (paintStream()) follow();
        later(next, 38);
        return;
      }
      later(() => {
        stream.current = null;
        setStreamed(null);
        setBusy(false);
        announce();
      }, 60);
    };
    later(next, 38);
  };

  /* ---------- Dictation ---------- */

  const finishDictation = (text: string) => {
    setListening(false);
    setInterim("");
    if (text.trim()) {
      // The words go into the field – you read them and send them yourself (nothing is sent on its own)
      setDraft(text.trim());
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const simulate = () => {
    setListening(true);
    setDraft("");
    const words = dictation.split(/\s+/);
    words.forEach((_, i) => later(() => setInterim(words.slice(0, i + 1).join(" ")), 260 + i * 170));
    later(() => finishDictation(dictation), 260 + words.length * 170 + 500);
  };

  const startListening = () => {
    if (busy) return;
    setError("");
    const Ctor =
      speech === "auto"
        ? ((window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
            .SpeechRecognition ??
          (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition)
        : undefined;
    if (!Ctor) {
      if (speech === "simulate" || demo) return simulate();
      return setError("Dictation isn't supported in this browser.");
    }
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    finalRef.current = "";
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(`${finalRef.current}${live}`);
    };
    rec.onerror = (e) => {
      // No mic access or no speech service: say so – never stand in a sample take, which would be sent as yours
      recRef.current = null;
      setListening(false);
      setInterim("");
      setError(dictationError(e.error));
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      recRef.current = null;
      finishDictation(finalRef.current);
    };
    recRef.current = rec;
    setDraft("");
    setInterim("");
    setListening(true);
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
      setError("Dictation couldn't start.");
    }
  };

  const stopListening = () => {
    if (recRef.current) recRef.current.stop();
  };

  const reset = () => {
    run.current++;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    recRef.current?.abort();
    recRef.current = null;
    pending.current?.abort();
    pending.current = null;
    setMessages(NO_MESSAGES);
    setDraft("");
    setInterim("");
    setListening(false);
    setBusy(false);
    setError("");
    setSaid("");
    stream.current = null;
    setStreamed(null);
    // New chat hides itself – focus goes to the field, where the next chat starts
    inputRef.current?.focus({ preventScroll: true });
  };

  const conversation = (
    <Conversation
      listRef={listRef}
      messages={messages}
      streamed={streamed}
      typing={busy && !streamed && messages[messages.length - 1]?.role === "user"}
      clean={clean}
      greeting={greeting}
      suggestions={suggestions}
      onChip={(text) => {
        // The chip goes with the welcome – focus moves to the field first
        inputRef.current?.focus({ preventScroll: true });
        send(text);
      }}
    />
  );

  const glow = (
    <div className="ui-wa__glow" aria-hidden="true">
      <span className="ui-wa__blob ui-wa__blob--pink" />
      <span className="ui-wa__blob ui-wa__blob--violet" />
      <span className="ui-wa__blob ui-wa__blob--blue" />
    </div>
  );

  const errorLine = error && (
    <p className="ui-wa__error" role="alert">
      {error}
    </p>
  );

  const prompt = (
    <PromptRow
      look={resolvedLook}
      inputRef={inputRef}
      value={listening ? interim : draft}
      listening={listening}
      busy={busy}
      placeholder={placeholder}
      onDraft={setDraft}
      onSend={() => send(draft)}
      onMic={listening ? stopListening : startListening}
    />
  );

  return (
    <div {...rest} ref={ref} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-chat={chatting ? "" : undefined}>
      <style href="ui-writing-assistant" precedence="default">
        {css}
      </style>

      <span className="ui-wa__sr" role="status">
        {said}
      </span>
      <Header clean={clean} gradientId={gradientId} name={name} tagline={tagline} chatting={chatting} onReset={reset} />

      {clean ? (
        // Clean: one body – a faint glow behind the messages and the prompt alike, the prompt as the last row
        <div className="ui-wa__body">
          {glow}
          <div className="ui-wa__content">{conversation}</div>
          {errorLine}
          {prompt}
        </div>
      ) : (
        // Standard: a soft glow in the library's gradient colors on the panel, the body on top of it
        <div className="ui-wa__panel">
          {glow}
          <div className="ui-wa__body">
            {conversation}
            {errorLine}
            {prompt}
          </div>
        </div>
      )}
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-wa:where([data-look="standard"]),
.ui-wa__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xl: 20px;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tone-pink-solid: light-dark(#ec4899, #f472b6);
  --_tc-tone-violet-solid: light-dark(#8b5cf6, #a78bfa);
}
.ui-wa:where([data-look="clean"]),
.ui-wa__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xl: 20px;
  --_tc-font-size-3xl: 24px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tone-pink-solid: light-dark(#ec4899, #f472b6);
  --_tc-tone-violet-solid: light-dark(#8b5cf6, #a78bfa);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-wa {
  /* the composer field and mic sit a step above the dark panel */
  --tc-writing-assistant-field-bg: light-dark(#ffffff, #2a2a2d);
  --tc-writing-assistant-bubble-bg: light-dark(rgba(255, 255, 255, 0.85), rgba(42, 42, 45, 0.85));
  /* The library's gradient: Pro pink, violet and accent blue */
  --tc-writing-assistant-glow: 0.28;
  --tc-writing-assistant-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 12px 32px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.3));
  width: 100%;
  max-width: 380px;
  padding: 8px;
  border: 1px solid var(--tc-border-default, var(--_tc-border-default));
  border-radius: 32px;
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-writing-assistant-shadow);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-wa */
:where([data-look="clean"], [data-look="clean"] *).ui-wa {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-writing-assistant-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-writing-assistant-pulse: light-dark(rgba(0, 96, 226, 0.22), rgba(77, 141, 255, 0.3));
  /* The classic gradient: Pro pink, violet and accent blue – only a small accent here */
  --tc-writing-assistant-glow: 0.13;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  overflow: hidden;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
.ui-wa *, .ui-wa *::before, .ui-wa *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-wa :focus-visible:not(textarea) { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-wa__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ---------- Header ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__head { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 18px 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__name { margin: 0; font-size: var(--tc-font-size-2xl, var(--_tc-font-size-2xl)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: -0.02em; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__tagline { margin: 3px 0 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__new {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important;
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-wa) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-wa) svg { display: block; flex: none; }
/* ---------- Header ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 12px 16px;
  border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__id { min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mark { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__tagline {
  margin: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* New chat: a ghost icon button that shows up once there's a conversation */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-wa[data-chat] .ui-wa__new { opacity: 1; transform: none; pointer-events: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__new:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__new svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
/* ---------- Panel with the glow ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__panel {
  position: relative;
  overflow: hidden;
  /* Card radius 32 minus its 8px padding, so the corners run parallel */
  border-radius: 24px;
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__glow { position: absolute; inset: 0; pointer-events: none; }
/* The glow sits in the lower part and keeps moving – clearly visible, never still */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(34px);
  opacity: var(--tc-writing-assistant-glow);
  animation: ui-wa-drift-a 6s ease-in-out 4 alternate;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob--pink { left: -18%; top: 46%; width: 60%; height: 42%; background: var(--tc-tone-pink-solid, var(--_tc-tone-pink-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob--violet { right: -16%; top: 36%; width: 56%; height: 44%; background: var(--tc-tone-violet-solid, var(--_tc-tone-violet-solid)); animation-name: ui-wa-drift-b; animation-duration: 7s; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob--blue { left: 22%; bottom: -16%; width: 64%; height: 42%; background: var(--tc-accent, var(--_tc-accent)); animation-name: ui-wa-drift-c; animation-duration: 5.5s; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa[data-chat] .ui-wa__blob { opacity: calc(var(--tc-writing-assistant-glow) * 0.6); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__body {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 18px;
  height: max(340px, 21.25rem);
  padding: 18px 14px 14px;
}
/* Welcome */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__welcome { display: grid; gap: 14px; padding: 0 4px; animation: ui-wa-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__greeting {
  margin: 0;
  font-size: var(--tc-font-size-3xl, var(--_tc-font-size-3xl));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
/* ---------- Body: content above, the prompt as the last row ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__body { position: relative; display: flex; flex-direction: column; height: max(340px, 21.25rem); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__content {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}
/* A faint glow in the lower part – it keeps drifting, and quiets down once you chat */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__glow { position: absolute; inset: 0; pointer-events: none; opacity: 1; transition: opacity var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa[data-chat] .ui-wa__glow { opacity: 0.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(36px);
  opacity: var(--tc-writing-assistant-glow);
  animation: ui-wa-drift-a 6s ease-in-out 4 alternate;
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob--pink { left: -18%; top: 54%; width: 58%; height: 40%; background: var(--tc-tone-pink-solid, var(--_tc-tone-pink-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob--violet { right: -16%; top: 46%; width: 54%; height: 42%; background: var(--tc-tone-violet-solid, var(--_tc-tone-violet-solid)); animation-name: ui-wa-drift-b; animation-duration: 7s; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob--blue { left: 22%; bottom: -22%; width: 62%; height: 40%; background: var(--tc-accent, var(--_tc-accent)); animation-name: ui-wa-drift-c; animation-duration: 5.5s; }
/* Welcome */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__welcome { position: relative; display: grid; gap: 12px; padding: 16px; animation: ui-wa-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__greeting { margin: 0; font-size: 15px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-wa__chips { display: flex; flex-wrap: wrap; gap: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__chip {
  height: 32px;
  padding: 0 13px;
  border: 0;
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary)) !important;
  backdrop-filter: blur(8px);
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__chip:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
/* Suggestion chips: the button-switch look – a hairline, gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__chip {
  padding: 4px 10px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: color-mix(in srgb, var(--tc-surface-raised, var(--_tc-surface-raised)) 70%, transparent);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__chip:hover { background: linear-gradient(var(--tc-fill-subtle, var(--_tc-fill-subtle)), var(--tc-fill-subtle, var(--_tc-fill-subtle))), color-mix(in srgb, var(--tc-surface-raised, var(--_tc-surface-raised)) 70%, transparent); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-wa__chip:active { transform: scale(0.97); }
/* Chat */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  margin: -4px -4px 0;
  padding: 4px;
  overflow-y: auto;
  scrollbar-width: none;
  /* Soft edges at the top and towards the prompt, so nothing ends in a hard cut */
  -webkit-mask-image: linear-gradient(transparent, #000 18px, #000 calc(100% - 16px), transparent);
  mask-image: linear-gradient(transparent, #000 18px, #000 calc(100% - 16px), transparent);
  padding-bottom: 14px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg {
  max-width: 86%;
  margin: 0;
  padding: 9px 13px;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: 1.45;
  white-space: pre-wrap;
  animation: ui-wa-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg--user { align-self: flex-end; border-radius: 18px 18px 6px 18px; background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg--assistant {
  align-self: flex-start;
  border-radius: 18px 18px 18px 6px;
  background: var(--tc-writing-assistant-bubble-bg);
  box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
  backdrop-filter: blur(10px);
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing { display: inline-flex; gap: 4px; padding: 13px 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tc-text-muted, var(--_tc-text-muted));
  animation: ui-wa-dot 1s ease-in-out infinite;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i:nth-child(2) { animation-delay: var(--tc-duration-fast, var(--_tc-duration-fast)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i:nth-child(3) { animation-delay: var(--tc-duration-slow, var(--_tc-duration-slow)); }
/* ---------- Prompt row ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__row { display: flex; align-items: flex-end; gap: 8px; }
/* A failed reply or dictation, said plainly above the prompt */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__error { position: relative; margin: -10px 6px 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: 1.4; color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Text wraps; the field grows up to four lines and the buttons stay at the bottom */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__field {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-height: 54px;
  padding: 7px 7px 7px 20px;
  border-radius: 27px;
  background: var(--tc-writing-assistant-field-bg);
  box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), 0 6px 18px rgba(0, 0, 0, 0.06), inset 0 -2px 6px rgba(0, 0, 0, 0.02);
  transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Focused: a slightly stronger gray stroke */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__field:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
/* Clean: the prompt row is the field – it shows the field focus ring while you type */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__row:has(textarea:focus) { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__field textarea {
  flex: 1;
  min-width: 0;
  height: 40px;
  margin: 0;
  padding: 9.5px 0;
  border: 0;
  background: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 14.5px;
  line-height: 21px;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  overflow-y: auto;
  scrollbar-width: none;
  /* Lines scrolled up fade out at the top edge instead of being cut */
  -webkit-mask-image: linear-gradient(transparent, #000 9px);
  mask-image: linear-gradient(transparent, #000 9px);
}
/* Chat */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__messages {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px 16px 14px;
  overflow-y: auto;
  scrollbar-width: none;
  /* Soft edges at the top and towards the prompt, so nothing ends in a hard cut */
  -webkit-mask-image: linear-gradient(transparent, #000 16px, #000 calc(100% - 12px), transparent);
  mask-image: linear-gradient(transparent, #000 16px, #000 calc(100% - 12px), transparent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__messages::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg {
  max-width: 86%;
  margin: 0;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: pre-wrap;
  overflow-wrap: break-word;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-wa-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg--user { align-self: flex-end; padding: 6px 10px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg--assistant { align-self: flex-start; max-width: 94%; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__typing { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* "Writing…": a dark band sweeps across a copy of the label */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__shimmer { position: relative; display: inline-block; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-writing-assistant-shimmer) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-wa-sweep 1.3s linear 3;
  pointer-events: none;
}
/* ---------- Prompt row: lies right in the card – no own fill, no line above ---------- */
/* A failed reply or dictation, said plainly above the prompt */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__error { position: relative; flex: none; margin: 0; padding: 4px 16px 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: 1.4; color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__row {
  position: relative;
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin: 0;
  padding: 6px 10px 10px 16px;
}
/* Text wraps; the field grows up to four lines and the buttons stay at the bottom */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__field { flex: 1; min-width: 0; display: flex; margin-right: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__field textarea {
  display: block;
  flex: 1;
  min-width: 0;
  height: 28px;
  margin: 0;
  padding: 4px 0;
  border: 0;
  background: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
  caret-color: var(--tc-accent-text, var(--_tc-accent-text));
  overflow-y: auto;
  scrollbar-width: none;
  /* Lines scrolled up fade out at the top edge instead of being cut */
  -webkit-mask-image: linear-gradient(transparent, #000 4px);
  mask-image: linear-gradient(transparent, #000 4px);
}
.ui-wa__field textarea::-webkit-scrollbar { display: none; }
.ui-wa__field textarea::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); opacity: 1; }
.ui-wa__field[data-listening] textarea { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tc-surface-inverse, var(--_tc-surface-inverse));
  color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)) !important;
  animation: ui-wa-pop var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send:disabled { opacity: 0.5; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 54px;
  height: 54px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tc-writing-assistant-field-bg);
  box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)), 0 6px 18px rgba(0, 0, 0, 0.06);
  transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic:active { transform: scale(0.95); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic:disabled { opacity: 0.6; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic svg {
  position: relative;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: var(--tc-text-primary, var(--_tc-text-primary));
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Listening: the button turns dark, three calm bars move inside and a soft ring breathes outwards */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic[data-listening] { background: var(--tc-text-primary, var(--_tc-text-primary)); box-shadow: 0 0 0 1px var(--tc-text-primary, var(--_tc-text-primary)), 0 6px 18px rgba(0, 0, 0, 0.12); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary, var(--_tc-text-primary)) 18%, transparent);
  opacity: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic[data-listening] .ui-wa__pulse { opacity: 1; animation: ui-wa-ring var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave { position: relative; display: flex; align-items: center; gap: 3px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave i {
  width: 3px;
  height: 100%;
  border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  transform: scaleY(0.35);
  animation: ui-wa-wave 1.1s ease-in-out infinite;
}
/* Send: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-inverse, var(--_tc-surface-inverse)) !important;
  color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
  transition: transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-wa-pop var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send:disabled { opacity: 0.4; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send:not(:disabled):active { transform: scale(0.94); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* Mic: a ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic:not(:disabled):hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic:not(:disabled):active { transform: scale(0.94); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic:disabled { opacity: 0.5; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic svg { position: relative; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
/* Listening: a light accent tile, three calm bars inside and a soft ring breathing outwards */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening],
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening]:hover { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__pulse { position: absolute; inset: 0; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening] .ui-wa__pulse { opacity: 1; animation: ui-wa-ring-clean var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) infinite; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave { position: relative; display: flex; align-items: center; gap: 2px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave i {
  width: 2px;
  height: 100%;
  border-radius: 1px;
  background: currentColor;
  transform: scaleY(0.35);
  animation: ui-wa-wave 1.1s ease-in-out infinite;
}
.ui-wa__wave i:nth-child(2) { animation-delay: -0.35s; }
.ui-wa__wave i:nth-child(3) { animation-delay: -0.7s; }
@keyframes ui-wa-in { from { opacity: 0; transform: translateY(6px); } }
@keyframes ui-wa-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-wa-ring { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary, var(--_tc-text-primary)) 16%, transparent); } 100% { box-shadow: 0 0 0 12px transparent; } }
@keyframes ui-wa-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
@keyframes ui-wa-ring-clean { 0% { box-shadow: 0 0 0 0 var(--tc-writing-assistant-pulse); } 100% { box-shadow: 0 0 0 7px transparent; } }
@keyframes ui-wa-wave { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
@keyframes ui-wa-dot { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
@keyframes ui-wa-drift-a {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(55%, -22%) scale(1.25); }
  100% { transform: translate(20%, 14%) scale(0.85); }
}
@keyframes ui-wa-drift-b {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-55%, 24%) scale(0.85); }
  100% { transform: translate(-22%, -16%) scale(1.25); }
}
@keyframes ui-wa-drift-c {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-45%, -26%) scale(1.2); }
  100% { transform: translate(30%, -10%) scale(0.88); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__welcome,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic[data-listening] .ui-wa__pulse,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave i,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave i { transform: scaleY(0.7); }
}
/* Narrow containers: a little less padding */
@container (max-width: 330px) {
:where([data-look="clean"], [data-look="clean"] *).ui-wa__head { padding-left: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__welcome,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__messages { padding-left: 12px; padding-right: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__row { padding-left: 12px; }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__chip { padding: 7px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__field textarea { padding: 7px 0; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__welcome,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening] .ui-wa__pulse,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave i,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__shimmer::after { animation: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave i { transform: scaleY(0.7); }
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
.ui-wa input:not([type="checkbox"]):not([type="radio"]):focus-visible,
.ui-wa textarea:focus-visible,
.ui-wa [contenteditable]:focus-visible { outline: none; }
/* Dark mode: follows a .dark class or data-theme="dark" on any ancestor, e.g. <html> */
:where(.dark, [data-theme="dark"]) :where([data-look="standard"], [data-look="standard"] *).ui-wa {
  --tc-writing-assistant-glow: 0.26; /* an opacity, not a colour */
}
/* Dark mode: follows a .dark class or data-theme="dark" on any ancestor, e.g. <html> */
:where(.dark, [data-theme="dark"]) :where([data-look="clean"], [data-look="clean"] *).ui-wa {
  --tc-writing-assistant-glow: 0.14; /* an opacity, not a colour */
}
`;
