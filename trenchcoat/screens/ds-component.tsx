"use client";

/*
 * Design System Component – one component's page in a design system's site, in a single file: the Button of Meridian,
 * the Halden Institute's design system. The name, what it's for, its status and links, then tabs for Overview, Usage,
 * Accessibility and Code. Overview places it in atomic design and shows it live in a frame you can resize, with the
 * Breakpoint Overlay saying which of the frame's breakpoints applies. Usage has the variants and do's and don'ts,
 * Accessibility the principles it serves and a checklist, Code an example and the properties.
 * Sits in the Trenchcoat App Shell.
 * Imports: App Shell (AppShell, Icon, Tabs) from Trenchcoat screens; Accessibility Principles, Atomic Design,
 * Breakpoint Overlay, Button, Code Block and Data Table from `trenchcoat/react`; icons from lucide-react 1.55.0.
 */

import { useCallback, useRef, useState, type ComponentPropsWithoutRef, type Ref } from "react";
import {
  BookOpenIcon,
  BoxIcon,
  CheckIcon,
  CodeIcon,
  ComponentIcon,
  ExternalLinkIcon,
  HouseIcon,
  ImageIcon,
  LayersIcon,
  PaletteIcon,
  PanelTopIcon,
  RocketIcon,
  TableIcon,
  TextCursorInputIcon,
  ToggleLeftIcon,
  XIcon,
} from "lucide-react";
import {
  AccessibilityPrinciples,
  AtomicDesign,
  BreakpointOverlay,
  Button,
  CodeBlock,
  DataTable,
  type BreakpointOverlayBreakpoint,
  type DataColumn,
  type DataRow,
} from "trenchcoat/react";
import { AppShell, Icon, Tabs, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
const nav: ShellNavItem[] = [
  { label: "Overview", icon: HouseIcon },
  { label: "Foundations", icon: PaletteIcon },
  { label: "Components", icon: ComponentIcon },
  { label: "Patterns", icon: LayersIcon },
  { label: "Illustrations", icon: ImageIcon },
  { label: "Releases", icon: RocketIcon, count: 4 },
];
const groups: ShellGroup[] = [
  {
    label: "Actions and inputs",
    items: [
      { label: "Button", icon: BoxIcon },
      { label: "Text field", icon: TextCursorInputIcon },
      { label: "Switch", icon: ToggleLeftIcon },
      { label: "Data table", icon: TableIcon },
      { label: "Dialog", icon: PanelTopIcon },
    ],
  },
];

/** The preview frame's own breakpoints – container widths, not the window's */
const frameBreakpoints: BreakpointOverlayBreakpoint[] = [
  { id: "compact", label: "Compact", max: 479 },
  { id: "regular", label: "Regular", min: 480, max: 719 },
  { id: "wide", label: "Wide", min: 720 },
];

const variants = [
  { variant: "primary" as const, label: "Save changes", when: "The one main action on a page or in a dialog." },
  { variant: "secondary" as const, label: "Cancel", when: "Actions beside the main one, or when none is the main one." },
  { variant: "ghost" as const, label: "Preview", when: "Quiet actions in toolbars, tables and dense places." },
  { variant: "destructive" as const, label: "Delete dataset", when: "Actions that remove or end something – confirm them." },
];

const dos = [
  "Start the label with a verb that says what happens: Save changes, Export report.",
  "Use one primary button per view, placed where the eye ends up.",
  "Keep the label when it's busy, and show the spinner beside it.",
];
const donts = [
  "Don't use a button to go somewhere – that's a link.",
  "Don't disable it without saying why; explain what's missing instead.",
  "Don't put two primary buttons side by side.",
];

const checklist = [
  "A real <button>, so Enter and Space work and it's announced as a button.",
  "Its accessible name contains the visible label – voice control users say what they see.",
  "A visible focus ring at 3:1 against the page, in both themes.",
  "Label text at 4.5:1 against the button in every variant.",
  "A target of at least 24 × 24 px, with space around small buttons.",
  "Busy and done states announced in a polite status line.",
];

const example = `import { Button } from "trenchcoat/react";

export function SaveBar({ saving, onSave, onCancel }) {
  return (
    <div className="save-bar">
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button loading={saving} onClick={onSave}>Save changes</Button>
    </div>
  );
}`;

const propColumns: DataColumn[] = [
  { key: "name", label: "Property", type: "title", width: "150px", editable: false },
  { key: "type", label: "Type", type: "text", width: "220px", editable: false },
  { key: "default", label: "Default", type: "text", width: "110px", editable: false },
  { key: "description", label: "Description", type: "text", width: "320px", editable: false },
];
const propRows: DataRow[] = [
  { id: "variant", name: "variant", type: '"primary" | "secondary" | "ghost" | "destructive"', default: '"primary"', description: "How much it stands out, and whether it removes something" },
  { id: "size", name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Height and padding – md in forms, sm in tables and toolbars" },
  { id: "loading", name: "loading", type: "boolean", default: "false", description: "Busy: a spinner beside the label, and clicks wait" },
  { id: "disabled", name: "disabled", type: "boolean", default: "false", description: "Can't be pressed; say why beside it" },
  { id: "icon", name: "icon", type: "ReactNode", default: "–", description: "An icon before the label" },
];

const TABS = ["Overview", "Usage", "Accessibility", "Code"] as const;
export type DesignSystemComponentTab = (typeof TABS)[number];

type DesignSystemComponentOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Open tab – controlled; use `defaultTab` for a starting tab */
  tab?: DesignSystemComponentTab;
  /** Tab that is open first when `tab` isn't controlled */
  defaultTab?: DesignSystemComponentTab;
  /** Called when another tab is picked */
  onTabChange?: (tab: DesignSystemComponentTab) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type DesignSystemComponentScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof DesignSystemComponentOwnProps | "children"> &
  DesignSystemComponentOwnProps & { ref?: Ref<HTMLDivElement> };

export function DesignSystemComponentScreen({
  tab: tabProp,
  defaultTab = "Overview",
  onTabChange,
  onNavigate,
  workspace = "Meridian",
  user = { name: "Sam Reyes" },
  ref,
  ...rest
}: DesignSystemComponentScreenProps) {
  const [tab, setTab] = useControllable(tabProp, defaultTab, onTabChange, "tab");
  return (
    <AppShell {...rest} ref={ref} active="Components" nav={nav} groups={groups} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-ds-component" precedence="default">
        {css}
      </style>
      <div className="ui-dsc">
        <p className="ui-dsc__crumb">Components · Actions and inputs</p>
        <div className="ui-dsc__title-row">
          <h1 className="ui-as-page-title">Button</h1>
          <span className="ui-dsc__status">
            <Icon icon={CheckIcon} size={12} stroke={2.4} />
            Released
          </span>
          <span className="ui-dsc__version">v3.2.0</span>
        </div>
        <p className="ui-as-page-sub">Starts an action – saving, sending, exporting – in a form, a dialog or a toolbar.</p>
        <div className="ui-dsc__links">
          {[
            { label: "Design file", href: "https://design.example/meridian/button", icon: ImageIcon },
            { label: "Source", href: "https://code.example/meridian/src/button.ts", icon: CodeIcon },
            { label: "Changelog", href: "https://design.example/meridian/changelog#button", icon: BookOpenIcon },
          ].map((l) => (
            <a key={l.label} className="ui-dsc__link" href={l.href} target="_blank" rel="noopener noreferrer">
              <Icon icon={l.icon} size={14} />
              {l.label}
              <Icon icon={ExternalLinkIcon} size={12} />
            </a>
          ))}
        </div>

        <div className="ui-as-toolbar ui-dsc__bar">
          <Tabs items={[...TABS]} value={tab} onChange={(t) => setTab(t as DesignSystemComponentTab)} label="Button documentation" />
        </div>

        <div key={tab} className="ui-dsc__body ui-as-rise">
          {tab === "Overview" && <OverviewTab />}
          {tab === "Usage" && <UsageTab />}
          {tab === "Accessibility" && <AccessibilityTab />}
          {tab === "Code" && <CodeTab />}
        </div>
      </div>
    </AppShell>
  );
}

function OverviewTab() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <section className="ui-dsc__section ui-dsc__split">
        <div className="ui-dsc__card ui-dsc__art">
          <AtomicDesign stage="atoms" />
        </div>
        <div className="ui-dsc__prose">
          <h2 className="ui-dsc__h2">Where it sits</h2>
          <p>
            Button is an atom: the smallest piece that still does something. It's built from the foundations – colour, type, spacing and
            radius tokens – and shows up inside larger pieces:
          </p>
          <ul className="ui-dsc__uses">
            <li>
              <b>Search form</b> <span>molecule</span>
            </li>
            <li>
              <b>Dialog footer</b> <span>organism</span>
            </li>
            <li>
              <b>Settings page</b> <span>template</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="ui-dsc__section">
        <h2 className="ui-dsc__h2">Live preview</h2>
        <p className="ui-dsc__note">Drag the frame's corner: the buttons stack below 480 px, and the overlay says which breakpoint the frame is at.</p>
        <div className="ui-dsc__preview">
          <div ref={setFrame} className="ui-dsc__frame">
            <div className="ui-dsc__mock">
              <b className="ui-dsc__mock-title">Field station 4 – sampling plan</b>
              <span className="ui-dsc__mock-text">Changes are saved for everyone on the study.</span>
              <div className="ui-dsc__actions">
                <Button variant="ghost">Preview</Button>
                <Button variant="secondary">Cancel</Button>
                <Button>Save changes</Button>
              </div>
            </div>
          </div>
          <BreakpointOverlay className="ui-dsc__overlay" floating={false} hotkey={false} target={frame} breakpoints={frameBreakpoints} title="Frame breakpoints" />
        </div>
      </section>
    </>
  );
}

