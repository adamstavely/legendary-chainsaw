import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { KnowledgeSource } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A support team's knowledge base. Product docs are indexing and the macros wait their turn; the pricing PDFs failed,
   release notes are stale and an old copy of the help centre duplicates the new one. Resync, Pause and Add are acted
   on by this page standing in for the app – it moves sources through queued → indexing → ready, one tick at a time,
   and stops ticking once nothing is indexing. "2,000 sources" shows the list windowed. */

const NOW = Date.parse("2026-10-24T12:00:00Z");
const H = 3_600_000;
const TICK = 700;

const START: KnowledgeSource[] = [
  { id: "help", name: "Help centre", kind: "site", location: "https://help.example.com", state: "ready", docs: 1204, chunks: 18_310, lastSync: NOW - 2 * H, schedule: "daily" },
  { id: "product", name: "Product docs", kind: "connector", location: "Docs workspace · 6 spaces", state: "indexing", progress: 0.35, docs: 860, chunks: 9_420, lastSync: NOW - 26 * H, schedule: "hourly" },
  { id: "macros", name: "Support macros", kind: "connector", location: "Helpdesk · shared macros", state: "queued", docs: 312, schedule: "daily" },
  {
    id: "pricing",
    name: "Pricing PDFs",
    kind: "file",
    location: "Uploads / pricing / 14 files",
    state: "failed",
    error: "3 of 14 files are scanned images with no text to index. Upload text versions or turn on OCR.",
    docs: 11,
    chunks: 240,
    lastSync: NOW - 5 * H,
    schedule: "manual",
  },
  {
    id: "notes",
    name: "Release notes",
    kind: "site",
    location: "https://example.com/changelog",
    state: "ready",
    docs: 148,
    chunks: 1_960,
    lastSync: NOW - 41 * 24 * H,
    schedule: "manual",
    stale: "Not synced in 41 days – 12 pages on the site changed since.",
  },
  { id: "help-old", name: "Help centre (old domain)", kind: "site", location: "https://support.example.com", state: "ready", docs: 1_188, chunks: 17_904, lastSync: NOW - 9 * 24 * H, schedule: "weekly", duplicateOf: "help" },
  { id: "policies", name: "Refund and returns policies", kind: "file", location: "Uploads / policies / 6 files", state: "paused", docs: 6, chunks: 182, lastSync: NOW - 3 * 24 * H, schedule: "weekly" },
  { id: "forum", name: "Community forum", kind: "site", location: "https://community.example.com", state: "ready", docs: 4_820, chunks: 41_200, lastSync: NOW - 6 * H, schedule: "daily" },
];

const ADDS: Omit<KnowledgeSource, "id" | "state">[] = [
  { name: "Onboarding guides", kind: "file", location: "Uploads / onboarding / 9 files", docs: 9, schedule: "manual" },
  { name: "Status page", kind: "site", location: "https://status.example.com", docs: 40, schedule: "hourly" },
  { name: "Sales playbooks", kind: "connector", location: "Docs workspace · Sales", docs: 75, schedule: "daily" },
];

const KINDS = ["file", "site", "connector"];
const many = (): KnowledgeSource[] =>
  Array.from({ length: 2000 }, (_, i) => ({
    id: `bulk-${i}`,
    name: `Customer workspace ${String(i + 1).padStart(4, "0")}`,
    kind: KINDS[i % 3],
    state: i % 97 === 5 ? "failed" : i % 41 === 3 ? "paused" : "ready",
    error: "The connector's token expired. Reconnect it to sync again.",
    docs: 20 + ((i * 37) % 400),
    chunks: 300 + ((i * 611) % 9000),
    lastSync: NOW - ((i * 7) % 72) * H,
    schedule: ["daily", "weekly", "hourly"][i % 3],
    stale: i % 53 === 7,
  }));

/** One step of the app's indexer: the indexing source moves on; when it's done, the next queued one starts */
function step(list: KnowledgeSource[]): KnowledgeSource[] {
  const at = list.findIndex((s) => s.state === "indexing");
  if (at >= 0) {
    const s = list[at];
    const progress = Math.min(1, (s.progress ?? 0) + 0.13);
    const done = progress >= 1;
    const docs = s.docs ?? 10;
    const next: KnowledgeSource = done
      ? { ...s, state: "ready", progress: undefined, chunks: s.chunks ?? docs * 14, lastSync: NOW, stale: undefined, error: undefined }
      : { ...s, progress };
    return list.map((x, i) => (i === at ? next : x));
  }
  const q = list.findIndex((s) => s.state === "queued");
  return q < 0 ? list : list.map((x, i) => (i === q ? { ...x, state: "indexing", progress: 0.04 } : x));
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { KnowledgeSourceManager } = ui;
  const [sources, setSources] = useState(START);
  const [note, setNote] = useState("Pick a source to see its sync, warnings and actions.");
  const [added, setAdded] = useState(0);
  const busy = sources.some((s) => s.state === "indexing" || s.state === "queued");

  // One timeout at a time, and none once nothing is indexing
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setSources(step), TICK);
    return () => clearTimeout(t);
  }, [sources, busy]);

  const bulk = sources.length > 1000;
  return (
    <div style={{ width: "100%", maxWidth: 880, display: "grid", gap: 8 }}>
      <KnowledgeSourceManager
        sources={sources}
        onSourcesChange={(next, change) => {
          setSources(next);
          setNote(change.type === "remove" ? `Removed ${change.source.name} – its chunks leave the index.` : `${change.source.name} now syncs ${change.source.schedule}.`);
        }}
        now={NOW}
        onAdd={() => {
          const add = ADDS[added % ADDS.length];
          setAdded((n) => n + 1);
          setSources((list) => [...list, { ...add, id: `add-${added}`, state: "queued" }]);
          setNote(`Added ${add.name} – it waits in the queue for an indexer.`);
        }}
        onResync={(s) => {
          setSources((list) => list.map((x) => (x.id === s.id ? { ...x, state: "queued", error: undefined } : x)));
          setNote(`${s.name} is queued to sync.`);
        }}
        onPauseChange={(s, paused) => {
          setSources((list) => list.map((x) => (x.id === s.id ? { ...x, state: paused ? "paused" : "queued" } : x)));
          setNote(paused ? `${s.name} is paused – it keeps its chunks.` : `${s.name} resumed and is queued to sync.`);
        }}
        onReviewChunks={(s) => setNote(`Opening chunk review for ${s.name} – ${(s.chunks ?? 0).toLocaleString("en-US")} chunks.`)}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span>{note}</span>
        <span style={{ display: "flex", gap: 12 }}>
          <button type="button" style={textButton} onClick={() => setSources(bulk ? START : many())}>
            {bulk ? "Back to 8 sources" : "2,000 sources"}
          </button>
          <button
            type="button"
            style={textButton}
            onClick={() => {
              setSources(START);
              setNote("Pick a source to see its sync, warnings and actions.");
            }}
          >
            Reset
          </button>
        </span>
      </div>
    </div>
  );
}
