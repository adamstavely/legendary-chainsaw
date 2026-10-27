import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { StoryEntry, StorySeen } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* What changed for the people and accounts someone follows. Maya, the Northwind workspace and Leo have something new
   (a gradient ring); the Atlas project and Sam have been seen (gray). Open one for its brief: the new tiles first,
   marked New, then the ones seen before; Previous and Next, or ← →, move between them. Opening marks them seen, so
   the rings turn gray – Reset brings them back. Pictures are inline SVG, so nothing loads from the network. */

const svgUrl = (viewBox: string, body: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)}`;
const face = (a: string, b: string, skin: string) =>
  svgUrl(
    "0 0 64 64",
    `<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" fill="url(#a)"/><circle cx="32" cy="26" r="11" fill="${skin}"/><path d="M12 64c2-14 10-21 20-21s18 7 20 21z" fill="${skin}"/>`,
  );
const mark = (bg: string, fg: string, glyph: string) => svgUrl("0 0 64 64", `<rect width="64" height="64" fill="${bg}"/>${glyph.replace(/FG/g, fg)}`);
/** A results page, drawn as a wireframe */
const RESULTS = svgUrl(
  "0 0 320 180",
  `<rect width="320" height="180" fill="#eef2f8"/><rect x="16" y="14" width="288" height="22" rx="11" fill="#ffffff" stroke="#d5dbe6"/><circle cx="30" cy="25" r="5" fill="none" stroke="#7a8597" stroke-width="2"/><rect x="42" y="22" width="90" height="6" rx="3" fill="#c3cad6"/>` +
    [0, 1, 2]
      .map((i) => `<rect x="16" y="${50 + i * 42}" width="288" height="34" rx="8" fill="#ffffff"/><rect x="26" y="${58 + i * 42}" width="${120 - i * 18}" height="7" rx="3.5" fill="#2f6fde"/><rect x="26" y="${70 + i * 42}" width="${220 - i * 30}" height="5" rx="2.5" fill="#c3cad6"/>`)
      .join(""),
);

