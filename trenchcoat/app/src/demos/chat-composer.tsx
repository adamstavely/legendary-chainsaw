import { useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChatModel, ChatPageContext, ChatSendDetails, ChatSkill, PromptTemplate } from "../../../src/elements/react";
import { bubble, caption, surface } from "../demo-kit";

type Sent = { text: string; model: string; page: string; skill: string };

/* Skills: / at the start of the message (or the "/" button) lists them – recent ones first, then by source. Typing
   ranks them by name, word and description; a pick puts its token at the start with its argument hint. The side pane
   finds them through an async search, as an app with a server-side catalogue would */
const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const glyphs = {
  translate: <Glyph d="M4 5h8M8 3v2M5.5 5c.8 3 3 5.5 6 7M10.5 5c-.8 3-3 5.5-6 7M13 20l3.5-8 3.5 8M14 17.5h5" />,
  sum: <Glyph d="M4 6h16M4 10h16M4 14h10M4 18h7" />,
  chart: <Glyph d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  table: <Glyph d="M3 5h18v14H3zM3 10h18M9 5v14" />,
  mail: <Glyph d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  flag: <Glyph d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  ticket: <Glyph d="M4 8V6h16v2a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4zM4 14v4h16v-4" />,
};
const SKILLS: ChatSkill[] = [
  { id: "summarize", name: "summarize", description: "Sum up this report in a few bullets", source: "Built-in", icon: glyphs.sum, argumentHint: "<audience>" },
  { id: "translate", name: "translate", description: "Translate the answer into another language", source: "Built-in", icon: glyphs.translate, argumentHint: "<language>", keywords: "localise language" },
  { id: "chart", name: "chart", description: "Draw a chart from a table on the page", source: "Built-in", icon: glyphs.chart, argumentHint: "<metric> by <dimension>" },
  { id: "compare", name: "compare-quarters", description: "Compare this quarter with the last one", source: "Built-in", icon: glyphs.table },
  { id: "exec", name: "exec-brief", description: "A one-page brief in the finance team's format", source: "Finance team", icon: glyphs.mail, argumentHint: "<region>" },
  { id: "variance", name: "variance-check", description: "Flag lines that moved more than the threshold", source: "Finance team", icon: glyphs.flag, argumentHint: "<percent>" },
  { id: "forecast", name: "forecast", description: "Project next quarter from the trend", source: "Finance team", icon: glyphs.chart },
  { id: "issue", name: "create-issue", description: "File a Linear issue from what we found", source: "Linear", icon: glyphs.ticket, argumentHint: "<title>" },
  { id: "link", name: "link-issue", description: "Link this thread to an existing issue", source: "Linear", icon: glyphs.ticket, keywords: "attach" },
];
/** @ for people and the report's sections – the same list as `skills`, on another key */
const MENTIONS = [
  {
    char: "@",
    label: "People and sections",
    groups: [
      {
        id: "sections",
        label: "Report sections",
        items: [
          { id: "rev", label: "Revenue by region", hint: "table" },
          { id: "churn", label: "Churn by plan", hint: "chart" },
        ],
      },
      {
        id: "people",
        label: "People",
        items: [
          { id: "maya", label: "Maya Chen", hint: "Finance", avatar: true },
          { id: "omar", label: "Omar Haddad", hint: "EMEA sales", avatar: true },
        ],
      },
    ],
  },
];

