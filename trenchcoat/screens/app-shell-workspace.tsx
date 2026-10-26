"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRightIcon, EllipsisIcon, GlobeIcon, NotebookPenIcon, SearchIcon, SquareTerminalIcon } from "lucide-react";
import { AppShell, Icon, type AppShellProps } from "@/components/ui/app-shell";

/*
 * App Shell Workspace Inset – App Shell Inset with a work area on the right, like the side pane in Claude or Codex:
 * tools (terminal, browser, notes) and suggested sources next to the page. It's resizable like the sidebar (drag its
 * edge, between a minimum and a maximum), folds away with its icon, and slides in as a drawer on narrow screens.
 * WorkspacePanel is the pane's default content – pass your own `panel` to show something else there.
 * className, other DOM props and `ref` go to the shell's root, as in App Shell Inset.
 * Imports: App Shell Inset (app-shell.tsx) from Trenchcoat screens; icons from lucide-react 1.55.0.
 */

export type WorkspaceTool = { id: string; label: string; icon: Parameters<typeof Icon>[0]["icon"]; shortcut?: string };
export type WorkspaceSource = { id: string; title: string; source: string; mark?: ReactNode };

export const defaultTools: WorkspaceTool[] = [
  { id: "terminal", label: "Terminal", icon: SquareTerminalIcon, shortcut: "⌃`" },
  { id: "browser", label: "Browser", icon: GlobeIcon, shortcut: "⌘⇧B" },
  { id: "notes", label: "Notes", icon: NotebookPenIcon, shortcut: "⌘⇧N" },
];

export const defaultSources: WorkspaceSource[] = [
  { id: "geo", title: "GEO: Generative Engine Optimization", source: "arxiv.org", mark: "A" },
  { id: "tokens", title: "Design tokens – naming guide", source: "notion.so", mark: "N" },
  { id: "q3", title: "Q3 launch checklist", source: "linear.app", mark: "L" },
];

export type WorkspacePanelProps = {
  tools?: WorkspaceTool[];
  sources?: WorkspaceSource[];
  /** A tool or a suggestion was opened */
  onOpen?: (id: string) => void;
};

