"use client";

/*
 * Design System Releases – where Meridian's components, docs and assets stand on their way out, in a single file.
 * Meridian is the Halden Institute's design system. Six stages run left to right – awaiting review, in translation,
 * in quality control, in coordination, pending release and released – each with how many items it holds; pick one
 * (click, or the arrow keys) for its illustration, what the stage means and the items in it. A stage with nothing in
 * it lets its illustration be the empty state.
 * Sits in the Trenchcoat App Shell.
 * Imports: App Shell (AppShell, Icon) from Trenchcoat screens; Awaiting Review, In Translation, In Quality Control,
 * In Coordination, Pending Release, Released and Data Table from `@adamstavely/trenchcoat/react`; icons from lucide-react 1.55.0.
 */

import { useCallback, useId, useRef, useState, type ComponentPropsWithoutRef, type ComponentType, type KeyboardEvent, type Ref } from "react";
import { ChevronRightIcon, ComponentIcon, GitBranchIcon, HouseIcon, ImageIcon, LayersIcon, PaletteIcon, RocketIcon, TagIcon } from "lucide-react";
import {
  AwaitingReview,
  DataTable,
  InCoordination,
  InQualityControl,
  InTranslation,
  PendingRelease,
  Released,
  type DataColumn,
  type DataRow,
  type TagTone,
} from "@adamstavely/trenchcoat/react";
import { AppShell, Icon, type AppShellProps, type ShellNavItem, type ShellGroup } from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
const groups: ShellGroup[] = [
  {
    label: "Versions",
    items: [
      { label: "4.6 · in progress", icon: GitBranchIcon, count: 10 },
      { label: "4.5", icon: TagIcon },
      { label: "4.4", icon: TagIcon },
    ],
  },
];

const nav: ShellNavItem[] = [
  { label: "Overview", icon: HouseIcon },
  { label: "Foundations", icon: PaletteIcon },
  { label: "Components", icon: ComponentIcon },
  { label: "Patterns", icon: LayersIcon },
  { label: "Illustrations", icon: ImageIcon },
  { label: "Releases", icon: RocketIcon, count: 4 },
];

export type ReleaseStage = "Awaiting review" | "In translation" | "In quality control" | "In coordination" | "Pending release" | "Released";

const STAGES: { id: ReleaseStage; Art: ComponentType<{ caption?: string }>; about: string }[] = [
  { id: "Awaiting review", Art: AwaitingReview, about: "Sent in and waiting for a design system editor to approve it – usually within two working days." },
  { id: "In translation", Art: InTranslation, about: "Approved, and being translated into French and German so every version goes out together." },
  { id: "In quality control", Art: InQualityControl, about: "A second reviewer checks accessibility, tokens and the docs against the release checklist." },
  { id: "In coordination", Art: InCoordination, about: "Waiting on the teams that use it to agree a date, when a change affects their pages." },
  { id: "Pending release", Art: PendingRelease, about: "Ready, and scheduled for the next release – Thursday's 4.6 – where it can still be pulled." },
  { id: "Released", Art: Released, about: "Out in Meridian 4.5 and live on the docs site, in all three languages." },
];

type Item = { id: string; name: string; kind: string; owner: string; version: string; updated: string; stage: ReleaseStage };

