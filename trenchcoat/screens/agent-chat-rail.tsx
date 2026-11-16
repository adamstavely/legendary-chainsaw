"use client";

/*
 * AI Chat / Double Sidebar – an assistant chat with search, in a single file.
 * A column of icons along the page's edge for the product's sections; beside it, inside the main area, a light column
 * of chats with a project switcher (Chat History, one project at a time); the chat itself in the middle (AI Answer and
 * Chat Composer); and what it found in the App Shell's work area on the right (Results List).
 * The App Shell's own sidebar starts folded – the icon column takes its place; its button brings it back.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Chat History, AI Answer, Chat Composer and Results List
 * from @adamstavely/trenchcoat/react; icons from lucide-react 1.55.0.
 */

import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpenIcon, CirclePlayIcon, FolderIcon, MessageCircleMoreIcon, PanelLeftIcon, SearchIcon } from "lucide-react";
import { AIAnswer, ChatComposer, ChatHistory, ResultsList, type AnswerSource, type ChatConversation, type SearchResult } from "@adamstavely/trenchcoat/react";
import { AppShell, Icon, MenuButton, type AppShellProps } from "@/components/ui/app-shell";

/* ---------- Types ---------- */

export type RailSection = { id: string; label: string; icon: LucideIcon };

/** One chat: what was asked, the answer with numbered citations, and what the search found */
export type RailChat = ChatConversation & {
  project: string;
  question: string;
  answer: string;
  sources: AnswerSource[];
  results: SearchResult[];
  followUps?: string[];
};

/* ---------- Sample content – replace with your own data ---------- */

export const defaultRailSections: RailSection[] = [
  { id: "chats", label: "Chats", icon: MessageCircleMoreIcon },
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "runs", label: "Tasks", icon: CirclePlayIcon },
  { id: "collections", label: "Collections", icon: FolderIcon },
  { id: "guides", label: "Research guides", icon: BookOpenIcon },
];

export const defaultRailProjects = ["Thesis: urban heat", "Teaching: reading lists", "Open access"];

/** A fixed moment, so the chat list reads the same on every visit */
const NOW = Date.UTC(2026, 10, 14, 15, 0);
const H = 3_600_000;

const heatResults: SearchResult[] = [
  { id: "h1", kind: "Article", title: "Cooling effect of urban parks: a meta-analysis of 47 cities", snippet: "Parks were on average 0.9 °C cooler than their surroundings by day, with the effect reaching about 350 m beyond the park edge.", source: "Journal databases", date: NOW - 400 * 24 * H },
  { id: "h2", kind: "Article", title: "Street trees and night-time heat in mid-latitude cities", snippet: "Canopy cover above 40% cut night-time surface temperatures by up to 2 °C during heat waves.", source: "Journal databases", date: NOW - 210 * 24 * H },
  { id: "h3", kind: "Book", title: "The Urban Climate, 3rd edition", snippet: "Chapter 6 covers the surface energy balance and why cities stay warm after sunset.", source: "Library catalogue · Shelf 551.5", date: NOW - 900 * 24 * H },
  { id: "h4", kind: "Dataset", title: "City surface temperature grids, 2015–2025", snippet: "Satellite land-surface temperatures on a 100 m grid for 120 European cities.", source: "Data repository", date: NOW - 60 * 24 * H },
];

