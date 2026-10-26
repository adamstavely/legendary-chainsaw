"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

/*
 * Client Context – one client's numbers, reports and shared context, in a single self-contained file.
 * Switch or create clients, refresh the sync, open a metric, regenerate a report, and keep a timeline of notes
 * and files the whole team writes into: search it, filter it, mention reports with "@" and attach files.
 * The styles are injected below; buttons and the section tabs are the library's Button and SegmentedControl (copy
 * `button.tsx` and `segmented-control.tsx` alongside), everything else uses the shared pattern tokens.
 *
 * Keyboard: the client and filter popovers take focus, move with the arrow keys and give it back to their button on
 * Esc or a pick; when something under focus goes away (a removed note or file, Clear search, Show everything) focus
 * moves to the nearest stable control. Sync results and mention suggestions are announced in narrow status regions.
 */

export type ContextPerson = { name: string; avatar?: string };
export type ContextFile = { name: string; type: "pdf" | "xlsx" | "csv" | "doc" };
export type ContextEntry =
  /** A note – "@Report name" of one of the client's reports becomes a mention */
  | { id: string; kind: "note"; author: ContextPerson; when: string; text: string }
  | { id: string; kind: "report"; author: ContextPerson; when: string; report: string }
  | { id: string; kind: "files"; author: ContextPerson; when: string; files: ContextFile[]; text?: string }
  | { id: string; kind: "integration"; when: string; app: string; connected: boolean };
export type ContextKpi = { label: string; value: string; previous: string; delta: number; points: number[]; color: string };
export type ContextReport = { name: string; when: string; summary: string };
export type ContextClient = {
  id: string;
  name: string;
  /** Second line under the name, e.g. legal name, currency and fiscal year end */
  meta: string;
  /** Initial and colors of the client's mark */
  mark: { letter: string; bg: string; fg: string };
  kpis: ContextKpi[];
  reports: ContextReport[];
  context: ContextEntry[];
};

