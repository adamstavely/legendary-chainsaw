"use client";

/*
 * Design System Illustrations – a design system's illustration library (Meridian, a research institute's), in a
 * single file. Tabs by folder, a search and a grid/list toggle over Preview Cards of the spot illustrations; opening
 * one copies its import. The Untagged tab has nothing in it and shows Soup Cans; a search that matches nothing shows
 * Nothing Found.
 * Sits in the Trenchcoat App Shell. The tab and the view are controllable: `tab`/`defaultTab`/`onTabChange`,
 * `view`/`defaultView`/`onViewChange`.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Preview Card, Soup Cans and Nothing Found from
 * `@adamstavely/trenchcoat/react`; spot illustrations from `@adamstavely/trenchcoat/illustrations/spot` (your bundler's asset handling); icons
 * from lucide-react 1.55.0.
 */

import { useCallback, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import { BoxesIcon, CompassIcon, GitPullRequestArrowIcon, ImageIcon, LayersIcon, MessageCircleIcon, PaletteIcon, RocketIcon, TagIcon } from "lucide-react";
import { NothingFound, PreviewCard, SoupCans } from "@adamstavely/trenchcoat/react";
import { AppShell, SearchField, SectionHead, Tabs, ViewToggle, useToast, type AppShellProps, type ShellGroup, type ShellNavItem, type ViewMode } from "@/components/ui/app-shell";
import colors from "@adamstavely/trenchcoat/illustrations/spot/foundations/colors.svg";
import typography from "@adamstavely/trenchcoat/illustrations/spot/foundations/typography.svg";
import spacing from "@adamstavely/trenchcoat/illustrations/spot/foundations/spacing.svg";
import shadows from "@adamstavely/trenchcoat/illustrations/spot/foundations/shadows.svg";
import tokens from "@adamstavely/trenchcoat/illustrations/spot/foundations/tokens.svg";
import iconLibrary from "@adamstavely/trenchcoat/illustrations/spot/foundations/icon-library.svg";
import emptyLoading from "@adamstavely/trenchcoat/illustrations/spot/patterns/empty-loading-states.svg";
import errorHandling from "@adamstavely/trenchcoat/illustrations/spot/patterns/error-handling.svg";
import dataVisualization from "@adamstavely/trenchcoat/illustrations/spot/patterns/data-visualization.svg";
import aiThinking from "@adamstavely/trenchcoat/illustrations/spot/patterns/ai-thinking-states.svg";
import colorContrast from "@adamstavely/trenchcoat/illustrations/spot/guidelines/color-contrast.svg";
import focus from "@adamstavely/trenchcoat/illustrations/spot/guidelines/focus.svg";
import keyboardGestures from "@adamstavely/trenchcoat/illustrations/spot/guidelines/keyboard-gestures.svg";
import informationArchitecture from "@adamstavely/trenchcoat/illustrations/spot/guidelines/information-architecture.svg";
import journeyMaps from "@adamstavely/trenchcoat/illustrations/spot/research/journey-maps.svg";
import usability from "@adamstavely/trenchcoat/illustrations/spot/research/usability.svg";
import researchMethods from "@adamstavely/trenchcoat/illustrations/spot/research/research-methods.svg";
import conductingInterviews from "@adamstavely/trenchcoat/illustrations/spot/research/conducting-interviews.svg";
import fittsLaw from "@adamstavely/trenchcoat/illustrations/spot/laws/fitts-law.svg";
import hicksLaw from "@adamstavely/trenchcoat/illustrations/spot/laws/hicks-law.svg";
import millersLaw from "@adamstavely/trenchcoat/illustrations/spot/laws/millers-law.svg";
import jakobsLaw from "@adamstavely/trenchcoat/illustrations/spot/laws/jakobs-law.svg";

/** The design system's menu – shared by its screens */
const nav: ShellNavItem[] = [
  { label: "Overview", icon: CompassIcon },
  { label: "Foundations", icon: PaletteIcon },
  { label: "Components", icon: BoxesIcon, count: 64 },
  { label: "Patterns", icon: LayersIcon },
  { label: "Illustrations", icon: ImageIcon },
  { label: "Releases", icon: TagIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Guides",
    items: [
      { label: "Getting started", icon: RocketIcon },
      { label: "Contribute", icon: GitPullRequestArrowIcon },
      { label: "Get in touch", icon: MessageCircleIcon },
    ],
  },
];

type Folder = "Foundations" | "Patterns" | "Guidelines" | "Research" | "Laws";
type Spot = { name: string; slug: string; folder: Folder; use: string; src: string };

/** Sample content – the folder's name, then each illustration with what it's for */
const SPOTS: Spot[] = [
  { name: "Colours", slug: "foundations/colors", folder: "Foundations", use: "Colour palette and tokens pages", src: colors },
  { name: "Typography", slug: "foundations/typography", folder: "Foundations", use: "Type scale and font guidance", src: typography },
  { name: "Spacing", slug: "foundations/spacing", folder: "Foundations", use: "Space scale and layout rhythm", src: spacing },
  { name: "Shadows", slug: "foundations/shadows", folder: "Foundations", use: "Elevation and depth", src: shadows },
  { name: "Tokens", slug: "foundations/tokens", folder: "Foundations", use: "Design tokens overview", src: tokens },
  { name: "Icon library", slug: "foundations/icon-library", folder: "Foundations", use: "Browsing and requesting icons", src: iconLibrary },
  { name: "Empty and loading states", slug: "patterns/empty-loading-states", folder: "Patterns", use: "Placeholders while data loads or is missing", src: emptyLoading },
  { name: "Error handling", slug: "patterns/error-handling", folder: "Patterns", use: "Errors people can recover from", src: errorHandling },
  { name: "Data visualization", slug: "patterns/data-visualization", folder: "Patterns", use: "Charts and their conventions", src: dataVisualization },
  { name: "AI thinking states", slug: "patterns/ai-thinking-states", folder: "Patterns", use: "Showing a model at work", src: aiThinking },
  { name: "Colour contrast", slug: "guidelines/color-contrast", folder: "Guidelines", use: "Contrast ratios and checks", src: colorContrast },
  { name: "Focus", slug: "guidelines/focus", folder: "Guidelines", use: "Visible focus and its order", src: focus },
  { name: "Keyboard and gestures", slug: "guidelines/keyboard-gestures", folder: "Guidelines", use: "Keys and touch alternatives", src: keyboardGestures },
  { name: "Information architecture", slug: "guidelines/information-architecture", folder: "Guidelines", use: "Structuring content and menus", src: informationArchitecture },
  { name: "Journey maps", slug: "research/journey-maps", folder: "Research", use: "Mapping a person's steps", src: journeyMaps },
  { name: "Usability", slug: "research/usability", folder: "Research", use: "Usability testing guides", src: usability },
  { name: "Research methods", slug: "research/research-methods", folder: "Research", use: "Choosing a method", src: researchMethods },
  { name: "Conducting interviews", slug: "research/conducting-interviews", folder: "Research", use: "Interview guides and consent", src: conductingInterviews },
  { name: "Fitts's law", slug: "laws/fitts-law", folder: "Laws", use: "Target size and distance", src: fittsLaw },
  { name: "Hick's law", slug: "laws/hicks-law", folder: "Laws", use: "Number of choices and decision time", src: hicksLaw },
  { name: "Miller's law", slug: "laws/millers-law", folder: "Laws", use: "Chunking what people hold in mind", src: millersLaw },
  { name: "Jakob's law", slug: "laws/jakobs-law", folder: "Laws", use: "Familiar conventions", src: jakobsLaw },
];

const TABS = ["All", "Foundations", "Patterns", "Guidelines", "Research", "Laws", "Untagged"];

type DesignSystemIllustrationsOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** The open tab – "All", a folder, or "Untagged". Controlled when given; use `defaultTab` for a starting tab */
  tab?: string;
  /** Tab shown first when `tab` isn't controlled */
  defaultTab?: string;
  /** Called when a tab is picked */
  onTabChange?: (tab: string) => void;
  /** Illustrations as a grid or a list – controlled; use `defaultView` for a starting layout */
  view?: ViewMode;
  /** Layout shown first when `view` isn't controlled */
  defaultView?: ViewMode;
  /** Called when the grid/list toggle is used */
  onViewChange?: (view: ViewMode) => void;
  /** Called with an illustration's path ("laws/fitts-law") when it's opened; by default its import is copied */
  onOpen?: (path: string) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type DesignSystemIllustrationsScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof DesignSystemIllustrationsOwnProps | "children"> &
  DesignSystemIllustrationsOwnProps & { ref?: Ref<HTMLDivElement> };

export function DesignSystemIllustrationsScreen({
  tab: tabProp,
  defaultTab = "All",
  onTabChange,
  view: viewProp,
  defaultView = "grid",
  onViewChange,
  onOpen,
  onNavigate,
  workspace = "Meridian",
  user = { name: "Sam Reyes" },
  ref,
  ...rest
}: DesignSystemIllustrationsScreenProps) {
  const [tab, setTab] = useControllable(tabProp, defaultTab, onTabChange, "tab");
  const [view, setView] = useControllable(viewProp, defaultView, onViewChange, "view");
  const [query, setQuery] = useState("");
  const [toast, showToast] = useToast();
  const q = query.trim().toLowerCase();
  // Every illustration here has a folder and tags, so Untagged is empty
  const inTab = tab === "Untagged" ? [] : SPOTS.filter((s) => tab === "All" || s.folder === tab);
  const shown = inTab.filter((s) => !q || `${s.name} ${s.use} ${s.slug}`.toLowerCase().includes(q));

  const open = (s: Spot) => {
    if (onOpen) return onOpen(s.slug);
    const line = `import url from "@adamstavely/trenchcoat/illustrations/spot/${s.slug}.svg";`;
    if (!navigator.clipboard) return showToast(line);
    navigator.clipboard.writeText(line).then(
      () => showToast(`Copied the import for ${s.name}`),
      () => showToast(line),
    );
  };

  return (
    <AppShell {...rest} ref={ref} active="Illustrations" nav={nav} groups={groups} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-screen-ds-illustrations" precedence="default">
        {css}
      </style>
      <div className="ui-as-page">
        <h1 className="ui-as-page-title">Illustrations</h1>
        <p className="ui-as-page-sub">
          Spot illustrations in one soft style, for page headers, cards, empty states and docs. Each is one SVG that follows light and dark. Open one to copy its import.
        </p>

        <SectionHead
          title="Library"
          left={<Tabs items={TABS} value={tab} onChange={setTab} label="Folders" />}
          right={
            <>
              <ViewToggle value={view} onChange={setView} />
              <SearchField placeholder="Search illustrations..." width={200} value={query} onChange={setQuery} />
            </>
          }
        />
        <p className="ui-dsi-count" aria-live="polite">
          {tab === "Untagged" ? "" : `${shown.length} ${shown.length === 1 ? "illustration" : "illustrations"}`}
        </p>
        {shown.length ? (
          <ul className="ui-dsi-grid" data-view={view} key={`${tab}|${view}|${q}`}>
            {shown.map((s, i) => (
              <li key={s.slug} className="ui-as-rise" style={{ "--i": Math.min(i, 12) } as CSSProperties}>
                <PreviewCard
                  title={s.name}
                  description={s.use}
                  src={s.src}
                  alt=""
                  fit="contain"
                  badge={s.folder}
                  orientation={view === "list" ? "horizontal" : "vertical"}
                  onTcOpen={() => open(s)}
                />
              </li>
            ))}
          </ul>
        ) : tab === "Untagged" ? (
          <div className="ui-dsi-empty ui-as-rise">
            <div className="ui-dsi-empty__art">
              <SoupCans caption="Nothing untagged" />
            </div>
            <p>Every illustration has a folder and tags. New ones without them land here.</p>
          </div>
        ) : (
          <div className="ui-dsi-empty ui-as-rise">
            <div className="ui-dsi-empty__art">
              <NothingFound />
            </div>
            <p>Nothing matches “{query.trim()}”. Try other words, or another folder.</p>
          </div>
        )}
      </div>
      {toast}
    </AppShell>
  );
}

/* ---------- Helpers (inlined so the file stays self-contained) ---------- */

/**
 * State that a parent may control (Trenchcoat's useControllable). `value` defined → controlled: the screen shows it
 * and asks for changes through `onChange`. `value` undefined → uncontrolled: kept here, starting at `defaultValue`,
 * and changes are still reported.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

.ui-dsi-count { min-height: var(--tc-line-height-normal, 20px); margin: var(--tc-space-3, 12px) 0 0; font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-3, 12px); margin: var(--tc-space-2, 8px) 0 0; padding: 0; list-style: none; }
.ui-dsi-grid[data-view="list"] { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2, 8px); }
.ui-dsi-empty { display: grid; justify-items: center; gap: var(--tc-space-2, 8px); margin-top: var(--tc-space-6, 24px); text-align: center; }
.ui-dsi-empty__art { width: min(100%, 280px); }
.ui-dsi-empty p { max-width: 360px; margin: 0; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }

/* Narrow panels: 4 → 3 → 2 → 1 per row */
@container ui-as-main (max-width: 960px) {
  .ui-dsi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@container ui-as-main (max-width: 720px) {
  .ui-dsi-grid, .ui-dsi-grid[data-view="list"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-dsi-grid[data-view="list"] { grid-template-columns: minmax(0, 1fr); }
}
@container ui-as-main (max-width: 460px) {
  .ui-dsi-grid { grid-template-columns: minmax(0, 1fr); }
}
`;
