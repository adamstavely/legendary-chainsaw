"use client";

import { AppShellFlat } from "@/components/ui/app-shell-flat";
import { WorkspacePanel, type AppShellWorkspaceProps } from "@/components/ui/app-shell-workspace";

/*
 * App Shell Workspace Flat – App Shell Flat with the work area on the right: gray sidebar, the page edge to edge,
 * the work area beside it, each split off by a single hairline. Resizing, folding away and the drawers on narrow
 * screens come from App Shell Inset; the pane's content is WorkspacePanel from App Shell Workspace Inset.
 * className, other DOM props and `ref` go to the shell's root, as in App Shell Inset.
 * Imports: App Shell Flat (app-shell-flat.tsx) and App Shell Workspace Inset (app-shell-workspace.tsx) from Trenchcoat
 * screens, which bring App Shell Inset; no icons of its own.
 */

export function AppShellWorkspaceFlat({ panel, panelTitle = "Workspace", tools, sources, onOpen, ...props }: AppShellWorkspaceProps) {
  return <AppShellFlat {...props} panelTitle={panelTitle} panel={panel ?? <WorkspacePanel tools={tools} sources={sources} onOpen={onOpen} />} />;
}
