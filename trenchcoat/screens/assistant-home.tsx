"use client";

/*
 * Assistant Home – the start screen of an AI workspace, in a single file.
 * Greeting, a chat input in a gray tray (folder and app shortcuts below it) and quick prompts.
 * className, other DOM props and `ref` go to the App Shell's root. Also exports the composer and the chat thread
 * (useChatThread, ChatMessages), which Agent Chat uses too.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Thinking State from Trenchcoat components; Glass Folder
 * from Trenchcoat illustrations; icons from lucide-react 1.55.0.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentPropsWithoutRef, type RefObject } from "react";
import { ThinkingState, type ThinkingStep } from "@/components/ui/thinking-state";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpIcon,
  BrainIcon,
  ChartColumnIcon,
  ChevronDownIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderOpenIcon,
  GlobeIcon,
  ImageIcon,
  MicIcon,
  PencilLineIcon,
  PlugIcon,
  PlusIcon,
  PresentationIcon,
  SparklesIcon,
  TableIcon,
  TelescopeIcon,
  UserPlusIcon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";
import { GlassFolder } from "@/components/ui/glass-folder";
import { AppShell, Dropdown, Icon, defaultProjects, type AppShellProps } from "@/components/ui/app-shell";

type NavItem = { label: string; icon: LucideIcon };

const suggestions: NavItem[][] = [
  [
    { label: "Company knowledge", icon: DatabaseIcon },
    { label: "Create document", icon: FileTextIcon },
    { label: "Create presentation", icon: PresentationIcon },
    { label: "Create table", icon: TableIcon },
  ],
  [
    { label: "Generate image", icon: ImageIcon },
    { label: "Deep research", icon: TelescopeIcon },
    { label: "Visualize data", icon: ChartColumnIcon },
  ],
];

const greetingFor = (hour: number) => (hour < 11 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!");
const noSubscribe = () => () => {};
/**
 * The greeting for the visitor's local time. The clock is read as an external value: the server (and hydration) render
 * a neutral "Hello!", the client its own hour – so the markup matches and no render reads the clock directly.
 */
const useGreeting = () =>
  useSyncExternalStore(
    noSubscribe,
    () => greetingFor(new Date().getHours()),
    () => "Hello!",
  );

type AssistantHomeScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref">;
export type AssistantHomeScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AssistantHomeScreenOwnProps> & AssistantHomeScreenOwnProps;

/** Prepared answers – picked by a keyword in the prompt; replace with your model's answer */
function replyFor(prompt: string): ChatReply {
  const p = prompt.toLowerCase();
  if (/document|doc|write/.test(p))
    return {
      steps: [
        { kind: "step", label: "Reading your request" },
        { kind: "step", label: "Checking Brand assets for tone of voice" },
        { kind: "step", label: "Outlining the document" },
      ],
      paragraphs: [
        "Here's an outline to start from – it follows your Tone-of-Voice guide:",
        "1. Summary – what this is about and why it matters now, in three sentences.",
        "2. Context – the numbers behind it, taken from Q3 Campaign.",
        "3. Proposal – what we do next, who owns it and by when.",
        "Shall I write the full draft into a new document in Q3 Campaign?",
      ],
    };
  if (/research|study|market/.test(p))
    return {
      steps: [
        { kind: "step", label: "Planning the research" },
        { kind: "step", label: "Reading Market-Study and Survey-Results" },
        { kind: "step", label: "Comparing the findings" },
      ],
      paragraphs: [
        "Two things stand out in your Research folder:",
        "Customers who buy twice do so within 30 days – after that, repeat orders drop by more than half.",
        "Price is rarely the reason to leave; slow delivery is named three times as often.",
        "Want a short report with sources, ready to share with the team?",
      ],
    };
  if (/table|data|visual|chart/.test(p))
    return {
      steps: [
        { kind: "step", label: "Reading Media-Budget and Results-Q2" },
        { kind: "step", label: "Matching spend to results" },
        { kind: "step", label: "Building the table" },
      ],
      paragraphs: [
        "I matched your Q2 spend against results per channel:",
        "Organic brought the most revenue at no media cost, paid ads the most new customers, and email the best return per dollar.",
        "Shall I add this as a table to Q3 Campaign, with a chart for the weekly trend?",
      ],
    };
  return {
    steps: [
      { kind: "step", label: "Reading your message" },
      { kind: "step", label: "Looking through Q3 Campaign and Brand assets" },
      { kind: "step", label: "Sorting ideas by effort and impact" },
    ],
    paragraphs: [
      `Here are a few directions for “${prompt}”:`,
      "1. Start with the problem customers name most often in reviews and support chats – it gives every idea a real reason to exist.",
      "2. Turn your strongest proof into the story: 412 orders of the Linen Overshirt last month make a good headline.",
      "3. Test two angles side by side for a week before you commit budget – desire-driven and problem–solution usually split clearly.",
      "Want me to turn one of these into a brief or a first draft?",
    ],
  };
}

