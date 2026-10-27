import { useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChatModel, ChatPageContext, PromptTemplate } from "../../../src/elements/react";
import { bubble, caption, surface } from "../demo-kit";

type Sent = { text: string; model: string; page: string };

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
    onSend: (text: string, d: { model: string }) => setSent((s) => [...s, { text, model: d.model, page: page.connected ? page.title : "" }]),
  };

  return (
    <div style={{ width: "100%", maxWidth: 960, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 420px", minWidth: 0, maxWidth: 560, display: "grid", gap: 12 }}>
        <p style={label}>Main chat</p>
        {sent.length > 0 && (
          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
            {sent.slice(-2).map((m, i) => (
              <div key={i} style={{ maxWidth: "85%", ...bubble, borderRadius: 14, padding: "8px 12px", fontSize: 13 }}>
                {m.text}
                <div style={{ ...caption, fontSize: 11, marginTop: 2 }}>
                  to {name(m.model)}
                  {m.page ? ` · with ${m.page}` : " · without the page"}
                </div>
              </div>
            ))}
          </div>
        )}
        <ChatComposer placeholder="Ask about this report…" {...shared} />
      </div>
      <div style={{ flex: "0 1 340px", minWidth: 0, display: "grid", gap: 6 }}>
        <p style={label}>Side pane width (340 px)</p>
        <div style={{ ...surface, width: "100%", maxWidth: 340, boxSizing: "border-box", borderRadius: 16, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ ...caption, fontSize: 12 }}>Ask about this page</div>
          <ChatComposer placeholder="Ask anything…" {...shared} />
        </div>
      </div>
    </div>
  );
}