export const defaultRailChats: RailChat[] = [
  {
    id: "c1",
    title: "Do parks cool their neighbourhood?",
    updatedAt: NOW - 1 * H,
    project: "Thesis: urban heat",
    question: "How far does a park's cooling effect reach into the streets around it?",
    answer:
      "Studies agree that parks cool their surroundings, but the effect fades quickly. A meta-analysis of 47 cities found parks were **about 0.9 °C cooler** than the area around them by day, and the effect reached **roughly 350 m** beyond the edge [1].\n\nTwo things make the effect larger:\n- **Size** – parks over 10 ha cooled further than small pocket parks [1]\n- **Trees** – canopy cover above 40% mattered most at night [2]\n\nFor the theory behind it, chapter 6 of *The Urban Climate* explains why streets stay warm after sunset [3].",
    sources: [
      { title: "Cooling effect of urban parks: a meta-analysis of 47 cities", name: "Journal databases", snippet: "Parks were on average 0.9 °C cooler than their surroundings by day." },
      { title: "Street trees and night-time heat in mid-latitude cities", name: "Journal databases", snippet: "Canopy cover above 40% cut night-time surface temperatures by up to 2 °C." },
      { title: "The Urban Climate, 3rd edition", name: "Library catalogue", snippet: "Chapter 6: the surface energy balance after sunset." },
    ],
    results: heatResults,
    followUps: ["Which cities were in the meta-analysis?", "Is there data for my own city?"],
  },
  {
    id: "c2",
    title: "Heat-wave datasets for Europe",
    updatedAt: NOW - 26 * H,
    project: "Thesis: urban heat",
    question: "Which open datasets give city surface temperatures for Europe?",
    answer:
      "The best fit is the **city surface temperature grids** in the data repository: satellite land-surface temperatures on a 100 m grid for 120 European cities, 2015–2025 [1]. The parks meta-analysis also publishes its city list as supplementary data [2].",
    sources: [
      { title: "City surface temperature grids, 2015–2025", name: "Data repository", snippet: "100 m grid, 120 European cities." },
      { title: "Cooling effect of urban parks: a meta-analysis of 47 cities", name: "Journal databases", snippet: "Supplementary table S1 lists every city." },
    ],
    results: [heatResults[3], heatResults[0]],
  },
  {
    id: "c3",
    title: "Newer editions on Environmental Law 201",
    updatedAt: NOW - 50 * H,
    project: "Teaching: reading lists",
    question: "Which titles on the Environmental Law 201 list have a newer edition?",
    answer: "Two titles have newer editions in the catalogue: **Principles of Environmental Law** (now the 9th edition) [1] and **Climate Change Law** (2nd edition, 2025) [2]. The rest are current.",
    sources: [
      { title: "Principles of Environmental Law, 9th edition", name: "Library catalogue", snippet: "Published 2026; replaces the 8th edition on the list." },
      { title: "Climate Change Law, 2nd edition", name: "Library catalogue", snippet: "Published 2025." },
    ],
    results: [
      { id: "r1", kind: "Book", title: "Principles of Environmental Law, 9th edition", snippet: "Newer than the 8th edition on the reading list.", source: "Library catalogue" },
      { id: "r2", kind: "Book", title: "Climate Change Law, 2nd edition", snippet: "Published 2025.", source: "Library catalogue" },
    ],
  },
  {
    id: "c4",
    title: "Open-access funding this year",
    updatedAt: NOW - 120 * H,
    project: "Open access",
    question: "How much of the open-access fund is left this year?",
    answer: "The fund has **€18,400 of €60,000** left for this year, which covers about nine more articles at the average fee [1].",
    sources: [{ title: "Open-access fund – 2026 ledger", name: "Documents", snippet: "Spent €41,600 of €60,000 on 21 articles." }],
    results: [{ id: "o1", kind: "Document", title: "Open-access fund – 2026 ledger", snippet: "Spent €41,600 of €60,000 on 21 articles.", source: "Documents" }],
  },
];

/* ---------- AI Chat / Double Sidebar ---------- */

type AgentChatRailScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref"> & {
  /** The product's sections, as the icon column along the page's edge */
  sections?: RailSection[];
  projects?: string[];
  chats?: RailChat[];
  /** The section open in the icon column. Controlled when defined – pair it with `onSectionChange` */
  section?: string;
  defaultSection?: string;
  onSectionChange?: (id: string) => void;
  /** The project whose chats are listed. Controlled when defined – pair it with `onProjectChange` */
  project?: string;
  defaultProject?: string;
  onProjectChange?: (project: string) => void;
  /** Id of the open chat. Controlled when defined – pair it with `onChatChange` */
  chat?: string | null;
  defaultChat?: string | null;
  onChatChange?: (id: string | null) => void;
  /** A message sent from the composer */
  onSend?: (message: string) => void;
};

export type AgentChatRailScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentChatRailScreenOwnProps> & AgentChatRailScreenOwnProps;

function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = (next: T) => {
    if (!controlled) setOwn(next);
    onChange?.(next);
  };
  return [controlled ? value : own, set] as const;
}

type Turn = { id: number; question: string };

