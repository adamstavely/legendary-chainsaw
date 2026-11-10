// What the gallery lists, without the code: each library's name, intro, layout and categories, and the README lines
// that name its pieces. registry.ts adds the modules and demos; scripts/export-docs-md.mjs reads this on its own, in
// Node, where the demos can't load.
import componentsReadme from "../../src/components/README.md?raw";
import blocksReadme from "../../blocks/README.md?raw";
import screensReadme from "../../screens/README.md?raw";
import illustrationsReadme from "../../illustrations/README.md?raw";
import motionReadme from "../../motion/README.md?raw";

/** card: a grid tile · wide: full row · screen: full row with a tall, app-sized stage */
export type Layout = "card" | "wide" | "screen";

export type LibraryInfo = {
  key: string;
  label: string;
  /** One line under the name */
  tagline: string;
  /** What the library is and when to reach for it */
  about: string;
};

export type LibraryMeta = LibraryInfo & {
  readme: string;
  layout: Layout;
  /** Sub-categories by slug; without them every entry falls under the library's label */
  categories?: [string, string[]][];
};

export const LIBRARY_META: LibraryMeta[] = [
  {
    key: "components",
    tagline: "Interactive building blocks for AI-native products",
    about: "Self-contained UI pieces – agent views, chat and answer UIs, charts, inputs and feedback. Each one ships in a Standard and a Clean style with the same props. Start here when you need a single control or widget.",
    label: "Components",
    readme: componentsReadme,
    layout: "card",
    categories: [
      ["Agents", ["agent-cursors", "agent-findings", "agent-fleet", "agent-graph", "agent-handoff", "agent-inbox", "agent-lanes", "agent-ledger", "agent-monitor", "agent-plan", "agent-queue", "agent-steering", "agent-tree", "approval-card", "approval-gates", "artifact-panel", "autonomy-dial", "budget-guard", "collaboration-stream", "conflict-radar", "context-map", "context-window", "decision-inbox", "decision-tree", "delegate-board", "fallback-chain", "fan-out-grid", "handoff", "live-view", "parallel-attempts", "permission-request", "plan-vs-actual", "review-center", "root-cause-tree", "run-checkpoints", "run-compare", "sandbox-log", "scheduled-runs", "subagent-list", "tool-access-map", "tool-call-card", "tool-permissions", "trace-waterfall", "trigger-builder"]],
      ["AI configuration", ["provider-connection", "configuration-release-control", "mcp-connection-manager", "data-handling-policy", "conversation-annotation", "multimodal-input", "model-settings", "instruction-editor", "output-schema-builder", "tool-configuration", "knowledge-source-manager", "retrieval-settings", "evaluation-dataset-editor", "model-routing"]],
      ["AI & chat", ["agent-face", "ai-answer", "ai-summary", "answer-arena", "chat-composer", "chat-history", "chat-minimap", "cited-answer", "clarifying-questions", "code-block", "comment-thread", "comments-panel", "context-tray", "conversation-branches", "digest", "email-draft", "extraction-review", "feedback-rubric", "file-summary", "generated-ui", "guardrail-notice", "image-grid", "inline-diff", "json-viewer", "memory-panel", "mention-picker", "message-actions", "message-status", "model-picker", "prompt-library", "prompt-starters", "response-selection", "retrieval-inspector", "selection-translate", "session-state", "smart-recommendation", "speed-reader", "structured-output", "text-to-speech", "thinking-loader", "thinking-state", "voice-mode", "writing-assistant"]],
      ["Data & charts", ["activity-calendar", "activity-clock", "billing-schedule", "breakdown-chart", "change-summary", "compact-breakdown", "data-table", "day-rhythm", "eval-scorecard", "experiment-card", "footnotes", "gauge", "heatmap", "kpi-chart", "ops-overview", "project-card", "radar-chart", "score-summary", "sla-status", "sparkline", "usage-meter"]],
      ["Feedback & onboarding", ["background-tasks", "notification-stack", "notifications", "progress-tracker", "score-survey", "setup-guide", "stories", "terms-dialog", "tips-panel", "toaster"]],
      ["Inputs & controls", ["app-picker", "breadcrumbs", "bulk-action-bar", "button", "checkbox", "color-picker", "combobox", "command-menu", "date-range-picker", "dialog", "dropzone", "filter-menu", "hal-form", "header-brand", "integration-picker", "integration-settings", "isbn-details", "number-field", "otp-input", "profile-menu", "radio-group", "reaction-bar", "secret-field", "segmented-control", "select", "selection-toolbar", "sensitivity-label-picker", "share-panel", "side-nav", "slider-field", "stepper-form", "switch", "tag-input", "team-flag-editor", "team-flag-picker", "text-annotator", "todo-list", "tooltip", "tree-select", "year-list"]],
      ["People & profiles", ["account-list", "alert-feed", "asset-list", "biometric-status", "co-occurrence", "contact-channels", "coordinate-details", "document-list", "entity-details", "entity-timeline", "evidence-list", "fact-sheet", "fingerprint-card", "geo-location", "identifier-details", "money-flow", "multi-calendar", "org-chart", "person-hovercard", "person-links", "place-list", "profile-header", "relationship-graph", "team-roster", "time-details", "travel-itinerary", "watchlist"]],
      ["Research & portfolio", ["audience-mix", "bibliography", "budget-burn", "capacity-bars", "citation-badge", "citation-sections", "coverage-ring", "gap-exposure", "grade-distribution", "investment-balance", "org-unit-card", "prioritisation-matrix", "priority-list", "publication-impact", "risk-register", "roadmap-timeline", "status-tracker", "traceability-spine", "work-item"]],
      ["Search", ["ai-search", "facet-sidebar", "query-builder", "results-list", "routine-form", "saved-search-alerts", "search-history"]],
      ["Workspace & sessions", ["branch-switcher", "change-list", "check-status", "collection-card", "console-panel", "diff-viewer", "element-inspector", "environment-list", "file-tree", "icon-rail", "meter-row", "network-log", "panel-card", "pr-link", "preview-card", "preview-frame", "problem-list", "process-list", "pull-request", "route-map", "search-results", "session-list", "terminal", "web-vitals"]],
      ["Charts", ["area-chart", "bar-chart", "beeswarm-chart", "box-plot", "bubble-chart", "bullet-chart", "bump-chart", "calendar-heatmap", "candlestick-chart", "chart", "chord-chart", "combo-chart", "donut-chart", "dumbbell-chart", "funnel-chart", "hexbin-chart", "histogram", "line-chart", "lollipop-chart", "marimekko-chart", "network-graph", "parallel-chart", "pareto-chart", "pie-chart", "radial-bar-chart", "ridgeline-chart", "rose-chart", "sankey-chart", "segmented-bar", "slope-chart", "small-multiples", "stream-graph", "sunburst-chart", "treemap", "venn-diagram", "waffle-chart", "waterfall-chart"]],
      ["Trust & calibration", ["access-request", "agreement-tracker", "approval-chain", "attestation-check", "capability-notice", "claim-answer", "confidence-brief", "content-shield", "correction-propagation", "coverage-matrix", "disagreement-banner", "engagement-quality", "evidence-coverage", "friction-profile", "gate-config", "handoff-brief", "kill-switch", "knowledge-promotion", "legal-hold-manager", "lineage-graph", "playbook-canvas", "policy-simulator", "provenance-summary", "reasoning-flags", "redaction-review", "reflection-gate", "reliance-gauge", "review-conflict", "run-manifest", "scan-status", "session-context-bar", "share-link-manager", "synthesis-notes", "transcript-review", "validity-badge", "verification-queue", "version-history"]],
      ["Utilities", ["breakpoint-overlay", "look-provider", "loupe"]],
    ],
  },
  {
    key: "blocks",
    tagline: "Ready-made sections built from components",
    about: "Larger compositions such as a KPI board, a pricing table, an AI workspace or a task board. They combine several components with layout and sample data – drop one in to get a whole section of a page.",
    label: "Blocks",
    readme: blocksReadme,
    layout: "wide",
  },
  {
    key: "screens",
    tagline: "Complete app pages inside an app shell",
    about: "Full screens – analytics, CRM, files, onboarding, settings – plus the App Shell frames (sidebar, workspace panel) they sit in. Use them as starting points for an entire page.",
    label: "Screens",
    readme: screensReadme,
    layout: "screen",
  },
  {
    key: "illustrations",
    tagline: "Animated visuals for empty states and marketing",
    about: "Decorative, lightly interactive artwork – clouds, folders, orbits, integration diagrams, world maps. Use them in empty states, onboarding and landing pages.",
    label: "Illustrations",
    readme: illustrationsReadme,
    layout: "card",
  },
  {
    key: "motion",
    tagline: "Low-level animation primitives",
    about: "Text and number effects, backgrounds, loaders and tilt – small wrappers that add motion to anything. Other libraries use the same techniques.",
    label: "Motion",
    readme: motionReadme,
    layout: "card",
  },
];

