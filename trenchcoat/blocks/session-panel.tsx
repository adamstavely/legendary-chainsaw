"use client";

export {
  BranchSwitcher,
  DiffViewer,
  FileTree,
  PreviewFrame,
  ProblemList,
  ProcessList,
  PullRequest,
  SearchResults,
  SessionList,
  SessionPanel,
  Terminal,
  fileTreeFromPaths,
  type BranchItem,
  type DiffFile,
  type DiffViewerProps,
  type FileTreeNode,
  type FileTreeProps,
  type ProblemItem,
  type ProcessItem,
  type SearchResultsFile,
  type SessionItem,
  type SessionPanelLabels,
  type SessionPanelProps,
  type SessionPanelSection,
  type SessionPanelSectionOpen,
  type SessionPanelSectionsChange,
  type TerminalProps,
} from "trenchcoat/react";

/*
 * Session Panel – the side panel of a working session: tools, where it runs, how full its context is, its connectors,
 * outputs and background tasks, and the changes it has made. The block is the <tc-session-panel> element through
 * `trenchcoat/react`, with the views its tool buttons can open: SessionList, Terminal, DiffViewer, PreviewFrame,
 * FileTree, SearchResults, ProblemList, ProcessList, PullRequest and BranchSwitcher. The look follows the nearest
 * <LookProvider>, or the `look` prop.
 */