export function AssistantHomeScreen(props: AssistantHomeScreenProps) {
  // start: greeting in the middle · leaving: greeting and chips fade · chat: thread on top, composer at the bottom
  const [phase, setPhase] = useState<"start" | "leaving" | "chat">("start");
  const chat = useChatThread(replyFor);
  const greeting = useGreeting();
  const slot = useRef<HTMLDivElement>(null);
  const from = useRef<DOMRect | null>(null);
  const thread = useRef<HTMLDivElement>(null);
  // The first message waits while the greeting fades out, then goes into the thread
  const [first, setFirst] = useState<string | null>(null);

  const send = (text: string) => {
    if (phase !== "start") return chat.send(text);
    from.current = slot.current?.getBoundingClientRect() ?? null;
    setFirst(text);
    setPhase("leaving");
  };
  const sendFirst = useRef(chat.send);
  sendFirst.current = chat.send;
  // A timer, cleared if the screen goes away first – never a state update after unmount
  useEffect(() => {
    if (phase !== "leaving" || first === null) return;
    const t = window.setTimeout(() => {
      setPhase("chat");
      sendFirst.current(first);
    }, 180);
    return () => window.clearTimeout(t);
  }, [phase, first]);

  // The composer glides from the middle down to its place at the bottom (FLIP – measured, then animated back)
  useLayoutEffect(() => {
    const el = slot.current;
    if (phase !== "chat" || !el) return;
    // A suggestion chip that was clicked is gone now: focus goes to the composer, not to <body>
    const active = document.activeElement;
    if (!active || active === document.body) el.querySelector<HTMLElement>(".ui-as-composer__field")?.focus({ preventScroll: true });
    if (!from.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      from.current = null;
      return;
    }
    const to = el.getBoundingClientRect();
    // Inside a scaled preview the measured pixels are scaled too
    const scale = to.width / el.offsetWidth || 1;
    const dy = (from.current.top - to.top) / scale;
    from.current = null;
    el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 720, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }, [phase]);

  return (
    <AppShell active="New chat" {...props}>
      <style href="ui-screen-assistant-home" precedence="default">
        {css}
      </style>
      <button type="button" className="ui-as-invite">
        <Icon icon={UserPlusIcon} size={14} />
        Invite people
      </button>

      <section className="ui-as-start" data-phase={phase}>
        {phase === "chat" && (
          <div ref={thread} className="ui-as-start__thread">
            <div className="ui-as-start__column">
              <ChatMessages messages={chat.messages} name="Assistant" scroller={thread} onDone={chat.finish} />
            </div>
          </div>
        )}
        {phase !== "chat" && <h1 className="ui-as-start__title">{greeting} What's next on your list?</h1>}
        <div ref={slot} className="ui-as-start__composer">
          <Composer onSend={send} busy={chat.busy} placeholder={phase === "chat" ? "Reply…" : undefined} />
        </div>
        {phase !== "chat" && (
          <div className="ui-as-chips">
            {suggestions.map((row, i) => (
              <div key={i} className="ui-as-chips__row">
                {row.map((s) => (
                  <button key={s.label} type="button" className="ui-as-chip" onClick={() => send(s.label)}>
                    <Icon icon={s.icon} size={15} />
                    {s.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

/* ---------- Chat ---------- */

/** An answer: thinking steps first, then the text, written out word by word */
export type ChatReply = { steps: ThinkingStep[]; paragraphs: string[] };
export type ChatMessage = { id: number; role: "user"; text: string } | { id: number; role: "assistant"; reply: ChatReply };

/** Messages of a chat with prepared answers; one answer at a time */
export function useChatThread(replyFor: (prompt: string) => ChatReply) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  // Ids from a counter, not the clock: unique however fast messages come
  const nextId = useRef(0);
  const send = (text: string) => {
    if (busy || !text.trim()) return;
    const id = (nextId.current += 2);
    setMessages((m) => [...m, { id, role: "user", text }, { id: id + 1, role: "assistant", reply: replyFor(text) }]);
    setBusy(true);
  };
  return { messages, busy, send, finish: () => setBusy(false) };
}

/** The thread: user bubbles on the right, answers with the library's Thinking State and streamed text */
export function ChatMessages({
  messages,
  name,
  scroller,
  onDone,
}: {
  messages: ChatMessage[];
  name: string;
  /** Scroll container that follows the newest text */
  scroller: RefObject<HTMLElement | null>;
  onDone: () => void;
}) {
  // Keep the newest text in view while it grows – unless someone scrolled up to read
  const follow = useCallback(() => {
    const el = scroller.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [scroller]);
  const count = messages.length;
  useEffect(() => {
    if (count) follow();
  }, [count, follow]);

  return (
    <>
      <style href="ui-screen-chat" precedence="default">
        {chatCss}
      </style>
      {messages.map((m) =>
        m.role === "user" ? (
          <p key={m.id} className="ui-as-msg-user">
            {m.text}
          </p>
        ) : (
          <Answer key={m.id} name={name} reply={m.reply} onGrow={follow} onDone={onDone} />
        ),
      )}
    </>
  );
}

function Answer({ name, reply, onGrow, onDone }: { name: string; reply: ChatReply; onGrow: () => void; onDone: () => void }) {
  const [writing, setWriting] = useState(false);
  const words = useMemo(() => reply.paragraphs.map((p) => p.split(" ")), [reply]);
  const paragraphs = useRef<(HTMLParagraphElement | null)[]>([]);
  // The latest callbacks, read when the text grows – the reveal doesn't restart when they change
  const grow = useRef(onGrow);
  grow.current = onGrow;
  const finish = useRef(onDone);
  finish.current = onDone;

  // Writes the answer out a few words at a time, like a model streaming. The words go straight into the paragraphs'
  // text, so the streaming costs no React render; with reduced motion the whole answer appears at once
  useEffect(() => {
    if (!writing) return;
    const total = words.reduce((n, w) => n + w.length, 0);
    const instant = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let count = instant ? total : 0;
    const show = () => {
      let left = count;
      words.forEach((w, i) => {
        const el = paragraphs.current[i];
        const shown = Math.max(0, Math.min(w.length, left));
        left -= w.length;
        if (!el) return;
        // A paragraph appears (and fades in) with its first words
        el.hidden = shown === 0;
        el.textContent = w.slice(0, shown).join(" ");
      });
      grow.current();
      if (count < total) return false;
      finish.current();
      return true;
    };
    if (show()) return;
    const t = window.setInterval(() => {
      count = Math.min(count + 2, total);
      if (show()) window.clearInterval(t);
    }, 45);
    return () => window.clearInterval(t);
  }, [writing, words]);

  return (
    <div className="ui-as-msg">
      <span className="ui-as-msg__who">
        <span className="ui-as-msg__avatar">
          <Icon icon={BrainIcon} size={12} />
        </span>
        {name}
      </span>
      <ThinkingState className="ui-as-msg__thinking" steps={reply.steps} stepMs={700} doneLabel="Ready" onDone={() => (setWriting(true), onGrow())} />
      {writing &&
        words.map((_, i) => (
          <p
            key={i}
            ref={(el) => {
              paragraphs.current[i] = el;
            }}
            className="ui-as-msg__p"
            hidden
          />
        ))}
    </div>
  );
}

const chatCss = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Chat thread shared by Assistant Home and Agent Chat */
.ui-as-msg-user {
  align-self: flex-end;
  max-width: 80%;
  margin: 0;
  padding: 9px 14px;
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-lg, 14px);
  line-height: var(--tc-line-height-relaxed, 22px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  animation: ui-as-msg-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-as-msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  font-size: var(--tc-font-size-lg, 14px);
  line-height: var(--tc-line-height-relaxed, 22px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  animation: ui-as-msg-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) var(--tc-duration-fast, 150ms) both;
}
.ui-as-msg__who { display: flex; align-items: center; gap: 8px; font-weight: var(--tc-font-weight-medium, 500); }
.ui-as-msg__avatar { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* The library's Thinking State at its own size; only its width is set, through its className */
.ui-as-msg .ui-as-msg__thinking { width: 100%; max-width: 440px; }
.ui-as-msg__p { margin: 0; animation: ui-as-msg-fade var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease) both; }
@keyframes ui-as-msg-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes ui-as-msg-fade { from { opacity: 0; } to { opacity: 1; } }
`;

/** Models in the composer's picker – the first one is selected */
const models = [
  { name: "Auto", description: "Picks the best model for each task", icon: WandSparklesIcon },
  { name: "Claude", description: "Thoughtful writing and code", icon: BrainIcon },
  { name: "ChatGPT", description: "Quick answers for everyday tasks", icon: SparklesIcon },
  { name: "Gemini", description: "Long documents and research", icon: TelescopeIcon },
];
const pluginList = [
  { label: "Web search", description: "Look things up while answering", icon: GlobeIcon },
  { label: "Canvas", description: "Write and edit side by side", icon: PencilLineIcon },
  { label: "Image generation", description: "Create images from a prompt", icon: ImageIcon },
];

/**
 * Chat input: white card in a gray tray, the tray holds the folder and app shortcuts.
 * Exported so other screens (Agent Chat) use the very same composer.
 */
export function Composer({
  placeholder = "Help me brainstorm ideas for...",
  onSend,
  busy,
  className,
}: {
  placeholder?: string;
  /** Called with the message when it is sent. May return a promise: sending waits while it runs, and if it rejects
   *  the message comes back into the field with the error under it, ready to send again */
  onSend?: (text: string) => void | Promise<unknown>;
  /** While an answer is being written, sending waits */
  busy?: boolean;
  className?: string;
}) {
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [model, setModel] = useState(models[0].name);
  const [plugins, setPlugins] = useState<string[]>([]);
  const [folder, setFolder] = useState<string | null>(null);
  const [apps, setApps] = useState<string[]>(["Gmail"]);
  const [files, setFiles] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const toggleIn = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  // Dictation: a short sample sentence appears after a moment – wire up real speech-to-text here
  useEffect(() => {
    if (!recording) return;
    const t = window.setTimeout(() => {
      setText((v) => (v ? v + " " : "") + "Draft a short update for the team about this week.");
      setRecording(false);
      field.current?.focus();
    }, 1800);
    return () => window.clearTimeout(t);
  }, [recording]);

  // Grows with the text, up to six lines
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 6 * 20)}px`;
  }, [text]);

  const submit = () => {
    if (!text.trim() || busy || sending) return;
    const message = text.trim();
    const attached = files;
    setText("");
    setFiles([]);
    setError(null);
    const result = onSend?.(message);
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    setSending(true);
    Promise.resolve(result).then(
      () => alive.current && setSending(false),
      (reason: unknown) => {
        if (!alive.current) return;
        setSending(false);
        // Back into the field, unless something new was typed meanwhile
        setText((t) => t || message);
        setFiles((list) => (list.length ? list : attached));
        setError(reason instanceof Error && reason.message ? reason.message : "Couldn't send. Try again.");
      },
    );
  };

  return (
    <form className={["ui-as-composer", className].filter(Boolean).join(" ")} onSubmit={(e) => (e.preventDefault(), submit())}>
      <style href="ui-screen-composer" precedence="default">
        {composerCss}
      </style>
      <div className="ui-as-composer__card">
        {files.length > 0 && (
          <div className="ui-as-attachments">
            {files.map((f) => (
              <span key={f} className="ui-as-attachment">
                <Icon icon={FileTextIcon} size={13} />
                {f}
                <button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles((list) => list.filter((x) => x !== f))}>
                  <Icon icon={XIcon} size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={field}
          className="ui-as-composer__field"
          rows={1}
          value={text}
          placeholder={placeholder}
          aria-label="Message"
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            // Enter while an IME is composing picks a candidate – it doesn't send
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="ui-as-composer__bar">
          <button type="button" className="ui-as-icon-btn" aria-label="Add file" onClick={() => fileInput.current?.click()}>
            <Icon icon={PlusIcon} size={15} />
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const picked = [...(e.target.files ?? [])].map((f) => f.name);
              setFiles((list) => [...list, ...picked.filter((n) => !list.includes(n))]);
              e.target.value = "";
            }}
          />
          <Dropdown
            title="Plugins"
            items={pluginList.map((p) => ({
              label: p.label,
              description: p.description,
              icon: p.icon,
              checked: plugins.includes(p.label),
              onSelect: () => setPlugins((list) => toggleIn(list, p.label)),
            }))}
            trigger={({ open, toggle }) => (
              <button type="button" className="ui-as-ghost" aria-expanded={open} data-active={plugins.length > 0 || undefined} onClick={toggle}>
                <Icon icon={PlugIcon} size={14} />
                {plugins.length ? `Plugins · ${plugins.length}` : "Plugins"}
              </button>
            )}
          />
          <span className="ui-as-composer__end">
            <Dropdown
              align="end"
              title="Model"
              items={models.map((m) => ({ label: m.name, description: m.description, icon: m.icon, checked: m.name === model, onSelect: () => setModel(m.name) }))}
              trigger={({ open, toggle }) => (
                <button type="button" className="ui-as-ghost ui-as-ghost--model" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                  <Icon icon={models.find((m) => m.name === model)?.icon ?? WandSparklesIcon} size={14} />
                  {model}
                  <Icon icon={ChevronDownIcon} size={12} />
                </button>
              )}
            />
            <button
              type="button"
              className="ui-as-icon-btn ui-as-mic"
              aria-label={recording ? "Stop dictation" : "Dictate"}
              aria-pressed={recording}
              onClick={() => setRecording((r) => !r)}
            >
              <Icon icon={MicIcon} size={15} />
            </button>
            <button type="submit" className="ui-as-send" aria-label="Send" aria-disabled={!text.trim() || busy || sending || undefined} aria-busy={sending || undefined}>
              <Icon icon={ArrowUpIcon} size={15} />
            </button>
          </span>
        </div>
        {error && (
          <p className="ui-as-composer__error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="ui-as-composer__tray">
        <Dropdown
          title="Work in a folder"
          items={[
            ...defaultProjects.map((name) => ({ label: name, icon: FolderOpenIcon, checked: folder === name, onSelect: () => setFolder(folder === name ? null : name) })),
          ]}
          trigger={({ open, toggle }) => (
            <button type="button" className="ui-as-tray-link" aria-expanded={open} onClick={toggle}>
              {/* The library's Glass Folder; it tips open while the link is hovered */}
              <span className="ui-as-tray-link__folder">
                <GlassFolder label="" />
              </span>
              {folder ?? "Work in a folder"}
            </button>
          )}
        />
        <Dropdown
          align="end"
          title="Apps"
          items={["Gmail", "Slack", "ClickUp"].map((name) => ({
            label: name,
            description: apps.includes(name) ? "Connected" : "Not connected",
            checked: apps.includes(name),
            onSelect: () => setApps((list) => toggleIn(list, name)),
          }))}
          trigger={({ open, toggle }) => (
            <button type="button" className="ui-as-tray-link ui-as-tray-link--apps" aria-expanded={open} onClick={toggle}>
              Connect apps
              <span className="ui-as-apps" aria-hidden="true">
                <GmailLogo />
                <SlackLogo />
                <ClickUpLogo />
              </span>
            </button>
          )}
        />
      </div>
    </form>
  );
}

/* Brand marks (Gmail, Slack, ClickUp) for the "Connect apps" shortcut */
/** Unique ids for gradients, so several logos on one page don't clash */
const useSvgId = () => "lg" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

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



/* ---------- Styles ---------- */

const css = /* css */ `
/* Assistant start screen – layout taken 1 : 1 from the reference, styled with Trenchcoat tokens */

.ui-as-invite {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-as-invite svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-invite:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-as-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(672px, calc(100% - 48px));
  /* Fills the main area, so heading, composer and suggestions sit in its exact vertical middle */
  min-height: 100%;
  margin: 0 auto;
  padding: 64px 0;
}

.ui-as-start__title {
  margin: 0;
  font-size: var(--tc-font-size-4xl, 28px);
  line-height: var(--tc-line-height-display, 32px);
  font-weight: var(--tc-font-weight-medium, 500);
  letter-spacing: -0.025em;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  text-align: center;
  text-wrap: balance;
}

.ui-as-start__composer { width: 100%; margin-top: 30px; }
.ui-as-start__title, .ui-as-chips { transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), transform var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease); }
.ui-as-start[data-phase="leaving"] .ui-as-start__title { opacity: 0; transform: translateY(-8px); }
.ui-as-start[data-phase="leaving"] .ui-as-chips { opacity: 0; transform: translateY(8px); }

/* Chat: the thread fills the area and scrolls, the composer waits at the bottom */
.ui-as-start[data-phase="chat"] { width: 100%; height: 100%; min-height: 0; padding: 0; justify-content: flex-end; }
.ui-as-start__thread { flex: 1; width: 100%; min-height: 0; overflow-y: auto; padding: 64px 32px 24px; }
.ui-as-start__column { display: flex; flex-direction: column; gap: 22px; max-width: 672px; margin: 0 auto; }
.ui-as-start[data-phase="chat"] .ui-as-start__composer { flex: none; width: min(672px, calc(100% - 64px)); margin: 0 0 24px; }

/* Suggestions */
.ui-as-chips { display: grid; gap: 7px; margin-top: 18px; }
.ui-as-chips__row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.ui-as-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px 0 11px;
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-sm, 12px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-chip svg { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-as-chip:hover { background: var(--tc-fill-strong, light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* Narrow: a little less room around the column; on a phone the composer runs almost edge to edge */
@container ui-as (max-width: 600px) {
  .ui-as-start { width: calc(100% - 24px); padding: 56px 0 40px; }
  .ui-as-start__title { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display, 32px); }
  .ui-as-start__composer { margin-top: 22px; }
  .ui-as-chips { margin-top: 14px; }
  .ui-as-chips__row { gap: 6px; }
  .ui-as-start__thread { padding: 56px 16px 16px; }
  .ui-as-start[data-phase="chat"] .ui-as-start__composer { width: calc(100% - 16px); margin-bottom: 8px; }
}
`;

const composerCss = /* css */ `
/* Composer: the tray recipe – a card on the gray tray, folder and apps in the tray below */
.ui-as-composer {
  /* The mic pulses while it listens – the mic button itself stops it */
  --tc-assistant-home-listen: 1000ms;
  width: 100%;
  padding: var(--tc-tray-inset, 4px);
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
}
.ui-as-composer__card {
  padding: 14px 10px 8px 14px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
/* The text field has no outline of its own: the card shows the focus ring while you type in it */
.ui-as-composer__card:has(.ui-as-composer__field:focus-visible) { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-as-composer__field {
  display: block;
  width: 100%;
  min-height: 20px;
  margin: 0;
  padding: 0;
  border: 0;
  resize: none;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-lg, 14px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-composer__field::placeholder { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
/* A send that failed: the message is back in the field, the reason under the bar */
.ui-as-composer__error { margin: 6px 0 0; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-as-composer__bar {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 19px 0 0 -6px;
}
.ui-as-composer__end { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.ui-as-ghost[data-active] { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-ghost[data-active] svg { color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-as-ghost--model > svg:last-child { margin-left: -2px; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-composer .ui-as-menu { min-width: 248px; }
.ui-as-composer__tray .ui-as-anchor { display: flex; }
/* Dictation: the mic turns red and pulses while it listens */
.ui-as-mic[aria-pressed="true"] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); animation: ui-as-listen var(--tc-assistant-home-listen) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite; }
@keyframes ui-as-listen { 50% { box-shadow: 0 0 0 4px var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); } }
.ui-as-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin: -4px 0 10px; }
.ui-as-attachment {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 4px 0 9px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  animation: ui-as-pop var(--tc-duration-moderate, 260ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-attachment > svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-attachment button { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm, 6px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-attachment button:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-ghost svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-ghost:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-as-ghost--model { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-send {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-left: 2px;
  border-radius: 50%;
  background: var(--tc-text-primary, light-dark(#171717, #ededed));
  color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), transform var(--tc-duration-fast, 150ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-send[aria-disabled="true"] { background: var(--tc-fill-strong, light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))); cursor: default; }
.ui-as-send:not([aria-disabled="true"]):active { transform: scale(0.94); }

.ui-as-composer__tray {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 37px;
  padding: 0 8px 0 6px;
}
.ui-as-tray-link {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 26px;
  padding: 0 6px;
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-xs-plus, 11.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-as-tray-link:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
/* Glass Folder from the library at icon size; hovering the link opens it like hovering the folder itself */
.ui-as-tray-link__folder { position: relative; flex: none; width: 16px; height: 14px; }
.ui-as-tray-link__folder .ui-fd { position: absolute; top: 50%; left: 50%; width: 40px; translate: -50% -50%; }
.ui-as-tray-link:hover .ui-fd-icon { transform: translate(-50%, -48%) scale(1.03); }
.ui-as-tray-link:hover .ui-fd-doc--left { transform: translate(32px, 70px) rotate(9deg); }
.ui-as-tray-link:hover .ui-fd-doc--right { transform: translate(286px, 76px) rotate(5deg); }
.ui-as-tray-link:hover .ui-fd-doc--middle { transform: translate(166px, 52px) rotate(-7deg); }
.ui-as-tray-link:hover .ui-fd-front {
  top: 24.8%;
  border-radius: 3cqw 3cqw 6.333cqw 6.333cqw;
  transform: translateZ(2.33cqw) rotateX(-9deg);
}
.ui-as-tray-link--apps { gap: 10px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-apps { display: flex; align-items: center; gap: 6px; }
.ui-as-apps svg { width: 13px; height: 13px; }
`;
