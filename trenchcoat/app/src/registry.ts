import type { ComponentType } from "react";
import componentsReadme from "../../src/components/README.md?raw";
import cleanTwins from "virtual:tc-clean";

// Components, illustrations and motion pieces ported to Lit (src/elements/<slug>.ts): their demos get the React wrappers – the same API – and the
// stage's look comes from a look provider, so both looks load the same module
const litPorts = new Set(Object.keys(import.meta.glob("../../src/elements/*.ts")).map((p) => p.match(/([^/]+)\.ts$/)![1]).filter((s) => s !== "index" && s !== "react"));
// The look provider lives in src/elements/internal/look.ts – it has a page too
litPorts.add("look-provider");
const loadWrappers = () => import("../../src/elements/react");
import blocksReadme from "../../blocks/README.md?raw";
// Blocks built on the Lit components through trenchcoat/react (decision O): one file, both looks – the stage's look
// provider picks one, as it does for the elements
const litBlocks = new Set(["ai-side-pane", "evidence-gallery", "header-nav", "oversight-home", "publish-readiness", "red-team-finding", "uncertainty-mix"]);
import screensReadme from "../../screens/README.md?raw";
import illustrationsReadme from "../../illustrations/README.md?raw";
import motionReadme from "../../motion/README.md?raw";

export type Variant = "standard" | "clean";
export type DemoProps = { ui: any };
/** card: a grid tile · wide: full row · screen: full row with a tall, app-sized stage */
export type Layout = "card" | "wide" | "screen";

export type Entry = {
  /** Route and React key – the bare slug for components, "<library>/<slug>" for the others */
  id: string;
  slug: string;
  library: string;
  name: string;
  description: string;
  category: string;
  layout: Layout;
  files: Partial<Record<Variant, string>>;
  load: Partial<Record<Variant, () => Promise<unknown>>>;
  Demo?: ComponentType<DemoProps>;
};

type Modules = Record<string, () => Promise<unknown>>;

export type LibraryInfo = {
  key: string;
  label: string;
  /** One line under the name */
  tagline: string;
  /** What the library is and when to reach for it */
  about: string;
};
type Demos = Record<string, { default: ComponentType<DemoProps> }>;

type Library = LibraryInfo & {
  readme: string;
  modules: Modules;
  demos: Demos;
  layout: Layout;
  /** Sub-categories by slug; without them every entry falls under the library's label */
  categories?: [string, string[]][];
};

