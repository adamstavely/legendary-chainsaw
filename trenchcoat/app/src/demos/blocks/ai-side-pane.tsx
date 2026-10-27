import { useEffect, useRef, useState, type CSSProperties } from "react";
import type * as UI from "@blocks/ai-side-pane";
import type { SidePaneMessage } from "@blocks/ai-side-pane";
import type { ChatConversation, ChatPageContext, PromptStarter, PromptTemplate } from "trenchcoat/react";
import { caption } from "../../demo-kit";

/* A mock quarterly report with the assistant docked on the right. Sending fakes a model: the answer streams in word
   by word; questions that ask for a decision come back as claims, marked high-stakes (a reflection gate). */

const SECTIONS = [
  { id: "summary", label: "Summary", tokens: 420, kind: "source" },
  { id: "revenue", label: "Revenue by region (table)", tokens: 1840, kind: "source" },
  { id: "churn", label: "Churn by plan (chart)", tokens: 620, kind: "source" },
  { id: "outlook", label: "Outlook and risks", tokens: 760, kind: "source" },
];
const PAGE: ChatPageContext = { title: "Q3 report", connected: true, count: SECTIONS.length, items: SECTIONS };

const PAGE_STARTERS: PromptStarter[] = [
  { id: "sum", text: "Summarise the Q3 report in five bullets", icon: "document", hint: "From the summary" },
  { id: "emea", text: "Why did EMEA revenue fall this quarter?", icon: "chart", hint: "Revenue by region" },
  { id: "risks", text: "Which risks does the outlook mention?", icon: "list", hint: "Outlook and risks" },
  { id: "note", text: "Draft a note to leadership about ", label: "Draft a note to leadership…", icon: "write", mode: "fill" },
];
const GENERAL_STARTERS: PromptStarter[] = [
  { id: "nrr", text: "Explain net revenue retention", icon: "question" },
  { id: "good", text: "What makes a quarterly report easy to read?", icon: "lightbulb" },
  { id: "update", text: "Draft a short project update about ", label: "Draft a project update…", icon: "write", mode: "fill" },
];

const PROMPTS: PromptTemplate[] = [
  {
    id: "summary",
    title: "Summarise for leadership",
    category: "Reporting",
    body: "Summarise this report for {audience} in {count} bullet points. Lead with what changed since last quarter.",
    variables: { audience: { description: "Who reads it", default: "the leadership team" }, count: { description: "How many bullets", default: "5" } },
  },
  { id: "explain", title: "Explain a number", category: "Analysis", body: "Why did {metric} move this quarter? Point to the rows or notes that explain it.", variables: { metric: { description: "The figure to explain" } } },
  { id: "risks", title: "List the risks", category: "Analysis", body: "List the three biggest risks this report shows, with the evidence for each." },
];
const SETTINGS_MODEL = { id: "claude", label: "Claude", description: "Reasoning model · plans before it answers", supports: ["temperature", "maxOutputTokens", "reasoningEffort"] };

const SOURCES = [
  { title: "Revenue by region – Q3", name: "Q3 report", snippet: "Total revenue $48.2M, up 12% on Q2. NA +18%, APAC +21%, EMEA −4%." },
  { title: "Analyst notes", name: "Q3 report", snippet: "EMEA renewals slipped after the price change; two large accounts moved to annual billing in October." },
];

const DECISION_CLAIMS = {
  claims: [
    { id: "c1", text: "EMEA revenue fell 4% while every other region grew", source: "grounded" as const, confidence: 0.92, sources: ["s1"] },
    { id: "t1", text: ", and " },
    { id: "c2", text: "most of the drop comes from two renewals that moved to annual billing", source: "grounded" as const, confidence: 0.74, sources: ["s2"] },
    { id: "t2", text: ". " },
    { id: "c3", text: "Cutting marketing would likely slow next year's pipeline more than it saves", source: "inferred" as const, confidence: 0.55, uncertainty: "evidence" as const, note: "Based on one quarter of data." },
    { id: "t3", text: "." },
  ],
  claimSources: [
    { id: "s1", title: "Revenue by region – Q3", site: "Q3 report", quote: "EMEA −4%, NA +18%, APAC +21%." },
    { id: "s2", title: "Analyst notes", site: "Q3 report", quote: "Two large accounts moved to annual billing in October." },
  ],
  counter: "The renewals may not come back: if the price change is the cause, the drop could continue whatever marketing spends.",
};