const ENTRIES: StoryEntry[] = [
  {
    id: "maya",
    name: "Maya Chen",
    avatar: face("#f472b6", "#8b5cf6", "#ffe1cc"),
    since: "Tue 09:41",
    summary: "Trial conversion is up a point since Maya's new setup checklist went out, and the pricing page is ready for review.",
    summaryGenerated: true,
    updates: [
      { id: "maya-conv", kind: "metric", title: "Trial-to-paid conversion", value: "8.4%", delta: 1.2, deltaUnit: " pts", context: "vs last week", trend: [6.9, 7.1, 7.0, 7.4, 7.2, 7.9, 8.4] },
      { id: "maya-pricing", kind: "status", title: "Pricing page", from: "Draft", fromTone: "neutral", to: "In review", toTone: "info", text: "Waiting on design and legal.", at: "2h" },
      {
        id: "maya-note",
        kind: "note",
        title: "Note",
        text: "The new checklist gets setup down to three steps. I'd like a second pair of eyes on the empty states before Friday.",
        author: "Maya Chen",
        at: "1h",
      },
      { id: "maya-report", kind: "link", title: "Onboarding report", text: "Funnel by step, last 14 days.", label: "Open report", href: "#onboarding-report" },
      { id: "maya-setup", kind: "metric", title: "Median setup time", value: "6m 40s", delta: -48, deltaUnit: "s", lowerIsBetter: true, context: "vs last week" },
    ],
  },
  {
    id: "northwind",
    name: "Northwind workspace",
    kind: "account",
    avatar: mark("#1f6f5c", "#e8fff6", `<path d="M18 46V18l28 28V18" fill="none" stroke="FG" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
    since: "Mon 16:20",
    summary: "Northwind moved to the Business plan and added seven members; spend rose with the new seats.",
    updates: [
      {
        id: "nw-members",
        kind: "list",
        title: "New members",
        items: [
          { label: "Priya Shah", meta: "Editor" },
          { label: "Tom Ellis", meta: "Viewer" },
          { label: "Ana Ruiz", meta: "Editor" },
          { label: "Jun Park", meta: "Admin" },
        ],
        total: 7,
        at: "Today",
      },
      { id: "nw-plan", kind: "status", title: "Plan", from: "Team", to: "Business", toTone: "success", at: "Yesterday" },
      { id: "nw-seats", kind: "metric", title: "Seats in use", value: "42 of 50", delta: 7, neutral: true, context: "since Monday", trend: [31, 33, 35, 35, 38, 42] },
      { id: "nw-spend", kind: "metric", title: "Monthly spend", value: "$1,240", delta: 14.5, deltaUnit: "%", lowerIsBetter: true, context: "vs last month" },
      { id: "nw-requests", kind: "link", title: "Access requests", text: "Three people are waiting for access.", label: "Review" },
    ],
  },
  {
    id: "leo",
    name: "Leo Park",
    avatar: face("#38bdf8", "#2563eb", "#f1c7a0"),
    since: "Yesterday",
    updates: [
      { id: "leo-latency", kind: "metric", title: "Search latency, p95", value: "182 ms", delta: -38, deltaUnit: " ms", lowerIsBetter: true, context: "vs last week", trend: [240, 236, 228, 231, 210, 196, 182] },
      { id: "leo-launch", kind: "status", title: "Search v2", from: "Beta", fromTone: "info", to: "Live", toTone: "success", at: "3h" },
      { id: "leo-shot", kind: "image", title: "New results page", src: RESULTS, alt: "The results page: a search field above three results, each with a blue title and a gray line of text", caption: "Titles first, snippets trimmed to one line." },
    ],
  },
  {
    id: "atlas",
    name: "Atlas migration",
    kind: "account",
    avatar: mark("#3b3f9f", "#eef0ff", `<path d="M32 14 16 50h32z" fill="none" stroke="FG" stroke-width="6" stroke-linejoin="round"/>`),
    since: "Today 08:15",
    updates: [
      { id: "atlas-phase", kind: "status", title: "Phase", from: "Planning", to: "Build", toTone: "warning", text: "Two weeks behind the first plan; the new date is 14 Nov." },
      { id: "atlas-done", kind: "metric", title: "Tasks done", value: "64%", delta: 12, deltaUnit: " pts", context: "this week" },
      { id: "atlas-closed", kind: "list", title: "Closed tickets", items: ["ATL-112 Map old roles", "ATL-118 Export audit log", "ATL-121 Retire v1 API keys"], total: 9 },
    ],
  },
  {
    id: "sam",
    name: "Sam Okafor",
    avatar: face("#fbbf24", "#f97316", "#8d5a3b"),
    since: "Today 07:50",
    updates: [
      { id: "sam-call", kind: "status", title: "On call", from: "Off", to: "On call", toTone: "warning", at: "Mon" },
      { id: "sam-note", kind: "note", title: "Handover", text: "Billing alerts are quiet. Page me for anything in payments until Friday.", author: "Sam Okafor", at: "Mon" },
    ],
  },
];
const START_SEEN = () => new Set(["maya-setup", "atlas-phase", "atlas-done", "atlas-closed", "sam-call", "sam-note"]);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Stories } = ui;
  const [seen, setSeen] = useState<StorySeen>(START_SEEN);
  const [note, setNote] = useState("Open one to see what changed – ← → move between them.");
  const fresh = ENTRIES.filter((e) => e.updates.some((u) => !(seen as Set<string>).has(u.id))).length;
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <Stories
        entries={ENTRIES}
        seen={seen}
        onSeenChange={(next, updates, entry) => {
          setSeen(next);
          setNote(`Marked ${updates.length} of ${entry.name}'s updates seen.`);
        }}
        onAction={(update, entry, event) => {
          event.preventDefault();
          setNote(`${update.label}: the app opens “${update.title}” for ${entry.name} here.`);
        }}
        onAdd={() => setNote("Add update – the app opens its composer here.")}
        onReply={(text, entry) => setNote(`Reply to ${entry.name}: “${text}”`)}
      />
      <div style={{ ...caption, display: "grid", gap: 2 }}>
        <span>
          {fresh === 1 ? "1 has something new." : `${fresh} have something new.`}{" "}
          <button type="button" style={textButton} onClick={() => setSeen(START_SEEN())}>
            Reset
          </button>
        </span>
        <span>{note}</span>
      </div>
    </div>
  );
}
