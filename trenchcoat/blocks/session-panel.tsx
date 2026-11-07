"use client";

export {
  BranchSwitcher,
  ConsolePanel,
  DiffViewer,
  ElementInspector,
  FileTree,
  NetworkLog,
  PreviewFrame,
  ProblemList,
  ProcessList,
  PullRequest,
  RouteMap,
  SearchResults,
  SegmentedControl,
  SessionList,
  SessionPanel,
  Terminal,
  WebVitals,
  fileTreeFromPaths,
  type BranchItem,
  type ConsoleEntry,
  type DiffFile,
  type DiffViewerProps,
  type FileTreeNode,
  type FileTreeProps,
  type InspectorDetails,
  type InspectorNode,
  type NetworkRequest,
  type ProblemItem,
  type ProcessItem,
  type RouteItem,
  type SearchResultsFile,
  type SegmentOption,
  type SessionItem,
  type SessionPanelLabels,
  type SessionPanelProps,
  type SessionPanelSection,
  type SessionPanelSectionOpen,
  type SessionPanelSectionsChange,
  type TerminalProps,
  type WebVital,
} from "@adamstavely/trenchcoat/react";

/*
 * Session Panel – the side panel of a working session: tools, where it runs, how full its context is, its connectors,
 * outputs and background tasks, and the changes it has made. The block is the <tc-session-panel> element through
 * `@adamstavely/trenchcoat/react`, with the views its tool buttons can open: SessionList, Terminal, DiffViewer, PreviewFrame,
 * FileTree, SearchResults, ProblemList, ProcessList, PullRequest and BranchSwitcher, plus the page tools beside a
 * preview: ConsolePanel, NetworkLog, ElementInspector, WebVitals and RouteMap, switched with a SegmentedControl. The look follows the nearest
 * <LookProvider>, or the `look` prop.
 */