const ITEMS: Item[] = [
  { id: "1", name: "Date range picker", kind: "Component", owner: "Ines Barros", version: "1.0.0", updated: "Today", stage: "Awaiting review" },
  { id: "2", name: "Writing for errors", kind: "Docs", owner: "Tomás Ferreira", version: "–", updated: "Yesterday", stage: "Awaiting review" },
  { id: "3", name: "Empty states", kind: "Pattern", owner: "Mei Tanaka", version: "2.1.0", updated: "Nov 3", stage: "Awaiting review" },
  { id: "4", name: "Data table", kind: "Component", owner: "Robin Achterberg", version: "3.4.0", updated: "Nov 4", stage: "In translation" },
  { id: "5", name: "Getting started", kind: "Docs", owner: "Amara Osei", version: "–", updated: "Nov 2", stage: "In translation" },
  { id: "6", name: "Dialog", kind: "Component", owner: "Jonas Lind", version: "2.0.0", updated: "Nov 4", stage: "In quality control" },
  { id: "7", name: "Spot illustrations", kind: "Illustration", owner: "Mei Tanaka", version: "1.2.0", updated: "Nov 1", stage: "In quality control" },
  { id: "8", name: "Colour tokens", kind: "Foundation", owner: "Ines Barros", version: "4.0.0", updated: "Oct 30", stage: "In quality control" },
  { id: "9", name: "Text field", kind: "Component", owner: "Jonas Lind", version: "3.1.0", updated: "Oct 29", stage: "Pending release" },
  { id: "10", name: "Breakpoints", kind: "Foundation", owner: "Robin Achterberg", version: "1.3.0", updated: "Oct 28", stage: "Pending release" },
  { id: "11", name: "Button", kind: "Component", owner: "Jonas Lind", version: "3.2.0", updated: "Oct 21", stage: "Released" },
  { id: "12", name: "Switch", kind: "Component", owner: "Amara Osei", version: "2.2.0", updated: "Oct 21", stage: "Released" },
  { id: "13", name: "Accessibility statement", kind: "Docs", owner: "Tomás Ferreira", version: "–", updated: "Oct 21", stage: "Released" },
  { id: "14", name: "Release status illustrations", kind: "Illustration", owner: "Mei Tanaka", version: "1.0.0", updated: "Oct 21", stage: "Released" },
];

const columns: DataColumn[] = [
  { key: "name", label: "Item", type: "title", width: "240px", editable: false },
  { key: "kind", label: "Kind", type: "tag", width: "130px", editable: false },
  { key: "owner", label: "Owner", type: "text", width: "170px", editable: false },
  { key: "version", label: "Version", type: "text", width: "100px", editable: false },
  { key: "updated", label: "Updated", type: "text", width: "120px", editable: false },
];
const tones: Record<string, TagTone> = { Component: "blue", Docs: "violet", Pattern: "pink", Illustration: "amber", Foundation: "green" };

type DesignSystemReleasesOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Stage shown – controlled; use `defaultStage` for a starting stage */
  stage?: ReleaseStage;
  /** Stage shown first when `stage` isn't controlled */
  defaultStage?: ReleaseStage;
  /** Called when another stage is picked */
  onStageChange?: (stage: ReleaseStage) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type DesignSystemReleasesScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof DesignSystemReleasesOwnProps | "children"> &
  DesignSystemReleasesOwnProps & { ref?: Ref<HTMLDivElement> };