export function AgentChatRailScreen({
  sections = defaultRailSections,
  projects = defaultRailProjects,
  chats = defaultRailChats,
  section: sectionProp,
  defaultSection = "chats",
  onSectionChange,
  project: projectProp,
  defaultProject,
  onProjectChange,
  chat: chatProp,
  defaultChat = "c1",
  onChatChange,
  onSend,
  ...shell
}: AgentChatRailScreenProps) {
  const [section, setSection] = useControlled(sectionProp, defaultSection, onSectionChange);
  const [project, setProject] = useControlled(projectProp, defaultProject ?? projects[0], onProjectChange);
  const [chatId, setChatId] = useControlled(chatProp, defaultChat, onChatChange);
  const [listOpen, setListOpen] = useState(true);
  // Questions asked in this visit, per chat – answered from the same sources in this sample
  const [turns, setTurns] = useState<Record<string, Turn[]>>({});
  const asked = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  // On a narrow main area the chats column opens as a layer over the chat, so it starts closed there
  useLayoutEffect(() => {
    if ((root.current?.offsetWidth ?? Infinity) <= 760) setListOpen(false);
  }, []);

  const inProject = chats.filter((c) => c.project === project);
  const chat = chats.find((c) => c.id === chatId) ?? null;

  const pickProject = (p: string) => {
    setProject(p);
    const first = chats.find((c) => c.project === p);
    setChatId(first?.id ?? null);
  };

  return (
    <AppShell
      active="Chat"
      defaultCollapsed
      panel={chat ? <ResultsList title="What it found" query={chat.question} results={chat.results} locale="en-GB" onOpenResult={(_, e) => e.preventDefault()} /> : null}
      panelTitle="Sources"
      {...shell}
    >
      <style href="ui-screen-agent-chat-rail" precedence="default">
        {css}
      </style>
      <div ref={root} className="ui-crail" data-list={listOpen || undefined}>
        <IconColumn sections={sections} value={section} onChange={setSection} />

        {listOpen && <div className="ui-crail__scrim" aria-hidden="true" onClick={() => setListOpen(false)} />}
        {listOpen && (
          <nav className="ui-crail__list" aria-label="Chats">
            <div className="ui-crail__list-head">
              <MenuButton value={project} options={projects.map((p) => ({ value: p, label: p }))} onChange={pickProject} icon={FolderIcon} align="start" className="ui-crail__project" />
            </div>
            <ChatHistory
              key={project}
              title={project}
              defaultConversations={inProject}
              value={chatId}
              onChange={(id) => {
                setChatId(id);
                if ((root.current?.offsetWidth ?? Infinity) <= 760) setListOpen(false);
              }}
              now={NOW}
              maxHeight={2000}
            />
          </nav>
        )}

        <section className="ui-crail__main" aria-label="Chat">
          <header className="ui-crail__bar">
            <span className="ui-crail__crumbs">
              <button type="button" className="ui-as-icon-btn" aria-label={listOpen ? "Hide chats" : "Show chats"} aria-pressed={listOpen} onClick={() => setListOpen((o) => !o)}>
                <Icon icon={PanelLeftIcon} size={16} />
              </button>
              <span className="ui-crail__project-name">{project}</span>
              <i>/</i>
              <b>{chat?.title ?? "New chat"}</b>
            </span>
          </header>

          <div className="ui-crail__thread">
            <div className="ui-crail__column">
              {chat ? (
                <>
                  <p className="ui-crail__user">{chat.question}</p>
                  <AIAnswer question={chat.question} answer={chat.answer} sources={chat.sources} followUps={chat.followUps ?? []} />
                  {(turns[chat.id] ?? []).map((t) => (
                    <div key={t.id} className="ui-crail__turn">
                      <p className="ui-crail__user">{t.question}</p>
                      <AIAnswer
                        question={t.question}
                        answer={`I searched the library's collections again for “${t.question}”. The closest matches are the same sources as above [1] – the work area on the right lists everything it found.`}
                        sources={chat.sources.slice(0, 1)}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <p className="ui-crail__empty">Ask about anything in the library's collections – books, articles, datasets and guides.</p>
              )}
            </div>
          </div>

          <div className="ui-crail__composer">
            <ChatComposer
              placeholder="Ask the library anything…"
              onSend={(message) => {
                if (chat) setTurns((all) => ({ ...all, [chat.id]: [...(all[chat.id] ?? []), { id: ++asked.current, question: message }] }));
                onSend?.(message);
              }}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/** The product's sections as a column of icon buttons: one tab stop, arrow keys move, Enter or a click picks */
function IconColumn({ sections, value, onChange }: { sections: RailSection[]; value: string; onChange: (id: string) => void }) {
  const list = useRef<HTMLDivElement>(null);
  const keys = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = sections.findIndex((s) => s.id === (e.target as HTMLElement).dataset.section);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: sections.length - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    const n = (next + sections.length) % sections.length;
    list.current?.querySelectorAll<HTMLElement>("[data-section]")[n]?.focus();
  };
  const current = sections.some((s) => s.id === value) ? value : sections[0]?.id;
  return (
    <div ref={list} className="ui-crail__icons" role="toolbar" aria-label="Sections" aria-orientation="vertical" onKeyDown={keys}>
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className="ui-crail__icon"
          data-section={s.id}
          aria-label={s.label}
          aria-pressed={s.id === current}
          title={s.label}
          tabIndex={s.id === current ? 0 : -1}
          onClick={() => onChange(s.id)}
        >
          <Icon icon={s.icon} size={18} />
        </button>
      ))}
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Double sidebar: an icon column, a light column of chats, then the chat; the work area is the App Shell's */
.ui-crail { position: relative; display: flex; height: 100%; min-height: 0; }

.ui-crail__icons {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: var(--tc-space-1, 4px);
  width: 56px;
  /* Below the App Shell's button that brings its sidebar back */
  padding: calc(var(--tc-space-12, 48px) + var(--tc-space-1, 4px)) 0 var(--tc-space-3, 12px);
  border-right: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
}
.ui-crail__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--tc-radius-lg, 10px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-crail__icon:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-crail__icon[aria-pressed="true"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-crail__icon:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

/* The chats: a light gray column inside the main area */
.ui-crail__list {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 280px;
  min-height: 0;
  overflow-y: auto;
  padding: var(--tc-space-3, 12px) var(--tc-space-2, 8px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  border-right: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
}
.ui-crail__list-head { display: flex; padding: 0 var(--tc-space-1, 4px) var(--tc-space-2, 8px); }
.ui-crail__project { max-width: 100%; }

.ui-crail__main { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.ui-crail__bar {
  display: flex;
  flex: none;
  align-items: center;
  height: 52px;
  padding: 0 var(--tc-space-3, 12px);
  border-bottom: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-crail__crumbs { display: flex; align-items: center; gap: var(--tc-space-2, 8px); min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); white-space: nowrap; }
.ui-crail__crumbs i { font-style: normal; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-crail__crumbs b { overflow: hidden; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-overflow: ellipsis; }
.ui-crail__crumbs .ui-as-icon-btn[aria-pressed="true"] { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-crail__thread { flex: 1; min-height: 0; overflow-y: auto; padding: var(--tc-space-8, 32px) var(--tc-space-8, 32px) var(--tc-space-4, 16px); }
.ui-crail__column { display: flex; flex-direction: column; gap: var(--tc-space-5, 20px); max-width: 680px; margin: 0 auto; }
.ui-crail__turn { display: flex; flex-direction: column; gap: var(--tc-space-5, 20px); }
.ui-crail__user {
  align-self: flex-end;
  max-width: 85%;
  margin: 0;
  padding: var(--tc-space-2, 8px) var(--tc-space-3-5, 14px);
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-lg, 14px);
  line-height: var(--tc-line-height-relaxed, 22px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-crail__empty { margin: var(--tc-space-10, 40px) 0 0; font-size: var(--tc-font-size-lg, 14px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); text-align: center; }
.ui-crail__composer { width: 100%; max-width: 744px; margin: 0 auto; padding: var(--tc-space-2, 8px) var(--tc-space-8, 32px) var(--tc-space-6, 24px); }
.ui-crail__scrim { display: none; }

/* Narrow: the chats column becomes a layer over the chat, the project name leaves the bar */
@container ui-as-main (max-width: 760px) {
  .ui-crail__list {
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 2);
    top: 0;
    bottom: 0;
    left: 56px;
    width: min(280px, calc(100% - 72px));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  }
  .ui-crail__scrim {
    display: block;
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 1);
    inset: 0;
    background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6)));
  }
  .ui-crail__project-name, .ui-crail__crumbs i { display: none; }
  .ui-crail__thread { padding: var(--tc-space-6, 24px) var(--tc-space-4, 16px) var(--tc-space-3, 12px); }
  .ui-crail__composer { padding: var(--tc-space-1-5, 6px) var(--tc-space-2, 8px) var(--tc-space-2, 8px); }
}
@container ui-as-main (max-width: 480px) {
  .ui-crail__icons { width: 48px; }
  .ui-crail__list { left: 48px; }
}
`;
