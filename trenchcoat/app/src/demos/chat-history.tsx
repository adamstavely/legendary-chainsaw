import { useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ChatContextItem, ChatConversation, ChatFolder, ChatSummaryItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const FOLDERS: ChatFolder[] = [
  { id: "launch", label: "Q4 launch" },
  { id: "hiring", label: "Hiring" },
];

/** [title, hours ago, folder?, pinned?] */
const SAMPLE: [string, number, string?, boolean?][] = [
  ["Release note for v2.4", 1, undefined, true],
  ["Weekly metrics summary", 30, undefined, true],
  ["Fix flaky checkout test", 2],
  ["Rewrite onboarding email", 3],
  ["SQL for churned accounts", 6],
  ["Launch checklist review", 5, "launch"],
  ["Pricing page copy, take 3", 50, "launch"],
  ["Press FAQ draft", 120, "launch"],
  ["Interview loop for staff engineer", 26, "hiring"],
  ["Take-home exercise rubric", 400, "hiring"],
  ["Summarize the Acme call", 27],
  ["Regex for invoice numbers", 31],
  ["Plan the offsite agenda", 75],
  ["Explain the Kafka lag spike", 98],
  ["Translate help article to German", 130],
  ["Postmortem: login outage", 160],
  ["Name ideas for the CLI", 240],
  ["Design review notes", 300],
  ["Compare Postgres vs. DynamoDB", 420],
  ["Board update outline", 560],
  ["Budget variance in Q3", 700],
  ["Customer interview synthesis", 1100],
  ["Migrate cron jobs to queues", 1500],
  ["Accessibility audit follow-ups", 2300],
  ["Holiday support rota", 3100],
  ["First draft of the RFC", 4200],
];

const TOPICS = ["Draft", "Summarize", "Review", "Explain", "Plan", "Fix", "Rewrite", "Compare", "Outline", "Debug"];
const THINGS = ["the Q3 report", "a churn query", "the API errors", "launch emails", "the hiring plan", "a pricing test", "the roadmap", "support macros", "the data model", "release notes"];

/* Structured summaries of a few earlier sessions – "Load as context" in a chat's menu brings one into the current chat */
const SUMMARIES: Record<string, ChatSummaryItem[]> = {
  "Summarize the Acme call": [
    { id: "s1", kind: "Finding", text: "Acme renews only if SSO ships by March" },
    { id: "s2", kind: "Open question", text: "Who owns the data-residency answer?" },
    { id: "s3", kind: "Next step", text: "Send the SSO timeline to Dana by Friday" },
  ],
  "Launch checklist review": [
    { id: "l1", kind: "Finding", text: "Status page copy still says beta" },
    { id: "l2", kind: "Next step", text: "Dry-run the rollback on staging" },
  ],
  "Postmortem: login outage": [
    { id: "p1", kind: "Finding", text: "Token cache expired every pod at once" },
    { id: "p2", kind: "Next step", text: "Jitter the cache TTL" },
  ],
};

const sample = (now: number): ChatConversation[] =>
  SAMPLE.map(([title, hours, folder, pinned], i) => ({ id: `c${i}`, title, updatedAt: now - hours * HOUR, folder, pinned, summary: SUMMARIES[title] }));

/** The Acme call's summary, already loaded into the open chat */
const START_CONTEXT: ChatContextItem[] = SUMMARIES["Summarize the Acme call"].map((s) => ({ ...s, chat: "c10", from: "Summarize the Acme call" }));

/** 10,000 chats over the last three years */
const many = (now: number): ChatConversation[] =>
  Array.from({ length: 10_000 }, (_, i) => ({
    id: `m${i}`,
    title: `${TOPICS[i % TOPICS.length]} ${THINGS[(i * 7) % THINGS.length]} #${10_000 - i}`,
    updatedAt: now - Math.floor(i * 0.11 * DAY + (i % 5) * HOUR),
    pinned: i === 3 || i === 40,
  }));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ChatHistory } = ui;
  // "Now" is read once – the groups are relative to it
  const [now] = useState(() => Date.now());
  const [big, setBig] = useState(false);
  const [note, setNote] = useState("Right-click a chat, or focus one and press F2 or Delete. Chats with a summary can be loaded as context.");
  const start = useMemo(() => (big ? many(now) : sample(now)), [big, now]);

  return (
    <div style={{ width: "100%", maxWidth: 340, display: "grid", gap: 10 }}>
      <ChatHistory
        key={big ? "big" : "small"}
        defaultConversations={start}
        folders={big ? [] : FOLDERS}
        defaultValue={big ? "m0" : "c2"}
        defaultContext={big ? undefined : START_CONTEXT}
        onContextChange={(context, change) =>
          setNote(`${change.action === "load" ? "Loaded" : "Removed"} ${change.items.length} item${change.items.length === 1 ? "" : "s"} – the app sends ${context.length} with the next message`)
        }
        now={now}
        maxHeight={440}
        onChange={(id) => setNote(`Opened ${id}`)}
        onRename={(_, title) => setNote(`Renamed to “${title}”`)}
        onPin={(_, pinned) => setNote(pinned ? "Pinned" : "Unpinned")}
        onMove={(_, folder) => setNote(folder ? `Moved to ${FOLDERS.find((f) => f.id === folder)?.label}` : "Taken out of its folder")}
        onDelete={(_, c) => setNote(`Deleted “${c.title}” – Undo is below the list`)}
        onRestore={(_, c) => setNote(`Restored “${c.title}”`)}
        onNewChat={() => setNote("New chat")}
      />
      <div style={caption}>
        {note} ·{" "}
        <button type="button" style={textButton} onClick={() => setBig((b) => !b)}>
          {big ? "Back to the sample" : "Load 10,000 chats"}
        </button>
      </div>
    </div>
  );
}
