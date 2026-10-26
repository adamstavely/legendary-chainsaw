"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpDownIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleQuestionMarkIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FunnelIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListIcon,
  LogOutIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PencilLineIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { FilterMenu, type FilterGroup, type FilterValue } from "@/components/ui/filter-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SetupGuide, type SetupGroup } from "@/components/ui/setup-guide";

/*
 * App Shell – the frame every Trenchcoat screen sits in, in a single file.
 * A sidebar on a gray page (workspace, menu, projects, what's new, onboarding progress, user) and the main
 * area as a rounded white panel. The sidebar collapses completely; its icon then waits in the top left corner.
 * Drag the sidebar's edge to make it wider or narrower (between a minimum and a maximum; double-click resets it).
 * Optional: a work area on the right (`panel`) – tools, a preview, files – resizable and collapsible the same way.
 * Also exports the small parts the screens share: icon, tabs, search, toolbar tools, section heads,
 * empty state and file cards.
 * Imports: Filter Menu and Setup Guide from Trenchcoat components; icons from lucide-react 1.55.0.
 */

/** A Lucide icon, at the shell's slightly lighter stroke */
export const Icon = ({ icon: Glyph, size = 16, stroke = 1.9, color = "currentColor" }: { icon: LucideIcon; size?: number; stroke?: number; color?: string }) => (
  <Glyph size={size} strokeWidth={stroke} color={color} aria-hidden />
);

export type ShellNavItem = { label: string; icon: LucideIcon; /** Small number at the end, e.g. unread items */ count?: number };
/** A labelled list under the menu – replaces Projects when given */
export type ShellGroup = { label: string; items: ShellNavItem[]; /** Text shown while the list is empty */ empty?: string };

export const defaultNav: ShellNavItem[] = [
  { label: "New chat", icon: PencilLineIcon },
  { label: "Folders", icon: FolderIcon },
  { label: "Integrations", icon: LayoutDashboardIcon },
];

export const defaultProjects = ["Q3 Campaign", "Brand assets", "Hiring", "Research"];

/** Onboarding behind "Getting started" – shown in the library's Setup Guide */
export const defaultSetup: SetupGroup[] = [
  {
    id: "workspace",
    title: "Set up your workspace",
    tasks: [
      { id: "name", label: "Name your workspace", done: true },
      { id: "invite", label: "Invite your teammates" },
      { id: "connect", label: "Connect your first app" },
    ],
  },
  {
    id: "work",
    title: "Start working",
    tasks: [
      { id: "folder", label: "Create a folder" },
      { id: "chat", label: "Start your first chat" },
      { id: "upload", label: "Upload a file" },
    ],
  },
  {
    id: "profile",
    title: "Make it yours",
    tasks: [
      { id: "avatar", label: "Add a profile picture" },
      { id: "notify", label: "Choose your notifications" },
    ],
  },
];

/** Up to this width (of the app itself, not the window) the sidebar becomes a drawer */
const NARROW = 900;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const cheer = (pct: number) => (pct >= 100 ? "All done!" : pct >= 60 ? "Almost there!" : pct > 0 ? "Great start!" : "Let's go!");

/* ---------- Helpers (copied from Trenchcoat's src/internal, so this file stays self-contained) ---------- */

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

/**
 * State that a parent may control: `value` defined → controlled (shown as given, changes only reported through
 * `onChange`); undefined → kept here, starting at `defaultValue`, and still reported
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

/** Calls `handler` on Escape while `on` – the handler is read when the key is pressed, so it's never stale */
function useEscape(on: boolean, handler: () => void) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!on) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && latest.current();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [on]);
}

/* ---------- App Shell ---------- */

type AppShellOwnProps = {
  children: ReactNode;
  /** Label of the menu item or project that is open */
  active?: string;
  /** Called with the label of a menu item or project when it is clicked */
  onNavigate?: (label: string) => void;
  workspace?: string;
  user?: { name: string; avatar?: string };
  nav?: ShellNavItem[];
  projects?: string[];
  /** Lists under the menu instead of Projects, e.g. Tools or Pipelines */
  groups?: ShellGroup[];
  /** Tasks behind "Getting started"; each task's `done` flag is where it starts, and the shell follows it when it changes */
  setup?: SetupGroup[];
  /** Sidebar width in px – drag its edge between min and max; double-click the edge for the default again */
  sidebarWidth?: { default?: number; min?: number; max?: number };
  /** Whether the sidebar is collapsed (wide screens). Controlled when defined – pair it with `onCollapsedChange` */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** A work area on the right of the main area, e.g. tools or a preview – resizable and collapsible */
  panel?: ReactNode;
  /** Whether the work area is open. Controlled when defined – pair it with `onPanelOpenChange`. Uncontrolled, it
   *  starts open on wide screens and closed on narrow ones */
  panelOpen?: boolean;
  defaultPanelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  /**
   * A header across the whole app, like Claude's: the sidebar toggle and search over the sidebar, the page's title and
   * actions over the page, and the work area's title over the work area – one bar, one line under it
   */
  header?: { title: ReactNode; actions?: ReactNode } | false;
  /** Heading of the right work area */
  panelTitle?: string;
  /** Width of the right work area in px, like sidebarWidth */
  panelWidth?: { default?: number; min?: number; max?: number };
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AppShellProps = Omit<ComponentPropsWithoutRef<"div">, keyof AppShellOwnProps> & AppShellOwnProps;

export function AppShell({
  children,
  active,
  onNavigate,
  workspace = "Acme",
  user = { name: "Alex Morgan" },
  nav = defaultNav,
  projects = defaultProjects,
  groups,
  setup = defaultSetup,
  sidebarWidth,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  panel,
  panelOpen: panelOpenProp,
  defaultPanelOpen = true,
  onPanelOpenChange,
  panelTitle = "Workspace",
  panelWidth,
  header,
  className,
  style,
  ref,
  ...rest
}: AppShellProps) {
  const side = { default: 272, min: 220, max: 380, ...sidebarWidth };
  const pane = { default: 360, min: 280, max: 560, ...panelWidth };
  const [sideW, setSideW] = useState(side.default);
  const [paneW, setPaneW] = useState(pane.default);
  // While an edge is dragged the columns follow the pointer directly, without their glide
  const [resizing, setResizing] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(root, ref);
  const guide = useGuide();
  const { narrow, drawer, setDrawer, collapsed, setCollapsed, paneOpen, setPaneOpen, sideHidden } = useShellLayout(root, {
    collapsed: [collapsedProp, defaultCollapsed, onCollapsedChange],
    panelOpen: [panelOpenProp, defaultPanelOpen, onPanelOpenChange],
    guideClosed: guide.state === "closed",
  });
  const go = (label: string) => {
    setDrawer(false);
    onNavigate?.(label);
  };
  useFocusFollowsPanes(root, sideHidden, !!panel && paneOpen);

  return (
    <div
      {...rest}
      ref={setRoot}
      className={["ui-as", "ui-as-app", className].filter(Boolean).join(" ")}
      style={{ ...style, "--side-w": `${sideW}px`, "--panel-w": `${paneW}px` } as CSSProperties}
      data-collapsed={(collapsed && !narrow) || undefined}
      data-drawer={(narrow && drawer) || undefined}
      data-panel={panel ? (paneOpen ? "open" : "closed") : undefined}
      data-resizing={resizing || undefined}
      data-header={header ? "" : undefined}
    >
      <style href="ui-app-shell" precedence="default">
        {css}
      </style>
      {/* With the sidebar hidden, the same icon sits in the top left corner of the main area to bring it back */}
      <button
        className="ui-as-icon-btn ui-as-side-open"
        type="button"
        aria-label="Open sidebar"
        tabIndex={sideHidden ? 0 : -1}
        onClick={() => (narrow ? setDrawer(true) : setCollapsed(false))}
      >
        <Icon icon={PanelLeftIcon} size={16} />
      </button>
      {/* The same for the work area on the right: its icon waits in the top right corner while it's closed */}
      {panel && (
        <button
          className="ui-as-icon-btn ui-as-panel-open"
          type="button"
          aria-label={`Open ${panelTitle.toLowerCase()}`}
          tabIndex={paneOpen ? -1 : 0}
          onClick={() => setPaneOpen(true)}
        >
          <Icon icon={PanelRightIcon} size={16} />
        </button>
      )}
      {/* Narrow only: dims the main area behind the open drawer; a tap closes it */}
      <div
        className="ui-as-scrim"
        aria-hidden="true"
        onClick={() => {
          setDrawer(false);
          if (narrow) setPaneOpen(false);
        }}
      />
      {/* Drag handles on the edges of the main area – wide screens only */}
      {!sideHidden && !narrow && (
        <Resizer edge="left" label="Resize sidebar" value={sideW} {...side} onChange={setSideW} onDrag={setResizing} root={root} />
      )}
      {panel && paneOpen && !narrow && (
        <Resizer edge="right" label={`Resize ${panelTitle.toLowerCase()}`} value={paneW} {...pane} onChange={setPaneW} onDrag={setResizing} root={root} />
      )}
      {header && (
        <>
          <div className="ui-as-bar ui-as-bar--side" inert={sideHidden}>
            <button className="ui-as-icon-btn" type="button" aria-label="Collapse sidebar" onClick={() => setCollapsed(true)}>
              <Icon icon={PanelLeftIcon} size={16} />
            </button>
            <button className="ui-as-icon-btn" type="button" aria-label="Search">
              <Icon icon={SearchIcon} size={16} />
            </button>
          </div>
          <div className="ui-as-bar ui-as-bar--main">
            <div className="ui-as-bar__title">{header.title}</div>
            {header.actions && <div className="ui-as-bar__actions">{header.actions}</div>}
          </div>
          {panel && (
            <div className="ui-as-bar ui-as-bar--panel" inert={!paneOpen}>
              <span className="ui-as-panel__title">{panelTitle}</span>
              <button className="ui-as-icon-btn" type="button" aria-label={`Close ${panelTitle.toLowerCase()}`} onClick={() => setPaneOpen(false)}>
                <Icon icon={PanelRightIcon} size={16} />
              </button>
            </div>
          )}
        </>
      )}
      <aside className="ui-as-side" inert={sideHidden}>
        <SidebarHead workspace={workspace} narrow={narrow} onHide={() => (narrow ? setDrawer(false) : setCollapsed(true))} />
        <SidebarNav nav={nav} groups={groups} projects={projects} active={active} onGo={go} />
        <SidebarFoot workspace={workspace} user={user} setup={setup} guide={guide} />
      </aside>
      <main className="ui-as-main">{children}</main>
      {panel && (
        <aside className="ui-as-panel" aria-label={panelTitle} inert={!paneOpen}>
          <header className="ui-as-panel__head">
            <span className="ui-as-panel__title">{panelTitle}</span>
            <button className="ui-as-icon-btn" type="button" aria-label={`Close ${panelTitle.toLowerCase()}`} onClick={() => setPaneOpen(false)}>
              <Icon icon={PanelRightIcon} size={16} />
            </button>
          </header>
          <div className="ui-as-panel__body">{panel}</div>
        </aside>
      )}
    </div>
  );
}

/**
 * Focus never drops to <body> when a sidebar or the work area folds away (its buttons go inert): it moves to the icon
 * that brings it back. Opened from that icon (which then goes away), focus moves into it.
 */
function useFocusFollowsPanes(root: RefObject<HTMLDivElement | null>, sideHidden: boolean, paneOpen: boolean) {
  const last = useRef({ sideHidden, paneOpen });
  // Whether focus is (or last was) inside the shell – a pane folding away never pulls focus in from elsewhere
  const inside = useRef(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const into = () => (inside.current = true);
    const out = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && !el.contains(e.relatedTarget)) inside.current = false;
    };
    el.addEventListener("focusin", into);
    el.addEventListener("focusout", out);
    return () => {
      el.removeEventListener("focusin", into);
      el.removeEventListener("focusout", out);
    };
  }, [root]);
  useLayoutEffect(() => {
    const el = root.current;
    const prev = last.current;
    last.current = { sideHidden, paneOpen };
    if (!el) return;
    const active = document.activeElement as HTMLElement | null;
    const lost = inside.current && (!active || active === document.body || (el.contains(active) && !!active.closest("[inert]")));
    // Rendered (not in a display:none part of the bar or head) and not inert
    const shown = (n: HTMLElement) => (typeof n.checkVisibility === "function" ? n.checkVisibility() : true) && !n.closest("[inert]");
    const visible = (selector: string) => [...el.querySelectorAll<HTMLElement>(selector)].find(shown);
    const move = (selector: string) => visible(selector)?.focus({ preventScroll: true });
    if (sideHidden !== prev.sideHidden) {
      if (sideHidden && lost) move(".ui-as-side-open");
      else if (!sideHidden && active?.classList.contains("ui-as-side-open")) move(".ui-as-side .ui-as-side__workspace");
    }
    if (paneOpen !== prev.paneOpen) {
      if (!paneOpen && lost) move(".ui-as-panel-open");
      else if (paneOpen && active?.classList.contains("ui-as-panel-open")) move(".ui-as-bar--panel .ui-as-icon-btn, .ui-as-panel__head .ui-as-icon-btn");
    }
  }, [root, sideHidden, paneOpen]);
}