type OwnProps = {
  /**
   * The clients and their context. Context added or removed in the block is kept per client until you pass a
   * different context for that client – then your data wins
   */
  clients?: ContextClient[];
  /** Id of the open client (controlled) – pass `onClientChange` with it. Leave undefined to start at `defaultClient` (the first) */
  client?: string;
  defaultClient?: string;
  onClientChange?: (id: string) => void;
  /** The signed-in person – author of new context */
  me?: ContextPerson;
  /** Called when context is added, with the client, the text and any attached files */
  onAddContext?: (clientId: string, text: string, files: ContextFile[]) => void;
  /** Called when a client is created from the switcher */
  onCreateClient?: (name: string) => void;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type ClientContextProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

type Kind = ContextEntry["kind"];
type Tab = "context" | "reports" | "financials" | "settings";

const people = {
  lena: { name: "Lena Hart", avatar: "/avatars/lena.jpg" },
  jonas: { name: "Jonas Weber", avatar: "/avatars/jonas.jpg" },
  mara: { name: "Mara Novak", avatar: "/avatars/mara.jpg" },
  theo: { name: "Theo Brandt", avatar: "/avatars/theo.jpg" },
};

const defaultClients: ContextClient[] = [
  {
    id: "northwind",
    name: "Northwind Logistics",
    meta: "Northwind Logistics GmbH · EUR · Fiscal year ends Dec 31",
    mark: { letter: "N", bg: "#1d4ed8", fg: "#ffffff" },
    kpis: [
      { label: "MRR", value: "€48.2k", previous: "€44.9k", delta: 7.4, points: [31, 33, 32, 35, 36, 35, 38, 40, 41, 44], color: "#2f6bff" },
      { label: "Cash", value: "€612k", previous: "€648k", delta: -5.6, points: [44, 43, 43, 41, 40, 41, 38, 37, 36, 35], color: "#0ea5e9" },
      { label: "Gross margin", value: "64.1%", previous: "62.8%", delta: 1.3, points: [30, 31, 30, 32, 31, 33, 32, 33, 34, 34], color: "#8b5cf6" },
      { label: "Net burn", value: "€36.0k", previous: "€41.5k", delta: -13.3, points: [42, 41, 43, 40, 39, 38, 39, 36, 35, 33], color: "#ec4899" },
    ],
    reports: [
      { name: "Monthly P&L", when: "1d ago", summary: "Revenue up 7% on the new Hamburg routes; freight costs flat, so margin improved by 1.3 points." },
      { name: "Cash runway", when: "6d ago", summary: "17 months at the current burn. The Q1 fleet lease pushes it to 15 if signed in January." },
      { name: "Board pack Q3", when: "2w ago", summary: "Highlights, KPIs and the three decisions for the board: pricing, fleet lease and the Nordics pilot." },
    ],
    context: [
      {
        id: "n1",
        kind: "note",
        author: people.lena,
        when: "today",
        text: "CFO wants every figure in the @Monthly P&L in EUR, also for the Danish entity – no converted totals.",
      },
      { id: "n2", kind: "report", author: people.jonas, when: "1d ago", report: "Monthly P&L" },
      {
        id: "n3",
        kind: "files",
        author: people.jonas,
        when: "2d ago",
        files: [
          { name: "budget-2027.pdf", type: "pdf" },
          { name: "fleet-costs-Q3.xlsx", type: "xlsx" },
        ],
      },
      {
        id: "n4",
        kind: "note",
        author: people.lena,
        when: "4d ago",
        text: "Renewal talks start in November. They'll ask for a lower rate if the Nordics pilot slips – keep the @Cash runway current.",
      },
      { id: "n5", kind: "integration", when: "1w ago", app: "Stripe", connected: true },
    ],
  },
  {
    id: "lumen",
    name: "Lumen Labs",
    meta: "Lumen Labs, Inc. · GBP · Fiscal year ends Mar 31",
    mark: { letter: "L", bg: "#f97316", fg: "#ffffff" },
    kpis: [
      { label: "ARR", value: "£1.84m", previous: "£1.62m", delta: 13.6, points: [20, 22, 23, 25, 27, 28, 30, 33, 35, 38], color: "#2f6bff" },
      { label: "Cash", value: "£980k", previous: "£1.06m", delta: -7.5, points: [46, 45, 43, 42, 41, 40, 38, 37, 36, 35], color: "#0ea5e9" },
      { label: "Gross margin", value: "78.0%", previous: "77.2%", delta: 0.8, points: [36, 36, 37, 36, 37, 37, 38, 37, 38, 38], color: "#8b5cf6" },
      { label: "Runway", value: "17 mo", previous: "18 mo", delta: -5.6, points: [40, 39, 39, 38, 37, 37, 36, 35, 35, 34], color: "#ec4899" },
    ],
    reports: [{ name: "Runway forecast", when: "today", summary: "Hiring four engineers in Q1 shortens the runway from 19 to 17 months." }],
    context: [
      { id: "l1", kind: "report", author: people.mara, when: "today", report: "Runway forecast" },
      {
        id: "l2",
        kind: "note",
        author: people.mara,
        when: "2d ago",
        text: "Hiring plan adds four engineers in Q1 – reflect it in the @Runway forecast before the board meeting.",
      },
      { id: "l3", kind: "files", author: people.theo, when: "4d ago", files: [{ name: "hiring-plan.doc", type: "doc" }] },
    ],
  },
  {
    id: "halcyon",
    name: "Halcyon Health",
    meta: "Halcyon Health Ltd · USD · Fiscal year ends Jun 30",
    mark: { letter: "H", bg: "#0f766e", fg: "#ffffff" },
    kpis: [
      { label: "Revenue", value: "$212k", previous: "$198k", delta: 7.1, points: [30, 29, 31, 33, 32, 34, 35, 34, 36, 37], color: "#2f6bff" },
      { label: "Cash", value: "$1.21m", previous: "$1.19m", delta: 1.7, points: [38, 38, 39, 38, 39, 40, 39, 40, 41, 41], color: "#0ea5e9" },
      { label: "Gross margin", value: "58.3%", previous: "59.0%", delta: -0.7, points: [36, 35, 36, 35, 35, 34, 35, 34, 34, 33], color: "#8b5cf6" },
      { label: "Net profit", value: "$18.4k", previous: "$12.0k", delta: 53.3, points: [20, 21, 19, 22, 24, 23, 26, 27, 29, 31], color: "#ec4899" },
    ],
    reports: [{ name: "Clinic margins", when: "3d ago", summary: "Two of nine clinics run below 40% margin; both opened this year." }],
    context: [
      {
        id: "h1",
        kind: "note",
        author: people.theo,
        when: "yesterday",
        text: "New clinics need 12 months before they count in the @Clinic margins comparison.",
      },
      { id: "h2", kind: "integration", when: "2w ago", app: "Stripe", connected: true },
    ],
  },
];

const kindLabels: Record<"all" | Kind, string> = {
  all: "All",
  note: "Notes",
  files: "Files",
  report: "Reports",
  integration: "Integrations",
};

const tabs: { id: Tab; label: string }[] = [
  { id: "context", label: "Context" },
  { id: "reports", label: "Reports" },
  { id: "financials", label: "Financials" },
  { id: "settings", label: "Settings" },
];

/** Files the attach button adds in turn */
const attachable: ContextFile[] = [
  { name: "board-deck-Q3.pdf", type: "pdf" },
  { name: "pipeline-export.csv", type: "csv" },
  { name: "headcount.xlsx", type: "xlsx" },
];

const palette = ["#7c3aed", "#db2777", "#0891b2", "#65a30d"];

/** What a client's context was when it was last copied here – a changed context from the parent replaces local edits */
const signature = (entries: ContextEntry[]) => JSON.stringify(entries);

export function ClientContext({
  clients: clientsProp = defaultClients,
  client: clientProp,
  defaultClient,
  onClientChange,
  me = { name: "Sofia Lind", avatar: "/avatars/sofia.jpg" },
  onAddContext,
  onCreateClient,
  className,
  ref,
  ...rest
}: ClientContextProps) {
  const uid = "ui-cx" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // Clients created here, after the ones passed in
  const [created, setCreated] = useState<ContextClient[]>([]);
  const clients = [...clientsProp, ...created.filter((c) => !clientsProp.some((p) => p.id === c.id))];
  const [clientId, setClientId] = useControllable(clientProp, defaultClient ?? clientsProp[0]?.id ?? "", onClientChange, "client");
  // Context added or removed here, per client – kept until the parent passes a different context for that client
  const [timeline, setTimeline] = useState<Record<string, { base: string; entries: ContextEntry[] }>>({});
  const [reportTimes, setReportTimes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("context");
  const [metric, setMetric] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [menu, setMenu] = useState<"client" | "filter" | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [synced, setSynced] = useState<Record<string, "3m ago" | "syncing" | "just now">>({});
  const [settings, setSettings] = useState<Record<string, Record<string, boolean>>>({});
  const [fresh, setFresh] = useState<string | null>(null);
  const later = useLater();
  // Where focus goes after the next commit – a selector inside the block (see S4: focus never drops to <body>)
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLElement | null }).current = node;
    },
    [ref],
  );
  const focusNext = useRef<string[] | null>(null);
  useLayoutEffect(() => {
    const targets = focusNext.current;
    if (!targets) return;
    focusNext.current = null;
    for (const t of targets) {
      const el = rootRef.current?.querySelector<HTMLElement>(t);
      if (el) {
        el.focus({ preventScroll: true });
        return;
      }
    }
  });

  const client = clients.find((c) => c.id === clientId) ?? clients[0];
  const entriesOf = (c: ContextClient, kept: typeof timeline) => {
    const local = kept[c.id];
    return local && local.base === signature(c.context) ? local.entries : c.context;
  };
  const entries = entriesOf(client, timeline);
  const reportNames = client.reports.map((r) => r.name);
  const shown = entries.filter((e) => (filter === "all" || e.kind === filter) && matches(e, query));
  const sync = synced[client.id] ?? "3m ago";
  const setting = (key: string, fallback: boolean) => settings[client.id]?.[key] ?? fallback;
  const stripe = entries.find((e) => e.kind === "integration" && e.app === "Stripe") as
    | Extract<ContextEntry, { kind: "integration" }>
    | undefined;
  const stripeOn = stripe?.connected ?? false;
  const { textarea, draft, setDraft, setCaret, suggestions, onDraft, insertMention, closeMentions, appendMention } = useDraft(reportNames, later);

  // Popovers close on an outside click (Esc is handled inside them, so focus can return to their button)
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-cx-menu]")) {
        setMenu(null);
        setCreating(false);
      }
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [menu]);

  /** Changes this client's timeline (the client it was when the action started, even if another one is open by now) */
  const edit = (of: ContextClient, change: (entries: ContextEntry[]) => ContextEntry[]) =>
    setTimeline((t) => ({ ...t, [of.id]: { base: signature(of.context), entries: change(entriesOf(of, t)) } }));
  const push = (entry: ContextEntry, of = client) => {
    edit(of, (list) => [entry, ...list]);
    setFresh(entry.id);
  };

  const pickClient = (id: string) => {
    setClientId(id);
    setMenu(null);
    setCreating(false);
    setQuery("");
    setFilter("all");
    setMetric(null);
    setOpenReport(null);
  };

  const createClient = () => {
    const name = newName.trim();
    if (!name) return;
    const id = `client-${Date.now()}`;
    const made: ContextClient = {
      id,
      name,
      meta: "New client · connect their books under Settings",
      mark: { letter: name.charAt(0).toUpperCase(), bg: palette[clients.length % palette.length], fg: "#ffffff" },
      kpis: client.kpis.map((k) => ({ ...k, value: "–", previous: "–", delta: 0, points: k.points.map(() => 1) })),
      reports: [],
      context: [],
    };
    setCreated((c) => [...c, made]);
    onCreateClient?.(name);
    setNewName("");
    pickClient(id);
    setTab("context");
  };

  const [syncNote, setSyncNote] = useState("");
  const refresh = () => {
    if (sync === "syncing") return;
    const id = client.id;
    setSynced((s) => ({ ...s, [id]: "syncing" }));
    later(() => {
      setSynced((s) => ({ ...s, [id]: "just now" }));
      setSyncNote("Synced just now");
    }, 900);
  };

  const add = () => {
    const text = draft.trim();
    if (!text && !files.length) return;
    const id = `new-${Date.now()}`;
    push(
      files.length
        ? { id, kind: "files", author: me, when: "just now", files, text: text || undefined }
        : { id, kind: "note", author: me, when: "just now", text },
    );
    onAddContext?.(client.id, text, files);
    setDraft("");
    setFiles([]);
    setFilter("all");
    setQuery("");
    closeMentions();
    // Add context turns disabled once the box is empty – keep writing in the box
    focusNext.current = [".ui-cx__composer textarea"];
  };

  /** Removes an entry; focus moves to the next (or previous) entry's remove button, else the note box */
  const remove = (id: string) => {
    const at = shown.findIndex((e) => e.id === id);
    const ids = [...shown.slice(at + 1), ...shown.slice(0, at).reverse()].map((e) => e.id);
    focusNext.current = [...ids.map((x) => `[data-entry="${CSS.escape(x)}"] .ui-cx__remove`), ".ui-cx__composer textarea"];
    edit(client, (list) => list.filter((e) => e.id !== id));
  };
  const detach = (name: string) => {
    const at = files.findIndex((f) => f.name === name);
    const rest = files.filter((f) => f.name !== name);
    const next = rest[at] ?? rest[at - 1];
    focusNext.current = [...(next ? [`[data-file="${CSS.escape(next.name)}"] button`] : []), ".ui-cx__attach"];
    setFiles(rest);
  };

  const attach = () => {
    // aria-disabled (not disabled) once every file is attached, so focus stays on the button
    const next = attachable.find((f) => !files.some((x) => x.name === f.name));
    if (next) setFiles((f) => [...f, next]);
  };

  const showReport = (name: string) => {
    setTab("reports");
    setOpenReport(name);
  };

  const mentionInContext = (name: string) => {
    setTab("context");
    appendMention(name);
  };

  const regenerate = (name: string) => {
    if (regenerating) return;
    const of = client;
    const key = `${of.id}:${name}`;
    setRegenerating(key);
    later(() => {
      setRegenerating(null);
      setReportTimes((t) => ({ ...t, [key]: "just now" }));
      push({ id: `rep-${Date.now()}`, kind: "report", author: me, when: "just now", report: name }, of);
    }, 1100);
  };

  const toggleStripe = () =>
    push({ id: `int-${Date.now()}`, kind: "integration", when: "just now", app: "Stripe", connected: !stripeOn });

  const openMetric = (label: string) => {
    setMetric(label);
    setTab("financials");
  };

  return (
    <section {...rest} ref={setRoot} className={["ui-cx", className].filter(Boolean).join(" ")}>
      <style href="ui-client-context" precedence="default">
        {css}
      </style>

      <Header client={client} sync={sync} syncNote={syncNote} onSync={refresh}>
        <ClientSwitcher
          clients={clients}
          current={client}
          open={menu === "client"}
          onOpen={(open) => {
            setMenu(open ? "client" : null);
            setCreating(false);
          }}
          onPick={pickClient}
          creating={creating}
          onCreating={() => setCreating(true)}
          newName={newName}
          onNewName={setNewName}
          onCreate={createClient}
        />
      </Header>

      {/* KPI cards – each opens its metric under Financials */}
      <KpiRow key={`k-${client.id}`} kpis={client.kpis} active={tab === "financials" ? metric : null} onOpen={openMetric} />

      {/* Main card */}
      <div className="ui-cx__card">
        <div className="ui-cx__toolbar">
          <Tabs uid={uid} tab={tab} onTab={setTab} />
          {tab === "context" && (
            <ContextTools
              query={query}
              onQuery={setQuery}
              onClear={() => {
                // The × goes away with the text – focus stays in the search field
                focusNext.current = [".ui-cx__search input"];
                setQuery("");
              }}
              filter={filter}
              onFilter={setFilter}
              open={menu === "filter"}
              onOpen={(open) => setMenu(open ? "filter" : null)}
              entries={entries}
            />
          )}
        </div>

        <div
          className="ui-cx__panel"
          id={`${uid}-panel`}
          role="tabpanel"
          aria-label={tabs.find((t) => t.id === tab)?.label}
          key={`${tab}-${client.id}`}
        >
          {tab === "context" && (
            <>
              <Composer
                me={me}
                textarea={textarea}
                draft={draft}
                files={files}
                suggestions={suggestions}
                hasReports={client.reports.length > 0}
                onDraft={onDraft}
                onCaret={setCaret}
                onMention={insertMention}
                onCloseMentions={closeMentions}
                onAttach={attach}
                onDetach={detach}
                onAdd={add}
              />

              <Timeline
                entries={entries}
                shown={shown}
                fresh={fresh}
                query={query}
                filter={filter}
                reports={reportNames}
                me={me}
                onReport={showReport}
                onRemove={remove}
                onShowAll={() => {
                  focusNext.current = [".ui-cx__search input"];
                  setQuery("");
                  setFilter("all");
                }}
              />
            </>
          )}

          {tab === "reports" && (
            <ReportsTab
              client={client}
              openReport={openReport}
              onOpenReport={setOpenReport}
              regenerating={regenerating}
              reportTimes={reportTimes}
              onMention={mentionInContext}
              onRegenerate={regenerate}
            />
          )}

          {tab === "financials" && <FinancialsTab kpis={client.kpis} metric={metric} onMetric={setMetric} />}

          {tab === "settings" && (
            <SettingsTab
              stripeOn={stripeOn}
              onStripe={toggleStripe}
              setting={setting}
              onSetting={(key, on) => setSettings((s) => ({ ...s, [client.id]: { ...s[client.id], [key]: on } }))}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Parts of the block ---------- */

/** The client's mark and name on the tray, with Sync now and the client switcher */
function Header({ client, sync, syncNote, onSync, children }: { client: ContextClient; sync: string; syncNote: string; onSync: () => void; children: ReactNode }) {
  return (
    <header className="ui-cx__head">
      <div className="ui-cx__who" key={client.id}>
        <Mark client={client} size={36} />
        <div className="ui-cx__who-text">
          <h2 className="ui-cx__name">{client.name}</h2>
          <p className="ui-cx__meta">{client.meta}</p>
        </div>
      </div>
      <div className="ui-cx__actions">
        {/* Named by what it shows, plus what pressing does (label in name, 2.5.3) */}
        <Button
          variant="secondary"
          className="ui-cx__sync"
          aria-busy={sync === "syncing" || undefined}
          icon={<span className="ui-cx__sync-dot" data-state={sync} />}
          iconRight={
            <span className="ui-cx__spin" data-spinning={sync === "syncing" || undefined}>
              <RefreshIcon />
            </span>
          }
          onClick={onSync}
        >
          {sync === "syncing" ? "Syncing…" : `Synced ${sync}`}
          <span className="ui-cx__sr">, sync now</span>
        </Button>
        <span className="ui-cx__sr" role="status">
          {syncNote}
        </span>
        {children}
      </div>
    </header>
  );
}

/** The context timeline, or why it is empty */
function Timeline({
  entries,
  shown,
  fresh,
  query,
  filter,
  reports,
  me,
  onReport,
  onRemove,
  onShowAll,
}: {
  entries: ContextEntry[];
  shown: ContextEntry[];
  fresh: string | null;
  query: string;
  filter: "all" | Kind;
  reports: string[];
  me: ContextPerson;
  onReport: (name: string) => void;
  onRemove: (id: string) => void;
  onShowAll: () => void;
}) {
  return shown.length > 0 ? (
    <ol className="ui-cx__timeline">
      {shown.map((e) => (
        <Item
          key={e.id}
          entry={e}
          fresh={e.id === fresh}
          query={query}
          reports={reports}
          mine={"author" in e && e.author.name === me.name}
          onReport={onReport}
          onRemove={() => onRemove(e.id)}
        />
      ))}
    </ol>
  ) : (
    <div className="ui-cx__empty">
      {entries.length === 0 ? (
        <p>No context yet – add the first goal or file above.</p>
      ) : (
        <p>
          Nothing matches{query ? ` “${query}”` : ""}
          {filter !== "all" ? ` in ${kindLabels[filter].toLowerCase()}` : ""}.{" "}
          <button type="button" onClick={onShowAll}>
            Show everything
          </button>
        </p>
      )}
    </div>
  );
}

/** The KPI cards on the tray – each opens its metric under Financials */
function KpiRow({ kpis, active, onOpen }: { kpis: ContextKpi[]; active: string | null; onOpen: (label: string) => void }) {
  return (
    <div className="ui-cx__kpis">
      {kpis.map((k, i) => (
        <button
          key={k.label}
          type="button"
          className="ui-cx__kpi"
          aria-pressed={active === k.label}
          onClick={() => onOpen(k.label)}
        >
          <span className="ui-cx__kpi-label">{k.label}</span>
          <span className="ui-cx__kpi-row">
            <span className="ui-cx__kpi-value">{k.value}</span>
            <Spark points={k.points} color={k.color} delay={i * 90} />
          </span>
        </button>
      ))}
    </div>
  );
}

/** Context · Reports · Financials · Settings – the library's SegmentedControl as tabs for the panel below */
function Tabs({ uid, tab, onTab }: { uid: string; tab: Tab; onTab: (tab: Tab) => void }) {
  return (
    <SegmentedControl
      kind="tabs"
      className="ui-cx__seg"
      aria-label="Client sections"
      value={tab}
      onChange={onTab}
      options={tabs.map((t) => ({ value: t.id, label: t.label, controls: `${uid}-panel` }))}
    />
  );
}

/**
 * A popover's keyboard: focus moves to the current (or first) item when it opens, Up / Down / Home / End move,
 * Esc closes it and returns focus to its button; picking an item returns focus there too (see `close`)
 */
function usePopover(open: boolean, onOpen: (open: boolean) => void) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const items = () => [...(panel.current?.querySelectorAll<HTMLElement>("[data-cx-item]") ?? [])];
  useLayoutEffect(() => {
    if (!open) return;
    (panel.current?.querySelector<HTMLElement>("[data-cx-item][aria-current='true'], [data-cx-item][aria-pressed='true']") ?? items()[0])?.focus({
      preventScroll: true,
    });
  }, [open]);
  const close = () => {
    onOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    list[(next + list.length) % list.length]?.focus();
  };
  return { trigger, panel, close, onKeyDown };
}

/** "Switch client" with its menu and the New client form */
function ClientSwitcher({
  clients,
  current,
  open,
  onOpen,
  onPick,
  creating,
  onCreating,
  newName,
  onNewName,
  onCreate,
}: {
  clients: ContextClient[];
  current: ContextClient;
  open: boolean;
  onOpen: (open: boolean) => void;
  onPick: (id: string) => void;
  creating: boolean;
  onCreating: () => void;
  newName: string;
  onNewName: (name: string) => void;
  onCreate: () => void;
}) {
  const panelId = useId();
  const pop = usePopover(open, onOpen);
  return (
    <div className="ui-cx__pop" data-cx-menu="">
      {/* A disclosure with a list of buttons (no listbox role, so no listbox keyboard contract to break) */}
      <Button
        ref={pop.trigger}
        variant="secondary"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        iconRight={<ChevronsIcon />}
        onClick={() => onOpen(!open)}
      >
        Switch client
      </Button>
      {open && (
        <div className="ui-cx__menu ui-cx__menu--end" id={panelId} ref={pop.panel} onKeyDown={pop.onKeyDown}>
          <ul aria-label="Clients">
            {clients.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  data-cx-item=""
                  aria-current={c.id === current.id || undefined}
                  className="ui-cx__menu-item"
                  onClick={() => {
                    onPick(c.id);
                    pop.trigger.current?.focus({ preventScroll: true });
                  }}
                >
                  <Mark client={c} size={20} />
                  <span className="ui-cx__menu-label">{c.name}</span>
                  <span className="ui-cx__menu-check">{c.id === current.id && <CheckIcon />}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="ui-cx__menu-sep" />
          {creating ? (
            <form
              className="ui-cx__create"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                onCreate();
                pop.trigger.current?.focus({ preventScroll: true });
              }}
            >
              <input autoFocus value={newName} onChange={(e) => onNewName(e.target.value)} placeholder="Client name" aria-label="New client name" maxLength={40} />
              <Button type="submit" size="sm" aria-disabled={!newName.trim() || undefined} className="ui-cx__add-client">
                Add
              </Button>
            </form>
          ) : (
            <button type="button" data-cx-item="" className="ui-cx__menu-item" onClick={onCreating}>
              <span className="ui-cx__menu-plus">
                <PlusIcon />
              </span>
              <span className="ui-cx__menu-label">New client</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Search and the kind filter above the timeline */
function ContextTools({
  query,
  onQuery,
  onClear,
  filter,
  onFilter,
  open,
  onOpen,
  entries,
}: {
  query: string;
  onQuery: (query: string) => void;
  onClear: () => void;
  filter: "all" | Kind;
  onFilter: (filter: "all" | Kind) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
  entries: ContextEntry[];
}) {
  const panelId = useId();
  const pop = usePopover(open, onOpen);
  return (
    <div className="ui-cx__tools">
      <label className="ui-cx__search">
        <SearchIcon />
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search" aria-label="Search context" />
        {query && (
          <button type="button" className="ui-cx__clear" aria-label="Clear search" onClick={onClear}>
            <CloseIcon />
          </button>
        )}
      </label>
      <div className="ui-cx__pop" data-cx-menu="">
        <Button
          ref={pop.trigger}
          variant="secondary"
          className="ui-cx__filter-btn"
          aria-label={`Show: ${kindLabels[filter]}`}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          data-active={filter !== "all" || undefined}
          icon={<FilterIcon />}
          onClick={() => onOpen(!open)}
        >
          {kindLabels[filter]}
        </Button>
        {open && (
          <div className="ui-cx__menu ui-cx__menu--end" id={panelId} ref={pop.panel} onKeyDown={pop.onKeyDown}>
            <ul aria-label="Show">
              {(Object.keys(kindLabels) as ("all" | Kind)[]).map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    data-cx-item=""
                    aria-pressed={filter === k}
                    className="ui-cx__menu-item"
                    onClick={() => {
                      onFilter(k);
                      pop.close();
                    }}
                  >
                    <span className="ui-cx__menu-label">{kindLabels[k]}</span>
                    <span className="ui-cx__menu-count">{k === "all" ? entries.length : entries.filter((e) => e.kind === k).length}</span>
                    <span className="ui-cx__menu-check">{filter === k && <CheckIcon />}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** The note box: @-mentions of reports, attached files, ⌘ Enter to add */
function Composer({
  me,
  textarea,
  draft,
  files,
  suggestions,
  hasReports,
  onDraft,
  onCaret,
  onMention,
  onCloseMentions,
  onAttach,
  onDetach,
  onAdd,
}: {
  me: ContextPerson;
  textarea: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  files: ContextFile[];
  suggestions: string[];
  hasReports: boolean;
  onDraft: (value: string, caret: number) => void;
  onCaret: (caret: number) => void;
  onMention: (name: string) => void;
  onCloseMentions: () => void;
  onAttach: () => void;
  onDetach: (name: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="ui-cx__compose">
      <Avatar person={me} size={28} />
      <div className="ui-cx__composer">
        <textarea
          ref={textarea}
          value={draft}
          onChange={(e) => onDraft(e.target.value, e.target.selectionStart)}
          onSelect={(e) => onCaret(e.currentTarget.selectionStart)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (suggestions.length && (e.key === "Enter" || e.key === "Tab")) {
              e.preventDefault();
              onMention(suggestions[0]);
              return;
            }
            if (e.key === "Escape") onCloseMentions();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onAdd();
            }
          }}
          rows={2}
          placeholder={hasReports ? "Add a goal, request or decision – type @ to mention a report" : "Add a goal, request or decision for this client"}
          aria-label="New context"
        />
        {/* Enter or Tab inserts the first suggestion (it is marked); the others are buttons */}
        <span className="ui-cx__sr" role="status">
          {suggestions.length > 0 ? `${suggestions.length} ${suggestions.length === 1 ? "report" : "reports"} to mention – Enter inserts ${suggestions[0]}` : ""}
        </span>
        {suggestions.length > 0 && (
          <ul className="ui-cx__suggest" aria-label="Mention a report">
            {suggestions.map((n, i) => (
              <li key={n}>
                <button
                  type="button"
                  data-first={i === 0 || undefined}
                  className="ui-cx__menu-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onMention(n)}
                >
                  <DocIcon />
                  <span className="ui-cx__menu-label">{n}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length > 0 && (
          <div className="ui-cx__attached">
            {files.map((f) => (
              <span key={f.name} className="ui-cx__file-chip" data-file={f.name}>
                <FileIcon type={f.type} />
                {f.name}
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onDetach(f.name)}>
                  <CloseIcon />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="ui-cx__composer-bar">
          <Button
            variant="ghost"
            size="sm"
            className="ui-cx__attach"
            aria-label="Attach a file"
            aria-disabled={files.length >= attachable.length || undefined}
            icon={<PaperclipIcon />}
            onClick={() => files.length < attachable.length && onAttach()}
          />
          <span className="ui-cx__hint" aria-hidden="true">
            <kbd>⌘</kbd>
            <kbd>Enter</kbd>
          </span>
          <Button size="sm" className="ui-cx__add" onClick={onAdd} disabled={!draft.trim() && !files.length}>
            Add context
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportsTab({
  client,
  openReport,
  onOpenReport,
  regenerating,
  reportTimes,
  onMention,
  onRegenerate,
}: {
  client: ContextClient;
  openReport: string | null;
  onOpenReport: (name: string | null) => void;
  /** "<client id>:<report name>" while that report regenerates */
  regenerating: string | null;
  reportTimes: Record<string, string>;
  onMention: (name: string) => void;
  onRegenerate: (name: string) => void;
}) {
  if (!client.reports.length)
    return (
      <div className="ui-cx__empty ui-cx__empty--flush">
        <p>No reports yet. Connect the books under Settings to generate the first one.</p>
      </div>
    );
  return (
    <ul className="ui-cx__list">
      {client.reports.map((r) => {
        const open = openReport === r.name;
        const busy = regenerating === `${client.id}:${r.name}`;
        const bodyId = `${client.id}-${r.name}`.replace(/[^\w-]/g, "-");
        return (
          <li key={r.name} className="ui-cx__report" data-open={open || undefined}>
            <button type="button" className="ui-cx__report-head" aria-expanded={open} aria-controls={bodyId} onClick={() => onOpenReport(open ? null : r.name)}>
              <span className="ui-cx__row-icon">
                <ChartIcon />
              </span>
              <span className="ui-cx__row-main">
                <strong>{r.name}</strong>
                <span>{busy ? "Regenerating…" : `Generated ${reportTimes[`${client.id}:${r.name}`] ?? r.when}`}</span>
              </span>
              <span className="ui-cx__chevron">
                <ChevronIcon />
              </span>
            </button>
            {/* Collapsed: inert, so its buttons are out of the tab order and the accessibility tree */}
            <div className="ui-cx__report-body" id={bodyId} inert={!open}>
              <div>
                <p>{r.summary}</p>
                <div className="ui-cx__report-actions">
                  <Button variant="secondary" size="sm" icon={<AtIcon />} onClick={() => onMention(r.name)}>
                    Mention in context
                  </Button>
                  {/* aria-disabled while it runs, so focus stays on it */}
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-disabled={busy || undefined}
                    icon={
                      <span className="ui-cx__spin" data-spinning={busy || undefined}>
                        <RefreshIcon />
                      </span>
                    }
                    onClick={() => !busy && onRegenerate(r.name)}
                  >
                    {busy ? "Regenerating…" : "Regenerate"}
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FinancialsTab({ kpis, metric, onMetric }: { kpis: ContextKpi[]; metric: string | null; onMetric: (label: string | null) => void }) {
  return (
    <ul className="ui-cx__list">
      {kpis.map((k) => (
        <li key={k.label} className="ui-cx__fin" data-active={metric === k.label || undefined}>
          <button type="button" onClick={() => onMetric(metric === k.label ? null : k.label)} aria-pressed={metric === k.label}>
            <span className="ui-cx__fin-dot" style={{ background: k.color }} />
            <span className="ui-cx__row-main">
              <strong>{k.label}</strong>
              <span>Previous month {k.previous}</span>
            </span>
            <Spark points={k.points} color={k.color} delay={0} wide />
            <span className="ui-cx__fin-value">
              <strong>{k.value}</strong>
              {k.value !== "–" && (
                <span data-trend={k.delta >= 0 ? "up" : "down"}>
                  {k.delta >= 0 ? "+" : "−"}
                  {Math.abs(k.delta).toFixed(1)}%
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SettingsTab({
  stripeOn,
  onStripe,
  setting,
  onSetting,
}: {
  stripeOn: boolean;
  onStripe: () => void;
  setting: (key: string, fallback: boolean) => boolean;
  onSetting: (key: string, on: boolean) => void;
}) {
  return (
    <ul className="ui-cx__list">
      <li className="ui-cx__row">
        <span className="ui-cx__app">
          <StripeMark />
        </span>
        <span className="ui-cx__row-main">
          <strong>Stripe</strong>
          <span>{stripeOn ? "Revenue and payouts sync every hour" : "Not connected"}</span>
        </span>
        <Button variant="secondary" size="sm" aria-label={`${stripeOn ? "Disconnect" : "Connect"} Stripe`} onClick={onStripe}>
          {stripeOn ? "Disconnect" : "Connect"}
        </Button>
      </li>
      {(
        [
          ["ai", "Use context in AI answers", "Notes and files are read before every answer", true],
          ["digest", "Daily digest", "A short email when new context or files arrive", false],
          ["share", "Share reports with the client", "Generated reports show up in their portal", false],
        ] as const
      ).map(([key, label, hint, fallback]) => {
        const on = setting(key, fallback);
        return (
          <li key={key} className="ui-cx__row">
            <span className="ui-cx__row-main">
              <strong>{label}</strong>
              <span>{hint}</span>
            </span>
            <button type="button" role="switch" aria-checked={on} aria-label={label} className="ui-cx__toggle" onClick={() => onSetting(key, !on)}>
              <span />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The note being written, with @-mentions of the client's reports suggested from the "@" up to the caret */
function useDraft(reportNames: string[], later: (run: () => void, ms?: number) => void) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [caret, setCaret] = useState(0);
  const [mentionAt, setMentionAt] = useState<number | null>(null);

  // Mention suggestions: "@" plus what follows it, up to the caret
  const mentionQuery = mentionAt !== null ? draft.slice(mentionAt + 1, caret) : null;
  const suggestions =
    mentionQuery !== null && !/\n/.test(mentionQuery)
      ? reportNames.filter((n) => n.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 4)
      : [];

  const onDraft = (value: string, at: number) => {
    setDraft(value);
    setCaret(at);
    // An "@" at the start or after a space opens the suggestions
    const before = value.slice(0, at);
    const sign = before.lastIndexOf("@");
    setMentionAt(sign >= 0 && (sign === 0 || /\s/.test(before[sign - 1])) && !/\n|\s\s/.test(before.slice(sign)) ? sign : null);
  };

  const insertMention = (name: string) => {
    if (mentionAt === null) return;
    const next = `${draft.slice(0, mentionAt)}@${name} ${draft.slice(caret)}`;
    const at = mentionAt + name.length + 2;
    setDraft(next);
    setCaret(at);
    setMentionAt(null);
    later(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(at, at);
    });
  };

  const appendMention = (name: string) => {
    setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${name} `);
    later(() => textarea.current?.focus());
  };

  return { textarea, draft, setDraft, setCaret, suggestions, onDraft, insertMention, closeMentions: () => setMentionAt(null), appendMention };
}

/** Runs a callback after a delay (or on the next frame) – everything still pending is cancelled on unmount */
function useLater() {
  const pending = useRef(new Set<() => void>());
  useEffect(() => {
    const all = pending.current;
    return () => {
      for (const cancel of all) cancel();
      all.clear();
    };
  }, []);
  return useCallback((run: () => void, ms?: number) => {
    let cancel = () => {};
    const done = () => {
      pending.current.delete(cancel);
      run();
    };
    if (ms === undefined) {
      const frame = requestAnimationFrame(done);
      cancel = () => cancelAnimationFrame(frame);
    } else {
      const timer = window.setTimeout(done, ms);
      cancel = () => window.clearTimeout(timer);
    }
    pending.current.add(cancel);
  }, []);
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

/* ---------- Timeline entries ---------- */

function Item({
  entry,
  fresh,
  query,
  reports,
  mine,
  onReport,
  onRemove,
}: {
  entry: ContextEntry;
  fresh: boolean;
  query: string;
  reports: string[];
  mine: boolean;
  onReport: (name: string) => void;
  onRemove: () => void;
}) {
  const hl = (text: string) => highlight(text, query);
  const reportLink = (name: string) =>
    reports.includes(name) ? (
      <button type="button" className="ui-cx__ref" onClick={() => onReport(name)}>
        {hl(name)}
      </button>
    ) : (
      <span className="ui-cx__ref">{hl(name)}</span>
    );

  return (
    <li className="ui-cx__item" data-entry={entry.id} data-fresh={fresh || undefined}>
      <span className="ui-cx__node" data-kind={entry.kind}>
        {entry.kind === "note" ? (
          <NoteIcon />
        ) : entry.kind === "report" ? (
          <ChartIcon />
        ) : entry.kind === "files" ? (
          <FilesIcon />
        ) : (
          <StripeMark />
        )}
      </span>
      <div className="ui-cx__body">
        <div className="ui-cx__line">
          {entry.kind === "integration" ? (
            <span>
              {entry.connected ? "Connected " : "Disconnected "}
              <strong>{hl(entry.app)}</strong>
            </span>
          ) : (
            <>
              <Avatar person={entry.author} size={20} />
              <span>
                <strong>{hl(entry.author.name)}</strong>
                {entry.kind === "note" && " added context"}
                {entry.kind === "report" && <> generated {reportLink(entry.report)}</>}
                {entry.kind === "files" && (
                  <>
                    {" added "}
                    {entry.files.map((f, i) => (
                      <span key={f.name} className="ui-cx__file">
                        {i > 0 && (i === entry.files.length - 1 ? " and " : ", ")}
                        <FileIcon type={f.type} />
                        <span className="ui-cx__ref">{hl(f.name)}</span>
                      </span>
                    ))}
                  </>
                )}
              </span>
            </>
          )}
          <span className="ui-cx__when">{entry.when}</span>
          {mine && (
            <button type="button" className="ui-cx__remove" aria-label={`Remove ${entry.kind === "files" ? "these files" : entry.kind === "report" ? "this report entry" : "this note"}`} onClick={onRemove}>
              <TrashIcon />
            </button>
          )}
        </div>
        {(entry.kind === "note" || (entry.kind === "files" && entry.text)) && (
          <div className="ui-cx__note">{withMentions(entry.text ?? "", reports, query, onReport)}</div>
        )}
      </div>
    </li>
  );
}

/** "@Monthly P&L" for one of the client's reports → a mention chip that opens the report */
function withMentions(text: string, reports: string[], query: string, onReport: (name: string) => void) {
  if (!reports.length) return highlight(text, query);
  const names = [...reports].sort((a, b) => b.length - a.length).map(escapeRe);
  return text.split(new RegExp(`(@(?:${names.join("|")}))`, "g")).map((part, i) => {
    const name = part.startsWith("@") ? part.slice(1) : "";
    return reports.includes(name) ? (
      <button key={i} type="button" className="ui-cx__mention" onClick={() => onReport(name)}>
        <DocIcon />
        {name}
      </button>
    ) : (
      <span key={i}>{highlight(part, query)}</span>
    );
  });
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Search matches get a soft marker */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  return text
    .split(new RegExp(`(${escapeRe(q)})`, "ig"))
    .map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p));
}

const matches = (e: ContextEntry, q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    "author" in e ? e.author.name : "",
    e.kind === "note" ? e.text : "",
    e.kind === "files" ? `${e.text ?? ""} ${e.files.map((f) => f.name).join(" ")}` : "",
    e.kind === "report" ? e.report : "",
    e.kind === "integration" ? e.app : "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
};

/* ---------- Small pieces ---------- */

function Mark({ client, size }: { client: ContextClient; size: number }) {
  return (
    <span
      className="ui-cx__mark"
      style={{ width: size, height: size, background: client.mark.bg, color: client.mark.fg, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {client.mark.letter}
    </span>
  );
}

function Avatar({ person, size }: { person: ContextPerson; size: number }) {
  return person.avatar ? (
    <img className="ui-cx__avatar" src={person.avatar} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span
      className="ui-cx__avatar ui-cx__avatar--initial"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {person.name.charAt(0)}
    </span>
  );
}

/** Sparkline that draws itself in, with a dot on the latest value */
function Spark({ points, color, delay, wide = false }: { points: number[]; color: string; delay: number; wide?: boolean }) {
  const w = wide ? 96 : 64;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const xy = points.map((p, i) => [(i / (points.length - 1)) * (w - 4) + 2, h - 3 - ((p - min) / (max - min || 1)) * (h - 6)]);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = xy[xy.length - 1];
  return (
    <svg className="ui-cx__spark" data-wide={wide || undefined} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} pathLength={1} stroke={color} style={{ animationDelay: `${delay}ms` }} />
      <circle cx={lx} cy={ly} r="2.4" fill={color} style={{ animationDelay: `${delay + 520}ms` }} />
    </svg>
  );
}

/** File with its type as a small colored tab */
function FileIcon({ type }: { type: ContextFile["type"] }) {
  const color = { pdf: "#e5484d", xlsx: "#1f9d55", csv: "#0ea5e9", doc: "#2f6bff" }[type];
  return (
    <svg className="ui-cx__file-icon" viewBox="0 0 16 18" role="img" aria-label={type.toUpperCase()}>
      <path
        d="M3 1.5h6.5l4 4v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        fill="var(--tc-surface-raised, light-dark(#ffffff, #19191b))"
        stroke="var(--tc-border-strong, light-dark(#dedede, #3a3a40))"
      />
      <path d="M9.5 1.5v3a1 1 0 0 0 1 1h3" fill="none" stroke="var(--tc-border-strong, light-dark(#dedede, #3a3a40))" />
      <rect x="0.5" y="9.5" width="10" height="5" rx="1.5" fill={color} />
    </svg>
  );
}

/** Stripe's mark (Simple Icons, CC0) on its brand color */
const StripeMark = () => (
  <svg viewBox="0 0 24 24" className="ui-cx__stripe" role="img" aria-label="Stripe">
    <rect width="24" height="24" rx="6" fill="#635BFF" />
    <path
      fill="#fff"
      transform="translate(5 5) scale(0.5833)"
      d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
    />
  </svg>
);

const Svg = ({ children }: { children: ReactNode }) => (
  <svg className="ui-cx__icon" viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);
const PlusIcon = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>;
const ChevronsIcon = () => <Svg><path d="m8 9 4-4 4 4M8 15l4 4 4-4" /></Svg>;
const ChevronIcon = () => <Svg><path d="m7 10 5 5 5-5" /></Svg>;
const CheckIcon = () => <Svg><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
const CloseIcon = () => <Svg><path d="M6 6l12 12M18 6 6 18" /></Svg>;
const RefreshIcon = () => <Svg><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></Svg>;
const SearchIcon = () => <Svg><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Svg>;
const FilterIcon = () => <Svg><path d="M4 6h16M7 12h10M10 18h4" /></Svg>;
const PaperclipIcon = () => (
  <Svg>
    <path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15 7" />
  </Svg>
);
const NoteIcon = () => <Svg><path d="M5 5h14v10H9l-4 4V5Z" /></Svg>;
const ChartIcon = () => <Svg><path d="M5 19V11M12 19V5M19 19v-6" /></Svg>;
const FilesIcon = () => <Svg><path d="m12 4 8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4" /></Svg>;
const DocIcon = () => <Svg><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5ZM14 3.5V8h4" /></Svg>;
const AtIcon = () => <Svg><circle cx="12" cy="12" r="3.5" /><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8" /></Svg>;
const TrashIcon = () => <Svg><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></Svg>;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is a token or a light-dark() fallback, so dark follows color-scheme – a .dark class,
   data-theme / data-tc-theme="dark" or the OS setting (data-tc-theme="system") */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }

/* The block is a tray: the KPI cards and the main card sit on it */
.ui-cx {
  container-type: inline-size;
  width: 100%;
  max-width: 900px;
  padding: 0 var(--tc-tray-inset, 4px) var(--tc-tray-inset, 4px);
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-cx *, .ui-cx *::before, .ui-cx *::after { box-sizing: border-box; }
/* Zero specificity, so the spacing set on each part below wins */
.ui-cx :where(button[class^="ui-cx__"], .ui-cx__empty button, .ui-cx__file-chip button) { margin: 0; font: inherit; color: inherit; }
.ui-cx :where(p, h2, h3, ol, ul) { margin: 0; }
.ui-cx :where(ol, ul) { padding: 0; list-style: none; }
.ui-cx mark { border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-accent-highlight, light-dark(rgba(47, 107, 255, 0.16), rgba(109, 139, 255, 0.26))); color: inherit; }
.ui-cx__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.ui-cx__icon {
  width: 15px;
  height: 15px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- Header on the tray ---------- */

.ui-cx__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 10px 14px 12px;
}
.ui-cx__who { display: flex; align-items: center; gap: 12px; min-width: 0; animation: ui-cx-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-cx__who-text { display: grid; gap: 2px; min-width: 0; }
.ui-cx__name { font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-relaxed, 22px); letter-spacing: var(--tc-tracking-snug, -0.01em); }
.ui-cx__meta { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-cx__mark {
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 30%;
  font-weight: var(--tc-font-weight-semibold, 600);
  line-height: var(--tc-line-height-none, 1);
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
}
.ui-cx__actions { display: flex; align-items: center; gap: 8px; flex: none; }

/* Buttons are the library's Button; a filter in use adds the selected ring */
.ui-cx .ui-cx__filter-btn[data-active] { --tc-button-fg: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)), var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-cx .ui-cx__sync { --tc-button-fg: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-cx .ui-cx__attach[aria-disabled="true"], .ui-cx .ui-cx__add-client[aria-disabled="true"] { opacity: 0.4; cursor: default; }
.ui-cx__sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)) 16%, transparent);
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-cx__sync-dot[data-state="syncing"] { background: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)) 18%, transparent); }
.ui-cx__spin { display: grid; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-cx__spin[data-spinning] .ui-cx__icon { animation: ui-cx-spin var(--tc-duration-reveal-slow, 900ms) linear infinite; }
@keyframes ui-cx-spin { to { transform: rotate(360deg); } }

/* Popovers: the menu pattern */
.ui-cx__pop { position: relative; }
.ui-cx__menu {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  z-index: var(--tc-z-dropdown, 30);
  min-width: 230px;
  padding: var(--tc-menu-padding, 4px);
  border-radius: var(--tc-menu-radius, 12px);
  background: var(--tc-menu-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-menu-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  transform-origin: top left;
  animation: ui-cx-pop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-cx__menu--end { left: auto; right: 0; transform-origin: top right; }
@keyframes ui-cx-pop { from { opacity: 0; transform: translateY(-4px) scale(0.97); } }
.ui-cx .ui-cx__menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: var(--tc-menu-item-h, 32px);
  padding: 0 var(--tc-menu-item-px, 10px) 0 8px;
  border: 0;
  border-radius: var(--tc-menu-item-radius, 8px);
  background: transparent;
  font-size: var(--tc-menu-item-font-size, 13px);
  text-align: left;
  cursor: pointer;
}
.ui-cx .ui-cx__menu-item:is(:hover, :focus-visible, [data-first]) { background: var(--tc-menu-item-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-cx .ui-cx__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
/* The current choice: the selected colour, the strong weight and a check */
.ui-cx .ui-cx__menu-item:is([aria-current="true"], [aria-pressed="true"]) { color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-cx__menu-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-cx__menu-item > .ui-cx__icon { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-cx__menu-count { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-weight: var(--tc-font-weight-regular, 400); font-variant-numeric: tabular-nums; }
.ui-cx__menu-check { display: grid; width: 15px; color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-cx__menu-sep { height: var(--tc-hairline, 1px); margin: 4px; background: var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-cx__menu-plus {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-sm, 6px);
  background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04)));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-cx__menu-plus .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__create { display: flex; gap: 6px; padding: 3px; }
.ui-cx__create input {
  flex: 1;
  min-width: 0;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 10px;
  border: 0;
  border-radius: var(--tc-control-radius-sm, 8px);
  outline: none;
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font: inherit;
}
.ui-cx__create input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-cx__create input:focus { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }

/* ---------- KPI cards ---------- */

.ui-cx__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 6px;
}
.ui-cx .ui-cx__kpi {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px;
  border: 0;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  text-align: left;
  cursor: pointer;
  transition: box-shadow var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), transform var(--tc-duration-fast, 150ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
  animation: ui-cx-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-cx__kpi:nth-child(2) { animation-delay: 40ms; }
.ui-cx__kpi:nth-child(3) { animation-delay: 80ms; }
.ui-cx__kpi:nth-child(4) { animation-delay: 120ms; }
.ui-cx .ui-cx__kpi:hover { box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-cx__kpi:active { transform: scale(0.98); }
.ui-cx .ui-cx__kpi[aria-pressed="true"] { box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)), 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)), var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-cx__kpi-label { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-cx__kpi-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.ui-cx__kpi-value {
  font-size: var(--tc-font-size-2xl, 20px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: var(--tc-tracking-tight, -0.02em);
  line-height: var(--tc-line-height-loose, 24px);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ui-cx__spark { flex: none; width: 56px; height: 22px; overflow: visible; }
.ui-cx__spark[data-wide] { width: 84px; }
.ui-cx__spark path {
  fill: none;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-cx-draw var(--tc-duration-reveal, 700ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}
.ui-cx__spark circle { opacity: 0; animation: ui-cx-fade var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) forwards; }
@keyframes ui-cx-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-cx-fade { to { opacity: 1; } }
@keyframes ui-cx-in { from { opacity: 0; transform: translateY(6px); } }

/* ---------- Main card ---------- */

.ui-cx__card {
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-cx__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e));
}

.ui-cx__tools { display: flex; align-items: center; gap: 8px; }
/* Search: the field pattern on the sunken fill (it sits in the toolbar) */
.ui-cx__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  height: var(--tc-control-h-md, 32px);
  padding: 0 6px 0 11px;
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg-sunken, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cx__search:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-cx__search:focus-within { background: var(--tc-field-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-cx__search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font: inherit;
}
.ui-cx__search input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-cx .ui-cx__clear {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm, 6px);
  background: transparent;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  cursor: pointer;
}
.ui-cx .ui-cx__clear:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-cx__clear .ui-cx__icon { width: 12px; height: 12px; }

.ui-cx__panel { padding: 22px 24px 26px; animation: ui-cx-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }

/* ---------- Composer ---------- */

.ui-cx__compose { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 14px; align-items: start; }
.ui-cx__compose > .ui-cx__avatar { margin-top: 6px; }
/* The note box is a text field: the field ring, and the focus ring on the whole box */
.ui-cx__composer {
  position: relative;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cx__composer:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-cx__composer:focus-within { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-cx__composer textarea {
  display: block;
  width: 100%;
  min-height: 62px;
  max-height: 180px;
  padding: 12px 14px 4px;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font: inherit;
  line-height: var(--tc-line-height-normal, 20px);
  field-sizing: content;
}
.ui-cx__composer textarea::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-cx__suggest {
  position: absolute;
  left: 10px;
  top: calc(100% - 40px);
  z-index: var(--tc-z-dropdown, 30);
  min-width: 220px;
  padding: var(--tc-menu-padding, 4px);
  border-radius: var(--tc-menu-radius, 12px);
  background: var(--tc-menu-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-menu-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  animation: ui-cx-pop var(--tc-duration-fast, 150ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-cx__attached { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 14px 2px; }
.ui-cx__file-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 2px 0 8px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04)));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  font-size: var(--tc-font-size-sm, 12px);
  animation: ui-cx-pop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-cx .ui-cx__file-chip button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm, 6px);
  background: transparent;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  cursor: pointer;
}
.ui-cx .ui-cx__file-chip button:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-cx__file-chip .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__file-chip .ui-cx__file-icon { margin: 0; }
.ui-cx__composer-bar { display: flex; align-items: center; gap: 8px; padding: 8px 10px 10px; }
.ui-cx__hint { display: inline-flex; gap: 3px; margin-left: auto; }
.ui-cx__hint kbd {
  display: grid;
  place-items: center;
  min-width: var(--tc-kbd-h, 18px);
  height: var(--tc-kbd-h, 18px);
  padding: 0 var(--tc-kbd-px, 4px);
  border-radius: var(--tc-kbd-radius, 5px);
  background: var(--tc-kbd-bg, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-kbd-shadow, inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e));
  color: var(--tc-kbd-fg, light-dark(#404040, #c8c8cc));
  font-family: inherit;
  font-size: var(--tc-kbd-font-size, 10.5px);
  font-weight: var(--tc-kbd-font-weight, 500);
}

/* ---------- Timeline ---------- */

.ui-cx__timeline { position: relative; margin-top: 28px; }
/* The rail runs through the middle of the nodes */
.ui-cx__timeline::before {
  content: "";
  position: absolute;
  left: 13.5px;
  top: 14px;
  bottom: 14px;
  width: var(--tc-hairline, 1px);
  background: var(--tc-divider, light-dark(#ececec, #2a2a2e));
}
.ui-cx__item {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 14px;
  padding-bottom: 26px;
}
.ui-cx__item:last-child { padding-bottom: 0; }
.ui-cx__item[data-fresh] { animation: ui-cx-new var(--tc-duration-slowest, 560ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
@keyframes ui-cx-new { from { opacity: 0; transform: translateY(-8px); } }

.ui-cx__node {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: 0 0 0 var(--tc-hairline, 1px) var(--tc-border-strong, light-dark(#dedede, #3a3a40)), 0 0 0 5px var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-cx__node .ui-cx__icon { width: 13px; height: 13px; }
.ui-cx__node[data-kind="integration"] { background: transparent; box-shadow: 0 0 0 5px var(--tc-surface-raised, light-dark(#ffffff, #19191b)); }
.ui-cx__stripe { display: block; width: 26px; height: 26px; }

.ui-cx__body { min-width: 0; padding-top: 4px; }
.ui-cx__line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 20px;
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  line-height: var(--tc-line-height-normal, 20px);
}
.ui-cx__line > .ui-cx__avatar { margin-top: 0; }
.ui-cx__line > span:not(.ui-cx__when) { flex: 0 1 auto; min-width: 0; }
.ui-cx__line strong { color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-cx__when { flex: none; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; }
.ui-cx__when::before { content: "·"; margin-right: 8px; }
.ui-cx .ui-cx__ref {
  display: inline;
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-weight: var(--tc-font-weight-medium, 500);
  text-decoration: underline;
  text-decoration-color: var(--tc-border-strong, light-dark(#dedede, #3a3a40));
  text-underline-offset: 3px;
  transition: text-decoration-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
button.ui-cx__ref { cursor: pointer; }
button.ui-cx__ref:hover { text-decoration-color: currentColor; }
.ui-cx__file { white-space: nowrap; }
.ui-cx__file-icon { display: inline-block; width: 12px; height: 14px; margin: 0 4px 0 2px; vertical-align: -2px; }
/* Remove: shows on hover of the entry and on keyboard focus (always on touch screens) */
.ui-cx .ui-cx__remove {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: -2px 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm, 6px);
  background: transparent;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  opacity: 0;
  cursor: pointer;
  transition: opacity var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cx__item:hover .ui-cx__remove,
.ui-cx .ui-cx__remove:focus-visible { opacity: 1; }
@media (hover: none) { .ui-cx .ui-cx__remove { opacity: 1; } }
.ui-cx .ui-cx__remove:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-cx__remove .ui-cx__icon { width: 13px; height: 13px; }
.ui-cx__note {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  box-shadow: var(--tc-shadow-sunken, inset 0 0 0 1px light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  line-height: var(--tc-line-height-normal, 20px);
}
.ui-cx .ui-cx__mention {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 1px;
  padding: 0 6px 0 5px;
  border: 0;
  border-radius: var(--tc-radius-sm, 6px);
  background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16)));
  color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff));
  font-weight: var(--tc-font-weight-medium, 500);
  line-height: var(--tc-line-height-normal, 20px);
  vertical-align: -1px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cx .ui-cx__mention:hover { background: var(--tc-accent-highlight, light-dark(rgba(47, 107, 255, 0.16), rgba(109, 139, 255, 0.26))); }
.ui-cx__mention .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__avatar { display: block; flex: none; border-radius: 50%; object-fit: cover; }
.ui-cx__avatar--initial { display: grid; place-items: center; background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-weight: var(--tc-font-weight-semibold, 600); }

.ui-cx__empty {
  margin-top: 28px;
  padding: 22px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  box-shadow: var(--tc-shadow-sunken, inset 0 0 0 1px light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  text-align: center;
}
.ui-cx__empty--flush { margin-top: 0; }
.ui-cx .ui-cx__empty button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-weight: var(--tc-font-weight-medium, 500);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

/* ---------- Reports, financials, settings ---------- */

.ui-cx__list {
  overflow: hidden;
  border-radius: var(--tc-radius-xl, 12px);
  box-shadow: 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
}
.ui-cx__list > li + li { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-cx__row { display: flex; align-items: center; gap: 14px; min-height: 66px; padding: 12px 16px; }
.ui-cx__row-main { display: grid; gap: 3px; flex: 1; min-width: 0; text-align: left; }
.ui-cx__row-main strong { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-cx__row-main span { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm-plus, 12.5px); }
.ui-cx__row-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04)));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-cx__app { display: grid; flex: none; }
.ui-cx__app .ui-cx__stripe { width: 32px; height: 32px; }

.ui-cx .ui-cx__report-head {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 66px;
  padding: 12px 16px;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-cx .ui-cx__report-head:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-cx .ui-cx__report-head:focus-visible, .ui-cx__fin button:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
.ui-cx__chevron { display: grid; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
.ui-cx__report[data-open] .ui-cx__chevron { transform: rotate(180deg); }
.ui-cx__report-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow, 320ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
.ui-cx__report[data-open] .ui-cx__report-body { grid-template-rows: 1fr; }
.ui-cx__report-body > div { overflow: hidden; padding: 0 16px 0 62px; }
.ui-cx__report-body p { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); line-height: var(--tc-line-height-normal, 20px); }
.ui-cx__report-actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 0 18px; }

.ui-cx .ui-cx__fin button {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 66px;
  padding: 12px 16px;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-cx .ui-cx__fin button:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
/* The open metric: the selected fill and an accent bar at the start (not colour alone) */
.ui-cx .ui-cx__fin[data-active] button { background: var(--tc-fill-selected, light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14))); box-shadow: inset 3px 0 0 var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)); }
.ui-cx__fin-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
.ui-cx__fin-value { display: grid; justify-items: end; gap: 3px; min-width: 84px; }
.ui-cx__fin-value strong { font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-semibold, 600); font-variant-numeric: tabular-nums; }
.ui-cx__fin-value span { font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-medium, 500); font-variant-numeric: tabular-nums; }
.ui-cx__fin-value [data-trend="up"] { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-cx__fin-value [data-trend="down"] { color: var(--tc-tone-rose-fg, light-dark(#be123c, #fda4af)); }

/* Switch: the switch tokens */
.ui-cx .ui-cx__toggle {
  position: relative;
  flex: none;
  width: var(--tc-switch-w, 32px);
  height: var(--tc-switch-h, 20px);
  padding: 0;
  border: 0;
  border-radius: var(--tc-switch-radius, 999px);
  background: var(--tc-switch-off, light-dark(#858585, #7c7c82));
  cursor: pointer;
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-cx__toggle span {
  position: absolute;
  left: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  top: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  width: var(--tc-switch-knob, 16px);
  height: var(--tc-switch-knob, 16px);
  border-radius: 50%;
  background: var(--tc-switch-knob-bg, #ffffff);
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: transform var(--tc-duration-moderate, 260ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-cx .ui-cx__toggle[aria-checked="true"] { background: var(--tc-switch-on, #2f68ff); }
.ui-cx__toggle[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w, 32px) - var(--tc-switch-h, 20px))); }

.ui-cx button:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

/* ---------- Narrow ---------- */

@container (max-width: 680px) {
  .ui-cx__head { flex-wrap: wrap; }
  .ui-cx__actions { width: 100%; }
  .ui-cx__actions > .ui-cx__pop { margin-left: auto; }
  .ui-cx__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-cx__toolbar { flex-direction: column; align-items: stretch; }
  .ui-cx__tools { width: 100%; }
  .ui-cx__search { flex: 1; width: auto; }
  .ui-cx__panel { padding: 18px 16px 20px; }
  .ui-cx__hint { display: none; }
  .ui-cx__composer-bar .ui-cx__add { margin-left: auto; }
  .ui-cx__fin .ui-cx__spark { display: none; }
  .ui-cx__report-body > div { padding-left: 16px; }
  /* The time drops to its own line under the name, so long file names keep their room */
  .ui-cx__line { flex-wrap: wrap; row-gap: 2px; }
  .ui-cx__line > span:not(.ui-cx__when) { flex: 1 1 calc(100% - 28px); }
  .ui-cx__when { order: 3; margin-left: 28px; }
  .ui-cx__when::before { content: none; }
  .ui-cx__file { white-space: normal; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-cx *, .ui-cx *::before, .ui-cx *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}

/* Text fields show their focus with the field ring on their box (above), not a second outline – also against global
   :focus-visible rules of the host page */
.ui-cx :is(.ui-cx__search input, .ui-cx__composer textarea, .ui-cx__create input):focus-visible { outline: none; }
`;
