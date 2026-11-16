"use client";

/*
 * Agent / Agents – your team of agents in one place, as a full app view, in a single file.
 * Calm cards, one per agent: its mark, its role, its status in words, the apps it may use, its model, its runs this
 * week and what it spent – the ones that need attention first, with why. Picking an agent opens it on the right: its
 * profile with two weeks of runs (Agent Summary), its instructions, skills and recent tasks. New agent opens Agent
 * Create in the same place.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Agent Summary and Agent Create from
 * @adamstavely/trenchcoat/react, Button from Trenchcoat components; icons from lucide-react 1.55.0.
 */

import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  BotIcon,
  CalendarIcon,
  ChartColumnBigIcon,
  CirclePlayIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderIcon,
  HouseIcon,
  LibraryIcon,
  MailIcon,
  MessageCircleMoreIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import {
  AgentCreate,
  AgentSummary,
  type AgentDraft,
  type AgentSummaryAction,
  type AgentSummaryDay,
  type AgentSummaryFailure,
  type AgentSummaryStatus,
} from "@adamstavely/trenchcoat/react";
import { Button } from "@/components/ui/button";
import { AppShell, Icon, Tabs, useToast, type AppShellProps, type ShellNavItem } from "@/components/ui/app-shell";

/* ---------- Types ---------- */

export type AgentApp = { label: string; icon: LucideIcon };

export type TeamAgent = {
  id: string;
  name: string;
  /** What it does, in a few words */
  role: string;
  status: AgentSummaryStatus;
  /** Why it needs attention, in words – shown on its card while it's failing */
  attention?: string;
  /** What it's doing right now, if anything */
  now?: string;
  model: string;
  owner: string;
  /** The apps it may use */
  apps: AgentApp[];
  /** Runs in the last 7 days */
  runs: number;
  /** Spend in the last 7 days, in dollars */
  spend: number;
  instructions: string;
  skills: string[];
  /** Recent tasks, newest first */
  tasks: { title: string; when: string; outcome: "done" | "failed" | "running" }[];
  /** Two weeks of runs, oldest first: [succeeded, failed] per day */
  history: [number, number][];
  failures?: AgentSummaryFailure[];
};

/* ---------- Sample content – replace with your own data ---------- */

const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Agents", icon: BotIcon },
  { label: "Runs", icon: CirclePlayIcon },
  { label: "Analytics", icon: ChartColumnBigIcon },
  { label: "Collections", icon: FolderIcon },
];

const CATALOGUE: AgentApp = { label: "Catalogue", icon: LibraryIcon };
const DATABASES: AgentApp = { label: "Journal databases", icon: DatabaseIcon };
const MAIL: AgentApp = { label: "Email", icon: MailIcon };
const CALENDAR: AgentApp = { label: "Calendar", icon: CalendarIcon };
const DOCS: AgentApp = { label: "Documents", icon: FileTextIcon };

/** A fixed day, so the cards and charts are the same on every visit */
const TODAY = Date.UTC(2026, 10, 14, 12);
const DAY = 86_400_000;