type Controlled<T> = [value: T | undefined, defaultValue: T, onChange: ((next: T) => void) | undefined];

/**
 * Sidebar and work area: collapsed or open on wide screens; narrow (tablet, phone) the sidebar waits off screen and
 * slides in as a drawer over the main area, and the work area waits closed. Escape closes the drawer and the work area.
 */
function useShellLayout(
  root: RefObject<HTMLDivElement | null>,
  opts: { collapsed: Controlled<boolean>; panelOpen: Controlled<boolean>; guideClosed: boolean },
) {
  const [collapsed, setCollapsed] = useControllable(...opts.collapsed, "collapsed");
  const [paneOpen, setPaneOpen] = useControllable(...opts.panelOpen, "panelOpen");
  const [narrow, setNarrow] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    // Same width as the @container ui-as (max-width: 900px) rules below – measured in layout pixels, so a scaled preview stays wide
    const measure = () => setNarrow(el.offsetWidth <= NARROW);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [root]);
  // Narrow: the right work area waits closed and slides in over the page when asked for; wide again, it opens
  const wasNarrow = useRef(false);
  useEffect(() => {
    if (narrow === wasNarrow.current) return;
    wasNarrow.current = narrow;
    if (!narrow) setDrawer(false);
    setPaneOpen(!narrow);
  }, [narrow, setPaneOpen]);
  // Escape closes the drawer – unless the setup guide is open, then it closes the guide first
  useEscape(drawer && opts.guideClosed, () => setDrawer(false));
  // Narrow: Escape closes the work area that slid in from the right
  useEscape(narrow && paneOpen, () => setPaneOpen(false));
  const sideHidden = narrow ? !drawer : collapsed;
  return { narrow, drawer, setDrawer, collapsed, setCollapsed, paneOpen, setPaneOpen, sideHidden };
}

type Guide = ReturnType<typeof useGuide>;

/**
 * The "Getting started" card: closed → open → closing → closed. While closing the guide stays, fades and the card
 * shrinks, then the summary returns. The card's height follows its content, so opening, closing and folding glide.
 */
function useGuide() {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const slot = useRef<HTMLDivElement>(null);
  // Whether focus was on the card when it opened or closed: the control it was on goes away, so focus follows
  const hadFocus = useRef(false);
  const setOpen = useCallback((open: boolean) => {
    hadFocus.current = !!slot.current?.contains(document.activeElement);
    if (open) return setState("open");
    setState((g) => (g === "open" ? "closing" : g));
  }, []);
  useEffect(() => {
    if (state !== "closing") return;
    const t = window.setTimeout(() => setState("closed"), 420);
    return () => window.clearTimeout(t);
  }, [state]);
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [closedHeight, setClosedHeight] = useState(0);
  // Read the content's height right when the state changes (not a frame later), so no step ever uses an old height;
  // the closed card's height is kept for the slot and for shrinking back
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    setHeight(el.offsetHeight);
    if (state === "closed") setClosedHeight(el.offsetHeight);
  }, [state]);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEscape(state === "open", () => setOpen(false));
  // Opened from the summary: focus moves into the guide; closed from inside: back to the summary
  useLayoutEffect(() => {
    const el = slot.current;
    if (!el || !hadFocus.current || state === "closing") return;
    const active = document.activeElement;
    if (state === "open") el.querySelector<HTMLElement>(".ui-as-guide__content :is(button, [href], input, [tabindex]):not([tabindex='-1'])")?.focus({ preventScroll: true });
    else if (!active || active === document.body || el.contains(active)) el.querySelector<HTMLElement>(".ui-as-steps")?.focus({ preventScroll: true });
    hadFocus.current = false;
  }, [state]);
  return { state, setOpen, slot, inner, height, closedHeight };
}

/** Ids of the finished setup tasks: starts from the tasks' `done` flags and follows them when they change */
function useSetupDone(setup: SetupGroup[]) {
  const flags = setup.flatMap((g) => g.tasks.map((t) => `${t.id}:${t.done ? 1 : 0}`)).join("|");
  const fromSetup = () => setup.flatMap((g) => g.tasks.filter((t) => t.done).map((t) => t.id));
  const [state, setState] = useState(() => ({ flags, done: fromSetup() }));
  // New flags from the parent win over the ticks made here (React's "adjust state when a prop changes" pattern)
  if (state.flags !== flags) {
    const next = { flags, done: fromSetup() };
    setState(next);
    return [next.done, (done: string[]) => setState({ flags, done })] as const;
  }
  return [state.done, (done: string[]) => setState({ flags, done })] as const;
}

function SidebarHead({ workspace, narrow, onHide }: { workspace: string; narrow: boolean; onHide: () => void }) {
  return (
    <header className="ui-as-side__head">
      <Dropdown
        title="Workspaces"
        items={[
          { label: workspace, description: "Pro · 8 members", checked: true },
          { label: "Personal", description: "Free", checked: false },
          { label: "Create workspace", icon: PlusIcon },
        ]}
        trigger={({ open, toggle }) => (
          <button className="ui-as-side__workspace" type="button" aria-expanded={open} onClick={toggle}>
            <span className="ui-as-side__logo">{workspace[0]}</span>
            {workspace}
            <Icon icon={ChevronDownIcon} size={13} />
          </button>
        )}
      />
      <span className="ui-as-side__tools">
        <button className="ui-as-icon-btn" type="button" aria-label="Search">
          <Icon icon={SearchIcon} size={16} />
        </button>
        <button className="ui-as-icon-btn" type="button" aria-label={narrow ? "Close sidebar" : "Collapse sidebar"} onClick={onHide}>
          <Icon icon={PanelLeftIcon} size={16} />
        </button>
      </span>
    </header>
  );
}

function SidebarItem({ item, icon, active, onGo }: { item: { label: string; count?: number }; icon: LucideIcon; active?: string; onGo: (label: string) => void }) {
  return (
    <button type="button" className="ui-as-side__item" aria-current={active === item.label ? "page" : undefined} onClick={() => onGo(item.label)}>
      <Icon icon={icon} size={16} />
      {item.label}
      {item.count !== undefined && <span className="ui-as-side__count">{item.count}</span>}
    </button>
  );
}

function SidebarNav({
  nav,
  groups,
  projects,
  active,
  onGo,
}: {
  nav: ShellNavItem[];
  groups?: ShellGroup[];
  projects: string[];
  active?: string;
  onGo: (label: string) => void;
}) {
  return (
    <nav className="ui-as-side__nav" aria-label="Main menu">
      <div className="ui-as-side__group">
        {nav.map((item) => (
          <SidebarItem key={item.label} item={item} icon={item.icon} active={active} onGo={onGo} />
        ))}
      </div>
      {groups ? (
        groups.map((group) => (
          <div key={group.label} className="ui-as-side__group">
            <span className="ui-as-side__label">{group.label}</span>
            {group.items.length === 0 && group.empty && <span className="ui-as-side__empty">{group.empty}</span>}
            {group.items.map((item) => (
              <SidebarItem key={item.label} item={item} icon={item.icon} active={active} onGo={onGo} />
            ))}
          </div>
        ))
      ) : (
        <>
          <span className="ui-as-side__label">Projects</span>
          {projects.map((name) => (
            <SidebarItem key={name} item={{ label: name }} icon={FolderOpenIcon} active={active} onGo={onGo} />
          ))}
        </>
      )}
    </nav>
  );
}