const PRIOR: SidePaneMessage[] = [
  { id: "u1", role: "user", text: "How did revenue do this quarter?", context: "Q3 report" },
  {
    id: "a1",
    role: "assistant",
    text: "Revenue was **$48.2M**, up 12% on Q2 [1]. North America and APAC carried the growth; EMEA fell 4%, mostly from renewals that moved to annual billing [2].",
    sources: SOURCES,
    followUps: ["Why did EMEA revenue fall?", "Compare with Q2"],
  },
];

const HOUR = 3_600_000;
const NOW = new Date(2026, 9, 27, 12).getTime();
const CHATS: ChatConversation[] = [
  { id: "q3", title: "Q3 revenue questions", updatedAt: NOW - HOUR },
  { id: "board", title: "Board deck outline", updatedAt: NOW - 26 * HOUR },
  { id: "churn", title: "Churn by plan", updatedAt: NOW - 4 * 24 * HOUR },
  { id: "q2", title: "Q2 report review", updatedAt: NOW - 40 * 24 * HOUR },
];
const STORED: Record<string, SidePaneMessage[]> = {
  q3: PRIOR,
  board: [
    { id: "b1", role: "user", text: "Outline a five-slide board deck from this report" },
    { id: "b2", role: "assistant", text: "1. Headline numbers\n2. Growth by region\n3. EMEA renewals\n4. Churn by plan\n5. Outlook and asks" },
  ],
  churn: [
    { id: "h1", role: "user", text: "Which plan churns most?" },
    { id: "h2", role: "assistant", text: "The monthly Starter plan: 3.1% a month, against 0.8% for annual plans." },
  ],
  q2: [],
};

let seq = 0;
const nextId = (p: string) => `${p}-${++seq}`;

function answerFor(text: string, withPage: boolean): Omit<SidePaneMessage, "id" | "role"> {
  const q = text.toLowerCase();
  if (/should|decide|cut|budget|invest/.test(q)) return { text: "", ...DECISION_CLAIMS, reflect: "checkpoint" };
  if (!withPage)
    return { text: "I can't see the page right now – connect it with the page context chip and I'll answer from the report. In general: lead with what changed, then why, then what you'll do about it." };
  if (/emea|fall|drop/.test(q))
    return {
      text: "EMEA fell 4% [1]. The analyst notes put most of it on two large renewals that moved to annual billing in October [2], so part of the revenue lands in Q4 instead.",
      sources: SOURCES,
      followUps: ["Should we cut the EMEA marketing budget?"],
    };
  if (/risk/.test(q)) return { text: "The outlook names three:\n\n- EMEA renewals after the price change\n- Slower APAC hiring\n- Currency swings on the euro book [1]", sources: SOURCES.slice(0, 1) };
  return {
    text: "Here's the short version:\n\n- Revenue $48.2M, up 12% [1]\n- NA +18%, APAC +21%, EMEA −4% [1]\n- EMEA's drop is mostly billing timing [2]\n- Churn steady at 1.9%\n- Outlook: cautious on EMEA",
    sources: SOURCES,
  };
}

const page: CSSProperties = { padding: "28px 32px 80px", maxWidth: 720, margin: "0 auto", fontSize: "var(--tc-font-size-md, 13px)", lineHeight: 1.6, color: "var(--tc-text-secondary, #3f3f46)" };
const h1: CSSProperties = { margin: "4px 0 6px", fontSize: "var(--tc-font-size-2xl, 20px)", fontWeight: 600, color: "var(--tc-text-primary, #171717)", letterSpacing: "-0.01em" };
const h2: CSSProperties = { margin: "28px 0 8px", fontSize: "var(--tc-font-size-lg, 14px)", fontWeight: 600, color: "var(--tc-text-primary, #171717)" };
const cell: CSSProperties = { padding: "6px 10px", borderBottom: "1px solid var(--tc-border-subtle, #eee)", textAlign: "left" };