// import.meta.glob needs literal paths, so each library is spelled out
const LIBRARIES: Library[] = [
  {
    key: "components",
    tagline: "Interactive building blocks for AI-native products",
    about: "Self-contained UI pieces – agent views, chat and answer UIs, charts, inputs and feedback. Each one ships in a Standard and a Clean style with the same props. Start here when you need a single control or widget.",
    label: "Components",
    readme: componentsReadme,
    modules: import.meta.glob("../../src/components/*.tsx"),
    demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/*.tsx", { eager: true }),
    layout: "card",
    categories: [
      ["Agents", ["agent-cursors", "agent-graph", "agent-inbox", "agent-lanes", "agent-ledger", "agent-plan", "agent-queue", "agent-steering", "agent-tree", "approval-card", "artifact-panel", "autonomy-dial", "budget-guard", "context-map", "context-window", "decision-inbox", "decision-tree", "delegate-board", "fan-out-grid", "handoff", "live-view", "parallel-attempts", "permission-request", "plan-vs-actual", "review-center", "run-checkpoints", "run-compare", "sandbox-log", "tool-call-card", "tool-permissions", "trace-waterfall", "trigger-builder"]],
      ["AI configuration", ["provider-connection", "configuration-release-control", "mcp-connection-manager", "data-handling-policy", "conversation-annotation", "multimodal-input", "model-settings", "instruction-editor", "output-schema-builder", "tool-configuration", "knowledge-source-manager", "retrieval-settings", "evaluation-dataset-editor", "model-routing"]],
      ["AI & chat", ["ai-answer", "answer-arena", "chat-composer", "chat-history", "cited-answer", "clarifying-questions", "code-block", "comment-thread", "comments-panel", "context-tray", "conversation-branches", "email-draft", "extraction-review", "feedback-rubric", "file-summary", "generated-ui", "guardrail-notice", "image-grid", "inline-diff", "memory-panel", "mention-picker", "message-actions", "model-picker", "prompt-library", "prompt-starters", "response-selection", "retrieval-inspector", "selection-translate", "smart-recommendation", "structured-output", "thinking-loader", "thinking-state", "voice-mode", "writing-assistant"]],
      ["Data & charts", ["activity-calendar", "activity-clock", "billing-schedule", "breakdown-chart", "change-summary", "compact-breakdown", "data-table", "day-rhythm", "eval-scorecard", "experiment-card", "kpi-chart", "project-card", "usage-meter"]],
      ["Feedback & onboarding", ["background-tasks", "notification-stack", "notifications", "progress-tracker", "setup-guide", "stories", "terms-dialog", "tips-panel", "toaster"]],
      ["Inputs & controls", ["app-picker", "button", "checkbox", "combobox", "command-menu", "date-range-picker", "dialog", "dropzone", "filter-menu", "integration-picker", "integration-settings", "isbn-details", "number-field", "otp-input", "profile-menu", "radio-group", "reaction-bar", "secret-field", "segmented-control", "slider-field", "stepper-form", "switch", "text-annotator", "tooltip"]],
      ["People & profiles", ["alert-feed", "biometric-status", "document-list", "fact-sheet", "fingerprint-card", "person-links", "profile-header", "watchlist"]],
      ["Research & portfolio", ["audience-mix", "budget-burn", "capacity-bars", "citation-badge", "citation-sections", "coverage-ring", "gap-exposure", "grade-distribution", "investment-balance", "org-unit-card", "priority-list", "publication-impact", "traceability-spine", "work-item"]],
      ["Trust & calibration", ["agreement-tracker", "attestation-check", "capability-notice", "claim-answer", "confidence-brief", "correction-propagation", "coverage-matrix", "disagreement-banner", "engagement-quality", "evidence-coverage", "friction-profile", "gate-config", "handoff-brief", "kill-switch", "knowledge-promotion", "lineage-graph", "playbook-canvas", "policy-simulator", "provenance-summary", "reasoning-flags", "reflection-gate", "reliance-gauge", "review-conflict", "run-manifest", "session-context-bar", "synthesis-notes", "transcript-review", "validity-badge", "verification-queue", "version-history"]],
      ["Utilities", ["look-provider"]],
    ],
  },
  {
    key: "blocks",
    tagline: "Ready-made sections built from components",
    about: "Larger compositions such as a KPI board, a pricing table, an AI workspace or a task board. They combine several components with layout and sample data – drop one in to get a whole section of a page.",
    label: "Blocks",
    readme: blocksReadme,
    modules: import.meta.glob("../../blocks/*.tsx"),
    demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/blocks/*.tsx", { eager: true }),
    layout: "wide",
  },
  {
    key: "screens",
    tagline: "Complete app pages inside an app shell",
    about: "Full screens – analytics, CRM, files, onboarding, settings – plus the App Shell frames (sidebar, workspace panel) they sit in. Use them as starting points for an entire page.",
    label: "Screens",
    readme: screensReadme,
    modules: import.meta.glob("../../screens/*.tsx"),
    demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/screens/*.tsx", { eager: true }),
    layout: "screen",
  },
  {
    key: "illustrations",
    tagline: "Animated visuals for empty states and marketing",
    about: "Decorative, lightly interactive artwork – clouds, folders, orbits, integration diagrams, world maps. Use them in empty states, onboarding and landing pages.",
    label: "Illustrations",
    readme: illustrationsReadme,
    modules: import.meta.glob("../../illustrations/*.tsx"),
    demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/illustrations/*.tsx", { eager: true }),
    layout: "card",
  },
  {
    key: "motion",
    tagline: "Low-level animation primitives",
    about: "Text and number effects, backgrounds, loaders and tilt – small wrappers that add motion to anything. Other libraries use the same techniques.",
    label: "Motion",
    readme: motionReadme,
    modules: import.meta.glob("../../motion/*.tsx"),
    demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/motion/*.tsx", { eager: true }),
    layout: "card",
  },
];

export const LIBRARY_INFO: LibraryInfo[] = LIBRARIES.map(({ key, label, tagline, about }) => ({ key, label, tagline, about }));

/** Sidebar and page sections, in order: the component categories, then one section per other library */
export const CATEGORIES: string[] = LIBRARIES.flatMap((lib) => lib.categories?.map(([c]) => c) ?? [lib.label]);

function build(lib: Library): Entry[] {
  const categoryOf = new Map(lib.categories?.flatMap(([c, slugs]) => slugs.map((s) => [s, c] as const)));
  const moduleFor = (file: string) => Object.entries(lib.modules).find(([path]) => path.endsWith(`/${file}.tsx`))?.[1];
  const bySlug = new Map<string, Entry>();
  // README lines look like: - **Name** (`name.tsx`) – description. Components have one source with both looks
  // ("(Clean only)" for a single-look one); the Clean stage loads its in-memory twin (vite.config.ts)
  for (const line of lib.readme.split("\n")) {
    const m = line.match(/^- \*\*(.+?)\*\* \(`(.+?)\.tsx`\) – (.*)$/);
    if (!m) continue;
    const [, label, file, description] = m;
    const cleanOnly = label.endsWith(" (Clean only)");
    const variant: Variant = file.endsWith("-clean") || cleanOnly ? "clean" : "standard";
    const slug = file.replace(/-clean$/, "");
    const entry = bySlug.get(slug) ?? {
      id: lib.key === "components" ? slug : `${lib.key}/${slug}`,
      slug,
      library: lib.key,
      name: label.replace(/ \((?:Clean|Clean only)\)$/, ""),
      description,
      category: categoryOf.get(slug) ?? (lib.categories ? "Other" : lib.label),
      layout: lib.layout,
      files: {},
      load: {},
      Demo: (lib.key === "components" ? lib.demos[`./demos/${slug}.tsx`] : lib.demos[`./demos/${lib.key}/${slug}.tsx`])?.default,
    };
    entry.files[variant] = `${file}.tsx`;
    entry.load[variant] = moduleFor(file);
    if (lib.key === "components" && litPorts.has(slug)) {
      entry.files = { standard: `elements/${slug}.ts`, clean: `elements/${slug}.ts · look="clean"` };
      entry.load = { standard: loadWrappers, clean: loadWrappers };
    } else if ((lib.key === "illustrations" || lib.key === "motion") && litPorts.has(slug)) {
      // Single-look libraries: one stage, on the wrappers
      entry.files = { standard: `elements/${slug}.ts` };
      entry.load = { standard: loadWrappers };
    } else if (lib.key === "blocks" && litBlocks.has(slug)) {
      entry.files.clean = `${file}.tsx · look="clean"`;
      entry.load.clean = entry.load.standard;
    } else if (lib.key === "components" && !cleanOnly && cleanTwins[slug]) {
      entry.files.clean = `${file}.tsx · look="clean"`;
      entry.load.clean = cleanTwins[slug];
    }
    bySlug.set(slug, entry);
  }
  return [...bySlug.values()];
}

// Same order as the sidebar, so prev/next in the focus view walks it top to bottom
const rank = (e: Entry) => CATEGORIES.indexOf(e.category) >>> 0;
export const ENTRIES = LIBRARIES.flatMap(build).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