export function DesignSystemReleasesScreen({
  stage: stageProp,
  defaultStage = "In quality control",
  onStageChange,
  onNavigate,
  workspace = "Meridian",
  user = { name: "Sam Reyes" },
  ref,
  ...rest
}: DesignSystemReleasesScreenProps) {
  const [stage, setStage] = useControllable(stageProp, defaultStage, onStageChange, "stage");
  const list = useRef<HTMLDivElement>(null);
  const uid = useId();
  const current = STAGES.find((s) => s.id === stage) ?? STAGES[0];
  const items = ITEMS.filter((i) => i.stage === current.id);
  const count = (id: ReleaseStage) => ITEMS.filter((i) => i.stage === id).length;
  const inFlight = ITEMS.filter((i) => i.stage !== "Released").length;

  // A tablist: the arrow keys, Home and End move between stages
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = STAGES.findIndex((s) => s.id === current.id);
    const next = { ArrowRight: (i + 1) % STAGES.length, ArrowLeft: (i - 1 + STAGES.length) % STAGES.length, Home: 0, End: STAGES.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setStage(STAGES[next].id);
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  const Art = current.Art;
  return (
    <AppShell {...rest} ref={ref} active="Releases" nav={nav} groups={groups} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-ds-releases" precedence="default">
        {css}
      </style>
      <div className="ui-dsr">
        <h1 className="ui-as-page-title">Releases</h1>
        <p className="ui-as-page-sub">
          {inFlight} items on their way into Meridian 4.6, and what went out in 4.5. Pick a stage to see what's in it.
        </p>

        <div ref={list} className="ui-dsr__stages" role="tablist" aria-label="Release stages" onKeyDown={onKey}>
          {STAGES.map((s, i) => {
            const on = s.id === current.id;
            return (
              <div key={s.id} className="ui-dsr__step">
                {i > 0 && (
                  <span className="ui-dsr__arrow" aria-hidden="true">
                    <Icon icon={ChevronRightIcon} size={14} />
                  </span>
                )}
                <button
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${i}`}
                  aria-selected={on}
                  aria-controls={`${uid}-panel`}
                  tabIndex={on ? 0 : -1}
                  className="ui-dsr__stage"
                  onClick={() => setStage(s.id)}
                >
                  <span className="ui-dsr__count">{count(s.id)}</span>
                  <span className="ui-dsr__stage-name">{s.id}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div
          key={current.id}
          id={`${uid}-panel`}
          className="ui-dsr__panel ui-as-rise"
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${STAGES.indexOf(current)}`}
          data-empty={items.length === 0 || undefined}
        >
          <div className="ui-dsr__intro">
            <div className="ui-dsr__art">
              <Art caption="" />
            </div>
            <div className="ui-dsr__about">
              <h2 className="ui-dsr__h2">{current.id}</h2>
              <p>{current.about}</p>
              <p className="ui-dsr__sum">{items.length ? `${items.length} ${items.length === 1 ? "item" : "items"} at this stage` : "Nothing at this stage right now."}</p>
            </div>
          </div>
          {items.length > 0 && <DataTable key={current.id} title={`${current.id} · ${items.length}`} columns={columns} defaultRows={items.map(toRow)} tagTones={tones} editable={false} selectable={false} />}
        </div>
      </div>
    </AppShell>
  );
}

const toRow = (i: Item): DataRow => ({ id: i.id, name: i.name, kind: i.kind, owner: i.owner, version: i.version, updated: i.updated });

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

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

/* Design System Releases – a centered column on the panel */
.ui-dsr {
  width: min(1100px, calc(100% - 64px));
  margin: 0 auto;
  padding: var(--tc-space-10, 40px) 0 var(--tc-space-16, 64px);
}

/* The stages, left to right */
.ui-dsr__stages { display: flex; align-items: stretch; gap: 0; margin-top: var(--tc-space-6, 24px); overflow-x: auto; padding: var(--tc-space-1, 4px); }
.ui-dsr__step { display: flex; flex: 1 1 0; align-items: center; min-width: 0; }
.ui-dsr__arrow { display: grid; place-items: center; flex: none; width: 20px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsr__stage {
  display: grid;
  flex: 1;
  gap: var(--tc-space-0-5, 2px);
  min-width: 104px;
  margin: 0;
  padding: var(--tc-space-3, 12px);
  border: 0;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font: inherit;
  text-align: left;
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  cursor: pointer;
}
.ui-dsr__stage:hover { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); }
.ui-dsr__stage:focus-visible { outline: 2px solid var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff)); outline-offset: 2px; }
.ui-dsr__stage[aria-selected="true"] { box-shadow: inset 0 0 0 2px var(--tc-text-primary, light-dark(#171717, #ededed)); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsr__count { font-size: var(--tc-font-size-2xl, 20px); font-weight: var(--tc-font-weight-strong, 600); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }
.ui-dsr__stage-name { font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); }

/* The chosen stage */
.ui-dsr__panel { display: grid; gap: var(--tc-space-5, 20px); margin-top: var(--tc-space-6, 24px); }
.ui-dsr__intro { display: grid; grid-template-columns: minmax(0, 300px) minmax(0, 1fr); align-items: center; gap: var(--tc-space-6, 24px); }
.ui-dsr__panel[data-empty] .ui-dsr__intro { grid-template-columns: minmax(0, 1fr); justify-items: center; text-align: center; padding: var(--tc-space-6, 24px) 0; }
.ui-dsr__art { width: 100%; max-width: 300px; }
.ui-dsr__about { display: grid; gap: var(--tc-space-2, 8px); max-width: 520px; }
.ui-dsr__h2 { margin: 0; font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-strong, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsr__about p { margin: 0; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-relaxed, 22px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-dsr__about .ui-dsr__sum { font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

@media (max-width: 860px) {
  .ui-dsr { width: calc(100% - 32px); padding-top: var(--tc-space-6, 24px); }
  .ui-dsr__intro { grid-template-columns: minmax(0, 1fr); justify-items: center; text-align: center; }
}
`;