function Report() {
  const rows = [
    ["North America", "$24.1M", "+18%"],
    ["APAC", "$9.6M", "+21%"],
    ["EMEA", "$14.5M", "−4%"],
  ];
  return (
    <article style={page}>
      <div style={{ ...caption, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "var(--tc-font-size-xs, 11px)" }}>Quarterly report · Draft</div>
      <h1 style={h1}>Q3 2026 business review</h1>
      <p style={caption}>Finance · updated 27 Oct 2026</p>
      <h2 style={h2}>Summary</h2>
      <p style={{ margin: 0 }}>
        Revenue reached $48.2M, up 12% on Q2. North America and APAC grew strongly; EMEA fell 4% as two large renewals moved to annual billing. Gross margin held at 78%.
      </p>
      <h2 style={h2}>Revenue by region</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr>
            {["Region", "Revenue", "vs Q2"].map((h) => (
              <th key={h} style={{ ...cell, fontWeight: 500, color: "var(--tc-text-muted, #646464)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) => (
                <td key={i} style={cell}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={h2}>Churn by plan</h2>
      <p style={{ margin: 0 }}>Monthly churn was 1.9% overall: 3.1% on the monthly Starter plan and 0.8% on annual plans.</p>
      <h2 style={h2}>Outlook and risks</h2>
      <p style={{ margin: 0 }}>We expect Q4 revenue of $50–52M. The main risks are EMEA renewals after the price change, slower APAC hiring and currency swings on the euro book.</p>
    </article>
  );
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const [conversation, setConversation] = useState<string | null>("q3");
  const [messages, setMessages] = useState<SidePaneMessage[]>(PRIOR);
  const [pageContext, setPageContext] = useState<ChatPageContext>(PAGE);
  const [width, setWidth] = useState(400);
  const [settings, setSettings] = useState<Record<string, number | string>>({ temperature: 0.7 });
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, []);

  const update = (id: string, patch: Partial<SidePaneMessage>) => setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  /** The fake model: the answer appears a few words at a time */
  const stream = (id: string, full: string, rest: Omit<SidePaneMessage, "id" | "role" | "text">) => {
    const words = full.split(" ");
    let n = 0;
    const step = () => {
      n = Math.min(words.length, n + 3);
      const done = n >= words.length;
      update(id, { text: words.slice(0, n).join(" "), streaming: !done, ...(done ? rest : {}) });
      if (!done) later(step, 120);
    };
    later(step, 500);
  };

  const respond = (id: string, question: string, withPage: boolean) => {
    const { text, ...rest } = answerFor(question, withPage);
    if (rest.claims) later(() => update(id, { streaming: false, ...rest }), 900);
    else stream(id, text, rest);
  };

  const onSend = (text: string, details: { pageContext?: ChatPageContext }) => {
    const answer = nextId("a");
    setMessages((list) => [
      ...list,
      { id: nextId("u"), role: "user", text, context: details.pageContext?.title },
      { id: answer, role: "assistant", text: "", streaming: true, sources: details.pageContext ? SOURCES : [] },
    ]);
    respond(answer, text, !!details.pageContext);
  };

  const starters = pageContext.connected ? PAGE_STARTERS : GENERAL_STARTERS;

  return (
    <div style={{ width: "100%", display: "grid", gap: 8 }}>
      <div
        style={{
          height: 680,
          borderRadius: "var(--tc-radius-2xl, 16px)",
          overflow: "hidden",
          background: "var(--tc-surface-base, #fff)",
          boxShadow: "0 0 0 1px var(--tc-border-default, #ececec)",
        }}
      >
        <ui.AiSidePane
          title="Assistant"
          messages={messages}
          onSend={onSend}
          onStop={(id) => update(id, { streaming: false })}
          onRegenerate={(id) => {
            const i = messages.findIndex((m) => m.id === id);
            const question = messages[i - 1]?.text ?? "";
            update(id, { text: "", streaming: true, error: undefined, claims: undefined });
            respond(id, question, !!pageContext.connected);
          }}
          starters={starters}
          conversations={CHATS}
          conversation={conversation}
          onConversationChange={(id) => {
            setConversation(id);
            setMessages(STORED[id ?? ""] ?? []);
          }}
          onNewChat={() => {
            setConversation(null);
            setMessages([]);
          }}
          pageContext={pageContext}
          onPageContextChange={(next) => setPageContext({ ...next, count: next.items?.length ?? next.count })}
          prompts={PROMPTS}
          settings={settings}
          onSettingsChange={(next) => setSettings(next)}
          settingsModel={SETTINGS_MODEL}
          width={width}
          onWidthChange={setWidth}
          demo
        >
          <Report />
        </ui.AiSidePane>
      </div>
      <p style={{ ...caption, margin: 0 }}>
        Drag the pane's edge or focus it and use ← →; ⌘. / Ctrl+. opens it. Width {width}px · page context {pageContext.connected ? "on" : "off"}.
      </p>
    </div>
  );
}