/** What's new, the setup guide card and the user menu at the bottom of the sidebar */
function SidebarFoot({ workspace, user, setup, guide }: { workspace: string; user: { name: string; avatar?: string }; setup: SetupGroup[]; guide: Guide }) {
  const [news, setNews] = useState(2);
  const foot = useRef<HTMLDivElement>(null);
  // Dismissing the last news card removes its button: focus moves on to the getting-started card
  useLayoutEffect(() => {
    const active = document.activeElement;
    if (news === 0 && (!active || active === document.body)) foot.current?.querySelector<HTMLElement>(".ui-as-guide-slot button")?.focus({ preventScroll: true });
  }, [news]);
  const [done, setDone] = useSetupDone(setup);
  const total = setup.reduce((n, g) => n + g.tasks.length, 0);
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div ref={foot} className="ui-as-side__foot">
      {news > 0 && (
        <div className="ui-as-news" data-count={news}>
          <div className="ui-as-news__card ui-as-news__card--back" aria-hidden="true">
            <span className="ui-as-news__kicker">New in {workspace}</span>
            <Icon icon={XIcon} size={13} />
          </div>
          <div className="ui-as-news__card">
            <div className="ui-as-news__top">
              <span className="ui-as-news__kicker">New in {workspace}</span>
              <button type="button" className="ui-as-news__close" aria-label="Dismiss" onClick={() => setNews((n) => n - 1)}>
                <Icon icon={XIcon} size={13} />
              </button>
            </div>
            <b className="ui-as-news__title">{news > 1 ? "Shared folders" : "Scheduled chats"}</b>
            <button type="button" className="ui-as-news__more">
              Full changelog
              <Icon icon={ChevronRightIcon} size={13} />
            </button>
          </div>
        </div>
      )}

      {/* The card itself grows upward into the full setup guide – one block that morphs, no second panel */}
      {/* The slot keeps the closed card's height in the sidebar; the open card grows over the cards above it */}
      <div ref={guide.slot} className="ui-as-guide-slot" style={guide.closedHeight ? { height: guide.closedHeight } : undefined}>
        <div
          className="ui-as-guide"
          data-open={guide.state !== "closed" || undefined}
          data-state={guide.state}
          style={{ height: (guide.state === "open" ? guide.height : guide.closedHeight) || undefined }}
        >
          <div ref={guide.inner} className="ui-as-guide__inner">
            {guide.state !== "closed" ? (
              <div className="ui-as-guide__content" key="guide">
                <SetupGuide
                  className="ui-as-guide__sg"
                  title="Getting started"
                  groups={setup}
                  done={done}
                  onDoneChange={setDone}
                  onClose={() => guide.setOpen(false)}
                />
              </div>
            ) : (
              <button type="button" className="ui-as-steps ui-as-guide__content" key="summary" aria-expanded={false} onClick={() => guide.setOpen(true)}>
                <span className="ui-as-steps__title">
                  Getting started
                  <Icon icon={ChevronRightIcon} size={13} />
                </span>
                <span className="ui-as-steps__sub">
                  {pct}% done · <span className="ui-as-steps__cheer">{cheer(pct)}</span>
                </span>
                <span className="ui-as-steps__bar">
                  <i style={{ width: `${Math.max(pct, 4)}%` }} />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <Dropdown
        side="top"
        className="ui-as-user-menu"
        items={[
          { label: "Profile", icon: UserIcon },
          { label: "Settings", icon: SettingsIcon },
          { label: "Help & feedback", icon: CircleQuestionMarkIcon },
          { label: "Log out", icon: LogOutIcon, danger: true },
        ]}
        trigger={({ open, toggle }) => (
          <button type="button" className="ui-as-user" aria-expanded={open} onClick={toggle}>
            {user.avatar ? <img src={user.avatar} alt="" width={20} height={20} /> : <span className="ui-as-user__initials">{initials}</span>}
            {user.name}
            <Icon icon={ChevronDownIcon} size={13} />
          </button>
        )}
      />
    </div>
  );
}

/**
 * The edge between the main area and a sidebar: drag it, use the arrow keys, or double-click it for the default width.
 * On hover the whole edge of the page darkens. The pointer's travel is divided by the app's scale, so a scaled-down
 * preview still follows the pointer exactly.
 */
function Resizer({
  edge,
  label,
  value,
  default: initial,
  min,
  max,
  onChange,
  onDrag,
  root,
}: {
  edge: "left" | "right";
  label: string;
  value: number;
  default: number;
  min: number;
  max: number;
  onChange: (width: number) => void;
  onDrag: (dragging: boolean) => void;
  root: RefObject<HTMLDivElement | null>;
}) {
  const start = useRef<{ x: number; width: number; scale: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const sign = edge === "left" ? 1 : -1;
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = root.current;
    const scale = el && el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;
    start.current = { x: e.clientX, width: value, scale: scale || 1 };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    setDragging(true);
    onDrag(true);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s) return;
    onChange(clamp(Math.round(s.width + ((e.clientX - s.x) / s.scale) * sign), min, max));
  };
  const up = () => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    onDrag(false);
  };
  const key = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 48 : 16;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(clamp(value + (e.key === "ArrowRight" ? step : -step) * sign, min, max));
    }
    if (e.key === "Home") onChange(min);
    if (e.key === "End") onChange(max);
  };
  return (
    <div
      className="ui-as-resizer"
      data-edge={edge}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-dragging={dragging || undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onDoubleClick={() => onChange(initial)}
      onKeyDown={key}
    />
  );
}

/* ---------- Shared parts ---------- */

/**
 * Tabs above a list, drawn like the library's Segmented Control (track and thumb from --tc-seg-*): a raised thumb
 * glides to the active tab. A tablist with the APG keys: arrows / Home / End move and pick, one tab stop.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  label,
  fullWidth,
  className,
}: {
  items: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Names the tablist for screen readers */
  label?: string;
  /** Fill the container with equal tabs */
  fullWidth?: boolean;
  className?: string;
}) {
  const [current, setCurrent] = useControllable(value, defaultValue ?? items[0], onChange, "value");
  const list = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const itemsKey = items.join("|");

  // The thumb follows the active tab; measured from the layout, so it is right at any size
  useLayoutEffect(() => {
    const tab = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (tab) setPill({ x: tab.offsetLeft, w: tab.offsetWidth });
  }, [current, itemsKey]);

  const key = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = items.indexOf(current);
    const next = { ArrowRight: (i + 1) % items.length, ArrowLeft: (i - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setCurrent(items[next]);
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div ref={list} className={["ui-as-tabs", className].filter(Boolean).join(" ")} role="tablist" aria-label={label} data-full={fullWidth || undefined} onKeyDown={key}>
      {pill && <span className="ui-as-tabs__pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden="true" />}
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={current === item}
          tabIndex={item === (items.includes(current) ? current : items[0]) ? 0 : -1}
          className="ui-as-tabs__tab"
          data-text={item}
          onClick={() => setCurrent(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

/** The page's title in the header, with a chevron – a button, so it can open a menu (rename, move, delete…) */
export function BarTitle({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="ui-as-bar__pick" onClick={onClick}>
      <span>{children}</span>
      <Icon icon={ChevronDownIcon} size={13} />
    </button>
  );
}

export function IconButton({ icon, label, onClick, pressed }: { icon: LucideIcon; label: string; onClick?: () => void; pressed?: boolean }) {
  return (
    <button type="button" className="ui-as-tool" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
      <Icon icon={icon} size={15} />
    </button>
  );
}

export type SortDir = "asc" | "desc";

/** Flips between A–Z and Z–A; the icon turns with it */
export function SortButton({ value, onChange }: { value?: SortDir; onChange?: (dir: SortDir) => void }) {
  const [dir, setDir] = useControllable<SortDir>(value, "asc", onChange, "value");
  return (
    <button
      type="button"
      className="ui-as-tool ui-as-sort"
      data-dir={dir}
      aria-label={dir === "asc" ? "Sorted A to Z – sort Z to A" : "Sorted Z to A – sort A to Z"}
      title={dir === "asc" ? "A–Z" : "Z–A"}
      onClick={() => setDir(dir === "asc" ? "desc" : "asc")}
    >
      <Icon icon={ArrowUpDownIcon} size={15} />
    </button>
  );
}

export type ViewMode = "grid" | "list";

/** Grid or list – the library's Segmented Control as a radiogroup (arrow keys move and pick) */
export function ViewToggle({ value, onChange }: { value?: ViewMode; onChange?: (view: ViewMode) => void }) {
  return (
    <SegmentedControl<ViewMode>
      className="ui-as-view"
      aria-label="View"
      options={[
        { value: "grid", icon: <Icon icon={LayoutGridIcon} size={15} />, ariaLabel: "Grid" },
        { value: "list", icon: <Icon icon={ListIcon} size={15} />, ariaLabel: "List" },
      ]}
      value={value}
      defaultValue="grid"
      onChange={onChange}
    />
  );
}

export function SearchField({
  placeholder,
  width = 175,
  value,
  onChange,
}: {
  placeholder: string;
  width?: number;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [text, setText] = useControllable(value, "", onChange, "value");
  return (
    <label className="ui-as-search" style={{ width }}>
      <Icon icon={SearchIcon} size={15} />
      <input type="search" placeholder={placeholder} aria-label={placeholder} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setText("")} />
      {text && (
        <button type="button" className="ui-as-search__clear" aria-label="Clear search" onClick={() => setText("")}>
          <Icon icon={XIcon} size={12} />
        </button>
      )}
    </label>
  );
}

/** The control a popover hangs from: the first element in its anchor that isn't the popover */
function triggerOf(anchor: HTMLElement | null): HTMLElement | null {
  const first = [...(anchor?.children ?? [])].find((c) => !c.classList.contains("ui-as-popover"));
  if (!(first instanceof HTMLElement)) return null;
  return first.matches("button, a[href], input, [tabindex]") ? first : first.querySelector<HTMLElement>("button, a[href], input, [tabindex]");
}

/** The nearest ancestor that cuts off what sticks out (a scroll area), or the screen itself */
function clipBox(el: HTMLElement) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|hidden|clip)/.test(style.overflow + style.overflowY + style.overflowX) || node.classList.contains("ui-as")) return node.getBoundingClientRect();
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

/**
 * Small floating panel attached to its trigger. Opens on the preferred side and flips to the other side
 * (or edge) when it would stick out of the screen or its scroll area – it is always fully reachable.
 * Closes on a click outside or Escape; fades and scales in from the side it is attached to.
 */
export function Popover({
  open,
  onClose,
  children,
  align = "start",
  side = "bottom",
  className,
  role = "dialog",
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "start" | "end";
  side?: "bottom" | "top" | "right";
  className?: string;
  /** "dialog" (default) for a panel of controls; "none" when the content brings its own role, e.g. a menu */
  role?: "dialog" | "none";
  /** Names the dialog for screen readers */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ side, align });
  // Focus never drops to <body> when the popover closes (Escape, a pick, Tab out): it goes back to the trigger
  const anchor = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(open);
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    if (open && ref.current) {
      anchor.current = ref.current.parentElement;
      // A dialog without a label is named after its trigger
      const t = triggerOf(anchor.current);
      if (role === "dialog" && !label && t) ref.current.setAttribute("aria-label", t.getAttribute("aria-label") || t.textContent?.trim() || "Options");
    }
    if (wasOpen.current && !open) {
      const active = document.activeElement;
      if (hadFocus.current && (!active || active === document.body)) triggerOf(anchor.current)?.focus({ preventScroll: true });
      hadFocus.current = false;
    }
    wasOpen.current = open;
  }, [open, role, label]);
  // Read when the event comes, so an inline onClose doesn't re-attach the listeners on every render
  const close = useRef(onClose);
  close.current = onClose;

  // Measure before paint: flip up when there is no room below, flip sideways at the right or left edge
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    let next = { side, align };
    el.dataset.side = side;
    el.dataset.align = align;
    const box = clipBox(el);
    const r = el.getBoundingClientRect();
    if (side === "bottom" && r.bottom > box.bottom - 6) next = { ...next, side: "top" };
    if (side === "top" && r.top < box.top + 6) next = { ...next, side: "bottom" };
    if (align === "start" && r.right > box.right - 6) next = { ...next, align: "end" };
    if (align === "end" && r.left < box.left + 6) next = { ...next, align: "start" };
    // Still sticking out on a narrow screen (neither edge fits): slide it sideways until it is inside
    el.dataset.side = next.side;
    el.dataset.align = next.align;
    el.style.translate = "";
    const r2 = el.getBoundingClientRect();
    const scale = r2.width / el.offsetWidth || 1;
    let dx = 0;
    if (r2.right > box.right - 6) dx = box.right - 6 - r2.right;
    if (r2.left + dx < box.left + 6) dx = box.left + 6 - r2.left;
    if (dx) el.style.translate = `${dx / scale}px 0`;
    setPlace(next);
  }, [open, side, align]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const anchor = ref.current?.parentElement;
      if (anchor && !anchor.contains(e.target as Node)) close.current();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={["ui-as-popover", className].filter(Boolean).join(" ")}
      data-align={place.align}
      data-side={place.side}
      role={role === "dialog" ? "dialog" : undefined}
      aria-label={role === "dialog" ? label : undefined}
      onFocus={() => (hadFocus.current = true)}
    >
      {children}
    </div>
  );
}

