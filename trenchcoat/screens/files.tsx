"use client";

/*
 * Files – folders and file templates, in a single file.
 * Folder cards with the Glass Folder (it opens on hover) and document previews for templates.
 * Sits in the Trenchcoat App Shell.
 * Imports: app-shell (AppShell, EmptyState, FileCard, FilterButton, Icon, SearchField, SectionHead, SortButton, Tabs,
 * ViewToggle), button, glass-folder and filter-menu (types) from `@/components/ui/<name>` – copy them alongside;
 * icons from lucide-react 1.55.0.
 */

import { useCallback, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import { LockKeyholeIcon, PlusIcon, UsersRoundIcon } from "lucide-react";
import type { FilterGroup, FilterValue } from "@/components/ui/filter-menu";
import { Button } from "@/components/ui/button";
import { GlassFolder } from "@/components/ui/glass-folder";
import {
  AppShell,
  EmptyState,
  FileCard,
  FilterButton,
  Icon,
  SearchField,
  SectionHead,
  SortButton,
  Tabs,
  ViewToggle,
  fileKind,
  type AppShellProps,
  type SortDir,
  type ViewMode,
  type FileItem,
} from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
type Folder = { name: string; access: "Shared" | "Private"; files: FileItem[] };

const folders: Folder[] = [
  {
    name: "Q3 Campaign",
    access: "Shared",
    files: [
      { name: "Campaign-Brief", type: "DOC", edited: "2 hours ago" },
      { name: "Launch-Plan", type: "PDF", edited: "Yesterday" },
      { name: "Media-Budget", type: "XLS", edited: "Yesterday" },
      { name: "Ad-Copy", type: "DOC", edited: "3 days ago" },
      { name: "Results-Q2", type: "XLS", edited: "Last week" },
    ],
  },
  {
    name: "Brand assets",
    access: "Shared",
    files: [
      { name: "Brand-Guidelines", type: "PDF", edited: "4 days ago" },
      { name: "Tone-of-Voice", type: "DOC", edited: "Last week" },
      { name: "Logo-Usage", type: "PDF", edited: "2 weeks ago" },
    ],
  },
  {
    name: "Hiring",
    access: "Private",
    files: [
      { name: "Job-Description", type: "DOC", edited: "Today" },
      { name: "Candidates", type: "XLS", edited: "Yesterday" },
      { name: "Interview-Guide", type: "PDF", edited: "5 days ago" },
      { name: "Offer-Template", type: "DOC", edited: "Last month" },
    ],
  },
  {
    name: "Research",
    access: "Private",
    files: [
      { name: "Market-Study", type: "PDF", edited: "3 days ago" },
      { name: "Survey-Results", type: "XLS", edited: "Last week" },
    ],
  },
];


type Template = FileItem & { owner: string; shared?: boolean };

const templates: Template[] = [
  { name: "Design-Book", type: "DOC", owner: "Alex Morgan" },
  { name: "Brand-Guidelines", type: "PDF", owner: "Jonas Weber", shared: true },
  { name: "Campaign-Budget", type: "XLS", owner: "Jonas Weber", shared: true },
  { name: "Weekly-Report", type: "XLS", owner: "Alex Morgan" },
];

const typeFilter: FilterGroup[] = [
  {
    id: "type",
    label: "Type",
    options: [
      { id: "DOC", label: "Document" },
      { id: "PDF", label: "PDF" },
      { id: "XLS", label: "Spreadsheet" },
    ],
  },
];

const byName = (dir: SortDir) => (a: { name: string }, b: { name: string }) => (dir === "asc" ? 1 : -1) * a.name.localeCompare(b.name);
const matches = (name: string, query: string) => name.toLowerCase().includes(query.trim().toLowerCase());

type FilesOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Folders as a grid or a list – controlled; use `defaultView` for a starting layout */
  view?: ViewMode;
  /** Layout shown first when `view` isn't controlled */
  defaultView?: ViewMode;
  /** Called when the grid/list toggle is used */
  onViewChange?: (view: ViewMode) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type FilesScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof FilesOwnProps | "children"> & FilesOwnProps & { ref?: Ref<HTMLDivElement> };

export function FilesScreen({ view: viewProp, defaultView = "grid", onViewChange, onNavigate, workspace, user, ref, ...rest }: FilesScreenProps) {
  const me = user?.name ?? "Alex Morgan";

  // Folders: tab, sort, view and search all work on the same list; "Create folder" adds one
  const [folderList, setFolderList] = useState(folders);
  const [folderTab, setFolderTab] = useState("All");
  const [folderSort, setFolderSort] = useState<SortDir>("asc");
  const [view, setView] = useControllable(viewProp, defaultView, onViewChange, "view");
  const [folderQuery, setFolderQuery] = useState("");
  const shownFolders = folderList
    .filter((f) => folderTab === "All" || f.access === folderTab)
    .filter((f) => matches(f.name, folderQuery))
    .sort(byName(folderSort));
  const createFolder = () => {
    const taken = new Set(folderList.map((f) => f.name));
    let name = "Untitled folder";
    for (let n = 2; taken.has(name); n++) name = `Untitled folder ${n}`;
    setFolderList((list) => [...list, { name, access: "Private", files: [] }]);
    setFolderTab("All");
    setFolderQuery("");
  };

  // Templates: tab by owner, type filter, sort and search; "Add template" adds a blank document
  const [templateList, setTemplateList] = useState(templates);
  const [templateTab, setTemplateTab] = useState("All");
  const [types, setTypes] = useState<FilterValue>({});
  const [templateSort, setTemplateSort] = useState<SortDir>("asc");
  const [templateQuery, setTemplateQuery] = useState("");
  const picked = types.type ?? [];
  const shownTemplates = templateList
    .filter((t) => templateTab === "All" || (templateTab === "Mine" ? t.owner === me : t.owner !== me))
    .filter((t) => !picked.length || picked.includes(t.type))
    .filter((t) => matches(t.name, templateQuery))
    .sort(byName(templateSort));
  const addTemplate = () => {
    const taken = new Set(templateList.map((t) => t.name));
    let name = "Untitled";
    for (let n = 2; taken.has(name); n++) name = `Untitled-${n}`;
    setTemplateList((list) => [...list, { name, type: "DOC", owner: me }]);
    setTemplateTab("All");
    setTypes({});
    setTemplateQuery("");
  };

  return (
    <AppShell {...rest} ref={ref} active="Folders" onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-screen-files" precedence="default">
        {css}
      </style>
      <div className="ui-as-page">
        <h1 className="ui-as-page-title">Files</h1>
        <p className="ui-as-page-sub">
          See files you recently used in chats and manage files saved in folders. <a href="#learn-more">Learn more</a>
        </p>

        <SectionHead
          title="Folders"
          left={<Tabs items={["All", "Shared", "Private"]} value={folderTab} onChange={setFolderTab} />}
          right={
            <>
              <SortButton value={folderSort} onChange={setFolderSort} />
              <ViewToggle value={view} onChange={setView} />
              <SearchField placeholder="Search folders..." width={172} value={folderQuery} onChange={setFolderQuery} />
              <Button size="sm" icon={<Icon icon={PlusIcon} size={15} />} onClick={createFolder}>
                Create folder
              </Button>
            </>
          }
        />
        {shownFolders.length ? (
          <div className="ui-as-folders" data-view={view} key={`${folderTab}|${folderSort}|${view}|${folderQuery}`}>
            {shownFolders.map((f, i) => (
              <button
                key={f.name}
                type="button"
                className="ui-as-folder-card ui-as-rise"
                style={{ "--i": i } as CSSProperties}
                onClick={() => onNavigate?.(f.name)}
              >
                <span className="ui-as-folder-card__icon">
                  <GlassFolder label="" />
                </span>
                <span className="ui-as-folder-card__text">
                  <b title={f.name}>{f.name}</b>
                  <span className="ui-as-meta">
                    <Icon icon={f.access === "Shared" ? UsersRoundIcon : LockKeyholeIcon} size={12} />
                    {f.access} · {f.files.length} {f.files.length === 1 ? "file" : "files"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ui-as-rise ui-as-files-empty">
            <EmptyState title="No folders found" text={folderQuery ? `Nothing matches “${folderQuery}”.` : `There are no ${folderTab.toLowerCase()} folders yet.`} />
          </div>
        )}

        <SectionHead
          title="File templates"
          left={<Tabs items={["All", "Mine", "Shared with me"]} value={templateTab} onChange={setTemplateTab} />}
          right={
            <>
              <FilterButton label="Type" groups={typeFilter} value={types} onChange={setTypes} />
              <SortButton value={templateSort} onChange={setTemplateSort} />
              <SearchField placeholder="Search templates..." width={172} value={templateQuery} onChange={setTemplateQuery} />
              <Button size="sm" variant="secondary" icon={<Icon icon={PlusIcon} size={15} />} onClick={addTemplate}>
                Add template
              </Button>
            </>
          }
        />
        {shownTemplates.length ? (
          <div className="ui-as-templates ui-as-file-grid" key={`${templateTab}|${picked.join()}|${templateSort}|${templateQuery}`}>
            {shownTemplates.map((t, i) => (
              <div key={t.name} className="ui-as-rise" style={{ "--i": i } as CSSProperties}>
                <FileCard
                  file={t}
                  meta={
                    <>
                      {fileKind[t.type]} · {t.owner} · <Icon icon={t.shared ? UsersRoundIcon : LockKeyholeIcon} size={12} /> {t.shared ? "Shared" : "Private"}
                    </>
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="ui-as-rise ui-as-files-empty">
            <EmptyState title="No templates found" text="Try another tab, type or search." />
          </div>
        )}
      </div>
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

/* Files overview – folders and file templates */

.ui-as-folders {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 11px;
  margin-top: 16px;
}
.ui-as-folder-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 59px;
  padding: 0 14px 0 12px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  text-decoration: none;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-folder-card:hover { box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-as-folder-card:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-as-folder-card__text { display: grid; gap: 2px; min-width: 0; }
.ui-as-folder-card__text b { overflow: hidden; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; text-overflow: ellipsis; }

.ui-as-templates { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.ui-as-files-empty { margin-top: 16px; }

/* List view: one folder per row */
.ui-as-folders[data-view="list"] { grid-template-columns: minmax(0, 1fr); gap: 6px; }
.ui-as-folders[data-view="list"] .ui-as-folder-card { min-height: 52px; }

/* Narrow panels: folders 4 → 2 → 1 per row */
@container ui-as-main (max-width: 760px) {
  .ui-as-folders { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-as-folder-card { text-align: left; }
  .ui-as-folder-card__text { flex: 1; }
}
@container ui-as-main (max-width: 480px) {
  .ui-as-folders { grid-template-columns: minmax(0, 1fr); gap: 8px; }
}
`;
