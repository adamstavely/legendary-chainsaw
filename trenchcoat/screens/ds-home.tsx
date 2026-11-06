"use client";

/*
 * Design System Home – the landing page of a design system (Meridian, a research institute's), in a single file.
 * A hero with the system's name, what it's for, a search and the compass rose; the four sections as collection
 * cards with spot illustrations; what's new; and quick links to getting started, contributing and getting in touch.
 * Sits in the Trenchcoat App Shell. Searching calls `onSearch`; a section card or quick link calls `onNavigate`.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Collection Card and Preview Card from
 * `trenchcoat/react`; spot illustrations from `trenchcoat/illustrations/spot` (your bundler's asset handling); icons
 * from lucide-react 1.55.0.
 */

import { useId, useState, type ComponentPropsWithoutRef, type CSSProperties, type FormEvent, type Ref } from "react";
import {
  BookOpenIcon,
  BoxesIcon,
  CompassIcon,
  GitPullRequestArrowIcon,
  ImageIcon,
  LayersIcon,
  MessageCircleIcon,
  PaletteIcon,
  RocketIcon,
  TagIcon,
} from "lucide-react";
import { CollectionCard, PreviewCard } from "trenchcoat/react";
import { AppShell, SearchField, SectionHead, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";
import compassRose from "trenchcoat/illustrations/spot/site/compass-rose.svg";
import colors from "trenchcoat/illustrations/spot/foundations/colors.svg";
import typography from "trenchcoat/illustrations/spot/foundations/typography.svg";
import spacing from "trenchcoat/illustrations/spot/foundations/spacing.svg";
import componentButton from "trenchcoat/illustrations/spot/foundations/component-button.svg";
import componentComposition from "trenchcoat/illustrations/spot/foundations/component-composition.svg";
import componentTesting from "trenchcoat/illustrations/spot/foundations/component-testing.svg";
import patternOverview from "trenchcoat/illustrations/spot/patterns/pattern-overview.svg";
import emptyLoading from "trenchcoat/illustrations/spot/patterns/empty-loading-states.svg";
import errorHandling from "trenchcoat/illustrations/spot/patterns/error-handling.svg";
import iconLibrary from "trenchcoat/illustrations/spot/foundations/icon-library.svg";
import illustrations from "trenchcoat/illustrations/spot/foundations/illustrations.svg";
import designAssets from "trenchcoat/illustrations/spot/foundations/design-assets.svg";
import gettingStarted from "trenchcoat/illustrations/spot/site/getting-started.svg";
import contribute from "trenchcoat/illustrations/spot/site/contribute.svg";
import getInTouch from "trenchcoat/illustrations/spot/site/get-in-touch.svg";

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

/** Sample content – replace with your own */
const SECTIONS = [
  {
    title: "Foundations",
    subtitle: "Colour, type, space and motion",
    description: "The tokens every component is built from, and the rules for using them.",
    previews: [colors, typography, spacing],
    items: ["Colour", "Typography", "Spacing", "Elevation", "Motion", "Iconography", "Tokens"],
    count: 7,
  },
  {
    title: "Components",
    subtitle: "Accessible, tested and themed",
    description: "Building blocks for the institute's tools, each with its usage, accessibility notes and code.",
    previews: [componentButton, componentComposition, componentTesting],
    items: ["Button", "Data Table", "Date Picker", "Dialog", "Facet Sidebar", "Search", "Tabs", "Toast"],
    count: 64,
  },
  {
    title: "Patterns",
    subtitle: "How the pieces fit together",
    description: "Recurring problems solved once: forms, empty and loading states, errors, navigation.",
    previews: [patternOverview, emptyLoading, errorHandling],
    items: ["Empty states", "Errors", "Forms", "Navigation", "Notifications", "Onboarding"],
    count: 18,
  },
  {
    title: "Illustrations",
    subtitle: "Spots, states and icons",
    description: "Drawings in one soft style for page headers, empty states and docs, light and dark.",
    previews: [illustrations, iconLibrary, designAssets],
    items: ["Spot illustrations", "State illustrations", "Icons", "Logos"],
    count: 224,
  },
];

const NEWS = [
  { date: "4 Nov", title: "Breakpoint Overlay", text: "See which breakpoint a page is at while you resize it.", tag: "Component" },
  { date: "3 Nov", title: "Workflow stage illustrations", text: "In translation, quality control, coordination, pending release and released.", tag: "Illustration" },
  { date: "28 Oct", title: "Message Status", text: "Read receipts and message actions for chat surfaces.", tag: "Component" },
  { date: "21 Oct", title: "Token naming, version 4", text: "Clearer names for surface and text tokens; the old names still work until 5.0.", tag: "Foundations" },
];

const LINKS = [
  { title: "Getting started", description: "Install the package, add the tokens and use your first component.", src: gettingStarted },
  { title: "Contribute", description: "Propose a component or a change, and see what's in review.", src: contribute },
  { title: "Get in touch", description: "Ask the design system team, or join the fortnightly office hours.", src: getInTouch },
];

type DesignSystemHomeOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Called with the search words when the search is sent */
  onSearch?: (query: string) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type DesignSystemHomeScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof DesignSystemHomeOwnProps | "children"> &
  DesignSystemHomeOwnProps & { ref?: Ref<HTMLDivElement> };

export function DesignSystemHomeScreen({ onSearch, onNavigate, workspace = "Meridian", user = { name: "Sam Reyes" }, ref, ...rest }: DesignSystemHomeScreenProps) {
  const [query, setQuery] = useState("");
  const uid = useId();
  const ids = { title: `${uid}-title`, news: `${uid}-news`, links: `${uid}-links` };
  const search = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch?.(query.trim());
  };
  return (
    <AppShell {...rest} ref={ref} active="Overview" nav={nav} groups={groups} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-screen-ds-home" precedence="default">
        {css}
      </style>
      <div className="ui-as-page">
        <section className="ui-dsh-hero ui-as-rise" aria-labelledby={ids.title}>
          <div className="ui-dsh-hero__text">
            <p className="ui-dsh-eyebrow">Halden Institute</p>
            <h1 className="ui-as-page-title" id={ids.title}>
              Meridian Design System
            </h1>
            <p className="ui-as-page-sub">One set of foundations, components and patterns, so every tool the institute builds feels like the same place.</p>
            <form className="ui-dsh-search" role="search" onSubmit={search}>
              <SearchField placeholder="Search components, tokens and guides" width={340} value={query} onChange={setQuery} />
            </form>
            <p className="ui-dsh-facts">
              <span>Version 4.2</span>
              <span>64 components</span>
              <span>224 illustrations</span>
              <span>WCAG 2.2 AA</span>
            </p>
          </div>
          <img className="ui-dsh-hero__art" src={compassRose} alt="" width={200} height={200} />
        </section>

        <SectionHead title="Explore" />
        <div className="ui-dsh-sections">
          {SECTIONS.map((s, i) => (
            <div key={s.title} className="ui-as-rise" style={{ "--i": i } as CSSProperties}>
              <CollectionCard
                title={s.title}
                subtitle={s.subtitle}
                description={s.description}
                previews={s.previews.map((src) => ({ src, alt: "" }))}
                items={s.items}
                count={s.count}
                onTcOpen={() => onNavigate?.(s.title)}
              />
            </div>
          ))}
        </div>

        <div className="ui-dsh-lower">
          <section aria-labelledby={ids.news}>
            <h2 className="ui-as-section-head__title" id={ids.news}>
              What's new
            </h2>
            <ol className="ui-dsh-news">
              {NEWS.map((n) => (
                <li key={n.title} className="ui-dsh-news__item">
                  <time className="ui-dsh-news__date">{n.date}</time>
                  <div className="ui-dsh-news__body">
                    <b>{n.title}</b>
                    <span>{n.text}</span>
                  </div>
                  <span className="ui-dsh-news__tag">{n.tag}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="ui-dsh-more" onClick={() => onNavigate?.("Releases")}>
              <BookOpenIcon size={14} strokeWidth={1.9} aria-hidden />
              All release notes
            </button>
          </section>
          <section aria-labelledby={ids.links}>
            <h2 className="ui-as-section-head__title" id={ids.links}>
              Quick links
            </h2>
            <div className="ui-dsh-links">
              {LINKS.map((l) => (
                <PreviewCard key={l.title} title={l.title} description={l.description} src={l.src} alt="" fit="contain" orientation="horizontal" onTcOpen={() => onNavigate?.(l.title)} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

.ui-dsh-hero {
  display: flex;
  align-items: center;
  gap: var(--tc-space-6, 24px);
  padding: var(--tc-space-6, 24px) var(--tc-space-7, 28px);
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-dsh-hero__text { flex: 1; min-width: 0; }
.ui-dsh-hero__art { flex: none; width: 200px; height: 200px; }
.ui-dsh-eyebrow { margin: 0 0 var(--tc-space-1, 4px); font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-dsh-search { margin-top: var(--tc-space-4, 16px); }
.ui-dsh-facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-1, 4px) var(--tc-space-4, 16px); margin: var(--tc-space-4, 16px) 0 0; font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-dsh-sections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-3, 12px); margin-top: var(--tc-space-4, 16px); }

.ui-dsh-lower { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: var(--tc-space-6, 24px); margin-top: var(--tc-space-8, 32px); }
.ui-dsh-lower > section { display: grid; align-content: start; gap: var(--tc-space-3, 12px); }
.ui-dsh-news { display: grid; margin: 0; padding: 0; list-style: none; border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-dsh-news__item { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; align-items: baseline; gap: var(--tc-space-3, 12px); padding: var(--tc-space-3, 12px) var(--tc-space-4, 16px); }
.ui-dsh-news__item + .ui-dsh-news__item { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-dsh-news__date { font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-dsh-news__body { display: grid; gap: var(--tc-space-0-5, 2px); min-width: 0; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-dsh-news__body b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsh-news__tag { padding: 0 var(--tc-space-2, 8px); border-radius: var(--tc-radius-full, 999px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); font-size: var(--tc-font-size-xs, 11px); line-height: var(--tc-pill-h, 20px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); white-space: nowrap; }
.ui-dsh-more { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, 6px); justify-self: start; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); cursor: pointer; }
.ui-dsh-more:hover { text-decoration: underline; text-underline-offset: 3px; }
.ui-dsh-more:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-dsh-links { display: grid; gap: var(--tc-space-2, 8px); }

/* Narrow panels: the art goes, then everything in one column */
@container ui-as-main (max-width: 820px) {
  .ui-dsh-lower { grid-template-columns: minmax(0, 1fr); }
}
@container ui-as-main (max-width: 640px) {
  .ui-dsh-hero__art { display: none; }
  .ui-dsh-sections { grid-template-columns: minmax(0, 1fr); }
}
`;