export type MenuItem = {
  label: string;
  /** Second line in a lighter color */
  description?: string;
  icon?: LucideIcon;
  /** Shows a check – for choices like a model or a period */
  checked?: boolean;
  /** Red text, e.g. Delete */
  danger?: boolean;
  onSelect?: () => void;
};

/**
 * List of actions or choices inside a popover – a menu: focus moves in when it opens (to the checked item, else the
 * first), arrow keys / Home / End move between items, Tab closes it; Escape closes it and focus returns to the trigger
 */
export function MenuList({ items, onPick }: { items: MenuItem[]; onPick: () => void }) {
  const list = useRef<HTMLDivElement>(null);
  const rows = () => [...(list.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
  useLayoutEffect(() => {
    const all = rows();
    (all.find((el) => el.getAttribute("aria-checked") === "true") ?? all[0])?.focus({ preventScroll: true });
  }, []);
  const key = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") return onPick();
    const all = rows();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const next = { ArrowDown: (i + 1) % all.length, ArrowUp: (i - 1 + all.length) % all.length, Home: 0, End: all.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    all[next]?.focus();
  };
  return (
    <div ref={list} role="menu" className="ui-as-menu__list" onKeyDown={key}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role={item.checked === undefined ? "menuitem" : "menuitemradio"}
          aria-checked={item.checked}
          tabIndex={-1}
          className="ui-as-menu__item"
          data-danger={item.danger || undefined}
          data-rich={item.description ? true : undefined}
          onClick={() => {
            item.onSelect?.();
            onPick();
          }}
        >
          {item.icon && <Icon icon={item.icon} size={15} />}
          <span className="ui-as-menu__label">
            {item.label}
            {item.description && <small>{item.description}</small>}
          </span>
          {item.checked && (
            <span className="ui-as-menu__check">
              <Icon icon={CheckIcon} size={14} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Any trigger with a menu: the trigger gets the open state and a toggle */
export function Dropdown({
  trigger,
  items,
  align = "start",
  side = "bottom",
  title,
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  side?: "bottom" | "top";
  /** Small heading above the items */
  title?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  // The trigger is the caller's; tell assistive tech it opens a menu
  useLayoutEffect(() => {
    const t = triggerOf(anchor.current);
    if (t && !t.hasAttribute("aria-haspopup")) t.setAttribute("aria-haspopup", "menu");
  });
  return (
    <span ref={anchor} className={["ui-as-anchor", className].filter(Boolean).join(" ")}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <Popover open={open} onClose={() => setOpen(false)} align={align} side={side} className="ui-as-menu" role="none">
        {title && <span className="ui-as-menu__title">{title}</span>}
        <MenuList items={items} onPick={() => setOpen(false)} />
      </Popover>
    </span>
  );
}

/** Opens the library's Filter Menu in a popover; the button shows how many filters are on */
export function FilterButton({
  label,
  groups,
  value,
  onChange,
  align = "end",
}: {
  label: string;
  groups: FilterGroup[];
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const count = Object.values(value).reduce((n, ids) => n + ids.length, 0);
  return (
    <span className="ui-as-anchor">
      <button
        type="button"
        className="ui-as-tool ui-as-tool--label"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-active={count > 0 || undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon icon={FunnelIcon} size={15} />
        {label}
        {count > 0 ? <span className="ui-as-tool__count">{count}</span> : <Icon icon={ChevronDownIcon} size={13} />}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} align={align} className="ui-as-popover--filter" label={label}>
        <FilterMenu groups={groups} value={value} onChange={onChange} defaultOpen={groups.map((g) => g.id)} hints={false} title={label} />
      </Popover>
    </span>
  );
}

/** Plain menu of choices in a popover, e.g. a period picker */
export function MenuButton<T extends string>({
  value,
  options,
  onChange,
  icon,
  align = "end",
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  icon?: LucideIcon;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <span className="ui-as-anchor">
      <button type="button" className={["ui-as-tool ui-as-tool--label", className].filter(Boolean).join(" ")} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        {icon && <Icon icon={icon} size={15} />}
        {current?.label}
        <Icon icon={ChevronDownIcon} size={13} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} align={align} className="ui-as-menu" role="none">
        <MenuList items={options.map((o) => ({ label: o.label, checked: o.value === value, onSelect: () => onChange(o.value) }))} onPick={() => setOpen(false)} />
      </Popover>
    </span>
  );
}

/** Short confirmation at the bottom of the main area – "Saved to Reports" */
export function useToast() {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  // A counter, not the clock: every toast gets a new key, so the same text twice animates in again
  const count = useRef(0);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);
  const show = (text: string) => setToast({ id: ++count.current, text });
  // The live region is there from the start (an empty one), so the first toast is announced too
  const node = (
    <div className="ui-as-toast-live" role="status">
      {toast && (
        <div key={toast.id} className="ui-as-toast">
          <Icon icon={CheckIcon} size={14} />
          {toast.text}
        </div>
      )}
    </div>
  );
  return [node, show] as const;
}

export function SectionHead({ title, left, right }: { title: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="ui-as-section-head" data-inline={!left || undefined}>
      <h2 className="ui-as-section-head__title">{title}</h2>
      {(left || right) && (
        <div className="ui-as-toolbar">
          <div className="ui-as-toolbar__left">{left}</div>
          <div className="ui-as-toolbar__right">{right}</div>
        </div>
      )}
    </div>
  );
}

/** `bare`: without the dashed frame – the page's only content, e.g. inside .ui-as-center */
export function EmptyState({ title, text, action, tall, bare }: { title: string; text: string; action?: ReactNode; tall?: boolean; bare?: boolean }) {
  return (
    <div className="ui-as-empty" data-tall={tall || undefined} data-bare={bare || undefined}>
      <span className="ui-as-empty__icon">
        <Icon icon={FileTextIcon} size={18} />
      </span>
      <b className="ui-as-empty__title">{title}</b>
      <p className="ui-as-empty__text">{text}</p>
      {action && <div className="ui-as-empty__action">{action}</div>}
    </div>
  );
}

/* ---------- File cards ---------- */

export type FileType = "DOC" | "PDF" | "XLS";
export type FileItem = { name: string; type: FileType; edited?: string };

/** Badge color and label per file type */
const colors: Record<FileType, "blue" | "rose" | "emerald"> = { DOC: "blue", PDF: "rose", XLS: "emerald" };
export const fileKind: Record<FileType, string> = { DOC: "Document", PDF: "PDF", XLS: "Spreadsheet" };

/** A file as a card: preview on a gray stage, name and one line of details below */
export function FileCard({ file, meta }: { file: FileItem; meta: ReactNode }) {
  return (
    <button type="button" className="ui-as-template">
      <span className="ui-as-template__preview">
        <DocPreview type={file.type} color={colors[file.type]} />
      </span>
      <b className="ui-as-template__name">{file.name}</b>
      <span className="ui-as-meta">{meta}</span>
    </button>
  );
}

/**
 * File illustration in the style of the Glass Folder: a tinted sheet behind, a paper page with the file's content,
 * and a small frosted glass tag with the type at its corner. On hover the sheets fan out a little.
 */
function DocPreview({ type, color }: { type: FileType; color: "blue" | "rose" | "emerald" }) {
  return (
    <span className="ui-as-doc" data-color={color} aria-hidden="true">
      <span className="ui-as-doc__art">
        <span className="ui-as-doc__back" />
        <span className="ui-as-doc__page" data-type={type}>
          {type === "XLS" ? (
            <span className="ui-as-sheet">
              {Array.from({ length: 18 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          ) : (
            <>
              {type === "PDF" ? <span className="ui-as-doc__image" /> : <i className="ui-as-doc__title" />}
              {(type === "PDF" ? [100, 82, 92] : [100, 86, 94, 70, 88]).map((w, i) => (
                <i key={i} className="ui-as-doc__line" style={{ width: `${w}%` }} />
              ))}
            </>
          )}
        </span>
        <span className="ui-as-doc__type">{type}</span>
      </span>
    </span>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme – set by the class, data-tc-theme or the OS */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* The shell has no scale of its own: its parts use the pattern tokens, like the Trenchcoat components inside it */
.ui-as {
  /* Gray page, the main area is a rounded panel on it */
  --tc-app-shell-panel-radius: var(--tc-radius-2xl, 16px);
  --tc-app-shell-frame-gap: 8px;
  /* Kept for the screens that use them: the gray tray around cards and tables, and switches */
  --tc-app-shell-tray: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  --tc-app-shell-switch-off: var(--tc-switch-off, light-dark(#858585, #7c7c82));
  --tc-app-shell-switch-on: var(--tc-switch-on, #2f68ff);
  /* An edge you can drag, while the pointer is on it */
  --tc-app-shell-edge-active: var(--tc-border-control, light-dark(#858585, #7c7c82));
  /* A toast stays this long (the timer in useToast matches it); content that rises in staggers by this step */
  --tc-app-shell-toast: 2200ms;
  --tc-app-shell-stagger: 35ms;
}

.ui-as, .ui-as *, .ui-as *::before, .ui-as *::after { box-sizing: border-box; }
.ui-as {
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
:where(.ui-as) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
:where(.ui-as) svg { display: block; flex: none; }
:where(.ui-as) :focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
/* Text fields in the screens show their ring on the field around them (:focus-within) instead */
:where(.ui-as input, .ui-as textarea):focus-visible { outline: none; }

/* App frame shared by all screens: sidebar on the gray page, main area as a rounded white panel */

.ui-as-app {
  /* The layout answers to the app's own width (container queries), not the window – see the end of this file */
  container: ui-as / inline-size;
  position: relative;
  display: grid;
  /* Folded-away sidebar and work area are moved off the edge – they must not make the page scroll sideways */
  overflow: clip;
  /* Sidebar · main area · work area on the right (0 when there is none or it's closed); widths come from the drag handles */
  --tc-app-shell-side-col: var(--side-w, 272px);
  --tc-app-shell-panel-col: 0px;
  grid-template-columns: var(--tc-app-shell-side-col) minmax(0, 1fr) var(--tc-app-shell-panel-col);
  height: 100%;
  min-height: 560px;
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  transition: grid-template-columns var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-app[data-panel="open"] { --tc-app-shell-panel-col: var(--panel-w, 360px); }
/* Collapsed: the sidebar is gone completely, the main area keeps the same gap on all sides */
.ui-as-app[data-collapsed] { --tc-app-shell-side-col: 0px; }
.ui-as-app[data-collapsed] .ui-as-main { margin-left: var(--tc-app-shell-frame-gap); }
/* Dragging an edge: the columns follow the pointer at once */
.ui-as-app[data-resizing] { transition: none; cursor: col-resize; user-select: none; }
.ui-as-app[data-resizing] :is(.ui-as-main, .ui-as-side, .ui-as-panel) { transition: none; }

/* ---------- Sidebar ---------- */

.ui-as-side {
  display: flex;
  flex-direction: column;
  width: var(--side-w, 272px);
  min-height: 0;
  padding: 10px 8px 8px 10px;
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease), translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s;
}
.ui-as-app[data-collapsed] .ui-as-side {
  visibility: hidden;
  opacity: 0;
  translate: -16px 0;
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s var(--tc-duration-slower, 420ms);
}

/* The icon to bring the sidebar back, in the top left corner of the main area */
.ui-as-side-open {
  position: fixed;
  z-index: calc(var(--tc-z-sticky, 10) + 1);
  top: calc(var(--tc-app-shell-frame-gap) + 9px);
  left: calc(var(--tc-app-shell-frame-gap) + 9px);
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), visibility 0s var(--tc-duration-base, 200ms);
}
.ui-as-app[data-collapsed] .ui-as-side-open {
  visibility: visible;
  opacity: 1;
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) var(--tc-duration-fast, 150ms), visibility 0s;
}

.ui-as-side__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
}
.ui-as-side__workspace {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px;
  border-radius: var(--tc-control-radius-sm, 8px);
  font-size: var(--tc-font-size-lg, 14px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-side__workspace svg { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-side__workspace:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-as-user-menu { display: flex; }
.ui-as-user-menu > .ui-as-user { flex: 1; }
.ui-as-user-menu .ui-as-menu { width: 100%; }
/* Workspace logo on a white tile with a small, tight shadow below */
.ui-as-side__logo {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-right: 1px;
  border-radius: var(--tc-avatar-radius-agent, 6px);
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-as-side__logo svg { width: 11px; height: auto; }
.ui-as-side__tools { display: flex; gap: 2px; }

/* Ghost icon button – Button's ghost recipe, square at the small control height */
.ui-as-icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm, 28px);
  height: var(--tc-control-h-sm, 28px);
  border-radius: var(--tc-control-radius-sm, 8px);
  color: var(--tc-action-ghost-fg, light-dark(#404040, #c8c8cc));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-icon-btn:hover { background: var(--tc-action-ghost-bg-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-as-side__nav {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}
.ui-as-side__group { display: flex; flex-direction: column; }
.ui-as-side__group + .ui-as-side__group { margin-top: 10px; }
.ui-as-side__group + .ui-as-side__group > .ui-as-side__label:first-child { margin-top: 6px; }
.ui-as-side__count { margin-left: auto; font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-as-side__empty { padding: 4px 6px; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-side__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 30px;
  padding: 0 6px;
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-md-plus, 13.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  text-align: left;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-side__item svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-side__item:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-side__item[aria-current="page"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-as-side__item[aria-current="page"] svg { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
a.ui-as-side__item { text-decoration: none; cursor: pointer; }
.ui-as-side__label {
  margin: 16px 0 4px;
  padding: 0 6px;
  font-size: var(--tc-caption-font-size, 12px);
  font-weight: var(--tc-caption-font-weight, 500);
  line-height: var(--tc-caption-line-height, 16px);
  letter-spacing: var(--tc-caption-tracking, 0);
  text-transform: var(--tc-caption-transform, none);
  color: var(--tc-caption-color, light-dark(#646464, #9a9aa1));
}

.ui-as-side__foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

/* "What's new" – two cards stacked, the second one peeks out above */
.ui-as-news { position: relative; padding-top: 30px; }
.ui-as-news__card {
  position: relative;
  z-index: 1;
  padding: 10px 10px 0;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-as-news__card--back {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 10px;
  right: 10px;
  height: 48px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 9px 9px 0;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  color: var(--tc-icon-muted, light-dark(#858585, #7c7c82));
}
.ui-as-news[data-count="1"] { padding-top: 0; }
.ui-as-news[data-count="1"] .ui-as-news__card--back { display: none; }
.ui-as-news__top { display: flex; align-items: center; justify-content: space-between; }
.ui-as-news__kicker { font-size: var(--tc-font-size-xs-plus, 11.5px); line-height: var(--tc-line-height-tight, 16px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-as-news__close {
  display: grid;
  place-items: center;
  /* 24 px target, drawn where the 18 px one was */
  width: 24px;
  height: 24px;
  margin: -5px -5px -3px 0;
  border-radius: var(--tc-radius-sm, 6px);
  color: var(--tc-icon-muted, light-dark(#858585, #7c7c82));
}
.ui-as-news__close:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-news__title { display: block; margin-top: 4px; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-news__more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% + 20px);
  height: 34px;
  margin: 10px -10px 0;
  padding: 0 10px;
  border-top: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  border-radius: 0 0 var(--tc-radius-xl, 12px) var(--tc-radius-xl, 12px);
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-as-news__more:hover { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* Onboarding progress */
/* Getting started: one card that morphs between the short summary and the full Setup Guide */
.ui-as-guide-slot { position: relative; flex: none; }
.ui-as-guide {
  position: absolute;
  z-index: 6;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: height var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), border-radius var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), box-shadow var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-as-guide:not([data-open]):hover { box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-as-guide[data-open] { border-radius: var(--tc-card-radius, 16px); box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-as-guide__content { animation: ui-as-guide-in var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
/* Closing: the guide fades out while the card shrinks back to the summary's height */
.ui-as-guide[data-state="closing"] .ui-as-guide__content { animation: ui-as-guide-out var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) both; }
.ui-as-guide[data-state="closing"] { border-radius: var(--tc-radius-xl, 12px); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
@keyframes ui-as-guide-out { to { opacity: 0; } }
@keyframes ui-as-guide-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.ui-as-steps {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 10px 10px 9px;
  text-align: left;
}
/* The library's Setup Guide inside the card, at its own size: the card is the frame, so the guide's card tokens are
   set to none on its root (through its className – no reach into its classes) */
.ui-as-guide__sg { --tc-card-shadow: none; --tc-card-radius: 0px; }
.ui-as-steps__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--tc-font-size-md-plus, 13.5px);
  line-height: var(--tc-line-height-snug, 18px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-steps__title svg { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-steps__sub { font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-steps__cheer { color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-as-steps__bar {
  height: var(--tc-meter-h, 4px);
  margin-top: 6px;
  overflow: hidden;
  border-radius: var(--tc-meter-radius, 999px);
  background: var(--tc-meter-track, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
}
.ui-as-steps__bar i { display: block; min-width: 6px; height: 100%; border-radius: inherit; background: var(--tc-meter-fill, #2f68ff); transition: width var(--tc-duration-slowest, 560ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }

.ui-as-user {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 6px;
  border-radius: var(--tc-radius-md, 8px);
  font-size: var(--tc-font-size-md-plus, 13.5px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-user img { width: var(--tc-avatar-sm, 20px); height: var(--tc-avatar-sm, 20px); border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06); }
.ui-as-user svg { margin-left: auto; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-user:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }

/* ---------- Main ---------- */

/* Main area as a rounded panel, like the Trenchcoat components */
.ui-as-main {
  /* Screens reflow their content by the width of this panel */
  container: ui-as-main / inline-size;
  position: relative;
  min-width: 0;
  margin: var(--tc-app-shell-frame-gap) var(--tc-app-shell-frame-gap) var(--tc-app-shell-frame-gap) 0;
  overflow-y: auto;
  /* No rubber-band bounce at the ends – sticky headers stay put */
  overscroll-behavior: none;
  transition: margin-left var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
  border: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: var(--tc-app-shell-panel-radius);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
}


/* Shared page parts: headings, toolbars, tabs, search, empty states – Trenchcoat tokens */

.ui-as-page {
  padding: 46px 32px 56px;
}
.ui-as-page-title {
  margin: 0;
  font-size: var(--tc-font-size-2xl, 20px);
  line-height: var(--tc-line-height-display-sm, 28px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: -0.02em;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-page-sub {
  margin: 6px 0 0;
  font-size: var(--tc-font-size-md-plus, 13.5px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-as-page-sub a { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); text-decoration: underline; text-decoration-color: var(--tc-border-strong, light-dark(#dedede, #3a3a40)); text-underline-offset: 3px; }
.ui-as-page-sub a:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-decoration-color: currentColor; }

.ui-as-section-head { margin-top: 38px; }
/* Without tabs the tools sit on the same line as the title */
.ui-as-section-head[data-inline] { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ui-as-section-head[data-inline] .ui-as-toolbar { margin-top: 0; }
.ui-as-section-head__title {
  margin: 0;
  font-size: var(--tc-font-size-xl, 16px);
  line-height: var(--tc-line-height-relaxed, 22px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: -0.01em;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
/* Toolbars wrap when the page is narrower than their tools (a narrow main area next to an open work area, too) */
.ui-as-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin-top: 16px;
}
.ui-as-toolbar__left, .ui-as-toolbar__right { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; max-width: 100%; }

/* Tabs – the segmented recipe: a gray track, a raised thumb under the active tab, options as tall as a control */
.ui-as-tabs {
  position: relative;
  display: inline-flex;
  flex: none;
  max-width: 100%;
  gap: 2px;
  padding: var(--tc-seg-pad, 2px);
  border-radius: var(--tc-seg-track-radius, 10px);
  background: var(--tc-seg-track-bg, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
}
.ui-as-tabs__pill {
  position: absolute;
  top: var(--tc-seg-pad, 2px);
  bottom: var(--tc-seg-pad, 2px);
  left: 0;
  border-radius: calc(var(--tc-seg-track-radius, 10px) - var(--tc-seg-pad, 2px));
  background: var(--tc-seg-thumb-bg, light-dark(#ffffff, #34343a));
  box-shadow: var(--tc-seg-thumb-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)), width var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-tabs__tab {
  position: relative;
  display: inline-grid;
  flex: none;
  align-items: center;
  height: var(--tc-control-h-md, 32px);
  padding: 0 var(--tc-control-px-md, 12px);
  border-radius: calc(var(--tc-seg-track-radius, 10px) - var(--tc-seg-pad, 2px));
  font-size: var(--tc-font-size-md-plus, 13.5px);
  line-height: var(--tc-line-height-none, 1);
  white-space: nowrap;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
/* The bold label's width is reserved (an invisible copy, left out of the accessible name), so picking doesn't shift */
.ui-as-tabs__tab::after { content: attr(data-text) / ""; height: 0; overflow: hidden; visibility: hidden; font-weight: var(--tc-font-weight-strong, 600); }
.ui-as-tabs[data-full] { display: flex; }
.ui-as-tabs[data-full] > .ui-as-tabs__tab { flex: 1; justify-items: center; }
.ui-as-tabs__tab:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-tabs__tab[aria-selected="true"] { color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-strong, 600); }

/* The view toggle is the library's Segmented Control */

/* Toolbar tools – Button's secondary recipe: control height and radius, white with a ring, square when icon-only */
.ui-as-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: var(--tc-control-h-md, 32px);
  height: var(--tc-control-h-md, 32px);
  border-radius: var(--tc-control-radius-md, 10px);
  background: var(--tc-action-secondary-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font-size: var(--tc-control-font-size, 13px);
  font-weight: var(--tc-control-font-weight, 500);
  white-space: nowrap;
  color: var(--tc-action-secondary-fg, light-dark(#171717, #ededed));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-tool svg { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-tool:hover, .ui-as-tool[data-active], .ui-as-tool[aria-expanded="true"] { box-shadow: var(--tc-action-secondary-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-as-tool:hover svg, .ui-as-tool[aria-pressed="true"] svg { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* Pressed: a filled, ringed state – not just a colour */
.ui-as-tool[aria-pressed="true"] { background: var(--tc-fill-selected, light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14))); box-shadow: inset 0 0 0 1px var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)); }
.ui-as-tool--label { padding: 0 var(--tc-control-px-md, 12px); }

/* Search – the field recipe: field height, radius, ring and focus ring on the field (the input itself has none) */
.ui-as-search {
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  height: var(--tc-field-h, 36px);
  padding: 0 var(--tc-field-px, 12px);
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-icon-muted, light-dark(#858585, #7c7c82));
  cursor: text;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-search:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-as-search:focus-within { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-as-search input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-field-font-size, 13.5px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-search input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
/* Clear: a 24 px target with the small round mark drawn inside it */
.ui-as-search__clear {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-right: -6px;
  border-radius: 50%;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  animation: ui-as-pop var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-search__clear::before { content: ""; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-as-search__clear { position: relative; }
.ui-as-search__clear svg { position: relative; }
.ui-as-search__clear:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* Sort: the arrows turn half a circle for Z–A */
.ui-as-sort svg { transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-sort[data-dir="desc"] svg { transform: rotate(180deg); }
/* How many filters are on – the inverted count pill */
.ui-as-tool__count {
  display: grid;
  place-items: center;
  min-width: var(--tc-pill-h, 20px);
  height: var(--tc-pill-h, 20px);
  padding: 0 6px;
  border-radius: var(--tc-radius-badge, 999px);
  background: var(--tc-surface-inverse, light-dark(#171717, #ededed));
  font-size: var(--tc-pill-font-size, 11px);
  font-weight: var(--tc-pill-font-weight, 500);
  color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113));
  animation: ui-as-pop var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}

/* Popovers: attached to their trigger, they fade and scale in from that side */
.ui-as-anchor { position: relative; display: inline-flex; }
.ui-as-popover {
  position: absolute;
  z-index: var(--tc-z-dropdown, 30);
  top: calc(100% + 6px);
  left: 0;
  transform-origin: top left;
  animation: ui-as-popover var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-popover[data-align="end"] { right: 0; left: auto; transform-origin: top right; }
.ui-as-popover[data-side="top"] { top: auto; bottom: calc(100% + 6px); transform-origin: bottom left; animation-name: ui-as-popover-up; }
.ui-as-popover[data-side="top"][data-align="end"] { transform-origin: bottom right; }
.ui-as-popover[data-side="right"] { top: auto; bottom: 0; left: calc(100% + 12px); transform-origin: bottom left; }
@keyframes ui-as-popover-up { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: none; } }
/* The Filter Menu gets its width from the popover around it (it fills its container up to its own max-width) */
.ui-as-popover--filter { width: min(380px, calc(100cqi - 32px)); }

/* Menus – the menu recipe: surface, rows, hover, and the selected row in accent text with a check */
.ui-as-menu {
  min-width: 168px;
  padding: var(--tc-menu-padding, 4px);
  border-radius: var(--tc-menu-radius, 12px);
  background: var(--tc-menu-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-menu-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
}
.ui-as-menu__title {
  display: block;
  padding: 6px var(--tc-menu-item-px, 10px) 4px;
  font-size: var(--tc-caption-font-size, 12px);
  font-weight: var(--tc-caption-font-weight, 500);
  line-height: var(--tc-caption-line-height, 16px);
  color: var(--tc-caption-color, light-dark(#646464, #9a9aa1));
}
.ui-as-menu__list { display: grid; gap: 1px; }
.ui-as-menu__item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-height: var(--tc-menu-item-h, 32px);
  padding: 0 var(--tc-menu-item-px, 10px);
  border-radius: var(--tc-menu-item-radius, 8px);
  font-size: var(--tc-menu-item-font-size, 13px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  text-align: left;
  white-space: nowrap;
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease), color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-as-menu__item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
.ui-as-menu__item[data-rich] { min-height: 44px; padding: 6px var(--tc-menu-item-px, 10px); }
.ui-as-menu__item > svg { flex: none; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-menu__item > .ui-as-menu__check { margin-left: auto; color: inherit; }
.ui-as-menu__label { display: grid; flex: 1; gap: 1px; min-width: 0; }
.ui-as-menu__label small { font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-menu__item:hover { background: var(--tc-menu-item-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-menu__item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-as-menu__item[data-danger] { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-as-menu__item[data-danger] > svg { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }

/* Toast – an inverted pill, above the page's layers */
.ui-as-toast-live { display: contents; }
.ui-as-toast {
  position: absolute;
  z-index: var(--tc-z-toast, 80);
  left: 50%;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px 0 12px;
  border-radius: var(--tc-radius-badge, 999px);
  background: var(--tc-surface-inverse, light-dark(#171717, #ededed));
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113));
  box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  translate: -50% 0;
  animation: ui-as-toast var(--tc-app-shell-toast) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}

/* Shared motion: content that changes (tabs, filters, new messages) rises in; --i staggers a list */
.ui-as-rise { animation: ui-as-rise var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; animation-delay: calc(var(--i, 0) * var(--tc-app-shell-stagger)); }
@keyframes ui-as-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes ui-as-pop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: none; } }
@keyframes ui-as-popover { from { opacity: 0; transform: scale(0.96) translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes ui-as-toast {
  0% { opacity: 0; transform: translateY(12px) scale(0.96); }
  12%, 85% { opacity: 1; transform: none; }
  100% { opacity: 0; transform: translateY(6px); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-as *, .ui-as *::before, .ui-as *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
.ui-as-search input::-webkit-search-cancel-button { display: none; }

/* Empty state in a dashed drop area */
.ui-as-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
  padding: 48px 24px 52px;
  border: 1px dashed var(--tc-border-strong, light-dark(#dedede, #3a3a40));
  border-radius: var(--tc-card-radius, 16px);
  text-align: center;
}
.ui-as-empty[data-tall] { padding: 48px 24px 48px; }
.ui-as-empty__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-as-empty__title { margin-top: 16px; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-empty__text { max-width: 430px; margin: 6px 0 0; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); text-wrap: balance; }
.ui-as-empty__action { display: flex; margin-top: 18px; }

/* Glass Folder from the library at icon size; hovering the whole card or row opens it like hovering the folder itself */
.ui-as-folder-card__icon, .ui-as-folder-head__icon {
  position: relative;
  flex: none;
  width: 30px;
  height: 25px;
}
.ui-as-folder-card__icon .ui-fd, .ui-as-folder-head__icon .ui-fd {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75px;
  translate: -50% -50%;
}
:is(.ui-as-folder-card, .ui-as-folder-head):hover .ui-fd-icon { transform: translate(-50%, -48%) scale(1.03); }
:is(.ui-as-folder-card, .ui-as-folder-head):hover .ui-fd-doc--left { transform: translate(32px, 70px) rotate(9deg); }
:is(.ui-as-folder-card, .ui-as-folder-head):hover .ui-fd-doc--right { transform: translate(286px, 76px) rotate(5deg); }
:is(.ui-as-folder-card, .ui-as-folder-head):hover .ui-fd-doc--middle { transform: translate(166px, 52px) rotate(-7deg); }
:is(.ui-as-folder-card, .ui-as-folder-head):hover .ui-fd-front {
  top: 24.8%;
  border-radius: 3cqw 3cqw 6.333cqw 6.333cqw;
  transform: translateZ(2.33cqw) rotateX(-9deg);
}

.ui-as-meta { display: inline-flex; align-items: center; gap: 4px; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-meta svg { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }


/* File card – used for templates and for the files inside a folder */
.ui-as-template { display: grid; width: 239px; text-align: left; }
.ui-as-template__preview {
  display: block;
  height: 158px;
  padding: 7px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-template:hover .ui-as-template__preview { box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-as-template__name { margin-top: 10px; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-template .ui-as-meta { margin-top: 2px; }

/* File illustration in the Glass Folder style: tinted back sheet, paper page, frosted type badge */
.ui-as-doc {
  --tc-app-shell-doc-back: #5bb7ea;
  --tc-app-shell-doc-glass-1: rgba(120, 200, 245, 0.72);
  --tc-app-shell-doc-glass-2: rgba(52, 150, 212, 0.78);
  --tc-app-shell-doc-shade: 60, 130, 180;
  --tc-app-shell-doc-paper: light-dark(#eaf2f8, #263039);
  /* Dark mode: dark paper tinted by the file's color, light lines */
  --tc-app-shell-doc-page: light-dark(#ffffff, #303238);
  --tc-app-shell-doc-edge: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
  --tc-app-shell-doc-ink: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --tc-app-shell-doc-ink-strong: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.3));
  --tc-app-shell-doc-cell: light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
}
.ui-as-doc[data-color="rose"] {
  --tc-app-shell-doc-back: #f27b90;
  --tc-app-shell-doc-glass-1: rgba(250, 150, 170, 0.74);
  --tc-app-shell-doc-glass-2: rgba(222, 70, 100, 0.8);
  --tc-app-shell-doc-shade: 190, 60, 88;
  --tc-app-shell-doc-paper: light-dark(#f9eef1, #36282d);
}
.ui-as-doc[data-color="emerald"] {
  --tc-app-shell-doc-back: #4cc591;
  --tc-app-shell-doc-glass-1: rgba(110, 215, 165, 0.74);
  --tc-app-shell-doc-glass-2: rgba(30, 160, 102, 0.8);
  --tc-app-shell-doc-shade: 40, 140, 96;
  --tc-app-shell-doc-paper: light-dark(#edf7f2, #243530);
}
.ui-as-doc__art { position: relative; display: block; width: 72px; height: 92px; }

/* Tinted sheet peeking out behind the page, like the back of the folder */
.ui-as-doc__back {
  position: absolute;
  inset: 0;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-app-shell-doc-back);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 10px 18px -8px rgba(var(--tc-app-shell-doc-shade), 0.45);
  transform: translate(10px, -4px) rotate(8deg);
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}

/* The page: white fading into a hint of the file's colour, like the documents in the folder */
.ui-as-doc__page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 13px 11px;
  border-radius: var(--tc-radius-lg, 10px);
  background: linear-gradient(180deg, var(--tc-app-shell-doc-page) 0%, var(--tc-app-shell-doc-paper) 100%);
  box-shadow: 0 0 0 1px var(--tc-app-shell-doc-edge), 0 3px 5px rgba(var(--tc-app-shell-doc-shade), 0.16);
  transform: rotate(-3deg);
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-doc__title { display: block; width: 58%; height: 5px; margin-bottom: 3px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-app-shell-doc-ink-strong); }
.ui-as-doc__line { display: block; height: 4px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-app-shell-doc-ink); }
.ui-as-doc__image {
  display: block;
  height: 26px;
  margin-bottom: 2px;
  border-radius: var(--tc-radius-xs, 4px);
  background: linear-gradient(160deg, var(--tc-app-shell-doc-glass-1), var(--tc-app-shell-doc-glass-2));
  opacity: 0.55;
}

/* Spreadsheet: a 3 × 6 grid with a darker header row */
.ui-as-sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.ui-as-sheet i { height: 8px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-app-shell-doc-cell); }
.ui-as-sheet i:nth-child(-n + 3) { background: rgba(var(--tc-app-shell-doc-shade), 0.35); }

/* Small frosted glass tag at the lower right corner, the same recipe as the folder's front pocket */
.ui-as-doc__type {
  position: absolute;
  right: -12px;
  bottom: 10px;
  z-index: 2;
  padding: 1.5px 6px;
  border-radius: var(--tc-radius-xs, 4px);
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgba(var(--tc-app-shell-doc-shade), 0.25) 100%),
    linear-gradient(180deg, var(--tc-app-shell-doc-glass-1), var(--tc-app-shell-doc-glass-2));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 6px 12px -4px rgba(var(--tc-app-shell-doc-shade), 0.45);
  -webkit-backdrop-filter: blur(4px) saturate(1.15);
  backdrop-filter: blur(4px) saturate(1.15);
  font-size: var(--tc-font-size-2xs, 10px);
  line-height: var(--tc-line-height-tight, 16px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: #fff;
  text-shadow: 0 1px 2px rgba(var(--tc-app-shell-doc-shade), 0.45);
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-template:hover .ui-as-doc__back { transform: translate(14px, -7px) rotate(12deg); }
.ui-as-template:hover .ui-as-doc__page { transform: translateY(-4px) rotate(-5deg); }
.ui-as-template:hover .ui-as-doc__type { transform: translate(2px, -2px); }

/* Workspace initial and user initials */
.ui-as-side__logo { font-size: var(--tc-font-size-2xs, 10px); font-weight: var(--tc-avatar-font-weight, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-user__initials {
  display: grid;
  place-items: center;
  width: var(--tc-avatar-sm, 20px);
  height: var(--tc-avatar-sm, 20px);
  border-radius: 50%;
  background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16)));
  font-size: var(--tc-avatar-font-size, 9px);
  font-weight: var(--tc-avatar-font-weight, 600);
  color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff));
}

/* Scrim behind the drawer – only used on narrow screens */
.ui-as-scrim { display: none; }

/* ---------- Resizing ---------- */

/* A 12px strip centred on the main area's edge; on hover a darker line runs along the page's edge, fading to nothing
   at both ends – so it meets the rounded corners of the inset panel softly */
.ui-as-resizer {
  position: absolute;
  z-index: calc(var(--tc-z-sticky, 10) + 1);
  top: calc(var(--tc-app-shell-bar-h, 0px) + var(--tc-app-shell-frame-gap));
  bottom: var(--tc-app-shell-frame-gap);
  width: 12px;
  cursor: col-resize;
  touch-action: none;
}
/* Keyboard focus: the edge line turns into a focus-ring-coloured bar instead of an outline around the strip */
.ui-as-resizer:focus-visible { outline: none; }
.ui-as-resizer[data-edge="left"] { left: calc(var(--side-w, 272px) - 6px); }
.ui-as-resizer[data-edge="right"] { right: calc(var(--panel-w, 360px) - 6px); }
.ui-as-resizer::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--tc-app-shell-edge-active) 22%, var(--tc-app-shell-edge-active) 78%, transparent);
  opacity: 0;
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
/* Exactly on the page's border: its left edge on the left, its right edge on the right */
.ui-as-resizer[data-edge="left"]::after { left: 6px; }
.ui-as-resizer[data-edge="right"]::after { left: 5px; }
.ui-as-resizer:hover::after { opacity: 1; transition-delay: var(--tc-duration-instant, 90ms); }
.ui-as-resizer:focus-visible::after, .ui-as-resizer[data-dragging]::after { opacity: 1; transition-delay: 0ms; }
.ui-as-resizer:focus-visible::after { width: var(--tc-focus-ring-width, 2px); margin-left: -0.5px; background: var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff)); }

/* ---------- Work area on the right ---------- */

/* Sits on the gray page like the sidebar, mirrored; the main area gives up its right gap to it */
.ui-as-app[data-panel] > .ui-as-main { grid-column: 2; }
.ui-as-app[data-panel="open"] > .ui-as-main { margin-right: 0; }
.ui-as-panel {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  width: var(--panel-w, 360px);
  min-height: 0;
  padding: 10px 10px 10px 8px;
  overflow: hidden;
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease), translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s;
}
.ui-as-app[data-panel="closed"] > .ui-as-panel {
  visibility: hidden;
  opacity: 0;
  translate: 16px 0;
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s var(--tc-duration-slower, 420ms);
}
.ui-as-panel__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding-left: 6px;
}
.ui-as-panel__title { font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-panel__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; margin: 0 -2px; padding: 12px 2px 4px; }

/* Its icon waits in the top right corner of the main area while it's closed */
.ui-as-panel-open {
  position: fixed;
  z-index: calc(var(--tc-z-sticky, 10) + 1);
  top: calc(var(--tc-app-shell-frame-gap) + 9px);
  right: calc(var(--tc-app-shell-frame-gap) + 9px);
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), visibility 0s var(--tc-duration-base, 200ms);
}
.ui-as-app[data-panel="closed"] > .ui-as-panel-open {
  visibility: visible;
  opacity: 1;
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) var(--tc-duration-fast, 150ms), visibility 0s;
}

/* ---------- Header across the app ---------- */

/* One bar over everything: a row of its own on top, split into the sidebar's, the page's and the work area's part */
.ui-as-app[data-header] { --tc-app-shell-bar-h: 48px; grid-template-rows: var(--tc-app-shell-bar-h) minmax(0, 1fr); }
.ui-as-app[data-header] > .ui-as-bar--side { grid-area: 1 / 1; }
.ui-as-app[data-header] > .ui-as-bar--main { grid-area: 1 / 2; }
.ui-as-app[data-header] > .ui-as-bar--panel { grid-area: 1 / 3; }
.ui-as-app[data-header] > .ui-as-side { grid-area: 2 / 1; }
.ui-as-app[data-header] > .ui-as-main { grid-area: 2 / 2; margin-top: 0; }
.ui-as-app[data-header] > .ui-as-panel { grid-area: 2 / 3; }
.ui-as-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  height: var(--tc-app-shell-bar-h);
  overflow: hidden;
  transition: padding var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease);
}
.ui-as-bar--side { padding: 0 10px; }
.ui-as-bar--side > :last-child { margin-left: auto; }
.ui-as-bar--main { justify-content: space-between; gap: 12px; padding: 0 12px 0 18px; }
.ui-as-bar--panel { justify-content: space-between; padding: 0 10px 0 16px; }
.ui-as-bar__title { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; }
.ui-as-bar__title > * { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-as-bar__actions { display: flex; flex: none; align-items: center; gap: 2px; }
.ui-as-bar__pick { display: flex; align-items: center; gap: 6px; min-width: 0; height: 30px; margin-left: -8px; padding: 0 8px; border-radius: var(--tc-radius-md, 8px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-bar__pick > span { overflow: hidden; text-overflow: ellipsis; }
.ui-as-bar__pick svg { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-bar__pick:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
/* The sidebar's own tools move into the bar; the head keeps just the workspace */
.ui-as-app[data-header] > .ui-as-side .ui-as-side__tools,
.ui-as-app[data-header] > .ui-as-panel > .ui-as-panel__head { display: none; }
.ui-as-app[data-header] > .ui-as-panel > .ui-as-panel__body { padding-top: 2px; }
/* Folded away: their part of the bar goes with them, and the icons to bring them back sit in the page's bar */
.ui-as-app[data-header][data-collapsed] > .ui-as-bar--side,
.ui-as-app[data-header][data-panel="closed"] > .ui-as-bar--panel { opacity: 0; }
.ui-as-app[data-header][data-collapsed] > .ui-as-bar--main { padding-left: 50px; }
.ui-as-app[data-header][data-panel="closed"] > .ui-as-bar--main { padding-right: 50px; }
.ui-as-app[data-header] > :is(.ui-as-side-open, .ui-as-panel-open) { top: 10px; }

/* A page that is just one centred block, e.g. an empty state */
.ui-as-center { display: grid; place-items: center; min-height: 100%; padding: 48px 32px; }
.ui-as-empty[data-bare] { margin-top: 0; padding: 0; border: 0; }

/* ---------- Narrow: tablet and phone ---------- */
/* Container queries on the app itself, so a scaled 1440 px preview keeps the desktop layout */

@container ui-as (max-width: 900px) {
  /* The main panel takes the whole width; the sidebar slides in over it as a drawer */
  .ui-as-app > .ui-as-main { grid-row: 1; grid-column: 1 / -1; margin-left: var(--tc-app-shell-frame-gap); }
  .ui-as-app > .ui-as-side {
    position: absolute;
    z-index: var(--tc-z-drawer, 50);
    top: 0;
    bottom: 0;
    left: 0;
    width: min(264px, calc(100% - 56px));
    padding: 10px 10px 10px 12px;
    border-radius: 0 var(--tc-radius-2xl, 16px) var(--tc-radius-2xl, 16px) 0;
    background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  }
  .ui-as-app:not([data-drawer]) > .ui-as-side {
    visibility: hidden;
    translate: calc(-100% - 24px) 0;
    transition: translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s var(--tc-duration-slower, 420ms);
  }
  .ui-as-app[data-drawer] > .ui-as-side {
    visibility: visible;
    opacity: 1;
    translate: 0 0;
    transition: translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s;
  }
  /* The work area on the right becomes a drawer too, sliding in from the right */
  .ui-as-app[data-panel] { --tc-app-shell-panel-col: 0px; }
  .ui-as-app[data-panel] > .ui-as-main { grid-column: 1 / -1; margin-right: var(--tc-app-shell-frame-gap); }
  .ui-as-app > .ui-as-panel {
    position: absolute;
    z-index: var(--tc-z-drawer, 50);
    top: 0;
    right: 0;
    bottom: 0;
    width: min(360px, calc(100% - 56px));
    padding: 10px 12px 10px 10px;
    border-radius: var(--tc-radius-2xl, 16px) 0 0 var(--tc-radius-2xl, 16px);
    background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  }
  .ui-as-app[data-panel="closed"] > .ui-as-panel {
    translate: calc(100% + 24px) 0;
    transition: translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s var(--tc-duration-slower, 420ms);
  }
  .ui-as-app[data-panel="open"] > .ui-as-panel { visibility: visible; opacity: 1; translate: 0 0; transition: translate var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)), visibility 0s; }
  .ui-as-app[data-panel="open"] > .ui-as-scrim { visibility: visible; opacity: 1; transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), visibility 0s; }
  .ui-as-app > .ui-as-panel-open { right: calc(var(--tc-app-shell-frame-gap) + 9px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); }
  .ui-as-app > .ui-as-panel-open:hover { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
  /* With the header: the page's part spans the bar; the sidebar's and work area's parts go into their drawers */
  .ui-as-app[data-header] > .ui-as-main { grid-area: 2 / 1 / 3 / -1; }
  .ui-as-app[data-header] > .ui-as-bar--main { grid-area: 1 / 1 / 2 / -1; padding-left: 50px; }
  .ui-as-app[data-header][data-panel] > .ui-as-bar--main { padding-right: 50px; }
  .ui-as-app[data-header] > :is(.ui-as-bar--side, .ui-as-bar--panel) { display: none; }
  /* The drawers cover the full height, over the bar too – not just their grid row */
  .ui-as-app[data-header] > :is(.ui-as-side, .ui-as-panel) { grid-area: auto; }
  .ui-as-app[data-header] > .ui-as-side .ui-as-side__tools { display: flex; }
  .ui-as-app[data-header] > .ui-as-panel > .ui-as-panel__head { display: flex; }
  .ui-as-app[data-header] > .ui-as-panel > .ui-as-panel__body { padding-top: 12px; }
  .ui-as-app > .ui-as-scrim {
    display: block;
    position: absolute;
    z-index: var(--tc-z-drawer-scrim, 40);
    inset: 0;
    background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6)));
    visibility: hidden;
    opacity: 0;
    transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), visibility 0s var(--tc-duration-slow, 320ms);
  }
  .ui-as-app[data-drawer] > .ui-as-scrim { visibility: visible; opacity: 1; transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), visibility 0s; }
  /* The icon to open it always waits in the top left corner of the panel */
  .ui-as-app:not([data-drawer]) > .ui-as-side-open {
    visibility: visible;
    opacity: 1;
    transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) var(--tc-duration-fast, 150ms), visibility 0s;
  }
  /* It stays put while the panel scrolls, so it gets the panel's color behind it */
  .ui-as-app > .ui-as-side-open { left: calc(var(--tc-app-shell-frame-gap) + 9px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); }
  .ui-as-app > .ui-as-side-open:hover { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }

  /* Page parts: less padding, toolbars wrap */
  .ui-as-page { padding: 46px 24px 48px; }
  /* File cards fill the cells of the grids the screens switch to */
  .ui-as-main .ui-as-file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  .ui-as-main .ui-as-file-grid .ui-as-template { width: 100%; }
  .ui-as-main .ui-as-file-grid .ui-as-template__name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .ui-as-main .ui-as-file-grid .ui-as-meta { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .ui-as-main .ui-as-file-grid .ui-as-meta svg { display: inline-block; vertical-align: -2px; }
  .ui-as-section-head[data-inline] { flex-wrap: wrap; row-gap: 12px; }
}

@container ui-as (max-width: 600px) {
  .ui-as-app > * { --tc-app-shell-frame-gap: 6px; }
  .ui-as-page { padding: 52px 16px 40px; }
  .ui-as-section-head { margin-top: 32px; }
  /* Toolbars: tabs on their own line, the tools below; search takes what is left */
  .ui-as-toolbar__left, .ui-as-toolbar__right { width: 100%; }
  .ui-as-toolbar__right .ui-as-search { order: 9; flex: 1 1 100%; }
  .ui-as-toolbar__right > :last-child:not(.ui-as-search) { margin-left: auto; }
  .ui-as-tabs { overflow-x: auto; scrollbar-width: none; }
  .ui-as-empty { padding: 36px 18px 40px; }
  .ui-as-main .ui-as-file-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 10px; }
  .ui-as-main .ui-as-file-grid .ui-as-template__preview { height: 128px; }
}
`;