export const LIBRARY_INFO: LibraryInfo[] = LIBRARY_META.map(({ key, label, tagline, about }) => ({ key, label, tagline, about }));

/** Sidebar and page sections, in order: the component categories, then one section per other library */
export const CATEGORIES: string[] = LIBRARY_META.flatMap((lib) => lib.categories?.map(([c]) => c) ?? [lib.label]);

/** Libraries whose pieces are elements and get a design-system page; blocks and screens keep the plain focus view */
export const DOCUMENTED = new Set(["components", "illustrations", "motion"]);

export type ReadmeLine = { label: string; file: string; description: string };

/** A library README's pieces. Lines look like: - **Name** (`name.tsx`) – description */
export function readmeLines(readme: string): ReadmeLine[] {
  return readme.split("\n").flatMap((line) => {
    const m = line.match(/^- \*\*(.+?)\*\* \(`(.+?)\.tsx`\) – (.*)$/);
    return m ? [{ label: m[1], file: m[2], description: m[3] }] : [];
  });
}

/** A piece's display name, without the look note a README label can carry */
export const nameOf = (label: string) => label.replace(/ \((?:Clean|Clean only)\)$/, "");
/** The category a slug sits in: its component category, or the library's own label */
export function categoryOf(lib: LibraryMeta, slug: string) {
  return lib.categories?.find(([, slugs]) => slugs.includes(slug))?.[0] ?? (lib.categories ? "Other" : lib.label);
}
/** Route and React key – the bare slug for components, "<library>/<slug>" for the others */
export const idOf = (library: string, slug: string) => (library === "components" ? slug : `${library}/${slug}`);
