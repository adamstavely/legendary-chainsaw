import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CitedSegment, CitedSource } from "../../../src/elements/react";
import { caption } from "../demo-kit";

const SOURCES: CitedSource[] = [
  {
    id: "edge",
    title: "Why edge caching cut our p95 latency in half",
    url: "https://engineering.example.com/edge-caching",
    site: "Example Eng",
    date: "Sep 12, 2026",
    quote: "After moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms for visitors outside North America.",
    highlight: ["p95 latency dropped from 410 ms to 190 ms"],
  },
  {
    id: "notes",
    title: "Latency budget – Q3 review",
    url: "https://notes.example.com/latency-q3",
    site: "Latency Notes",
    date: "Oct 2, 2026",
    quote: "Most of the remaining time is spent on the database round trip: 120 ms on average for a cart page, mostly from three sequential queries.",
    highlight: ["database round trip", "three sequential queries"],
  },
  {
    id: "docs",
    title: "Stale-while-revalidate – caching guide",
    url: "https://docs.example.dev/caching/swr",
    site: "Example Docs",
    date: "Jun 4, 2026",
    quote: "With stale-while-revalidate, the cached page is served immediately while a fresh copy is fetched in the background, so users rarely wait on the origin.",
  },
];

const SEGMENTS: CitedSegment[] = [
  { text: "The biggest win so far came from the edge cache, which roughly halved p95 latency for visitors outside North America.", cite: ["edge"] },
  { text: " Most of what's left is the database: a cart page spends about 120 ms on three queries that run one after another.", cite: ["notes"] },
  { text: "Two changes would close most of the gap.", paragraph: true },
  { text: " First, run the cart queries in parallel or fold them into one.", cite: ["notes"] },
  { text: " Second, serve cached pages with stale-while-revalidate so users rarely wait on the origin at all.", cite: ["docs", "edge"] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CitedAnswer } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <CitedAnswer
        segments={SEGMENTS}
        sources={SOURCES}
        pagesRead={14}
        onOpenSource={(s) => setNote(`Would open ${s.url}`)}
        action={{ label: "Follow up", onClick: () => setNote("Follow up clicked.") }}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 16 }}>{note}</div>
    </div>
  );
}