function UsageTab() {
  return (
    <>
      <section className="ui-dsc__section">
        <h2 className="ui-dsc__h2">Variants</h2>
        <ul className="ui-dsc__variants">
          {variants.map((v) => (
            <li key={v.variant} className="ui-dsc__variant">
              <span className="ui-dsc__variant-live">
                <Button variant={v.variant}>{v.label}</Button>
              </span>
              <span className="ui-dsc__variant-name">{v.variant[0].toUpperCase() + v.variant.slice(1)}</span>
              <span className="ui-dsc__variant-when">{v.when}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="ui-dsc__section ui-dsc__pair">
        <div className="ui-dsc__card ui-dsc__guide" data-kind="do">
          <h2 className="ui-dsc__guide-title">
            <Icon icon={CheckIcon} size={14} stroke={2.4} />
            Do
          </h2>
          <ul>
            {dos.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="ui-dsc__card ui-dsc__guide" data-kind="dont">
          <h2 className="ui-dsc__guide-title">
            <Icon icon={XIcon} size={14} stroke={2.4} />
            Don't
          </h2>
          <ul>
            {donts.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function AccessibilityTab() {
  return (
    <section className="ui-dsc__section ui-dsc__split">
      <div className="ui-dsc__card ui-dsc__art">
        <AccessibilityPrinciples />
      </div>
      <div className="ui-dsc__prose">
        <h2 className="ui-dsc__h2">Checklist</h2>
        <p>What Button does for you, and what's still yours to check on the page.</p>
        <ul className="ui-dsc__checks">
          {checklist.map((c) => (
            <li key={c}>
              <span className="ui-dsc__check" aria-hidden="true">
                <Icon icon={CheckIcon} size={12} stroke={2.6} />
              </span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CodeTab() {
  return (
    <>
      <section className="ui-dsc__section">
        <h2 className="ui-dsc__h2">Example</h2>
        <CodeBlock code={example} language="tsx" filename="studies/save-bar.tsx" />
      </section>
      <section className="ui-dsc__section">
        <DataTable title="Properties" icon={<Icon icon={TableIcon} size={16} />} columns={propColumns} defaultRows={propRows} editable={false} selectable={false} />
      </section>
    </>
  );
}

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

/* Design System Component – a centered column on the panel */
.ui-dsc {
  width: min(1040px, calc(100% - 64px));
  margin: 0 auto;
  padding: var(--tc-space-10, 40px) 0 var(--tc-space-16, 64px);
}
.ui-dsc__crumb { margin: 0 0 var(--tc-space-2, 8px); font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsc__title-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2, 8px) var(--tc-space-3, 12px); }
.ui-dsc__title-row .ui-as-page-title { margin: 0; }
.ui-dsc__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, 4px);
  height: 22px;
  padding: 0 var(--tc-space-2, 8px);
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f));
  font-size: var(--tc-font-size-sm, 12px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c));
}
.ui-dsc__version { font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace); font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsc__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-2, 8px); margin-top: var(--tc-space-4, 16px); }
.ui-dsc__link {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, 6px);
  height: 30px;
  padding: 0 var(--tc-space-3, 12px);
  border-radius: var(--tc-radius-md, 8px);
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  text-decoration: none;
}
.ui-dsc__link:hover { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); }
.ui-dsc__link:focus-visible { outline: 2px solid var(--tc-focus-ring, light-dark(#2f68ff, #6b95ff)); outline-offset: 2px; }
.ui-dsc__link svg:last-child { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsc__bar { margin-top: var(--tc-space-6, 24px); }
.ui-dsc__body { display: grid; gap: var(--tc-space-8, 32px); margin-top: var(--tc-space-5, 20px); }

.ui-dsc__section { display: grid; gap: var(--tc-space-3, 12px); }
.ui-dsc__h2 { margin: 0; font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-strong, 600); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsc__note, .ui-dsc__prose p { margin: 0; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-relaxed, 22px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-dsc__card { border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-dsc__split { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: center; gap: var(--tc-space-6, 24px); }
.ui-dsc__art { padding: var(--tc-space-4, 16px); }
.ui-dsc__prose { display: grid; gap: var(--tc-space-3, 12px); }

.ui-dsc__uses, .ui-dsc__checks { display: grid; gap: var(--tc-space-2, 8px); margin: 0; padding: 0; list-style: none; }
.ui-dsc__uses li { display: flex; align-items: baseline; gap: var(--tc-space-2, 8px); font-size: var(--tc-font-size-lg, 14px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsc__uses b { font-weight: var(--tc-font-weight-medium, 500); }
.ui-dsc__uses span { font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsc__checks li { display: flex; gap: var(--tc-space-2, 8px); font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsc__check {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f));
  color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c));
}

/* Live preview: a frame you can resize, the overlay beside it */
.ui-dsc__preview { display: flex; flex-wrap: wrap; gap: var(--tc-space-4, 16px); align-items: flex-start; }
.ui-dsc__frame {
  container-type: inline-size;
  flex: none;
  width: 560px;
  min-width: 240px;
  max-width: 100%;
  padding: var(--tc-space-5, 20px);
  overflow: auto;
  resize: horizontal;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
}
.ui-dsc__overlay { flex: 1 1 300px; }
.ui-dsc__mock { display: grid; gap: var(--tc-space-2, 8px); padding: var(--tc-space-4, 16px); border-radius: var(--tc-radius-lg, 10px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-dsc__mock-title { font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsc__mock-text { font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-dsc__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2, 8px); margin-top: var(--tc-space-2, 8px); }
@container (max-width: 479px) {
  .ui-dsc__actions { flex-direction: column-reverse; align-items: stretch; }
}

/* Usage */
.ui-dsc__variants { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; border-radius: var(--tc-card-radius, 16px); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); }
.ui-dsc__variant { display: grid; grid-template-columns: 180px 110px minmax(0, 1fr); align-items: center; gap: var(--tc-space-4, 16px); padding: var(--tc-space-3, 12px) var(--tc-space-4, 16px); }
.ui-dsc__variant + .ui-dsc__variant { border-top: 1px solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-dsc__variant-name { font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-dsc__variant-when { font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-dsc__pair { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-4, 16px); }
.ui-dsc__guide { padding: var(--tc-space-4, 16px) var(--tc-space-5, 20px); }
.ui-dsc__guide-title { display: flex; align-items: center; gap: var(--tc-space-2, 8px); margin: 0 0 var(--tc-space-3, 12px); font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-strong, 600); }
.ui-dsc__guide[data-kind="do"] .ui-dsc__guide-title { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-dsc__guide[data-kind="dont"] .ui-dsc__guide-title { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-dsc__guide ul { display: grid; gap: var(--tc-space-2, 8px); margin: 0; padding-left: var(--tc-space-4-5, 18px); font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

@media (max-width: 860px) {
  .ui-dsc { width: calc(100% - 32px); padding-top: var(--tc-space-6, 24px); }
  .ui-dsc__split, .ui-dsc__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-dsc__variant { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1, 4px); }
}
`;