/** The side pane's search: on the app's side, with a delay you can see */
const searchSkills = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<ChatSkill[]>((resolve, reject) => {
    const q = query.toLowerCase();
    const id = setTimeout(() => resolve(SKILLS.filter((s) => `${s.name} ${s.description} ${s.keywords ?? ""}`.toLowerCase().includes(q))), 450);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

/** The model menu's strengths, first-token time and price, per default model */
const STATS: Record<string, Partial<ChatModel>> = {
  auto: {},
  claude: { speed: 3, quality: 5, cost: 4, latencyMs: 900, pricePerM: 15 },
  chatgpt: { speed: 5, quality: 3, cost: 2, latencyMs: 400, pricePerM: 2.5 },
};

const PAGE_ITEMS: NonNullable<ChatPageContext["items"]> = [
  { id: "rev", label: "Revenue by region (table)", tokens: 1840, kind: "source" },
  { id: "churn", label: "Churn by plan (chart)", tokens: 620, kind: "source" },
  { id: "notes", label: "Analyst notes", tokens: 960, kind: "file" },
];

const PROMPTS: PromptTemplate[] = [
  {
    id: "summary",
    title: "Summarise for leadership",
    category: "Reporting",
    body: "Summarise this report for {audience} in {count} bullet points. Lead with what changed since last quarter.",
    variables: { audience: { description: "Who reads it", default: "the leadership team" }, count: { description: "How many bullets", default: "5" } },
  },
  {
    id: "explain",
    title: "Explain a number",
    category: "Analysis",
    body: "Why did {metric} move this quarter? Point to the rows or notes that explain it.",
    variables: { metric: { description: "The figure to explain, e.g. EMEA revenue" } },
  },
  { id: "risks", title: "List the risks", category: "Analysis", body: "List the three biggest risks this report shows, with the evidence for each." },
];

const SETTINGS_MODEL = { id: "claude", label: "Claude", description: "Reasoning model · plans before it answers", supports: ["temperature", "maxOutputTokens", "reasoningEffort"] };

const label: CSSProperties = { ...caption, fontWeight: 500, margin: "0 0 6px" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChatComposer, defaultModels } = ui;
  const models: ChatModel[] = defaultModels.map((m) => ({ ...m, ...STATS[m.id] }));
  const [model, setModel] = useState("claude");
  const [settings, setSettings] = useState<Record<string, number | string>>({ temperature: 0.7 });
  const [page, setPage] = useState<ChatPageContext>({ title: "Q3 revenue report", connected: true, count: PAGE_ITEMS.length, items: PAGE_ITEMS });
  const [sent, setSent] = useState<Sent[]>([]);
  const [recent, setRecent] = useState<string[]>(["chart", "exec"]);
  const remember = (skill: ChatSkill | null, reason: string) => {
    if (skill && (reason === "pick" || reason === "replace")) setRecent((r) => [skill.id, ...r.filter((id) => id !== skill.id)].slice(0, 4));
  };
  const name = (id: string) => models.find((m) => m.id === id)?.name ?? id;

  const shared = {
    models,
    model,
    onModelChange: (m: ChatModel) => setModel(m.id),
    modelSwitcher: "toolbar" as const,
    settings,
    settingsModel: SETTINGS_MODEL,
    onSettingsChange: (next: Record<string, number | string>) => setSettings(next),
    prompts: PROMPTS,
    pageContext: page,
    onPageContextChange: (next: ChatPageContext) => setPage({ ...next, count: next.items?.length ?? next.count }),
    disclaimer: "AI can make mistakes. Check important info.",
    loadMs: 1400,
    demo: true,
    dictation: "What drove the drop in EMEA renewals this quarter?",
    onSend: (text: string, d: ChatSendDetails) => setSent((s) => [...s, { text: d.skill ? d.args : text, skill: d.skill?.name ?? "", model: d.model, page: page.connected ? page.title : "" }]),
    recentSkills: recent,
    onSkillChange: remember,
  };

  return (
    <div style={{ width: "100%", maxWidth: 960, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 420px", minWidth: 0, maxWidth: 560, display: "grid", gap: 12 }}>
        <p style={label}>Main chat</p>
        {sent.length > 0 && (
          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
            {sent.slice(-2).map((m, i) => (
              <div key={i} style={{ maxWidth: "85%", ...bubble, borderRadius: 14, padding: "8px 12px", fontSize: 13 }}>
                {m.skill && <span style={{ fontWeight: 500 }}>/{m.skill} </span>}
                {m.text}
                <div style={{ ...caption, fontSize: 11, marginTop: 2 }}>
                  to {name(m.model)}
                  {m.page ? ` · with ${m.page}` : " · without the page"}
                </div>
              </div>
            ))}
          </div>
        )}
        <ChatComposer placeholder="Ask about this report…" skills={SKILLS} mentions={MENTIONS} {...shared} />
        <p style={{ ...caption, margin: 0 }}>Type / for skills or @ for people and sections – or press the / button.</p>
      </div>
      <div style={{ flex: "0 1 340px", minWidth: 0, display: "grid", gap: 6 }}>
        <p style={label}>Side pane width (340 px)</p>
        <div style={{ ...surface, width: "100%", maxWidth: 340, boxSizing: "border-box", borderRadius: 16, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ ...caption, fontSize: 12 }}>Ask about this page</div>
          {/* The catalogue is searched on the app's side; `skills` still names the ones it knows, for their icons */}
          <ChatComposer placeholder="Ask anything…" skills={SKILLS} searchSkills={searchSkills} {...shared} />
        </div>
      </div>
    </div>
  );
}
