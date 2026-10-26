"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Button } from "@/components/ui/button";
import { ChatComposer } from "@/components/ui/chat-composer";

/*
 * AI Workspace – a complete assistant app: sidebar, new-chat welcome, conversations that stream in, and a projects
 * overview, in one file plus the Chat Composer (installed with it). Search chats, pin and rename projects, create
 * new ones, collapse the sidebar. Replace `respond` with your model call. The styles are injected below; buttons are
 * the library's Button (copy `button.tsx` alongside), everything else uses the shared pattern tokens.
 *
 * Keyboard: menus follow the menu pattern (focus moves in, arrows / Home / End, Esc and choosing return to the trigger,
 * Tab closes); the dialog keeps focus inside and gives it back to the button that opened it. When a control goes
 * away (sidebar toggles, the welcome screen, a closing menu) focus moves to its stable counterpart, never <body>.
 */

export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };
export type Conversation = { id: string; title: string; messages: ChatMessage[] };
export type Project = { id: string; name: string; description: string; updatedDaysAgo: number; pinned?: boolean };

type OwnProps = {
  userName?: string;
  userAvatar?: string;
  /** Workspace initial or logo in the top-left tile */
  workspace?: ReactNode;
  pinned?: string[];
  /** The conversations (controlled) – pass `onConversationsChange` with it. Leave undefined to start from `defaultConversations` */
  conversations?: Conversation[];
  defaultConversations?: Conversation[];
  /** Called with the whole list after a message is sent or answered, or a chat is deleted */
  onConversationsChange?: (conversations: Conversation[]) => void;
  /** The projects (controlled) – pass `onProjectsChange` with it. Leave undefined to start from `defaultProjects` */
  projects?: Project[];
  defaultProjects?: Project[];
  /** Called with the whole list after a project is created, renamed, pinned or unpinned */
  onProjectsChange?: (projects: Project[]) => void;
  /** Your model call – resolve with the full answer; it streams in word by word. A rejection shows an error with Try again */
  respond?: (message: string, history: ChatMessage[]) => Promise<string>;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type AiWorkspaceProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

type View = { kind: "welcome" } | { kind: "chat"; id: string } | { kind: "projects" };

let uid = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${(uid++).toString(36)}`;

/** Demo answers – swap for a real model via `respond` */
async function demoRespond(message: string) {
  const m = message.toLowerCase();
  await new Promise((r) => setTimeout(r, 900));
  if (/email|mail|announce/.test(m))
    return "Here's a short draft:\n\nSubject: Pricing is live\n\nHi everyone – our new plans are out today. Individual stays at $199 once, and teams now pay per seat. Existing customers keep their price. Reply here with any questions.";
  if (/summar|notes|interview/.test(m))
    return "Three themes stood out:\n\n1. People compare plans in a table before they read anything else.\n2. Seat pricing feels fair once the per-seat price is visible.\n3. Two interviewees asked for an annual invoice for their finance team.";
  if (/price|pricing|tier/.test(m))
    return "Keep three tiers. Free for discovery, Individual as a one-time purchase, Team priced per seat. Show the per-seat price right under the total – that's what people check first.";
  return "Good question. I'd start by writing down the outcome you want, then list the two or three steps that get you there. Want me to turn this into a checklist?";
}

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

export function AiWorkspace({
  userName = "Lena",
  userAvatar,
  workspace = "N",
  pinned = ["Writing assistant", "Data analyst", "Knowledge base"],
  conversations,
  defaultConversations = defaultChats,
  onConversationsChange,
  projects: projectsProp,
  defaultProjects: startProjects = defaultProjects,
  onProjectsChange,
  respond,
  className,
  ref,
  ...rest
}: AiWorkspaceProps) {
  const [chats, setChats] = useControllable(conversations, defaultConversations, onConversationsChange, "conversations");
  const [projects, setProjects] = useControllable(projectsProp, startProjects, onProjectsChange, "projects");
  const [view, setView] = useState<View>({ kind: "welcome" });
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null); // conversation that is answering
  const [failed, setFailed] = useState<{ chat: string; message: string; error: string } | null>(null);
  const [streaming, setStreaming] = useState<{ chat: string; msg: string } | null>(null);
  const [menu, setMenu] = useState<string | null>(null); // open popover id
  const [modal, setModal] = useState(false);
  const [current, setCurrent] = useState(() => projects[0]?.id ?? "");
  const messagesRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rootRefs = useRootRef(rootRef, ref);
  const mounted = useRef(true);
  // Where focus goes after the next commit – a selector inside the workspace
  const focusNext = useRef<string | null>(null);
  useLayoutEffect(() => {
    const selector = focusNext.current;
    if (!selector) return;
    focusNext.current = null;
    rootRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  });
  // The final answer (or "Thinking…") for screen readers – one narrow status region, mounted from the start
  const [announcement, setAnnouncement] = useState("");
  const toggleSidebar = (next: boolean) => {
    focusNext.current = next ? "[data-sidebar-open]" : "[data-sidebar-collapse]";
    setCollapsed(next);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // On narrow screens the sidebar is an overlay – start with it closed
  useEffect(() => {
    if ((rootRef.current?.offsetWidth ?? 1000) <= 720) setCollapsed(true);
  }, []);

  // Close popovers on outside click and Escape
  useEffect(() => {
    if (!menu && !modal) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-popover]")) setMenu(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(null);
      setModal(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [menu, modal]);

  const chat = view.kind === "chat" ? chats.find((c) => c.id === view.id) : undefined;

  /** Follow the conversation while it grows */
  const follow = useCallback((smooth = true) => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);
  useEffect(() => follow(), [follow, chat?.messages.length, busy, failed]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    // Sent from the welcome screen or the error's Try again – both go away, so focus moves to the reply box
    if ((document.activeElement as HTMLElement | null)?.closest(".ui-aw__welcome, .ui-aw__failed")) focusNext.current = ".ui-aw__composer--dock textarea";
    let chatId = chat?.id;
    const userMsg: ChatMessage = { id: id("m"), role: "user", text: message };
    if (!chatId) {
      chatId = id("c");
      const title = message.length > 38 ? `${message.slice(0, 36)}…` : message;
      setChats((list) => [{ id: chatId!, title, messages: [userMsg] }, ...list]);
      setView({ kind: "chat", id: chatId });
    } else {
      setChats((list) => list.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, userMsg] } : c)));
    }
    setFailed(null);
    setBusy(chatId);
    setAnnouncement("Thinking…");
    const history = [...(chat?.messages ?? []), userMsg];
    let answer: string;
    try {
      answer = await (respond ? respond(message, history) : demoRespond(message));
    } catch (error) {
      if (!mounted.current) return;
      setBusy(null);
      setAnnouncement("");
      setFailed({ chat: chatId, message, error: error instanceof Error && error.message ? error.message : "Something went wrong." });
      return;
    }
    if (!mounted.current) return;
    const msgId = id("m");
    setChats((list) =>
      list.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, { id: msgId, role: "assistant", text: answer }] } : c)),
    );
    setBusy(null);
    setAnnouncement(answer);
    // Stream the answer in, a few words at a time (Typed writes the words; React renders once at the start and once at the end)
    setStreaming({ chat: chatId, msg: msgId });
  };

  const q = search.trim().toLowerCase();
  const recentList = chats.filter((c) => !q || c.title.toLowerCase().includes(q));
  const pinnedList = [...pinned, ...projects.filter((p) => p.pinned).map((p) => p.name)].filter(
    (p) => !q || p.toLowerCase().includes(q),
  );

  // The picked project – the first one when the picked one is gone
  const currentProject = projects.find((p) => p.id === current) ?? projects[0];
  const crumb = view.kind === "projects" ? "All projects" : (chat?.title ?? "New chat");

  return (
    <>
      <style href="ui-ai-workspace" precedence="default">
        {css}
      </style>
      <div {...rest} ref={rootRefs} className={["ui-aw", className].filter(Boolean).join(" ")} data-collapsed={collapsed || undefined}>
        <Sidebar
          collapsed={collapsed}
          onCollapse={() => toggleSidebar(true)}
          workspace={workspace}
          search={search}
          onSearch={setSearch}
          view={view}
          onView={setView}
          pinned={pinnedList}
          recents={recentList}
          userName={userName}
          userAvatar={userAvatar}
        />

        {/* ---------- Main ---------- */}
        <main className="ui-aw__main">
          <header className="ui-aw__bar">
            {collapsed && <Button variant="ghost" size="sm" data-sidebar-open aria-label="Open sidebar" icon={<Icon name="panel" />} onClick={() => toggleSidebar(false)} />}
            <div className="ui-aw__crumbs" data-popover>
              <button type="button" className="ui-aw__crumb-btn" aria-haspopup="menu" aria-expanded={menu === "project"} onClick={() => setMenu(menu === "project" ? null : "project")}>
                <span className="ui-aw__muted">{currentProject?.name ?? "Workspace"}</span>
                <span className="ui-aw__slash">/</span>
                <span className="ui-aw__ellipsis">{crumb}</span>
                <Icon name="chevronDown" size={14} />
              </button>
              {menu === "project" && (
                <Menu label="Switch project" onClose={() => setMenu(null)}>
                  <p className="ui-aw__menu-title" aria-hidden="true">
                    Switch project
                  </p>
                  {projects.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={p.id === currentProject?.id}
                      className="ui-aw__menu-item"
                      onClick={() => {
                        setCurrent(p.id);
                        setMenu(null);
                      }}
                    >
                      {p.name}
                      {p.id === currentProject?.id && <Icon name="check" size={14} />}
                    </button>
                  ))}
                </Menu>
              )}
            </div>
            <div className="ui-aw__more" data-popover>
              <Button
                variant="ghost"
                size="sm"
                aria-label="More"
                aria-haspopup="menu"
                aria-expanded={menu === "more"}
                icon={<Icon name="moreH" />}
                onClick={() => setMenu(menu === "more" ? null : "more")}
              />
              {menu === "more" && (
                <Menu label="More" right onClose={() => setMenu(null)}>
                  <button type="button" role="menuitem" className="ui-aw__menu-item" onClick={() => setMenu(null)}>
                    Share chat
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="ui-aw__menu-item ui-aw__danger"
                    disabled={!chat}
                    onClick={() => {
                      if (chat) setChats((list) => list.filter((c) => c.id !== chat.id));
                      setView({ kind: "welcome" });
                      setMenu(null);
                    }}
                  >
                    Delete chat
                  </button>
                </Menu>
              )}
            </div>
          </header>

          {view.kind === "welcome" && (
            <section className="ui-aw__welcome" key="welcome">
              <h2 className="ui-aw__hello">Hello {userName}</h2>
              <p className="ui-aw__sub">What can I help you with today?</p>
              <div className="ui-aw__composer">
                <ChatComposer placeholder="How can I help you today?" onSend={(text) => send(text)} />
              </div>
              <div className="ui-aw__starters">
                {["Summarize my interview notes", "Draft the pricing announcement email", "Compare our pricing tiers"].map((s) => (
                  <button key={s} type="button" className="ui-aw__starter" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="ui-aw__disclaimer">AI can make mistakes – please double-check important answers.</p>
            </section>
          )}

          {view.kind === "chat" && chat && (
            <section className="ui-aw__chat" key={chat.id}>
              <div className="ui-aw__messages" ref={messagesRef}>
                {chat.messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="ui-aw__msg ui-aw__msg--user">
                      <p>{m.text}</p>
                    </div>
                  ) : (
                    <div key={m.id} className="ui-aw__msg ui-aw__msg--ai">
                      <span className="ui-aw__mark" aria-hidden="true" />
                      <div className="ui-aw__ai-body">
                        {streaming?.msg === m.id ? (
                          <Typed text={m.text} onProgress={() => follow(false)} onDone={() => setStreaming(null)} />
                        ) : (
                          <>
                            <p>{m.text}</p>
                            <MessageActions text={m.text} onRetry={() => send(chat.messages.filter((x) => x.role === "user").at(-1)?.text ?? "")} />
                          </>
                        )}
                      </div>
                    </div>
                  ),
                )}
                {busy === chat.id && (
                  <div className="ui-aw__msg ui-aw__msg--ai">
                    <span className="ui-aw__mark ui-aw__mark--busy" aria-hidden="true" />
                    <p className="ui-aw__thinking">Thinking…</p>
                  </div>
                )}
                {failed?.chat === chat.id && (
                  <div className="ui-aw__msg ui-aw__msg--ai ui-aw__failed" role="alert">
                    <span className="ui-aw__mark" aria-hidden="true" />
                    <div className="ui-aw__ai-body">
                      <p className="ui-aw__error">No answer – {failed.error}</p>
                      <div className="ui-aw__actions">
                        <Button variant="secondary" size="sm" onClick={() => send(failed.message)}>
                          Try again
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="ui-aw__composer ui-aw__composer--dock">
                <ChatComposer placeholder="Reply…" onSend={(text) => send(text)} />
                <p className="ui-aw__disclaimer">AI can make mistakes – please double-check important answers.</p>
              </div>
            </section>
          )}

          {view.kind === "projects" && <ProjectsView projects={projects} setProjects={setProjects} menu={menu} setMenu={setMenu} onCreate={() => setModal(true)} />}

          <p className="ui-aw__sr" role="status">
            {announcement}
          </p>

          <CreateProjectDialog
            open={modal}
            onClose={() => setModal(false)}
            onCreate={(name) => {
              const p: Project = { id: id("p"), name, description: "New project – add files and chats to it", updatedDaysAgo: 0 };
              setProjects((list) => [p, ...list]);
              setModal(false);
            }}
          />
        </main>
      </div>
    </>
  );
}

/** The sidebar: search, New chat and Projects, pinned items, recent chats and the signed-in person */
function Sidebar({
  collapsed,
  onCollapse,
  workspace,
  search,
  onSearch,
  view,
  onView,
  pinned,
  recents,
  userName,
  userAvatar,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  workspace: ReactNode;
  search: string;
  onSearch: (search: string) => void;
  view: View;
  onView: (view: View) => void;
  pinned: string[];
  recents: Conversation[];
  userName: string;
  userAvatar?: string;
}) {
  return (
    <aside className="ui-aw__side" aria-label="Workspace" inert={collapsed}>
      <div className="ui-aw__side-head">
        <span className="ui-aw__ws">{workspace}</span>
        <Button variant="ghost" size="sm" data-sidebar-collapse aria-label="Collapse sidebar" icon={<Icon name="chevronLeft" />} onClick={onCollapse} />
      </div>
      <label className="ui-aw__search">
        <Icon name="search" size={15} />
        <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search chats…" aria-label="Search chats" />
      </label>
      <nav className="ui-aw__nav">
        <button type="button" className="ui-aw__item" aria-current={view.kind === "welcome" || undefined} onClick={() => onView({ kind: "welcome" })}>
          <Icon name="plus" />
          New chat
        </button>
        <button type="button" className="ui-aw__item" aria-current={view.kind === "projects" || undefined} onClick={() => onView({ kind: "projects" })}>
          <FolderIcon />
          Projects
        </button>
      </nav>

      {pinned.length > 0 && (
        <>
          <p className="ui-aw__group">Pinned</p>
          <div className="ui-aw__nav">
            {pinned.map((p) => (
              <button key={p} type="button" className="ui-aw__item" onClick={() => onView({ kind: "welcome" })}>
                <PinIcon />
                <span className="ui-aw__ellipsis">{p}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="ui-aw__group">Recents</p>
      <div className="ui-aw__nav ui-aw__recents">
        {recents.length === 0 && <p className="ui-aw__none">No chats match.</p>}
        {recents.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ui-aw__item ui-aw__item--plain"
            aria-current={(view.kind === "chat" && view.id === c.id) || undefined}
            onClick={() => onView({ kind: "chat", id: c.id })}
          >
            <span className="ui-aw__ellipsis">{c.title}</span>
          </button>
        ))}
      </div>

      <div className="ui-aw__user">
        {userAvatar ? <img src={userAvatar} alt="" width={24} height={24} /> : <span className="ui-aw__user-dot" aria-hidden="true">{userName[0]}</span>}
        <span>{userName}</span>
        <Button variant="ghost" size="sm" aria-label="Settings" icon={<Icon name="settings" />} />
      </div>
    </aside>
  );
}

/** The projects overview: search, sort, and a card per project with rename and pin */
function ProjectsView({
  projects,
  setProjects,
  menu,
  setMenu,
  onCreate,
}: {
  projects: Project[];
  setProjects: (next: (list: Project[]) => Project[]) => void;
  menu: string | null;
  setMenu: (menu: string | null) => void;
  onCreate: () => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  // A new project goes to the top, so show recent first again
  const [count, setCount] = useState(projects.length);
  if (count !== projects.length) {
    if (projects.length > count) setSort("recent");
    setCount(projects.length);
  }

  const shownProjects = useMemo(() => {
    const pq = projectQuery.trim().toLowerCase();
    return projects
      .filter((p) => !pq || `${p.name} ${p.description}`.toLowerCase().includes(pq))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : a.updatedDaysAgo - b.updatedDaysAgo));
  }, [projects, projectQuery, sort]);

  return (
    <section className="ui-aw__projects" key="projects">
      <div className="ui-aw__projects-head">
        <span className="ui-aw__tile">
          <FolderIcon />
        </span>
        <div>
          <h2 className="ui-aw__title">Projects</h2>
          <p className="ui-aw__sub ui-aw__sub--left">Keep chats, files and notes for each piece of work together.</p>
        </div>
        <Button className="ui-aw__create" data-create-project icon={<Icon name="plus" size={14} />} onClick={onCreate}>
          Create project
        </Button>
      </div>
      <label className="ui-aw__search ui-aw__search--wide">
        <Icon name="search" size={15} />
        <input type="search" value={projectQuery} onChange={(e) => setProjectQuery(e.target.value)} placeholder="Search projects…" aria-label="Search projects" />
      </label>
      <div className="ui-aw__list-head">
        <span>All projects ({shownProjects.length})</span>
        <div className="ui-aw__sort" data-popover>
          <button type="button" className="ui-aw__sort-btn" aria-haspopup="menu" aria-expanded={menu === "sort"} onClick={() => setMenu(menu === "sort" ? null : "sort")}>
            Sort by <strong>{sort === "recent" ? "Recent activity" : "Name"}</strong>
            <Icon name="chevronDown" size={14} />
          </button>
          {menu === "sort" && (
            <Menu label="Sort by" right onClose={() => setMenu(null)}>
              {(["recent", "name"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === s}
                  className="ui-aw__menu-item"
                  onClick={() => {
                    setSort(s);
                    setMenu(null);
                  }}
                >
                  {s === "recent" ? "Recent activity" : "Name"}
                  {sort === s && <Icon name="check" size={14} />}
                </button>
              ))}
            </Menu>
          )}
        </div>
      </div>
      <ul className="ui-aw__grid">
        {shownProjects.map((p) => (
          <li key={p.id} className="ui-aw__project">
            <div className="ui-aw__project-card">
              <div className="ui-aw__project-top">
                <FolderIcon />
                {renaming === p.id ? (
                  <input
                    className="ui-aw__rename"
                    autoFocus
                    defaultValue={p.name}
                    aria-label="Project name"
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== p.name) setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, name } : x)));
                      setRenaming(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing || (e.key !== "Enter" && e.key !== "Escape")) return;
                      e.preventDefault();
                      e.stopPropagation();
                      // The field goes away – focus returns to the card's options button (Enter keeps the name, Esc drops it)
                      if (e.key === "Escape") e.currentTarget.value = p.name;
                      e.currentTarget.closest(".ui-aw__project")?.querySelector<HTMLElement>(".ui-aw__dots")?.focus();
                    }}
                  />
                ) : (
                  <span className="ui-aw__project-name">{p.name}</span>
                )}
                {p.pinned && <span className="ui-aw__pinned"><PinIcon /></span>}
                <div className="ui-aw__card-menu" data-popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ui-aw__dots"
                    aria-label={`${p.name} options`}
                    aria-haspopup="menu"
                    aria-expanded={menu === p.id}
                    icon={<Icon name="moreV" />}
                    onClick={() => setMenu(menu === p.id ? null : p.id)}
                  />
                  {menu === p.id && (
                    <Menu label={`${p.name} options`} right onClose={() => setMenu(null)}>
                      <button
                        type="button"
                        role="menuitem"
                        className="ui-aw__menu-item"
                        onClick={() => {
                          setRenaming(p.id);
                          setMenu(null);
                        }}
                      >
                        <Icon name="pencil" size={14} />
                        Rename
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="ui-aw__menu-item"
                        onClick={() => {
                          setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, pinned: !x.pinned } : x)));
                          setMenu(null);
                        }}
                      >
                        <PinIcon />
                        {p.pinned ? "Unpin" : "Pin"}
                      </button>
                    </Menu>
                  )}
                </div>
              </div>
              <p className="ui-aw__project-desc">{p.description}</p>
            </div>
            <p className="ui-aw__project-foot">
              {p.updatedDaysAgo === 0 ? "Updated just now" : `Updated ${p.updatedDaysAgo} day${p.updatedDaysAgo === 1 ? "" : "s"} ago`}
            </p>
          </li>
        ))}
      </ul>
      {shownProjects.length === 0 && <p className="ui-aw__none ui-aw__none--center">No projects match your search.</p>}
    </section>
  );
}

/**
 * The Create project dialog – it stays mounted so it can fade in and out. Opening moves focus to the name field,
 * Tab stays inside, and closing gives focus back to the button that opened it.
 */
function CreateProjectDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const titleId = useId();
  const [projectName, setProjectName] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    const back = opener.current;
    opener.current = null;
    const active = document.activeElement;
    if (back?.isConnected && (!active || active === document.body || dialogRef.current?.contains(active))) back.focus({ preventScroll: true });
  }, [open]);
  const create = () => {
    const name = projectName.trim();
    if (!name) return;
    onCreate(name);
    setProjectName("");
  };
  const trap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>("input, button:not(:disabled)")];
    const first = all[0];
    const last = all[all.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };
  return (
    <>
      <div className="ui-aw__backdrop" data-open={open || undefined} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="ui-aw__dialog"
        data-open={open || undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        onKeyDown={trap}
      >
        <div className="ui-aw__dialog-card">
          <h3 id={titleId} className="ui-aw__dialog-title">
            Create project
          </h3>
          <input
            ref={inputRef}
            className="ui-aw__field"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && create()}
            placeholder="Project name"
            aria-label="Project name"
          />
        </div>
        <div className="ui-aw__dialog-foot">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!projectName.trim()} onClick={create}>
            Create
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * A popover menu with the menu pattern: focus moves to the checked (or first) item, arrows / Home / End move,
 * Esc closes; closing in any way while focus is inside returns it to the trigger (the [aria-haspopup] button next to it)
 */
function Menu({ label, right, onClose, children }: { label: string; right?: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>("[role^='menuitem']:not(:disabled)") ?? [])];
  useLayoutEffect(() => {
    const node = ref.current;
    (node?.querySelector<HTMLElement>("[aria-checked='true']") ?? items()[0])?.focus({ preventScroll: true });
    return () => {
      if (node?.contains(document.activeElement)) node.parentElement?.querySelector<HTMLElement>("[aria-haspopup]")?.focus({ preventScroll: true });
    };
  }, []);
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab") onClose();
  };
  return (
    <div ref={ref} className={right ? "ui-aw__menu ui-aw__menu--right" : "ui-aw__menu"} role="menu" aria-label={label} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

/**
 * An answer typing itself in, a few words every 40 ms. React renders the full text once (right on the server and for
 * screen readers that read it later); the timer writes the growing slice into the text node, so the workspace
 * doesn't re-render per step. Reduced motion shows it at once.
 */
function Typed({ text, onProgress, onDone }: { text: string; onProgress: () => void; onDone: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const latest = useRef({ onProgress, onDone });
  useLayoutEffect(() => {
    latest.current = { onProgress, onDone };
  });
  useLayoutEffect(() => {
    const node = ref.current?.firstChild;
    const words = text.split(/(\s+)/);
    if (!node || node.nodeType !== Node.TEXT_NODE || reduced()) {
      latest.current.onDone();
      return;
    }
    let shown = 0;
    node.nodeValue = "";
    const timer = window.setInterval(() => {
      shown += 3;
      node.nodeValue = words.slice(0, shown).join("");
      latest.current.onProgress();
      if (shown >= words.length) {
        window.clearInterval(timer);
        latest.current.onDone();
      }
    }, 40);
    return () => {
      window.clearInterval(timer);
      node.nodeValue = text;
    };
  }, [text]);
  return <p ref={ref}>{text}</p>;
}

const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The component's own ref and the caller's `ref` prop on one element */
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

function MessageActions({ text, onRetry }: { text: string; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div className="ui-aw__actions">
      <Button
        variant="ghost"
        size="sm"
        aria-label="Copy answer"
        icon={<Icon name={copied ? "check" : "copy"} size={15} />}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setCopied(false), 1400);
          } catch {
            /* clipboard not available – nothing is claimed */
          }
        }}
      />
      <Button variant="ghost" size="sm" aria-label="Ask again" icon={<Icon name="retry" size={15} />} onClick={onRetry} />
      <span className="ui-aw__sr" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

/* ---------- Data and icons ---------- */

const defaultChats: Conversation[] = [
  {
    id: "c1",
    title: "Summarize interview notes",
    messages: [
      { id: "m1", role: "user", text: "Summarize the notes from this week's customer interviews." },
      {
        id: "m2",
        role: "assistant",
        text: "Three themes stood out:\n\n1. People compare plans in a table before they read anything else.\n2. Seat pricing feels fair once the per-seat price is visible.\n3. Two interviewees asked for an annual invoice for their finance team.",
      },
    ],
  },
  { id: "c2", title: "Draft launch email", messages: [{ id: "m3", role: "user", text: "Draft a launch email for the new pricing." }, { id: "m4", role: "assistant", text: "Subject: Pricing is live\n\nHi everyone – our new plans are out today. Existing customers keep their price." }] },
  { id: "c3", title: "Rewrite onboarding copy", messages: [{ id: "m5", role: "user", text: "Make the onboarding copy shorter." }, { id: "m6", role: "assistant", text: "Here's a tighter version: “Create your first project – it takes a minute.”" }] },
  { id: "c4", title: "Plan sprint goals", messages: [{ id: "m7", role: "user", text: "Help me plan goals for the next sprint." }, { id: "m8", role: "assistant", text: "Pick one outcome per team and two stretch goals. Want a template?" }] },
];

const defaultProjects: Project[] = [
  { id: "p1", name: "Brand Refresh", description: "Logo, colors and type for the new identity", updatedDaysAgo: 2 },
  { id: "p2", name: "Customer Research", description: "Interview notes and survey results", updatedDaysAgo: 5 },
  { id: "p3", name: "Pricing Page", description: "Plans, copy and the comparison table", updatedDaysAgo: 7 },
  { id: "p4", name: "Mobile App", description: "Navigation patterns and offline mode", updatedDaysAgo: 10 },
  { id: "p5", name: "Help Center", description: "Guides, FAQs and release notes", updatedDaysAgo: 12 },
  { id: "p6", name: "Q4 Planning", description: "Goals, budgets and the launch calendar", updatedDaysAgo: 14 },
];

/* One consistent set on the usual 24px grid, 1.75 stroke – shapes after Lucide (ISC) */
const paths = {
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m20 20-4-4"],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronDown: ["m6 9 6 6 6-6"],
  check: ["M20 6 9 17l-5-5"],
  panel: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 3v18"],
  folder: ["M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"],
  pin: [
    "M12 17v5",
    "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1Z",
  ],
  pencil: [
    "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5Z",
    "m15 5 4 4",
  ],
  settings: [
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ],
  moreH: ["M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  moreV: ["M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  copy: ["M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
  retry: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
} as const;

const Icon = ({ name, size = 16 }: { name: keyof typeof paths; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
const FolderIcon = () => <Icon name="folder" />;
const PinIcon = () => <Icon name="pin" size={15} />;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is a token or a light-dark() fallback, so dark follows color-scheme – a .dark class,
   data-theme / data-tc-theme="dark" or the OS setting (data-tc-theme="system") */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }

.ui-aw {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  width: 100%;
  height: 640px;
  padding: 8px 8px 8px 0;
  overflow: hidden;
  container-type: inline-size;
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  border-radius: var(--tc-radius-3xl, 20px);
  box-shadow: 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
  transition: grid-template-columns var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)), padding var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-aw[data-collapsed] { grid-template-columns: 0px minmax(0, 1fr); padding-left: 8px; }
.ui-aw *, .ui-aw *::before, .ui-aw *::after { box-sizing: border-box; }
/* Only this file's own buttons – the Chat Composer and Button style themselves */
.ui-aw :where(button[class^="ui-aw__"]) { margin: 0; font: inherit; color: inherit; cursor: pointer; }
.ui-aw button[class^="ui-aw__"]:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-aw__ellipsis { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; min-width: 0; }
.ui-aw__muted { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aw__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Sidebar */
.ui-aw__side {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 6px 8px 4px;
  overflow: hidden;
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease);
}
.ui-aw[data-collapsed] .ui-aw__side { opacity: 0; }
.ui-aw__side-head { display: flex; align-items: center; justify-content: space-between; height: 40px; padding: 0 2px 0 6px; }
/* The workspace tile: the primary action's flat ink */
.ui-aw__ws {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-action-primary-bg, light-dark(#171717, #ededed));
  box-shadow: var(--tc-action-primary-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font-size: var(--tc-font-size-md, 13px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-action-primary-fg, light-dark(#ffffff, #111113));
}
/* Search: the field pattern on the sunken fill */
.ui-aw__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--tc-field-h, 36px);
  margin: 6px 0 8px;
  padding: 0 var(--tc-field-px, 12px);
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg-sunken, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-aw__search:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-aw__search:focus-within { background: var(--tc-field-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-aw__search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: var(--tc-field-font-size, 13px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aw__search input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-aw__search input::-webkit-search-cancel-button { display: none; }
.ui-aw__nav { display: grid; gap: 1px; }
.ui-aw .ui-aw__item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--tc-menu-item-h, 32px);
  padding: 0 10px;
  border: 0;
  border-radius: var(--tc-radius-md, 8px);
  background: transparent;
  font-size: var(--tc-font-size-md-plus, 13.5px);
  text-align: left;
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-aw__item svg { flex: none; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aw .ui-aw__item:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aw .ui-aw__item[aria-current] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-aw__group { margin: 16px 10px 4px; font-size: var(--tc-caption-font-size, 12px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); color: var(--tc-caption-color, light-dark(#646464, #9a9aa1)); }
.ui-aw__recents { overflow-y: auto; min-height: 0; flex: 1; align-content: start; scrollbar-width: none; }
.ui-aw__none { margin: 4px 10px; font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aw__none--center { text-align: center; margin-top: 24px; }
.ui-aw__user { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 2px 0 8px; font-size: var(--tc-font-size-md-plus, 13.5px); }
.ui-aw__user img, .ui-aw__user-dot { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.ui-aw__user-dot { display: grid; place-items: center; background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16))); font-size: var(--tc-font-size-xs, 11px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-aw__user span:not(.ui-aw__user-dot) { flex: 1; }

/* Main panel */
.ui-aw__main {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  border: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: var(--tc-radius-2xl, 16px);
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-aw__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 10px 0 12px;
  border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e));
}
.ui-aw__crumbs, .ui-aw__more, .ui-aw__sort, .ui-aw__card-menu { position: relative; }
.ui-aw__crumbs { min-width: 0; }
/* Menu triggers with a label: the ghost button's geometry and hover */
.ui-aw .ui-aw__crumb-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 8px;
  border: 0;
  border-radius: var(--tc-control-radius-sm, 8px);
  background: transparent;
  font-size: var(--tc-font-size-lg, 14px);
  font-weight: var(--tc-font-weight-medium, 500);
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-aw .ui-aw__crumb-btn:hover, .ui-aw .ui-aw__sort-btn:hover { background: var(--tc-action-ghost-bg-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-aw__crumb-btn svg { flex: none; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aw__slash { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); font-weight: var(--tc-font-weight-regular, 400); }
/* Project and chat name stay on one line each and shorten together when the bar gets narrow */
.ui-aw__crumb-btn > .ui-aw__muted { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-aw__more { margin-left: auto; }

.ui-aw__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: var(--tc-z-dropdown, 30);
  display: grid;
  gap: 2px;
  min-width: 190px;
  padding: var(--tc-menu-padding, 4px);
  border-radius: var(--tc-menu-radius, 12px);
  background: var(--tc-menu-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-menu-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  animation: ui-aw-drop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-aw__menu--right { left: auto; right: 0; }
.ui-aw__menu-title { margin: 2px var(--tc-menu-item-px, 10px) 4px; font-size: var(--tc-caption-font-size, 12px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); color: var(--tc-caption-color, light-dark(#646464, #9a9aa1)); }
.ui-aw .ui-aw__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--tc-menu-item-h, 32px);
  padding: 0 var(--tc-menu-item-px, 10px);
  border: 0;
  border-radius: var(--tc-menu-item-radius, 8px);
  background: transparent;
  font-size: var(--tc-menu-item-font-size, 13px);
  text-align: left;
  white-space: nowrap;
}
.ui-aw .ui-aw__menu-item:is(:hover, :focus-visible):not(:disabled) { background: var(--tc-menu-item-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-aw .ui-aw__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
.ui-aw .ui-aw__menu-item:disabled { color: var(--tc-text-disabled, light-dark(#a3a3a3, #5c5c63)); cursor: default; }
.ui-aw__menu-item svg:last-child:not(:first-child) { margin-left: auto; color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-aw .ui-aw__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-aw .ui-aw__danger:not(:disabled) { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }

/* Welcome */
.ui-aw__welcome {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ui-aw-in var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-aw__hello { margin: 0; font-size: var(--tc-font-size-4xl, 28px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-display, 32px); letter-spacing: var(--tc-tracking-tight, -0.02em); }
.ui-aw__sub { margin: 6px 0 0; font-size: var(--tc-font-size-lg-plus, 15px); line-height: var(--tc-line-height-relaxed, 22px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); text-align: center; }
.ui-aw__sub--left { text-align: left; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); }
.ui-aw__composer { width: min(640px, 100%); margin-top: 26px; }
.ui-aw__starters { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 640px; margin-top: 14px; }
/* Starters: secondary buttons in the pill shape */
.ui-aw .ui-aw__starter {
  height: var(--tc-control-h-sm, 28px);
  padding: 0 12px;
  border: 0;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-action-secondary-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  /* One line, like a chip – a long starter shortens instead of turning into a two-line pill */
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-aw .ui-aw__starter:hover { box-shadow: var(--tc-action-secondary-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aw__disclaimer { margin: 14px 0 0; font-size: var(--tc-font-size-xs-plus, 11.5px); text-align: center; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Chat */
.ui-aw__chat { display: flex; flex: 1; flex-direction: column; min-height: 0; animation: ui-aw-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-aw__messages {
  display: grid;
  align-content: start;
  gap: 22px;
  flex: 1;
  min-height: 0;
  padding: 28px max(24px, calc((100% - 620px) / 2)) 16px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.ui-aw__msg { animation: ui-aw-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-aw__msg p { margin: 0; white-space: pre-wrap; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-relaxed, 22px); }
.ui-aw__msg--user { justify-self: end; max-width: 78%; padding: 10px 14px; border-radius: var(--tc-radius-2xl, 16px) var(--tc-radius-2xl, 16px) var(--tc-radius-xs, 4px) var(--tc-radius-2xl, 16px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-aw__msg--ai { display: flex; gap: 12px; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-aw__mark {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 3.5px;
  border-radius: 50%;
  /* A filled orb: soft light top left, deep blue bottom right */
  background:
    radial-gradient(circle at 30% 26%, rgba(255, 255, 255, 0.85) 0, rgba(255, 255, 255, 0) 42%),
    linear-gradient(140deg, #8ec5ff 0%, #2f6bff 48%, #1e3fd6 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25), var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
/* While thinking the orb breathes (transform only); reduced motion keeps it still */
.ui-aw__mark--busy { animation: ui-aw-orb var(--tc-duration-shimmer, 1600ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite; }
.ui-aw__ai-body { min-width: 0; }
.ui-aw__thinking { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aw__actions { display: flex; gap: 2px; margin: 6px 0 0 -6px; }
.ui-aw__error { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-aw__error + .ui-aw__actions { margin: 10px 0 0; }
.ui-aw__composer--dock { align-self: center; margin: 0; padding: 4px 0 14px; }
.ui-aw__composer--dock .ui-aw__disclaimer { margin-top: 8px; }

/* Projects */
.ui-aw__projects { flex: 1; min-height: 0; padding: 28px max(24px, calc((100% - 640px) / 2)) 24px; overflow-y: auto; animation: ui-aw-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); scrollbar-width: thin; }
.ui-aw__projects-head { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; }
.ui-aw__tile {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-aw__title { margin: 0; font-size: var(--tc-font-size-2xl, 20px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-display-sm, 28px); letter-spacing: var(--tc-tracking-tight, -0.02em); }
.ui-aw__search--wide { margin: 22px 0 16px; }
.ui-aw__list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-medium, 500); }
.ui-aw .ui-aw__sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 6px;
  border: 0;
  border-radius: var(--tc-control-radius-sm, 8px);
  background: transparent;
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-aw__sort-btn strong { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-aw__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
/* Project cards: a card on top of the tray's footer – the same tray as our other components */
.ui-aw__project { border-radius: var(--tc-radius-2xl, 16px); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); animation: ui-aw-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-aw__project-card { padding: 14px 14px 14px 16px; border-radius: var(--tc-radius-2xl, 16px); background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-aw__project-top { display: flex; align-items: center; gap: 10px; min-height: 28px; }
.ui-aw__project-top > svg { flex: none; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-aw__project-name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-medium, 500); white-space: nowrap; text-overflow: ellipsis; }
.ui-aw__pinned { display: grid; color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
/* The options button shows on hover, while its menu is open and on keyboard focus */
.ui-aw__dots { opacity: 0; }
.ui-aw__project:hover .ui-aw__dots, .ui-aw__dots[aria-expanded="true"], .ui-aw__dots:focus-visible { opacity: 1; }
@media (hover: none) { .ui-aw__dots { opacity: 1; } }
.ui-aw__rename {
  flex: 1;
  min-width: 0;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 8px;
  border: 0;
  border-radius: var(--tc-control-radius-sm, 8px);
  outline: none;
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent));
  font: inherit;
  font-size: var(--tc-font-size-lg, 14px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-aw__project-desc { margin: 4px 0 0 26px; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-aw__project-foot { margin: 0; padding: 9px 16px 10px; font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Dialog: a tray with the card on top and the actions below */
.ui-aw__backdrop { position: absolute; inset: 0; z-index: var(--tc-z-modal-scrim, 60); background: light-dark(rgba(23, 23, 23, 0.12), rgba(0, 0, 0, 0.45)); opacity: 0; pointer-events: none; transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease); }
.ui-aw__backdrop[data-open] { opacity: 1; pointer-events: auto; }
.ui-aw__dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: var(--tc-z-modal, 70);
  width: min(380px, calc(100% - 32px));
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -46%) scale(0.98);
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), transform var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-aw__dialog[data-open] { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }
.ui-aw__dialog-card { padding: 18px; border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-aw__dialog-title { margin: 0 0 14px; font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-loose, 24px); }
.ui-aw__field {
  width: 100%;
  height: var(--tc-field-h, 36px);
  padding: 0 var(--tc-field-px, 12px);
  border: 0;
  border-radius: var(--tc-field-radius, 10px);
  outline: none;
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font: inherit;
  font-size: var(--tc-field-font-size, 13px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-aw__field::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-aw__field:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-aw__field:focus { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-aw__dialog-foot { display: flex; justify-content: flex-end; gap: 6px; padding: 10px; }

/* Narrow containers: the sidebar becomes an overlay that starts closed */
@container (max-width: 720px) {
  .ui-aw { grid-template-columns: 0px minmax(0, 1fr); padding-left: 8px; }
  .ui-aw:not([data-collapsed]) .ui-aw__side {
    position: absolute;
    inset: 8px auto 8px 8px;
    z-index: var(--tc-z-drawer, 50);
    width: 240px;
    border-radius: var(--tc-radius-2xl, 16px);
    background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  }
  .ui-aw__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-aw__projects-head { grid-template-columns: auto 1fr; }
  .ui-aw__projects-head .ui-aw__create { grid-column: 1 / -1; justify-self: start; }
}

/* Phone width: less padding around the welcome */
@container (max-width: 560px) {
  .ui-aw__welcome { padding: 24px 16px; }
}

@keyframes ui-aw-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-aw-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-aw-orb { 50% { transform: scale(0.82); } }
@media (prefers-reduced-motion: reduce) {
  .ui-aw, .ui-aw__side, .ui-aw__dialog, .ui-aw__backdrop { transition: none; }
  .ui-aw__welcome, .ui-aw__chat, .ui-aw__projects, .ui-aw__msg, .ui-aw__project, .ui-aw__menu, .ui-aw__mark--busy { animation: none; }
}

/* Text fields show their focus with the field ring (above), not a second outline – also against global
   :focus-visible rules of the host page */
.ui-aw :is(.ui-aw__search input, .ui-aw__field, .ui-aw__rename):focus-visible { outline: none; }
`;