export const defaultTeamAgents: TeamAgent[] = [
  {
    id: "lit",
    name: "Literature scout",
    role: "Finds peer-reviewed studies for research questions",
    status: "live",
    now: "Searching three indexes for urban heat studies",
    model: "Model M",
    owner: "Research support",
    apps: [DATABASES, CATALOGUE, DOCS],
    runs: 64,
    spend: 18.4,
    instructions: "Search the subscribed journal indexes for the question asked. Keep peer-reviewed studies only, note the inclusion criteria you used, and hand back a list with full citations and a link to each full text.",
    skills: ["Search strategy", "Citation formatting", "Inclusion screening"],
    tasks: [
      { title: "Urban heat islands, 2015–2026", when: "Now", outcome: "running" },
      { title: "Peatland carbon storage", when: "Yesterday", outcome: "done" },
      { title: "Open-access mandates in the EU", when: "2 days ago", outcome: "done" },
    ],
    history: [[8, 0], [9, 0], [7, 1], [10, 0], [0, 0], [0, 0], [9, 0], [8, 0], [11, 0], [9, 1], [10, 0], [0, 0], [0, 0], [12, 0]],
  },
  {
    id: "ill",
    name: "Interlibrary loans",
    role: "Requests articles the library doesn't hold",
    status: "failing",
    attention: "The partner library's request form changed – 9 of 22 requests failed this week.",
    model: "Model S",
    owner: "Access services",
    apps: [CATALOGUE, MAIL],
    runs: 22,
    spend: 3.1,
    instructions: "When a researcher needs an article the library doesn't hold, fill in the partner library's request form, confirm the cost limit, and email the researcher when it arrives.",
    skills: ["Request forms", "Cost limits"],
    tasks: [
      { title: "Request: Climate Policy 14(3)", when: "1 hour ago", outcome: "failed" },
      { title: "Request: Hydrology Letters 9", when: "3 hours ago", outcome: "failed" },
      { title: "Request: Urban Studies 61(2)", when: "Yesterday", outcome: "done" },
    ],
    history: [[3, 0], [2, 0], [3, 0], [2, 0], [0, 0], [0, 0], [3, 0], [2, 0], [2, 1], [1, 2], [1, 3], [0, 0], [0, 0], [1, 3]],
    failures: [
      { id: "f1", at: TODAY - 3_600_000, step: "Fill in the request form", error: "The form has a new required field (cost centre)." },
      { id: "f2", at: TODAY - 3 * 3_600_000, step: "Fill in the request form", error: "The form has a new required field (cost centre)." },
    ],
  },
  {
    id: "lists",
    name: "Reading lists",
    role: "Keeps course reading lists up to date",
    status: "live",
    model: "Model S",
    owner: "Teaching support",
    apps: [CATALOGUE, DOCS],
    runs: 31,
    spend: 4.75,
    instructions: "Check each course's reading list against the catalogue every Monday. Flag titles that are missing, out of print or have a newer edition, and suggest a replacement.",
    skills: ["Edition check", "Catalogue lookup"],
    tasks: [
      { title: "Check: Environmental Law 201", when: "Monday", outcome: "done" },
      { title: "Check: Statistics for Social Science", when: "Monday", outcome: "done" },
    ],
    history: [[6, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [7, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  },
  {
    id: "desk",
    name: "Research desk",
    role: "Books consultations with subject librarians",
    status: "paused",
    model: "Model S",
    owner: "Research support",
    apps: [CALENDAR, MAIL],
    runs: 0,
    spend: 0,
    instructions: "Offer researchers a consultation slot with the subject librarian for their field, book it in both calendars and send a confirmation with what to bring.",
    skills: ["Scheduling"],
    tasks: [{ title: "Consultation: thesis literature search", when: "Last week", outcome: "done" }],
    history: [[2, 0], [3, 0], [1, 0], [2, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
  },
];

const MODELS = [
  { id: "model-s", label: "Model S – fast" },
  { id: "model-m", label: "Model M – balanced" },
  { id: "model-l", label: "Model L – thorough" },
];

const STATUS_WORD: Record<AgentSummaryStatus, string> = { live: "Live", draft: "Draft", paused: "Paused", failing: "Needs attention" };
const FILTERS = ["All", "Needs attention", "Live", "Paused"] as const;
type Filter = (typeof FILTERS)[number];

const money = (n: number) => `$${n.toFixed(2)}`;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
/** A calm tint per agent, picked from its name so it stays the same */
const tint = (id: string) => [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 5;

/* ---------- Agent / Agents ---------- */

type AgentsScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref"> & {
  /** The agents – shown with the ones that need attention first */
  agents?: TeamAgent[];
  /** Id of the agent open on the right. Controlled when defined – pair it with `onSelectedChange` */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** Pause, resume, edit or test from an agent's profile */
  onAction?: (id: string, action: AgentSummaryAction) => void;
  /** A new agent was created from Agent Create's draft */
  onCreate?: (draft: AgentDraft) => void;
};

export type AgentsScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentsScreenOwnProps> & AgentsScreenOwnProps;

function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = (next: T) => {
    if (!controlled) setOwn(next);
    onChange?.(next);
  };
  return [controlled ? value : own, set] as const;
}

export function AgentsScreen({
  agents: agentsProp = defaultTeamAgents,
  selected: selectedProp,
  defaultSelected = "ill",
  onSelectedChange,
  onAction,
  onCreate,
  ...shell
}: AgentsScreenProps) {
  // Pausing and resuming from the profile changes the card too; a new prop list starts over
  const [statuses, setStatuses] = useState<Record<string, AgentSummaryStatus>>({});
  const [created, setCreated] = useState<TeamAgent[]>([]);
  const agents = [...agentsProp, ...created].map((a) => (statuses[a.id] ? { ...a, status: statuses[a.id] } : a));
  const [selected, setSelected] = useControlled(selectedProp, defaultSelected, onSelectedChange);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [toast, showToast] = useToast();
  const newButton = useRef<HTMLSpanElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const needs = agents.filter((a) => a.status === "failing");
  const rest = agents.filter((a) => a.status !== "failing");
  const shown = (list: TeamAgent[]) =>
    list.filter((a) => filter === "All" || (filter === "Needs attention" ? a.status === "failing" : filter === "Live" ? a.status === "live" : a.status === "paused"));

  const current = agents.find((a) => a.id === selected);
  const panelOpen = creating || !!current;

  // Closing the panel from inside it: focus goes back to the card it came from, or to New agent
  const root = useRef<HTMLDivElement>(null);
  const close = () => {
    const from = selected;
    setCreating(false);
    setSelected(null);
    requestAnimationFrame(() => {
      const card = from ? grid.current?.querySelector<HTMLElement>(`[data-agent="${from}"]`) : null;
      (card ?? newButton.current?.querySelector<HTMLElement>("button"))?.focus();
    });
  };

  const act = (a: TeamAgent, action: AgentSummaryAction) => {
    if (action === "pause") setStatuses((s) => ({ ...s, [a.id]: "paused" }));
    if (action === "resume") setStatuses((s) => ({ ...s, [a.id]: "live" }));
    if (action === "pause" || action === "resume") showToast(`${a.name} ${action === "pause" ? "paused" : "resumed"}`);
    onAction?.(a.id, action);
  };

  // Arrow keys move between the cards, one tab stop for the grid
  const [focusId, setFocusId] = useState<string | null>(null);
  const order = [...shown(needs), ...shown(rest)];
  const tabbable = order.some((a) => a.id === focusId) ? focusId : (order[0]?.id ?? null);
  const keys = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = order.findIndex((a) => a.id === (e.target as HTMLElement).dataset.agent);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const next = e.key === "Home" ? 0 : e.key === "End" ? order.length - 1 : step === undefined ? -1 : Math.min(order.length - 1, Math.max(0, i + step));
    if (next < 0) return;
    e.preventDefault();
    setFocusId(order[next].id);
    grid.current?.querySelector<HTMLElement>(`[data-agent="${order[next].id}"]`)?.focus();
  };

  useLayoutEffect(() => {
    // A narrow screen starts with nothing open, so the cards come first
    if ((root.current?.offsetWidth ?? Infinity) <= 900 && selectedProp === undefined) setSelected(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount, for the starting layout

  const card = (a: TeamAgent) => (
    <button
      key={a.id}
      type="button"
      className="ui-agnt__card"
      data-agent={a.id}
      aria-pressed={selected === a.id}
      tabIndex={tabbable === a.id ? 0 : -1}
      onFocus={() => setFocusId(a.id)}
      onClick={() => {
        setCreating(false);
        setSelected(a.id);
      }}
    >
      <span className="ui-agnt__head">
        <span className="ui-agnt__mark" data-tint={tint(a.id)} aria-hidden="true">
          {initials(a.name)}
        </span>
        <span className="ui-agnt__who">
          <b>{a.name}</b>
          <span>{a.role}</span>
        </span>
        <span className="ui-agnt__status" data-status={a.status}>
          {a.status === "failing" && <Icon icon={TriangleAlertIcon} size={12} />}
          {STATUS_WORD[a.status]}
        </span>
      </span>
      {a.status === "failing" && a.attention ? (
        <span className="ui-agnt__why">{a.attention}</span>
      ) : (
        <span className="ui-agnt__now">{a.status === "paused" ? "Paused – it won't run until you resume it" : (a.now ?? "Idle – waiting for its next task")}</span>
      )}
      <span className="ui-agnt__apps">
        <span className="ui-agnt__sr">May use: </span>
        {a.apps.map((app) => (
          <span key={app.label} className="ui-agnt__app">
            <Icon icon={app.icon} size={12} />
            {app.label}
          </span>
        ))}
      </span>
      <span className="ui-agnt__facts">
        <span>{a.model}</span>
        <span>
          {a.runs} runs <span className="ui-agnt__sr">in the last 7 days</span>
        </span>
        <span>
          {money(a.spend)} <span className="ui-agnt__sr">spent in the last 7 days</span>
        </span>
      </span>
    </button>
  );

  return (
    <AppShell active="Agents" nav={nav} {...shell}>
      <style href="ui-screen-agents" precedence="default">
        {css}
      </style>
      <div ref={root} className="ui-agnt" data-panel={panelOpen || undefined}>
        <section className="ui-agnt__main">
          <header className="ui-agnt__bar">
            <span className="ui-agnt__crumbs">
              <Icon icon={BotIcon} size={15} />
              <b>Agents</b>
              <span className="ui-agnt__count">{agents.length}</span>
            </span>
            <span ref={newButton}>
              <Button
                size="sm"
                icon={<Icon icon={PlusIcon} size={14} />}
                onClick={() => {
                  setSelected(null);
                  setCreating(true);
                }}
              >
                New agent
              </Button>
            </span>
          </header>

          <div className="ui-agnt__scroll">
            <div className="ui-agnt__column">
              <Tabs items={[...FILTERS]} value={filter} onChange={(f) => setFilter(f as Filter)} label="Show agents" />
              <div ref={grid} className="ui-agnt__sections" onKeyDown={keys}>
                {shown(needs).length > 0 && (
                  <section className="ui-agnt__group" aria-label="Needs attention">
                    <h2 className="ui-agnt__label">
                      <Icon icon={TriangleAlertIcon} size={13} />
                      Needs attention
                    </h2>
                    <div className="ui-agnt__grid">{shown(needs).map(card)}</div>
                  </section>
                )}
                {shown(rest).length > 0 && (
                  <section className="ui-agnt__group" aria-label={needs.length ? "The rest of the team" : "Your team"}>
                    <h2 className="ui-agnt__label">{needs.length && filter === "All" ? "The rest of the team" : "Your team"}</h2>
                    <div className="ui-agnt__grid">{shown(rest).map(card)}</div>
                  </section>
                )}
                {order.length === 0 && (
                  <p className="ui-agnt__empty">
                    <Icon icon={SearchIcon} size={16} />
                    No agents here right now.
                  </p>
                )}
              </div>
            </div>
          </div>
          {toast}
        </section>

        {panelOpen && <div className="ui-agnt__scrim" aria-hidden="true" onClick={close} />}
        {panelOpen && (
          <aside className="ui-agnt__panel" aria-label={creating ? "New agent" : `${current?.name} details`}>
            <header className="ui-agnt__bar">
              <span className="ui-agnt__crumbs">
                <b>{creating ? "New agent" : current?.name}</b>
              </span>
              <button type="button" className="ui-as-icon-btn" aria-label={creating ? "Close new agent" : "Close agent details"} onClick={close}>
                <Icon icon={XIcon} size={15} />
              </button>
            </header>
            <div className="ui-agnt__panel-body">
              {creating ? (
                <AgentCreate
                  title="Describe the agent"
                  description="Library research support"
                  examples={["Check new acquisitions against course reading lists", "Answer questions about opening hours and loans", "Remind researchers before loans are due"]}
                  models={MODELS}
                  onCreate={(draft) => {
                    const id = `new-${created.length + 1}`;
                    setCreated((c) => [
                      ...c,
                      {
                        id,
                        name: draft.name || "New agent",
                        role: draft.instructions.split(".")[0] || "A new agent",
                        status: "draft",
                        model: MODELS.find((m) => m.id === draft.model)?.label.split(" –")[0] ?? draft.model,
                        owner: shell.user?.name ?? "You",
                        apps: [],
                        runs: 0,
                        spend: 0,
                        instructions: draft.instructions,
                        skills: [],
                        tasks: [],
                        history: Array.from({ length: 14 }, () => [0, 0] as [number, number]),
                      },
                    ]);
                    setCreating(false);
                    setSelected(id);
                    showToast(`${draft.name || "New agent"} created as a draft`);
                    onCreate?.(draft);
                  }}
                />
              ) : (
                current && <AgentDetails agent={current} onAction={(action) => act(current, action)} />
              )}
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}

/** One agent on the right: its profile, then its instructions, skills and recent tasks */
function AgentDetails({ agent, onAction }: { agent: TeamAgent; onAction: (action: AgentSummaryAction) => void }) {
  const days: AgentSummaryDay[] = agent.history.map(([succeeded, failed], i) => ({ date: TODAY - (agent.history.length - 1 - i) * DAY, succeeded, failed }));
  return (
    <div className="ui-agnt__details">
      <AgentSummary
        name={agent.name}
        description={agent.role}
        status={agent.status}
        model={agent.model}
        owner={agent.owner}
        tools={agent.apps.map((a) => a.label)}
        days={days}
        cost={agent.spend}
        failures={agent.failures ?? []}
        locale="en-GB"
        onAction={(action) => onAction(action)}
      />
      <section className="ui-agnt__section">
        <h3 className="ui-agnt__label">Instructions</h3>
        <p className="ui-agnt__text">{agent.instructions}</p>
      </section>
      <section className="ui-agnt__section">
        <h3 className="ui-agnt__label">Skills</h3>
        {agent.skills.length ? (
          <ul className="ui-agnt__skills">
            {agent.skills.map((s) => (
              <li key={s}>
                <Icon icon={BookOpenIcon} size={12} />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ui-agnt__text ui-agnt__quiet">No skills yet.</p>
        )}
      </section>
      <section className="ui-agnt__section">
        <h3 className="ui-agnt__label">Recent tasks</h3>
        {agent.tasks.length ? (
          <ul className="ui-agnt__tasks">
            {agent.tasks.map((t) => (
              <li key={t.title}>
                <span className="ui-agnt__dot" data-outcome={t.outcome} aria-hidden="true" />
                <span className="ui-agnt__task">
                  {t.title}
                  <small>
                    {t.when} · {t.outcome === "done" ? "Done" : t.outcome === "failed" ? "Failed" : "Running"}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ui-agnt__text ui-agnt__quiet">It hasn't worked on anything yet.</p>
        )}
      </section>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Agents: the team as cards in the middle, one agent (or a new one) on the right */
.ui-agnt {
  /* Five calm tints for the agents' marks */
  --tc-agents-tint-0: light-dark(#e8eefc, #1d2740);
  --tc-agents-tint-1: light-dark(#e6f4ec, #16301f);
  --tc-agents-tint-2: light-dark(#fbefe2, #3a2a17);
  --tc-agents-tint-3: light-dark(#f1e9fb, #2b1f3d);
  --tc-agents-tint-4: light-dark(#e6f2f5, #15303a);
  display: flex;
  height: 100%;
  min-height: 0;
}
.ui-agnt__main { position: relative; display: flex; flex: 1; flex-direction: column; min-width: 0; }

.ui-agnt__bar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, 12px);
  height: 52px;
  padding: 0 var(--tc-space-3, 12px) 0 var(--tc-space-5, 20px);
  border-bottom: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-agnt__crumbs { display: flex; align-items: center; gap: var(--tc-space-2, 8px); min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); white-space: nowrap; }
.ui-agnt__crumbs b { overflow: hidden; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-overflow: ellipsis; }
.ui-agnt__count { font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-agnt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.ui-agnt__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: var(--tc-space-6, 24px) var(--tc-space-8, 32px) var(--tc-space-10, 40px); }
.ui-agnt__column { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-6, 24px); max-width: 1040px; margin: 0 auto; }
.ui-agnt__sections { display: flex; flex-direction: column; gap: var(--tc-space-7, 28px); width: 100%; }
.ui-agnt__group { display: flex; flex-direction: column; }
.ui-agnt__label { display: flex; align-items: center; gap: var(--tc-space-1-5, 6px); margin: 0; padding-bottom: var(--tc-space-3, 12px); font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-agnt__group:first-child .ui-agnt__label svg { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-agnt__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--tc-space-3, 12px); }

/* One agent: a calm card, the whole card a button */
.ui-agnt__card {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-3, 12px);
  padding: var(--tc-space-4, 16px);
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  text-align: left;
  cursor: pointer;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-agnt__card:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-agnt__card[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-agnt__card:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-agnt__head { display: flex; align-items: flex-start; gap: var(--tc-space-3, 12px); }
.ui-agnt__mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-agents-tint-0);
  font-size: var(--tc-font-size-md, 13px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-agnt__mark[data-tint="1"] { background: var(--tc-agents-tint-1); }
.ui-agnt__mark[data-tint="2"] { background: var(--tc-agents-tint-2); }
.ui-agnt__mark[data-tint="3"] { background: var(--tc-agents-tint-3); }
.ui-agnt__mark[data-tint="4"] { background: var(--tc-agents-tint-4); }
.ui-agnt__who { display: flex; flex: 1; flex-direction: column; min-width: 0; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-agnt__who b { font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-agnt__status {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1, 4px);
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-pill-font-size, 11px);
  font-weight: var(--tc-pill-font-weight, 500);
  line-height: var(--tc-pill-h, 20px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-agnt__status[data-status="live"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-agnt__status[data-status="failing"] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-agnt__now, .ui-agnt__why { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-agnt__why { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-agnt__apps { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5, 6px); }
.ui-agnt__app { display: inline-flex; align-items: center; gap: var(--tc-space-1, 4px); padding: var(--tc-space-0-5, 2px) var(--tc-space-2, 8px); border-radius: var(--tc-radius-full, 999px); box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e)); font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-agnt__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-1, 4px) var(--tc-space-3, 12px); padding-top: var(--tc-space-3, 12px); border-top: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-agnt__empty { display: flex; align-items: center; gap: var(--tc-space-2, 8px); margin: 0; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* The panel on the right: the profile, then flat sections */
.ui-agnt__panel { display: flex; flex: none; flex-direction: column; width: 440px; min-height: 0; border-left: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-agnt__panel-body { flex: 1; min-height: 0; overflow-y: auto; padding: var(--tc-space-4, 16px); }
.ui-agnt__details { display: flex; flex-direction: column; gap: var(--tc-space-2, 8px); }
.ui-agnt__section { display: flex; flex-direction: column; padding: var(--tc-space-4, 16px) var(--tc-space-1, 4px) 0; }
.ui-agnt__text { margin: 0; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-agnt__quiet { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-agnt__skills { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5, 6px); margin: 0; padding: 0; list-style: none; }
.ui-agnt__skills li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, 6px); padding: var(--tc-space-1, 4px) var(--tc-space-2-5, 10px); border-radius: var(--tc-radius-full, 999px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-agnt__tasks { display: flex; flex-direction: column; gap: var(--tc-space-3, 12px); margin: 0; padding: 0; list-style: none; }
.ui-agnt__tasks li { display: flex; align-items: flex-start; gap: var(--tc-space-2-5, 10px); }
.ui-agnt__dot { flex: none; width: 8px; height: 8px; margin-top: var(--tc-space-1-5, 6px); border-radius: 50%; background: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-agnt__dot[data-outcome="failed"] { background: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-agnt__dot[data-outcome="running"] { background: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-agnt__task { display: flex; flex-direction: column; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-agnt__task small { font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Room for the sidebar icon while the sidebar is collapsed */
.ui-agnt__main > .ui-agnt__bar { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-agnt__main > .ui-agnt__bar { padding-left: calc(var(--tc-space-12, 48px) + var(--tc-space-1, 4px)); }
.ui-agnt__scrim { display: none; }

/* Narrow panels: the panel becomes a layer that slides in from the right over the cards */
@container ui-as-main (max-width: 900px) {
  .ui-agnt__panel {
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 2);
    top: 0;
    right: 0;
    bottom: 0;
    width: min(440px, calc(100% - 32px));
    border-left: 0;
    border-radius: 0 var(--tc-app-shell-panel-radius) var(--tc-app-shell-panel-radius) 0;
    background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
    animation: ui-agnt-panel-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
  .ui-agnt__scrim {
    display: block;
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 1);
    inset: 0;
    border-radius: inherit;
    background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6)));
  }
  .ui-agnt__main > .ui-agnt__bar { padding-left: calc(var(--tc-space-12, 48px) + var(--tc-space-1, 4px)); }
}
@keyframes ui-agnt-panel-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@container ui-as (max-width: 600px) {
  .ui-agnt__scroll { padding: var(--tc-space-4, 16px); }
  .ui-agnt__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-agnt__panel { width: 100%; border-radius: var(--tc-app-shell-panel-radius); }
}
`;