/** The pane's content: an address field, the tools, and suggested sources – each row opens its item */
export function WorkspacePanel({ tools = defaultTools, sources = defaultSources, onOpen }: WorkspacePanelProps) {
  const [query, setQuery] = useState("");
  return (
    <div className="ui-asw">
      <style href="ui-app-shell-workspace" precedence="default">
        {css}
      </style>
      <label className="ui-asw__address">
        <Icon icon={SearchIcon} size={14} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or enter URL" aria-label="Search or enter URL" />
      </label>

      <section className="ui-asw__section" aria-label="Tools">
        <h3 className="ui-asw__label">Tools</h3>
        <div className="ui-asw__list">
          {tools.map((tool) => (
            <div key={tool.id} className="ui-asw__row">
              <button type="button" className="ui-asw__open" onClick={() => onOpen?.(tool.id)}>
                <span className="ui-asw__tile">
                  <Icon icon={tool.icon} size={15} />
                </span>
                <span className="ui-asw__name" title={tool.label}>{tool.label}</span>
                {tool.shortcut && <kbd className="ui-asw__kbd">{tool.shortcut}</kbd>}
              </button>
              <button type="button" className="ui-asw__more" aria-label={`More for ${tool.label}`}>
                <Icon icon={EllipsisIcon} size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="ui-asw__section" aria-label="Suggested">
        <h3 className="ui-asw__label">Suggested</h3>
        <div className="ui-asw__list">
          {sources.map((item) => (
            <button key={item.id} type="button" className="ui-asw__row ui-asw__open ui-asw__source" onClick={() => onOpen?.(item.id)}>
              <span className="ui-asw__tile ui-asw__tile--mark">{item.mark ?? item.title[0]}</span>
              <span className="ui-asw__text">
                <span className="ui-asw__name" title={item.title}>{item.title}</span>
                <span className="ui-asw__meta">{item.source}</span>
              </span>
              <span className="ui-asw__go">
                <Icon icon={ArrowUpRightIcon} size={14} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export type AppShellWorkspaceProps = AppShellProps & WorkspacePanelProps;

export function AppShellWorkspace({ panel, panelTitle = "Workspace", tools, sources, onOpen, ...props }: AppShellWorkspaceProps) {
  return <AppShell {...props} panelTitle={panelTitle} panel={panel ?? <WorkspacePanel tools={tools} sources={sources} onOpen={onOpen} />} />;
}

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

.ui-asw { display: flex; flex-direction: column; gap: 22px; padding: 0 2px; }

/* Address field – the field recipe, with its focus ring on the field (the input itself has none) */
.ui-asw__address {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--tc-field-h, 36px);
  padding: 0 var(--tc-field-px, 12px);
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-icon-muted, light-dark(#858585, #7c7c82));
  cursor: text;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-asw__address:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-asw__address:focus-within { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-asw__address input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-field-font-size, 13.5px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-asw__address input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }

.ui-asw__section { display: flex; flex-direction: column; gap: 8px; }
.ui-asw__label { margin: 0; padding: 0 4px; font-size: var(--tc-caption-font-size, 12px); line-height: var(--tc-caption-line-height, 16px); font-weight: var(--tc-caption-font-weight, 500); color: var(--tc-caption-color, light-dark(#646464, #9a9aa1)); }

/* Rows sit on one card (the card recipe), split by hairlines; rows are rounded to fit inside it */
.ui-asw__list {
  --tc-app-shell-row-radius: calc(var(--tc-card-radius, 16px) - var(--tc-tray-inset, 4px));
  display: flex;
  flex-direction: column;
  padding: var(--tc-tray-inset, 4px);
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-asw__row { position: relative; display: flex; align-items: center; border-radius: var(--tc-app-shell-row-radius); }
.ui-asw__row + .ui-asw__row::before {
  content: "";
  position: absolute;
  top: -0.5px;
  left: 44px;
  right: 8px;
  height: var(--tc-hairline, 1px);
  background: var(--tc-divider, light-dark(#ececec, #2a2a2e));
}
.ui-asw__open {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 8px;
  border-radius: var(--tc-app-shell-row-radius);
  text-align: left;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-asw__open:hover, .ui-asw__row:has(.ui-asw__more:hover) .ui-asw__open { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-asw__source { height: 48px; flex: none; }

.ui-asw__tile {
  display: grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--tc-avatar-radius-agent, 6px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-asw__tile--mark { font-size: var(--tc-font-size-xs-plus, 11.5px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-asw__text { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.ui-asw__name { overflow: hidden; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; text-overflow: ellipsis; }
.ui-asw__open > .ui-asw__name { flex: 1; }
.ui-asw__meta { font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-asw__kbd {
  display: inline-grid;
  flex: none;
  place-items: center;
  min-width: var(--tc-kbd-h, 18px);
  height: var(--tc-kbd-h, 18px);
  padding: 0 var(--tc-kbd-px, 4px);
  border-radius: var(--tc-kbd-radius, 5px);
  background: var(--tc-kbd-bg, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-kbd-shadow, inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e));
  font: inherit;
  font-size: var(--tc-kbd-font-size, 10.5px);
  font-weight: var(--tc-kbd-font-weight, 500);
  line-height: var(--tc-line-height-none, 1);
  color: var(--tc-kbd-fg, light-dark(#404040, #c8c8cc));
  font-variant-numeric: tabular-nums;
}
.ui-asw__more {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-control-h-sm, 28px);
  height: var(--tc-control-h-sm, 28px);
  margin: 0 4px 0 2px;
  border-radius: var(--tc-control-radius-sm, 8px);
  color: var(--tc-action-ghost-fg, light-dark(#404040, #c8c8cc));
  opacity: 0;
  transition: opacity var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-asw__row:hover .ui-asw__more, .ui-asw__more:focus-visible { opacity: 1; }
.ui-asw__more:hover { background: var(--tc-action-ghost-bg-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-asw__go { flex: none; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); opacity: 0; translate: -2px 0; transition: opacity var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), translate var(--tc-duration-base, 200ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-asw__source:hover .ui-asw__go { opacity: 1; translate: 0 0; }
`;
