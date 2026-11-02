"use client";

export { DiffViewer, FileTree, SessionPanel, Terminal, fileTreeFromPaths, type DiffFile, type DiffViewerProps, type FileTreeNode, type FileTreeProps, type SessionPanelLabels, type SessionPanelProps, type SessionPanelSection, type SessionPanelSectionOpen, type SessionPanelSectionsChange, type TerminalProps } from "trenchcoat/react";

/*
 * Session Panel – the side panel of a working session: tools, where it runs, how full its context is, its connectors,
 * outputs and background tasks, and the changes it has made. The block is the <tc-session-panel> element through
 * `trenchcoat/react`, with Terminal, DiffViewer and FileTree for the views its tool buttons can open. The look follows the nearest
 * <LookProvider>, or the `look` prop.
 */
