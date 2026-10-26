"use client";

/*
 * Folder – one folder with its files, in a single file.
 * Breadcrumb, back link, the Glass Folder with share and upload actions, and the files as cards
 * (or an empty state with a call to action when the folder is empty).
 * Sits in the Trenchcoat App Shell.
 * Imports: app-shell (AppShell, Dropdown, EmptyState, FileCard, Icon, useToast), button and glass-folder from
 * `@/components/ui/<name>` – copy them alongside; icons from lucide-react 1.55.0.
 */

import {
  ArrowLeftIcon,
  EllipsisIcon,
  LinkIcon,
  MessageSquarePlusIcon,
  PencilLineIcon,
  TrashIcon,
  UploadIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassFolder } from "@/components/ui/glass-folder";
import { useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import { AppShell, Dropdown, EmptyState, FileCard, Icon, fileKind, useToast, type AppShellProps, type FileItem } from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
const folders: { name: string; files: FileItem[] }[] = [
  {
    name: "Q3 Campaign",
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
    files: [
      { name: "Brand-Guidelines", type: "PDF", edited: "4 days ago" },
      { name: "Tone-of-Voice", type: "DOC", edited: "Last week" },
      { name: "Logo-Usage", type: "PDF", edited: "2 weeks ago" },
    ],
  },
  {
    name: "Hiring",
    files: [
      { name: "Job-Description", type: "DOC", edited: "Today" },
      { name: "Candidates", type: "XLS", edited: "Yesterday" },
      { name: "Interview-Guide", type: "PDF", edited: "5 days ago" },
      { name: "Offer-Template", type: "DOC", edited: "Last month" },
    ],
  },
  {
    name: "Research",
    files: [
      { name: "Market-Study", type: "PDF", edited: "3 days ago" },
      { name: "Survey-Results", type: "XLS", edited: "Last week" },
    ],
  },
];


type FolderOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Name of the folder to show – a sample folder, or a new empty one with that name */
  folder?: string;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type FolderScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof FolderOwnProps | "children"> & FolderOwnProps & { ref?: Ref<HTMLDivElement> };

/** An uploaded file, with a key of its own – names can repeat */
type Upload = FileItem & { key: string };

export function FolderScreen({ folder: name, onNavigate, workspace, user, ref, ...rest }: FolderScreenProps) {
  const folder = folders.find((f) => f.name === name) ?? (name ? { name, files: [] } : folders[0]);
  // Uploads add the picked files to the folder; the list starts over when another folder opens
  const [uploaded, setUploaded] = useState<{ folder: string; files: Upload[] }>({ folder: folder.name, files: [] });
  const added = uploaded.folder === folder.name ? uploaded.files : [];
  // Cards keep their key when files are added in front, so existing ones aren't rebuilt (and don't rise again)
  const files: (FileItem & { key: string; fresh?: boolean })[] = [
    ...added.map((f) => ({ ...f, fresh: true })),
    ...folder.files.map((f) => ({ ...f, key: `file:${f.name}` })),
  ];
  const input = useRef<HTMLInputElement>(null);
  const uploads = useRef(0);
  const [toast, showToast] = useToast();

  const upload = (list: FileList | null) => {
    if (!list?.length) return;
    const picked: Upload[] = [...list].map((file) => ({
      key: `upload:${++uploads.current}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      type: /\.(xlsx?|csv|numbers)$/i.test(file.name) ? "XLS" : /\.pdf$/i.test(file.name) ? "PDF" : "DOC",
      edited: "Just now",
    }));
    const into = folder.name;
    setUploaded((prev) => ({ folder: into, files: [...picked, ...(prev.folder === into ? prev.files : [])] }));
    showToast(`${picked.length} ${picked.length === 1 ? "file" : "files"} uploaded`);
  };

  return (
    <AppShell {...rest} ref={ref} active={folder.name} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-screen-folder" precedence="default">
        {css}
      </style>
      <nav className="ui-as-crumbs" aria-label="Breadcrumb">
        <button type="button" onClick={() => onNavigate?.("Folders")}>
          Files
        </button>
        <i aria-hidden="true">/</i>
        <span aria-current="page" title={folder.name}>
          {folder.name}
        </span>
      </nav>

      <div className="ui-as-page ui-as-page--folder">
        <button type="button" className="ui-as-back" onClick={() => onNavigate?.("Folders")}>
          <Icon icon={ArrowLeftIcon} size={14} />
          Files
        </button>

        <header className="ui-as-folder-head">
          <span className="ui-as-folder-head__icon">
            <GlassFolder label="" />
          </span>
          <h1 className="ui-as-page-title">{folder.name}</h1>
          <span className="ui-as-folder-head__actions">
            <Dropdown
              align="end"
              className="ui-as-folder-more"
              items={[
                { label: "Rename", icon: PencilLineIcon, onSelect: () => showToast("Rename is coming soon") },
                { label: "Copy link", icon: LinkIcon, onSelect: () => (navigator.clipboard?.writeText(window.location.href).catch(() => {}), showToast("Link copied")) },
                { label: "Delete folder", icon: TrashIcon, danger: true, onSelect: () => onNavigate?.("Folders") },
              ]}
              trigger={({ open, toggle }) => (
                <Button variant="ghost" size="sm" aria-label="More" aria-expanded={open} aria-haspopup="menu" icon={<Icon icon={EllipsisIcon} size={16} />} onClick={toggle} />
              )}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon icon={UsersRoundIcon} size={15} />}
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
                showToast("Link copied");
              }}
            >
              Share
            </Button>
            <Button size="sm" icon={<Icon icon={UploadIcon} size={15} />} onClick={() => input.current?.click()}>
              Upload files
            </Button>
            <input ref={input} type="file" multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ""))} />
          </span>
        </header>

        {files.length > 0 ? (
          <div className="ui-as-folder-files ui-as-file-grid" key={folder.name}>
            {files.map((f, i) => (
              <div key={f.key} className="ui-as-rise" style={{ "--i": f.fresh ? 0 : i } as CSSProperties}>
                <FileCard file={f} meta={<>{fileKind[f.type]} · {f.edited}</>} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No files yet"
            text="Start a chat to work with files here. The AI can read, edit and create them alongside you."
            action={
              <Button variant="secondary" size="sm" icon={<Icon icon={MessageSquarePlusIcon} size={15} />} onClick={() => onNavigate?.("New chat")}>
                Work in folder
              </Button>
            }
          />
        )}
      </div>
      {toast}
    </AppShell>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

/* A single folder – breadcrumb, back link, header with actions and the empty drop area */

.ui-as-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  line-height: var(--tc-line-height-normal, 20px);
  padding: 0 16px;
  font-size: var(--tc-font-size-md-plus, 13.5px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
/* Room for the sidebar icon while the sidebar is collapsed */
.ui-as-app[data-collapsed] .ui-as-crumbs { padding-left: 50px; }
.ui-as-crumbs { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-crumbs button { border-radius: var(--tc-radius-xs, 4px); color: inherit; text-decoration: none; }
.ui-as-crumbs button:focus-visible, .ui-as-back:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-as-crumbs button:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-crumbs i { font-style: normal; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-crumbs [aria-current] { min-width: 0; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-as-page.ui-as-page--folder { padding-top: 12px; }
.ui-as-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--tc-radius-xs, 4px);
  font-size: var(--tc-font-size-md-plus, 13.5px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  text-decoration: none;
}
.ui-as-back:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-as-folder-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
}
.ui-as-folder-head__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.ui-as-page--folder .ui-as-empty { margin-top: 20px; padding: 48px 24px 56px; }

/* The folder's files as cards */
/* Same cards and spacing as the templates on the Files page */
.ui-as-folder-files { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }

/* Narrow: the sidebar icon always sits in the corner; the actions move under the title */
@container ui-as (max-width: 900px) {
  .ui-as-crumbs { padding-left: 50px; }
  .ui-as-page.ui-as-page--folder { padding-top: 8px; }
  .ui-as-folder-head { flex-wrap: wrap; row-gap: 14px; }
}
@container ui-as (max-width: 600px) {
  .ui-as-crumbs { padding-right: 12px; }
  .ui-as-crumbs [aria-current] { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .ui-as-folder-head { margin-top: 18px; }
  .ui-as-folder-head__actions { width: 100%; margin-left: 0; }
  /* Share and Upload first, the "more" menu at the far end */
  .ui-as-folder-head__actions > .ui-as-folder-more { order: 3; margin-left: auto; }
  .ui-as-page--folder .ui-as-empty { padding: 36px 18px 40px; }
}
`;
